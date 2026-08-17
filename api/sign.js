import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { cert, getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };
export const maxDuration = 60;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DOCUMENT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_FIELD_LENGTH = 500;

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const decoded = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const account = JSON.parse(decoded);
    if (account.private_key) account.private_key = account.private_key.replace(/\\n/g, '\n');
    return account;
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT must be valid JSON or base64-encoded JSON.');
  }
}

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  const account = loadServiceAccount();
  return initializeApp({
    credential: account ? cert(account) : applicationDefault(),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  });
}

async function loadHeeboFont() {
  try {
    return readFileSync(join(__dirname, 'fonts', 'Heebo-Regular.ttf'));
  } catch {
    // The bundled font is expected; URLs are a deployment fallback.
  }
  const urls = [
    'https://raw.githubusercontent.com/google/fonts/main/ofl/heebo/Heebo%5Bwght%5D.ttf',
    'https://fonts.gstatic.com/s/heebo/v26/NGSpv5_NC0k9P_v6ZUCbLRAHxK1EiSysdUmr.ttf',
  ];
  for (const url of urls) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (response.ok) return Buffer.from(await response.arrayBuffer());
    } catch {
      // Try next source.
    }
  }
  throw new Error('Could not load the Hebrew PDF font.');
}

const containsHebrew = (value) => /[\u0590-\u05FF]/.test(value);
const normalizePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.startsWith('0') ? `972${digits.slice(1)}` : digits;
};

async function requirePhoneVerification(req, signerPhone) {
  if (!signerPhone) return;
  const authHeader = String(req.headers?.authorization || '');
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    const error = new Error('Phone verification is required.');
    error.statusCode = 401;
    throw error;
  }
  const decoded = await getAuth(getAdminApp()).verifyIdToken(token);
  if (!decoded.phone_number || normalizePhone(decoded.phone_number) !== normalizePhone(signerPhone)) {
    const error = new Error('The verified phone number does not match this document.');
    error.statusCode = 403;
    throw error;
  }
}

function sanitizeFormValues(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, String(value ?? '').slice(0, MAX_FIELD_LENGTH)]));
}

async function loadTrustedMarkers(documentRef, data) {
  const markerSnapshot = await documentRef.collection('markers').orderBy('index').get();
  if (!markerSnapshot.empty) return markerSnapshot.docs.map((entry) => entry.data());
  if (Array.isArray(data.fields)) return data.fields;
  if (Array.isArray(data.markers)) return data.markers;
  return data.signatureCoords ? [data.signatureCoords] : [];
}

async function reserveDocument(db, documentId) {
  const documentRef = db.collection('documents').doc(documentId);
  let data;
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(documentRef);
    if (!snapshot.exists) {
      const error = new Error('Document not found.');
      error.statusCode = 404;
      throw error;
    }
    data = snapshot.data();
    if (String(data.status || '').toLowerCase() !== 'pending') {
      const error = new Error('Document is no longer available for signing.');
      error.statusCode = 409;
      throw error;
    }
    if (data.expiresAt && Date.now() >= Number(data.expiresAt)) {
      const error = new Error('Document has expired.');
      error.statusCode = 410;
      throw error;
    }
    transaction.update(documentRef, { status: 'signing', signingStartedAt: new Date().toISOString() });
  });
  return { documentRef, data };
}

async function releaseReservation(documentRef) {
  try {
    const snapshot = await documentRef.get();
    if (snapshot.exists && snapshot.data().status === 'signing') {
      await documentRef.update({ status: 'pending', signingStartedAt: FieldValue.delete() });
    }
  } catch (error) {
    console.error('[sign] Failed to release signing reservation:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const { documentId, signatureData } = req.body || {};
  const formValues = sanitizeFormValues(req.body?.formValues);
  if (!DOCUMENT_ID_RE.test(String(documentId || ''))) return res.status(400).json({ error: 'A valid documentId is required.' });
  if (signatureData && (!String(signatureData).startsWith('data:image/') || String(signatureData).length > 5_000_000)) {
    return res.status(400).json({ error: 'Invalid or oversized signature image.' });
  }

  let documentRef;
  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    // Authenticate protected signers before acquiring the signing reservation,
    // so an unauthenticated caller cannot repeatedly flip the document state.
    const preflightRef = db.collection('documents').doc(documentId);
    const preflightSnapshot = await preflightRef.get();
    if (!preflightSnapshot.exists) {
      const error = new Error('Document not found.');
      error.statusCode = 404;
      throw error;
    }
    await requirePhoneVerification(req, String(preflightSnapshot.data().signerPhone || '').trim());

    const reservation = await reserveDocument(db, documentId);
    documentRef = reservation.documentRef;
    const documentData = reservation.data;

    const markers = await loadTrustedMarkers(documentRef, documentData);
    if (markers.length === 0) throw new Error('Document has no configured fields.');
    const requiresSignature = markers.some((marker) => !marker.type || marker.type === 'signature');
    const missingTextField = markers.some((marker, index) => (
      marker.type && marker.type !== 'signature' && !String(formValues[index] || '').trim()
    ));
    if (requiresSignature && !signatureData) {
      const error = new Error('A signature is required.');
      error.statusCode = 400;
      throw error;
    }
    if (missingTextField) {
      const error = new Error('All required fields must be completed.');
      error.statusCode = 400;
      throw error;
    }
    const bucket = getStorage(app).bucket();
    const originalPath = documentData.fileRef || `pdfs/${documentId}.pdf`;
    const [existingPdfBytes] = await bucket.file(originalPath).download();

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);
    const hebrewFont = await pdfDoc.embedFont(await loadHeeboFont());
    let signatureImage = null;
    if (signatureData) {
      const encoded = String(signatureData).split(',')[1];
      if (!encoded) throw new Error('Malformed signature image.');
      const buffer = Buffer.from(encoded, 'base64');
      signatureImage = /^data:image\/jpe?g/i.test(signatureData) ? await pdfDoc.embedJpg(buffer) : await pdfDoc.embedPng(buffer);
    }

    const pages = pdfDoc.getPages();
    for (const [index, marker] of markers.entries()) {
      const targetPage = pages[(marker.page ?? 1) - 1];
      if (!targetPage) continue;
      const { width, height } = targetPage.getSize();
      const boxWidth = Math.max(1, Number(marker.nw ?? 0.3) * width);
      const boxHeight = Math.max(1, Number(marker.nh ?? 0.08) * height);
      const x = Number(marker.nx ?? 0) * width;
      const y = (1 - Number(marker.ny ?? 0) - Number(marker.nh ?? 0.08)) * height;
      if (!marker.type || marker.type === 'signature') {
        if (signatureImage) targetPage.drawImage(signatureImage, { x, y, width: boxWidth, height: boxHeight, opacity: 0.95 });
        continue;
      }
      const value = String(formValues[index] || '');
      if (!value) continue;
      let fontSize = Math.max(8, Math.min(boxHeight * 0.55, 20));
      let textWidth = hebrewFont.widthOfTextAtSize(value, fontSize);
      const maxWidth = Math.max(10, boxWidth - 8);
      if (textWidth > maxWidth) {
        fontSize = Math.max(4, fontSize * (maxWidth / textWidth));
        textWidth = hebrewFont.widthOfTextAtSize(value, fontSize);
      }
      targetPage.drawText(value, {
        x: containsHebrew(value) ? x + boxWidth - textWidth - 4 : x + 4,
        y: y + (boxHeight - fontSize) / 2,
        size: fontSize,
        font: hebrewFont,
        color: rgb(0.05, 0.05, 0.05),
      });
    }

    const signedPath = `pdfs/signed_${documentId}.pdf`;
    const downloadToken = randomUUID();
    await bucket.file(signedPath).save(Buffer.from(await pdfDoc.save()), {
      resumable: false,
      contentType: 'application/pdf',
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          ownerUid: documentData.clientId,
          documentId,
        },
      },
    });
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(signedPath)}?alt=media&token=${downloadToken}`;
    const signedAt = new Date().toISOString();
    await documentRef.update({
      status: 'signed',
      signedAt,
      signedPdfUrl: downloadUrl,
      signedFileRef: signedPath,
      signingStartedAt: FieldValue.delete(),
    });
    return res.status(200).json({ message: 'Success', fileName: `signed_${documentId}.pdf`, downloadUrl, signedAt });
  } catch (error) {
    if (documentRef) await releaseReservation(documentRef);
    console.error('[sign] Error:', error);
    return res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
  }
}
