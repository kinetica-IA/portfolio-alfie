import { useReveal } from '../hooks/useReveal'
import { NetworkSymbol } from './OrganicSymbols'

const STEPS = [
  {
    label: 'Raw input',
    detail: 'Wearable RR intervals, sleep outputs and symptom logs',
    color: 'var(--teal)',
    rgb: '144,167,165',
  },
  {
    label: 'Data cleaning',
    detail: 'Artefact removal, synchronization and consistency checks',
    color: 'var(--green)',
    rgb: '107,158,122',
  },
  {
    label: 'Feature layer',
    detail: 'HRV, sleep and symptom-linked variables prepared for analysis',
    color: 'var(--sea)',
    rgb: '93,138,130',
  },
  {
    label: 'Predictors',
    detail: 'Structured datasets used by independent predictors',
    color: 'var(--ice)',
    rgb: '133,168,184',
  },
]

export default function Pipeline({ data }) {
  const { ref, revealed } = useReveal(0.25)

  const nDays = data?.data_window?.n_days ?? '—'
  const nPairs = data?.data_window?.n_paired ?? '—'

  return (
    <section className="section pipeline" id="pipeline" ref={ref}>
      <span className="eyebrow" style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <NetworkSymbol color="var(--green)" size={44} />
        DATA PIPELINE
      </span>
      <h2 className="pipeline-title">Data Pipeline</h2>

      <div
        className="pipeline-card"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.9s var(--ease-out), transform 0.7s var(--ease-out)',
        }}
      >
        <p className="pipeline-copy">
          Kinetica's pipeline transforms raw wearable physiology into structured,
          model-ready clinical data. RR intervals, sleep outputs and symptom logs are
          ingested, cleaned, synchronized, quality-checked and converted into
          interpretable feature layers that can support multiple predictors.
        </p>

        {/* 4 steps */}
        <div className="pipeline-steps">
          {STEPS.map((s, i) => (
            <div
              key={s.label}
              className="pipeline-step"
              style={{
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateX(0)' : 'translateX(-12px)',
                transition: `opacity 0.7s var(--ease-out) ${i * 110 + 200}ms, transform 0.5s var(--ease-out) ${i * 110 + 200}ms`,
              }}
            >
              <span className="pipeline-step-num" style={{ color: s.color }}>{String(i + 1).padStart(2, '0')}</span>
              <div className="pipeline-step-body">
                <span className="pipeline-step-label" style={{ color: s.color }}>{s.label}</span>
                <span className="pipeline-step-detail">{s.detail}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Flow diagram: Raw input → Cleaning → Feature layer → Predictors */}
        <div className="pipeline-flow">
          <svg
            viewBox="0 0 540 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="pipeline-flow-svg"
            aria-hidden="true"
          >
            {/* Node 1 — Raw input */}
            <rect x="0" y="12" width="108" height="32" rx="4" stroke="var(--teal)" strokeWidth="0.8" fill="rgba(144,167,165,0.06)" />
            <text x="54" y="32" textAnchor="middle" className="flow-label">Raw input</text>
            {/* Arrow 1 */}
            <line x1="108" y1="28" x2="138" y2="28" stroke="var(--border-active)" strokeWidth="0.8" />
            <polygon points="138,25 144,28 138,31" fill="var(--border-active)" />
            {/* Node 2 — Cleaning */}
            <rect x="144" y="12" width="108" height="32" rx="4" stroke="var(--green)" strokeWidth="0.8" fill="rgba(107,158,122,0.06)" />
            <text x="198" y="32" textAnchor="middle" className="flow-label">Cleaning</text>
            {/* Arrow 2 */}
            <line x1="252" y1="28" x2="282" y2="28" stroke="var(--border-active)" strokeWidth="0.8" />
            <polygon points="282,25 288,28 282,31" fill="var(--border-active)" />
            {/* Node 3 — Feature layer */}
            <rect x="288" y="12" width="108" height="32" rx="4" stroke="var(--sea)" strokeWidth="0.8" fill="rgba(93,138,130,0.06)" />
            <text x="342" y="32" textAnchor="middle" className="flow-label">Feature layer</text>
            {/* Arrow 3 */}
            <line x1="396" y1="28" x2="426" y2="28" stroke="var(--border-active)" strokeWidth="0.8" />
            <polygon points="426,25 432,28 426,31" fill="var(--border-active)" />
            {/* Node 4 — Predictors */}
            <rect x="432" y="12" width="108" height="32" rx="4" stroke="var(--ice)" strokeWidth="1.2" fill="rgba(133,168,184,0.08)" />
            <text x="486" y="32" textAnchor="middle" className="flow-label flow-label--final">Predictors</text>
          </svg>
        </div>

        <p className="pipeline-closing">
          One physiological foundation, multiple predictive models.
        </p>

        <div className="pipeline-footer">
          <p className="pipeline-stat">
            {nDays} nights processed · {nPairs} diary entries aligned
          </p>
          <a href="/pipeline.html" className="pipeline-cta">
            See the full pipeline →
          </a>
        </div>
      </div>

      <style>{`
        .pipeline-title {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          margin: 16px 0 var(--space-subsection);
        }
        .pipeline-card {
          border: 1px solid var(--border);
          border-left: 3px solid var(--green);
          padding: 32px;
          transition: border-color var(--duration-hover) ease,
                      background var(--duration-hover) ease;
        }
        .pipeline-card:hover {
          border-color: var(--border-active);
          border-left-color: var(--green);
          background: rgba(107,158,122,0.03);
        }
        .pipeline-copy {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.75;
          max-width: 640px;
          margin-bottom: 32px;
        }
        /* 4 steps */
        .pipeline-steps {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 32px;
        }
        .pipeline-step {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .pipeline-step-num {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          font-weight: 500;
          letter-spacing: 0.06em;
          flex-shrink: 0;
          margin-top: 2px;
          opacity: 0.7;
        }
        .pipeline-step-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .pipeline-step-label {
          font-family: var(--mono);
          font-size: var(--text-caption);
          font-weight: 500;
          letter-spacing: 0.04em;
        }
        .pipeline-step-detail {
          font-size: var(--text-caption);
          font-weight: 300;
          color: var(--text-dim);
          line-height: 1.5;
        }
        /* Flow diagram */
        .pipeline-flow {
          margin-bottom: 20px;
          overflow-x: auto;
        }
        .pipeline-flow-svg {
          width: 100%;
          max-width: 540px;
          height: 56px;
        }
        .flow-label {
          font-family: var(--mono);
          font-size: 9px;
          fill: var(--text-dim);
          letter-spacing: 0.04em;
        }
        .flow-label--final {
          fill: var(--text-sec);
          font-weight: 500;
        }
        .pipeline-closing {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--text-sec);
          letter-spacing: 0.03em;
          margin-bottom: 24px;
          opacity: 0.8;
        }
        .pipeline-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }
        .pipeline-stat {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          letter-spacing: 0.04em;
        }
        .pipeline-cta {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--green);
          text-decoration: none;
          transition: opacity var(--duration-hover) ease;
        }
        .pipeline-cta:hover { opacity: 0.7; }
        @media (max-width: 640px) {
          .pipeline-card { padding: 20px; }
          .pipeline-footer { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </section>
  )
}
