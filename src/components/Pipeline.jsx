import { useReveal } from '../hooks/useReveal'
import { NetworkSymbol } from './OrganicSymbols'

export default function Pipeline({ data }) {
  const { ref, revealed } = useReveal(0.25)

  const nDays = data?.data_window?.n_days ?? '—'
  const nPairs = data?.data_window?.n_paired ?? '—'

  const BULLETS = [
    'Ingestion from wearable and diary sources',
    'Cleaning, synchronization and quality control',
    'Feature engineering for HRV, sleep and symptom correlation',
    'Structured outputs ready for multiple predictors',
  ]

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
          Raw wearable signals are not ready for clinical AI. Kinetica's pipeline ingests
          RR intervals, sleep outputs and symptom logs, cleans noise, aligns timelines,
          engineers interpretable features and turns fragmented records into datasets
          that are ready for modelling.
        </p>

        <div className="pipeline-bullets">
          {BULLETS.map((b, i) => (
            <div
              key={i}
              className="pipeline-bullet"
              style={{
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateX(0)' : 'translateX(-12px)',
                transition: `opacity 0.7s var(--ease-out) ${i * 120 + 200}ms, transform 0.5s var(--ease-out) ${i * 120 + 200}ms`,
              }}
            >
              <span className="pipeline-bullet-dot" />
              {b}
            </div>
          ))}
        </div>

        {/* Flow diagram */}
        <div className="pipeline-flow">
          <svg
            viewBox="0 0 480 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="pipeline-flow-svg"
            aria-hidden="true"
          >
            {/* Node 1 */}
            <rect x="0" y="12" width="96" height="32" rx="4" stroke="var(--teal)" strokeWidth="0.8" fill="rgba(144,167,165,0.06)" />
            <text x="48" y="32" textAnchor="middle" className="flow-label">Raw signals</text>
            {/* Arrow 1 */}
            <line x1="96" y1="28" x2="128" y2="28" stroke="var(--border-active)" strokeWidth="0.8" />
            <polygon points="128,25 134,28 128,31" fill="var(--border-active)" />
            {/* Node 2 */}
            <rect x="134" y="12" width="96" height="32" rx="4" stroke="var(--green)" strokeWidth="0.8" fill="rgba(107,158,122,0.06)" />
            <text x="182" y="32" textAnchor="middle" className="flow-label">Cleaning</text>
            {/* Arrow 2 */}
            <line x1="230" y1="28" x2="262" y2="28" stroke="var(--border-active)" strokeWidth="0.8" />
            <polygon points="262,25 268,28 262,31" fill="var(--border-active)" />
            {/* Node 3 */}
            <rect x="268" y="12" width="96" height="32" rx="4" stroke="var(--sea)" strokeWidth="0.8" fill="rgba(93,138,130,0.06)" />
            <text x="316" y="32" textAnchor="middle" className="flow-label">Features</text>
            {/* Arrow 3 */}
            <line x1="364" y1="28" x2="396" y2="28" stroke="var(--border-active)" strokeWidth="0.8" />
            <polygon points="396,25 402,28 396,31" fill="var(--border-active)" />
            {/* Node 4 */}
            <rect x="402" y="12" width="78" height="32" rx="4" stroke="var(--teal)" strokeWidth="0.8" fill="rgba(144,167,165,0.06)" />
            <text x="441" y="32" textAnchor="middle" className="flow-label">Model-ready</text>
          </svg>
        </div>

        <div className="pipeline-footer">
          <p className="pipeline-stat">
            {nDays} nights processed · {nPairs} diary entries aligned
          </p>
          <a href="/pipeline.html" className="pipeline-cta">
            See how the data becomes usable →
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
          margin-bottom: 28px;
        }
        .pipeline-bullets {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 32px;
        }
        .pipeline-bullet {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--text-dim);
        }
        .pipeline-bullet-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--green);
          flex-shrink: 0;
          opacity: 0.6;
        }
        .pipeline-flow {
          margin-bottom: 28px;
          overflow-x: auto;
        }
        .pipeline-flow-svg {
          width: 100%;
          max-width: 480px;
          height: 56px;
        }
        .flow-label {
          font-family: var(--mono);
          font-size: 9px;
          fill: var(--text-dim);
          letter-spacing: 0.04em;
        }
        .pipeline-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
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
