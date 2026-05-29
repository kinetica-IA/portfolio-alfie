import { useState, useEffect, useRef } from 'react'
import { useTextDecode } from '../hooks/useTextDecode'
// ════════════════════════════════════════════════════════════════════
// HERO COMPONENT — breathing background + real numbers
// ════════════════════════════════════════════════════════════════════

const SUB_STRINGS = [
  'End-to-end · open data · reproducible',
  'pipeline · predictors · agent · safety layer',
  'audited reasoning · idiographic models · open code',
  'N-of-1 longitudinal · interpretable by design',
]

export default function Hero({ nightsCount, children }) {
  const heroRef = useRef(null)
  const brandRef = useRef(null)

  const brand = useTextDecode('KINETICA AI', {
    duration: 1800, delay: 500, loop: false, isActive: true,
  })

  const [bootStep, setBootStep] = useState(0)
  const bootTimers = useRef([])

  useEffect(() => {
    bootTimers.current = [
      setTimeout(() => setBootStep(1), 2200),
      setTimeout(() => setBootStep(2), 2800),
      setTimeout(() => setBootStep(3), 3400),
    ]
    return () => bootTimers.current.forEach(clearTimeout)
  }, [])

  const [subIndex, setSubIndex] = useState(0)
  const subTimer = useRef(null)

  useEffect(() => {
    if (bootStep < 2) return
    const cycle = () => {
      subTimer.current = setTimeout(() => {
        setSubIndex(i => (i + 1) % SUB_STRINGS.length)
        cycle()
      }, 6000)
    }
    cycle()
    return () => clearTimeout(subTimer.current)
  }, [bootStep])

  const subText = useTextDecode(SUB_STRINGS[subIndex], {
    duration: 1200, delay: 0, loop: false, isActive: bootStep >= 2,
  })

  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => { if (window.scrollY > 80) setScrolled(true) }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <section className="hero section" ref={heroRef}>
      <div className="hero-content">
        <h1 className="hero-brand" ref={brandRef}>{brand}</h1>
        <div className="hero-rule" />
        <p className="hero-tagline" style={{
          opacity: bootStep >= 1 ? 1 : 0,
          transform: bootStep >= 1 ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.8s var(--ease-out), transform 0.8s var(--ease-out)',
        }}>
          End-to-end clinical AI, engineered on real longitudinal physiology. Not abstract benchmarks.
        </p>
        <p className="hero-sub" style={{
          opacity: bootStep >= 2 ? 1 : 0,
          transition: 'opacity 0.6s var(--ease-out)',
        }}>
          {subText}
        </p>
        <div className={`hero-stats ${bootStep >= 3 ? 'hero-stats--in' : ''}`}>
          <span className="hero-stat" style={{ '--i': 0 }}><strong>243</strong>-day archive</span>
          <span className="hero-stat-sep" style={{ '--i': 0 }} />
          <span className="hero-stat" style={{ '--i': 1 }}><strong>3</strong> idiographic predictors</span>
          <span className="hero-stat-sep" style={{ '--i': 1 }} />
          <span className="hero-stat" style={{ '--i': 2 }}><strong>LangGraph</strong> guarded agent</span>
          <span className="hero-stat-sep" style={{ '--i': 2 }} />
          <span className="hero-stat" style={{ '--i': 3 }}><strong>Curated</strong> RAG</span>
        </div>
      </div>
      <div className="hero-cta" style={{
        opacity: bootStep >= 3 ? 1 : 0,
        transform: bootStep >= 3 ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.6s var(--ease-out), transform 0.6s var(--ease-out)',
      }}>
        <a href="#pipeline" className="hero-btn hero-btn--primary">Explore the system</a>
        <a href="#research" className="hero-btn hero-btn--secondary">View open research</a>
      </div>
      {children && (
        <div className="hero-live" style={{
          opacity: bootStep >= 3 ? 1 : 0,
          transform: bootStep >= 3 ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.8s var(--ease-out) 0.5s, transform 0.8s var(--ease-out) 0.5s',
        }}>
          {children}
        </div>
      )}
      <div className={`hero-scroll ${scrolled ? 'hero-scroll--hidden' : ''}`}>
        <span className="hero-scroll-line" />
      </div>

      <style>{`
        .hero {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 24px;
          position: relative;
          overflow: hidden;
        }
        .hero-content {
          margin-bottom: 56px;
          position: relative;
          z-index: 1;
        }
        .hero-brand {
          font-family: var(--sans);
          font-size: var(--text-hero);
          font-weight: 500;
          letter-spacing: 0.18em;
          color: var(--text-heading);
          margin-bottom: 0;
          white-space: nowrap;
          text-shadow: 0 1px 3px rgba(36, 64, 60, 0.06);
        }
        @media (max-width: 480px) {
          .hero-brand {
            font-size: clamp(2rem, 10vw, 3.5rem);
            letter-spacing: 0.1em;
          }
        }
        .hero-rule {
          width: 48px;
          height: 2px;
          background: linear-gradient(90deg, var(--teal), var(--sea));
          margin: 28px auto;
          opacity: 0.6;
        }
        .hero-tagline {
          font-family: var(--sans);
          font-size: var(--text-body-lg);
          font-weight: 300;
          color: var(--text-sec);
          max-width: 440px;
          margin: 0 auto;
          line-height: 1.7;
        }
        .hero-sub {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--teal);
          letter-spacing: 0.06em;
          margin: 16px auto 0;
          min-height: 1.4em;
        }
        .hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          margin: 28px auto 36px;
          max-width: 540px;
        }
        .hero-stat,
        .hero-stat-sep {
          opacity: 0;
          transform: translateY(6px);
          transition:
            opacity 0.6s var(--ease-out) calc(0.15s + var(--i, 0) * 110ms),
            transform 0.6s var(--ease-out) calc(0.15s + var(--i, 0) * 110ms);
        }
        .hero-stats--in .hero-stat,
        .hero-stats--in .hero-stat-sep {
          opacity: 1;
          transform: translateY(0);
        }
        .hero-stats--in .hero-stat-sep { opacity: 0.6; }
        .hero-stat {
          font-family: var(--mono);
          font-size: var(--text-eyebrow);
          color: var(--text-dim);
          letter-spacing: 0.04em;
        }
        .hero-stat strong {
          font-weight: 500;
          color: var(--green);
          margin-right: 4px;
          display: inline-block;
        }
        .hero-stats--in .hero-stat strong {
          animation: heroStatPulse 0.9s var(--ease-out) calc(0.4s + var(--i, 0) * 110ms) both;
        }
        @keyframes heroStatPulse {
          0%   { color: var(--text-heading); transform: scale(0.96); }
          55%  { color: var(--green); transform: scale(1.06); }
          100% { color: var(--green); transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-stat, .hero-stat-sep { transition: opacity 0.2s linear; transform: none; }
          .hero-stats--in .hero-stat strong { animation: none; }
        }
        .hero-stat-sep {
          width: 1px;
          height: 10px;
          background: var(--border);
        }
        @media (max-width: 480px) {
          .hero-stats { gap: 10px; margin: 22px auto 28px; }
          .hero-stat-sep { display: none; }
        }
        .hero-cta {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: center;
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
          .hero-cta { flex-direction: column; align-items: center; gap: 12px; }
          .hero-btn { width: 100%; text-align: center; }
        }
        .hero-live {
          margin-top: 56px;
          position: relative;
          z-index: 1;
          width: 100%;
          display: flex;
          justify-content: center;
        }
        @media (max-width: 480px) { .hero-live { margin-top: 40px; } }
        .hero-scroll {
          position: absolute;
          bottom: 40px;
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
      `}</style>
    </section>
  )
}
