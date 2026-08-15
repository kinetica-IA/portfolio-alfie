import { useReveal } from '../hooks/useReveal'

// Timeline truncated to purely biographical/professional milestones —
// the 2024/2025 entries in the pre-pivot version described the deprecated
// AI-predictor project and are dropped rather than reframed here; Alfonso
// can add updated entries reflecting the osteopathy practice in Phase 3.
const TIMELINE = [
  { year: '1998', label: 'Física, Universidad de Granada', color: 'var(--ice)' },
  { year: '2002', label: 'Formación en optometría', color: 'var(--ice)' },
  { year: '2008', label: 'Postgrado en biomecánica', color: 'var(--sea)' },
  { year: '2016', label: 'Práctica clínica independiente, Pirineos', color: 'var(--teal)' },
  { year: '2020', label: 'Atención hospitalaria COVID aguda, Vielha (2 años)', color: 'var(--clay)' },
]

// "Open-source · MIT" badge dropped — referred to the deleted predictor
// repo and is no longer accurate. "Málaga · Remote" corrected to the
// actual service model per the project brief (Alameda base, home-visit
// service).
const BADGES = [
  { text: '10 años de práctica clínica', borderColor: 'var(--teal)' },
  { text: 'Alameda (Málaga) · a domicilio', borderColor: 'var(--sea)' },
]

const CREDENTIALS = [
  {
    title: 'AI Engineering',
    issuer: 'IBM',
    year: '2025',
    href: 'https://coursera.org/verify/professional-cert/JF2GSC5966NA',
  },
  {
    title: 'AI Agents & Agentic AI Architecture in Python',
    issuer: 'Vanderbilt University',
    year: '2025',
    href: 'https://coursera.org/verify/T1BWK1P3CEWP',
  },
  {
    title: 'Computational Neuroscience',
    issuer: 'University of Washington',
    year: '2025',
    href: 'https://coursera.org/verify/YNQB7TYP4N8G',
  },
]

export default function AboutBio() {
  const { ref, revealed } = useReveal(0.2)

  return (
    <div className="about-bio" ref={ref}>
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
              <span className="tl-node" style={{ background: t.color }} />
              <span className="tl-year">{t.year}</span>
              <span className="tl-label">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Credentials */}
      <div className="fc-credentials">
        <span className="fc-cred-label">CREDENCIALES</span>
        <ul className="fc-cred-list">
          {CREDENTIALS.map((c, i) => (
            <li
              key={c.href}
              className="fc-cred-item"
              style={{
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateY(0)' : 'translateY(6px)',
                transition: `opacity 0.7s var(--ease-out) ${i * 120 + 500}ms, transform 0.6s var(--ease-out) ${i * 120 + 500}ms`,
              }}
            >
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="fc-cred-link"
              >
                <span className="fc-cred-title">{c.title}</span>
                <span className="fc-cred-meta">{c.issuer} · {c.year}</span>
              </a>
            </li>
          ))}
        </ul>
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

      <style>{`
        .about-bio {
          display: flex;
          flex-direction: column;
          gap: 40px;
          margin-top: var(--space-subsection);
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
        /* Credentials */
        .fc-credentials {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 560px;
        }
        .fc-cred-label {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          letter-spacing: 0.12em;
          color: var(--text-dim);
          opacity: 0.7;
        }
        .fc-cred-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }
        .fc-cred-item {
          border-top: 1px solid var(--border);
        }
        .fc-cred-item:last-child {
          border-bottom: 1px solid var(--border);
        }
        .fc-cred-link {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 16px;
          padding: 12px 0;
          text-decoration: none;
          color: inherit;
          transition: background var(--duration-hover) ease, padding-left var(--duration-hover) ease;
        }
        .fc-cred-link:hover {
          padding-left: 8px;
          background: linear-gradient(90deg, rgba(107,158,122,0.05), transparent 60%);
        }
        .fc-cred-title {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--text);
          letter-spacing: 0.02em;
        }
        .fc-cred-link:hover .fc-cred-title { color: var(--green); }
        .fc-cred-meta {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          letter-spacing: 0.04em;
          white-space: nowrap;
          flex-shrink: 0;
        }
        @media (max-width: 540px) {
          .fc-cred-link {
            flex-direction: column;
            gap: 4px;
            align-items: flex-start;
          }
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
      `}</style>
    </div>
  )
}
