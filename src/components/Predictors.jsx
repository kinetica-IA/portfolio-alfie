import { useReveal } from '../hooks/useReveal'
import { SignalSymbol } from './OrganicSymbols'

export default function Predictors() {
  const { ref, revealed } = useReveal(0.25)

  return (
    <section className="section predictors" id="predictors" ref={ref}>
      <span className="eyebrow" style={{ color: 'var(--sea)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <SignalSymbol color="var(--sea)" size={44} />
        PREDICTORS
      </span>
      <h2 className="predictors-title">Predictors</h2>

      <p
        className="predictors-narrative"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.9s var(--ease-out), transform 0.7s var(--ease-out)',
        }}
      >
        Predictors in Kinetica are idiographic: they focus on one real patient, with wearable HRV
        and prospective symptom tracking. Different models target autonomic burden, overall severity
        and sleep, but all share the same cleaned pipeline and validation logic.
      </p>

      <style>{`
        .predictors-title {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          margin: 16px 0 var(--space-subsection);
        }
        .predictors-narrative {
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
