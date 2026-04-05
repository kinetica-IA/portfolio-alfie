export default function FooterField() {
  return (
    <footer className="footer-field">
      <div className="footer-content">
        <div className="footer-contact-links">
          <a href="mailto:alfon.atman@gmail.com">alfon.atman@gmail.com</a>
          <span className="footer-sep">·</span>
          <a href="https://www.linkedin.com/in/navarro-kinetica-ai" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <span className="footer-sep">·</span>
          <a href="https://github.com/kinetica-IA" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
        <span className="footer-brand">KINETICA AI</span>
        <span className="footer-copy">© {new Date().getFullYear()} Alfonso Navarro. All systems nominal.</span>
      </div>

      <style>{`
        .footer-field {
          position: relative;
          width: 100%;
          overflow: hidden;
        }
        .footer-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          padding: 60px 24px;
          gap: 16px;
          text-align: center;
        }
        .footer-contact-links {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 20px;
        }
        .footer-contact-links a {
          font-family: var(--mono);
          font-size: var(--text-body);
          color: var(--sea);
          text-decoration: none;
          transition: color var(--duration-hover) ease;
        }
        .footer-contact-links a:hover { color: var(--green); }
        .footer-brand {
          font-family: var(--sans);
          font-size: 1.6rem;
          font-weight: 300;
          letter-spacing: 0.25em;
          color: var(--text-heading);
          opacity: 0.6;
        }
        .footer-copy {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          letter-spacing: 0.04em;
        }
        .footer-sep {
          color: var(--text-dim);
          opacity: 0.3;
          font-size: var(--text-eyebrow);
        }
      `}</style>
    </footer>
  )
}
