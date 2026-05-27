import { useReveal } from '../hooks/useReveal'
import { NetworkSymbol } from './OrganicSymbols'

export default function Pipeline() {
  const { ref, revealed } = useReveal(0.25)

  return (
    <section className="section pipeline" id="pipeline" ref={ref}>
      <span className="eyebrow" style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <NetworkSymbol color="var(--green)" size={44} />
        DATA PIPELINE
      </span>
      <h2 className="pipeline-title">System</h2>

      <p
        className="pipeline-narrative"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.9s var(--ease-out), transform var(--anim-base) var(--ease-out)',
        }}
      >
        One longitudinal archive, every layer of the system. Nightly Polar exports, prospective
        symptom diaries and HRV features land in the same versioned pipeline, then feed symptom
        predictors, agent reasoning and safety audits. No demos in disguise — the same data
        moves through every model.
      </p>

      <div className="anchor-row">
        <div className="anchor-stats">
          <span><strong>7</strong> levels L0→L6</span>
          <span className="anchor-sep" />
          <span><strong>243</strong> days</span>
          <span className="anchor-sep" />
          <span><strong>70</strong> features</span>
        </div>
        <a href="#research" className="anchor-link" style={{ color: 'var(--green)' }}>
          See pipeline card ↓
        </a>
      </div>

      <style>{`
        .pipeline-title {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          margin: 16px 0 var(--space-subsection);
        }
        .pipeline-narrative {
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
