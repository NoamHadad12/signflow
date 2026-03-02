import React, { useState, useRef } from 'react';
import { storage, db } from '../firebase';
import { ref, uploadBytes } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set the worker source from a reliable CDN to ensure compatibility
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const UploadView = () => {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [signatureCoords, setSignatureCoords] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Drag-to-draw state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [drawingBox, setDrawingBox] = useState(null);
  const currentPageRef = useRef(null);
  const pageRectRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setGeneratedLink(''); // Reset link on new upload
    setIsCopied(false); // Reset copied state on new upload
    setSignatureCoords(null);
    
    if (selectedFile) {
      setFileUrl(URL.createObjectURL(selectedFile));
    } else {
      setFileUrl(null);
    }
  };

  const handleDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // Record start point and page rect when the user begins dragging
  const handleMouseDown = (e, pageNumber) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    pageRectRef.current = rect;
    currentPageRef.current = pageNumber;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    setIsDrawing(true);
    setDrawStart({ nx, ny });
    setDrawingBox(null);
    setSignatureCoords(null); // Clear any previous selection
  };

  // Update the live preview box while the user drags
  const handleMouseMove = (e, pageNumber) => {
    if (!isDrawing || pageNumber !== currentPageRef.current || !pageRectRef.current) return;
    const rect = pageRectRef.current;
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    // Support dragging in any direction by normalizing start/end
    setDrawingBox({
      nx: Math.min(drawStart.nx, nx),
      ny: Math.min(drawStart.ny, ny),
      nw: Math.abs(nx - drawStart.nx),
      nh: Math.abs(ny - drawStart.ny),
    });
  };

  // Finalize the bounding box when the user releases the mouse
  const handleMouseUp = (e, pageNumber) => {
    if (!isDrawing) return;
    const rect = pageRectRef.current;
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const boxNx = Math.min(drawStart.nx, nx);
    const boxNy = Math.min(drawStart.ny, ny);
    const boxNw = Math.abs(nx - drawStart.nx);
    const boxNh = Math.abs(ny - drawStart.ny);
    setIsDrawing(false);
    setDrawingBox(null);
    // Only save if the box is large enough to be intentional (> 1% in both dimensions)
    if (boxNw > 0.01 && boxNh > 0.01) {
      setSignatureCoords({ page: pageNumber, nx: boxNx, ny: boxNy, nw: boxNw, nh: boxNh });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a PDF file first");
      return;
    }
    if (!signatureCoords) {
      alert("Please drag on the document to draw the signature area.");
      return;
    }
    
    setUploading(true);

    try {
      setGeneratedLink(''); // Reset link on new upload
      setIsCopied(false); // Reset copied state on new upload
      
      const fileId = uuidv4();
      
      // 1. Upload the PDF to Firebase Storage
      const storageRef = ref(storage, `pdfs/${fileId}.pdf`);
      await uploadBytes(storageRef, file);
      
      // 2. Save the metadata to Firestore
      const docRef = doc(db, "documents", fileId);
      await setDoc(docRef, {
        fileRef: `pdfs/${fileId}.pdf`,
        signatureCoords: signatureCoords,
        createdAt: new Date().toISOString()
      });

      // 3. Generate and display the Link
      const link = `${window.location.origin}/sign/${fileId}`;
      setGeneratedLink(link);
    } catch (error) {
      // Log EXACT Firebase error clearly into the console
      console.error("=== FIREBASE UPLOAD ERROR ===");
      console.error(error);
      console.error("Error Code:", error?.code);
      console.error("Error Message:", error?.message);
      alert(`Upload failed: ${error?.message || "Unknown error occurred. Check browser console."}`);
    } finally {
      // Explicitly clean up loading state unconditionally so the UI never hangs
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }, (err) => {
      console.error('Failed to copy link: ', err);
    });
  };

  const shareOnWhatsApp = () => {
    const message = `You've been sent a document to sign: ${generatedLink}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="upload-view">
      <h1>SignFlow</h1>
      <p className="subtitle">Upload a PDF document to generate a shareable signing link.</p>
      
      <div className="drop-zone">
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileChange} 
          className="file-input"
        />
      </div>

      {/* Render PDF Preview to select signature location */}
      {fileUrl && !generatedLink && (
        <div style={{ marginTop: '20px' }}>
          <p style={{ fontWeight: 600, color: 'var(--primary-color)', marginBottom: '15px' }}>
            Action Required: Click and drag on the document to draw the signature area.
          </p>
          <div className="pdf-document-container" style={{ textAlign: 'center' }}>
            <Document 
              file={fileUrl} 
              onLoadSuccess={handleDocumentLoadSuccess}
              loading={<div>Loading PDF preview...</div>}
            >
              {Array.from(new Array(numPages), (el, index) => {
                const pageNumber = index + 1;
                return (
                  <div 
                    key={`page_${pageNumber}`} 
                    className="pdf-page-wrapper"
                    style={{ cursor: 'crosshair', userSelect: 'none' }}
                    onMouseDown={(e) => handleMouseDown(e, pageNumber)}
                    onMouseMove={(e) => handleMouseMove(e, pageNumber)}
                    onMouseUp={(e) => handleMouseUp(e, pageNumber)}
                  >
                    <Page 
                      pageNumber={pageNumber} 
                      width={Math.min(window.innerWidth - 80, 550)} 
                      renderTextLayer={false} 
                      renderAnnotationLayer={false} 
                    />
                    {/* Live preview rectangle while the user is dragging */}
                    {isDrawing && currentPageRef.current === pageNumber && drawingBox && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${drawingBox.nx * 100}%`,
                          top: `${drawingBox.ny * 100}%`,
                          width: `${drawingBox.nw * 100}%`,
                          height: `${drawingBox.nh * 100}%`,
                          border: '2px dashed #2563eb',
                          backgroundColor: 'rgba(37, 99, 235, 0.1)',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                    {/* Confirmed bounding box rendered after the user releases the mouse */}
                    {signatureCoords && signatureCoords.page === pageNumber && (
                      <div 
                        className="signature-marker" 
                        style={{
                          left: `${signatureCoords.nx * 100}%`,
                          top: `${signatureCoords.ny * 100}%`,
                          width: `${signatureCoords.nw * 100}%`,
                          height: `${signatureCoords.nh * 100}%`,
                        }}
                      >
                        Sign Here
                      </div>
                    )}
                  </div>
                );
              })}
            </Document>
          </div>
          
          <button 
            onClick={handleUpload} 
            disabled={uploading || !signatureCoords}
            className="btn btn-primary"
            style={{ marginTop: '20px', width: '100%' }}
          >
            {uploading ? "Uploading Data..." : "Upload & Generate Link"}
          </button>
        </div>
      )}

      {generatedLink && (
        <div className="generated-link-container">
          <p>Your link is ready:</p>
          <div className="link-input-group">
            <input 
              type="text" 
              value={generatedLink} 
              readOnly 
            />
            <button 
              onClick={copyToClipboard} 
              className="btn btn-success"
            >
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={shareOnWhatsApp}
              className="btn btn-primary"
              style={{ backgroundColor: '#25D366' }} // WhatsApp green color
            >
              WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadView;