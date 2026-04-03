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
    stats: '5 models · 198 days · AUC 0.84',
    statNums: ['5', '198', '0.84'],
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
    stats: '3 CSV files · daily updates',
    statNums: ['3'],
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
    stats: 'ReAct loop · dual-model',
    statNums: ['9'],
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
    stats: 'live data · daily sync',
    statNums: [],
    link: '/diary.html',
    external: false,
    symbolIdx: 3,
  },
]

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
        transform: revealed ? 'scale(1)' : 'scale(0.96)',
        transition: `opacity 0.6s var(--ease-out) ${index * 200}ms, transform 0.6s var(--ease-out) ${index * 200}ms`,
      }}
    >
      <div className="pub-card-header">
        <span className="pub-badge">
          <span className="pub-badge-dot" />
          {card.type}
        </span>
        <span className="pub-card-symbol">
          <Symbol color={card.color} size={28} />
        </span>
      </div>
      <h3 className="pub-card-title">{titleDisplay}</h3>
      <p className="pub-card-desc">{card.desc}</p>
      <p className="pub-card-stats">{card.stats}</p>
    </a>
  )
}

export default function Published() {
  const { ref, revealed } = useReveal(0.25)

  return (
    <section className="section" id="published">
      <span className="eyebrow" style={{ color: 'var(--moss)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <HelixSymbol color="var(--moss)" size={22} />
        PUBLISHED
      </span>
      <h2 className="pub-title">Open research, verifiable systems</h2>

      <div className="pub-grid" ref={ref}>
        {CARDS.map((card, i) => (
          <PubCard key={card.title} card={card} index={i} revealed={revealed} />
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
          transition: transform 0.3s var(--ease-out), box-shadow 0.3s var(--ease-out), border-color 0.3s var(--ease-out);
          cursor: pointer;
        }
        .pub-card:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 6px 24px var(--shadow);
          border-color: var(--card-color);
        }
        .pub-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }
        .pub-card-symbol {
          opacity: 0.6;
          transition: opacity 0.3s ease;
        }
        .pub-card:hover .pub-card-symbol {
          opacity: 1;
        }
        .pub-badge {
          font-family: var(--mono);
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--card-color);
          background: rgba(var(--card-rgb), 0.08);
          padding: 3px 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          transition: background 0.25s ease;
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
        .pub-card:hover .pub-badge-dot {
          animation-duration: 1s;
        }
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
          margin-bottom: 12px;
        }
        .pub-card-stats {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          letter-spacing: 0.04em;
        }
      `}</style>
    </section>
  )
}
