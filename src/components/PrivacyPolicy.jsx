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

const PrivacyPolicy = () => {
  return (
    <>
      <style>{PAGE_STYLES}</style>
      <div className="legal-page-container">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Introduction</h2>
        <p>
          Welcome to SignFlow. We respect your privacy and are committed to protecting your personal data. 
          This privacy policy will inform you as to how we look after your personal data when you visit our website 
          and tell you about your privacy rights.
        </p>

        <h2>2. Data We Collect</h2>
        <p>
          We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
          Identity Data, Contact Data, Technical Data, Usage Data, and Profile Data.
        </p>

        <h2>3. How We Use Your Data</h2>
        <p>
          We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
          Where we need to perform the contract we are about to enter into or have entered into with you.
          Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.
        </p>

        <h2>4. Data Security</h2>
        <p>
          We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed.
        </p>

        <h2>5. Contact Us</h2>
        <p>
          If you have any questions about this privacy policy or our privacy practices, please contact us.
        </p>
      </div>
    </>
  );
};

export default PrivacyPolicy;
