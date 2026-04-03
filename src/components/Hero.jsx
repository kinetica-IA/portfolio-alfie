import { useState, useEffect, useRef } from 'react'
import { useTextDecode } from '../hooks/useTextDecode'

const SUB_STRINGS = [
  'wearable health intelligence',
  'clinical prediction from sleep data',
  'open-source · patient-driven',
]

/* ── Hero Symbol: living pulse that glows on hover ──────── */
function HeroSymbol() {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="hero-symbol-wrap"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg
        width={72} height={72} viewBox="0 0 28 28"
        className="hero-symbol"
        style={{ overflow: 'visible' }}
      >
        {/* Outer breathing ring */}
        <circle cx="14" cy="14" r="12" fill="none" stroke="var(--teal)" strokeWidth="0.6"
          opacity={hovered ? '0.7' : '0.3'} style={{ transition: 'opacity 0.5s ease' }}>
          <animate attributeName="r" values="11;13;11" dur="4s" repeatCount="indefinite" />
        </circle>

        {/* Middle orbit ring */}
        <circle cx="14" cy="14" r="8" fill="none" stroke="var(--sea)" strokeWidth="0.4"
          opacity={hovered ? '0.5' : '0.2'} style={{ transition: 'opacity 0.5s ease' }}>
          <animate attributeName="r" values="8;9;8" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* ECG pulse trace */}
        <polyline
          points="2,14 7,14 9,7 11,21 13,5 15,19 17,9 19,14 26,14"
          fill="none" stroke="var(--green)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
          opacity={hovered ? '0.95' : '0.6'}
          strokeDasharray="50" strokeDashoffset="0"
          style={{ transition: 'opacity 0.4s ease' }}
        >
          <animate attributeName="stroke-dashoffset" values="50;0;0;50" dur="3s" repeatCount="indefinite" keyTimes="0;0.35;0.7;1" />
        </polyline>

        {/* Orbiting dot */}
        <circle r="1.5" fill="var(--warm)" opacity={hovered ? '0.9' : '0.5'}
          style={{ transition: 'opacity 0.4s ease' }}>
          <animateMotion dur="6s" repeatCount="indefinite" path="M14,2 A12,12 0 1,1 13.99,2" />
        </circle>

        {/* Core pulse dot */}
        <circle cx="14" cy="14" r="2.5" fill="var(--teal)"
          opacity={hovered ? '0.9' : '0.5'} style={{ transition: 'opacity 0.4s ease' }}>
          <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values={hovered ? '0.7;1;0.7' : '0.35;0.6;0.35'} dur="2s" repeatCount="indefinite" />
        </circle>

        {/* Hover glow */}
        <circle cx="14" cy="14" r="10" fill="var(--teal)"
          opacity={hovered ? '0.08' : '0'} style={{ transition: 'opacity 0.5s ease' }}>
        </circle>
      </svg>
    </div>
  )
}

export default function Hero() {
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
    <section className="hero section">
      <div className="hero-content">
        <HeroSymbol />
        <h1 className="hero-brand">{brand}</h1>
        <div className="hero-rule" />
        <p className="hero-tagline" style={{
          opacity: bootStep >= 1 ? 1 : 0,
          transform: bootStep >= 1 ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.8s var(--ease-out), transform 0.8s var(--ease-out)',
        }}>
          Every night, your heart tells a story about your health.<br />
          We're teaching AI to listen.
        </p>
        <p className="hero-sub" style={{
          opacity: bootStep >= 2 ? 1 : 0,
          transition: 'opacity 0.6s var(--ease-out)',
        }}>
          {subText}
        </p>
      </div>
      <div className="hero-cta" style={{
        opacity: bootStep >= 3 ? 1 : 0,
        transform: bootStep >= 3 ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.6s var(--ease-out), transform 0.6s var(--ease-out)',
      }}>
        <a href="#research" className="hero-btn hero-btn--primary">See the research</a>
        <a href="#founder" className="hero-btn hero-btn--secondary">Meet the builder</a>
      </div>
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
        }
        .hero-content {
          margin-bottom: 56px;
        }
        .hero-symbol-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
          cursor: default;
        }
        .hero-symbol {
          filter: drop-shadow(0 0 0px transparent);
          transition: filter 0.5s ease;
        }
        .hero-symbol-wrap:hover .hero-symbol {
          filter: drop-shadow(0 0 12px rgba(144, 167, 165, 0.3));
        }
        .hero-brand {
          font-family: var(--sans);
          font-size: var(--text-hero);
          font-weight: 500;
          letter-spacing: 0.18em;
          color: var(--text-heading);
          margin-bottom: 0;
          white-space: pre;
          text-shadow: 0 1px 3px rgba(36, 64, 60, 0.06);
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
          margin: 20px auto 0;
          min-height: 1.4em;
        }
        .hero-cta {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: center;
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
        .hero-scroll {
          position: absolute;
          bottom: 40px;
          opacity: 0.30;
          transition: opacity 1.2s var(--ease-out);
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
