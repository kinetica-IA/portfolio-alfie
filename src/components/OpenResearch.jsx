import { useReveal } from '../hooks/useReveal'
import { HelixSymbol, SignalSymbol, CellSymbol, PulseSymbol, OrbitSymbol, NetworkSymbol } from './OrganicSymbols'

const GITHUB_REPO = 'https://github.com/kinetica-IA/polar-lyme-predictor'

const CARDS = [
  {
    num: '01',
    badge: 'PIPELINE',
    badgeColor: 'var(--teal)',
    badgeRgb: '144,167,165',
    Symbol: NetworkSymbol,
    title: 'Pipeline Polar & Symptoms',
    copy: 'Transforms raw wearable streams and symptom diaries into a clean, longitudinal dataset ready for modelling. Built around Polar exports, advanced HRV features and reproducible nightly jobs.',
    metric: null,
    ctaText: 'View pipeline',
    ctaHref: '/pipeline.html',
    external: false,
    comingSoon: false,
  },
  {
    num: '02',
    badge: 'PREDICTOR',
    badgeColor: 'var(--green)',
    badgeRgb: '107,158,122',
    Symbol: SignalSymbol,
    title: 'ANS Predictor',
    copy: 'Multi-target models that estimate symptom burden from nocturnal HRV and diary-linked physiology. Trained with leave-one-out validation and bootstrap CIs on top of the Polar pipeline.',
    metric: 'AUC up to 0.84 · idiographic N-of-1 study',
    ctaText: 'View predictor',
    ctaHref: '/ans-predictor.html',
    external: false,
    comingSoon: false,
  },
  {
    num: '03',
    badge: 'AGENT',
    badgeColor: 'var(--sea)',
    badgeRgb: '93,138,130',
    Symbol: OrbitSymbol,
    title: 'IO3 Clinical Agent',
    copy: 'A LangGraph-based agent that orchestrates Anthropic models, clinical rules and retrieval for guarded reasoning in chronic care. Designed with a single audited loop, human-on-loop control and traceable session logs.',
    metric: null,
    ctaText: 'View architecture',
    ctaHref: '/io-architecture.html',
    external: false,
    comingSoon: false,
  },
  {
    num: '04',
    badge: 'SAFETY',
    badgeColor: 'var(--warm)',
    badgeRgb: '196,133,90',
    Symbol: PulseSymbol,
    title: 'ALMA Safety & Evaluation',
    copy: 'Deterministic safety layer that screens agent responses for pharmacological risk, diagnostic overreach, false urgency and scope violations. Evaluated on a 30-case clinical test set with per-severity metrics and millisecond-level latency reports.',
    metric: null,
    ctaText: 'See safety layer',
    ctaHref: '/io-architecture.html#alma',
    external: false,
    comingSoon: false,
  },
  {
    num: '05',
    badge: 'KNOWLEDGE',
    badgeColor: 'var(--ice)',
    badgeRgb: '133,168,184',
    Symbol: HelixSymbol,
    title: 'Clinical Knowledge & RAG',
    copy: 'Curated knowledge base with 1,880 audited chunks across HRV, PEM, osteopathy, neurodynamics and portfolio content. RAG pipelines are tested with a 20-question benchmark achieving 0.85 retrieval accuracy overall.',
    metric: null,
    ctaText: 'Explore knowledge stack',
    ctaHref: null,
    external: false,
    comingSoon: true,
  },
  {
    num: null,
    badge: 'REPOSITORY',
    badgeColor: 'var(--green)',
    badgeRgb: '107,158,122',
    Symbol: CellSymbol,
    title: 'Open Research Repository',
    copy: 'Single public repo that hosts the Polar pipeline, ANS predictor code, notebooks and study materials behind Kinetica\'s current research line. Structured for reproducible runs, not marketing screenshots.',
    metric: null,
    ctaText: 'View on GitHub',
    ctaHref: GITHUB_REPO,
    external: true,
    comingSoon: false,
  },
]

function ORCard({ card, index, revealed }) {
  const { Symbol } = card
  return (
    <div
      className={`or-card${card.comingSoon ? ' or-card--soon' : ''}`}
      style={{
        '--or-color': card.badgeColor,
        '--or-rgb': card.badgeRgb,
        opacity: revealed ? (card.comingSoon ? 0.6 : 1) : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.8s var(--ease-out) ${index * 150}ms, transform 0.7s var(--ease-out) ${index * 150}ms`,
      }}
    >
      <div className="or-card-header">
        <span className="or-badge" style={{ color: card.badgeColor, background: `rgba(${card.badgeRgb},0.08)` }}>
          <span className="or-badge-dot" style={{ background: card.badgeColor }} />
          {card.num ? `${card.num} — ${card.badge}` : card.badge}
        </span>
        <span className="or-symbol">
          <Symbol color={card.badgeColor} size={40} />
        </span>
      </div>
      <p className="or-card-title">{card.title}</p>
      <p className="or-card-copy">{card.copy}</p>
      {card.metric && (
        <p className="or-card-stats">{card.metric}</p>
      )}
      {card.comingSoon ? (
        <span className="or-card-soon">Coming soon</span>
      ) : (
        <a
          href={card.ctaHref}
          className="or-card-cta"
          style={{ color: card.badgeColor }}
          {...(card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {card.ctaText} →
        </a>
      )}
    </div>
  )
}

export default function OpenResearch() {
  const { ref, revealed } = useReveal(0.25)

  return (
    <section className="section open-research" id="research">
      <span className="eyebrow" style={{ color: 'var(--moss)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <HelixSymbol color="var(--ice)" size={44} />
        OPEN RESEARCH
      </span>
      <h2 className="or-title">Open research, verifiable systems</h2>

      <div className="or-grid" ref={ref}>
        {CARDS.map((card, i) => (
          <ORCard key={card.badge} card={card} index={i} revealed={revealed} />
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
        .or-card--soon { cursor: default; }
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
          font-family: var(--mono);
          font-size: var(--text-caption);
          font-weight: 500;
          color: var(--text-heading);
          letter-spacing: 0.02em;
          margin-bottom: 10px;
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
        .or-card-soon {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          letter-spacing: 0.04em;
          margin-top: auto;
          opacity: 0.5;
        }
      `}</style>
    </section>
  )
}
