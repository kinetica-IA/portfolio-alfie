import { useReveal } from '../hooks/useReveal'
import { useCountUp } from '../hooks/useCountUp'
import { useWordStagger } from '../hooks/useWordStagger'
import { SignalSymbol } from './OrganicSymbols'
import LivePulse from './LivePulse'

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

const METRIC_COLORS = [
  { accent: 'var(--green)', bg: 'rgba(107,158,122,0.06)' },  // severity
  { accent: 'var(--sea)',   bg: 'rgba(93,138,130,0.06)' },    // autonomic
  { accent: 'var(--teal)',  bg: 'rgba(144,167,165,0.06)' },   // days
  { accent: 'var(--warm)',  bg: 'rgba(196,133,90,0.06)' },    // targets
]

function Metric({ value, decimals, label, delay = 0, active, colorIdx }) {
  const display = useCountUp(value, decimals, active, 1100)
  const colors = METRIC_COLORS[colorIdx] || METRIC_COLORS[0]
  return (
    <div className="fp-metric" style={{
      transitionDelay: `${delay}s`,
      background: colors.bg,
      borderTop: `2px solid ${colors.accent}`,
      transform: active ? 'scale(1)' : 'scale(0.97)',
      opacity: active ? 1 : 0,
      transition: `transform 0.5s var(--ease-out) ${delay}s, opacity 0.5s var(--ease-out) ${delay}s`,
    }}>
      <span className="fp-metric-value" style={{ color: colors.accent }}>{display}</span>
      <span className="fp-metric-label">{label}</span>
    </div>
  )
}

export default function FlagshipProof({ data, loading }) {
  const { ref: metricsRef, revealed: metricsVisible } = useReveal(0.2)
  const { ref: titleRef, words: titleWords } = useWordStagger(
    '198 nights, one wristwatch, five predictions'
  )

  const targets = data?.predictor?.targets
  const severity = targets?.severity
  const autonomic = targets?.disfuncion_autonomica
  const residuals = data?.predictor?.residuals
  const nDays = data?.series?.length || 198
  const nTargets = targets ? Object.keys(targets).length : 5
  const nPairs = data?.predictor?.n_training || 60

  return (
    <section className="section" id="research">
      <span className="eyebrow" style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <SignalSymbol color="var(--green)" size={22} />
        FLAGSHIP RESEARCH
      </span>
      <h2 className="fp-title" ref={titleRef}>
        {titleWords.map((w, i) => <span key={i} style={w.style}>{w.text}</span>)}
      </h2>
      <p className="fp-human">
        We trained AI on heart rate data from a consumer wristwatch to predict daily
        symptom severity — without a single blood test or hospital visit.
      </p>
      <p className="fp-context">
        N-of-1 longitudinal design · N={nPairs} pairs · {nDays} days · LOO-CV · Bootstrap 1000×
      </p>

      {loading ? (
        <p className="fp-loading">Loading...</p>
      ) : (
        <>
          <div className="fp-metrics" ref={metricsRef}>
            <Metric value={severity?.best_auc || 0.84} decimals={2} label="Severity AUC" delay={0} active={metricsVisible} colorIdx={0} />
            <Metric value={autonomic?.best_auc || 0.86} decimals={2} label="Autonomic AUC" delay={0.08} active={metricsVisible} colorIdx={1} />
            <Metric value={nDays} decimals={0} label="Days monitored" delay={0.16} active={metricsVisible} colorIdx={2} />
            <Metric value={nTargets} decimals={0} label="Symptom targets" delay={0.24} active={metricsVisible} colorIdx={3} />
          </div>

          {/* Live data pulse */}
          <LivePulse data={data} />

          {/* Key finding */}
          <div className="fp-finding">
            <span className="eyebrow" style={{ color: 'var(--warm)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" style={{ verticalAlign: '-2px', marginRight: '6px' }}>
                <path d="M2 8 Q5 4, 8 8 Q11 12, 14 8" fill="none" stroke="var(--warm)" strokeWidth="1.5" />
              </svg>
              KEY FINDING
            </span>
            <p className="fp-finding-text">
              Autonomic dysfunction is the only symptom predicted by advanced HRV
              features — LF/HF ratio and SD1 — extracted from raw RR intervals.
              Physiologically coherent: the model uses measures of autonomic balance
              to predict autonomic dysfunction.
            </p>
          </div>

          {/* Targets — visible by default */}
          <div className="fp-targets">
            {targets && Object.entries(targets).map(([key, t], i) => {
              const isBrainFog = key === 'niebla_mental'
              return (
                <div
                  key={key}
                  className={`fp-target-row ${isBrainFog ? 'fp-target-row--flagged' : ''}`}
                  style={{
                    opacity: metricsVisible ? 1 : 0,
                    transform: metricsVisible ? 'translateY(0)' : 'translateY(12px)',
                    transition: `opacity 0.4s var(--ease-out) ${i * 60 + 600}ms, transform 0.4s var(--ease-out) ${i * 60 + 600}ms`,
                  }}
                >
                  <span className="fp-target-name">
                    {TARGET_LABELS[key] || key}
                    {isBrainFog && <span className="fp-flag">*</span>}
                  </span>
                  <span className="fp-target-auc" style={{ color: aucColor(t.best_auc) }}>
                    {t.best_auc.toFixed(2)}
                  </span>
                  <div className="fp-target-bar">
                    <div
                      className="fp-target-bar-fill"
                      style={{
                        width: metricsVisible ? `${((t.best_auc - 0.5) / 0.5) * 100}%` : '0%',
                        background: aucColor(t.best_auc),
                        transitionDelay: `${i * 60 + 900}ms`,
                      }}
                    />
                    <span
                      className="fp-bar-pulse"
                      style={{
                        background: aucColor(t.best_auc),
                        animationDelay: `${i * 600}ms`,
                        opacity: metricsVisible ? 1 : 0,
                      }}
                    />
                  </div>
                  <span className="fp-target-ci">
                    {t.best_auc_ci95[0].toFixed(2)}–{t.best_auc_ci95[1].toFixed(2)}
                  </span>
                </div>
              )
            })}
            {residuals && (
              <p className="fp-residuals-note">
                Residual ρ: brain fog +{residuals.brain_fog?.rho || '0.547'} · autonomic +{residuals.autonomic_dysfunction?.rho || '0.372'}
              </p>
            )}
            <p className="fp-brain-fog-note">
              * Brain Fog AUC (0.99) is likely inflated due to extreme class imbalance (54/6 split).
              Reported for transparency; not used as a headline metric.
            </p>
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
          color: var(--text-heading);
          line-height: 1.35;
          margin: 16px 0 10px;
        }
        .fp-human {
          font-family: var(--sans);
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.7;
          max-width: 560px;
          margin: 12px 0 8px;
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

        /* Metrics — card-style with accent colors */
        .fp-metrics {
          display: flex;
          gap: 24px;
          margin-bottom: 72px;
          flex-wrap: wrap;
          padding-bottom: 40px;
          border-bottom: 1px solid var(--border);
        }
        .fp-metric {
          display: flex;
          flex-direction: column;
          position: relative;
          padding: 20px 24px;
          flex: 1;
          min-width: 120px;
          cursor: default;
          transition: transform 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out);
        }
        .fp-metric:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 16px var(--shadow);
        }
        .fp-metric-value {
          font-family: var(--mono);
          font-size: clamp(2.5rem, 4vw, 3.5rem);
          font-weight: 400;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .fp-metric-label {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 12px;
        }
        @media (max-width: 640px) {
          .fp-metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
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
          margin-bottom: 12px;
        }
        .fp-finding-text {
          font-size: var(--text-body);
          color: var(--text-sec);
          line-height: 1.75;
        }

        /* Targets — always visible */
        .fp-targets {
          margin-bottom: 40px;
        }
        .fp-target-row {
          display: grid;
          grid-template-columns: 180px 48px 1fr 80px;
          align-items: center;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid var(--border);
          transition: background var(--duration-hover) ease;
        }
        .fp-target-row:hover {
          background: rgba(144, 167, 165, 0.12);
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
          background: var(--fill-teal);
          overflow: visible;
          position: relative;
        }
        .fp-target-bar-fill {
          height: 100%;
          transition: width 0.8s var(--ease-out);
        }
        .fp-bar-pulse {
          position: absolute;
          right: -2px;
          top: -1.5px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: barPulse 3s ease-in-out infinite;
        }
        @keyframes barPulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
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
          padding-top: 14px;
          border-top: 1px solid var(--border);
        }
        .fp-target-row--flagged {
          opacity: 0.65;
        }
        .fp-flag {
          color: var(--warm);
          font-weight: 500;
          margin-left: 4px;
        }
        .fp-brain-fog-note {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          font-style: italic;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid var(--border);
          max-width: 560px;
          line-height: 1.6;
        }
        @media (max-width: 640px) {
          .fp-target-row { grid-template-columns: 1fr 48px; }
          .fp-target-bar, .fp-target-ci { display: none; }
        }

        /* CTA */
        .fp-cta {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--sea);
          transition: color var(--duration-hover) ease;
        }
        .fp-cta:hover { color: var(--green); }
      `}</style>
    </section>
  )
}
