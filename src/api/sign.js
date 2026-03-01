import { PDFDocument } from 'pdf-lib';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, getBytes, uploadBytes } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { documentId, signatureData } = req.body;

  try {
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);
    const fileRef = ref(storage, `pdfs/${documentId}.pdf`);

    // 1. Download original PDF bytes
    const existingPdfBytes = await getBytes(fileRef);

    // 2. Load PDF and Clean Base64 Signature
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // Remove the "data:image/png;base64," prefix
    const base64Data = signatureData.split(',')[1];
    const signatureImage = await pdfDoc.embedPng(Buffer.from(base64Data, 'base64'));

    // 3. Setup placement logic
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();

    /** * TODO: For advanced text search (finding "Signature"), 
     * we would use a library like 'pdf-parse' to find coordinates.
     * For now, we place it in a common 'Signature' area at the bottom.
     */
    const sigWidth = 150;
    const sigHeight = 60;

    lastPage.drawImage(signatureImage, {
      x: width - sigWidth - 50, // 50px margin from right
      y: 100,                   // 100px from bottom (usually where sign lines are)
      width: sigWidth,
      height: sigHeight,
    });

    // 4. Save and Upload
    const pdfBytes = await pdfDoc.save();
    const signedFileRef = ref(storage, `pdfs/signed_${documentId}.pdf`);
    await uploadBytes(signedFileRef, pdfBytes);

    res.status(200).json({ 
      message: 'Success', 
      fileName: `signed_${documentId}.pdf`,
      downloadUrl: `pdfs/signed_${documentId}.pdf` 
    });

  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ error: error.message });
  }
}