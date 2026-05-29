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
      <h2 className="predictors-title">Idiographic models</h2>

      <p
        className="predictors-narrative"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.9s var(--ease-out), transform var(--anim-base) var(--ease-out)',
        }}
      >
        Models trained on one patient's deep, longitudinal physiology, not on cohorts.
        Each one targets a different clinical signal. The same scaffold accepts new
        targets, new sensors, new validation methods.
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
