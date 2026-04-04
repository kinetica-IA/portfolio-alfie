import { useRef, useEffect } from 'react'

/*
 * BreathingField — Organic flowing background
 *
 * Soft, undulating noise-based gradient blobs that drift across the canvas.
 * Feels like looking through still water or watching aurora borealis.
 * Responds gently to cursor proximity and shifts palette per section.
 */

// ── Palette ─────────────────────────────────────────────────────────
const PALETTE = {
  teal:  [144, 167, 165],
  green: [107, 158, 122],
  sea:   [93, 138, 130],
  moss:  [107, 138, 109],
  ice:   [133, 168, 184],
  slate: [106, 134, 144],
  warm:  [196, 133, 90],
  sand:  [191, 168, 122],
}

const SECTION_PALETTES = [
  [PALETTE.teal, PALETTE.sea,   PALETTE.ice],
  [PALETTE.sea,  PALETTE.moss,  PALETTE.teal],
  [PALETTE.green,PALETTE.warm,  PALETTE.sand],
  [PALETTE.ice,  PALETTE.teal,  PALETTE.slate],
  [PALETTE.slate,PALETTE.sea,   PALETTE.moss],
  [PALETTE.green,PALETTE.moss,  PALETTE.ice],
  [PALETTE.sea,  PALETTE.sand,  PALETTE.warm],
]

// ── Config ──────────────────────────────────────────────────────────
const BLOB_COUNT       = 7        // flowing shapes
const BASE_ALPHA       = 0.08     // subtle but visible
const CURSOR_BOOST     = 0.045    // gentle extra glow near cursor
const CURSOR_RADIUS    = 220      // influence zone
const DRIFT_SPEED      = 0.0002  // very slow drift
const BREATHE_SPEED    = 0.0008   // inhale/exhale rhythm
const BREATHE_AMP      = 0.35     // how much blobs expand/contract
const COLOR_LERP_SPEED = 0.008    // smooth palette transitions
const RESOLUTION_SCALE = 0.35     // render at lower res for perf + softness

// ── Simplex noise (compact 2D) ──────────────────────────────────────
function createNoise() {
  const perm = new Uint8Array(512)
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]]
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]

  const G2 = (3 - Math.sqrt(3)) / 6
  const grad = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]

  return function noise2D(x, y) {
    const s = (x + y) * 0.5 * (Math.sqrt(3) - 1)
    const i = Math.floor(x + s), j = Math.floor(y + s)
    const t = (i + j) * G2
    const X0 = i - t, Y0 = j - t
    const x0 = x - X0, y0 = y - Y0
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2
    const ii = i & 255, jj = j & 255

    let n0 = 0, n1 = 0, n2 = 0
    let t0 = 0.5 - x0*x0 - y0*y0
    if (t0 > 0) { t0 *= t0; const g = grad[perm[ii + perm[jj]] & 7]; n0 = t0*t0*(g[0]*x0+g[1]*y0) }
    let t1 = 0.5 - x1*x1 - y1*y1
    if (t1 > 0) { t1 *= t1; const g = grad[perm[ii+i1 + perm[jj+j1]] & 7]; n1 = t1*t1*(g[0]*x1+g[1]*y1) }
    let t2 = 0.5 - x2*x2 - y2*y2
    if (t2 > 0) { t2 *= t2; const g = grad[perm[ii+1 + perm[jj+1]] & 7]; n2 = t2*t2*(g[0]*x2+g[1]*y2) }
    return 70 * (n0 + n1 + n2)
  }
}

// ── Helpers ─────────────────────────────────────────────────────────
function lerpColor(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
}

export default function BreathingField() {
  const canvasRef = useRef(null)
  const raf = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const noise = createNoise()

    let W, H, rW, rH
    const mouse = { x: -1, y: -1 }
    let sectionOffsets = []
    let currentSection = 0
    let targetPalette = SECTION_PALETTES[0]
    let activePalette = SECTION_PALETTES[0].map(c => [...c])

    // Each blob has: cx, cy (center as 0-1), rx, ry (radius), phase, speed offsets
    const blobs = []
    for (let i = 0; i < BLOB_COUNT; i++) {
      blobs.push({
        cx: Math.random(),
        cy: Math.random(),
        rx: 0.18 + Math.random() * 0.22,
        ry: 0.18 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 2,
        driftY: (Math.random() - 0.5) * 2,
        noiseOffX: Math.random() * 100,
        noiseOffY: Math.random() * 100,
        colorIdx: i % 3,
      })
    }

    function resize() {
      W = window.innerWidth
      H = window.innerHeight
      rW = Math.round(W * RESOLUTION_SCALE)
      rH = Math.round(H * RESOLUTION_SCALE)
      canvas.width = rW
      canvas.height = rH
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      cacheSectionOffsets()
    }

    function cacheSectionOffsets() {
      const sections = document.querySelectorAll('.section')
      sectionOffsets = Array.from(sections).map(el => el.offsetTop)
    }

    function updateSection() {
      const scrollY = window.scrollY + H * 0.4
      let idx = 0
      for (let i = sectionOffsets.length - 1; i >= 0; i--) {
        if (scrollY >= sectionOffsets[i]) { idx = i; break }
      }
      if (idx !== currentSection) {
        currentSection = idx
        targetPalette = SECTION_PALETTES[Math.min(idx, SECTION_PALETTES.length - 1)]
      }
    }

    function onMove(e) { mouse.x = e.clientX; mouse.y = e.clientY }
    function onLeave() { mouse.x = -1; mouse.y = -1 }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', updateSection, { passive: true })
    resize()

    let lastSectionCheck = 0

    function draw(now) {
      // Lerp palette colors smoothly
      for (let i = 0; i < activePalette.length; i++) {
        for (let ch = 0; ch < 3; ch++) {
          activePalette[i][ch] += (targetPalette[i][ch] - activePalette[i][ch]) * COLOR_LERP_SPEED
        }
      }

      if (now - lastSectionCheck > 300) { updateSection(); lastSectionCheck = now }

      // Clear with background
      ctx.clearRect(0, 0, rW, rH)

      const time = now * 0.001  // seconds

      // Cursor in render-space
      const cursorOn = mouse.x >= 0
      const cmx = mouse.x * RESOLUTION_SCALE
      const cmy = mouse.y * RESOLUTION_SCALE
      const cr2 = (CURSOR_RADIUS * RESOLUTION_SCALE) ** 2

      // Draw each blob as a large radial gradient
      for (let b = 0; b < BLOB_COUNT; b++) {
        const blob = blobs[b]
        const color = activePalette[blob.colorIdx]

        // Organic drift via noise
        const nx = noise(blob.noiseOffX + time * DRIFT_SPEED * 80, blob.noiseOffY)
        const ny = noise(blob.noiseOffY + time * DRIFT_SPEED * 80, blob.noiseOffX + 50)

        // Breathing: expand/contract
        const breathe = 1 + Math.sin(time * BREATHE_SPEED * 6.28 + blob.phase) * BREATHE_AMP

        const cx = (blob.cx + nx * 0.15 + Math.sin(time * DRIFT_SPEED * 3 + blob.phase) * 0.08) * rW
        const cy = (blob.cy + ny * 0.15 + Math.cos(time * DRIFT_SPEED * 2.5 + blob.phase * 1.3) * 0.06) * rH
        const rx = blob.rx * rW * breathe
        const ry = blob.ry * rH * breathe
        const r = Math.max(rx, ry)

        // Alpha boost near cursor
        let alpha = BASE_ALPHA
        if (cursorOn) {
          const dx = cx - cmx, dy = cy - cmy
          const d2 = dx * dx + dy * dy
          const maxDist = cr2 * 4
          if (d2 < maxDist) {
            alpha += CURSOR_BOOST * (1 - d2 / maxDist)
          }
        }

        // Draw with radial gradient for soft edges
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        grad.addColorStop(0,   `rgba(${color[0]|0},${color[1]|0},${color[2]|0}, ${alpha * 1.2})`)
        grad.addColorStop(0.3, `rgba(${color[0]|0},${color[1]|0},${color[2]|0}, ${alpha * 0.8})`)
        grad.addColorStop(0.7, `rgba(${color[0]|0},${color[1]|0},${color[2]|0}, ${alpha * 0.3})`)
        grad.addColorStop(1,   `rgba(${color[0]|0},${color[1]|0},${color[2]|0}, 0)`)

        ctx.save()
        // Ellipse via scale transform
        ctx.translate(cx, cy)
        ctx.scale(1, ry / rx || 1)
        ctx.translate(-cx, -cy)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // ── Noise-driven texture layer ────────────────────────────────
      // Very subtle organic distortion overlaid for "living" feel
      const noiseScale = 0.008
      const noiseTime = time * 0.15
      const step = 6  // sample every 6 pixels for perf
      const imgData = ctx.getImageData(0, 0, rW, rH)
      const data = imgData.data

      for (let py = 0; py < rH; py += step) {
        for (let px = 0; px < rW; px += step) {
          const n = noise(px * noiseScale + noiseTime, py * noiseScale + noiseTime * 0.7)
          const v = (n + 1) * 0.5  // 0-1

          // Blend a subtle noise tint
          const mixColor = lerpColor(activePalette[0], activePalette[2], v)
          const noiseAlpha = 0.012 * v

          // Apply to step×step block
          for (let dy = 0; dy < step && py + dy < rH; dy++) {
            for (let dx = 0; dx < step && px + dx < rW; dx++) {
              const idx = ((py + dy) * rW + (px + dx)) * 4
              data[idx]     = Math.min(255, data[idx]     + mixColor[0] * noiseAlpha * 255)
              data[idx + 1] = Math.min(255, data[idx + 1] + mixColor[1] * noiseAlpha * 255)
              data[idx + 2] = Math.min(255, data[idx + 2] + mixColor[2] * noiseAlpha * 255)
              data[idx + 3] = Math.min(255, data[idx + 3] + noiseAlpha * 255)
            }
          }
        }
      }
      ctx.putImageData(imgData, 0, 0)

      // ── Cursor glow ───────────────────────────────────────────────
      if (cursorOn) {
        const grad = ctx.createRadialGradient(cmx, cmy, 0, cmx, cmy, CURSOR_RADIUS * RESOLUTION_SCALE)
        const c = activePalette[0]
        grad.addColorStop(0,   `rgba(${c[0]|0},${c[1]|0},${c[2]|0}, 0.06)`)
        grad.addColorStop(0.5, `rgba(${c[0]|0},${c[1]|0},${c[2]|0}, 0.025)`)
        grad.addColorStop(1,   `rgba(${c[0]|0},${c[1]|0},${c[2]|0}, 0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(cmx, cmy, CURSOR_RADIUS * RESOLUTION_SCALE, 0, Math.PI * 2)
        ctx.fill()
      }

      raf.current = requestAnimationFrame(draw)
    }

    raf.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', updateSection)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        imageRendering: 'auto',
      }}
    />
  )
}
