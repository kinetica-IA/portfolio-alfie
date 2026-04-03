import { useState, useEffect, useRef } from 'react'
import { useTextDecode } from '../hooks/useTextDecode'

const SUB_STRINGS = [
  'wearable health intelligence',
  'clinical prediction from sleep data',
  'open-source · patient-driven',
]

/* ── Constellation: ring of colored dots that breathe in sequence ── */
const CONSTELLATION_DOTS = [
  { angle: 0,   color: 'var(--teal)' },
  { angle: 45,  color: 'var(--sea)' },
  { angle: 90,  color: 'var(--green)' },
  { angle: 135, color: 'var(--ice)' },
  { angle: 180, color: 'var(--moss)' },
  { angle: 225, color: 'var(--warm)' },
  { angle: 270, color: 'var(--sand)' },
  { angle: 315, color: 'var(--slate)' },
]

function Constellation() {
  const [hovered, setHovered] = useState(false)
  const RADIUS = 52 // orbit radius in SVG units
  const CENTER = 60  // SVG center

  return (
    <div
      className="constellation-wrap"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg
        width={140} height={140} viewBox="0 0 120 120"
        className="constellation"
        style={{ overflow: 'visible' }}
      >
        {/* Ghost orbit ring */}
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none"
          stroke="var(--teal)" strokeWidth="0.3"
          opacity={hovered ? '0.35' : '0.12'}
          style={{ transition: 'opacity 0.6s ease' }}
        />

        {/* Inner ghost ring */}
        <circle cx={CENTER} cy={CENTER} r={RADIUS * 0.5} fill="none"
          stroke="var(--sea)" strokeWidth="0.2"
          opacity={hovered ? '0.25' : '0.08'}
          style={{ transition: 'opacity 0.6s ease' }}
        />

        {/* Dots breathing in sequence */}
        {CONSTELLATION_DOTS.map((dot, i) => {
          const rad = (dot.angle * Math.PI) / 180
          const x = CENTER + Math.cos(rad) * RADIUS
          const y = CENTER + Math.sin(rad) * RADIUS
          const delay = i * 0.4 // stagger the breathing wave

          return (
            <g key={i}>
              {/* Glow ring */}
              <circle cx={x} cy={y} r="5" fill={dot.color}
                opacity={hovered ? '0.15' : '0.06'}
                style={{ transition: 'opacity 0.5s ease' }}
              >
                <animate attributeName="r" values="4;6;4" dur="3.2s"
                  begin={`${delay}s`} repeatCount="indefinite" />
                <animate attributeName="opacity"
                  values={hovered ? '0.10;0.22;0.10' : '0.04;0.10;0.04'}
                  dur="3.2s" begin={`${delay}s`} repeatCount="indefinite" />
              </circle>
              {/* Core dot */}
              <circle cx={x} cy={y} r="1.8" fill={dot.color}
                opacity={hovered ? '0.85' : '0.45'}
                style={{ transition: 'opacity 0.5s ease' }}
              >
                <animate attributeName="r" values="1.5;2.2;1.5" dur="3.2s"
                  begin={`${delay}s`} repeatCount="indefinite" />
                <animate attributeName="opacity"
                  values={hovered ? '0.6;0.95;0.6' : '0.3;0.55;0.3'}
                  dur="3.2s" begin={`${delay}s`} repeatCount="indefinite" />
              </circle>
            </g>
          )
        })}

        {/* Faint connecting lines between adjacent dots */}
        {CONSTELLATION_DOTS.map((dot, i) => {
          const next = CONSTELLATION_DOTS[(i + 1) % CONSTELLATION_DOTS.length]
          const rad1 = (dot.angle * Math.PI) / 180
          const rad2 = (next.angle * Math.PI) / 180
          const x1 = CENTER + Math.cos(rad1) * RADIUS
          const y1 = CENTER + Math.sin(rad1) * RADIUS
          const x2 = CENTER + Math.cos(rad2) * RADIUS
          const y2 = CENTER + Math.sin(rad2) * RADIUS

          return (
            <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="var(--teal)" strokeWidth="0.3"
              opacity={hovered ? '0.25' : '0.08'}
              style={{ transition: 'opacity 0.6s ease' }}
            />
          )
        })}

        {/* Center dot — tiny, subtle */}
        <circle cx={CENTER} cy={CENTER} r="1.2" fill="var(--teal)"
          opacity={hovered ? '0.6' : '0.25'}
          style={{ transition: 'opacity 0.5s ease' }}
        >
          <animate attributeName="r" values="1;1.5;1" dur="4s" repeatCount="indefinite" />
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
        <Constellation />
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
        .constellation-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
          cursor: default;
        }
        .constellation {
          filter: drop-shadow(0 0 0px transparent);
          transition: filter 0.6s ease;
        }
        .constellation-wrap:hover .constellation {
          filter: drop-shadow(0 0 16px rgba(144, 167, 165, 0.2));
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
