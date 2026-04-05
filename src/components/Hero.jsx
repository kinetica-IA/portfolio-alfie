import { useState, useEffect, useRef } from 'react'
import { useTextDecode } from '../hooks/useTextDecode'

// ════════════════════════════════════════════════════════════════════
// CONE ANIMATION — everything inline, scales with the hero
// ════════════════════════════════════════════════════════════════════

const WARM_COLORS = [
  [235, 165, 35], [230, 135, 50], [215, 130, 70],
  [242, 190, 55], [210, 175, 95],
]
const COOL_COLORS = [
  [60, 155, 140], [120, 185, 180], [105, 185, 205],
  [80, 175, 120], [80, 145, 160], [85, 155, 100],
]

const RAY_COUNT = 200
const CONE_HALF_ANGLE = 0.4363
const CONE_VARIATION = 0.5236
const MIN_RAY_LEN = 0.25
const MAX_RAY_LEN = 0.80
const LW_MIN = 0.08
const LW_MAX = 1.1
const BASE_ALPHA = 0.50
const PULSE_SPEED = 0.0009
const PULSE_AMP = 0.05
const ROT_SPEED = 0.00004
const PERSP = 900
const CURSOR_R = 250
const CURSOR_PUSH = 0.04
const CURVE_AMP = 0.06
const CURVE_SPEED = 0.0005
const BREATH_SPEED = 0.000523
const BREATH_MIX = 0.45
const TRAIL_ALPHA = 0.07
const PR_RANGE = 0.10
const PR_BOOST = 0.25
const HALO_THRESH = 0.55
const HALO_W = 3.5
const HALO_A = 0.12
const PULSE_BPM = 33
const PULSE_INT = 60000 / PULSE_BPM
const MOBILE_BP = 480
const MOBILE_THIN = 0.65

function makeRays() {
  const rays = []
  for (let i = 0; i < RAY_COUNT; i++) {
    rays.push({
      phi: (i / RAY_COUNT) * Math.PI * 2,
      theta: CONE_HALF_ANGLE + Math.random() * CONE_VARIATION,
      length: MIN_RAY_LEN + Math.random() * (MAX_RAY_LEN - MIN_RAY_LEN),
      bw: LW_MIN + Math.random() * (LW_MAX - LW_MIN),
      ba: BASE_ALPHA * (0.35 + Math.random() * 0.65),
      wc: WARM_COLORS[Math.floor(Math.random() * WARM_COLORS.length)],
      cc: COOL_COLORS[Math.floor(Math.random() * COOL_COLORS.length)],
      ct: Math.random(),
      sj: 0.85 + Math.random() * 0.30,
      cp: Math.random() * Math.PI * 2,
      px: null, py: null,
    })
  }
  return rays
}

function buildCone(rays, fx, fy, mr, pulse, rot, dir, mx, my, cOn, cr2, out, H, now, pY) {
  for (let i = 0; i < rays.length; i++) {
    const r = rays[i]
    const rr = rot * r.sj
    const cR = Math.cos(rr), sR = Math.sin(rr)
    const len = r.length * mr * pulse
    const sT = Math.sin(r.theta), cT = Math.cos(r.theta)

    const lx = len * sT * Math.cos(r.phi)
    const ly = dir * len * cT
    const lz = len * sT * Math.sin(r.phi)
    const wx = lx * cR - lz * sR
    const wz = lx * sR + lz * cR

    const ps = PERSP / (PERSP + wz)
    const df = Math.max(0.01, ps)
    const dW = 0.10 + df * 0.90
    const dL = 0.40 + df * 0.60
    const dA = 0.03 + df * df * 0.97

    const al = len * dL
    const ax = al * sT * Math.cos(r.phi)
    const ay = dir * al * cT
    const az = al * sT * Math.sin(r.phi)
    const awx = ax * cR - az * sR
    const awz = ax * sR + az * cR
    const aps = PERSP / (PERSP + awz)

    let tx = fx + awx * aps
    let ty = fy + ay * aps

    if (dir === -1 && ty > fy) continue

    if (cOn) {
      const dx = tx - mx, dy = ty - my, d2 = dx * dx + dy * dy
      if (d2 < cr2) {
        const p = CURSOR_PUSH * mr * (1 - d2 / cr2) * aps
        const a2 = Math.atan2(ty - fy, tx - fx)
        tx += Math.cos(a2) * p; ty += Math.sin(a2) * p
      }
    }

    let pb = 0
    if (pY !== null) {
      const dp = Math.abs(ty - pY) / H
      if (dp < PR_RANGE) pb = (1 - dp / PR_RANGE) * PR_BOOST
    }

    const bp = Math.sin(now * BREATH_SPEED) * 0.5 + 0.5
    const ect = r.ct * (1 - BREATH_MIX) + bp * BREATH_MIX
    const co = Math.sin(now * CURVE_SPEED + r.cp) * al * CURVE_AMP

    out.push({
      fx, fy, tx, ty,
      alpha: r.ba * Math.max(0.03, dA) * (1 + pb),
      width: r.bw * Math.max(0.1, dW) * (1 + pb * 0.5),
      wc: r.wc, cc: r.cc, ct: ect,
      depth: wz, df, co,
      ptx: r.px, pty: r.py,
    })
    r.px = tx; r.py = ty
  }
}

// ════════════════════════════════════════════════════════════════════
// HERO COMPONENT
// ════════════════════════════════════════════════════════════════════

const SUB_STRINGS = [
  'wearable health intelligence',
  'clinical prediction from sleep data',
  'open-source · patient-driven',
]

export default function Hero() {
  const canvasRef = useRef(null)
  const heroRef = useRef(null)
  const brandRef = useRef(null)
  const raf = useRef(null)

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

  // ── Canvas animation ───────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const hero = heroRef.current
    const h1 = brandRef.current
    if (!canvas || !hero || !h1) return
    const ctx = canvas.getContext('2d')

    let W, H, maxReach, isMobile, fxPx, fyPx
    const mouse = { x: -1, y: -1 }
    const rays = makeRays()

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = hero.offsetWidth
      H = hero.offsetHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      isMobile = W <= MOBILE_BP

      // Focal point = center of the h1, directly from the ref
      const heroRect = hero.getBoundingClientRect()
      const h1Rect = h1.getBoundingClientRect()
      fxPx = (h1Rect.left + h1Rect.right) / 2 - heroRect.left
      fyPx = h1Rect.top - heroRect.top  // top edge of h1

      // maxReach = proportion of space above the title — fyPx controls everything
      maxReach = fyPx * (isMobile ? 0.70 : 0.85)
    }

    function onMove(e) { mouse.x = e.clientX; mouse.y = e.clientY }
    function onLeave() { mouse.x = -1; mouse.y = -1 }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', resize)
    resize()

    let fc = 0
    function draw(now) {
      if (++fc >= 30) { fc = 0; resize() }

      ctx.clearRect(0, 0, W, H)

      const pulse = 1 + Math.sin(now * PULSE_SPEED) * PULSE_AMP
      const rot = now * ROT_SPEED
      const cOn = mouse.x >= 0
      const cr2 = CURSOR_R * CURSOR_R

      const bp = (now % PULSE_INT) / PULSE_INT
      const pY = fyPx - bp * H * 0.3

      const dl = []
      buildCone(rays, fxPx, fyPx, maxReach, pulse, rot, -1,
        mouse.x, mouse.y, cOn, cr2, dl, H, now, pY)

      dl.sort((a, b) => a.depth - b.depth)

      for (let i = 0; i < dl.length; i++) {
        const d = dl[i]
        const t = d.ct, wc = d.wc, cc = d.cc
        const rv = wc[0] + (cc[0] - wc[0]) * t
        const gv = wc[1] + (cc[1] - wc[1]) * t
        const bv = wc[2] + (cc[2] - wc[2]) * t
        const a = d.alpha
        const lw = isMobile ? d.width * MOBILE_THIN : d.width

        // Trail
        if (d.ptx !== null && d.pty !== null) {
          ctx.strokeStyle = `rgba(${rv|0},${gv|0},${bv|0},${a * TRAIL_ALPHA})`
          ctx.lineWidth = lw * 0.6
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(d.ptx, d.pty)
          ctx.lineTo(d.tx, d.ty)
          ctx.stroke()
        }

        // Gradient ray
        const g = ctx.createLinearGradient(d.fx, d.fy, d.tx, d.ty)
        g.addColorStop(0,    `rgba(${rv|0},${gv|0},${bv|0},${a * 0.6})`)
        g.addColorStop(0.25, `rgba(${rv|0},${gv|0},${bv|0},${a})`)
        g.addColorStop(0.65, `rgba(${rv|0},${gv|0},${bv|0},${a * 0.45})`)
        g.addColorStop(1,    `rgba(${rv|0},${gv|0},${bv|0},${a * 0.1})`)

        ctx.strokeStyle = g
        ctx.lineWidth = lw
        ctx.lineCap = 'round'

        const mx = (d.fx + d.tx) / 2, my = (d.fy + d.ty) / 2
        const ra = Math.atan2(d.ty - d.fy, d.tx - d.fx)
        const pa = ra + Math.PI * 0.5
        const cpx = mx + Math.cos(pa) * d.co
        const cpy = my + Math.sin(pa) * d.co

        ctx.beginPath()
        ctx.moveTo(d.fx, d.fy)
        ctx.quadraticCurveTo(cpx, cpy, d.tx, d.ty)
        ctx.stroke()

        // Halo
        if (d.df > HALO_THRESH) {
          const hs = (d.df - HALO_THRESH) / (1 - HALO_THRESH)
          ctx.strokeStyle = `rgba(${rv|0},${gv|0},${bv|0},${a * HALO_A * hs})`
          ctx.lineWidth = lw * HALO_W
          ctx.beginPath()
          ctx.moveTo(d.fx, d.fy)
          ctx.quadraticCurveTo(cpx, cpy, d.tx, d.ty)
          ctx.stroke()
        }
      }

      raf.current = requestAnimationFrame(draw)
    }

    raf.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <section className="hero section" ref={heroRef}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <div className="hero-content">
        <h1 className="hero-brand" ref={brandRef}>{brand}</h1>
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
          margin: 20px auto 0;
          min-height: 1.4em;
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
