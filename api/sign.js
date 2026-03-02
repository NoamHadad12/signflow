import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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
    
    // Choose specific page based on uploaded configuration (convert 1-based index to 0-based index)
    const targetPageNum = signatureCoords ? signatureCoords.page - 1 : pages.length - 1;
    const targetPage = pages[targetPageNum];
    const { width, height } = targetPage.getSize();

    // 3. Define signature area dimensions and draw elements
    const sigWidth = 150; 
    const sigHeight = 50;
    const boxPadding = 5;

    // Default target bottom-right fallback
    let targetX = width - sigWidth - 15; 
    let targetY = 30;               

    // Map relative click percentage coordinates to native point scales
    if (signatureCoords) {
      // Scale percentages by real document PDF widths
      const centerX = signatureCoords.nx * width;
      // pdf-lib's Y-Axis runs bottom-to-top naturally (reverse of standard CSS/DOM)
      const centerY = (1 - signatureCoords.ny) * height; 

      // Offset the coordinate by half width/height because the uploader clicked exactly at the box center
      targetX = centerX - (sigWidth / 2);
      targetY = centerY - (sigHeight / 2);
    }
    
    const sigY = targetY;

    // Utilize the standard font for the signature label
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Draw the "Signature" label with a clean, bold look
    targetPage.drawText('Signature', {
      x: targetX,
      y: sigY + sigHeight + boxPadding, // Position text above the signature area
      font: font, 
      size: 12,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Draw the signature image, making it appear bolder
    targetPage.drawImage(signatureImage, {
      x: targetX,
      y: sigY,
      width: sigWidth,
      height: sigHeight,
      opacity: 0.95, 
    });

    // Draw a thicker line below the signature for a professional finish
    targetPage.drawLine({
        start: { x: targetX, y: sigY - boxPadding + 2 },
        end: { x: targetX + sigWidth, y: sigY - boxPadding + 2 },
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