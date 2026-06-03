import React from 'react';
import { Link } from 'react-router-dom';

const FOOTER_STYLES = `
  .app-footer {
    background: #ffffff;
    border-top: 1px solid #ebebea;
    padding: 0 2rem;
    font-family: 'DM Sans', sans-serif;
    color: #9090a0;
    font-size: 0.75rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    height: 40px;
  }

  .footer-links {
    display: flex;
    gap: 1.5rem;
  }

  .footer-link {
    color: #1a1a1e;
    text-decoration: none;
    transition: color 0.15s;
  }

  .footer-link:hover {
    color: #9e7d52;
  }

  @media (max-width: 600px) {
    .app-footer {
      flex-direction: column;
      justify-content: center;
      height: 50px;
      padding: 0.5rem;
      gap: 0.3rem;
    }
  }
`;

const Footer = () => {
  return (
    <>
      <style>{FOOTER_STYLES}</style>
      <footer className="app-footer">
        <div className="footer-links">
          <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
          <Link to="/terms-and-conditions" className="footer-link">Terms & Conditions</Link>
        </div>
        <div className="footer-copy">
          &copy; {new Date().getFullYear()} SignFlow
        </div>
      </footer>
    </>
  );
};

export default Footer;
