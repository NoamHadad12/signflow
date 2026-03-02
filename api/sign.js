import { PDFDocument, rgb } from 'pdf-lib';
import { initializeApp, getApps } from 'firebase/app';
import { getStorage, ref, getBytes, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { documentId, signatureData, signatureCoords } = req.body;

  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const storage = getStorage(app);
    const fileRef = ref(storage, `pdfs/${documentId}.pdf`);

    // 1. Download original PDF
    const existingPdfBytes = await getBytes(fileRef);

    // 2. Load PDF for modifying (pdf-lib)
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const base64Data = signatureData.split(',')[1];
    const signatureImage = await pdfDoc.embedPng(Buffer.from(base64Data, 'base64'));

    const pages = pdfDoc.getPages();
    
    // Choose specific page based on uploaded configuration (convert 1-based index to 0-based)
    const targetPageNum = signatureCoords ? signatureCoords.page - 1 : pages.length - 1;
    const targetPage = pages[targetPageNum];
    const { width, height } = targetPage.getSize();

    // Scale the signature box using the stored normalized bounding box (nw, nh)
    // Fall back to sensible defaults for documents created before the bounding box upgrade
    const sigWidth = (signatureCoords?.nw ?? 0.3) * width;
    const sigHeight = (signatureCoords?.nh ?? 0.08) * height;

    // Default to bottom-right corner if no coords are stored
    let targetX = width - sigWidth - 15;
    let targetY = 30;

    if (signatureCoords) {
      // Map normalized top-left (nx, ny) to pdf-lib coordinates
      // pdf-lib Y-axis runs bottom-to-top, so we invert and subtract the box height
      targetX = signatureCoords.nx * width;
      targetY = (1 - signatureCoords.ny - (signatureCoords.nh ?? 0.08)) * height;
    }

    // Draw the signature image scaled exactly to the bounding box the admin defined
    targetPage.drawImage(signatureImage, {
      x: targetX,
      y: targetY,
      width: sigWidth,
      height: sigHeight,
      opacity: 0.95,
    });

    // Draw a thin underline beneath the signature for a professional finish
    targetPage.drawLine({
      start: { x: targetX, y: targetY - 3 },
      end: { x: targetX + sigWidth, y: targetY - 3 },
      thickness: 1.5,
      color: rgb(0.1, 0.1, 0.1),
    });

    // 4. Save and Upload
    const pdfBytes = await pdfDoc.save();
    const signedFileRef = ref(storage, `pdfs/signed_${documentId}.pdf`);
    
    const metadata = { contentType: 'application/pdf' };
    await uploadBytes(signedFileRef, pdfBytes, metadata);

    // Generate a public download URL with a token
    const downloadUrl = await getDownloadURL(signedFileRef);

    res.status(200).json({ 
      message: 'Success', 
      fileName: `signed_${documentId}.pdf`,
      downloadUrl: downloadUrl 
    });

  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ error: error.message });
  }
}