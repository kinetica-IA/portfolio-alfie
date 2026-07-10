import { useReveal } from '../hooks/useReveal'
import { HelixSymbol, SignalSymbol, PulseSymbol, NetworkSymbol } from './OrganicSymbols'

const GITHUB_REPO = 'https://github.com/kinetica-IA/polar-lyme-predictor'

// ── Featured: the predictive research line, given visual weight ──────
const FEATURED = [
  {
    badge: 'PIPELINE',
    color: 'var(--green)',
    rgb: '107,158,122',
    Symbol: NetworkSymbol,
    title: 'Pipeline Polar & Symptoms',
    copy: 'Polar exports and prospective symptom diaries flow into one clean, versioned longitudinal dataset — every level L0→L6 reproducible.',
    metric: '71 HRV features · deterministic nightly jobs',
    ctaText: 'View pipeline',
    ctaHref: '/pipeline.html',
  },
  {
    badge: 'PREDICTOR',
    color: 'var(--sea)',
    rgb: '93,138,130',
    Symbol: SignalSymbol,
    title: 'ANS Predictor',
    copy: 'Multi-target models estimate symptom burden from nocturnal HRV and diary-linked physiology, on the same Polar pipeline.',
    metric: 'AUC 0.84 autonomic · 0.92 severity · n=61',
    ctaText: 'View predictor',
    ctaHref: '/ans-predictor.html',
  },
  {
    badge: 'PREDICTOR',
    color: 'var(--ice)',
    rgb: '133,168,184',
    Symbol: PulseSymbol,
    title: 'Sleep Quality Predictor',
    copy: 'Sleep quality treated as its own clinical signal — how nocturnal structure and autonomic patterns track perceived degradation and recovery.',
    metric: 'AUC 0.77 · same physiological foundation',
    ctaText: 'Explore sleep model',
    ctaHref: '/sleep-quality-predictor.html',
  },
  {
    badge: 'ANALYSIS',
    color: 'var(--sand)',
    rgb: '191,168,122',
    Symbol: SignalSymbol,
    title: 'Cross-Predictor Convergence',
    copy: 'Where two independent models agree: ANS and Sleep each selected nocturnal RMSSD as their top fatigue feature, on their own.',
    metric: 'r=0.66 · 79% day-level agreement · n=42',
    ctaText: 'Explore convergence',
    ctaHref: '/convergence-analysis.html',
  },
]

// ── Index: the architecture and infrastructure, as a tidy list ──────
const INDEX = [
  {
    badge: 'KNOWLEDGE',
    color: 'var(--ice)',
    title: 'Clinical Knowledge & RAG',
    copy: 'A curated base of 1,880 audited chunks across HRV, PEM, osteopathy and neurodynamics, benchmarked at 0.85 retrieval accuracy.',
    ctaHref: '/knowledge-rag.html',
    external: false,
  },
  {
    badge: 'REPOSITORY',
    color: 'var(--green)',
    title: 'Open Research Repository',
    copy: 'The public repo: Polar pipeline, predictor code, notebooks and study materials — structured for reproducible runs.',
    ctaHref: GITHUB_REPO,
    external: true,
  },
]

function FeaturedCard({ card, index, revealed }) {
  const { Symbol } = card
  return (
    <div
      className="or-card"
      style={{
        '--or-color': card.color,
        '--or-rgb': card.rgb,
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.8s var(--ease-out) ${index * 120}ms, transform var(--anim-base) var(--ease-out) ${index * 120}ms`,
      }}
    >
      <div className="or-card-header">
        <span className="or-badge" style={{ color: card.color, background: `rgba(${card.rgb},0.08)` }}>
          <span className="or-badge-dot" style={{ background: card.color }} />
          {card.badge}
        </span>
        <span className="or-symbol">
          <Symbol color={card.color} size={40} />
        </span>
      </div>
      <p className="or-card-title">{card.title}</p>
      <p className="or-card-copy">{card.copy}</p>
      <p className="or-card-stats">{card.metric}</p>
      <a href={card.ctaHref} className="or-card-cta" style={{ color: card.color }}>
        {card.ctaText} →
      </a>
    </div>
  )
}

function IndexRow({ item, index, revealed }) {
  return (
    <a
      href={item.ctaHref}
      className="or-row"
      style={{
        '--or-color': item.color,
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(10px)',
        transition: `opacity 0.7s var(--ease-out) ${index * 90 + 200}ms, transform 0.6s var(--ease-out) ${index * 90 + 200}ms`,
      }}
      {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <span className="or-row-dot" style={{ background: item.color }} />
      <span className="or-row-badge" style={{ color: item.color }}>{item.badge}</span>
      <span className="or-row-text">
        <span className="or-row-title">{item.title}</span>
        <span className="or-row-copy">{item.copy}</span>
      </span>
      <span className="or-row-arrow">→</span>
    </a>
  )
}

export default function OpenResearch() {
  const { ref, revealed } = useReveal(0.2)
  const { ref: idxRef, revealed: idxRevealed } = useReveal(0.2)

  return (
    <section className="section open-research" id="research">
      <span className="eyebrow" style={{ color: 'var(--moss)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <HelixSymbol color="var(--ice)" size={44} />
        OPEN RESEARCH
      </span>
      <h2 className="or-title">Open research, verifiable systems</h2>
      <p className="or-pubmed">
        Every piece is public. The work below opens to code and a reproducible run,
        with claims anchored in peer-reviewed sources.
      </p>

      <div className="or-grid" ref={ref}>
        {FEATURED.map((card, i) => (
          <FeaturedCard key={card.title} card={card} index={i} revealed={revealed} />
        ))}
      </div>

      <div className="or-index" ref={idxRef}>
        <span className="or-index-label">ARCHITECTURE & INFRASTRUCTURE</span>
        <div className="or-rows">
          {INDEX.map((item, i) => (
            <IndexRow key={item.title} item={item} index={i} revealed={idxRevealed} />
          ))}
        </div>
      </div>

      <style>{`
        .or-title {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          margin: 16px 0 16px;
        }
        .or-pubmed {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-dim);
          line-height: 1.7;
          max-width: 560px;
          margin-bottom: var(--space-subsection);
          opacity: 0.8;
        }
        /* Featured grid — two larger cards per row */
        .or-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        @media (max-width: 640px) {
          .or-grid { grid-template-columns: 1fr; }
        }
        .or-card {
          border: 1px solid var(--border);
          border-top: 2px solid var(--or-color);
          padding: 28px;
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
        .or-card-title {
          font-family: var(--sans);
          font-size: var(--text-subsection);
          font-weight: 400;
          color: var(--text-heading);
          letter-spacing: 0.01em;
          margin-bottom: 10px;
        }
        .or-card-copy {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.65;
          margin-bottom: 12px;
          flex: 1;
        }
        .or-card-stats {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          letter-spacing: 0.04em;
          margin-bottom: 18px;
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
        /* Index list — compact rows, clearly secondary */
        .or-index {
          margin-top: 48px;
        }
        .or-index-label {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          letter-spacing: 0.12em;
          color: var(--text-dim);
          opacity: 0.7;
        }
        .or-rows {
          display: flex;
          flex-direction: column;
          margin-top: 14px;
        }
        .or-row {
          display: grid;
          grid-template-columns: auto 110px 1fr auto;
          align-items: baseline;
          gap: 16px;
          padding: 16px 0;
          border-top: 1px solid var(--border);
          text-decoration: none;
          color: inherit;
          transition: padding-left var(--duration-hover) ease, background var(--duration-hover) ease;
        }
        .or-rows .or-row:last-child {
          border-bottom: 1px solid var(--border);
        }
        .or-row:hover {
          padding-left: 10px;
          background: linear-gradient(90deg, rgba(var(--or-rgb,144,167,165), 0.05), transparent 70%);
        }
        .or-row-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          align-self: center;
        }
        .or-row-badge {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          letter-spacing: 0.06em;
        }
        .or-row-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .or-row-title {
          font-family: var(--mono);
          font-size: var(--text-caption);
          font-weight: 500;
          color: var(--text-heading);
        }
        .or-row:hover .or-row-title { color: var(--or-color); }
        .or-row-copy {
          font-size: var(--text-caption);
          font-weight: 300;
          color: var(--text-dim);
          line-height: 1.55;
        }
        .or-row-arrow {
          font-family: var(--mono);
          color: var(--text-dim);
          align-self: center;
          transition: transform var(--duration-hover) ease, color var(--duration-hover) ease;
        }
        .or-row:hover .or-row-arrow {
          transform: translateX(3px);
          color: var(--or-color);
        }
        @media (max-width: 640px) {
          .or-row {
            grid-template-columns: auto 1fr;
            gap: 6px 12px;
          }
          .or-row-badge { grid-column: 2; }
          .or-row-text { grid-column: 2; }
          .or-row-arrow { display: none; }
        }
      `}</style>
    </section>
  )
}
