import React from 'react';

const PAGE_STYLES = `
  .legal-page-container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    padding-bottom: 3rem;
    background: #ffffff;
    border-radius: 14px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    font-family: 'DM Sans', sans-serif;
    color: #1a1a1e;
  }

  .legal-page-container h1 {
    font-family: 'DM Serif Display', serif;
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    color: #1a1a1e;
  }

  .legal-page-container h2 {
    font-family: 'DM Serif Display', serif;
    font-size: 1.5rem;
    margin-top: 2rem;
    margin-bottom: 1rem;
    color: #1a1a1e;
  }

  .legal-page-container p {
    line-height: 1.6;
    margin-bottom: 1rem;
    color: #5a5a64;
  }
`;

const TermsAndConditions = () => {
  return (
    <>
      <style>{PAGE_STYLES}</style>
      <div className="legal-page-container">
        <h1>Terms and Conditions</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using SignFlow, you accept and agree to be bound by the terms and provision of this agreement. 
          In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
        </p>

        <h2>2. Use of Service</h2>
        <p>
          You agree to use SignFlow only for lawful purposes. You are prohibited from using our site or its content: 
          (a) for any unlawful purpose; (b) to solicit others to perform or participate in any unlawful acts; 
          (c) to violate any international, federal, provincial or state regulations, rules, laws, or local ordinances.
        </p>

        <h2>3. Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are and will remain the exclusive property of SignFlow and its licensors. 
          The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
        </p>

        <h2>4. Limitation of Liability</h2>
        <p>
          In no event shall SignFlow, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
        </p>

        <h2>5. Changes to Terms</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
        </p>
      </div>
    </>
  );
};

export default TermsAndConditions;
