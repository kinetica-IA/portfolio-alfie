import { useReveal } from '../hooks/useReveal'
import { NetworkSymbol, SignalSymbol, OrbitSymbol } from './OrganicSymbols'

// ════════════════════════════════════════════════════════════════════
// PILLARS — "what Kinetica builds", told once, scannably.
// Replaces the three thin Pipeline / Predictors / Frameworks sections.
// ════════════════════════════════════════════════════════════════════

const PILLARS = [
  {
    Symbol: NetworkSymbol,
    color: 'var(--green)',
    rgb: '107,158,122',
    label: 'Pipeline',
    what: 'One versioned longitudinal archive.',
    why: 'Wearable physiology and prospective symptom diaries land in a single reproducible dataset, L0 to L6. Every downstream model reads from the same contract.',
  },
  {
    Symbol: SignalSymbol,
    color: 'var(--sea)',
    rgb: '93,138,130',
    label: 'Predictors',
    what: 'Idiographic N-of-1 models.',
    why: 'Trained on one patient’s deep physiology, not cohorts. Each targets a different clinical signal, validated leave-one-out with bootstrap CIs.',
  },
  {
    Symbol: OrbitSymbol,
    color: 'var(--teal)',
    rgb: '144,167,165',
    label: 'Architecture & safety',
    what: 'A guarded agent loop.',
    why: 'Clinical reasoning audited end to end, with a deterministic safety layer scoring every response against clinical boundaries before it reaches a clinician.',
  },
]

export default function Pillars() {
  const { ref, revealed } = useReveal(0.2)

  return (
    <section className="section pillars" id="system" ref={ref}>
      <span className="eyebrow" style={{ color: 'var(--green)' }}>WHAT KINETICA BUILDS</span>
      <h2 className="pillars-title">Clinical AI, built on real longitudinal physiology</h2>

      <div className="pillars-grid">
        {PILLARS.map((p, i) => {
          const { Symbol } = p
          return (
            <div
              key={p.label}
              className="pillar"
              style={{
                '--pillar-color': p.color,
                '--pillar-rgb': p.rgb,
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.8s var(--ease-out) ${i * 130}ms, transform var(--anim-base) var(--ease-out) ${i * 130}ms`,
              }}
            >
              <span className="pillar-symbol"><Symbol color={p.color} size={40} /></span>
              <span className="pillar-label">{p.label}</span>
              <p className="pillar-what">{p.what}</p>
              <p className="pillar-why">{p.why}</p>
            </div>
          )
        })}
      </div>

      <style>{`
        .pillars-title {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          margin: 16px 0 var(--space-subsection);
          max-width: 560px;
        }
        .pillars-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }
        @media (max-width: 768px) {
          .pillars-grid { grid-template-columns: 1fr; gap: 32px; }
        }
        .pillar {
          display: flex;
          flex-direction: column;
          border-top: 2px solid var(--pillar-color);
          padding-top: 18px;
        }
        .pillar-symbol {
          opacity: 0.6;
          margin-bottom: 14px;
        }
        .pillar-label {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--pillar-color);
          margin-bottom: 12px;
        }
        .pillar-what {
          font-family: var(--sans);
          font-size: var(--text-body-lg);
          font-weight: 400;
          color: var(--text-heading);
          line-height: 1.4;
          margin-bottom: 10px;
        }
        .pillar-why {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.7;
        }
      `}</style>
    </section>
  )
}
