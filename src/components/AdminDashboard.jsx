import React from 'react';
import {
  Search, Calendar, SlidersHorizontal, X, Pencil, Trash2,
  FileText, CheckCircle2, Loader2, Eye, Link2, AlertTriangle,
} from 'lucide-react';
import StatusBadge from './ui/StatusBadge';
import { useAdminDashboard } from '../hooks/useAdminDashboard';

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: 'Asia/Jerusalem',
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso));
};

export default function AdminDashboard() {
  const {
    activeTab, setActiveTab,
    users, loadingUsers,
    handleApproveUser, handleRevokeUser,
    userProfile, logout,
    documents, loading,
    startDate, setStartDate,
    endDate, setEndDate,
    isEditing, setIsEditing,
    newFileName, setNewFileName,
    copiedId, deletingIds,
    handleFilter, clearFilters,
    handleActionPreCheck, handleCopyLink, handleDelete,
    openEditModal, handleEditSubmit,
    selectedUser, paymentAmount, setPaymentAmount,
    monthsToAdd, setMonthsToAdd,
    paymentHistory, loadingPayments,
    openUserModal, closeUserModal,
    handleAddPayment, handleToggleBlock,
  } = useAdminDashboard();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .dash-root {
          min-height: 100vh;
          background: #f7f6f3;
          font-family: 'DM Sans', sans-serif;
          color: #1a1a1e;
        }

        /* ── Topbar ── */
        .dash-topbar {
          background: #ffffff;
          border-bottom: 1px solid #ebebea;
          padding: 0 1.5rem;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .dash-logo {
          font-family: 'DM Serif Display', serif;
          font-size: 1.3rem;
          color: #1a1a1e;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
        }
        .dash-logo img { width: 24px; height: 24px; flex-shrink: 0; object-fit: contain; }
        .dash-logo em { font-style: italic; color: #9e7d52; }

        .dash-topbar-right { display: flex; align-items: center; gap: 0.75rem; }

        .dash-greeting {
          font-size: 0.84rem;
          color: #9090a0;
          font-weight: 300;
          margin-right: 0.25rem;
        }

        .btn-primary {
          background: #1a1a1e;
          color: #f5f0e8;
          border: none;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: #2e2e34; }

        .btn-ghost {
          background: transparent;
          color: #6b6b72;
          border: 1px solid #e5e5e0;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 400;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .btn-ghost:hover { background: #f7f6f3; border-color: #d0d0ca; }

        /* ── Main layout ── */
        .dash-main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
        }

        .dash-header { margin-bottom: 1.8rem; }
        .dash-title {
          font-family: 'DM Serif Display', serif;
          font-size: 2rem;
          color: #1a1a1e;
          margin-bottom: 0.2rem;
          font-weight: 400;
        }
        .dash-subtitle { font-size: 0.88rem; color: #9090a0; font-weight: 300; }

        /* ── Tabs ── */
        .dash-tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid #ebebea;
          margin-bottom: 1.8rem;
        }
        .dash-tab {
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 0.7rem 1.2rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 400;
          color: #9090a0;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
          margin-bottom: -1px;
        }
        .dash-tab:hover { color: #1a1a1e; }
        .dash-tab.active { color: #1a1a1e; border-bottom-color: #9e7d52; font-weight: 500; }

        /* ── Filter card ── */
        .filter-card {
          background: #ffffff;
          border: 1px solid #ebebea;
          border-radius: 14px;
          padding: 1.4rem 1.6rem;
          margin-bottom: 1.2rem;
        }
        .filter-card-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.2rem;
        }
        .filter-card-title { font-size: 0.88rem; font-weight: 500; color: #1a1a1e; }

        .filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: flex-end;
        }

        .filter-field { display: flex; flex-direction: column; gap: 0.4rem; flex: 1; min-width: 160px; }

        .filter-label {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #9090a0;
        }

        .filter-input-wrap { position: relative; }
        .filter-input-icon {
          position: absolute;
          left: 0.65rem;
          top: 50%;
          transform: translateY(-50%);
          color: #c0c0b8;
          pointer-events: none;
          display: flex;
        }
        .filter-input {
          width: 100%;
          border: 1px solid #e5e5e0;
          border-radius: 8px;
          padding: 0.55rem 0.75rem 0.55rem 2.1rem;
          font-size: 0.88rem;
          font-family: 'DM Sans', sans-serif;
          color: #1a1a1e;
          background: #fafaf8;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
        }
        .filter-input:focus { border-color: #9e7d52; box-shadow: 0 0 0 3px rgba(158, 125, 82, 0.1); }

        .filter-actions { display: flex; gap: 0.5rem; align-items: flex-end; }

        .btn-search {
          display: flex; align-items: center; gap: 0.4rem;
          background: #1a1a1e; color: #f5f0e8;
          border: none; border-radius: 8px;
          padding: 0.58rem 1rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.84rem; font-weight: 500;
          cursor: pointer; white-space: nowrap;
          transition: background 0.15s;
        }
        .btn-search:hover { background: #2e2e34; }

        .btn-clear {
          display: flex; align-items: center; gap: 0.3rem;
          background: transparent; color: #6b6b72;
          border: 1px solid #e5e5e0; border-radius: 8px;
          padding: 0.58rem 0.85rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.84rem; font-weight: 400;
          cursor: pointer; white-space: nowrap;
          transition: background 0.15s;
        }
        .btn-clear:hover { background: #f7f6f3; }

        /* ── Table card ── */
        .table-card {
          background: #ffffff;
          border: 1px solid #ebebea;
          border-radius: 14px;
          overflow: hidden;
        }

        .table-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.1rem 1.6rem;
          border-bottom: 1px solid #ebebea;
        }
        .table-meta-title {
          font-size: 0.88rem;
          font-weight: 500;
          color: #1a1a1e;
        }
        .table-count {
          font-size: 0.8rem;
          color: #9090a0;
          font-weight: 300;
          margin-left: 0.4rem;
        }

        .table-scroll { overflow-x: auto; }

        table { width: 100%; border-collapse: collapse; }

        thead tr { background: #fafaf8; }
        thead th {
          padding: 0.75rem 1.1rem;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #9090a0;
          text-align: left;
          white-space: nowrap;
          border-bottom: 1px solid #ebebea;
        }
        thead th.align-right { text-align: right; }

        tbody tr {
          border-bottom: 1px solid #f3f3f0;
          transition: background 0.1s;
        }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: #fafaf8; }
        tbody tr.ghost-row { background: #fdf8f5; }
        tbody tr.ghost-row:hover { background: #faf2ec; }

        td {
          padding: 0.9rem 1.1rem;
          font-size: 0.88rem;
          color: #1a1a1e;
          vertical-align: middle;
        }
        td.muted { color: #9090a0; font-weight: 300; white-space: nowrap; }

        /* File name cell */
        .file-name-cell { display: flex; align-items: center; gap: 0.65rem; max-width: 320px; }
        .file-icon-wrap {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: #f3f3f0;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .file-icon-wrap.ghost { background: #fff0ec; }
        .file-name-link {
          color: #1a1a1e;
          text-decoration: none;
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .file-name-link:hover { color: #9e7d52; text-decoration: underline; }
        .file-name-ghost { color: #c0674d; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Action buttons */
        .action-cell { text-align: right; }
        .action-btns { display: flex; align-items: center; justify-content: flex-end; gap: 0.2rem; }

        .icon-btn {
          width: 32px; height: 32px;
          border-radius: 7px;
          border: none;
          background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #c0c0b8;
          transition: background 0.15s, color 0.15s;
        }
        .icon-btn:hover { background: #f3f3f0; color: #1a1a1e; }
        .icon-btn.green:hover { background: #edf7f0; color: #2d8a50; }
        .icon-btn.amber:hover { background: #fef5ec; color: #9e7d52; }
        .icon-btn.red:hover { background: #fdf0ee; color: #c0674d; }
        .icon-btn.active-copy { background: #edf7f0; color: #2d8a50; }
        .icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Empty / loading states */
        .state-cell { padding: 3rem 1rem; text-align: center; }
        .state-icon {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: #f3f3f0;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 0.9rem;
        }
        .state-title { font-size: 0.9rem; font-weight: 500; color: #6b6b72; margin-bottom: 0.3rem; }
        .state-sub { font-size: 0.82rem; color: #b0b0a8; font-weight: 300; }

        /* Users tab badges */
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 0.2rem 0.7rem;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
        }
        .badge-approved { background: #edf7f0; color: #2d8a50; }
        .badge-pending  { background: #fef5ec; color: #9e7d52; }

        .user-meta { font-size: 0.78rem; color: #9090a0; font-weight: 300; margin-top: 0.2rem; }

        .btn-approve {
          background: #edf7f0; color: #2d8a50;
          border: none; border-radius: 7px;
          padding: 0.35rem 0.75rem;
          font-size: 0.78rem; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: background 0.15s;
          white-space: nowrap;
        }
        .btn-approve:hover { background: #d8f0e0; }

        .btn-revoke {
          background: #fdf0ee; color: #c0674d;
          border: none; border-radius: 7px;
          padding: 0.35rem 0.75rem;
          font-size: 0.78rem; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: background 0.15s;
          white-space: nowrap;
        }
        .btn-revoke:hover { background: #f9e0da; }

        .btn-manage {
          background: #1a1a1e; color: #f5f0e8;
          border: none; border-radius: 7px;
          padding: 0.35rem 0.75rem;
          font-size: 0.78rem; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: background 0.15s;
          white-space: nowrap;
          margin-right: 0.35rem;
        }
        .btn-manage:hover { background: #2e2e34; }

        .user-action-cell { text-align: right; white-space: nowrap; }

        /* ── Modals ── */
        .modal-backdrop {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(10, 10, 12, 0.55);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 1.5rem;
        }

        .modal-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 2rem;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.18);
        }
        .modal-card.wide { max-width: 520px; max-height: 88vh; overflow-y: auto; }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.6rem;
        }
        .modal-title-group { display: flex; align-items: center; gap: 0.75rem; }
        .modal-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: #fef5ec;
          display: flex; align-items: center; justify-content: center;
        }
        .modal-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.2rem;
          color: #1a1a1e;
          font-weight: 400;
        }
        .modal-close {
          background: none; border: none; cursor: pointer;
          color: #9090a0; padding: 0.2rem;
          border-radius: 6px; transition: color 0.15s, background 0.15s;
          display: flex;
        }
        .modal-close:hover { color: #1a1a1e; background: #f3f3f0; }

        .modal-label {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #9090a0;
          display: block;
          margin-bottom: 0.5rem;
        }

        .modal-input {
          width: 100%;
          border: 1px solid #e5e5e0;
          border-radius: 9px;
          padding: 0.7rem 0.9rem;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          color: #1a1a1e;
          background: #fafaf8;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          margin-bottom: 1.6rem;
        }
        .modal-input:focus { border-color: #9e7d52; box-shadow: 0 0 0 3px rgba(158, 125, 82, 0.1); }

        .modal-footer { display: flex; gap: 0.6rem; justify-content: flex-end; }

        .btn-cancel {
          background: transparent; color: #6b6b72;
          border: 1px solid #e5e5e0; border-radius: 9px;
          padding: 0.65rem 1.1rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem; font-weight: 400;
          cursor: pointer; transition: background 0.15s;
        }
        .btn-cancel:hover { background: #f7f6f3; }

        .btn-save {
          background: #1a1a1e; color: #f5f0e8;
          border: none; border-radius: 9px;
          padding: 0.65rem 1.3rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
        }
        .btn-save:hover { background: #2e2e34; }

        /* User modal specifics */
        .user-stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1.6rem;
        }
        .user-stat {
          background: #fafaf8;
          border: 1px solid #f0f0ea;
          border-radius: 10px;
          padding: 0.85rem 1rem;
        }
        .user-stat-label { font-size: 0.72rem; color: #9090a0; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 500; margin-bottom: 0.3rem; }
        .user-stat-value { font-size: 1.1rem; font-weight: 500; color: #1a1a1e; }

        .payment-section {
          background: #fafaf8;
          border: 1px solid #f0f0ea;
          border-radius: 12px;
          padding: 1.2rem;
          margin-bottom: 1.4rem;
        }
        .payment-section-title { font-size: 0.84rem; font-weight: 500; color: #1a1a1e; margin-bottom: 1rem; }

        .payment-row { display: flex; gap: 0.65rem; margin-bottom: 0.9rem; }
        .payment-field { flex: 1; }
        .payment-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.07em; color: #9090a0; font-weight: 500; margin-bottom: 0.4rem; display: block; }
        .payment-input {
          width: 100%;
          border: 1px solid #e5e5e0;
          border-radius: 8px;
          padding: 0.55rem 0.8rem;
          font-size: 0.88rem;
          font-family: 'DM Sans', sans-serif;
          color: #1a1a1e;
          background: #ffffff;
          outline: none;
          transition: border-color 0.15s;
        }
        .payment-input:focus { border-color: #9e7d52; }

        .btn-record {
          width: 100%;
          background: #1a1a1e; color: #f5f0e8;
          border: none; border-radius: 9px;
          padding: 0.65rem 1rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
        }
        .btn-record:hover { background: #2e2e34; }

        .payment-history-title { font-size: 0.84rem; font-weight: 500; color: #1a1a1e; margin-bottom: 0.8rem; }
        .payment-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.75rem 0.9rem;
          background: #fafaf8;
          border: 1px solid #f0f0ea;
          border-radius: 9px;
          margin-bottom: 0.5rem;
        }
        .payment-amount { font-size: 0.9rem; font-weight: 500; color: #1a1a1e; }
        .payment-date { font-size: 0.78rem; color: #9090a0; font-weight: 300; }
        .months-badge {
          font-size: 0.75rem; font-weight: 500;
          background: #edf7f0; color: #2d8a50;
          padding: 0.2rem 0.65rem; border-radius: 100px;
        }

        .access-row {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 1.2rem;
          border-top: 1px solid #f0f0ea;
          margin-top: 1.4rem;
        }
        .access-label { font-size: 0.88rem; font-weight: 500; color: #1a1a1e; }
        .access-sub { font-size: 0.78rem; color: #9090a0; font-weight: 300; margin-top: 0.15rem; }

        .btn-block {
          background: #fdf0ee; color: #c0674d;
          border: none; border-radius: 9px;
          padding: 0.5rem 1rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.84rem; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
        }
        .btn-block:hover { background: #f9e0da; }

        .btn-unblock {
          background: #edf7f0; color: #2d8a50;
          border: none; border-radius: 9px;
          padding: 0.5rem 1rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.84rem; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
        }
        .btn-unblock:hover { background: #d8f0e0; }

        .divider { border: none; border-top: 1px solid #f0f0ea; margin: 1.4rem 0; }

        /* Responsive */
        @media (max-width: 600px) {
          .dash-main { padding: 1.2rem 1rem 3rem; }
          .dash-greeting { display: none; }
          .filter-row { flex-direction: column; }
          .filter-field { min-width: 100%; }
          .filter-actions { width: 100%; }
          .btn-search, .btn-clear { flex: 1; justify-content: center; }
          .user-stat-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="dash-root">


        {/* Main */}
        <main className="dash-main">
          <div className="dash-header">
            <h1 className="dash-title">Dashboard</h1>
            <p className="dash-subtitle">Manage documents and workspace access</p>
          </div>

          {/* Tabs */}
          <div className="dash-tabs">
            <button className={`dash-tab${activeTab === 'documents' ? ' active' : ''}`} onClick={() => setActiveTab('documents')}>
              Documents
            </button>
            {userProfile?.role === 'superAdmin' && (
              <button className={`dash-tab${activeTab === 'users' ? ' active' : ''}`} onClick={() => setActiveTab('users')}>
                Users &amp; Approvals
              </button>
            )}
          </div>

          {/* ── Documents Tab ── */}
          {activeTab === 'documents' && (
            <>
              {/* Filter */}
              <div className="filter-card">
                <div className="filter-card-header">
                  <SlidersHorizontal size={15} color="#9e7d52" />
                  <span className="filter-card-title">Filter by date</span>
                </div>
                <form onSubmit={handleFilter} className="filter-row">
                  <div className="filter-field">
                    <label className="filter-label">Start Date</label>
                    <div className="filter-input-wrap">
                      <span className="filter-input-icon"><Calendar size={14} /></span>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="filter-input" />
                    </div>
                  </div>
                  <div className="filter-field">
                    <label className="filter-label">End Date</label>
                    <div className="filter-input-wrap">
                      <span className="filter-input-icon"><Calendar size={14} /></span>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="filter-input" />
                    </div>
                  </div>
                  <div className="filter-actions">
                    <button type="submit" className="btn-search"><Search size={14} />Search</button>
                    <button type="button" onClick={clearFilters} className="btn-clear"><X size={14} />Clear</button>
                  </div>
                </form>
              </div>

              {/* Table */}
              <div className="table-card">
                <div className="table-meta">
                  <span className="table-meta-title">
                    Documents
                    {!loading && <span className="table-count">({documents.length} records)</span>}
                  </span>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th className="align-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && (
                        <tr>
                          <td colSpan="4" className="state-cell">
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                              <Loader2 size={24} color="#9e7d52" className="animate-spin" style={{ animation: 'spin 0.8s linear infinite' }} />
                              <span style={{ fontSize: '0.88rem', color: '#9090a0' }}>Loading documents…</span>
                            </div>
                          </td>
                        </tr>
                      )}
                      {!loading && documents.length === 0 && (
                        <tr>
                          <td colSpan="4" className="state-cell">
                            <div className="state-icon"><FileText size={22} color="#c0c0b8" /></div>
                            <p className="state-title">No documents found</p>
                            <p className="state-sub">Try adjusting your filters or upload a new document.</p>
                          </td>
                        </tr>
                      )}
                      {!loading && documents.map((docObj) => (
                        <tr key={docObj.id} className={docObj._isGhost ? 'ghost-row' : ''}>
                          <td>
                            <div className="file-name-cell">
                              <div className={`file-icon-wrap${docObj._isGhost ? ' ghost' : ''}`}>
                                {docObj._isGhost
                                  ? <AlertTriangle size={15} color="#c0674d" />
                                  : <FileText size={15} color="#9e7d52" />}
                              </div>
                              {docObj._isGhost ? (
                                <span className="file-name-ghost" title="Ghost record — missing files or corrupted">
                                  {docObj.fileName || `[Corrupted: ${docObj.id.slice(0, 8)}…]`}
                                </span>
                              ) : docObj.signedPdfUrl ? (
                                <a href={docObj.signedPdfUrl} target="_blank" rel="noopener noreferrer"
                                   onClick={(e) => handleActionPreCheck(e, docObj.id)}
                                   className="file-name-link" title={docObj.fileName}>
                                  {docObj.fileName}
                                </a>
                              ) : (
                                <span className="file-name-link" title={docObj.fileName}>{docObj.fileName}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            {docObj._isGhost
                              ? <span className="badge" style={{ background: '#fdf0ee', color: '#c0674d' }}><AlertTriangle size={11} style={{ marginRight: 4 }} />Ghost</span>
                              : <StatusBadge status={docObj.status} />}
                          </td>
                          <td className="muted">{formatDate(docObj.createdAt)}</td>
                          <td className="action-cell">
                            <div className="action-btns">
                              {((docObj.status || '').toLowerCase() === 'signed' && docObj.signedPdfUrl) ? (
                                <a href={docObj.signedPdfUrl} target="_blank" rel="noopener noreferrer"
                                   onClick={(e) => handleActionPreCheck(e, docObj.id)}
                                   className="icon-btn green" title="View signed PDF" style={{ textDecoration: 'none' }}>
                                  <Eye size={15} />
                                </a>
                              ) : (
                                <button onClick={() => handleCopyLink(docObj.id)} title="Copy signing link"
                                        className={`icon-btn${copiedId === docObj.id ? ' active-copy' : ' green'}`}>
                                  {copiedId === docObj.id ? <CheckCircle2 size={15} /> : <Link2 size={15} />}
                                </button>
                              )}
                              <button onClick={() => openEditModal(docObj)} title="Rename document" className="icon-btn amber">
                                <Pencil size={15} />
                              </button>
                              <button onClick={() => handleDelete(docObj)} title="Delete document"
                                      disabled={deletingIds.has(docObj.id)} className="icon-btn red">
                                {deletingIds.has(docObj.id) ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={15} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── Users Tab ── */}
          {activeTab === 'users' && userProfile?.role === 'superAdmin' && (
            <div className="table-card">
              <div className="table-meta">
                <span className="table-meta-title">
                  Users &amp; Approvals
                  {!loadingUsers && <span className="table-count">({users.length} records)</span>}
                </span>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Details</th>
                      <th className="align-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr><td colSpan="5" className="state-cell" style={{ color: '#9090a0', fontSize: '0.88rem' }}>Loading…</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan="5" className="state-cell"><p className="state-title">No users found</p></td></tr>
                    ) : users.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</td>
                        <td className="muted">{u.email}</td>
                        <td>
                          <span className={`badge ${u.status?.toLowerCase() === 'approved' ? 'badge-approved' : 'badge-pending'}`}>
                            {u.status?.toLowerCase() === 'approved' ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: '#1a1a1e' }}>{u.role}</span>
                          <div className="user-meta">Uploads: {u.uploadCount || 0}</div>
                          <div className="user-meta">Sub ends: {formatDate(u.subscriptionEnd)}</div>
                        </td>
                        <td className="user-action-cell">
                          <button onClick={() => openUserModal(u)} className="btn-manage">Manage Access</button>
                          {u.status?.toLowerCase() === 'pending' && (
                            <button onClick={() => handleApproveUser(u.id)} className="btn-approve">Approve</button>
                          )}
                          {u.status?.toLowerCase() === 'approved' && u.role !== 'superAdmin' && (
                            <button onClick={() => handleRevokeUser(u.id)} className="btn-revoke">Revoke</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Rename Modal ── */}
      {isEditing && (
        <div className="modal-backdrop" onClick={() => setIsEditing(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon"><Pencil size={17} color="#9e7d52" /></div>
                <h2 className="modal-title">Rename Document</h2>
              </div>
            </div>
            <label className="modal-label">New file name</label>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
              autoFocus
              placeholder="document-name.pdf"
              className="modal-input"
            />
            <div className="modal-footer">
              <button onClick={() => setIsEditing(false)} className="btn-cancel">Cancel</button>
              <button onClick={handleEditSubmit} className="btn-save">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage User Modal ── */}
      {selectedUser && (
        <div className="modal-backdrop" onClick={closeUserModal}>
          <div className="modal-card wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Manage: {selectedUser.firstName} {selectedUser.lastName}</h2>
              <button className="modal-close" onClick={closeUserModal}><X size={18} /></button>
            </div>

            <div className="user-stat-grid">
              <div className="user-stat">
                <div className="user-stat-label">Uploads</div>
                <div className="user-stat-value">{selectedUser.uploadCount || 0}</div>
              </div>
              <div className="user-stat">
                <div className="user-stat-label">Subscription ends</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 500, color: '#1a1a1e', marginTop: 4 }}>{formatDate(selectedUser.subscriptionEnd)}</div>
              </div>
            </div>

            <div className="payment-section">
              <div className="payment-section-title">Add Payment &amp; Extend</div>
              <div className="payment-row">
                <div className="payment-field">
                  <label className="payment-label">Amount (₪)</label>
                  <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="payment-input" />
                </div>
                <div className="payment-field">
                  <label className="payment-label">Months to add</label>
                  <input type="number" value={monthsToAdd} onChange={(e) => setMonthsToAdd(e.target.value)} className="payment-input" />
                </div>
              </div>
              <button onClick={handleAddPayment} className="btn-record">Record Payment</button>
            </div>

            <div>
              <div className="payment-history-title">Payment History</div>
              {loadingPayments ? (
                <p style={{ fontSize: '0.84rem', color: '#9090a0' }}>Loading…</p>
              ) : paymentHistory.length === 0 ? (
                <p style={{ fontSize: '0.84rem', color: '#9090a0', fontWeight: 300, fontStyle: 'italic' }}>No payments recorded.</p>
              ) : paymentHistory.map(p => (
                <div key={p.id} className="payment-item">
                  <div>
                    <div className="payment-amount">₪{p.amount}</div>
                    <div className="payment-date">{formatDate(p.createdAt)}</div>
                  </div>
                  <span className="months-badge">+{p.monthsAdded} months</span>
                </div>
              ))}
            </div>

            <div className="access-row">
              <div>
                <div className="access-label">Site Access</div>
                <div className="access-sub">{selectedUser.isBlocked ? 'User is manually blocked.' : 'User has normal access.'}</div>
              </div>
              <button onClick={handleToggleBlock} className={selectedUser.isBlocked ? 'btn-unblock' : 'btn-block'}>
                {selectedUser.isBlocked ? 'Unblock Access' : 'Block Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}