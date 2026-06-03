import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const AUTH_ERRORS = {
  'auth/email-already-in-use':   'An account with this email address already exists.',
  'auth/invalid-email':          'Please enter a valid email address.',
  'auth/weak-password':          'The password must contain at least 6 characters.',
  'auth/network-request-failed': 'Network error. Check your internet connection.',
};

const SignUp = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const navigate                  = useNavigate();
  const { signup, currentUser }   = useAuth();

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim()) return setError('Please enter a first and last name.');
    if (password !== confirm) return setError('Passwords do not match.');
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
    if (!passwordRegex.test(password)) return setError('Password must be at least 8 characters with uppercase, lowercase, and a number.');
    setLoading(true);
    try {
      const cred = await signup(email, password);
      const userEmail = email.toLowerCase();
      await setDoc(doc(db, 'users', cred.user.uid), {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email: userEmail,
        status: 'pending',
        role: 'user',
        uploadCount: 0,
        subscriptionEnd: null,
        createdAt: new Date().toISOString(),
      });
      navigate('/');
    } catch (err) {
      setError(AUTH_ERRORS[err.code] || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
  const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

        .sf-signup-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7f6f3;
          font-family: 'DM Sans', sans-serif;
          padding: 2rem 1.5rem;
        }

        .sf-signup-card {
          width: 100%;
          max-width: 480px;
          background: #ffffff;
          border: 1px solid #ebebea;
          border-radius: 14px;
          padding: 2.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        .sf-back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.82rem;
          color: #9090a0;
          text-decoration: none;
          margin-bottom: 2rem;
          transition: color 0.15s;
          font-weight: 300;
        }
        .sf-back-link:hover { color: #1a1a1e; }

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

        .sf-row { display: flex; gap: 0.75rem; }
        .sf-row .sf-field { flex: 1; }

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

        .sf-pass-hint {
          font-size: 0.75rem;
          color: #9090a0;
          margin-top: 0.4rem;
          font-weight: 300;
          line-height: 1.5;
        }

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
        .sf-footer-text a { color: #9e7d52; text-decoration: none; font-weight: 500; }
        .sf-footer-text a:hover { text-decoration: underline; }

        @media (max-width: 480px) {
          .sf-row { flex-direction: column; gap: 0; }
          .sf-signup-card { padding: 1.5rem; }
        }
      `}</style>

      <div className="sf-signup-root">
        <div className="sf-signup-card">
          <Link to="/login" className="sf-back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to sign in
          </Link>

          <div className="sf-form-logo">
            <img src="/favicon.svg" alt="SignFlow Logo" />
            SignFlow
          </div>
          <p className="sf-form-sub">Create your account</p>

          {error && <div className="sf-error" dir="rtl">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="sf-row">
              <div className="sf-field">
                <label className="sf-label">First name</label>
                <input type="text" required autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Israel" className="sf-input" />
              </div>
              <div className="sf-field">
                <label className="sf-label">Last name</label>
                <input type="text" required autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Cohen" className="sf-input" />
              </div>
            </div>

            <div className="sf-field">
              <label className="sf-label">Email address</label>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="israel@company.co.il" className="sf-input" />
            </div>

            <div className="sf-field">
              <label className="sf-label">Password</label>
              <div className="sf-input-wrap">
                <input type={showPass ? 'text' : 'password'} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 chars" className="sf-input has-toggle" />
                <button type="button" className="sf-toggle-pass" onClick={() => setShowPass(!showPass)} aria-label="Toggle password">
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <p className="sf-pass-hint">Uppercase, lowercase, and a number required</p>
            </div>

            <div className="sf-field">
              <label className="sf-label">Confirm password</label>
              <div className="sf-input-wrap">
                <input type={showPass ? 'text' : 'password'} required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your password" className="sf-input" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="sf-submit">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="sf-footer-text">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignUp;