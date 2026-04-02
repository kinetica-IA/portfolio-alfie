import { useState, useEffect } from 'react'
import { useTextDecode } from '../hooks/useTextDecode'

export default function Hero() {
  const brand = useTextDecode('KINETICA AI', {
    duration: 1400, delay: 400, loop: false, isActive: true,
  })
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => { if (window.scrollY > 80) setScrolled(true) }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <section className="hero">
      <h1 className="hero-brand">{brand}</h1>
      <p className="hero-tagline">
        Clinical AI systems built where data meets the patient.
      </p>
      <div className="hero-cta">
        <a href="#research" className="hero-btn hero-btn--primary">Explore the research</a>
        <a href="#founder" className="hero-btn hero-btn--secondary">About the founder</a>
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
        .hero-brand {
          font-family: var(--sans);
          font-size: var(--text-hero);
          font-weight: 300;
          letter-spacing: 0.25em;
          color: var(--text);
          margin-bottom: 24px;
          white-space: pre;
        }
        .hero-tagline {
          font-family: var(--sans);
          font-size: var(--text-body-lg);
          font-weight: 300;
          color: var(--text-sec);
          max-width: 460px;
          line-height: 1.65;
          margin-bottom: 48px;
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
          transition: all 0.25s ease;
          text-decoration: none;
        }
        .hero-btn--primary {
          border: 1.5px solid var(--green);
          color: var(--green);
        }
        .hero-btn--primary:hover {
          background: var(--green);
          color: white;
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
          display: flex;
          flex-direction: column;
          align-items: center;
          opacity: 0.15;
          transition: opacity 1s ease;
        }
        .hero-scroll--hidden { opacity: 0; pointer-events: none; }
        .hero-scroll-line {
          width: 1px;
          height: 32px;
          background: linear-gradient(to bottom, var(--teal), transparent);
        }
      `}</style>
    </section>
  )
}
