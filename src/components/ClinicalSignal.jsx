import { useReveal } from '../hooks/useReveal'
import { useWordStagger } from '../hooks/useWordStagger'
import { PulseSymbol } from './OrganicSymbols'

const STAT_MARKERS = [
  { value: 'HRV', label: 'primary biomarker', color: 'var(--sea)', rgb: '93,138,130' },
  { value: 'ANS', label: 'target system', color: 'var(--moss)', rgb: '107,138,109' },
  { value: 'N=1', label: 'single-patient proof', color: 'var(--warm)', rgb: '196,133,90' },
]

export default function ClinicalSignal() {
  const { ref: headRef, words: headWords } = useWordStagger(
    'Every night, your heart writes a story about your health. We built AI to listen.'
  )
  const { ref: bodyRef, revealed: bodyRevealed } = useReveal(0.25)
  const { ref: statsRef, revealed: statsRevealed } = useReveal(0.25)

  return (
    <section className="section clinical-signal">
      <span className="eyebrow" style={{ color: 'var(--sea)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <PulseSymbol color="var(--sea)" size={44} />
        THE IDEA
      </span>
      <h2 className="cs-headline" ref={headRef}>
        {headWords.map((w, i) => <span key={i} style={w.style}>{w.text}</span>)}
      </h2>
      <div className="cs-body-wrap" ref={bodyRef}>
        <div className="cs-border-line" style={{
          height: bodyRevealed ? '100%' : '0%',
          transition: 'height 0.9s var(--ease-out)',
        }} />
        <p className="cs-body" style={{
          opacity: bodyRevealed ? 1 : 0,
          transform: bodyRevealed ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.7s var(--ease-out) 0.2s, transform 0.7s var(--ease-out) 0.2s',
        }}>
          While you sleep, your heart rate variability captures patterns that blood tests and
          questionnaires miss. It's the autonomic fingerprint — a nightly window into fatigue,
          recovery, and nervous system health. We trained AI to read these patterns and predict
          symptoms before you feel them.
        </p>
      </div>

      <div className="cs-stats" ref={statsRef}>
        {STAT_MARKERS.map((s, i) => (
          <div
            key={s.value}
            className="cs-stat"
            style={{
              '--stat-color': s.color,
              '--stat-rgb': s.rgb,
              opacity: statsRevealed ? 1 : 0,
              transform: statsRevealed ? 'scale(1)' : 'scale(0.95)',
              transition: `opacity 0.8s var(--ease-out) ${i * 300}ms, transform 0.8s var(--ease-out) ${i * 300}ms`,
            }}
          >
            <span className="cs-stat-value">{s.value}</span>
            <span className="cs-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="scroll-hook">
        <span className="scroll-hook-text">See the proof</span>
        <span className="scroll-hook-arrow">↓</span>
      </div>

      <style>{`
        .clinical-signal {
          max-width: 680px;
        }
        .clinical-signal .eyebrow {
          display: block;
          margin-bottom: 16px;
        }
        .cs-headline {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          line-height: 1.35;
          margin-bottom: 24px;
        }
        .cs-body-wrap {
          position: relative;
          padding-left: 22px;
          margin-bottom: 28px;
        }
        .cs-border-line {
          position: absolute;
          left: 0;
          top: 0;
          width: 2px;
          background: var(--moss);
        }
        .cs-body {
          font-family: var(--sans);
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.75;
          max-width: 560px;
        }
        .cs-stats {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .cs-stat {
          padding: 14px 20px;
          border-top: 2px solid var(--stat-color);
          background: rgba(var(--stat-rgb), 0.08);
          min-width: 120px;
          flex: 1;
          transition: background var(--duration-hover) ease;
          cursor: default;
        }
        .cs-stat:hover {
          background: rgba(var(--stat-rgb), 0.20);
        }
        .cs-stat:hover .cs-stat-label {
          color: var(--text-sec);
        }
        .cs-stat-value {
          display: block;
          font-family: var(--mono);
          font-size: var(--text-body);
          font-weight: 500;
          color: var(--stat-color);
          margin-bottom: 4px;
        }
        .cs-stat-label {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          transition: color var(--duration-hover) ease;
        }
        @media (max-width: 640px) {
          .cs-stats { flex-direction: column; }
        }
      `}</style>
    </section>
  )
}
