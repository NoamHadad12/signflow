const DOCUMENT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let adminModulesPromise;

function loadAdminModules() {
  if (!adminModulesPromise) {
    adminModulesPromise = Promise.all([
      import('firebase-admin/app'),
      import('firebase-admin/firestore'),
      import('firebase-admin/auth'),
      import('firebase-admin/storage'),
    ]).then(([appModule, firestoreModule, authModule, storageModule]) => ({
      ...appModule,
      ...firestoreModule,
      ...authModule,
      ...storageModule,
    }));
  }
  return adminModulesPromise;
}

async function getAdminApp() {
  const { getApps, initializeApp, applicationDefault, cert } = await loadAdminModules();
  if (getApps().length > 0) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  let credential = applicationDefault();
  if (raw) {
    const decoded = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const account = JSON.parse(decoded);
    if (account.private_key) account.private_key = account.private_key.replace(/\\n/g, '\n');
    credential = cert(account);
  }
  return initializeApp({
    credential,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  });
}

const normalizePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.startsWith('0') ? `972${digits.slice(1)}` : digits;
};

async function verifyPhoneToken(req, expectedPhone) {
  if (!expectedPhone) return;
  const header = String(req.headers?.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    const error = new Error('Phone verification is required.');
    error.statusCode = 401;
    throw error;
  }
  const { getAuth } = await loadAdminModules();
  const decoded = await getAuth(await getAdminApp()).verifyIdToken(token);
  if (!decoded.phone_number || normalizePhone(decoded.phone_number) !== normalizePhone(expectedPhone)) {
    const error = new Error('The verified phone number does not match this document.');
    error.statusCode = 403;
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  const documentId = String(req.query?.documentId || '');
  if (!DOCUMENT_ID_RE.test(documentId)) return res.status(400).json({ error: 'A valid documentId is required.' });

  try {
    const { getFirestore, getStorage } = await loadAdminModules();
    const app = await getAdminApp();
    const snapshot = await getFirestore(app).collection('documents').doc(documentId).get();
    if (!snapshot.exists) return res.status(404).json({ error: 'Document not found.' });
    const data = snapshot.data();
    if (String(data.status || '').toLowerCase() !== 'pending') return res.status(409).json({ error: 'Document is no longer available.' });
    if (data.expiresAt && Date.now() >= Number(data.expiresAt)) return res.status(410).json({ error: 'Document has expired.' });
    await verifyPhoneToken(req, String(data.signerPhone || '').trim());

    const [pdfBytes] = await getStorage(app).bucket().file(data.fileRef || `pdfs/${documentId}.pdf`).download();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).end(pdfBytes);
  } catch (error) {
    console.error('[document] Error:', error);
    return res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
  }
}
