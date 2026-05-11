import { useReveal } from '../hooks/useReveal'
import { useTextDecode } from '../hooks/useTextDecode'
import { HelixSymbol, SignalSymbol, CellSymbol } from './OrganicSymbols'

const CARD_SYMBOLS = [SignalSymbol, HelixSymbol, CellSymbol]

const CARDS = [
  {
    title: 'polar-lyme-predictor',
    type: 'REPOSITORY',
    color: 'var(--green)',
    colorRgb: '107,158,122',
    desc: 'Open-source repository — code, raw data, automation. MIT licensed.',
    expandedDesc: 'GitHub repo with full pipeline: extract_polar.py, compute_hrv.py, retrain_predictor.py. GitHub Actions automate nightly Polar fetch + retrain on diary push. Reproducible from clone.',
    stats: (headline) => headline
      ? `5 targets · best AUC ${headline.value.toFixed(2)} (autonomic dysfunction · n=${headline.n})`
      : '5 targets · best AUC 0.83 (autonomic dysfunction · n=55)',
    link: '/ans-predictor.html',
    external: false,
    symbolIdx: 0,
  },
  {
    title: 'Biometric Data Archive',
    type: 'DATASET',
    color: 'var(--ice)',
    colorRgb: '133,168,184',
    desc: 'Raw RR intervals, daily symptom diary, processed HRV features.',
    expandedDesc: 'Three CSV files: hrv_rr_nightly.csv, diary_live.csv, hrv_features.csv. Updated nightly via Polar AccessLink API daemon. MIT licensed.',
    stats: '3 CSV files · daily updates',
    link: 'https://github.com/kinetica-IA/polar-lyme-predictor',
    external: true,
    symbolIdx: 1,
  },
  {
    title: 'Clinical Diary Viewer',
    type: 'APPLICATION',
    color: 'var(--sea)',
    colorRgb: '93,138,130',
    desc: 'Live time series visualization · daily sync.',
    expandedDesc: 'Daily severity, HRV trends, sleep scores, prediction confidence. All data rendered from live pipeline. Also writes back to diary_live.csv via GitHub Contents API.',
    stats: 'live data · daily sync',
    link: '/diary.html',
    external: false,
    symbolIdx: 2,
  },
]

function PubCard({ card, index, revealed, headline }) {
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
      <p className="pub-card-stats">{typeof card.stats === 'function' ? card.stats(headline) : card.stats}</p>
      <span className="pub-card-arrow">→</span>
    </a>
  )
}

export default function Research({ data }) {
  const { ref, revealed } = useReveal(0.25)

  return (
    <section className="section" id="research">
      <span className="eyebrow" style={{ color: 'var(--moss)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <HelixSymbol color="var(--ice)" size={44} />
        RESEARCH
      </span>
      <h2 className="pub-title">Open data, verifiable pipeline</h2>

      <div className="pub-grid" ref={ref}>
        {CARDS.map((card, i) => (
          <PubCard key={card.title} card={card} index={i} revealed={revealed} headline={data?.headline} />
        ))}
      </div>

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
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 768px) {
          .pub-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
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
      `}</style>
    </section>
  )
}
