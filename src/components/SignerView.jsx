import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { Document, Page, pdfjs } from 'react-pdf';

import SignaturePad from 'react-signature-canvas';
const SignatureCanvas = SignaturePad.default || SignaturePad;

// --- IMPORTANT: VITE-FRIENDLY WORKER CONFIGURATION ---
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const SignerView = () => {
  const { documentId } = useParams();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize ref with null for better practice with DOM elements/components
  const sigCanvas = useRef(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const fileRef = ref(storage, `pdfs/${documentId}.pdf`);
        const url = await getDownloadURL(fileRef);
        setPdfUrl(url);
      } catch (error) {
        console.error("Error fetching PDF from storage:", error);
      }
    };
    fetchDocument();
  }, [documentId]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // Updated handleFinish with the Vite fix
  const handleFinish = async () => {
    if (!sigCanvas.current) {
      alert("The signature tool is not ready.");
      return;
    }

    // Check if it's empty
    if (sigCanvas.current.isEmpty()) {
      alert("Please provide a signature first.");
      return;
    }

    setIsSubmitting(true);

    try {
      // THE FIX: Use getCanvas() instead of getTrimmedCanvas()
      // This bypasses the Vite bug completely and grabs the raw HTML canvas.
      const signatureData = sigCanvas.current.getCanvas().toDataURL('image/png');
      console.log("Captured native canvas data successfully!");

      const response = await fetch('/api/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, signatureData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sign the document.');
      }

      alert(`Success! Signed document is saved as ${result.fileName}`);
      console.log("Backend response:", result);
      
    } catch (error) {
      console.error("Error during the signing process:", error);
      alert(`An error occurred: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h1>Sign Document</h1>
      
      {pdfUrl ? (
        <div style={{ border: '1px solid #ccc', marginBottom: '20px', maxWidth: '100%', overflow: 'auto' }}>
          <Document 
            file={pdfUrl} 
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div>Loading PDF...</div>}
            error={<div>Failed to load PDF. Check CORS settings in Firebase.</div>}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page 
                key={`page_${index + 1}`} 
                pageNumber={index + 1} 
                width={Math.min(window.innerWidth - 40, 600)} 
                renderTextLayer={false} 
                renderAnnotationLayer={false} 
              />
            ))}
          </Document>
        </div>
      ) : (
        <p>Loading document from the cloud...</p>
      )}

      <div style={{ border: '2px dashed #000', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <p style={{ textAlign: 'center', margin: '5px' }}>Sign here:</p>
        <SignatureCanvas 
          ref={sigCanvas}
          penColor='black'
          canvasProps={{ width: 500, height: 200, className: 'sigCanvas' }} 
        />
      </div>

      <button 
        onClick={handleFinish}
        disabled={isSubmitting}
        style={{ 
          marginTop: '20px', 
          padding: '15px 30px', 
          backgroundColor: isSubmitting ? '#ccc' : '#28a745', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: isSubmitting ? 'not-allowed' : 'pointer' 
        }}
      >
        {isSubmitting ? 'Processing...' : 'Complete & Sign'}
      </button>
    </div>
  );
};

export default SignerView;