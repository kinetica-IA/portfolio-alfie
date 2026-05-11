import { useReveal } from '../hooks/useReveal'
import { HelixSymbol, SignalSymbol, CellSymbol } from './OrganicSymbols'

const CARDS = [
  {
    badge: 'REPOSITORY',
    badgeColor: 'var(--green)',
    badgeRgb: '107,158,122',
    Symbol: SignalSymbol,
    copy: 'Open code, model logic and reproducible structure behind the current Kinetica research line.',
    stats: null,
    ctaText: 'Open repository',
    ctaHref: '/ans-predictor.html',
    external: false,
  },
  {
    badge: 'DATASET',
    badgeColor: 'var(--ice)',
    badgeRgb: '133,168,184',
    Symbol: HelixSymbol,
    copy: 'A longitudinal biometric archive combining nightly RR intervals, symptom tracking and processed feature layers.',
    stats: true,
    ctaText: 'View dataset',
    ctaHref: 'https://github.com/kinetica-IA/polar-lyme-predictor',
    external: true,
  },
  {
    badge: 'APPLICATION',
    badgeColor: 'var(--sea)',
    badgeRgb: '93,138,130',
    Symbol: CellSymbol,
    copy: 'A direct view into the symptom diary used to connect subjective burden with physiological signal over time.',
    stats: null,
    ctaText: 'Open diary',
    ctaHref: '/diary.html',
    external: false,
  },
]

function ORCard({ card, nDays, index, revealed }) {
  const { Symbol } = card
  return (
    <div
      className="or-card"
      style={{
        '--or-color': card.badgeColor,
        '--or-rgb': card.badgeRgb,
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.8s var(--ease-out) ${index * 150}ms, transform 0.7s var(--ease-out) ${index * 150}ms`,
      }}
    >
      <div className="or-card-header">
        <span className="or-badge" style={{ color: card.badgeColor, background: `rgba(${card.badgeRgb},0.08)` }}>
          <span className="or-badge-dot" style={{ background: card.badgeColor }} />
          {card.badge}
        </span>
        <span className="or-symbol">
          <Symbol color={card.badgeColor} size={40} />
        </span>
      </div>
      <p className="or-card-copy">{card.copy}</p>
      {card.stats && (
        <p className="or-card-stats">{nDays !== '—' ? `${nDays} nights` : '—'} · daily updates</p>
      )}
      <a
        href={card.ctaHref}
        className="or-card-cta"
        style={{ color: card.badgeColor }}
        {...(card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {card.ctaText} →
      </a>
    </div>
  )
}

export default function OpenResearch({ data }) {
  const { ref, revealed } = useReveal(0.25)
  const nDays = data?.data_window?.n_days ?? '—'

  return (
    <section className="section open-research" id="research">
      <span className="eyebrow" style={{ color: 'var(--moss)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <HelixSymbol color="var(--ice)" size={44} />
        OPEN RESEARCH
      </span>
      <h2 className="or-title">Open research, verifiable systems</h2>

      <div className="or-grid" ref={ref}>
        {CARDS.map((card, i) => (
          <ORCard key={card.badge} card={card} nDays={nDays} index={i} revealed={revealed} />
        ))}
      </div>

      <style>{`
        .or-title {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          margin: 16px 0 var(--space-subsection);
        }
        .or-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 768px) {
          .or-grid { grid-template-columns: 1fr; }
        }
        .or-card {
          border: 1px solid var(--border);
          border-top: 2px solid var(--or-color);
          padding: 24px;
          display: flex;
          flex-direction: column;
          transition: border-color var(--duration-hover) ease,
                      background var(--duration-hover) ease;
        }
        .or-card:hover {
          border-color: var(--border-active);
          border-top-color: var(--or-color);
          background: rgba(var(--or-rgb), 0.04);
        }
        .or-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 14px;
        }
        .or-badge {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          letter-spacing: 0.06em;
          padding: 3px 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .or-badge-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
          animation: orDot 2.5s ease-in-out infinite;
        }
        @keyframes orDot {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
        .or-symbol {
          opacity: 0.5;
          transition: opacity var(--duration-hover) ease, transform var(--duration-hover) ease;
        }
        .or-card:hover .or-symbol {
          opacity: 1;
          transform: scale(1.08);
        }
        .or-card-copy {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.65;
          margin-bottom: 10px;
          flex: 1;
        }
        .or-card-stats {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          letter-spacing: 0.04em;
          margin-bottom: 16px;
        }
        .or-card-cta {
          font-family: var(--mono);
          font-size: var(--text-caption);
          text-decoration: none;
          margin-top: auto;
          align-self: flex-start;
          transition: opacity var(--duration-hover) ease;
        }
        .or-card-cta:hover { opacity: 0.7; }
      `}</style>
    </section>
  )
}
