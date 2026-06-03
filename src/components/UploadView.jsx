/* eslint-disable react-hooks/refs */
import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { getMarkerColor, PEN_SIZE_OPTIONS } from '../utils/pdfHelpers';
import { useUploadView, FIELD_TYPES } from '../hooks/useUploadView';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const UV_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  .uv-root {
    min-height: 100vh;
    background: #f7f6f3;
    font-family: 'DM Sans', sans-serif;
    color: #1a1a1e;
  }

  /* ── Topbar ─────────────────────────────── */
  .uv-topbar {
    background: #ffffff;
    border-bottom: 1px solid #ebebea;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .uv-logo {
    font-family: 'DM Serif Display', serif;
    font-size: 1.3rem;
    color: #1a1a1e;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
  }
  .uv-logo em { font-style: italic; color: #9e7d52; }
  .uv-logo img { width: 24px; height: 24px; flex-shrink: 0; object-fit: contain; }

  .uv-topbar-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .uv-greeting {
    font-size: 0.82rem;
    color: #6b6b72;
    font-weight: 300;
    margin-right: 0.25rem;
  }
  .uv-btn-ghost {
    background: transparent;
    border: 1px solid #e5e5e0;
    border-radius: 8px;
    padding: 0.38rem 0.9rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    color: #9090a0;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  .uv-btn-ghost:hover { border-color: #9e7d52; color: #9e7d52; }

  .uv-btn-gold {
    background: #1a1a1e;
    border: none;
    border-radius: 8px;
    padding: 0.38rem 0.9rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    color: #f5f0e8;
    cursor: pointer;
    transition: background 0.15s;
  }
  .uv-btn-gold:hover { background: #2e2e34; }

  /* ── Page layout ─────────────────────────── */
  .uv-body {
    max-width: 780px;
    margin: 0 auto;
    padding: 2.5rem 1.25rem 10rem;
  }

  .uv-page-header {
    margin-bottom: 2rem;
  }
  .uv-page-title {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem;
    font-weight: 400;
    color: #1a1a1e;
    margin: 0 0 0.3rem;
    line-height: 1.1;
  }
  .uv-page-title em { font-style: italic; color: #9e7d52; }
  .uv-page-sub {
    font-size: 0.88rem;
    color: #6b6b72;
    font-weight: 300;
  }

  /* ── Cards ──────────────────────────────── */
  .uv-card {
    background: #ffffff;
    border: 1px solid #ebebea;
    border-radius: 14px;
    padding: 1.4rem 1.5rem;
    margin-bottom: 1rem;
  }
  .uv-card-title {
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #6b6b72;
    margin: 0 0 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* ── Drop zone ───────────────────────────── */
  .uv-drop-zone {
    border: 1.5px dashed #e5e5e0;
    border-radius: 12px;
    padding: 2.8rem 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    position: relative;
    background: #f7f6f3;
  }
  .uv-drop-zone:hover, .uv-drop-zone.drag-over {
    border-color: #9e7d52;
    background: rgba(158,125,82,0.04);
  }
  .uv-drop-icon {
    width: 48px; height: 48px;
    border-radius: 12px;
    background: #fafaf8;
    border: 1px solid #e5e5e0;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1rem;
  }
  .uv-drop-title {
    font-size: 1rem;
    font-weight: 500;
    color: #1a1a1e;
    margin-bottom: 0.3rem;
  }
  .uv-drop-sub {
    font-size: 0.82rem;
    color: #6b6b72;
    font-weight: 300;
    margin-bottom: 1.2rem;
  }
  .uv-file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }
  .uv-browse-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: #fafaf8;
    border: 1px solid #e5e5e0;
    border-radius: 8px;
    padding: 0.5rem 1.1rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem;
    font-weight: 500;
    color: #9e7d52;
    pointer-events: none;
  }

  /* ── Upsell (limit reached) ──────────────── */
  .uv-upsell {
    background: linear-gradient(145deg, #ffffff 0%, #fdfbf8 100%);
    border: 1px solid #ebebea;
    border-radius: 16px;
    padding: 2.4rem 2rem 2rem;
    text-align: left;
    position: relative;
    overflow: hidden;
    box-shadow: 0 12px 40px rgba(158,125,82,0.06); /* Léger halo doré/chaud */
  }
  .uv-upsell::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(158,125,82,0.12) 0%, transparent 65%);
    pointer-events: none;
  }
  .uv-upsell::after {
    content: '';
    position: absolute;
    bottom: -40px; left: 20px;
    width: 140px; height: 140px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(158,125,82,0.06) 0%, transparent 65%);
    pointer-events: none;
  }
  .uv-upsell-eyebrow {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: #9e7d52;
    margin-bottom: 0.7rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .uv-upsell-eyebrow::before {
    content: '';
    display: inline-block;
    width: 16px; height: 1px;
    background: #9e7d52;
    flex-shrink: 0;
  }
  .uv-upsell-title {
    font-family: 'DM Serif Display', serif;
    font-size: 1.6rem;
    font-weight: 400;
    color: #1a1a1e;
    margin-bottom: 0.5rem;
    line-height: 1.25;
  }
  .uv-upsell-title em {
    font-style: italic;
    color: #9e7d52;
  }
  .uv-upsell-price {
    font-size: 0.82rem;
    color: #6b6b72;
    font-weight: 300;
    margin-bottom: 1.4rem;
    line-height: 1.6;
  }
  .uv-upsell-price strong {
    color: #1a1a1e;
    font-weight: 600;
    font-size: 1rem;
  }
  .uv-upsell-features {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-bottom: 1.6rem;
  }
  .uv-upsell-feat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.82rem;
    color: #4a4a52;
    font-weight: 300;
  }
  .uv-upsell-feat-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #9e7d52;
    flex-shrink: 0;
  }
  .uv-upsell-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: #9e7d52;
    color: #fff8ee;
    border: none;
    border-radius: 10px;
    padding: 0.82rem 1.5rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    position: relative;
    z-index: 1;
  }
  .uv-upsell-btn:hover { background: #b8935e; transform: translateY(-1px); }
  .uv-upsell-btn:active { transform: translateY(0); }
  .uv-upsell-sub {
    font-size: 0.72rem;
    color: #9090a0;
    margin-top: 0.75rem;
    font-weight: 300;
    position: relative;
    z-index: 1;
  }

  /* ── Toggle row ──────────────────────────── */
  .uv-toggle-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
  }
  .uv-toggle {
    position: relative;
    width: 36px; height: 20px;
    flex-shrink: 0;
  }
  .uv-toggle input { opacity: 0; width: 0; height: 0; }
  .uv-toggle-track {
    position: absolute;
    inset: 0;
    background: #e5e5e0;
    border-radius: 20px;
    transition: background 0.2s;
  }
  .uv-toggle input:checked ~ .uv-toggle-track { background: #9e7d52; }
  .uv-toggle-thumb {
    position: absolute;
    top: 3px; left: 3px;
    width: 14px; height: 14px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s;
  }
  .uv-toggle input:checked ~ .uv-toggle-thumb { transform: translateX(16px); }
  .uv-toggle-label {
    font-size: 0.9rem;
    color: #c0c0b8;
    font-weight: 400;
  }
  .uv-toggle-sub {
    font-size: 0.78rem;
    color: #6b6b72;
    font-weight: 300;
  }

  .uv-input {
    width: 100%;
    max-width: 320px;
    background: #fafaf8;
    border: 1px solid #e5e5e0;
    border-radius: 8px;
    padding: 0.65rem 0.9rem;
    font-size: 0.88rem;
    color: #1a1a1e;
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
    margin-top: 0.75rem;
  }
  .uv-input::placeholder { color: #b0b0a8; }
  .uv-input:focus {
    border-color: #9e7d52;
    box-shadow: 0 0 0 3px rgba(158,125,82,0.1);
  }
  .uv-input-note {
    font-size: 0.75rem;
    color: #b0b0a8;
    font-weight: 300;
    margin-top: 0.4rem;
  }

  /* ── Pen size buttons ──────────────────── */
  .uv-pen-btns {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .uv-pen-btn {
    background: transparent;
    border: 1px solid #e5e5e0;
    border-radius: 7px;
    padding: 0.35rem 0.85rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    color: #6b6b72;
    cursor: pointer;
    transition: all 0.15s;
  }
  .uv-pen-btn:hover { border-color: #9e7d52; color: #9e7d52; }
  .uv-pen-btn.active {
    border-color: #9e7d52;
    background: rgba(158,125,82,0.12);
    color: #9e7d52;
  }

  /* ── Field editor area ───────────────────── */
  .uv-editor-header {
    margin-bottom: 1rem;
  }
  .uv-editor-desc {
    font-size: 0.85rem;
    color: #9090a0;
    font-weight: 300;
    line-height: 1.5;
    margin-bottom: 1rem;
  }
  .uv-field-type-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }
  .uv-field-type-btn {
    border-radius: 7px;
    padding: 0.35rem 0.9rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid;
  }
  .uv-divider-v {
    width: 1px;
    height: 24px;
    background: #e5e5e0;
    margin: 0 0.25rem;
  }
  .uv-ai-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    border: 1px solid #9e7d52;
    border-radius: 7px;
    padding: 0.35rem 0.9rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    background: rgba(158,125,82,0.1);
    color: #9e7d52;
  }
  .uv-ai-btn:hover:not(:disabled) {
    background: rgba(158,125,82,0.2);
  }
  .uv-ai-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .uv-spin { display: inline-block; animation: spin 1s linear infinite; }

  /* ── AI suggestions banner ───────────────── */
  .uv-ai-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(158,125,82,0.08);
    border: 1px solid rgba(158,125,82,0.25);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    margin-top: 0.75rem;
    font-size: 0.84rem;
    color: #9e7d52;
    flex-wrap: wrap;
  }
  .uv-ai-banner-text { flex: 1; min-width: 0; font-weight: 300; }
  .uv-ai-banner-text strong { font-weight: 500; }
  .uv-banner-btn {
    border-radius: 6px;
    padding: 0.3rem 0.75rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.12s;
    white-space: nowrap;
  }
  .uv-banner-btn-approve {
    background: #9e7d52;
    border: none;
    color: #fff;
  }
  .uv-banner-btn-approve:hover { background: #b08f61; }
  .uv-banner-btn-reject {
    background: transparent;
    border: 1px solid #44444e;
    color: #9090a0;
  }
  .uv-banner-btn-reject:hover { border-color: #dc2626; color: #f87171; }

  /* ── Label dialog ─────────────────────────── */
  .uv-dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }
  .uv-dialog {
    background: #ffffff;
    border: 1px solid #e5e5e0;
    border-radius: 16px;
    padding: 1.8rem;
    max-width: 380px;
    width: 100%;
    box-shadow: 0 24px 60px rgba(0,0,0,0.6);
  }
  .uv-dialog-title {
    font-family: 'DM Serif Display', serif;
    font-size: 1.35rem;
    font-weight: 400;
    color: #1a1a1e;
    margin: 0 0 0.4rem;
  }
  .uv-dialog-desc {
    font-size: 0.84rem;
    color: #6b6b72;
    font-weight: 300;
    line-height: 1.6;
    margin-bottom: 1.2rem;
  }
  .uv-dialog-input {
    width: 100%;
    background: #fafaf8;
    border: 1px solid #e5e5e0;
    border-radius: 8px;
    padding: 0.7rem 0.9rem;
    font-size: 0.92rem;
    color: #1a1a1e;
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
    margin-bottom: 1.2rem;
  }
  .uv-dialog-input::placeholder { color: #b0b0a8; }
  .uv-dialog-input:focus {
    border-color: #9e7d52;
    box-shadow: 0 0 0 3px rgba(158,125,82,0.1);
  }
  .uv-dialog-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
  .uv-btn-cancel {
    background: transparent;
    border: 1px solid #e5e5e0;
    border-radius: 8px;
    padding: 0.55rem 1.1rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.86rem;
    font-weight: 500;
    color: #6b6b72;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  .uv-btn-cancel:hover { border-color: #b0b0a8; color: #9090a0; }
  .uv-btn-confirm {
    background: #1a1a1e;
    border: none;
    border-radius: 8px;
    padding: 0.55rem 1.1rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.86rem;
    font-weight: 500;
    color: #f5f0e8;
    cursor: pointer;
    transition: background 0.15s;
  }
  .uv-btn-confirm:hover:not(:disabled) { background: #2e2e34; }
  .uv-btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── PDF document area ───────────────────── */
  .uv-pdf-wrap {
    margin-top: 0.5rem;
  }
  .uv-pdf-page-wrap {
    position: relative;
    margin-bottom: 1.5rem;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 32px rgba(0,0,0,0.5);
    display: inline-block;
    width: 100%;
  }

  /* ── Field overlay elements ──────────────── */
  .uv-field-label-chip {
    position: absolute;
    bottom: 100%;
    left: 0;
    font-size: 0.62rem;
    font-weight: 600;
    white-space: nowrap;
    line-height: 1.2;
    padding: 1px 5px;
    background: #ffffff;
    border-radius: 3px;
    transform: translateY(-1px);
  }
  .uv-field-actions {
    position: absolute;
    top: 3px;
    right: 3px;
    display: flex;
    gap: 3px;
  }
  .uv-field-icon-btn {
    width: 20px; height: 20px;
    border-radius: 4px;
    border: none;
    font-size: 0.72rem;
    cursor: pointer;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.12s;
  }
  .uv-field-icon-btn:hover { opacity: 0.85; }
  .uv-resize-handle {
    position: absolute;
    bottom: 0; right: 0;
    width: 10px; height: 10px;
    border-radius: 2px 0 0 0;
    cursor: nwse-resize;
  }

  /* ── Inline label editor ─────────────────── */
  .uv-inline-editor {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 20;
    background: #ffffff;
    border: 1px solid #e5e5e0;
    border-radius: 8px;
    padding: 6px 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    min-width: 160px;
    display: flex;
    gap: 4px;
  }
  .uv-inline-input {
    flex: 1;
    background: #fafaf8;
    border: 1px solid #e5e5e0;
    border-radius: 5px;
    padding: 4px 7px;
    font-size: 0.78rem;
    color: #1a1a1e;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    min-width: 0;
  }
  .uv-inline-input::placeholder { color: #b0b0a8; }
  .uv-inline-input:focus { border-color: #9e7d52; }
  .uv-inline-save {
    background: #9e7d52;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 3px 8px;
    cursor: pointer;
    font-weight: 700;
    font-size: 0.82rem;
  }

  /* ── Sticky footer ────────────────────────── */
  .uv-footer {
    position: fixed;
    bottom: 40px; left: 0; right: 0;
    z-index: 100;
    background: #ffffff;
    border-top: 1px solid #ebebea;
    padding: 0.9rem 1.5rem;
  }
  @media (max-width: 600px) {
    .uv-footer { bottom: 50px; }
  }
  .uv-footer-inner {
    max-width: 780px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .uv-footer-status {
    font-size: 0.84rem;
    color: #6b6b72;
    font-weight: 300;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .uv-footer-count {
    font-weight: 600;
    color: #9e7d52;
  }
  .uv-pending-badge {
    padding: 2px 9px;
    border-radius: 20px;
    background: rgba(158,125,82,0.12);
    color: #9e7d52;
    font-weight: 500;
    font-size: 0.76rem;
    border: 1px solid rgba(158,125,82,0.2);
  }
  .uv-upload-btn {
    background: #1a1a1e;
    border: none;
    border-radius: 9px;
    padding: 0.68rem 1.6rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: #f5f0e8;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
  }
  .uv-upload-btn:hover:not(:disabled) { background: #2e2e34; }
  .uv-upload-btn:active:not(:disabled) { transform: scale(0.99); }
  .uv-upload-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Generated link ──────────────────────── */
  .uv-link-card {
    background: #ffffff;
    border: 1px solid #ebebea;
    border-radius: 14px;
    padding: 1.8rem 1.5rem;
    text-align: center;
    position: relative;
    overflow: hidden;
    margin-top: 1.5rem;
  }
  .uv-link-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% -10%, rgba(158,125,82,0.07) 0%, transparent 65%);
    pointer-events: none;
  }
  .uv-link-label {
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #6b6b72;
    margin-bottom: 1rem;
  }
  .uv-link-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }
  .uv-link-input {
    flex: 1;
    min-width: 0;
    max-width: 420px;
    background: #fafaf8;
    border: 1px solid #e5e5e0;
    border-radius: 8px;
    padding: 0.65rem 0.9rem;
    font-size: 0.85rem;
    color: #9090a0;
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    outline: none;
  }
  .uv-copy-btn {
    background: #1a1a1e;
    border: none;
    border-radius: 8px;
    padding: 0.65rem 1.2rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.86rem;
    font-weight: 500;
    color: #f5f0e8;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .uv-copy-btn:hover { background: #2e2e34; }
  .uv-wa-btn {
    background: #25D366;
    border: none;
    border-radius: 8px;
    padding: 0.65rem 1.2rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.86rem;
    font-weight: 500;
    color: #fff;
    cursor: pointer;
    transition: background 0.15s;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    white-space: nowrap;
  }
  .uv-wa-btn:hover { background: #1fb857; }

  /* ── Drawing preview rect ────────────────── */
  .uv-drawing-preview {
    position: absolute;
    border: 2px dashed #9e7d52;
    background: rgba(158,125,82,0.08);
    pointer-events: none;
  }

  @media (max-width: 520px) {
    .uv-body { padding: 1.5rem 1rem 9rem; }
    .uv-page-title { font-size: 1.6rem; }
    .uv-footer-inner { gap: 0.6rem; }
    .uv-link-row { flex-direction: column; align-items: stretch; }
    .uv-link-input { max-width: 100%; }
  }
`;

const UploadView = () => {
  const {
    navigate,
    logout,
    userProfile,
    fileUrl,
    generatedLink,
    isCopied,
    numPages,
    useSmsAuth,
    setUseSmsAuth,
    signerPhone,
    setSignerPhone,
    penThickness,
    setPenThickness,
    fields,
    setFields,
    activeFieldType,
    setActiveFieldType,
    uploading,
    isAnalyzing,
    editingSuggestionId,
    setEditingSuggestionId,
    editingLabel,
    setEditingLabel,
    windowWidth,
    isDrawing,
    currentPageRef,
    drawingBox,
    interaction,
    setInteraction,
    pendingBox,
    setPendingBox,
    pendingLabel,
    setPendingLabel,
    handleFileChange,
    handleDropZoneDragOver,
    handleFileDrop,
    handleDocumentLoadSuccess,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handlePointerMove,
    handleRemoveField,
    handleAnalyze,
    approveSuggestion,
    approveAll,
    confirmPendingBox,
    handleUpload,
    copyToClipboard,
    shareOnWhatsApp,
    hasReachedLimit,
  } = useUploadView();

  return (
    <>
      <style>{UV_STYLES}</style>
      <div className="uv-root">



        {/* ── Body ── */}
        <div className="uv-body">
          <div className="uv-page-header">
            <h1 className="uv-page-title">New <em>Document</em></h1>
            <p className="uv-page-sub">Upload a file, place signature fields, and generate a signing link.</p>
          </div>

          {/* ── Limit reached ── */}
          {hasReachedLimit ? (
            <div className="uv-upsell">
              <p className="uv-upsell-eyebrow">Free plan limit reached</p>
              <h2 className="uv-upsell-title">
                Unlock <em>unlimited</em><br />documents.
              </h2>
              <p className="uv-upsell-price">
                Continue sending documents for just <strong>₪59 / year</strong> — less than a coffee a month.
              </p>
              <div className="uv-upsell-features">
                {[
                  'Unlimited document uploads',
                  'SMS-verified signers',
                  'Instant signed PDF delivery',
                  'AI-powered field detection',
                ].map((f) => (
                  <div className="uv-upsell-feat" key={f}>
                    <div className="uv-upsell-feat-dot" />
                    {f}
                  </div>
                ))}
              </div>
              
              <a
                href="https://api.whatsapp.com/send?phone=972584224416&text=Hello,%20I%20would%20like%20to%20subscribe%20to%20SignFlow"
                target="_blank"
                rel="noopener noreferrer"
                className="uv-upsell-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Upgrade via WhatsApp
              </a>
              <p className="uv-upsell-sub">Respond in minutes · One-time setup</p>
            </div>
          ) : (
            <>
              {/* ── Drop zone ── */}
              {!fileUrl && (
                <div
                  className="uv-drop-zone"
                  onDragOver={handleDropZoneDragOver}
                  onDrop={handleFileDrop}
                >
                  <div className="uv-drop-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9e7d52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                  </div>
                  <p className="uv-drop-title">Drop your document here</p>
                  <p className="uv-drop-sub">PDF, JPG, or PNG — up to 20 MB</p>
                  <div className="uv-browse-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 11 12 6 7 11" /><line x1="12" y1="6" x2="12" y2="18" /></svg>
                    Browse files
                  </div>
                  <input
                    type="file"
                    accept="application/pdf, image/png, image/jpeg"
                    onChange={handleFileChange}
                    className="uv-file-input"
                  />
                </div>
              )}

              {/* ── Settings (once file loaded) ── */}
              {fileUrl && !generatedLink && (
                <>
                  {/* Security settings */}
                  <div className="uv-card">
                    <p className="uv-card-title">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9e7d52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                      Security
                    </p>
                    <label className="uv-toggle-row" htmlFor="sms-auth-toggle">
                      <span className="uv-toggle">
                        <input
                          type="checkbox"
                          id="sms-auth-toggle"
                          checked={useSmsAuth}
                          onChange={(e) => setUseSmsAuth(e.target.checked)}
                        />
                        <span className="uv-toggle-track" />
                        <span className="uv-toggle-thumb" />
                      </span>
                      <span>
                        <span className="uv-toggle-label">SMS Authentication</span>
                        <br />
                        <span className="uv-toggle-sub">Require a one-time code before the signer can view the document</span>
                      </span>
                    </label>

                    {useSmsAuth && (
                      <>
                        <input
                          type="tel"
                          value={signerPhone}
                          onChange={(e) => setSignerPhone(e.target.value)}

                          className="uv-input"
                        />
                        <p className="uv-input-note">The signer will receive an SMS code at this number.</p>
                      </>
                    )}
                  </div>

                  {/* Document settings */}
                  <div className="uv-card">
                    <p className="uv-card-title">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9e7d52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                      Signature Pen
                    </p>
                    <div className="uv-pen-btns">
                      {PEN_SIZE_OPTIONS.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          className={`uv-pen-btn${penThickness === option.key ? ' active' : ''}`}
                          onClick={() => setPenThickness(option.key)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <p className="uv-input-note" style={{ marginTop: '0.5rem' }}>Applied to the signer's signature pen.</p>
                  </div>

                  {/* Field placement */}
                  <div className="uv-card">
                    <p className="uv-card-title">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9e7d52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                      Field Placement
                    </p>
                    <p className="uv-editor-desc">
                      Choose a field type, then click and drag on the document to place it. You can move and resize each field after placing it.
                    </p>

                    <div className="uv-field-type-row">
                      {FIELD_TYPES.map((ft) => (
                        <button
                          key={ft.key}
                          className="uv-field-type-btn"
                          onClick={() => setActiveFieldType(ft.key)}
                          style={{
                            borderColor: ft.color,
                            color: activeFieldType === ft.key ? '#fff' : ft.color,
                            backgroundColor: activeFieldType === ft.key ? ft.color : 'transparent',
                          }}
                        >
                          {ft.label}
                        </button>
                      ))}

                      <span className="uv-divider-v" />

                      <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="uv-ai-btn"
                      >
                        {isAnalyzing ? (
                          <><span className="uv-spin">⏳</span> Analyzing…</>
                        ) : (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
                            Detect with AI
                          </>
                        )}
                      </button>
                    </div>

                    {/* AI suggestions banner */}
                    {fields.some((f) => !f.confirmed) && (
                      <div className="uv-ai-banner">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
                        <span className="uv-ai-banner-text">
                          AI detected <strong>{fields.filter((f) => !f.confirmed).length}</strong> fields — drag to reposition, then approve.
                        </span>
                        <button onClick={approveAll} className="uv-banner-btn uv-banner-btn-approve">✓ Approve All</button>
                        <button onClick={() => setFields((prev) => prev.filter((f) => f.confirmed))} className="uv-banner-btn uv-banner-btn-reject">✕ Reject All</button>
                      </div>
                    )}
                  </div>

                  {/* Label dialog */}
                  {pendingBox && (
                    <div className="uv-dialog-overlay">
                      <div className="uv-dialog">
                        <h3 className="uv-dialog-title">Name this field</h3>
                        <p className="uv-dialog-desc">Give it a label so the signer knows what to fill in — e.g. "Full Name", "ID Number", "Company".</p>
                        <input
                          autoFocus
                          className="uv-dialog-input"
                          type="text"
                          placeholder="Field label…"
                          value={pendingLabel}
                          onChange={(e) => setPendingLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && pendingLabel.trim()) confirmPendingBox();
                            if (e.key === 'Escape') setPendingBox(null);
                          }}
                        />
                        <div className="uv-dialog-actions">
                          <button className="uv-btn-cancel" onClick={() => setPendingBox(null)}>Cancel</button>
                          <button className="uv-btn-confirm" onClick={confirmPendingBox} disabled={!pendingLabel.trim()}>Add Field</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PDF preview */}
                  <div className="uv-pdf-wrap" style={{ textAlign: 'center' }}>
                    <Document
                      file={fileUrl}
                      onLoadSuccess={handleDocumentLoadSuccess}
                      loading={<div style={{ padding: '3rem', color: '#6b6b72', fontSize: '0.88rem' }}>Loading document…</div>}
                    >
                      {Array.from(new Array(numPages), (el, index) => {
                        const pageNumber = index + 1;
                        const pageFields = fields
                          .map((f, i) => ({ ...f, globalIndex: i }))
                          .filter((f) => f.page === pageNumber);

                        return (
                          <div
                            key={`page_${pageNumber}`}
                            className="uv-pdf-page-wrap"
                            style={{
                              cursor: interaction.index !== null
                                ? (interaction.type === 'resize' ? 'nwse-resize' : 'grabbing')
                                : 'crosshair',
                              userSelect: 'none',
                            }}
                            onMouseDown={(e) => handleMouseDown(e, pageNumber)}
                            onMouseMove={(e) => handleMouseMove(e, pageNumber)}
                            onMouseUp={(e) => handleMouseUp(e, pageNumber)}
                            onPointerMove={handlePointerMove}
                            onPointerUp={() => setInteraction({ index: null, type: null })}
                            onPointerLeave={() => setInteraction({ index: null, type: null })}
                          >
                            <Page
                              pageNumber={pageNumber}
                              width={Math.min(windowWidth - 80, 550)}
                              renderTextLayer={false}
                              renderAnnotationLayer={false}
                            />

                            {/* Drawing preview */}
                            {isDrawing && currentPageRef.current === pageNumber && drawingBox && (
                              <div
                                className="uv-drawing-preview"
                                style={{
                                  left: `${drawingBox.nx * 100}%`,
                                  top: `${drawingBox.ny * 100}%`,
                                  width: `${drawingBox.nw * 100}%`,
                                  height: `${drawingBox.nh * 100}%`,
                                }}
                              />
                            )}

                            {/* Fields */}
                            {pageFields.map((field) => {
                              const color = getMarkerColor(field);
                              const isActive = interaction.index === field.globalIndex;
                              const isEditing = editingSuggestionId === field.id;
                              const borderStyle = field.confirmed ? `2px solid ${color}` : `2px dashed ${color}`;

                              return (
                                <div
                                  key={field.id}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setInteraction({ index: field.globalIndex, type: 'move' });
                                  }}
                                  style={{
                                    position: 'absolute',
                                    left: `${(field.nx + field.nw / 2) * 100}%`,
                                    top: `${(field.ny + field.nh / 2) * 100}%`,
                                    transform: 'translate(-50%, -50%)',
                                    width: `${field.nw * 100}%`,
                                    height: `${field.nh * 100}%`,
                                    border: borderStyle,
                                    backgroundColor: `${color}18`,
                                    borderRadius: 4,
                                    boxSizing: 'border-box',
                                    pointerEvents: 'all',
                                    zIndex: 10,
                                    cursor: isActive && interaction.type === 'move' ? 'grabbing' : 'grab',
                                    color,
                                  }}
                                >
                                  {/* Label chip */}
                                  <span className="uv-field-label-chip" style={{ color }}>
                                    {!field.confirmed && '✦ '}{field.label || field.type}
                                  </span>

                                  {/* Inline label editor */}
                                  {isEditing && (
                                    <div className="uv-inline-editor" onMouseDown={(e) => e.stopPropagation()}>
                                      <input
                                        autoFocus
                                        className="uv-inline-input"
                                        value={editingLabel}
                                        onChange={(e) => setEditingLabel(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') approveSuggestion(field.id);
                                          if (e.key === 'Escape') setEditingSuggestionId(null);
                                        }}
                                        placeholder="Field label…"
                                      />
                                      <button className="uv-inline-save" onClick={() => approveSuggestion(field.id)}>✓</button>
                                    </div>
                                  )}

                                  {/* Action buttons */}
                                  <div className="uv-field-actions">
                                    {!field.confirmed && (
                                      <button
                                        title="Approve"
                                        onClick={(e) => { e.stopPropagation(); approveSuggestion(field.id); }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        className="uv-field-icon-btn"
                                        style={{ background: '#2d8a50', color: '#fff' }}
                                      >✓</button>
                                    )}
                                    {!field.confirmed && field.type === 'customText' && (
                                      <button
                                        title="Edit label"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingSuggestionId(isEditing ? null : field.id);
                                          setEditingLabel(field.label);
                                        }}
                                        className="uv-field-icon-btn"
                                        style={{ background: '#2563eb', color: '#fff' }}
                                      >✎</button>
                                    )}
                                    <button
                                      title="Remove"
                                      onClick={(e) => { e.stopPropagation(); handleRemoveField(field.id); }}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onPointerDown={(e) => e.stopPropagation()}
                                      className="uv-field-icon-btn"
                                      style={{ background: '#dc2626', color: '#fff' }}
                                    >×</button>
                                  </div>

                                  {/* Resize handle */}
                                  <div
                                    title="Resize"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setInteraction({ index: field.globalIndex, type: 'resize' });
                                    }}
                                    className="uv-resize-handle"
                                    style={{ backgroundColor: color }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </Document>
                  </div>
                </>
              )}

              {/* ── Generated link ── */}
              {generatedLink && (
                <div className="uv-link-card">
                  <p className="uv-link-label">✓ Document ready — share this link</p>
                  <div className="uv-link-row">
                    <input type="text" value={generatedLink} readOnly className="uv-link-input" />
                    <button onClick={copyToClipboard} className="uv-copy-btn">
                      {isCopied ? '✓ Copied' : 'Copy Link'}
                    </button>
                    <button onClick={shareOnWhatsApp} className="uv-wa-btn">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                      WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Sticky footer ── */}
        {fileUrl && !generatedLink && (
          <div className="uv-footer">
            <div className="uv-footer-inner">
              <p className="uv-footer-status">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9e7d52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                <span><span className="uv-footer-count">{fields.filter((f) => f.confirmed).length}</span> field{fields.filter((f) => f.confirmed).length !== 1 ? 's' : ''} placed</span>
                {fields.some((f) => !f.confirmed) && (
                  <span className="uv-pending-badge">{fields.filter((f) => !f.confirmed).length} AI pending</span>
                )}
              </p>
              <button
                onClick={handleUpload}
                disabled={uploading || fields.filter((f) => f.confirmed).length === 0}
                className="uv-upload-btn"
              >
                {uploading ? 'Uploading…' : 'Upload & Generate Link'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UploadView;