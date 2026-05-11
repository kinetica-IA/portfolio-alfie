import { useReveal } from '../hooks/useReveal'
import { useTextDecode } from '../hooks/useTextDecode'
import { NetworkSymbol } from './OrganicSymbols'
import LivePulse from './LivePulse'

const PILLARS = [
  {
    num: '01', color: 'var(--teal)',
    badge: 'LIVE · AUTOMATED', badgeClass: 'wk-badge--teal',
    title: 'Data Pipeline — L0 to L5',
    problem: 'Raw wearable exports are noisy, heterogeneous, and incompatible with clinical analysis. Seven data sources, 1000+ files, no standard schema.',
    approach: (nDays) =>
      `${nDays}-day continuous series. L0: GDPR export (Polar). L1: 9 typed parsers, zero drops. L2: neurokit2 advanced HRV on raw RR intervals. L3: unified daily frame (71 columns). L4: joined with symptom diary, 4-lag temporal features. L5: multi-target predictor training. Nightly GitHub Actions, atomic publish.`,
    result: 'Runs every night at 06:00 UTC without manual intervention. Every layer versioned and auditable. L3 is the canonical artifact — everything downstream is deterministic from it.',
    stack: 'Python · Pandas · neurokit2 · Pydantic · GitHub Actions',
    link: '/pipeline.html',
    linkText: 'View pipeline →',
    external: false,
  },
  {
    num: '02', color: 'var(--green)',
    badge: 'PUBLISHED · PUBLIC REPO', badgeClass: 'wk-badge--green',
    title: 'ANS Predictor — Multi-Target Symptom Forecasting',
    problem: "Patients with complex chronic conditions can't predict symptom flares. Crashes arrive without warning, 24–72h after the trigger.",
    approach: (nDays, nPairs) =>
      `N=1 longitudinal study: ${nDays} nights of nocturnal HRV from a consumer wearable. Five independent models, each selecting its own features via forward selection across 13 candidates. Validated on ${nPairs} prospective pairs with LOO-CV.`,
    result: (headline) => {
      if (!headline) return 'AUC 0.83 (autonomic dysfunction). Physiologically coherent: the model selects autonomic balance features to predict autonomic dysfunction. All code and data public.'
      const ci = headline.ci95
      return `AUC ${headline.value.toFixed(2)} (autonomic dysfunction · CI95 ${ci[0].toFixed(2)}–${ci[1].toFixed(2)} · n=${headline.n} paired nights). Physiologically coherent: the model selects autonomic balance features to predict autonomic dysfunction. All code and data public.`
    },
    stack: 'Python · scikit-learn · neurokit2 · Polar Grit X2',
    link: '/ans-predictor.html',
    linkText: 'View predictor →',
    external: false,
  },
  {
    num: '03', color: 'var(--sea)',
    badge: 'PUBLISHED · SAME PIPELINE', badgeClass: 'wk-badge--sea',
    title: 'Sleep Quality Predictor — Next-Day Fatigue',
    problem: 'Fatigue severity is difficult to anticipate. If the HRV signal from the preceding night contains predictive information, that changes how patients plan their day.',
    approach: 'Same L4 dataset as the ANS predictor. Forward selection across 20 candidates — five HRV features at four lags each. Stopped at two features. Both selected the same measure at consecutive nights, suggesting the fatigue signal concentrates within 48 hours.',
    result: (_headline, sleepQuality) => {
      if (!sleepQuality) return 'AUC 0.77 · CI95 [0.64, 0.89]. Nocturnal RMSSD at t0 and t1 is sufficient to predict high-fatigue days (fatiga ≥ 6/10). No additional feature improved AUC by the 0.01 stopping threshold.'
      const auc = sleepQuality.auc_loo?.toFixed(2) ?? '0.77'
      const lo = sleepQuality.auc_ci95_lower?.toFixed(2) ?? '0.64'
      const hi = sleepQuality.auc_ci95_upper?.toFixed(2) ?? '0.89'
      return `AUC ${auc} · CI95 [${lo}, ${hi}]. Nocturnal RMSSD at t0 and t1 is sufficient to predict high-fatigue days (fatiga ≥ 6/10). No additional feature improved AUC by the 0.01 stopping threshold.`
    },
    stack: 'Python · scikit-learn · LOO-CV · Bootstrap 1000×',
    link: '/ans-predictor.html',
    linkText: 'View predictor →',
    external: false,
  },
  {
    num: '04', color: 'var(--warm)',
    badge: 'ARCHIVED · PROTOTYPE', badgeClass: 'wk-badge--warm',
    title: 'IO3 + ALMA — Clinical Reasoning Architecture',
    archivedNote: 'Archived prototype. Not in active development. Documented for transparency.',
    problem: 'LLMs in clinical contexts need persistent context and ethical guardrails. Both require architectural decisions, not prompt engineering.',
    approach: 'IO3: 9-node LangGraph graph that injects patient profile, clinical rules, and RAG evidence before any model call. ALMA: two-layer ethical framework — deterministic axiom injection pre-generation (L1) plus post-generation evaluation (L2, currently being redesigned).',
    result: 'Human-on-loop interrupt at every uncertainty gap. EU AI Act compliance by design. L1 operative; L2 redesign in progress. Three structural bugs in L2 publicly documented.',
    stack: 'LangGraph · Anthropic API · ChromaDB · FastAPI · React',
    link: '/io-architecture.html',
    linkText: 'View architecture →',
    external: false,
  },
]

function PillarCard({ item, nDays, nPairs, headline, sleepQuality, staggerIdx }) {
  const { ref, revealed } = useReveal(0.25)
  const numDisplay = useTextDecode(item.num, {
    duration: 600, delay: 0, loop: false, isActive: revealed,
  })

  const approachText = typeof item.approach === 'function'
    ? item.approach(nDays, nPairs)
    : item.approach
  const resultText = typeof item.result === 'function'
    ? item.result(headline, sleepQuality)
    : item.result

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
        {item.archivedNote && (
          <p className="wk-archived-note">{item.archivedNote}</p>
        )}

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
          <p className="wk-text">{resultText}</p>
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
  const nPairs = data?.data_window?.n_paired || 61
  const nDays = data?.series?.length || 243
  const sleepQuality = data?.sleep_quality
  const { ref: sectionRef, revealed: sectionRevealed } = useReveal(0.1)

  return (
    <section className="section" id="work" ref={sectionRef}>
      <span className="eyebrow" style={{ color: 'var(--slate)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <NetworkSymbol color="var(--warm)" size={44} />
        THE WORK
      </span>
      <h2 className="wk-title">From raw data to clinical predictor</h2>

      {PILLARS.map((item, i) => (
        <div key={item.num}>
          {i > 0 && <WkDivider revealed={sectionRevealed} delay={i * 200} />}
          <PillarCard
            item={item}
            nDays={nDays}
            nPairs={nPairs}
            headline={data?.headline}
            sleepQuality={sleepQuality}
            staggerIdx={i}
          />
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
        .wk-badge--warm  { color: var(--warm);  background: rgba(196,133,90,0.10);  }
        .wk-badge--sea   { color: var(--sea);   background: rgba(93,138,130,0.10);  }
        .wk-badge--teal  { color: var(--teal);  background: rgba(144,167,165,0.12); }
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
        .wk-archived-note {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--warm);
          opacity: 0.75;
          margin-bottom: 16px;
          padding: 6px 10px;
          border-left: 2px solid var(--warm);
          background: rgba(196,133,90,0.06);
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
