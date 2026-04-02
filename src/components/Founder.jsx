const TIMELINE = [
  { year: '2006', label: 'Physics, Universidad de Granada' },
  { year: '2010', label: 'Osteopathy & biomechanics' },
  { year: '2014', label: 'Private clinical practice' },
  { year: '2020', label: 'COVID-19 acute care' },
  { year: '2024', label: 'Post-Lyme diagnosis' },
  { year: '2025', label: 'Kinetica AI' },
]

export default function Founder() {
  return (
    <section className="section founder" id="founder">
      <div className="founder-left">
        <span className="eyebrow">FOUNDER</span>
        <h2 className="founder-name">Alfonso Navarro</h2>
        <p className="founder-role">Physicist · Osteopath · Clinical AI Builder</p>
        <p className="founder-bio">
          10+ years of clinical practice including two years of intensive acute care
          during COVID-19. Post-Lyme patient turned researcher — building predictive
          models from personal biometric data. Active AI model evaluator for Anthropic.
        </p>
        <div className="founder-badges">
          <span className="founder-badge">Universidad de Granada</span>
          <span className="founder-badge">10+ years clinical</span>
          <span className="founder-badge">AI Evaluator · Anthropic</span>
          <span className="founder-badge">Nordic-based · Remote</span>
        </div>
        <div className="founder-links">
          <a href="mailto:alfon.atman@gmail.com">alfon.atman@gmail.com</a>
          <a href="https://www.linkedin.com/in/navarro-kinetica-ai" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://github.com/kinetica-IA" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>

      <div className="founder-right">
        <div className="timeline">
          {TIMELINE.map(t => (
            <div key={t.year} className="tl-item">
              <span className="tl-year">{t.year}</span>
              <span className="tl-label">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .founder {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 64px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .founder {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .founder-right { order: -1; }
        }

        .founder .eyebrow {
          display: block;
          margin-bottom: 16px;
        }
        .founder-name {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          line-height: 1.2;
          margin-bottom: 8px;
        }
        .founder-role {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--text-dim);
          margin-bottom: 28px;
        }
        .founder-bio {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.75;
          max-width: 520px;
          margin-bottom: 28px;
        }
        .founder-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 28px;
        }
        .founder-badge {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--text-dim);
          background: var(--fill-teal);
          border: 1px solid var(--border);
          padding: 4px 12px;
          transition: border-color var(--duration-hover) ease;
        }
        .founder-badge:hover { border-color: var(--border-active); }
        .founder-links {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        .founder-links a {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--sea);
          transition: color var(--duration-hover) ease;
        }
        .founder-links a:hover { color: var(--green); }

        /* Vertical typographic timeline */
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
          border-left: 1px solid var(--border);
          padding-left: 20px;
        }
        .tl-item {
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }
        .tl-item:last-child { border-bottom: none; }
        .tl-item:last-child .tl-year { color: var(--green); }
        .tl-year {
          display: block;
          font-family: var(--mono);
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
          margin-bottom: 2px;
        }
        .tl-label {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
        }
        @media (max-width: 768px) {
          .timeline {
            flex-direction: row;
            flex-wrap: wrap;
            border-left: none;
            border-top: 1px solid var(--border);
            padding-left: 0;
            padding-top: 16px;
            gap: 16px;
          }
          .tl-item {
            padding: 0;
            border-bottom: none;
          }
        }
      `}</style>
    </section>
  )
}
