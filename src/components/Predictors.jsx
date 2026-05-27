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
        Idiographic by design — one patient, deep longitudinal data, three clinical targets.
        Autonomic burden, overall severity and sleep each get their own model, all trained
        on the same cleaned physiology with leave-one-out validation and bootstrap confidence
        intervals.
      </p>

      <div className="anchor-row">
        <div className="anchor-stats">
          <span><strong>0.84</strong> autonomic</span>
          <span className="anchor-sep" />
          <span><strong>0.92</strong> severity</span>
          <span className="anchor-sep" />
          <span><strong>0.77</strong> sleep</span>
        </div>
        <a href="#research" className="anchor-link" style={{ color: 'var(--sea)' }}>
          See predictor cards ↓
        </a>
      </div>

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
