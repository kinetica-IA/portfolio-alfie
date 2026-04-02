export default function Contact() {
  return (
    <section className="section contact" id="contact">
      <span className="eyebrow" style={{ color: 'var(--teal)' }}>COLLABORATE</span>
      <h2 className="contact-headline">
        Let's build something that works in clinical reality.
      </h2>
      <p className="contact-services">
        Clinical AI consulting · Autonomic assessment · AI model evaluation
      </p>
      <a href="mailto:alfon.atman@gmail.com" className="contact-cta">
        Get in touch
      </a>
      <div className="contact-links">
        <a href="mailto:alfon.atman@gmail.com">alfon.atman@gmail.com</a>
        <a href="https://www.linkedin.com/in/navarro-kinetica-ai" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a href="https://github.com/kinetica-IA" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>

      <style>{`
        .contact {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
          padding-bottom: 80px;
        }
        .contact .eyebrow {
          display: block;
          margin-bottom: 16px;
        }
        .contact-headline {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          line-height: 1.35;
          margin-bottom: 16px;
        }
        .contact-services {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--text-dim);
          margin-bottom: 40px;
        }
        .contact-cta {
          display: inline-block;
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--green);
          border: 1.5px solid var(--green);
          padding: 14px 36px;
          text-decoration: none;
          transition: all 0.25s ease;
          margin-bottom: 32px;
        }
        .contact-cta:hover {
          background: var(--green);
          color: white;
          box-shadow: 0 2px 12px rgba(107,158,122,0.15);
        }
        .contact-links {
          display: flex;
          gap: 24px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .contact-links a {
          font-family: var(--mono);
          font-size: 14px;
          color: var(--sea);
          transition: color var(--duration-hover) ease;
        }
        .contact-links a:hover { color: var(--green); }
      `}</style>
    </section>
  )
}
