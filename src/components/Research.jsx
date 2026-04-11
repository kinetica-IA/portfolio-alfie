import { useReveal } from '../hooks/useReveal'
import { useTextDecode } from '../hooks/useTextDecode'
import { HelixSymbol, SignalSymbol, CellSymbol, OrbitSymbol } from './OrganicSymbols'

const CARD_SYMBOLS = [SignalSymbol, HelixSymbol, OrbitSymbol, CellSymbol]

const CARDS = [
  {
    title: 'polar-lyme-predictor',
    type: 'REPOSITORY',
    color: 'var(--green)',
    colorRgb: '107,158,122',
    desc: 'Multi-symptom clinical prediction from wearable HRV data. Open-source, fully reproducible.',
    expandedDesc: 'Five independent models trained on nocturnal heart rate data. Each model selects its own features via forward selection across 13 HRV candidates and 3 lag windows. Validated with leave-one-out cross-validation.',
    stats: '5 models · 200+ days · AUC 0.84',
    link: 'https://github.com/kinetica-IA/polar-lyme-predictor',
    external: true,
    symbolIdx: 0,
  },
  {
    title: 'Biometric Data Archive',
    type: 'DATASET',
    color: 'var(--ice)',
    colorRgb: '133,168,184',
    desc: '200+ nights of RR interval data, daily symptom diary, processed HRV features — all public.',
    expandedDesc: 'Raw RR intervals from Polar Grit X2, daily symptom severity scores across 5 dimensions, and 13 processed HRV features. Updated nightly via automated pipeline.',
    stats: '3 CSV files · daily updates',
    link: 'https://github.com/kinetica-IA/polar-lyme-predictor',
    external: true,
    symbolIdx: 1,
  },
  {
    title: 'IO3 Architecture',
    type: 'DOCUMENTATION',
    color: 'var(--warm)',
    colorRgb: '196,133,90',
    desc: '9-node LangGraph clinical reasoning agent. Full system diagram and design rationale.',
    expandedDesc: 'ReAct loop with Haiku for divergent exploration and Sonnet for synthesis. Human-on-loop architecture for EU AI Act compliance. ALMA ethical framework for clinical safety boundaries.',
    stats: 'ReAct loop · dual-model',
    link: '/io-architecture.html',
    external: false,
    symbolIdx: 2,
  },
  {
    title: 'Clinical Diary Viewer',
    type: 'APPLICATION',
    color: 'var(--sea)',
    colorRgb: '93,138,130',
    desc: 'Interactive symptom + HRV time series visualization. See the raw data behind the models.',
    expandedDesc: 'Explore the full timeline: daily severity, HRV trends, sleep scores, and prediction confidence. All data rendered from the live pipeline — nothing simulated.',
    stats: 'live data · daily sync',
    link: '/diary.html',
    external: false,
    symbolIdx: 3,
  },
]

const TARGET_LABELS = {
  severity: 'Severity',
  disfuncion_autonomica: 'Autonomic Dysfunction',
  pem: 'Post-Exertional Malaise',
  fatiga: 'Fatigue',
  niebla_mental: 'Brain Fog',
}

function aucColor(v) {
  if (v >= 0.80) return 'var(--green)'
  if (v >= 0.70) return 'var(--teal)'
  return 'var(--warm)'
}

function PubCard({ card, index, revealed }) {
  const titleDisplay = useTextDecode(card.title, {
    duration: 1200, delay: 0, loop: false, isActive: revealed,
  })
  const Symbol = CARD_SYMBOLS[card.symbolIdx] || SignalSymbol

  return (
    <a
      href={card.link}
      {...(card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="pub-card"
      style={{
        '--card-color': card.color,
        '--card-rgb': card.colorRgb,
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.8s var(--ease-out) ${index * 250}ms, transform 0.8s var(--ease-out) ${index * 250}ms`,
      }}
    >
      <div className="pub-card-header">
        <span className="pub-badge">
          <span className="pub-badge-dot" />
          {card.type}
        </span>
        <span className="pub-card-symbol">
          <Symbol color={card.color} size={56} />
        </span>
      </div>
      <h3 className="pub-card-title">{titleDisplay}</h3>
      <p className="pub-card-desc">{card.desc}</p>
      <div className="pub-card-expanded">
        <p className="pub-card-expanded-text">{card.expandedDesc}</p>
      </div>
      <p className="pub-card-stats">{card.stats}</p>
      <span className="pub-card-arrow">→</span>
    </a>
  )
}

export default function Research({ data, loading }) {
  const { ref, revealed } = useReveal(0.25)
  const { ref: targetsRef, revealed: targetsVisible } = useReveal(0.2)

  const targets = data?.predictor?.targets
  const residuals = data?.predictor?.residuals

  return (
    <section className="section" id="research">
      <span className="eyebrow" style={{ color: 'var(--moss)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <HelixSymbol color="var(--ice)" size={44} />
        RESEARCH
      </span>
      <h2 className="pub-title">Open research, verifiable systems</h2>

      <div className="pub-grid" ref={ref}>
        {CARDS.map((card, i) => (
          <PubCard key={card.title} card={card} index={i} revealed={revealed} />
        ))}
      </div>

      {/* Prediction results from polar_live.json */}
      {!loading && targets && (
        <div className="fp-results" ref={targetsRef}>
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
              The model uses measures of autonomic balance to predict autonomic dysfunction.
              Physiologically coherent.
            </p>
          </div>

          <div className="fp-targets">
            {Object.entries(targets).map(([key, t], i) => {
              const isBrainFog = key === 'niebla_mental'
              return (
                <div
                  key={key}
                  className={`fp-target-row ${isBrainFog ? 'fp-target-row--flagged' : ''}`}
                  style={{
                    opacity: targetsVisible ? 1 : 0,
                    transform: targetsVisible ? 'translateY(0)' : 'translateY(12px)',
                    transition: `opacity 0.8s var(--ease-out) ${i * 180 + 400}ms, transform 0.8s var(--ease-out) ${i * 180 + 400}ms`,
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
                        width: targetsVisible ? `${((t.best_auc - 0.5) / 0.5) * 100}%` : '0%',
                        background: aucColor(t.best_auc),
                        transitionDelay: `${i * 100 + 400}ms`,
                      }}
                    />
                    <span
                      className="fp-bar-pulse"
                      style={{
                        background: aucColor(t.best_auc),
                        animationDelay: `${i * 600}ms`,
                        opacity: targetsVisible ? 1 : 0,
                      }}
                    />
                  </div>
                  <span className="fp-target-ci">
                    {t.best_auc_ci95[0].toFixed(2)}–{t.best_auc_ci95[1].toFixed(2)}
                  </span>
                </div>
              )
            })}
            <div className="fp-footnotes">
              {residuals && (
                <p className="fp-residuals-note">
                  Residual ρ: brain fog +{residuals.brain_fog?.rho || '0.547'} · autonomic +{residuals.autonomic_dysfunction?.rho || '0.372'}
                </p>
              )}
              <p className="fp-brain-fog-note">
                * Brain Fog AUC (0.99) is likely inflated due to extreme class imbalance (54/6 split).
                Reported for transparency — not used as a headline metric.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="scroll-hook">
        <span className="scroll-hook-text">Get in touch</span>
        <span className="scroll-hook-arrow">↓</span>
      </div>

      <style>{`
        .pub-title {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          line-height: 1.35;
          margin: 16px 0 var(--space-subsection);
        }
        .pub-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 640px) {
          .pub-grid { grid-template-columns: 1fr; }
        }
        .pub-card {
          display: block;
          text-decoration: none;
          padding: 24px;
          border: 1px solid var(--border);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.4s var(--ease-out),
                      box-shadow 0.4s var(--ease-out),
                      border-color 0.4s var(--ease-out),
                      padding-bottom 0.4s var(--ease-out);
        }
        .pub-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 8px 32px var(--shadow);
          border-color: var(--card-color);
          padding-bottom: 28px;
        }
        .pub-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }
        .pub-card-symbol {
          opacity: 0.5;
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .pub-card:hover .pub-card-symbol {
          opacity: 1;
          transform: scale(1.1);
        }
        .pub-badge {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--card-color);
          background: rgba(var(--card-rgb), 0.08);
          padding: 3px 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          transition: background 0.3s ease;
        }
        .pub-card:hover .pub-badge {
          background: rgba(var(--card-rgb), 0.18);
        }
        .pub-badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--card-color);
          animation: pulseDot 2.5s ease-in-out infinite;
        }
        .pub-card:hover .pub-badge-dot { animation-duration: 1s; }
        @keyframes pulseDot {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .pub-card-title {
          font-family: var(--mono);
          font-size: var(--text-body);
          font-weight: 500;
          color: var(--text-heading);
          margin-bottom: 8px;
        }
        .pub-card-desc {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.6;
          margin-bottom: 8px;
        }
        .pub-card-expanded {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.5s var(--ease-out), opacity 0.4s var(--ease-out) 0.1s;
        }
        .pub-card:hover .pub-card-expanded {
          max-height: 120px;
          opacity: 1;
        }
        .pub-card-expanded-text {
          font-size: var(--text-caption);
          font-weight: 300;
          color: var(--text-dim);
          line-height: 1.6;
          padding: 4px 0 12px;
          border-top: 1px solid var(--border);
          margin-top: 4px;
        }
        .pub-card-stats {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          letter-spacing: 0.04em;
        }
        .pub-card-arrow {
          position: absolute;
          bottom: 16px;
          right: 20px;
          font-size: 18px;
          color: var(--card-color);
          opacity: 0;
          transform: translateX(-8px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .pub-card:hover .pub-card-arrow {
          opacity: 0.7;
          transform: translateX(0);
        }

        /* Prediction results (merged from FlagshipProof) */
        .fp-results { margin-top: var(--space-subsection); }
        .fp-finding {
          border-left: 2px solid var(--warm);
          padding-left: 20px;
          margin-bottom: 20px;
          max-width: 600px;
        }
        .fp-finding .eyebrow { display: block; margin-bottom: 12px; }
        .fp-finding-text {
          font-size: var(--text-body);
          color: var(--text-sec);
          line-height: 1.75;
        }
        .fp-targets { margin-bottom: 24px; }
        .fp-target-row {
          display: grid;
          grid-template-columns: 180px 48px 1fr 80px;
          align-items: center;
          gap: 16px;
          padding: 14px 0;
          border-bottom: 1px solid var(--border);
          transition: background var(--duration-hover) ease;
        }
        .fp-target-row:hover { background: rgba(144, 167, 165, 0.08); }
        .fp-target-row:last-of-type { border-bottom: none; }
        .fp-target-name {
          font-family: var(--sans);
          font-size: var(--text-body);
          font-weight: 400;
          color: var(--text);
        }
        .fp-target-auc {
          font-family: var(--mono);
          font-size: var(--text-body);
          font-weight: 500;
          text-align: right;
        }
        .fp-target-bar {
          height: 3px;
          background: var(--fill-teal);
          overflow: visible;
          position: relative;
        }
        .fp-target-bar-fill { height: 100%; transition: width 1s var(--ease-out); }
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
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          text-align: right;
        }
        .fp-footnotes {
          margin-top: 16px;
          padding: 14px 16px;
          overflow-wrap: break-word;
          word-break: break-word;
          background: var(--fill-sand);
          border-left: 2px solid var(--sand);
        }
        .fp-residuals-note {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          margin-bottom: 8px;
        }
        .fp-target-row--flagged { opacity: 0.65; }
        .fp-flag { color: var(--warm); font-weight: 500; margin-left: 4px; }
        .fp-brain-fog-note {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          font-style: italic;
          line-height: 1.6;
        }
        @media (max-width: 640px) {
          .fp-target-row { grid-template-columns: 1fr 48px; }
          .fp-target-bar, .fp-target-ci { display: none; }
        }
      `}</style>
    </section>
  )
}
