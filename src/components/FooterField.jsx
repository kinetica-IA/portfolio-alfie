export default function FooterField() {
  return (
    <footer className="footer-field">
      <div className="footer-content">
        <span className="footer-brand">KINETICA AI</span>
        <nav className="footer-links">
          <a href="mailto:alfon.atman@gmail.com?subject=Consulta%20osteopat%C3%ADa&body=Describe%20tu%20problema%20con%20tus%20palabras.">Contacto</a>
          <span className="footer-links-sep">·</span>
          <a href="/profesionales">Profesionales</a>
        </nav>
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
        .footer-links {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          letter-spacing: 0.04em;
        }
        .footer-links a {
          color: var(--text-dim);
          text-decoration: none;
        }
        .footer-links a:hover {
          color: var(--text-heading);
        }
        .footer-links-sep {
          color: var(--text-dim);
          opacity: 0.5;
        }
      `}</style>
    </footer>
  )
}
