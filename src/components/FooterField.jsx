export default function FooterField() {
  return (
    <footer className="footer-field">
      <div className="footer-content">
        <span className="footer-brand">KINETICA AI</span>
        <span className="footer-copy">© {new Date().getFullYear()} Alfonso Navarro · Built in the open, engineered for reproducibility.</span>
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
      `}</style>
    </footer>
  )
}
