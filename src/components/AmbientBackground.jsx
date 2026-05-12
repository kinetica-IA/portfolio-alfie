import { useEffect, useRef } from 'react'

// Page background — matches tokens.css --bg-page
const BG_R = 240, BG_G = 249, BG_B = 249

// How fast the trail fades to background each frame.
// Lower = longer comet tail (half-life ~38 frames at 0.018 = ~0.6s at 60fps)
const FADE = 0.018

// 7 blobs on independent Lissajous orbits.
// sx/sy: different X/Y angular speeds → complex non-repeating paths
// ax/ay: orbital amplitude as fraction of screen dimensions
// phase: starting angle offset so blobs begin spread across screen
// Colors desaturated ~50% toward perceptual luminance so they don't compete with text
const BLOBS = [
  { phase: 0.00, sx: 0.0025, sy: 0.0019, ax: 0.30, ay: 0.26, cr: 140, cg: 188, cb: 183 },
  { phase: 1.31, sx: 0.0033, sy: 0.0026, ax: 0.26, ay: 0.22, cr: 168, cg: 205, cb: 216 },
  { phase: 2.67, sx: 0.0019, sy: 0.0015, ax: 0.32, ay: 0.28, cr: 147, cg: 191, cb: 186 },
  { phase: 3.82, sx: 0.0036, sy: 0.0028, ax: 0.22, ay: 0.20, cr: 157, cg: 198, cb: 193 },
  { phase: 5.14, sx: 0.0028, sy: 0.0022, ax: 0.34, ay: 0.26, cr: 160, cg: 202, cb: 202 },
  { phase: 4.55, sx: 0.0021, sy: 0.0018, ax: 0.28, ay: 0.24, cr: 145, cg: 186, cb: 172 },
  { phase: 6.20, sx: 0.0029, sy: 0.0022, ax: 0.24, ay: 0.20, cr: 162, cg: 196, cb: 218 },
]

export default function AmbientBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    // alpha:false → opaque canvas, better compositing perf
    const ctx = canvas.getContext('2d', { alpha: false })
    let w = 0, h = 0, t = 0, raf

    const reset = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
      ctx.fillStyle = `rgb(${BG_R},${BG_G},${BG_B})`
      ctx.fillRect(0, 0, w, h)
    }
    reset()
    window.addEventListener('resize', reset)

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    let paused = mq.matches
    const mqH = e => { paused = e.matches }
    mq.addEventListener('change', mqH)

    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (paused) return

      // Comet trail: paint near-transparent background over previous frame
      // instead of clearing — old content fades slowly, not instantly
      ctx.fillStyle = `rgba(${BG_R},${BG_G},${BG_B},${FADE})`
      ctx.fillRect(0, 0, w, h)

      const R = Math.min(w, h) * 0.22

      BLOBS.forEach(({ phase, sx, sy, ax, ay, cr, cg, cb }) => {
        // Lissajous position — sx≠sy creates figure-8 / complex orbital paths
        const bx = w * (0.5 + ax * Math.sin(t * sx + phase))
        const by = h * (0.5 + ay * Math.cos(t * sy + phase * 0.73))

        // Breathing: blob gently elongates on alternating axes over time
        const breathe = (Math.sin(t * 0.0035 + phase) + 1) * 0.5
        const rx = R * (0.90 + 0.18 * breathe)
        const ry = R * (0.90 + 0.18 * (1 - breathe * 0.6))
        const rMax = Math.max(rx, ry)

        // Core: soft radial gradient — dense teal center fading to transparent
        const grd = ctx.createRadialGradient(bx, by, 0, bx, by, rMax)
        grd.addColorStop(0,    `rgba(${cr},${cg},${cb},0.13)`)
        grd.addColorStop(0.38, `rgba(${cr},${cg},${cb},0.07)`)
        grd.addColorStop(0.72, `rgba(${cr},${cg},${cb},0.022)`)
        grd.addColorStop(1,    `rgba(${cr},${cg},${cb},0)`)
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2)
        ctx.fill()

        // Grain halo: random pixels scattered in the edge transition zone.
        // These accumulate in the canvas history → grainy color traces in the trail.
        for (let i = 0; i < 90; i++) {
          const angle = Math.random() * Math.PI * 2
          const d = rMax * (0.46 + Math.random() * 0.84)
          const falloff = Math.max(0, 1 - (d / rMax - 0.46) / 0.84)
          const a = falloff * falloff * 0.10 * Math.random()
          const sz = 1 + Math.random() * 1.5
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${a})`
          ctx.fillRect(
            bx + Math.cos(angle) * d,
            by + Math.sin(angle) * d,
            sz, sz
          )
        }
      })

      t++
    }

    tick()

    return () => {
      window.removeEventListener('resize', reset)
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
        opacity: 0.55,
      }}
    />
  )
}
