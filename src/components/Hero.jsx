import { useState, useEffect, useRef } from 'react'
// ════════════════════════════════════════════════════════════════════
// HERO — value-first. The promise is the headline; the live signal
// is the proof. Wordmark lives in the topbar.
// ════════════════════════════════════════════════════════════════════

export default function Hero({ children }) {
  const heroRef = useRef(null)

  const [shown, setShown] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 120)
    return () => clearTimeout(t)
  }, [])

  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => { if (window.scrollY > 80) setScrolled(true) }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const rise = (i) => ({
    opacity: shown ? 1 : 0,
    transform: shown ? 'translateY(0)' : 'translateY(14px)',
    transition: `opacity 0.8s var(--ease-out) ${i * 140}ms, transform 0.8s var(--ease-out) ${i * 140}ms`,
  })

  return (
    <section className="hero section" ref={heroRef}>
      <div className="hero-content">
        <span className="hero-eyebrow" style={rise(0)}>
          N-of-1 · longitudinal · open research
        </span>

        <h1 className="hero-headline" style={rise(1)}>
          <strong className="hero-num">243 days</strong> of one body,
          turned into <em>auditable</em> clinical AI.
        </h1>

        <p className="hero-sub" style={rise(2)}>
          Pipeline · predictors · guarded agent · safety layer. End to end, open, reproducible.
        </p>

        <div className="hero-cta" style={rise(3)}>
          <a href="#system" className="hero-btn hero-btn--primary">Explore the system</a>
          <a href="#research" className="hero-btn hero-btn--secondary">View open research</a>
        </div>

        {children && (
          <div className="hero-live" style={rise(4)}>
            {children}
          </div>
        )}
      </div>

      <div className={`hero-scroll ${scrolled ? 'hero-scroll--hidden' : ''}`}>
        <span className="hero-scroll-line" />
      </div>

      <style>{`
        .hero {
          min-height: 88vh;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          text-align: left;
          padding: 96px 0 48px;
          position: relative;
          overflow: hidden;
        }
        .hero-content {
          position: relative;
          z-index: 1;
          width: 100%;
        }
        .hero-eyebrow {
          display: inline-block;
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 24px;
        }
        .hero-headline {
          font-family: var(--sans);
          font-size: clamp(2.25rem, 4.6vw, 3.5rem);
          font-weight: 500;
          line-height: 1.18;
          letter-spacing: -0.01em;
          color: var(--text-heading);
          max-width: 760px;
          text-shadow: 0 1px 3px rgba(36, 64, 60, 0.05);
        }
        .hero-num {
          font-weight: 600;
          color: var(--green);
          white-space: nowrap;
        }
        .hero-headline em {
          font-style: normal;
          color: var(--text-heading);
        }
        .hero-sub {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--text-dim);
          letter-spacing: 0.04em;
          line-height: 1.7;
          max-width: 560px;
          margin: 28px 0 0;
        }
        .hero-cta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 36px;
          position: relative;
          z-index: 1;
        }
        .hero-btn {
          font-family: var(--mono);
          font-size: var(--text-caption);
          padding: 12px 28px;
          transition: all var(--duration-hover) var(--ease-out);
          text-decoration: none;
        }
        .hero-btn--primary {
          border: 1.5px solid var(--green);
          color: var(--green);
        }
        .hero-btn--primary:hover {
          background: var(--green);
          color: white;
          box-shadow: 0 2px 12px rgba(107,158,122,0.15);
        }
        .hero-btn--secondary {
          border: 1px solid var(--border-active);
          color: var(--text-dim);
        }
        .hero-btn--secondary:hover {
          border-color: var(--teal);
          color: var(--text);
        }
        @media (max-width: 480px) {
          .hero-cta { flex-direction: column; align-items: stretch; gap: 12px; }
          .hero-btn { width: 100%; text-align: center; }
        }
        .hero-live {
          margin-top: 40px;
          position: relative;
          z-index: 1;
          width: 100%;
          display: flex;
          justify-content: flex-start;
        }
        .hero-scroll {
          position: absolute;
          bottom: 36px;
          left: 0;
          opacity: 0.30;
          transition: opacity 1.2s var(--ease-out);
          z-index: 1;
        }
        .hero-scroll--hidden { opacity: 0; }
        .hero-scroll-line {
          display: block;
          width: 1px;
          height: 32px;
          background: linear-gradient(to bottom, var(--teal), transparent);
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-content > * { transition: opacity 0.2s linear !important; transform: none !important; }
        }
      `}</style>
    </section>
  )
}
