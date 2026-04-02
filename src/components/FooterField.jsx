import { useRef, useEffect } from 'react'

/**
 * FooterField — Dramatic closing animation
 *
 * Inspired by Isidor's footer wave canvas, but clinical.
 * A dense field of converging signal lines that intensify and
 * "breathe" when the footer comes into view.
 *
 * Layers:
 * 1. Dense horizontal signal lines (more than ClinicalField, closer spacing)
 * 2. Vertical "data streams" — thin lines flowing downward
 * 3. Convergence point — lines subtly curve toward a focal node
 * 4. Color washes — waves of palette color sweep through
 *
 * The whole thing activates when scrolled into view and
 * feels like the system gathering energy before sign-off.
 */

// Simplex noise (shared with ClinicalField)
const F2 = 0.5 * (Math.sqrt(3) - 1)
const G2 = (3 - Math.sqrt(3)) / 6
const GRAD = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]
const PERM = new Uint8Array(512)
;(function() {
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  for (let i = 255; i > 0; i--) {
    const j = (i * 48271 + 7) % 256
    const t = p[i]; p[i] = p[j]; p[j] = t
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255]
})()

function noise2D(x, y) {
  const s = (x + y) * F2
  const i = Math.floor(x + s), j = Math.floor(y + s)
  const t = (i + j) * G2
  const x0 = x - (i - t), y0 = y - (j - t)
  const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1
  const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2
  const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2
  const ii = i & 255, jj = j & 255
  let n0 = 0, n1 = 0, n2 = 0
  let t0 = 0.5 - x0*x0 - y0*y0
  if (t0 > 0) { t0 *= t0; const g = GRAD[PERM[ii + PERM[jj]] & 7]; n0 = t0*t0*(g[0]*x0+g[1]*y0) }
  let t1 = 0.5 - x1*x1 - y1*y1
  if (t1 > 0) { t1 *= t1; const g = GRAD[PERM[ii+i1 + PERM[jj+j1]] & 7]; n1 = t1*t1*(g[0]*x1+g[1]*y1) }
  let t2 = 0.5 - x2*x2 - y2*y2
  if (t2 > 0) { t2 *= t2; const g = GRAD[PERM[ii+1 + PERM[jj+1]] & 7]; n2 = t2*t2*(g[0]*x2+g[1]*y2) }
  return 70 * (n0 + n1 + n2)
}

const COLORS = [
  [93, 138, 130],   // sea
  [107, 158, 122],  // green
  [144, 167, 165],  // teal
  [133, 168, 184],  // ice
  [107, 138, 109],  // moss
  [196, 133, 90],   // warm (rare accent)
]

export default function FooterField() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const raf = useRef(null)
  const isVisible = useRef(false)
  const intensity = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')

    let W, H, dpr
    let time = 0

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const rect = container.getBoundingClientRect()
      W = rect.width
      H = rect.height
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    // Intersection observer for activation
    const obs = new IntersectionObserver(([entry]) => {
      isVisible.current = entry.isIntersecting
    }, { threshold: 0.1 })
    obs.observe(container)

    const LINE_SPACING = 24
    const STREAM_SPACING = 80

    function draw() {
      const dt = 1 / 60
      time += dt

      // Intensity ramp: 0 → 1 when visible, back to 0.15 when not
      const target = isVisible.current ? 1 : 0.15
      intensity.current += (target - intensity.current) * (isVisible.current ? 0.025 : 0.01)
      const I = intensity.current

      ctx.clearRect(0, 0, W, H)

      const numLines = Math.ceil(H / LINE_SPACING) + 1
      const centerY = H * 0.5
      const centerX = W * 0.5

      // ── Layer 1: Horizontal signal lines with convergence ──
      for (let li = 0; li < numLines; li++) {
        const baseY = li * LINE_SPACING
        const distFromCenter = Math.abs(baseY - centerY) / (H * 0.5)
        const convergeFactor = (1 - distFromCenter) * 0.3 // lines curve toward center

        // Pick color based on line index
        const c = COLORS[li % COLORS.length]
        const lineAlpha = (0.04 + I * 0.08) * (0.5 + (1 - distFromCenter) * 0.5)

        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]}, ${lineAlpha})`
        ctx.lineWidth = 0.6 + I * 0.3

        ctx.beginPath()
        for (let x = 0; x <= W; x += 4) {
          const noiseVal = noise2D(x * 0.003 + time * 0.15, li * 3.7 + time * 0.05)
          const amplitude = (3 + I * 5) * (1 - distFromCenter * 0.5)
          const converge = (x / W - 0.5) * convergeFactor * I * 15
          const y = baseY + noiseVal * amplitude + converge * (baseY > centerY ? -1 : 1)

          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

        // Nodes along lines
        for (let x = 60; x < W - 60; x += 100) {
          const noiseVal = noise2D(x * 0.003 + time * 0.15, li * 3.7 + time * 0.05)
          const amplitude = (3 + I * 5) * (1 - distFromCenter * 0.5)
          const y = baseY + noiseVal * amplitude
          const nodeAlpha = (0.06 + I * 0.15) * (0.5 + (1 - distFromCenter) * 0.5)

          // Pulse glow
          const pulsePhase = Math.sin(time * 1.5 + x * 0.01 + li) * 0.5 + 0.5
          const glow = nodeAlpha * (0.5 + pulsePhase * 0.5)

          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]}, ${glow * 0.3})`
          ctx.beginPath()
          ctx.arc(x, y, 4 + I * 2, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]}, ${glow})`
          ctx.beginPath()
          ctx.arc(x, y, 1.2 + I * 0.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ── Layer 2: Vertical data streams (flowing down) ──
      const numStreams = Math.ceil(W / STREAM_SPACING)
      for (let si = 0; si < numStreams; si++) {
        const baseX = si * STREAM_SPACING + 40
        const c = COLORS[(si + 2) % COLORS.length]
        const streamAlpha = I * 0.06

        if (streamAlpha < 0.01) continue

        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]}, ${streamAlpha})`
        ctx.lineWidth = 0.4

        ctx.beginPath()
        for (let y = 0; y <= H; y += 3) {
          const noiseVal = noise2D(si * 5.1, y * 0.008 + time * 0.2)
          const x = baseX + noiseVal * (2 + I * 3)
          if (y === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

        // Traveling particles on streams
        const particleY = ((time * 40 + si * 47) % (H + 40)) - 20
        if (particleY > 0 && particleY < H) {
          const px = baseX + noise2D(si * 5.1, particleY * 0.008 + time * 0.2) * (2 + I * 3)
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]}, ${I * 0.35})`
          ctx.beginPath()
          ctx.arc(px, particleY, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ── Layer 3: Central convergence glow ──
      if (I > 0.3) {
        const glowAlpha = (I - 0.3) * 0.12
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(W, H) * 0.4)
        gradient.addColorStop(0, `rgba(93, 138, 130, ${glowAlpha})`)
        gradient.addColorStop(0.5, `rgba(107, 158, 122, ${glowAlpha * 0.4})`)
        gradient.addColorStop(1, 'rgba(93, 138, 130, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, W, H)
      }

      // ── Layer 4: Sweeping color wave ──
      const waveX = ((time * 60) % (W + 200)) - 100
      if (I > 0.2) {
        const waveColor = COLORS[Math.floor(time * 0.3) % COLORS.length]
        const waveAlpha = I * 0.06
        const waveGrad = ctx.createLinearGradient(waveX - 80, 0, waveX + 80, 0)
        waveGrad.addColorStop(0, `rgba(${waveColor[0]},${waveColor[1]},${waveColor[2]}, 0)`)
        waveGrad.addColorStop(0.5, `rgba(${waveColor[0]},${waveColor[1]},${waveColor[2]}, ${waveAlpha})`)
        waveGrad.addColorStop(1, `rgba(${waveColor[0]},${waveColor[1]},${waveColor[2]}, 0)`)
        ctx.fillStyle = waveGrad
        ctx.fillRect(0, 0, W, H)
      }

      raf.current = requestAnimationFrame(draw)
    }

    raf.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('resize', resize)
      obs.disconnect()
    }
  }, [])

  return (
    <footer className="footer-field" ref={containerRef}>
      <canvas ref={canvasRef} className="footer-canvas" aria-hidden="true" />
      <div className="footer-content">
        <span className="footer-brand">KINETICA AI</span>
        <span className="footer-copy">© {new Date().getFullYear()} Alfonso Navarro. All systems nominal.</span>
        <div className="footer-links">
          <a href="https://www.linkedin.com/in/navarro-kinetica-ai" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <span className="footer-sep">·</span>
          <a href="https://github.com/kinetica-IA" target="_blank" rel="noopener noreferrer">GitHub</a>
          <span className="footer-sep">·</span>
          <a href="mailto:alfon.atman@gmail.com">Contact</a>
        </div>
      </div>

      <style>{`
        .footer-field {
          position: relative;
          width: 100%;
          min-height: 320px;
          margin-top: var(--space-section);
          overflow: hidden;
        }
        .footer-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .footer-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 320px;
          padding: 60px 24px;
          gap: 16px;
          text-align: center;
        }
        .footer-brand {
          font-family: var(--sans);
          font-size: 1.1rem;
          font-weight: 300;
          letter-spacing: 0.25em;
          color: var(--text-heading);
          opacity: 0.6;
        }
        .footer-copy {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--text-dim);
          letter-spacing: 0.04em;
        }
        .footer-links {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .footer-links a {
          font-family: var(--mono);
          font-size: var(--text-caption);
          color: var(--sea);
          text-decoration: none;
          transition: color var(--duration-hover) ease;
        }
        .footer-links a:hover { color: var(--green); }
        .footer-sep {
          color: var(--text-dim);
          opacity: 0.3;
          font-size: 11px;
        }
      `}</style>
    </footer>
  )
}
