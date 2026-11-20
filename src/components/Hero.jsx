import { useState, useEffect } from 'react'
import { useTextDecode } from '../hooks/useTextDecode'
// ════════════════════════════════════════════════════════════════════
// HERO (ES, clinical home at /es/) — wordmark + alternating slogan.
// The rotating slogan has no aria-live: screen readers are not interrupted
// every few seconds. With reduced motion it does not rotate.
// The English home uses src/components/site/HomeHero.astro instead.
// ════════════════════════════════════════════════════════════════════

const SUBTITLES = ['Recupera tu movimiento', 'Del síntoma al mecanismo']
const CYCLE_MS = 4000
const DECODE_MS = 1000

const MAILTO_HREF = 'mailto:alfon.atman@gmail.com?subject=Consulta%20osteopat%C3%ADa&body=Describe%20tu%20problema%20con%20tus%20palabras.'

function useAlternating(strings, cycleMs) {
  const [index, setIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e) => setReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (reducedMotion) return
    const id = setInterval(() => {
      setIndex(i => (i + 1) % strings.length)
    }, cycleMs)
    return () => clearInterval(id)
  }, [reducedMotion, strings.length, cycleMs])

  return { current: strings[index], reducedMotion }
}

export default function Hero() {
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

  const { current, reducedMotion } = useAlternating(SUBTITLES, CYCLE_MS)
  const tagline = useTextDecode(current, { isActive: !reducedMotion, duration: DECODE_MS })

  const rise = (i) => ({
    opacity: shown ? 1 : 0,
    transform: shown ? 'translateY(0)' : 'translateY(14px)',
    transition: `opacity 0.8s var(--ease-out) ${i * 140}ms, transform 0.8s var(--ease-out) ${i * 140}ms`,
  })

  return (
    <section className="hero section">
      <div className="hero-content">
        <h1 className="hero-brand" style={rise(0)}>KINETICAAI</h1>

        <p className="hero-tagline" style={rise(1)}>
          {reducedMotion ? SUBTITLES[0] : tagline}
        </p>

        <div className="hero-cta" style={rise(2)}>
          <a href={MAILTO_HREF} className="hero-btn hero-btn--primary">Cuéntame tu caso, sin compromiso</a>
          <a href="/es/informes/" className="hero-btn hero-btn--secondary">Ver informes</a>
        </div>
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
        .hero-brand {
          font-family: var(--sans);
          font-size: var(--text-hero);
          font-weight: 500;
          letter-spacing: -0.01em;
          color: var(--text-heading);
          text-shadow: 0 1px 3px rgba(36, 64, 60, 0.05);
        }
        .hero-tagline {
          font-family: var(--mono);
          font-size: var(--text-body-lg);
          color: var(--text-dim);
          letter-spacing: 0.04em;
          line-height: 1.7;
          max-width: 560px;
          margin: 20px 0 0;
          min-height: 1.7em;
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
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          font-family: var(--mono);
          font-size: var(--text-caption);
          padding: 12px 28px;
          transition: all var(--duration-hover) var(--ease-out);
          text-decoration: none;
        }
        .hero-btn--primary {
          border: 1.5px solid var(--green-text);
          color: var(--green-text);
        }
        .hero-btn--primary:hover {
          background: var(--green-text);
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
