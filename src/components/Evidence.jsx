import { useReveal } from '../hooks/useReveal'

// ════════════════════════════════════════════════════════════════════
// EVIDENCE — two or three memorable results, not a wall of figures.
// Numbers already published on their detail pages; surfaced once here.
// ════════════════════════════════════════════════════════════════════

const RESULTS = [
  {
    value: '243',
    unit: 'days · 71 features',
    caption: 'The canonical longitudinal archive from a single subject — every model reads from it. The live ribbon above streams its most recent nights.',
    color: 'var(--green)',
  },
  {
    value: '0.829 / 0.837',
    unit: 'AUC',
    caption: 'Autonomic burden and symptom severity, leave-one-out, N-of-1. Bootstrap confidence intervals.',
    color: 'var(--sea)',
  },
  {
    value: '0.85',
    unit: 'retrieval acc.',
    caption: 'Curated clinical RAG over 1,880 audited chunks, scored on a 20-question benchmark.',
    color: 'var(--ice)',
  },
]

export default function Evidence() {
  const { ref, revealed } = useReveal(0.25)

  return (
    <section className="section evidence" id="evidence" ref={ref}>
      <span className="eyebrow" style={{ color: 'var(--sea)' }}>EVIDENCE</span>
      <h2 className="ev-title">Results that hold up to inspection</h2>

      <div className="ev-grid">
        {RESULTS.map((r, i) => (
          <div
            key={r.unit}
            className="ev-item"
            style={{
              '--ev-color': r.color,
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateY(0)' : 'translateY(16px)',
              transition: `opacity 0.8s var(--ease-out) ${i * 140}ms, transform var(--anim-base) var(--ease-out) ${i * 140}ms`,
            }}
          >
            <p className="ev-value">
              <strong>{r.value}</strong>
              <span className="ev-unit">{r.unit}</span>
            </p>
            <p className="ev-caption">{r.caption}</p>
          </div>
        ))}
      </div>

      <style>{`
        .ev-title {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          margin: 16px 0 var(--space-subsection);
        }
        .ev-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        @media (max-width: 768px) {
          .ev-grid { grid-template-columns: 1fr; gap: 28px; }
        }
        .ev-item {
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-left: 2px solid var(--ev-color);
          padding-left: 18px;
        }
        .ev-value {
          display: flex;
          align-items: baseline;
          gap: 8px;
          font-family: var(--mono);
        }
        .ev-value strong {
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 500;
          color: var(--ev-color);
          letter-spacing: -0.01em;
        }
        .ev-unit {
          font-size: var(--text-caption);
          color: var(--text-dim);
          letter-spacing: 0.06em;
        }
        .ev-caption {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.65;
        }
      `}</style>
    </section>
  )
}
