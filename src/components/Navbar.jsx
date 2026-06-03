import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAVBAR_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  .nav-topbar {
    background: #ffffff;
    border-bottom: 1px solid #ebebea;
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2rem;
    position: sticky;
    top: 0;
    z-index: 50;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Logo ── */
  .nav-logo {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    text-decoration: none;
    flex-shrink: 0;
  }

  .nav-logo-img-wrap {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: #1a1a1e;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
  }
  .nav-logo-img-wrap img {
    width: 18px;
    height: 18px;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }

  .nav-logo-wordmark {
    font-family: 'DM Serif Display', serif;
    font-size: 1.2rem;
    line-height: 1;
    color: #1a1a1e;
    display: flex;
    align-items: baseline;
    gap: 0;
  }
  .nav-logo-wordmark em {
    font-style: italic;
    color: #9e7d52;
  }

  /* hide wordmark on very small screens */
  @media (max-width: 380px) {
    .nav-logo-wordmark { display: none; }
  }

  /* ── Divider ── */
  .nav-divider {
    width: 1px;
    height: 18px;
    background: #e5e5e0;
    margin: 0 0.25rem;
    flex-shrink: 0;
  }
  @media (max-width: 480px) {
    .nav-divider { display: none; }
  }

  /* ── Right side ── */
  .nav-right {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .nav-greeting {
    font-size: 0.8rem;
    color: #a0a0aa;
    font-weight: 300;
    letter-spacing: 0.01em;
    white-space: nowrap;
  }
  /* hide greeting below 600px */
  @media (max-width: 600px) {
    .nav-greeting { display: none; }
  }

  /* Ghost button */
  .nav-btn-ghost {
    background: transparent;
    border: 1px solid #e5e5e0;
    border-radius: 8px;
    padding: 0.36rem 0.85rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 500;
    color: #9090a0;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
    white-space: nowrap;
  }
  .nav-btn-ghost:hover {
    border-color: #c4a97a;
    color: #9e7d52;
    background: #fdf8f2;
  }

  /* Primary button */
  .nav-btn-primary {
    background: #1a1a1e;
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 0.36rem 0.9rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 500;
    color: #f5f0e8;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .nav-btn-primary:hover { background: #2e2e38; }

  .nav-btn-primary .btn-icon,
  .nav-btn-ghost .btn-icon {
    width: 13px;
    height: 13px;
    opacity: 0.7;
    flex-shrink: 0;
  }

  /* On very small screens shrink padding */
  @media (max-width: 420px) {
    .nav-topbar { padding: 0 1rem; }
    .nav-btn-primary,
    .nav-btn-ghost { padding: 0.36rem 0.65rem; font-size: 0.74rem; }
  }
`;

/* Tiny inline SVG icons — no external dependency */
const IconUpload = () => (
  <svg className="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 10V3M5 6l3-3 3 3"/>
    <path d="M3 12h10"/>
  </svg>
);

const IconGrid = () => (
  <svg className="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="5" height="5" rx="1"/>
    <rect x="9" y="2" width="5" height="5" rx="1"/>
    <rect x="2" y="9" width="5" height="5" rx="1"/>
    <rect x="9" y="9" width="5" height="5" rx="1"/>
  </svg>
);

const Navbar = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  const onDashboard = location.pathname === '/dashboard';

  return (
    <>
      <style>{NAVBAR_STYLES}</style>
      <header className="nav-topbar">

        {/* Logo */}
        <Link to="/" className="nav-logo" aria-label="SignFlow home">
          <div className="nav-logo-img-wrap">
            <img src="/favicon.svg" alt="" aria-hidden="true" />
          </div>
          <span className="nav-logo-wordmark">
            Sign<em>Flow</em>
          </span>
        </Link>

        {/* Right section — only when logged in */}
        {currentUser && userProfile && (
          <div className="nav-right">
            {userProfile?.firstName && (
              <span className="nav-greeting">Hello, {userProfile.firstName}</span>
            )}

            <div className="nav-divider" aria-hidden="true" />

            {onDashboard ? (
              <button
                onClick={() => navigate('/')}
                className="nav-btn-primary"
                aria-label="Upload a document"
              >
                <IconUpload />
                Upload
              </button>
            ) : (
              <button
                onClick={() => navigate('/dashboard')}
                className="nav-btn-primary"
                aria-label="Go to dashboard"
              >
                <IconGrid />
                Dashboard
              </button>
            )}

            <button onClick={logout} className="nav-btn-ghost">
              Sign out
            </button>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;