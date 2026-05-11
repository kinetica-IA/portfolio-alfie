import { useReveal } from '../hooks/useReveal'
import { OrbitSymbol } from './OrganicSymbols'

function FrameworkCard({ color, colorRgb, badge, badgeColor, title, copy, secondary, ctaText, ctaHref, legacy, index, revealed }) {
  return (
    <div
      className="fw-card"
      style={{
        '--fw-color': color,
        '--fw-rgb': colorRgb,
        opacity: revealed ? (legacy ? 0.65 : 1) : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.8s var(--ease-out) ${index * 180}ms, transform 0.7s var(--ease-out) ${index * 180}ms`,
      }}
      onMouseEnter={legacy ? e => { e.currentTarget.style.opacity = '0.85' } : undefined}
      onMouseLeave={legacy ? e => { e.currentTarget.style.opacity = '0.65' } : undefined}
    >
      <span className="fw-badge" style={{ color: badgeColor, background: `rgba(${colorRgb},0.08)` }}>
        <span className="fw-badge-dot" style={{ background: badgeColor }} />
        {badge}
      </span>
      <h3 className="fw-card-title">{title}</h3>
      <p className="fw-card-copy">{copy}</p>
      <p className="fw-card-secondary">{secondary}</p>
      <a href={ctaHref} className="fw-card-cta" style={{ color: badgeColor }}>
        {ctaText} →
      </a>
    </div>
  )
}

export default function Frameworks() {
  const { ref, revealed } = useReveal(0.25)

  return (
    <section className="section frameworks" id="frameworks">
      <span className="eyebrow" style={{ color: 'var(--teal)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <OrbitSymbol color="var(--teal)" size={44} />
        FRAMEWORKS
      </span>
      <h2 className="frameworks-title">Architecture and safety</h2>

      <div className="fw-grid" ref={ref}>
        <FrameworkCard
          color="var(--sea)"
          colorRgb="93,138,130"
          badge="FRAMEWORK · IN DEVELOPMENT"
          badgeColor="var(--sea)"
          title="ALMA Framework"
          copy="ALMA is the emerging coordination framework behind Kinetica's clinical AI logic: memory, context, safety boundaries and human oversight structured for sensitive health workflows."
          secondary="Designed for guarded reasoning in clinical environments."
          ctaText="Read the framework"
          ctaHref="/io-architecture.html#alma"
          legacy={false}
          index={0}
          revealed={revealed}
        />
        <FrameworkCard
          color="var(--warm)"
          colorRgb="196,133,90"
          badge="LEGACY · ARCHIVED"
          badgeColor="var(--warm)"
          title="IO3 Architecture"
          copy="IO3 documents the earlier architectural layer that shaped Kinetica's human-on-loop and orchestration approach. It remains visible as a legacy system reference, not as the current core framework."
          secondary="Legacy architecture with ongoing conceptual value."
          ctaText="View architecture"
          ctaHref="/io-architecture.html"
          legacy={true}
          index={1}
          revealed={revealed}
        />
      </div>

      <style>{`
        .frameworks-title {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          margin: 16px 0 var(--space-subsection);
        }
        .fw-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: stretch;
        }
        @media (max-width: 768px) {
          .fw-grid { grid-template-columns: 1fr; }
        }
        .fw-card {
          border: 1px solid var(--border);
          border-left: 3px solid var(--fw-color);
          padding: 28px;
          display: flex;
          flex-direction: column;
          transition: border-color var(--duration-hover) ease,
                      background var(--duration-hover) ease,
                      opacity var(--duration-hover) ease;
        }
        .fw-card:hover {
          border-color: var(--border-active);
          border-left-color: var(--fw-color);
          background: rgba(var(--fw-rgb), 0.03);
        }
        .fw-badge {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          letter-spacing: 0.06em;
          padding: 3px 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 16px;
          align-self: flex-start;
        }
        .fw-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
          opacity: 0.6;
        }
        .fw-card-title {
          font-family: var(--mono);
          font-size: var(--text-body);
          font-weight: 500;
          color: var(--text-heading);
          margin-bottom: 12px;
        }
        .fw-card-copy {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.7;
          margin-bottom: 10px;
          flex: 1;
        }
        .fw-card-secondary {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--text-dim);
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .fw-card-cta {
          font-family: var(--mono);
          font-size: var(--text-caption);
          text-decoration: none;
          margin-top: auto;
          align-self: flex-start;
          transition: opacity var(--duration-hover) ease;
        }
        .fw-card-cta:hover { opacity: 0.7; }
      `}</style>
    </section>
  )
}
