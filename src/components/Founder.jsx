import CornerMarks from './CornerMarks'

const TIMELINE = [
  { year: '2006', label: 'Physics degree', detail: 'Universidad de Granada' },
  { year: '2010', label: 'Osteopathy & Biomechanics', detail: 'Clinical specialist' },
  { year: '2014', label: 'Private practice', detail: '10+ years clinical' },
  { year: '2020', label: 'COVID-19 acute care', detail: '2 years frontline' },
  { year: '2024', label: 'Post-Lyme diagnosis', detail: 'Patient + researcher' },
  { year: '2025', label: 'Kinetica AI', detail: 'Clinical AI systems' },
]

const BADGES = [
  'Universidad de Granada',
  '10+ years osteopathy',
  'Biomechanics specialist',
  'AI evaluator · Anthropic',
  'Nordic-based · Remote',
]

export default function Founder() {
  return (
    <section className="section" id="founder">
      <div className="eyebrow" style={{ marginBottom: 24 }}>FOUNDER</div>

      <div className="founder-card">
        <CornerMarks size={16} stroke={1.5} color="var(--accent)" opacity={0.3} />

        <h3 className="founder-name">Alfonso Navarro</h3>
        <p className="founder-role">Osteopath · Biomechanics Specialist · Physicist · Clinical AI Builder</p>

        {/* Timeline */}
        <div className="founder-timeline">
          <div className="ft-line" />
          {TIMELINE.map(t => (
            <div key={t.year} className="ft-node">
              <span className="ft-year">{t.year}</span>
              <span className="ft-dot" />
              <span className="ft-label">{t.label}</span>
            </div>
          ))}
        </div>

        <p className="founder-bio">
          Building AI systems that work in clinical reality — not in theory.
          10+ years of hands-on patient care, including 2 years of intensive
          acute care during COVID-19. Currently building Kinetica AI — a suite
          of clinical AI models that predict autonomic dysfunction from consumer
          wearable data. Also developing IO3, a clinical reasoning agent with
          human-on-loop architecture. Active AI model evaluator for Anthropic.
          Post-Lyme patient using personal biometric data to advance understanding
          of post-infectious fatigue.
        </p>

        <div className="founder-badges">
          {BADGES.map(b => (
            <span key={b} className="founder-badge">{b}</span>
          ))}
        </div>

        <div className="founder-links">
          <a href="mailto:alfon.atman@gmail.com">alfon.atman@gmail.com →</a>
          <a href="https://www.linkedin.com/in/navarro-kinetica-ai" target="_blank" rel="noopener noreferrer">LinkedIn →</a>
          <a href="https://github.com/kinetica-IA" target="_blank" rel="noopener noreferrer">GitHub →</a>
        </div>
      </div>

      <style>{`
        .founder-card {
          position: relative;
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--border);
          border-radius: 0;
          padding: 36px 32px;
          max-width: 700px;
        }
        .founder-name {
          font-family: var(--sans);
          font-weight: 500;
          font-size: 1.6rem;
          color: var(--text);
          letter-spacing: 0.04em;
          margin-bottom: 4px;
        }
        .founder-role {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--text-dim);
          letter-spacing: 0.06em;
          margin-bottom: 28px;
        }
        .founder-timeline {
          position: relative;
          display: flex;
          justify-content: space-between;
          margin-bottom: 28px;
          padding: 0 4px;
        }
        .ft-line {
          position: absolute;
          top: 22px;
          left: 8px;
          right: 8px;
          height: 2px;
          background: var(--border);
        }
        .ft-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          position: relative;
          z-index: 1;
        }
        .ft-year {
          font-family: var(--mono);
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }
        .ft-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--green);
          border: 2px solid var(--bg);
        }
        .ft-label {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--text-dim);
          text-align: center;
          max-width: 80px;
        }
        .founder-bio {
          font-size: 14px;
          color: var(--text-sec);
          line-height: 1.65;
          margin-bottom: 20px;
        }
        .founder-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }
        .founder-badge {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          border: 1px solid var(--border);
          border-radius: 0;
          padding: 4px 10px;
        }
        .founder-links {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        .founder-links a {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--accent);
          transition: color 0.2s ease;
        }
        .founder-links a:hover {
          color: var(--green);
          text-decoration: underline;
        }
      `}</style>
    </section>
  )
}
