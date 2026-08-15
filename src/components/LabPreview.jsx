import { useReveal } from '../hooks/useReveal'

export default function LabPreview({ items = [] }) {
  const { ref, revealed } = useReveal(0.2)

  if (!items.length) return null

  return (
    <section className="section lab-preview" ref={ref}>
      <span className="eyebrow" style={{ color: 'var(--teal)' }}>LAB</span>
      <h2 className="lp-title">Cuaderno de trabajo</h2>

      <div className="lp-grid">
        {items.slice(0, 2).map((item, i) => (
          <a
            key={item.slug}
            href={`/lab/${item.slug}`}
            className="lp-card"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateY(0)' : 'translateY(16px)',
              transition: `opacity 0.8s var(--ease-out) ${i * 120}ms, transform var(--anim-base) var(--ease-out) ${i * 120}ms`,
            }}
          >
            <span className="lp-card-title">{item.title}</span>
            <span className="lp-card-summary">{item.summary}</span>
            <span className="lp-card-cta">Leer más →</span>
          </a>
        ))}
      </div>

      <a href="/lab" className="lp-see-all">Ver todo el lab →</a>

      <style>{`
        .lp-title {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          margin: 16px 0 var(--space-subsection);
        }
        .lp-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        @media (max-width: 640px) {
          .lp-grid { grid-template-columns: 1fr; }
        }
        .lp-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          border: 1px solid var(--border);
          border-top: 2px solid var(--teal);
          padding: 24px;
          text-decoration: none;
          transition: border-color var(--duration-hover) ease, background var(--duration-hover) ease;
        }
        .lp-card:hover {
          border-color: var(--border-active);
          border-top-color: var(--teal);
          background: var(--fill-teal);
        }
        .lp-card-title {
          font-family: var(--sans);
          font-size: var(--text-subsection);
          font-weight: 400;
          color: var(--text-heading);
        }
        .lp-card-summary {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.6;
        }
        .lp-card-cta {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--teal);
          margin-top: auto;
        }
        .lp-see-all {
          display: inline-block;
          margin-top: var(--space-element);
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--text-dim);
        }
        .lp-see-all:hover { color: var(--teal); }
      `}</style>
    </section>
  )
}
