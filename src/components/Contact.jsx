import CornerMarks from './CornerMarks'

export default function Contact() {
  return (
    <section className="section" id="contact">
      <div className="contact-card">
        <CornerMarks size={16} stroke={1.5} color="var(--accent)" opacity={0.3} />
        <p className="contact-text">Interested in collaborating?</p>
        <div className="contact-links">
          <a href="mailto:alfon.atman@gmail.com">alfon.atman@gmail.com →</a>
          <a href="https://www.linkedin.com/in/navarro-kinetica-ai" target="_blank" rel="noopener noreferrer">LinkedIn →</a>
          <a href="https://github.com/kinetica-IA" target="_blank" rel="noopener noreferrer">GitHub →</a>
        </div>
      </div>

      <style>{`
        .contact-card {
          position: relative;
          text-align: center;
          padding: 48px 32px;
        }
        .contact-text {
          font-family: var(--sans);
          font-weight: 400;
          font-size: 1.4rem;
          color: var(--text);
          margin-bottom: 20px;
        }
        .contact-links {
          display: flex;
          gap: 28px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .contact-links a {
          font-family: var(--mono);
          font-size: 13px;
          color: var(--accent);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .contact-links a:hover {
          color: var(--green);
          text-decoration: underline;
        }
      `}</style>
    </section>
  )
}
