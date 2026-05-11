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
          transition: 'opacity 0.9s var(--ease-out), transform 0.7s var(--ease-out)',
        }}
      >
        IO3 and ALMA capture how the agent reasons and where it must stop. IO3 handles context,
        tools and multi-step thought; ALMA sits alongside it as a safety lens, scoring responses
        against clinical boundaries before anything reaches the clinician.
      </p>

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
      `}</style>
    </section>
  )
}
