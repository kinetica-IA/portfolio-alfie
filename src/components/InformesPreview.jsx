import { useReveal } from '../hooks/useReveal'

export default function InformesPreview({ items = [] }) {
  const { ref, revealed } = useReveal(0.2)

  if (!items.length) return null

  return (
    <section className="section informes-preview" ref={ref}>
      <span className="eyebrow" style={{ color: 'var(--green)' }}>INFORMES</span>
      <h2 className="ip-title">Casos clínicos</h2>

      <div className="ip-grid">
        {items.slice(0, 3).map((item, i) => (
          <a
            key={item.slug}
            href={`/informes/${item.slug}`}
            className="ip-card"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateY(0)' : 'translateY(16px)',
              transition: `opacity 0.8s var(--ease-out) ${i * 120}ms, transform var(--anim-base) var(--ease-out) ${i * 120}ms`,
            }}
          >
            <span className="ip-card-title">{item.title}</span>
            <span className="ip-card-summary">{item.summary}</span>
            <span className="ip-card-cta">Leer más →</span>
          </a>
        ))}
      </div>

      <a href="/informes" className="ip-see-all">Ver todos los informes →</a>

      <style>{`
        .ip-title {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          margin: 16px 0 var(--space-subsection);
        }
        .ip-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 768px) {
          .ip-grid { grid-template-columns: 1fr; }
        }
        .ip-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          border: 1px solid var(--border);
          border-top: 2px solid var(--green);
          padding: 24px;
          text-decoration: none;
          transition: border-color var(--duration-hover) ease, background var(--duration-hover) ease;
        }
        .ip-card:hover {
          border-color: var(--border-active);
          border-top-color: var(--green);
          background: var(--fill-green);
        }
        .ip-card-title {
          font-family: var(--sans);
          font-size: var(--text-subsection);
          font-weight: 400;
          color: var(--text-heading);
        }
        .ip-card-summary {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.6;
        }
        .ip-card-cta {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--green);
          margin-top: auto;
        }
        .ip-see-all {
          display: inline-block;
          margin-top: var(--space-element);
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--text-dim);
        }
        .ip-see-all:hover { color: var(--green); }
      `}</style>
    </section>
  )
}
