import { useEffect, useRef } from 'react'

// Page background — matches tokens.css --bg-page
const BG_R = 238, BG_G = 248, BG_B = 248

// Trail fade — normalized to 60fps, applied frame-rate independently.
// 0.008 at 60fps → half-life ~1.4s
const FADE_BASE = 0.008

// Grain pixels baked into each pre-rendered texture.
// Trail accumulation provides frame-to-frame variation.
const GRAIN_DENSITY = 260

// Breathing oscillation speed in rad/s
const BREATHE_SPEED = 0.084

// 7 blobs — speeds in rad/s (frame-rate independent).
// Colors shifted ~20% toward saturated teal vs original.
const BLOBS = [
  { phase: 0.00, sx: 0.060, sy: 0.046, ax: 0.30, ay: 0.26, cr: 118, cg: 182, cb: 175 },
  { phase: 1.31, sx: 0.078, sy: 0.062, ax: 0.26, ay: 0.22, cr: 148, cg: 198, cb: 214 },
  { phase: 2.67, sx: 0.046, sy: 0.036, ax: 0.32, ay: 0.28, cr: 126, cg: 184, cb: 178 },
  { phase: 3.82, sx: 0.084, sy: 0.067, ax: 0.22, ay: 0.20, cr: 136, cg: 192, cb: 186 },
  { phase: 5.14, sx: 0.066, sy: 0.053, ax: 0.34, ay: 0.26, cr: 140, cg: 196, cb: 198 },
  { phase: 4.55, sx: 0.050, sy: 0.043, ax: 0.28, ay: 0.24, cr: 122, cg: 178, cb: 162 },
  { phase: 6.20, sx: 0.072, sy: 0.053, ax: 0.24, ay: 0.20, cr: 142, cg: 188, cb: 216 },
]

export default function AmbientBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: false })
    let w = 0, h = 0
    let blobTex = []   // pre-rendered radial gradient per blob
    let grainTex = []  // pre-rendered grain halo per blob

    // ── Offscreen texture factory ──────────────────────────────
    const buildTextures = () => {
      const R = Math.min(w, h) * 0.22
      const blobSize = Math.ceil(R * 2.4)   // covers max breathing scale
      const grainSize = Math.ceil(blobSize * 1.4)

      blobTex = BLOBS.map(({ cr, cg, cb }) => {
        const oc = document.createElement('canvas')
        oc.width = oc.height = blobSize
        const o = oc.getContext('2d')
        const c = blobSize / 2, r = blobSize / 2
        const g = o.createRadialGradient(c, c, 0, c, c, r)
        g.addColorStop(0,    `rgba(${cr},${cg},${cb},0.18)`)
        g.addColorStop(0.38, `rgba(${cr},${cg},${cb},0.10)`)
        g.addColorStop(0.72, `rgba(${cr},${cg},${cb},0.035)`)
        g.addColorStop(1,    `rgba(${cr},${cg},${cb},0)`)
        o.fillStyle = g
        o.beginPath()
        o.arc(c, c, r, 0, Math.PI * 2)
        o.fill()
        return oc
      })

      grainTex = BLOBS.map(({ cr, cg, cb }) => {
        const oc = document.createElement('canvas')
        oc.width = oc.height = grainSize
        const o = oc.getContext('2d')
        const cx = grainSize / 2, cy = grainSize / 2
        const rMax = blobSize / 2
        for (let i = 0; i < GRAIN_DENSITY; i++) {
          const angle = Math.random() * Math.PI * 2
          const d = rMax * (0.46 + Math.random() * 0.84)
          const falloff = Math.max(0, 1 - (d / rMax - 0.46) / 0.84)
          const a = falloff * falloff * 0.10 * Math.random()
          const sz = 1 + Math.random() * 1.5
          o.fillStyle = `rgba(${cr},${cg},${cb},${a})`
          o.fillRect(
            cx + Math.cos(angle) * d,
            cy + Math.sin(angle) * d,
            sz, sz
          )
        }
        return oc
      })
    }

    // ── Canvas setup ───────────────────────────────────────────
    const reset = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
      ctx.fillStyle = `rgb(${BG_R},${BG_G},${BG_B})`
      ctx.fillRect(0, 0, w, h)
      buildTextures()
    }
    reset()

    let resizeTimer
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(reset, 150)
    }
    window.addEventListener('resize', onResize)

    // ── Reduced-motion ─────────────────────────────────────────
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    let paused = mq.matches
    const mqH = e => { paused = e.matches }
    mq.addEventListener('change', mqH)

    // ── Render loop (delta-time based) ─────────────────────────
    let prevTime = performance.now()
    let t = 0  // elapsed seconds
    let raf

    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      if (paused) { prevTime = now; return }

      // dt in seconds, capped to avoid jumps after tab-switch / throttle
      const dt = Math.min((now - prevTime) / 1000, 0.1)
      prevTime = now
      t += dt

      // Frame-rate independent fade:
      // at 60fps → alpha ≈ FADE_BASE
      // at 30fps → alpha ≈ 2×FADE_BASE (compensates fewer frames)
      const fadeAlpha = 1 - Math.pow(1 - FADE_BASE, dt * 60)
      ctx.fillStyle = `rgba(${BG_R},${BG_G},${BG_B},${fadeAlpha})`
      ctx.fillRect(0, 0, w, h)

      BLOBS.forEach((blob, i) => {
        const { phase, sx, sy, ax, ay } = blob

        // Lissajous position
        const bx = w * (0.5 + ax * Math.sin(t * sx + phase))
        const by = h * (0.5 + ay * Math.cos(t * sy + phase * 0.73))

        // Breathing scale
        const breathe = (Math.sin(t * BREATHE_SPEED + phase) + 1) * 0.5
        const scaleX = 0.90 + 0.18 * breathe
        const scaleY = 0.90 + 0.18 * (1 - breathe * 0.6)

        // Stamp pre-rendered gradient with breathing transform
        const bt = blobTex[i]
        if (bt) {
          ctx.save()
          ctx.translate(bx, by)
          ctx.scale(scaleX, scaleY)
          ctx.drawImage(bt, -bt.width / 2, -bt.height / 2)
          ctx.restore()
        }

        // Stamp pre-rendered grain — small random jitter for frame variation
        const gt = grainTex[i]
        if (gt) {
          const jx = (Math.random() - 0.5) * 10
          const jy = (Math.random() - 0.5) * 10
          ctx.drawImage(gt, bx - gt.width / 2 + jx, by - gt.height / 2 + jy)
        }
      })
    }

    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(resizeTimer)
      mq.removeEventListener('change', mqH)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        opacity: 0.50,
        willChange: 'transform',
      }}
    />
  )
}
