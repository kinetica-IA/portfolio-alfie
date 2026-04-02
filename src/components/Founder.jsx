import { useReveal } from '../hooks/useReveal'
import { useTextDecode } from '../hooks/useTextDecode'

const TIMELINE = [
  { year: '2006', label: 'Physics, Universidad de Granada', color: 'var(--ice)', rgb: '133,168,184' },
  { year: '2010', label: 'Osteopathy & biomechanics', color: 'var(--sea)', rgb: '93,138,130' },
  { year: '2014', label: 'Private clinical practice', color: 'var(--teal)', rgb: '144,167,165' },
  { year: '2020', label: 'COVID-19 acute care', color: 'var(--warm)', rgb: '196,133,90' },
  { year: '2024', label: 'Post-Lyme diagnosis', color: 'var(--clay)', rgb: '168,121,110' },
  { year: '2025', label: 'Kinetica AI', color: 'var(--green)', rgb: '107,158,122', pulse: true },
]

const BADGES = [
  { text: 'Universidad de Granada', borderColor: 'var(--ice)' },
  { text: '10+ years clinical', borderColor: 'var(--teal)' },
  { text: 'AI Evaluator · Anthropic', borderColor: 'var(--warm)' },
  { text: 'Nordic-based · Remote', borderColor: 'var(--sea)' },
]

export default function Founder() {
  const { ref, revealed } = useReveal(0.15)
  const nameDisplay = useTextDecode('Alfonso Navarro', {
    duration: 800, delay: 0, loop: false, isActive: revealed,
  })

  return (
    <section className="section founder" id="founder" ref={ref}>
      <div className="founder-main">
        <span className="eyebrow" style={{ color: 'var(--teal)' }}>FOUNDER</span>
        <h2 className="founder-name">{nameDisplay}</h2>
        <p className="founder-role">Physicist · Osteopath · Clinical AI Builder</p>
        <p className="founder-bio">
          10+ years of clinical practice including two years of intensive acute care
          during COVID-19. Post-Lyme patient turned researcher — building predictive
          models from personal biometric data. Active AI model evaluator for Anthropic.
        </p>
        <div className="founder-badges">
          {BADGES.map((b, i) => (
            <span
              key={b.text}
              className="founder-badge"
              style={{
                borderLeft: `2px solid ${b.borderColor}`,
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateY(0)' : 'translateY(8px)',
                transition: `opacity 0.3s var(--ease-out) ${i * 80}ms, transform 0.3s var(--ease-out) ${i * 80}ms`,
              }}
            >
              {b.text}
            </span>
          ))}
        </div>
        <div className="founder-links">
          <a href="mailto:alfon.atman@gmail.com">alfon.atman@gmail.com</a>
          <a href="https://www.linkedin.com/in/navarro-kinetica-ai" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://github.com/kinetica-IA" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>

      {/* Horizontal timeline stepper */}
      <div className="tl-container">
        <div className="tl-line" style={{
          width: revealed ? '100%' : '0%',
          transition: 'width 1.2s var(--ease-out) 0.2s',
        }} />
        <div className="tl-items">
          {TIMELINE.map((t, i) => (
            <div
              key={t.year}
              className="tl-item"
              style={{
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateY(0)' : 'translateY(10px)',
                transition: `opacity 0.4s var(--ease-out) ${i * 100 + 200}ms, transform 0.4s var(--ease-out) ${i * 100 + 200}ms`,
              }}
            >
              <span
                className={`tl-node ${t.pulse ? 'tl-node--pulse' : ''}`}
                style={{ background: t.color }}
              />
              <span className="tl-year">{t.year}</span>
              <span className="tl-label">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .founder {
          display: flex;
          flex-direction: column;
          gap: 48px;
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
          padding: 6px 14px;
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

        /* Horizontal timeline stepper */
        .tl-container {
          position: relative;
          padding-top: 12px;
        }
        .tl-line {
          position: absolute;
          top: 14px;
          left: 0;
          height: 1px;
          background: var(--border);
        }
        .tl-items {
          display: flex;
          gap: 0;
          justify-content: space-between;
        }
        .tl-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }
        .tl-node {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          transition: transform var(--duration-hover) var(--ease-out);
          z-index: 1;
        }
        .tl-item:hover .tl-node { transform: scale(1.4); }
        .tl-node--pulse {
          animation: tlPulse 2s ease-in-out infinite;
        }
        @keyframes tlPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(107,158,122, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(107,158,122, 0); }
        }
        .tl-year {
          font-family: var(--mono);
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }
        .tl-label {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--text-dim);
          text-align: center;
          line-height: 1.3;
        }
        @media (max-width: 768px) {
          .tl-items {
            flex-wrap: wrap;
            gap: 16px;
          }
          .tl-item {
            flex: 0 0 calc(50% - 8px);
            align-items: flex-start;
          }
          .tl-line { display: none; }
        }
      `}</style>
    </section>
  )
}
