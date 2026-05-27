import { useReveal } from '../hooks/useReveal'
import { useTextDecode } from '../hooks/useTextDecode'
import { useWordStagger } from '../hooks/useWordStagger'
import { CellSymbol } from './OrganicSymbols'

const TIMELINE = [
  { year: '2004', label: 'Physics (first cycle), Univ. Granada', color: 'var(--ice)', rgb: '133,168,184' },
  { year: '2010', label: 'Postgrad biomechanics (UGR), osteopathy (UAB)', color: 'var(--sea)', rgb: '93,138,130' },
  { year: '2016', label: 'Independent practice — Pyrenees, sport, complex cases', color: 'var(--teal)', rgb: '144,167,165' },
  { year: '2022', label: 'Acute COVID hospital care, Vielha (2 years)', color: 'var(--clay)', rgb: '168,121,110' },
  { year: '2024', label: 'Building clinical AI from own physiology', color: 'var(--warm)', rgb: '196,133,90' },
  { year: '2025', label: 'Kinetica AI', color: 'var(--green)', rgb: '107,158,122', pulse: true },
]

const BADGES = [
  { text: '15+ years clinical', borderColor: 'var(--teal)' },
  { text: 'Open-source · MIT', borderColor: 'var(--warm)' },
  { text: 'Málaga · Remote', borderColor: 'var(--sea)' },
]

export default function FounderContact() {
  const { ref, revealed } = useReveal(0.25)
  const { ref: ctaRef, revealed: ctaRevealed } = useReveal(0.25)

  const headingWords = useWordStagger('From physics, biomechanics and clinic — engineered into clinical AI')

  return (
    <section className="section founder-contact" id="about" ref={ref}>
      <span className="eyebrow" style={{ color: 'var(--teal)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <CellSymbol color="var(--clay)" size={44} />
        ABOUT
      </span>
      <h2 className="fc-heading" ref={headingWords.ref}>
        {headingWords.words.map((w, i) => <span key={i} style={w.style}>{w.text}</span>)}
      </h2>

      <p
        className="fc-bio"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.9s var(--ease-out) 0.2s, transform 0.6s var(--ease-out) 0.2s',
        }}
      >
        Kinetica AI is built by Alfonso Navarro — physics-trained at Universidad de Granada,
        postgraduate in biomechanics and kinesiology, trained in osteopathy at UAB, with
        eighteen years of clinical work in the Pyrenees treating complex musculoskeletal
        and neuromechanical cases, high-performance athletes and mountain-sport injuries.
        He is also the patient. The system is engineered from real physiological
        uncertainty, not benchmark chasing: wearable monitoring, longitudinal symptom
        data and interpretable architectures for clinical AI.
      </p>

      {/* Timeline stepper */}
      <div className="fc-timeline">
        <div className="tl-line" style={{
          width: revealed ? '100%' : '0%',
          transition: 'width var(--anim-slow) var(--ease-out) 0.3s',
        }} />
        <div className="tl-items">
          {TIMELINE.map((t, i) => (
            <div
              key={t.year}
              className="tl-item"
              style={{
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateY(0)' : 'translateY(10px)',
                transition: `opacity 0.9s var(--ease-out) ${i * 150 + 300}ms, transform 0.6s var(--ease-out) ${i * 150 + 300}ms`,
              }}
            >
              <span className={`tl-node ${t.pulse ? 'tl-node--pulse' : ''}`} style={{ background: t.color }} />
              <span className="tl-year">{t.year}</span>
              <span className="tl-label">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="fc-badges">
        {BADGES.map((b, i) => (
          <span
            key={b.text}
            className="fc-badge"
            style={{
              borderLeft: `2px solid ${b.borderColor}`,
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateY(0)' : 'translateY(8px)',
              transition: `opacity 0.8s var(--ease-out) ${i * 220}ms, transform 0.5s var(--ease-out) ${i * 220}ms`,
            }}
          >
            {b.text}
          </span>
        ))}
      </div>

      {/* CTA area */}
      <div className="fc-cta-area" ref={ctaRef}>
        <a href="#research" className="fc-research-link">See open research →</a>
        <p className="fc-services">
          Clinical AI consulting · Research-grade HRV analysis · AI model evaluation
        </p>
        <div
          className="fc-status"
          style={{
            opacity: ctaRevealed ? 1 : 0,
            transition: 'opacity 0.6s var(--ease-out) 0.2s',
          }}
        >
          <span className="fc-status-led" />
          <span className="fc-status-text">Available for projects</span>
        </div>
        <div
          className="fc-btns"
          style={{
            opacity: ctaRevealed ? 1 : 0,
            transform: ctaRevealed ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.6s var(--ease-out) 0.35s, transform 0.5s var(--ease-out) 0.35s',
          }}
        >
          <a href="mailto:alfon.atman@gmail.com" className="fc-btn fc-btn--primary">
            Discuss a clinical AI project
          </a>
          <a
            href="https://www.linkedin.com/in/navarro-kinetica-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="fc-btn fc-btn--secondary"
          >
            Connect on LinkedIn
          </a>
        </div>
      </div>

      <style>{`
        .founder-contact {
          display: flex;
          flex-direction: column;
          gap: 40px;
          padding-bottom: 40px;
        }
        .fc-heading {
          font-family: var(--sans);
          font-size: var(--text-section);
          font-weight: 400;
          color: var(--text-heading);
          line-height: 1.3;
          margin: 16px 0 0;
          display: flex;
          flex-wrap: wrap;
          gap: 0;
          max-width: 560px;
        }
        .fc-bio {
          font-size: var(--text-body);
          font-weight: 300;
          color: var(--text-sec);
          line-height: 1.75;
          max-width: 540px;
        }
        /* Timeline */
        .fc-timeline {
          position: relative;
          padding-top: 12px;
        }
        .fc-timeline .tl-line {
          position: absolute;
          top: 14px;
          left: 0;
          height: 1px;
          background: var(--border);
        }
        .tl-items {
          display: flex;
          gap: 0;
          justify-content: space-between;
        }
        .tl-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }
        .tl-node {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          transition: transform var(--duration-hover) var(--ease-out);
          z-index: 1;
        }
        .tl-item:hover .tl-node { transform: scale(1.4); }
        .tl-node--pulse { animation: tlPulse 2s ease-in-out infinite; }
        @keyframes tlPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(107,158,122, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(107,158,122, 0); }
        }
        .tl-year {
          font-family: var(--mono);
          font-size: var(--text-caption);
          font-weight: 500;
          color: var(--text);
        }
        .tl-label {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          text-align: center;
          line-height: 1.3;
        }
        @media (max-width: 768px) {
          .tl-items { flex-wrap: wrap; gap: 16px; }
          .tl-item { flex: 0 0 calc(50% - 8px); align-items: flex-start; }
          .fc-timeline .tl-line { display: none; }
        }
        @media (max-width: 420px) {
          .tl-item { flex: 0 0 100%; }
        }
        /* Badges */
        .fc-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .fc-badge {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          background: var(--fill-teal);
          border: 1px solid var(--border);
          padding: 6px 14px;
          transition: border-color var(--duration-hover) ease;
        }
        .fc-badge:hover { border-color: var(--border-active); }
        /* CTA area */
        .fc-cta-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          text-align: center;
        }
        .fc-research-link {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--text-dim);
          text-decoration: none;
          transition: color var(--duration-hover) ease;
        }
        .fc-research-link:hover { color: var(--teal); }
        .fc-services {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--text-dim);
        }
        .fc-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .fc-status-led {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--green);
          animation: ledPulse 2s ease-in-out infinite;
        }
        @keyframes ledPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .fc-status-text {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
        }
        .fc-btns {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .fc-btn {
          font-family: var(--mono);
          font-size: var(--text-caption);
          padding: 13px 28px;
          text-decoration: none;
          transition: all var(--duration-hover) var(--ease-out);
        }
        .fc-btn--primary {
          border: 1.5px solid var(--green);
          color: var(--green);
        }
        .fc-btn--primary:hover {
          background: var(--green);
          color: white;
          box-shadow: 0 2px 12px rgba(107,158,122,0.15);
        }
        .fc-btn--secondary {
          border: 1px solid var(--border-active);
          color: var(--text-dim);
        }
        .fc-btn--secondary:hover {
          border-color: var(--teal);
          color: var(--text);
        }
        @media (max-width: 480px) {
          .fc-btns { flex-direction: column; align-items: stretch; }
          .fc-btn { text-align: center; }
        }
      `}</style>
    </section>
  )
}
