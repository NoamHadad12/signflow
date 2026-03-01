
import { PDFDocument } from 'pdf-lib';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, getBytes, uploadBytes } from 'firebase/storage';

// Pull the configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase outside the handler for reuse
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { documentId, signatureData } = req.body;

  if (!documentId || !signatureData) {
    return res.status(400).json({ error: 'Missing documentId or signatureData' });
  }

  try {
    // 1. Download original PDF bytes from Firebase Storage
    const fileRef = ref(storage, `pdfs/${documentId}.pdf`);
    const existingPdfBytes = await getBytes(fileRef);

    // 2. Load the PDF and embed the signature image
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const signatureImage = await pdfDoc.embedPng(signatureData);

    // 3. Get the last page to place the signature
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();

    // 4. Draw the signature image onto the PDF
    // TODO: Implement text-search logic to find a placeholder like "Signature" or "חתום כאן"
    // For now, using fixed coordinates at the bottom-right.
    lastPage.drawImage(signatureImage, {
      x: width - 170, // Position from left
      y: 80,          // Position from bottom
      width: 150,
      height: 75,
    });

    // 5. Serialize the modified PDF to bytes
    const pdfBytes = await pdfDoc.save();

    // 6. Upload the signed PDF back to Firebase Storage
    const signedFileName = `signed_${documentId}.pdf`;
    const signedFileRef = ref(storage, `pdfs/${signedFileName}`);
    await uploadBytes(signedFileRef, pdfBytes, { contentType: 'application/pdf' });

    res.status(200).json({ message: 'Document signed successfully!', fileName: signedFileName });
  } catch (error) {
    console.error('Error signing document:', error);
    res.status(500).json({ error: 'Failed to sign document.', details: error.message });
  }
}
