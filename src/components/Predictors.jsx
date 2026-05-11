import { useReveal } from '../hooks/useReveal'
import { SignalSymbol } from './OrganicSymbols'

function PredCard({ color, colorRgb, badge, badgeColor, title, copy, secondary, metrics, ctaText, ctaHref, index, revealed }) {
  return (
    <div
      className="pred-card"
      style={{
        '--pc-color': color,
        '--pc-rgb': colorRgb,
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.8s var(--ease-out) ${index * 180}ms, transform 0.7s var(--ease-out) ${index * 180}ms`,
      }}
    >
      <span className="pred-badge" style={{ color: badgeColor, background: `rgba(${colorRgb},0.08)` }}>
        <span className="pred-badge-dot" style={{ background: badgeColor }} />
        {badge}
      </span>
      <h3 className="pred-card-title">{title}</h3>
      <p className="pred-card-copy">{copy}</p>
      <p className="pred-card-secondary">{secondary}</p>
      {metrics && <p className="pred-card-metrics">{metrics}</p>}
      <a href={ctaHref} className="pred-card-cta" style={{ color: badgeColor }}>
        {ctaText} →
      </a>
    </div>
  )
}

export default function Predictors({ data, loading }) {
  const { ref, revealed } = useReveal(0.25)

  const headline = data?.headline
  const sq = data?.sleep_quality

  const ansMetrics = headline
    ? `AUC ${headline.value.toFixed(2)} · CI95 ${headline.ci95[0].toFixed(2)}–${headline.ci95[1].toFixed(2)} · n=${headline.n}`
    : 'AUC — · CI95 —–— · n=—'

  const sqMetrics = sq
    ? `AUC ${sq.auc_loo.toFixed(2)} · CI95 ${sq.auc_ci95_lower.toFixed(2)}–${sq.auc_ci95_upper.toFixed(2)} · n=${sq.n_training}`
    : 'AUC — · CI95 —–— · n=—'

  return (
    <section className="section predictors" id="predictors">
      <span className="eyebrow" style={{ color: 'var(--sea)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <SignalSymbol color="var(--sea)" size={44} />
        PREDICTORS
      </span>
      <h2 className="predictors-title">One pipeline, multiple predictors</h2>
      <p className="predictors-subtitle">
        Once the data is cleaned and structured, different predictors can be built to reflect different clinical findings.
      </p>

      <div className="pred-grid" ref={ref}>
        <PredCard
          color="var(--green)"
          colorRgb="107,158,122"
          badge="PUBLISHED · PUBLIC REPO"
          badgeColor="var(--green)"
          title="ANS Predictor"
          copy="A predictor designed to estimate autonomic symptom burden from processed HRV and longitudinal wearable data. It reflects the first validated modelling layer built on the Kinetica pipeline."
          secondary="Built from longitudinal symptom-linked physiology, not generic wellness scoring."
          metrics={loading ? null : ansMetrics}
          ctaText="View predictor"
          ctaHref="/ans-predictor.html"
          index={0}
          revealed={revealed}
        />
        <PredCard
          color="var(--teal)"
          colorRgb="144,167,165"
          badge="PUBLISHED · SAME PIPELINE"
          badgeColor="var(--teal)"
          title="Sleep Quality Predictor"
          copy="An independent predictor focused on sleep quality as its own clinical signal. It uses the same cleaned physiological foundation, but targets a different outcome: how nocturnal structure and autonomic patterns relate to sleep degradation and recovery."
          secondary="Same data foundation, different outcome, separate clinical finding."
          metrics={loading ? null : sqMetrics}
          ctaText="Explore sleep model"
          ctaHref="/sleep-quality-predictor.html"
          index={1}
          revealed={revealed}
        />
      </div>

      <style>{`
        .predictors-title {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          margin: 16px 0 12px;
        }
        .predictors-subtitle {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-dim);
          line-height: 1.65;
          max-width: 520px;
          margin-bottom: var(--space-subsection);
        }
        .pred-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: stretch;
        }
        @media (max-width: 768px) {
          .pred-grid { grid-template-columns: 1fr; }
        }
        .pred-card {
          border: 1px solid var(--border);
          border-left: 3px solid var(--pc-color);
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 0;
          transition: border-color var(--duration-hover) ease,
                      background var(--duration-hover) ease;
        }
        .pred-card:hover {
          border-color: var(--border-active);
          border-left-color: var(--pc-color);
          background: rgba(var(--pc-rgb), 0.03);
        }
        .pred-badge {
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
        .pred-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
          animation: predDot 2.5s ease-in-out infinite;
        }
        @keyframes predDot {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
        .pred-card-title {
          font-family: var(--mono);
          font-size: var(--text-body);
          font-weight: 500;
          color: var(--text-heading);
          margin-bottom: 12px;
        }
        .pred-card-copy {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.7;
          margin-bottom: 10px;
          flex: 1;
        }
        .pred-card-secondary {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--text-dim);
          margin-bottom: 16px;
          line-height: 1.5;
        }
        .pred-card-metrics {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          letter-spacing: 0.04em;
          margin-bottom: 20px;
          padding: 8px 12px;
          background: var(--fill-teal);
          border: 1px solid var(--border);
        }
        .pred-card-cta {
          font-family: var(--mono);
          font-size: var(--text-caption);
          text-decoration: none;
          margin-top: auto;
          transition: opacity var(--duration-hover) ease;
          align-self: flex-start;
        }
        .pred-card-cta:hover { opacity: 0.7; }
      `}</style>
    </section>
  )
}
