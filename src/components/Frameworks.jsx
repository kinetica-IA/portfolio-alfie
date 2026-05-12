import { useReveal } from '../hooks/useReveal'
import { OrbitSymbol } from './OrganicSymbols'

export default function Frameworks() {
  const { ref, revealed } = useReveal(0.25)

  return (
    <section className="section frameworks" id="frameworks" ref={ref}>
      <span className="eyebrow" style={{ color: 'var(--teal)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <OrbitSymbol color="var(--teal)" size={44} />
        FRAMEWORKS
      </span>
      <h2 className="frameworks-title">Architecture and safety</h2>

      <p
        className="frameworks-narrative"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.9s var(--ease-out), transform var(--anim-base) var(--ease-out)',
        }}
      >
        IO3 and ALMA capture how the agent reasons and where it must stop. IO3 handles context,
        tools and multi-step thought; ALMA sits alongside it as a safety lens, scoring responses
        against clinical boundaries before anything reaches the clinician.
      </p>

      <div className="anchor-row">
        <div className="anchor-stats">
          <span><strong>IO3</strong> LangGraph agent</span>
          <span className="anchor-sep" />
          <span><strong>ALMA</strong> 30-case eval</span>
        </div>
        <a href="#research" className="anchor-link" style={{ color: 'var(--teal)' }}>
          See framework cards ↓
        </a>
      </div>

      <style>{`
        .frameworks-title {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          margin: 16px 0 var(--space-subsection);
        }
        .frameworks-narrative {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.75;
          max-width: 600px;
        }
        .anchor-row {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-width: 600px;
        }
        .anchor-stats {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          letter-spacing: 0.04em;
        }
        .anchor-stats strong {
          font-weight: 500;
          color: var(--text);
          margin-right: 4px;
        }
        .anchor-sep {
          width: 1px;
          height: 10px;
          background: var(--border);
        }
        .anchor-link {
          font-family: var(--mono);
          font-size: var(--text-caption);
          text-decoration: none;
          transition: opacity var(--duration-hover) ease;
          align-self: flex-start;
        }
        .anchor-link:hover { opacity: 0.7; }
        @media (max-width: 480px) {
          .anchor-sep { display: none; }
        }
      `}</style>
    </section>
  )
}
