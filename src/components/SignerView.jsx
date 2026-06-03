import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { storage, db, auth } from '../firebase';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { Document, Page, pdfjs } from 'react-pdf';
import SignaturePad from 'react-signature-canvas';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { getMarkerColor, getMarkerLabel, useWindowWidth } from '../utils/pdfHelpers';
import { fetchDocument } from '../services/dbService';
import { useNotification } from '../context/NotificationContext';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
const SignatureCanvas = SignaturePad.default || SignaturePad;

const getInputKey = (marker, idx) => {
  if (!marker.type || marker.type === 'signature') return null;
  if (marker.type === 'date') return '__date__';
  return `__field_${idx}__`;
};

const PEN_SIZE_OPTIONS = [
  { key: 'fine',   label: 'Fine',   lineWidth: 1.5, minWidth: 0.7, maxWidth: 1.6 },
  { key: 'medium', label: 'Medium', lineWidth: 2.4, minWidth: 1.3, maxWidth: 2.6 },
  { key: 'bold',   label: 'Bold',   lineWidth: 3.8, minWidth: 2.2, maxWidth: 4.2 },
];

const storageCompat = {
  refFromURL: (url) => ({ delete: () => deleteObject(ref(storage, url)) }),
};

const SF_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .sv-root { min-height: 100vh; background: #f7f6f3; font-family: 'DM Sans', sans-serif; }

  .sv-topbar {
    background: #ffffff; border-bottom: 1px solid #ebebea;
    height: 58px; display: flex; align-items: center; padding: 0 2rem;
    position: sticky; top: 0; z-index: 50; gap: 0.6rem;
  }
  .sv-logo-mark {
    width: 30px; height: 30px; border-radius: 8px; background: #1a1a1e;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .sv-logo-mark img { width: 18px; height: 18px; object-fit: contain; filter: brightness(0) invert(1); }
  .sv-logo-text {
    font-family: 'DM Serif Display', serif; font-size: 1.2rem; color: #1a1a1e;
    text-decoration: none; display: flex; align-items: baseline;
  }
  .sv-logo-text em { font-style: italic; color: #9e7d52; }
  @media (max-width: 380px) { .sv-logo-text { display: none; } }

  /* PDF Area */
  .sv-pdf-area { padding: 1.5rem 1rem 10rem; display: flex; flex-direction: column; align-items: center; }
  .sv-page-label {
    font-size: 0.72rem; font-weight: 500; letter-spacing: 0.08em;
    text-transform: uppercase; color: #9090a0;
    margin-bottom: 0.75rem; margin-top: 1rem; align-self: flex-start;
  }
  .sv-pdf-page-wrap {
    position: relative; margin-bottom: 1.5rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.1); border-radius: 6px; overflow: hidden;
  }
  .sv-marker {
    position: absolute; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; font-weight: 600; transition: background 0.15s; cursor: default;
  }

  /* Footer */
  .sv-footer {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
    background: #ffffff; border-top: 1px solid #ebebea; padding: 0.9rem 1rem;
  }
  .sv-footer-inner { max-width: 760px; margin: 0 auto; }
  .sv-fields-row {
    display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.5rem;
    scrollbar-width: thin; scrollbar-color: #e5e5e0 transparent;
  }
  .sv-fields-row::-webkit-scrollbar { height: 4px; }
  .sv-fields-row::-webkit-scrollbar-thumb { background: #e5e5e0; border-radius: 10px; }

  .sv-field-card {
    flex-shrink: 0; min-width: 220px; max-width: 280px;
    background: #fafaf8; border: 1px solid #ebebea; border-radius: 10px; overflow: hidden;
  }
  .sv-field-card-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.5rem 0.75rem 0.4rem; border-bottom: 1px solid #ebebea;
  }
  .sv-field-label { font-size: 0.7rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; }
  .sv-field-body { padding: 0.5rem 0.75rem; }
  .sv-field-input {
    width: 100%; border: none; background: transparent;
    font-size: 0.9rem; font-family: 'DM Sans', sans-serif;
    color: #1a1a1e; outline: none; padding: 0.25rem 0;
  }
  .sv-field-input::placeholder { color: #c0c0b8; }

  .sv-sig-card {
    flex-shrink: 0; min-width: 300px; width: 340px;
    background: #fafaf8; border: 1px solid #ebebea; border-radius: 10px; overflow: hidden;
  }
  .sv-sig-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.5rem 0.75rem; border-bottom: 1px solid #ebebea;
  }
  .sv-sig-label { font-size: 0.7rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: #c0674d; }
  .sv-sig-actions { display: flex; gap: 0.35rem; }
  .sv-sig-btn {
    background: transparent; border: 1px solid #e5e5e0; border-radius: 6px;
    padding: 0.2rem 0.55rem; font-size: 0.72rem; font-weight: 500;
    font-family: 'DM Sans', sans-serif; color: #6b6b72; cursor: pointer;
    transition: background 0.12s; white-space: nowrap;
  }
  .sv-sig-btn:hover { background: #f0f0ea; }
  .sv-canvas-wrap {
    border: 1px solid #e5e5e0; border-radius: 8px;
    background: #ffffff; position: relative; overflow: hidden;
    height: 110px; width: 100%;
  }
  .sv-canvas-placeholder {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-size: 0.84rem; color: #c0c0b8; font-weight: 300; pointer-events: none;
  }
  .sv-pen-sizes { display: flex; gap: 0.3rem; margin-top: 0.5rem; }
  .sv-pen-btn {
    flex: 1; background: transparent; border: 1px solid #e5e5e0; border-radius: 6px;
    padding: 0.2rem 0; font-size: 0.72rem; font-weight: 500;
    font-family: 'DM Sans', sans-serif; color: #6b6b72; cursor: pointer; transition: all 0.12s;
  }
  .sv-pen-btn.active { border-color: #9e7d52; background: #fef5ec; color: #9e7d52; }

  .sv-action-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 0.75rem; flex-wrap: wrap; gap: 0.5rem;
  }
  .sv-status-text { font-size: 0.82rem; color: #9090a0; font-weight: 300; display: flex; align-items: center; gap: 0.4rem; }
  .sv-status-text.ready { color: #2d8a50; }
  .sv-ready-dot { width: 7px; height: 7px; border-radius: 50%; background: #2d8a50; flex-shrink: 0; }
  .sv-submit-btn {
    background: #1a1a1e; color: #f5f0e8; border: none; border-radius: 9px;
    padding: 0.7rem 1.6rem; font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: background 0.15s, transform 0.1s;
  }
  .sv-submit-btn:hover:not(:disabled) { background: #2e2e34; }
  .sv-submit-btn:active:not(:disabled) { transform: scale(0.99); }
  .sv-submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── Gate screens ── */
  .sv-gate {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #f7f6f3; padding: 2rem;
  }
  .sv-gate-card {
    background: #ffffff; border: 1px solid #ebebea; border-radius: 18px;
    padding: 2.8rem 2.4rem; max-width: 440px; width: 100%; text-align: center;
  }
  .sv-gate-icon {
    width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 1.4rem;
    display: flex; align-items: center; justify-content: center;
  }
  .sv-gate-title { font-family: 'DM Serif Display', serif; font-size: 1.7rem; color: #1a1a1e; margin-bottom: 0.75rem; font-weight: 400; }
  .sv-gate-desc { font-size: 0.9rem; color: #6b6b72; line-height: 1.7; font-weight: 300; margin-bottom: 1.8rem; }

  .sv-gate-btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: #1a1a1e; color: #f5f0e8; border: none; border-radius: 10px;
    padding: 0.8rem 1.6rem; font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem; font-weight: 500; cursor: pointer; text-decoration: none; transition: background 0.15s;
  }
  .sv-gate-btn:hover { background: #2e2e34; }
  .sv-gate-btn.success { background: #2d8a50; }
  .sv-gate-btn.success:hover { background: #246e40; }

  /* ── Completed state: upsell block ── */
  .sv-upsell {
    margin-top: 2rem;
    background: linear-gradient(135deg, #1a1a1e 0%, #2a2118 100%);
    border-radius: 14px;
    padding: 1.8rem 1.6rem 1.6rem;
    text-align: left;
    position: relative;
    overflow: hidden;
  }
  .sv-upsell::before {
    content: '';
    position: absolute;
    top: -30px; right: -30px;
    width: 120px; height: 120px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(158,125,82,0.25) 0%, transparent 70%);
    pointer-events: none;
  }
  .sv-upsell::after {
    content: '';
    position: absolute;
    bottom: -20px; left: 10px;
    width: 80px; height: 80px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(158,125,82,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .sv-upsell-eyebrow {
    font-size: 0.65rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.12em; color: #9e7d52; margin-bottom: 0.6rem;
  }
  .sv-upsell-title {
    font-family: 'DM Serif Display', serif;
    font-size: 1.35rem; font-weight: 400;
    color: #f5f0e8; line-height: 1.35;
    margin-bottom: 0.7rem;
  }
  .sv-upsell-title em { font-style: italic; color: #c4a97a; }
  .sv-upsell-desc {
    font-size: 0.82rem; color: #a09888; font-weight: 300;
    line-height: 1.6; margin-bottom: 1.3rem;
  }
  .sv-upsell-features {
    display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.4rem;
  }
  .sv-upsell-feature {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.8rem; color: #d4cec6; font-weight: 300;
  }
  .sv-upsell-feature-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #9e7d52; flex-shrink: 0;
  }
  .sv-upsell-cta {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.55rem;
    background: #9e7d52; color: #fff8ee;
    border: none; border-radius: 10px; padding: 0.82rem 1.2rem;
    font-family: 'DM Sans', sans-serif; font-size: 0.88rem; font-weight: 600;
    cursor: pointer; transition: background 0.15s, transform 0.1s;
    text-decoration: none;
    position: relative; z-index: 1;
  }
  .sv-upsell-cta:hover { background: #b8935e; transform: translateY(-1px); }
  .sv-upsell-cta:active { transform: translateY(0); }
  .sv-upsell-cta:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .sv-upsell-sub {
    font-size: 0.72rem; color: #6a6258; margin-top: 0.7rem; text-align: center;
    font-weight: 300; position: relative; z-index: 1;
  }

  /* 2FA */
  .sv-otp-input {
    width: 100%; text-align: center; font-size: 2rem; letter-spacing: 0.4em;
    border: 1px solid #e5e5e0; border-radius: 10px; padding: 0.75rem 0;
    background: #fafaf8; font-family: 'DM Sans', sans-serif; color: #1a1a1e;
    outline: none; transition: border-color 0.15s; margin-bottom: 1rem;
  }
  .sv-otp-input:focus { border-color: #9e7d52; box-shadow: 0 0 0 3px rgba(158,125,82,0.1); }
  .sv-2fa-verify-btn {
    width: 100%; background: #1a1a1e; color: #f5f0e8; border: none; border-radius: 10px;
    padding: 0.82rem; font-family: 'DM Sans', sans-serif; font-size: 0.92rem; font-weight: 500;
    cursor: pointer; transition: background 0.15s; margin-bottom: 0.75rem;
  }
  .sv-2fa-verify-btn:hover:not(:disabled) { background: #2e2e34; }
  .sv-2fa-verify-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .sv-resend-btn {
    background: none; border: none; color: #9e7d52; font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem; font-weight: 500; cursor: pointer; padding: 0; transition: color 0.15s;
  }
  .sv-resend-btn:hover { color: #7a6140; }
  .sv-countdown { font-size: 0.82rem; color: #9090a0; font-weight: 300; margin-top: 0.5rem; }
  .sv-phone-masked {
    display: inline-block; direction: ltr; background: #fafaf8; border: 1px solid #e5e5e0;
    border-radius: 6px; padding: 0.25rem 0.75rem; font-family: monospace;
    font-size: 1rem; color: #1a1a1e; margin: 0.5rem 0 1.5rem;
  }
  .sv-send-btn {
    width: 100%; background: #1a1a1e; color: #f5f0e8; border: none; border-radius: 10px;
    padding: 0.82rem; font-family: 'DM Sans', sans-serif; font-size: 0.92rem; font-weight: 500;
    cursor: pointer; transition: background 0.15s;
  }
  .sv-send-btn:hover:not(:disabled) { background: #2e2e34; }
  .sv-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .sv-loading-pdf {
    display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
    padding: 4rem 1rem; color: #9090a0; font-size: 0.88rem; font-weight: 300;
  }
  .sv-spinner {
    width: 28px; height: 28px; border: 2px solid #e5e5e0;
    border-top-color: #9e7d52; border-radius: 50%; animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 480px) {
    .sv-sig-card { min-width: 260px; width: 100%; }
    .sv-field-card { min-width: 180px; }
    .sv-gate-card { padding: 2rem 1.5rem; }
  }
`;

const SignerView = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [numPages, setNumPages] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAlreadySigned, setIsAlreadySigned] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [missingFile, setMissingFile] = useState(false);
  const [navigatingToSignup, setNavigatingToSignup] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState('');
  const [originalPdfUrl, setOriginalPdfUrl] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [uploadedSignature, setUploadedSignature] = useState(null);
  const [selectedPenSize, setSelectedPenSize] = useState('medium');
  const selectedPenConfig = PEN_SIZE_OPTIONS.find((o) => o.key === selectedPenSize) || PEN_SIZE_OPTIONS[1];

  const [fieldValues, setFieldValues] = useState({ __date__: new Date().toLocaleDateString('en-GB') });
  const setFieldValue = (key, value) => setFieldValues((prev) => ({ ...prev, [key]: value }));

  const windowWidth = useWindowWidth();
  const sigCanvas = useRef(null);

  const [signerPhone, setSignerPhone] = useState('');
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [twoFAState, setTwoFAState] = useState('idle');
  const [otpCode, setOtpCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const confirmationRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);

  useEffect(() => {
    let timer;
    if (resendCountdown > 0 && twoFAState === 'waiting') {
      timer = setTimeout(() => setResendCountdown((p) => p - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown, twoFAState]);

  useEffect(() => {
    const pad = sigCanvas.current?.getSignaturePad?.();
    if (pad) { pad.minWidth = selectedPenConfig.minWidth; pad.maxWidth = selectedPenConfig.maxWidth; }
  }, [selectedPenConfig]);

  const handleClearSignature = () => { sigCanvas.current?.clear(); setUploadedSignature(null); setIsSigned(false); };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img; const MAX_SIZE = 500;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) { height *= MAX_SIZE / width; width = MAX_SIZE; }
            else { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          setUploadedSignature({ url: canvas.toDataURL('image/png'), width, height });
          setIsSigned(true);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    let objectUrl = null;
    const loadDocument = async () => {
      if (!documentId) return;
      try {
        const result = await fetchDocument(documentId);
        if (result) {
          const currentStatus = (result.data?.status || '').toLowerCase();
          if (currentStatus === 'signed') { setIsAlreadySigned(true); return; }
          else if (currentStatus !== 'pending') { setIsExpired(true); return; }
          setMarkers(result.markers);
          setOriginalPdfUrl(result.data?.originalPdfUrl || result.data?.fileUrl || '');
          if (result.data?.penThickness && PEN_SIZE_OPTIONS.some(o => o.key === result.data.penThickness)) setSelectedPenSize(result.data.penThickness);
          const phone = result.data?.signerPhone?.trim() || '';
          if (phone) { setSignerPhone(phone); setIs2FARequired(true); }
        }
        const fileRef = ref(storage, `pdfs/${documentId}.pdf`);
        let url = await getDownloadURL(fileRef);
        if (!url.includes('alt=media')) url += (url.includes('?') ? '&' : '?') + 'alt=media';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch the PDF file content.');
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch (error) {
        if (error?.code === 'storage/object-not-found') setMissingFile(true);
        else if (error?.code === 'permission-denied' || error?.message?.toLowerCase().includes('permission')) setIsExpired(true);
      }
    };
    loadDocument();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [documentId]);

  const maskedPhone = signerPhone.length > 4 ? '*'.repeat(signerPhone.length - 4) + signerPhone.slice(-4) : signerPhone;
  const formatPhoneNumber = (phone) => {
    let digits = (phone || '').replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '972' + digits.substring(1);
    else if (digits.startsWith('5')) digits = '972' + digits;
    return '+' + digits;
  };

  const nuclearRecaptchaCleanup = () => {
    if (window.recaptchaVerifier) { try { window.recaptchaVerifier.clear(); } catch {} window.recaptchaVerifier = null; }
    recaptchaVerifierRef.current = null;
    const el = document.getElementById('recaptcha-container');
    if (el) { el.innerHTML = ''; }
  };
  const renderRecaptcha = () => {
    nuclearRecaptchaCleanup();
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible', callback: () => {}, 'expired-callback': () => { nuclearRecaptchaCleanup(); } });
    window.recaptchaVerifier = verifier; recaptchaVerifierRef.current = verifier; return verifier;
  };
  useEffect(() => () => nuclearRecaptchaCleanup(), []);

  const handleSendCode = async () => {
    if (twoFAState === 'sending') return;
    setTwoFAState('sending');
    try {
      const formattedPhone = formatPhoneNumber(signerPhone);
      let verifier = window.recaptchaVerifier;
      if (!verifier) verifier = renderRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      confirmationRef.current = confirmation; setTwoFAState('waiting'); setResendCountdown(30);
      showToast('Verification code sent to your phone', 'success');
    } catch (err) {
      let msg = 'Error sending verification code. Check phone number and try again.';
      if (err.code === 'auth/invalid-phone-number') msg = 'Invalid phone number.';
      if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
      showToast(msg, 'error'); nuclearRecaptchaCleanup(); setTwoFAState('idle'); setResendCountdown(0);
    }
  };

  const handleVerifyCode = async () => {
    if (!otpCode.trim()) { showToast('Please enter the verification code', 'error'); return; }
    setTwoFAState('verifying');
    try {
      await confirmationRef.current.confirm(otpCode.trim()); setTwoFAState('verified');
      showToast('Verification completed successfully! You can now sign the document.', 'success');
    } catch (err) { showToast('Invalid or expired code. Please try again.', 'error'); setTwoFAState('waiting'); }
  };

  const hasSignature = markers.some((m) => !m.type || m.type === 'signature');
  const textCards = [];
  let dateCardAdded = false;
  markers.forEach((m, idx) => {
    if (!m.type || m.type === 'signature') return;
    if (m.type === 'date') { if (!dateCardAdded) { dateCardAdded = true; textCards.push({ key: '__date__', label: getMarkerLabel(m), color: getMarkerColor(m) }); } return; }
    textCards.push({ key: getInputKey(m, idx), label: getMarkerLabel(m), color: getMarkerColor(m) });
  });
  const isFormReady = (!hasSignature || isSigned) && textCards.every(({ key }) => (fieldValues[key] || '').trim() !== '');

  const handleFinish = async () => {
    if (!isFormReady) { showToast('Please sign and fill all fields before submitting.', 'error'); return; }
    setIsSubmitting(true);
    try {
      const cleanupTargetUrl = originalPdfUrl.trim();
      const formValues = {};
      markers.forEach((m, idx) => { const key = getInputKey(m, idx); if (key) formValues[idx] = fieldValues[key] || ''; });
      let signatureData = null;
      if (hasSignature) {
        if (uploadedSignature) {
          const finalCanvas = document.createElement('canvas');
          const drawnCanvas = sigCanvas.current.getCanvas();
          finalCanvas.width = drawnCanvas.width; finalCanvas.height = drawnCanvas.height;
          const ctx = finalCanvas.getContext('2d');
          signatureData = await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => { ctx.drawImage(img, 0, 0, finalCanvas.width, finalCanvas.height); ctx.drawImage(drawnCanvas, 0, 0); resolve(finalCanvas.toDataURL('image/png')); };
            img.onerror = reject; img.src = uploadedSignature.url;
          });
        } else if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
          signatureData = sigCanvas.current.getCanvas().toDataURL('image/png');
        }
      }
      await continueSubmission(signatureData, formValues, cleanupTargetUrl);
    } catch (error) { showToast(error.message, 'error'); }
    finally { setIsSubmitting(false); }
  };

  const continueSubmission = async (signatureData, formValues, cleanupTargetUrl) => {
    try {
      const response = await fetch('/api/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documentId, signatureData, markers, formValues }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to sign the document.');
      await updateDoc(doc(db, 'documents', documentId), { status: 'signed', signedAt: new Date().toISOString(), signedPdfUrl: result.downloadUrl });
      if (cleanupTargetUrl && cleanupTargetUrl !== result.downloadUrl) {
        storageCompat.refFromURL(cleanupTargetUrl).delete().catch((e) => console.warn('Cleanup failed:', e));
      }
      setSignedPdfUrl(result.downloadUrl); setIsCompleted(true); showToast('Document signed successfully!', 'success');
    } catch (error) { showToast(`An error occurred: ${error.message}`, 'error'); }
    finally { setIsSubmitting(false); }
  };

  const renderContent = () => {
    if (missingFile) return (
      <div className="sv-gate">
        <div className="sv-gate-card">
          <div className="sv-gate-icon" style={{ background: '#fdf0ee' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c0674d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2 className="sv-gate-title">File Missing</h2>
          <p className="sv-gate-desc">This document has been removed from the server. Please contact the sender for a new link.</p>
        </div>
      </div>
    );

    if (isCompleted) return (
      <div className="sv-gate">
        <div className="sv-gate-card">
          {/* Success icon */}
          <div className="sv-gate-icon" style={{ background: '#edf7f0' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2d8a50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 className="sv-gate-title">Document Signed!</h2>
          <p className="sv-gate-desc">Your signature has been recorded and the document has been delivered to the sender.</p>

          {/* Download */}
          <a href={signedPdfUrl} download target="_blank" rel="noopener noreferrer" className="sv-gate-btn success" style={{ width: '100%', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Your Copy
          </a>

          {/* ── Upsell block ── */}
          <div className="sv-upsell">
            <p className="sv-upsell-eyebrow">Built with SignFlow</p>
            <h3 className="sv-upsell-title">
              Send documents<br />
              for signature <em>in seconds.</em>
            </h3>
            <p className="sv-upsell-desc">
              Join thousands of professionals who use SignFlow to close contracts, onboard clients, and collect signatures — without the back-and-forth.
            </p>
            <div className="sv-upsell-features">
              {[
                'Upload any PDF and place signature fields',
                'Send via a secure, one-click link',
                'Signed copies delivered automatically',
                'Phone-verified 2FA for every signer',
              ].map((f) => (
                <div className="sv-upsell-feature" key={f}>
                  <div className="sv-upsell-feature-dot" />
                  {f}
                </div>
              ))}
            </div>
            <button
              className="sv-upsell-cta"
              onClick={() => { setNavigatingToSignup(true); setTimeout(() => navigate('/signup'), 150); }}
              disabled={navigatingToSignup}
            >
              {navigatingToSignup ? 'Loading…' : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12h18M13 6l6 6-6 6"/>
                  </svg>
                  Start for free
                </>
              )}
            </button>
            <p className="sv-upsell-sub">No credit card required · Takes 2 minutes</p>
          </div>
        </div>
      </div>
    );

    if (isAlreadySigned) return (
      <div className="sv-gate">
        <div className="sv-gate-card">
          <div className="sv-gate-icon" style={{ background: '#f3f3f0' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9090a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="sv-gate-title">Link No Longer Active</h2>
          <p className="sv-gate-desc">This document has already been signed and completed. The signing link has been deactivated.</p>
        </div>
      </div>
    );

    if (isExpired) return (
      <div className="sv-gate">
        <div className="sv-gate-card">
          <div className="sv-gate-icon" style={{ background: '#fdf0ee' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c0674d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h2 className="sv-gate-title">Link Expired</h2>
          <p className="sv-gate-desc">
            For security reasons, the signature link is valid for a limited time only. Please contact the sender for a new link.
          </p>
        </div>
      </div>
    );

    if (is2FARequired && twoFAState !== 'verified') return (
      <div className="sv-gate">
        <div className="sv-gate-card">
          <div className="sv-gate-icon" style={{ background: '#fafaf8', border: '1px solid #e5e5e0' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9e7d52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
              <circle cx="12" cy="16" r="1"/>
            </svg>
          </div>
          <h2 className="sv-gate-title">Identity Verification</h2>
          <p className="sv-gate-desc">For security reasons, you must verify your phone number before signing.</p>
          {(twoFAState === 'idle' || twoFAState === 'sending') ? (
            <>
              <p style={{ fontSize: '0.88rem', color: '#6b6b72', marginBottom: '0.5rem', fontWeight: 300 }}>An SMS code will be sent to:</p>
              <div className="sv-phone-masked">{maskedPhone}</div>
              <button className="sv-send-btn" onClick={handleSendCode} disabled={twoFAState === 'sending'}>
                {twoFAState === 'sending' ? 'Sending...' : 'Send Verification Code'}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: '0.88rem', color: '#6b6b72', marginBottom: '0.75rem', fontWeight: 300 }}>Enter the code you received via SMS:</p>
              <input
                type="text" inputMode="numeric" maxLength={6}
                value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000" className="sv-otp-input"
                onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyCode(); }}
              />
              <button className="sv-2fa-verify-btn" onClick={handleVerifyCode} disabled={twoFAState === 'verifying'}>
                {twoFAState === 'verifying' ? 'Verifying...' : 'Verify and Enter'}
              </button>
              {resendCountdown > 0
                ? <p className="sv-countdown">Can resend in {resendCountdown} seconds</p>
                : <button className="sv-resend-btn" onClick={() => { setOtpCode(''); handleSendCode(); }}>Didn't receive? Send again</button>
              }
            </>
          )}
        </div>
      </div>
    );

    return (
      <div className="sv-root">
        {/* PDF Area */}
        <div className="sv-pdf-area">
          {pdfUrl ? (
            <Document
              file={pdfUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={<div className="sv-loading-pdf"><div className="sv-spinner" /><span>Loading document…</span></div>}
              error={<div className="sv-loading-pdf" style={{ color: '#c0674d' }}>Failed to load PDF. Please refresh.</div>}
            >
              {Array.from(new Array(numPages), (el, index) => {
                const pageNumber = index + 1;
                const pageMarkers = markers.map((m, globalIdx) => ({ ...m, globalIdx })).filter((m) => m.page === pageNumber);
                return (
                  <React.Fragment key={`page_${pageNumber}`}>
                    {numPages > 1 && <p className="sv-page-label">Page {pageNumber} of {numPages}</p>}
                    <div className="sv-pdf-page-wrap">
                      <Page pageNumber={pageNumber} width={Math.min(windowWidth - 32, 680)} renderTextLayer={false} renderAnnotationLayer={false} />
                      {pageMarkers.map((marker) => {
                        const isSigMarker = !marker.type || marker.type === 'signature';
                        const color = getMarkerColor(marker);
                        const key = getInputKey(marker, marker.globalIdx);
                        const liveValue = key ? (fieldValues[key] || '') : '';
                        const isEmpty = !isSigMarker && !liveValue;
                        let overlayText = isSigMarker
                          ? (isSigned ? '✓' : 'Sign here')
                          : (liveValue || getMarkerLabel(marker));
                        return (
                          <div key={marker.globalIdx} className="sv-marker" style={{
                            left: `${marker.nx * 100}%`, top: `${marker.ny * 100}%`,
                            width: `${marker.nw * 100}%`, height: `${marker.nh * 100}%`,
                            borderColor: color, border: `1.5px solid ${color}`,
                            backgroundColor: `${color}18`, color,
                            fontStyle: isEmpty ? 'italic' : 'normal',
                            fontWeight: (!isSigMarker && liveValue) ? 600 : 500,
                            fontSize: '0.75rem',
                          }}>
                            {overlayText}
                          </div>
                        );
                      })}
                    </div>
                  </React.Fragment>
                );
              })}
            </Document>
          ) : (
            <div className="sv-loading-pdf"><div className="sv-spinner" /><span>Loading document…</span></div>
          )}
        </div>

        {/* Footer */}
        {markers.length > 0 && (
          <div className="sv-footer">
            <div className="sv-footer-inner">
              <div className="sv-fields-row">
                {hasSignature && (
                  <div className="sv-sig-card">
                    <div className="sv-sig-head">
                      <span className="sv-sig-label">Signature</span>
                      <div className="sv-sig-actions">
                        <label className="sv-sig-btn" title="Upload image" style={{ cursor: 'pointer' }}>
                          Upload
                          <input type="file" accept="image/png, image/jpeg" onChange={handleFileUpload} style={{ display: 'none' }} />
                        </label>
                        <button className="sv-sig-btn" onClick={handleClearSignature}>Clear</button>
                      </div>
                    </div>
                    <div className="sv-field-body">
                      <div className="sv-canvas-wrap">
                        {uploadedSignature ? (
                          <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                            <img src={uploadedSignature.url} alt="Uploaded signature" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: 0.8 }} />
                            <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                              <SignatureCanvas ref={sigCanvas} penColor="#1a1a1e" minWidth={selectedPenConfig.minWidth} maxWidth={selectedPenConfig.maxWidth} onBegin={() => setIsSigned(true)} canvasProps={{ style: { width: '100%', height: '100%', display: 'block' } }} />
                            </div>
                          </div>
                        ) : (
                          <>
                            <SignatureCanvas ref={sigCanvas} penColor="#1a1a1e" minWidth={selectedPenConfig.minWidth} maxWidth={selectedPenConfig.maxWidth} onBegin={() => setIsSigned(true)} canvasProps={{ style: { width: '100%', height: '100%', display: 'block' } }} />
                            {!isSigned && <div className="sv-canvas-placeholder">Draw your signature here</div>}
                          </>
                        )}
                      </div>
                      <div className="sv-pen-sizes">
                        {PEN_SIZE_OPTIONS.map((opt) => (
                          <button key={opt.key} className={`sv-pen-btn${selectedPenSize === opt.key ? ' active' : ''}`} onClick={() => setSelectedPenSize(opt.key)}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {textCards.map(({ key, label, color }) => (
                  <div className="sv-field-card" key={key}>
                    <div className="sv-field-card-head">
                      <span className="sv-field-label" style={{ color }}>{label}</span>
                    </div>
                    <div className="sv-field-body">
                      <input
                        className="sv-field-input" type="text"
                        placeholder={`Enter ${label.toLowerCase()}`}
                        value={fieldValues[key] || ''}
                        onChange={(e) => setFieldValue(key, e.target.value)}
                        dir="auto"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="sv-action-row">
                <p className={`sv-status-text${isFormReady ? ' ready' : ''}`}>
                  {isFormReady && <span className="sv-ready-dot" />}
                  {isFormReady ? 'Ready to submit' : 'Fill all required fields to continue'}
                </p>
                <button onClick={handleFinish} disabled={isSubmitting || !isFormReady} className="sv-submit-btn">
                  {isSubmitting ? 'Processing…' : 'Finish & Sign'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{SF_STYLES}</style>
      <div id="recaptcha-container" />
      {renderContent()}
    </>
  );
};

export default SignerView;