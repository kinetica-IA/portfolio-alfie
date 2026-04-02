import { useReveal } from '../hooks/useReveal'
import { useTextDecode } from '../hooks/useTextDecode'
import { NetworkSymbol } from './OrganicSymbols'

const ITEMS = [
  {
    num: '01', color: 'var(--teal)',
    badge: 'PUBLISHED · PUBLIC REPO', badgeClass: 'sys-badge--green',
    title: 'ANS-Based Multi-Symptom Prediction',
    sub: 'N=1 Longitudinal · Post-Lyme Fatigue · Consumer Wearable',
    desc: (nDays, nPairs) =>
      `Five independent predictive models trained on ${nDays} days of nocturnal heart rate data from a Polar Grit X2. Each model selects its own features via forward selection across 13 candidates and 3 lag windows. Validated with leave-one-out cross-validation on ${nPairs} prospective pairs. Confidence intervals via 1000× bootstrap.`,
    stack: 'Python · scikit-learn · neurokit2 · Polar Grit X2 · GitHub Actions',
    link: 'https://github.com/kinetica-IA/polar-lyme-predictor',
    linkText: 'View on GitHub →',
    external: true,
  },
  {
    num: '02', color: 'var(--warm)',
    badge: 'IN PROGRESS · ARCHITECTURE PUBLIC', badgeClass: 'sys-badge--warm',
    title: 'IO3 · Clinical AI Agent',
    sub: 'LangGraph ReAct Loop · Anthropic Claude · Human-on-Loop',
    desc: () =>
      'Local-first clinical reasoning agent. 9-node LangGraph graph with Haiku for divergent exploration and Sonnet for clinical synthesis. Human-on-loop architecture as EU AI Act compliance differentiator. ALMA ethical framework for clinical safety boundaries.',
    stack: 'LangGraph · Anthropic Claude · ChromaDB · FastAPI · React',
    link: '/io-architecture.html',
    linkText: 'View architecture →',
    external: false,
  },
  {
    num: '03', color: 'var(--sea)',
    badge: 'ACTIVE · DAILY COLLECTION', badgeClass: 'sys-badge--sea',
    title: 'Longitudinal Biometric Pipeline',
    sub: 'Polar API · Automated ETL · 200+ Days',
    desc: () =>
      'Fully automated nightly data extraction from consumer wearable. RR intervals processed into 13 HRV feature families across 3 lag windows. CSV artifacts + GitHub Actions CI.',
    stack: 'Python · Polar AccessLink API · GitHub Actions · CSV',
    link: 'https://github.com/kinetica-IA/polar-lyme-predictor',
    linkText: 'View data pipeline →',
    external: true,
  },
  {
    num: '04', color: 'var(--ice)',
    badge: 'FRAMEWORK · INTERNAL', badgeClass: 'sys-badge--ice',
    title: 'ALMA Ethical Framework',
    sub: 'EU AI Act · Clinical Safety Boundaries · Human-on-Loop',
    desc: () =>
      'Ethical decision framework for clinical AI deployment. Defines safety boundaries, escalation triggers, and human override protocols. Designed for EU AI Act compliance from day one.',
    stack: 'Policy design · EU AI Act · Clinical ethics',
    link: null,
    linkText: null,
    external: false,
  },
]

function SysItem({ item, nDays, nPairs, staggerIdx }) {
  const { ref, revealed } = useReveal(0.15)
  const numDisplay = useTextDecode(item.num, {
    duration: 400, delay: 0, loop: false, isActive: revealed,
  })

  return (
    <div
      ref={ref}
      className="sys-item"
      style={{
        opacity: revealed ? 1 : 0,
        transition: `opacity 0.5s var(--ease-out) ${staggerIdx * 150}ms`,
      }}
    >
      <span className="sys-num" style={{
        color: item.color,
        opacity: revealed ? 0.6 : 0,
        transition: 'opacity 0.4s var(--ease-out)',
      }}>
        {numDisplay}
      </span>
      <div className="sys-content" style={{
        transform: revealed ? 'translateX(0)' : 'translateX(20px)',
        opacity: revealed ? 1 : 0,
        transition: `transform 0.5s var(--ease-out) ${staggerIdx * 150 + 100}ms, opacity 0.5s var(--ease-out) ${staggerIdx * 150 + 100}ms`,
      }}>
        <span className={`sys-badge ${item.badgeClass}`}>{item.badge}</span>
        <h3 className="sys-item-title">{item.title}</h3>
        <p className="sys-item-sub">{item.sub}</p>
        <p className="sys-item-desc">{item.desc(nDays, nPairs)}</p>
        <p className="sys-stack">{item.stack}</p>
        {item.link && (
          <a
            href={item.link}
            {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="sys-link"
          >
            {item.linkText}
          </a>
        )}
      </div>
    </div>
  )
}

function SysDivider({ revealed, delay }) {
  return (
    <hr className="sys-divider" style={{
      width: revealed ? '100%' : '0%',
      transition: `width 0.4s var(--ease-out) ${delay}ms`,
    }} />
  )
}

export default function Systems({ data }) {
  const nPairs = data?.predictor?.n_training || 60
  const nDays = data?.series?.length || 198
  const { ref: sectionRef, revealed: sectionRevealed } = useReveal(0.1)

  return (
    <section className="section" id="systems" ref={sectionRef}>
      <span className="eyebrow" style={{ color: 'var(--warm)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <NetworkSymbol color="var(--warm)" size={22} />
        SYSTEMS
      </span>
      <h2 className="sys-title">From heartbeat to prediction</h2>

      {ITEMS.map((item, i) => (
        <div key={item.num}>
          {i > 0 && <SysDivider revealed={sectionRevealed} delay={i * 150} />}
          <SysItem item={item} nDays={nDays} nPairs={nPairs} staggerIdx={i} />
        </div>
      ))}

      <style>{`
        .sys-title {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          line-height: 1.35;
          margin: 16px 0 var(--space-subsection);
        }
        .sys-item {
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 20px;
          align-items: start;
          padding: 4px 0;
          transition: padding-left var(--duration-hover) var(--ease-out), background var(--duration-hover) var(--ease-out);
          border-left: 3px solid transparent;
          margin-left: -3px;
        }
        .sys-item:hover {
          padding-left: 8px;
          border-left-color: currentColor;
          background: rgba(144, 167, 165, 0.04);
        }
        @media (max-width: 640px) {
          .sys-item { grid-template-columns: 1fr; }
          .sys-num { margin-bottom: -8px; }
        }
        .sys-num {
          font-family: var(--mono);
          font-size: 3rem;
          font-weight: 400;
          line-height: 1;
          transition: opacity var(--duration-hover) var(--ease-out), text-shadow var(--duration-hover) var(--ease-out);
        }
        .sys-item:hover .sys-num {
          opacity: 1 !important;
        }
        .sys-badge {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          display: inline-block;
          margin-bottom: 8px;
          padding: 3px 8px;
        }
        .sys-badge--green { color: var(--green); background: rgba(107,158,122,0.10); }
        .sys-badge--warm { color: var(--warm); background: rgba(196,133,90,0.10); }
        .sys-badge--sea { color: var(--sea); background: rgba(93,138,130,0.10); }
        .sys-badge--ice { color: var(--ice); background: rgba(133,168,184,0.10); }
        .sys-item-title {
          font-family: var(--sans);
          font-size: var(--text-subsection);
          font-weight: 500;
          color: var(--text);
          margin-bottom: 4px;
        }
        .sys-item-sub {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          margin-bottom: var(--space-element);
        }
        .sys-item-desc {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.7;
          max-width: 600px;
          margin-bottom: var(--space-element);
        }
        .sys-stack {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          margin-bottom: var(--space-tight);
        }
        .sys-link {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--sea);
          transition: color var(--duration-hover) ease;
        }
        .sys-link:hover { color: var(--green); }
        .sys-divider {
          border: none;
          border-top: 1px solid var(--border);
          margin: 44px 0;
          transition: width 0.4s var(--ease-out);
        }
      `}</style>
    </section>
  )
}
