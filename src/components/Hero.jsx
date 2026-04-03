import { useState, useEffect, useRef } from 'react'
import { useTextDecode } from '../hooks/useTextDecode'

const SUB_STRINGS = [
  'wearable health intelligence',
  'clinical prediction from sleep data',
  'open-source · patient-driven',
]

/* ── Möbius Pulse: a dot bifurcates and traces a Möbius band ── */
const MOEBIUS_PALETTE = [
  [144, 167, 165], // teal
  [93, 138, 130],  // sea
  [107, 158, 122], // green
  [133, 168, 184], // ice
  [107, 138, 109], // moss
  [196, 133, 90],  // warm
  [174, 156, 120], // sand
]

function MoebiusPulse() {
  const canvasRef = useRef(null)
  const hovRef = useRef(false)
  const paramsRef = useRef(null)

  // Random params — unique each page load
  if (!paramsRef.current) {
    const c = MOEBIUS_PALETTE[Math.floor(Math.random() * MOEBIUS_PALETTE.length)]
    const c2Idx = (MOEBIUS_PALETTE.indexOf(c) + 1 + Math.floor(Math.random() * (MOEBIUS_PALETTE.length - 1))) % MOEBIUS_PALETTE.length
    paramsRef.current = {
      color: c,
      color2: MOEBIUS_PALETTE[c2Idx],
      rotation: Math.random() * Math.PI * 2,
      scale: 0.92 + Math.random() * 0.46,
      tilt: 0.52 + Math.random() * 0.48,
      stripW: 0.34 + Math.random() * 0.08,
      driftSpeed: 0.06 + Math.random() * 0.09,
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const p = paramsRef.current

    const SIZE = 640
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = SIZE * dpr
    canvas.height = SIZE * dpr
    canvas.style.width = SIZE + 'px'
    canvas.style.height = SIZE + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const cx = SIZE / 2, cy = SIZE / 2
    const R = 70 * p.scale
    const W = R * p.stripW
    const TILT = p.tilt
    const STEPS = 440

    function edge(u, sign, breathe, drift) {
      const hu = u / 2
      const rr = R * breathe + sign * W * Math.cos(hu)
      let x = rr * Math.cos(u + drift)
      let y = rr * Math.sin(u + drift) * Math.cos(TILT) + sign * W * Math.sin(hu) * Math.sin(TILT)
      const cos = Math.cos(p.rotation), sin = Math.sin(p.rotation)
      return [cx + x * cos - y * sin, cy + x * sin + y * cos]
    }

    let t0 = null, raf

    function draw(ts) {
      if (!t0) t0 = ts
      const sec = (ts - t0) / 1000
      const hov = hovRef.current

      ctx.clearRect(0, 0, SIZE, SIZE)

      const c = p.color
      const c2 = p.color2
      const breathe = 1 + Math.sin(sec * 0.7) * 0.06
      const drift = sec * p.driftSpeed

      // ── Phase: dot → bifurcation → strip ──
      const P1 = 1.2          // solo dot
      const P2 = P1 + 3.2     // construction
      const buildProg = sec < P1 ? 0
        : sec < P2 ? Math.pow((sec - P1) / (P2 - P1), 0.7)
        : 1

      const baseAlpha = hov ? 0.38 : 0.18
      const lineW = hov ? 0.7 : 0.45

      // ── Draw strip surface (cross-hatching between edges) ──
      if (buildProg > 0.3) {
        const surfAlpha = baseAlpha * 0.12 * breathe * Math.min(1, (buildProg - 0.3) / 0.4)
        const maxI = Math.floor(buildProg * STEPS)
        for (let i = 0; i < maxI; i += 4) {
          const u = (i / STEPS) * Math.PI * 2
          const [x1, y1] = edge(u, 1, breathe, drift)
          const [x2, y2] = edge(u, -1, breathe, drift)
          ctx.beginPath()
          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${surfAlpha})`
          ctx.lineWidth = 0.25
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
        }
      }

      // ── Draw two edge curves ──
      if (buildProg > 0) {
        const maxU = buildProg * Math.PI * 2
        for (const sign of [1, -1]) {
          const ec = sign === 1 ? c : c2
          ctx.beginPath()
          ctx.strokeStyle = `rgba(${ec[0]},${ec[1]},${ec[2]},${baseAlpha * breathe})`
          ctx.lineWidth = lineW
          for (let i = 0; i <= STEPS; i++) {
            const u = (i / STEPS) * Math.PI * 2
            if (u > maxU) break
            const [x, y] = edge(u, sign, breathe, drift)
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          }
          ctx.stroke()
        }
      }

      // ── Construction dot (leads the drawing) ──
      if (buildProg > 0 && buildProg < 1) {
        const leadU = buildProg * Math.PI * 2
        for (const sign of [1, -1]) {
          const [dx, dy] = edge(leadU, sign, breathe, drift)
          const ec = sign === 1 ? c : c2
          ctx.beginPath()
          ctx.fillStyle = `rgba(${ec[0]},${ec[1]},${ec[2]},${hov ? 0.8 : 0.5})`
          ctx.arc(dx, dy, hov ? 2.2 : 1.6, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ── Orbiting dots after construction ──
      if (buildProg >= 1) {
        const speed = 0.25
        const u1 = (sec * speed) % (Math.PI * 2)
        const u2 = (sec * speed + Math.PI) % (Math.PI * 2)
        const pairs = [[u1, 1, c], [u2, -1, c2]]

        for (const [u, sign, col] of pairs) {
          const [dx, dy] = edge(u, sign, breathe, drift)
          // Glow
          ctx.beginPath()
          ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${hov ? 0.14 : 0.04})`
          ctx.arc(dx, dy, hov ? 7 : 4.5, 0, Math.PI * 2)
          ctx.fill()
          // Core
          ctx.beginPath()
          ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${hov ? 0.85 : 0.4})`
          ctx.arc(dx, dy, hov ? 2 : 1.4, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ── Center origin dot (always) ──
      const dotA = buildProg < 1 ? (hov ? 0.6 : 0.3) : (hov ? 0.35 : 0.12)
      const dotR = (buildProg < 1 ? 2.2 : 1.2) * breathe
      // Halo
      ctx.beginPath()
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${dotA * 0.25})`
      ctx.arc(cx, cy, dotR * 3.5, 0, Math.PI * 2)
      ctx.fill()
      // Core
      ctx.beginPath()
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${dotA})`
      ctx.arc(cx, cy, dotR, 0, Math.PI * 2)
      ctx.fill()

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className="moebius-wrap"
      onMouseEnter={() => { hovRef.current = true }}
      onMouseLeave={() => { hovRef.current = false }}
    >
      <canvas ref={canvasRef} className="moebius-canvas" />
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
        <MoebiusPulse />
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
        .moebius-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
          cursor: default;
        }
        .moebius-canvas {
          transition: filter 0.6s ease;
        }
        .moebius-wrap:hover .moebius-canvas {
          filter: drop-shadow(0 0 18px rgba(144, 167, 165, 0.15));
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
        @media (max-width: 480px) {
          .hero-cta { flex-direction: column; align-items: center; gap: 12px; }
          .hero-btn { width: 100%; text-align: center; }
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
