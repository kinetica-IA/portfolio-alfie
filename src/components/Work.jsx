import { useReveal } from '../hooks/useReveal'
import { useTextDecode } from '../hooks/useTextDecode'
import { NetworkSymbol } from './OrganicSymbols'
import LivePulse from './LivePulse'

const PILLARS = [
  {
    num: '01', color: 'var(--warm)',
    badge: 'CLINICAL AI · CONTEXT ENGINE', badgeClass: 'wk-badge--warm',
    title: 'IO3 — Context Engine for Clinical AI',
    problem: 'Clinical AI that starts every query from scratch is brittle. Clinicians need persistent context — patient profile, clinical rules, evidence base — injected into every model call.',
    approach: 'Persistent orchestration layer in front of the LLM. Each query is enriched with patient profile, clinical rules, RAG evidence (1,880 chunks in ChromaDB), and ALMA L1 axioms before any model sees it. The model is interchangeable. IO3 is not.',
    result: '9-node LangGraph graph with human-on-loop interrupt at every gap. Full reasoning audit trail. Designed for EU AI Act compliance — clinician decides at every uncertainty, never the model alone.',
    stack: 'LangGraph · Anthropic API · ChromaDB · FastAPI · React',
    link: '/io-architecture.html',
    linkText: 'View architecture →',
    external: false,
  },
  {
    num: '02', color: 'var(--green)',
    badge: 'PUBLISHED · PUBLIC REPO', badgeClass: 'wk-badge--green',
    title: 'ANS Predictor — Wearable Symptom Forecasting',
    problem: 'Patients with complex chronic conditions can\'t predict symptom flares. Crashes arrive without warning, 24–72h after the trigger.',
    approach: (nDays, nPairs) =>
      `N=1 longitudinal study: ${nDays} nights of nocturnal HRV from a consumer wearable. Five independent models, each selecting its own features via forward selection across 13 candidates. Validated on ${nPairs} prospective pairs with LOO-CV.`,
    result: 'AUC 0.86 (autonomic dysfunction · CI95 0.75–0.95 · n=54 paired nights). Headline metric uses LF/HF ratio + SD1 — physiologically coherent, not previously reported in N-of-1 longitudinal Lyme/ME-CFS literature. All code and data public.',
    stack: 'Python · scikit-learn · neurokit2 · Polar Grit X2 · GitHub Actions',
    link: '/ans-predictor.html',
    linkText: 'View research →',
    external: false,
  },
  {
    num: '03', color: 'var(--sea)',
    badge: 'FRAMEWORK · EU AI ACT', badgeClass: 'wk-badge--sea',
    title: 'ALMA — Ethical Safety Framework',
    problem: 'LLMs in clinical contexts need guardrails that aren\'t just prompt tricks. Prompt-based safety fails silently.',
    approach: 'Five domain-independent axioms (Conciencia, Claridad, Límite, Pragmatismo, Cuidado). Deterministic evaluation pipeline: regex patterns, cosine similarity (0.92 threshold), gray zone flagging (≥0.75). No LLM in the evaluation path.',
    result: 'Every output evaluated before reaching the patient. APPROVE / REWRITE / SILENCE decisions with full audit trail. Three structural bugs publicly documented.',
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
      <h2 className="wk-title">Three pillars of clinical AI</h2>

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
