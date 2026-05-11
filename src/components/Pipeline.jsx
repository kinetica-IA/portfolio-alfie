import { useReveal } from '../hooks/useReveal'
import { NetworkSymbol } from './OrganicSymbols'

const STEPS = [
  {
    label: 'Raw ingest',
    detail: 'Heterogeneous Polar GDPR exports. Six distinct data sources. Lives outside the repo as raw personal cardiac data.',
    color: 'var(--teal)',
    rgb: '144,167,165',
  },
  {
    label: 'Structured extract',
    detail: 'Eight Pydantic-validated parsers convert heterogeneous JSONs into typed DataFrames. Every dropped row logged.',
    color: 'var(--warm)',
    rgb: '196,133,90',
  },
  {
    label: 'Derived features',
    detail: 'Advanced HRV (SDNN, LF/HF, DFA-α1), heart rate zone distribution and training session stratification.',
    color: 'var(--sea)',
    rgb: '93,138,130',
  },
  {
    label: 'Unified data for predictors',
    detail: 'Daily frame outer-merged across all sources, joined with symptom diary and augmented with temporal lag features.',
    color: 'var(--green)',
    rgb: '107,158,122',
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
          Kinetica's pipeline is a multi-level system that transforms raw wearable exports into
          validated, model-ready physiological data. It parses heterogeneous sources, applies
          quality rules, computes advanced HRV and activity features, aligns them on a daily
          timeline and prepares them for multiple predictors.
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

        {/* Flow diagram */}
        <div className="pipeline-flow">
          <svg
            viewBox="0 0 560 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="pipeline-flow-svg"
            aria-hidden="true"
          >
            {/* Node 1 — Raw ingest */}
            <rect x="0" y="12" width="108" height="32" rx="4" stroke="var(--teal)" strokeWidth="0.8" fill="rgba(144,167,165,0.06)" />
            <text x="54" y="32" textAnchor="middle" className="flow-label">Raw ingest</text>
            {/* Arrow 1 */}
            <line x1="108" y1="28" x2="138" y2="28" stroke="var(--border-active)" strokeWidth="0.8" />
            <polygon points="138,25 144,28 138,31" fill="var(--border-active)" />
            {/* Node 2 — Structured extract */}
            <rect x="144" y="12" width="118" height="32" rx="4" stroke="var(--warm)" strokeWidth="0.8" fill="rgba(196,133,90,0.06)" />
            <text x="203" y="32" textAnchor="middle" className="flow-label" style={{ fill: 'var(--warm)' }}>Structured</text>
            {/* Arrow 2 */}
            <line x1="262" y1="28" x2="292" y2="28" stroke="var(--border-active)" strokeWidth="0.8" />
            <polygon points="292,25 298,28 292,31" fill="var(--border-active)" />
            {/* Node 3 — Derived features */}
            <rect x="298" y="12" width="118" height="32" rx="4" stroke="var(--sea)" strokeWidth="0.8" fill="rgba(93,138,130,0.06)" />
            <text x="357" y="32" textAnchor="middle" className="flow-label">Features</text>
            {/* Arrow 3 */}
            <line x1="416" y1="28" x2="446" y2="28" stroke="var(--border-active)" strokeWidth="0.8" />
            <polygon points="446,25 452,28 446,31" fill="var(--border-active)" />
            {/* Node 4 — Unified for predictors */}
            <rect x="452" y="12" width="108" height="32" rx="4" stroke="var(--green)" strokeWidth="1.2" fill="rgba(107,158,122,0.08)" />
            <text x="506" y="32" textAnchor="middle" className="flow-label flow-label--final">Predictors</text>
          </svg>
        </div>

        <p className="pipeline-closing">
          Built as infrastructure, not as a one-off preprocessing script.
        </p>

        <div className="pipeline-footer">
          <p className="pipeline-stat">
            {nDays} nights processed · {nPairs} diary entries aligned
          </p>
          <a href="/pipeline.html" className="pipeline-cta">
            Explore the full pipeline →
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
        .pipeline-flow {
          margin-bottom: 20px;
          overflow-x: auto;
        }
        .pipeline-flow-svg {
          width: 100%;
          max-width: 560px;
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
