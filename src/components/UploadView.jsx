import React, { useState } from 'react';
import { storage } from '../firebase';
import { ref, uploadBytes } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const UploadView = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a PDF file first");
      return;
    }
    
    setUploading(true);
    setGeneratedLink(''); // Reset link on new upload
    setIsCopied(false); // Reset copied state on new upload
    const fileId = uuidv4();
    const storageRef = ref(storage, `pdfs/${fileId}.pdf`);

    try {
      await uploadBytes(storageRef, file);
      
      // Use window.location.origin to create a robust link for any environment
      const link = `${window.location.origin}/sign/${fileId}`;
      setGeneratedLink(link);
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
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
          onChange={(e) => {
            setFile(e.target.files[0]);
            setGeneratedLink(''); // Clear link when a new file is selected
          }} 
          className="file-input"
        />
        <button 
          onClick={handleUpload} 
          disabled={uploading || !file}
          className="btn btn-primary"
        >
          {uploading ? "Uploading..." : "Upload & Generate Link"}
        </button>
      </div>

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