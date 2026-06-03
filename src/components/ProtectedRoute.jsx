import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, userProfile, loading, logout } = useAuth();

  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
          .sf-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f7f6f3;
            font-family: 'DM Sans', sans-serif;
          }
          .sf-spinner {
            width: 32px; height: 32px;
            border: 2px solid #e5e5e0;
            border-top-color: #9e7d52;
            border-radius: 50%;
            animation: sf-spin 0.8s linear infinite;
          }
          @keyframes sf-spin { to { transform: rotate(360deg); } }
        `}</style>
        <div className="sf-loading"><div className="sf-spinner" /></div>
      </>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;

  if (!userProfile || userProfile.status !== 'approved') {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
          .sf-pending-root {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f7f6f3;
            font-family: 'DM Sans', sans-serif;
            padding: 2rem;
          }
          .sf-pending-card {
            width: 100%;
            max-width: 420px;
            background: #ffffff;
            border: 1px solid #ebebea;
            border-radius: 18px;
            padding: 2.8rem 2.4rem;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          }
          .sf-pending-icon {
            width: 60px; height: 60px;
            border-radius: 50%;
            background: rgba(158, 125, 82, 0.12);
            border: 1px solid rgba(158, 125, 82, 0.25);
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 1.6rem;
          }
          .sf-pending-title {
            font-family: 'DM Serif Display', serif;
            font-size: 1.7rem;
            color: #1a1a1e;
            margin-bottom: 0.75rem;
          }
          .sf-pending-desc {
            font-size: 0.9rem;
            color: #6b6b72;
            line-height: 1.7;
            font-weight: 300;
            margin-bottom: 2rem;
          }
          .sf-pending-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(158, 125, 82, 0.1);
            border: 1px solid rgba(158, 125, 82, 0.2);
            border-radius: 100px;
            padding: 0.3rem 1rem;
            font-size: 0.78rem;
            color: #9e7d52;
            font-weight: 500;
            letter-spacing: 0.05em;
            margin-bottom: 2rem;
          }
          .sf-pending-badge span {
            width: 6px; height: 6px;
            border-radius: 50%;
            background: #9e7d52;
            animation: sf-pulse 1.8s ease-in-out infinite;
          }
          @keyframes sf-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          .sf-pending-btn {
            width: 100%;
            background: #1a1a1e;
            border: none;
            border-radius: 10px;
            padding: 0.85rem 1rem;
            font-family: 'DM Sans', sans-serif;
            font-size: 0.92rem;
            font-weight: 500;
            color: #f5f0e8;
            cursor: pointer;
            transition: background 0.18s;
          }
          .sf-pending-btn:hover { background: #2e2e34; }
        `}</style>
        <div className="sf-pending-root">
          <div className="sf-pending-card">
            <div className="sf-pending-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c8b99a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h2 className="sf-pending-title">Account Pending</h2>
            <p className="sf-pending-desc">
              Your account is waiting for administrator review. You'll be notified once access has been granted.
            </p>
            <div className="sf-pending-badge">
              <span />
              Awaiting approval
            </div>
            <button onClick={logout} className="sf-pending-btn">Sign Out</button>
          </div>
        </div>
      </>
    );
  }

  return children;
};

export default ProtectedRoute;