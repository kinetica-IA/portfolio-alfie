import { useState } from 'react'

const TARGET_NAMES = {
  severity: 'Severity',
  pem: 'Post-Exertional Malaise',
  fatiga: 'Fatigue',
  niebla_mental: 'Brain Fog',
  disfuncion_autonomica: 'Autonomic Dysfunction',
}

const TARGET_EXPLANATIONS = {
  severity: 'Overall symptom burden predicted 48h ahead using nocturnal RMSSD and ANS deviation score.',
  pem: 'Post-exertional malaise predicted from same-night RMSSD and autonomic recovery level.',
  fatiga: 'Fatigue predicted using consecutive nights of RMSSD decline combined with sleep fragmentation.',
  niebla_mental: 'Brain fog shows strong signal but requires more data — current class split is 54/6.',
  disfuncion_autonomica: 'The only target that selected advanced HRV features: LF/HF ratio (sympathovagal balance) and SD1 (short-term Poincaré variability). Extracted from raw RR intervals using neurokit2.',
}

function aucColor(auc) {
  if (auc >= 0.80) return 'var(--green)'
  if (auc >= 0.70) return 'var(--accent)'
  return 'var(--warm)'
}

function TargetCard({ name, target }) {
  const [expanded, setExpanded] = useState(false)
  const auc = target.best_auc
  const ci = target.best_auc_ci95
  const features = target.selected_features
  const color = aucColor(auc)
  const barWidth = ((auc - 0.5) / 0.5) * 100
  const ciLeft = ((ci[0] - 0.5) / 0.5) * 100
  const ciWidth = ((ci[1] - ci[0]) / 0.5) * 100
  const isImbalanced = name === 'niebla_mental'

  return (
    <div
      className={`target-card ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
      style={{ borderTopColor: color }}
    >
      <div className="target-eyebrow eyebrow">
        {TARGET_NAMES[name]}
        {isImbalanced && <span className="target-warning"> ⚠ class imbalance</span>}
      </div>

      <div className="target-auc-container">
        <div className="target-auc-bar">
          <div className="auc-fill" style={{ width: `${barWidth}%`, background: color }} />
          <div className="auc-ci" style={{
            left: `${ciLeft}%`,
            width: `${ciWidth}%`,
            background: color,
          }} />
        </div>
        <span className="auc-value" style={{ color }}>{auc.toFixed(2)}</span>
      </div>

      <div className="target-ci">
        CI 95%: [{ci[0].toFixed(2)}, {ci[1].toFixed(2)}]
      </div>

      <div className="target-features">
        {features.map(f => f.replace(/_/g, ' ')).join(' · ')}
      </div>

      <div className="target-explain">
        {TARGET_EXPLANATIONS[name]}
      </div>
    </div>
  )
}

export default function ResearchFindings({ data, loading }) {
  const targets = data?.predictor?.targets
  const nTraining = data?.predictor?.n_training || '—'
  const nDays = data?.series?.length || '—'

  return (
    <section className="section" id="research">
      <div className="eyebrow" style={{ marginBottom: 8 }}>RESEARCH FINDINGS</div>
      <h2 className="research-subtitle">
        Multi-symptom prediction from nocturnal autonomic data
      </h2>
      <p className="research-context">
        N={nTraining} prospective pairs · {nDays} days longitudinal · LOO-CV · Bootstrap 1000×
      </p>

      {loading ? (
        <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: 11 }}>Loading data...</p>
      ) : (
        <>
          <div className="target-grid">
            {targets && Object.entries(targets).map(([key, val]) => (
              <TargetCard key={key} name={key} target={val} />
            ))}
          </div>

          <div className="finding-highlight">
            <div className="eyebrow" style={{ color: 'var(--gold)', marginBottom: 8 }}>KEY FINDING</div>
            <p>
              Autonomic dysfunction is the only symptom predicted by advanced HRV features
              — LF/HF ratio and SD1 — extracted from raw RR intervals.
              This was not possible with Polar's proprietary metrics alone.
            </p>
            <a href="https://github.com/kinetica-IA/polar-lyme-predictor" target="_blank" rel="noopener noreferrer">
              View methodology on GitHub →
            </a>
          </div>
        </>
      )}

      <style>{`
        .research-subtitle {
          font-family: var(--sans);
          font-weight: 300;
          font-size: 1.15rem;
          color: var(--text-sec);
          margin-bottom: 8px;
        }
        .research-context {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.04em;
          margin-bottom: 32px;
        }
        .target-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        @media (max-width: 768px) {
          .target-grid { grid-template-columns: 1fr; }
        }
        .target-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(4px);
          border: 1px solid var(--border);
          border-top: 3px solid var(--accent);
          border-radius: var(--radius);
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .target-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px var(--shadow);
        }
        .target-warning {
          color: var(--warm);
          font-size: 9px;
        }
        .target-auc-container {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 12px 0 8px;
        }
        .target-auc-bar {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          background: rgba(144, 167, 165, 0.12);
          position: relative;
          overflow: hidden;
        }
        .auc-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.6s ease;
        }
        .auc-ci {
          position: absolute;
          top: 0;
          height: 100%;
          opacity: 0.25;
          border-radius: 3px;
        }
        .auc-value {
          font-family: var(--mono);
          font-size: 14px;
          font-weight: 500;
          min-width: 36px;
          text-align: right;
        }
        .target-ci {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          margin-bottom: 8px;
        }
        .target-features {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.04em;
          margin-bottom: 4px;
        }
        .target-explain {
          font-family: var(--sans);
          font-size: 12px;
          color: var(--text-sec);
          line-height: 1.5;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, margin 0.3s ease;
          margin-top: 0;
        }
        .target-card.expanded .target-explain {
          max-height: 200px;
          margin-top: 12px;
        }
        .finding-highlight {
          border-left: 3px solid var(--gold);
          padding: 20px 20px 20px 20px;
          background: rgba(212, 168, 67, 0.04);
          border-radius: var(--radius);
          margin-top: 8px;
        }
        .finding-highlight p {
          font-size: 14px;
          color: var(--text-sec);
          line-height: 1.6;
          margin-bottom: 12px;
        }
        .finding-highlight a {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--gold);
        }
      `}</style>
    </section>
  )
}
