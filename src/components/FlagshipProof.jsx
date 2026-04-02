import { useState } from 'react'

function aucColor(v) {
  if (v >= 0.80) return 'var(--green)'
  if (v >= 0.70) return 'var(--teal)'
  return 'var(--warm)'
}

const TARGET_LABELS = {
  severity: 'Severity',
  disfuncion_autonomica: 'Autonomic Dysfunction',
  pem: 'Post-Exertional Malaise',
  fatiga: 'Fatigue',
  niebla_mental: 'Brain Fog',
}

export default function FlagshipProof({ data, loading }) {
  const [expanded, setExpanded] = useState(false)

  const targets = data?.predictor?.targets
  const severity = targets?.severity
  const autonomic = targets?.disfuncion_autonomica
  const residuals = data?.predictor?.residuals
  const nDays = data?.series?.length || 198
  const nTargets = targets ? Object.keys(targets).length : 5
  const nPairs = data?.predictor?.n_training || 60

  return (
    <section className="section" id="research">
      <span className="eyebrow">FLAGSHIP RESEARCH</span>
      <h2 className="fp-title">Five symptoms, one watch, zero hospital visits</h2>
      <p className="fp-context">
        N={nPairs} · {nDays} days · LOO-CV · Bootstrap 1000×
      </p>

      {loading ? (
        <p className="fp-loading">Loading...</p>
      ) : (
        <>
          {/* Hero metrics */}
          <div className="fp-metrics">
            <div className="fp-metric">
              <span className="fp-metric-value">{severity?.best_auc?.toFixed(2) || '0.84'}</span>
              <span className="fp-metric-label">Severity AUC</span>
            </div>
            <div className="fp-metric">
              <span className="fp-metric-value">{autonomic?.best_auc?.toFixed(2) || '0.86'}</span>
              <span className="fp-metric-label">Autonomic AUC</span>
            </div>
            <div className="fp-metric">
              <span className="fp-metric-value">{nDays}</span>
              <span className="fp-metric-label">Days monitored</span>
            </div>
            <div className="fp-metric">
              <span className="fp-metric-value">{nTargets}</span>
              <span className="fp-metric-label">Symptom targets</span>
            </div>
          </div>

          {/* Key finding */}
          <div className="fp-finding">
            <span className="eyebrow" style={{ color: 'var(--warm)' }}>KEY FINDING</span>
            <p className="fp-finding-text">
              Autonomic dysfunction is the only symptom predicted by advanced HRV
              features — LF/HF ratio and SD1 — extracted from raw RR intervals.
              Physiologically coherent: the model uses measures of autonomic balance
              to predict autonomic dysfunction.
            </p>
          </div>

          {/* Expandable targets */}
          <div className="fp-expand-section">
            <button
              className="fp-toggle"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? '− Collapse' : `+ All ${nTargets} targets with confidence intervals`}
            </button>

            <div className={`fp-targets ${expanded ? 'fp-targets--open' : ''}`}>
              {targets && Object.entries(targets).map(([key, t]) => (
                <div key={key} className="fp-target-row">
                  <span className="fp-target-name">{TARGET_LABELS[key] || key}</span>
                  <span className="fp-target-auc" style={{ color: aucColor(t.best_auc) }}>
                    {t.best_auc.toFixed(2)}
                  </span>
                  <div className="fp-target-bar">
                    <div
                      className="fp-target-bar-fill"
                      style={{
                        width: `${((t.best_auc - 0.5) / 0.5) * 100}%`,
                        background: aucColor(t.best_auc),
                      }}
                    />
                  </div>
                  <span className="fp-target-ci">
                    {t.best_auc_ci95[0].toFixed(2)}–{t.best_auc_ci95[1].toFixed(2)}
                  </span>
                </div>
              ))}
              {residuals && (
                <p className="fp-residuals-note">
                  Residual ρ: brain fog +{residuals.brain_fog?.rho || '0.547'} · autonomic +{residuals.autonomic_dysfunction?.rho || '0.372'}
                </p>
              )}
            </div>
          </div>

          <a
            href="https://github.com/kinetica-IA/polar-lyme-predictor"
            target="_blank"
            rel="noopener noreferrer"
            className="fp-cta"
          >
            View methodology on GitHub →
          </a>
        </>
      )}

      <style>{`
        .fp-title {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text);
          line-height: 1.35;
          margin: 16px 0 8px;
        }
        .fp-context {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          letter-spacing: 0.04em;
          margin-bottom: var(--space-subsection);
        }
        .fp-loading {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--text-dim);
        }

        /* Metrics */
        .fp-metrics {
          display: flex;
          gap: 56px;
          margin-bottom: 64px;
          flex-wrap: wrap;
        }
        .fp-metric {
          display: flex;
          flex-direction: column;
        }
        .fp-metric-value {
          font-family: var(--mono);
          font-size: 3rem;
          font-weight: 400;
          color: var(--text);
          line-height: 1;
        }
        .fp-metric-label {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-top: 10px;
        }
        @media (max-width: 640px) {
          .fp-metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 36px; }
          .fp-metric-value { font-size: 2.2rem; }
        }

        /* Finding */
        .fp-finding {
          border-left: 2px solid var(--warm);
          padding-left: 20px;
          margin-bottom: var(--space-subsection);
          max-width: 600px;
        }
        .fp-finding .eyebrow {
          display: block;
          margin-bottom: 10px;
        }
        .fp-finding-text {
          font-size: var(--text-body);
          color: var(--text-sec);
          line-height: 1.75;
        }

        /* Expandable */
        .fp-expand-section {
          margin-bottom: 40px;
        }
        .fp-toggle {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--teal);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: block;
          margin-bottom: 20px;
          transition: color 0.2s;
        }
        .fp-toggle:hover { color: var(--green); }
        .fp-targets {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.5s ease;
        }
        .fp-targets--open { max-height: 500px; }

        .fp-target-row {
          display: grid;
          grid-template-columns: 180px 48px 1fr 80px;
          align-items: center;
          gap: 16px;
          padding: 14px 0;
          border-bottom: 1px solid var(--border);
        }
        .fp-target-row:last-of-type { border-bottom: none; }
        .fp-target-name {
          font-family: var(--sans);
          font-size: var(--text-body);
          font-weight: 400;
          color: var(--text);
        }
        .fp-target-auc {
          font-family: var(--mono);
          font-size: 15px;
          font-weight: 500;
          text-align: right;
        }
        .fp-target-bar {
          height: 3px;
          background: rgba(144,167,165,0.06);
          overflow: hidden;
        }
        .fp-target-bar-fill {
          height: 100%;
          transition: width 0.6s ease;
        }
        .fp-target-ci {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--text-dim);
          text-align: right;
        }
        .fp-residuals-note {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--text-dim);
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        @media (max-width: 640px) {
          .fp-target-row { grid-template-columns: 1fr 48px; }
          .fp-target-bar, .fp-target-ci { display: none; }
        }

        /* CTA */
        .fp-cta {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--green);
        }
      `}</style>
    </section>
  )
}
