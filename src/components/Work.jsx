import { useReveal } from '../hooks/useReveal'
import { useTextDecode } from '../hooks/useTextDecode'
import { NetworkSymbol } from './OrganicSymbols'
import LivePulse from './LivePulse'

const PILLARS = [
  {
    num: '01', color: 'var(--warm)',
    badge: 'PREVIOUS ITERATION — SUPERSEDED', badgeClass: 'wk-badge--warm',
    title: 'IO3 — Clinical Reasoning Agent (v3 prototype)',
    problem: 'LLMs in clinical contexts can produce confident but wrong outputs. Prompt-based safety fails silently and cannot be audited.',
    approach: 'ReAct agent with mandatory human-on-loop. LangGraph 9-node graph (IO3 architecture; next iteration redesigned under explicit EU regulatory framework). ALMA deterministic guardrail evaluates every output before it reaches the clinician.',
    result: 'Deterministic safety pipeline (regex + cosine similarity, no LLM in evaluation path). Architecture aligned with EU AI Act Art. 14 (human oversight) and Art. 15 (accuracy) principles. IO3 is a prototype and is superseded by `io` (in progress, built under explicit regulatory framework from day zero).',
    stack: 'LangGraph · Anthropic Claude · ChromaDB · FastAPI · React',
    link: '/io-architecture.html',
    linkText: 'View architecture →',
    external: false,
  },
  {
    num: '02', color: 'var(--green)',
    badge: 'PUBLISHED · PUBLIC REPO', badgeClass: 'wk-badge--green',
    title: 'ANS Predictor — Wearable Symptom Forecasting',
    problem: 'Patients with complex post-infectious chronic conditions struggle to predict crashes and pacing windows.',
    approach: 'N=1 longitudinal observational study. 207 nights of nocturnal HRV from Polar Grit X2, processed with NeuroKit2. Five models, each with forward-selected features over 13 candidates and 3 lag windows. Validated on 60 prospective pairs via leave-one-out cross-validation.',
    result: 'AUC 0.84 (severity), 48-hour predictive lag. Consistent with within-person HRV–symptom findings at cohort scale (Conoscenti et al. 2026, n=4244, AUC 73-85). Contribution: high-density single-subject design with fully open code and data. Preprint in preparation.',
    stack: 'Python · scikit-learn · neurokit2 · Polar Grit X2 · GitHub Actions',
    link: '/ans-predictor.html',
    linkText: 'View research →',
    external: false,
  },
  {
    num: '04', color: 'var(--teal)',
    badge: 'IN PROGRESS · NEW ARCHITECTURE', badgeClass: 'wk-badge--sea',
    title: 'io — Clinical Agent under Regulatory Framework',
    problem: 'Prior iterations evolved incrementally. The new agent starts from scratch under explicit EU regulatory framework (AI Act + GDPR + Directive 2024/2853 + ISO/IEC 25012).',
    approach: 'LangGraph 1.0 Deep Agent supervisor with sync and async subagents. Cloud-primary reasoning with mandatory PHI redaction; local compute for deterministic pre/post-processing and guardrails. Sensorimotor integration focus: autonomic (HRV), postural-kinematic (pose), visual-functional (optometric).',
    result: 'Under construction. Architecture: io repository (private during development). Master architecture document public on repo when first tag lands.',
    stack: 'LangGraph 1.0 · LangChain 1.0 · MCP connectors · NeuroKit2 · MediaPipe',
    link: null,
    linkPending: 'Link enabled at first public tag',
    external: false,
  },
  {
    num: '03', color: 'var(--sea)',
    badge: 'FRAMEWORK · EU AI ACT', badgeClass: 'wk-badge--sea',
    title: 'ALMA — Ethical Safety Framework',
    problem: 'Prompt-based guardrails in clinical LLM systems fail silently and cannot be audited.',
    approach: 'Five domain-independent axioms (Conciencia, Claridad, Límite, Pragmatismo, Cuidado). Deterministic evaluation: regex patterns, cosine similarity (threshold 0.92), gray-zone flagging (≥0.75). No LLM call in the evaluation path.',
    result: 'Every output gates through APPROVE / REWRITE / SILENCE with an audit trail. Known bugs tracked in the public repo. Current iteration moves ALMA from standalone node to middleware and post-model hook in the new io architecture.',
    stack: 'Deterministic pipeline · intfloat/multilingual-e5-large · Clinical ethics',
    link: '/io-architecture.html',
    linkText: 'View ALMA details →',
    external: false,
  },
]

function PillarCard({ item, nDays, nPairs, staggerIdx }) {
  const { ref, revealed } = useReveal(0.25)
  const numDisplay = useTextDecode(item.num, {
    duration: 600, delay: 0, loop: false, isActive: revealed,
  })

  const approachText = typeof item.approach === 'function'
    ? item.approach(nDays, nPairs)
    : item.approach

  return (
    <div
      ref={ref}
      className="wk-item"
      style={{
        opacity: revealed ? 1 : 0,
        transition: `opacity 1s var(--ease-out) ${staggerIdx * 300}ms`,
      }}
    >
      <span className="wk-num" style={{
        color: item.color,
        opacity: revealed ? 0.6 : 0,
        transition: 'opacity 0.6s var(--ease-out)',
      }}>
        {numDisplay}
      </span>
      <div className="wk-content" style={{
        transform: revealed ? 'translateX(0)' : 'translateX(20px)',
        opacity: revealed ? 1 : 0,
        transition: `transform 1s var(--ease-out) ${staggerIdx * 200 + 150}ms, opacity 1s var(--ease-out) ${staggerIdx * 200 + 150}ms`,
      }}>
        <span className={`wk-badge ${item.badgeClass}`}>{item.badge}</span>
        <h3 className="wk-item-title">{item.title}</h3>

        <div className="wk-par">
          <span className="wk-label">Problem</span>
          <p className="wk-text">{item.problem}</p>
        </div>
        <div className="wk-par">
          <span className="wk-label">Approach</span>
          <p className="wk-text">{approachText}</p>
        </div>
        <div className="wk-par">
          <span className="wk-label">Result</span>
          <p className="wk-text">{item.result}</p>
        </div>

        <p className="wk-stack">{item.stack}</p>
        {item.link && (
          <a
            href={item.link}
            {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="wk-link"
          >
            {item.linkText}
          </a>
        )}
        {item.linkPending && (
          <span className="wk-link" style={{ opacity: 0.35, cursor: 'default' }}>
            {item.linkPending}
          </span>
        )}
      </div>
    </div>
  )
}

function WkDivider({ revealed, delay }) {
  return (
    <hr className="wk-divider" style={{
      width: revealed ? '100%' : '0%',
      transition: `width 0.6s var(--ease-out) ${delay}ms`,
    }} />
  )
}

export default function Work({ data }) {
  const nPairs = data?.predictor?.n_training || 60
  const nDays = data?.series?.length || 207
  const { ref: sectionRef, revealed: sectionRevealed } = useReveal(0.1)

  return (
    <section className="section" id="work" ref={sectionRef}>
      <span className="eyebrow" style={{ color: 'var(--slate)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <NetworkSymbol color="var(--warm)" size={44} />
        THE WORK
      </span>
      <h2 className="wk-title">Current and prior work</h2>

      {PILLARS.map((item, i) => (
        <div key={item.num}>
          {i > 0 && <WkDivider revealed={sectionRevealed} delay={i * 200} />}
          <PillarCard item={item} nDays={nDays} nPairs={nPairs} staggerIdx={i} />
        </div>
      ))}

      <LivePulse data={data} />

      <div className="scroll-hook">
        <span className="scroll-hook-text">About the builder</span>
        <span className="scroll-hook-arrow">↓</span>
      </div>

      <style>{`
        .wk-title {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          line-height: 1.35;
          margin: 16px 0 var(--space-subsection);
        }
        .wk-item {
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 20px;
          align-items: start;
          padding: 4px 0;
          transition: padding-left var(--duration-hover) var(--ease-out), background var(--duration-hover) var(--ease-out);
          border-left: 3px solid transparent;
          margin-left: -3px;
        }
        .wk-item:hover {
          padding-left: 8px;
          border-left-color: currentColor;
          background: rgba(144, 167, 165, 0.04);
        }
        @media (max-width: 640px) {
          .wk-item { grid-template-columns: 1fr; }
          .wk-num { margin-bottom: -8px; }
        }
        .wk-num {
          font-family: var(--mono);
          font-size: 3rem;
          font-weight: 400;
          line-height: 1;
          transition: opacity var(--duration-hover) var(--ease-out);
        }
        .wk-item:hover .wk-num { opacity: 1 !important; }
        .wk-badge {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          display: inline-block;
          margin-bottom: 8px;
          padding: 3px 8px;
        }
        .wk-badge--green { color: var(--green); background: rgba(107,158,122,0.10); }
        .wk-badge--warm { color: var(--warm); background: rgba(196,133,90,0.10); }
        .wk-badge--sea { color: var(--sea); background: rgba(93,138,130,0.10); }
        .wk-item-title {
          font-family: var(--sans);
          font-size: var(--text-subsection);
          font-weight: 500;
          color: var(--text);
          margin-bottom: 16px;
        }
        .wk-par { margin-bottom: 12px; }
        .wk-label {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-dim);
          display: block;
          margin-bottom: 4px;
        }
        .wk-text {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.7;
          max-width: 600px;
        }
        .wk-stack {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          margin: 16px 0 var(--space-tight);
        }
        .wk-link {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--sea);
          transition: color var(--duration-hover) ease;
        }
        .wk-link:hover { color: var(--green); }
        .wk-divider {
          border: none;
          border-top: 1px solid var(--border);
          margin: 36px 0;
          transition: width 0.6s var(--ease-out);
        }
      `}</style>
    </section>
  )
}
