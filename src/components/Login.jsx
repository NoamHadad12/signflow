import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AUTH_ERRORS = {
  'auth/user-not-found':         'No account found with this email address.',
  'auth/wrong-password':         'Incorrect password. Please try again.',
  'auth/invalid-credential':     'Incorrect email or password.',
  'auth/invalid-email':          'Please enter a valid email address.',
  'auth/too-many-requests':      'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your internet connection.',
};

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate                = useNavigate();
  const { login, currentUser }  = useAuth();

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(AUTH_ERRORS[err.code] || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

        .sf-login-root {
          min-height: 100vh;
          display: flex;
          background: #f7f6f3;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }

        /* Left panel — decorative */
        .sf-panel-left {
          display: none;
          flex: 1;
          background: #f7f6f3;
          position: relative;
          overflow: hidden;
          border-right: 1px solid #ebebea;
        }
        @media (min-width: 900px) { .sf-panel-left { display: flex; align-items: center; justify-content: center; } }

        .sf-panel-left-inner {
          padding: 3rem;
          max-width: 440px;
        }

        .sf-wordmark {
          font-family: 'DM Serif Display', serif;
          font-size: 2.6rem;
          color: #1a1a1e;
          letter-spacing: -0.02em;
          margin-bottom: 1.2rem;
          line-height: 1;
        }
        .sf-wordmark em { font-style: italic; color: #9e7d52; }

        .sf-tagline {
          font-size: 0.95rem;
          color: #6b6b72;
          line-height: 1.7;
          margin-bottom: 3rem;
          font-weight: 300;
        }

        .sf-feature-list { list-style: none; padding: 0; margin: 0; }
        .sf-feature-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 1.2rem;
          font-size: 0.88rem;
          color: #6b6b72;
          font-weight: 300;
          line-height: 1.5;
        }
        .sf-feature-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #9e7d52;
          margin-top: 5px;
          flex-shrink: 0;
        }

        .sf-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        /* Right panel — form */
        .sf-panel-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          background: #ffffff;
        }

        .sf-form-card {
          width: 100%;
          max-width: 400px;
        }

        .sf-form-logo {
          font-family: 'DM Serif Display', serif;
          font-size: 1.9rem;
          color: #1a1a1e;
          margin-bottom: 0.4rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .sf-form-logo img { width: 28px; height: 28px; flex-shrink: 0; object-fit: contain; }

        .sf-form-sub {
          font-size: 0.88rem;
          color: #6b6b72;
          margin-bottom: 2.4rem;
          font-weight: 300;
        }

        .sf-error {
          background: rgba(220, 38, 38, 0.05);
          border: 1px solid rgba(220, 38, 38, 0.15);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.84rem;
          color: #dc2626;
          margin-bottom: 1.4rem;
          text-align: right;
        }

        .sf-field { margin-bottom: 1.2rem; }

        .sf-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: #9090a0;
          margin-bottom: 0.5rem;
        }

        .sf-input-wrap { position: relative; }

        .sf-input {
          width: 100%;
          background: #fafaf8;
          border: 1px solid #e5e5e0;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.92rem;
          color: #1a1a1e;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          transition: border-color 0.18s, box-shadow 0.18s;
          outline: none;
          box-sizing: border-box;
        }
        .sf-input::placeholder { color: #b0b0a8; }
        .sf-input:focus {
          border-color: #9e7d52;
          box-shadow: 0 0 0 3px rgba(158, 125, 82, 0.1);
        }
        .sf-input.has-toggle { padding-right: 3rem; }

        .sf-toggle-pass {
          position: absolute;
          right: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #b0b0a8;
          padding: 0;
          line-height: 1;
          transition: color 0.15s;
        }
        .sf-toggle-pass:hover { color: #1a1a1e; }

        .sf-submit {
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
          transition: background 0.18s, transform 0.1s;
          margin-top: 0.4rem;
          letter-spacing: 0.01em;
        }
        .sf-submit:hover:not(:disabled) { background: #2e2e34; }
        .sf-submit:active:not(:disabled) { transform: scale(0.99); }
        .sf-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .sf-footer-text {
          margin-top: 1.6rem;
          text-align: center;
          font-size: 0.84rem;
          color: #6b6b72;
          font-weight: 300;
        }
        .sf-footer-text a {
          color: #9e7d52;
          text-decoration: none;
          font-weight: 500;
        }
        .sf-footer-text a:hover { text-decoration: underline; }

        .sf-divider {
          border: none;
          border-top: 1px solid #ebebea;
          margin: 2rem 0;
        }
      `}</style>

      <div className="sf-login-root">
        {/* Left decorative panel */}
        <div className="sf-panel-left">
          <div className="sf-grid-bg" />
          <div className="sf-panel-left-inner">
            <div className="sf-wordmark">Sign<em>Flow</em></div>
            <p className="sf-tagline">
              Document signing, simplified. Send, sign, and seal — without the paperwork chaos.
            </p>
            <ul className="sf-feature-list">
              <li><span className="sf-feature-dot" />Place signature fields in seconds with AI detection</li>
              <li><span className="sf-feature-dot" />Protect documents with SMS two-factor authentication</li>
              <li><span className="sf-feature-dot" />Automatically receive the signed PDF the moment it's done</li>
              <li><span className="sf-feature-dot" />Track every document from upload to signature in one dashboard</li>
            </ul>
          </div>
        </div>

        {/* Right form panel */}
        <div className="sf-panel-right">
          <div className="sf-form-card">
            <div className="sf-form-logo">
              <img src="/favicon.svg" alt="SignFlow Logo" />
              SignFlow
            </div>
            <p className="sf-form-sub">Sign in to your workspace</p>

            {error && (
              <div className="sf-error" dir="rtl">{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="sf-field">
                <label className="sf-label">Email address</label>
                <div className="sf-input-wrap">
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="sf-input"
                  />
                </div>
              </div>

              <div className="sf-field">
                <label className="sf-label">Password</label>
                <div className="sf-input-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="sf-input has-toggle"
                  />
                  <button
                    type="button"
                    className="sf-toggle-pass"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="sf-submit">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="sf-footer-text">
              Don't have an account?{' '}
              <Link to="/signup">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;