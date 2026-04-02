import { useRef, useEffect } from 'react'

/*
 * ClinicalField — Living signal visualization
 *
 * Four layers:
 * 1. Base field lines — horizontal flowing lines with simplex noise, cached offscreen
 * 2. Ambient signal pulses — traveling wavefronts along lines
 * 3. Cursor interaction — proximity brightening, magnetic pull, section-colored glow
 * 4. Scroll-responsive colors — background shifts hue per section
 */

// ── Minimal 2D Simplex Noise ──────────────────────────────────────────
const F2 = 0.5 * (Math.sqrt(3) - 1)
const G2 = (3 - Math.sqrt(3)) / 6
const GRAD = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]
const PERM = new Uint8Array(512)
;(function initPerm() {
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  for (let i = 255; i > 0; i--) {
    const j = (i * 16807 + 11) % 256 // deterministic shuffle
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
  let t0 = 0.5 - x0 * x0 - y0 * y0
  if (t0 > 0) { t0 *= t0; const g = GRAD[PERM[ii + PERM[jj]] & 7]; n0 = t0 * t0 * (g[0] * x0 + g[1] * y0) }
  let t1 = 0.5 - x1 * x1 - y1 * y1
  if (t1 > 0) { t1 *= t1; const g = GRAD[PERM[ii + i1 + PERM[jj + j1]] & 7]; n1 = t1 * t1 * (g[0] * x1 + g[1] * y1) }
  let t2 = 0.5 - x2 * x2 - y2 * y2
  if (t2 > 0) { t2 *= t2; const g = GRAD[PERM[ii + 1 + PERM[jj + 1]] & 7]; n2 = t2 * t2 * (g[0] * x2 + g[1] * y2) }
  return 70 * (n0 + n1 + n2)
}

// ── Palette (RGB arrays) ──────────────────────────────────────────────
const PALETTE = {
  teal:  [144, 167, 165],
  green: [107, 158, 122],
  slate: [106, 134, 144],
  sea:   [93, 138, 130],
  moss:  [107, 138, 109],
  ice:   [133, 168, 184],
  warm:  [196, 133, 90],
  clay:  [168, 121, 110],
}
const PULSE_COLORS = [PALETTE.teal, PALETTE.green, PALETTE.sea, PALETTE.moss, PALETTE.ice]

// Section color pairs [primary, secondary]
const SECTION_COLORS = [
  [PALETTE.teal, PALETTE.sea],     // 0 Hero
  [PALETTE.sea, PALETTE.green],    // 1 ClinicalSignal
  [PALETTE.green, PALETTE.warm],   // 2 FlagshipProof
  [PALETTE.teal, PALETTE.ice],     // 3 Founder
  [PALETTE.warm, PALETTE.sea],     // 4 Systems
  [PALETTE.green, PALETTE.teal],   // 5 Published
  [PALETTE.sea, PALETTE.moss],     // 6 Contact
]

// ── Constants ─────────────────────────────────────────────────────────
const LINE_SPACING = 55
const LINE_ALPHA = 0.06
const NODE_SPACING = 120
const NODE_IDLE_ALPHA = 0.08
const CURSOR_RADIUS = 180
const WAVEFRONT_WIDTH_MIN = 80
const WAVEFRONT_WIDTH_MAX = 120
const WAVEFRONT_SPEED = 100 // px/s
const MAX_WAVEFRONTS = 3

export default function ClinicalField() {
  const canvasRef = useRef(null)
  const raf = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W, H, dpr
    let lines = []       // Array of { points: [{x,y}], nodes: [{x,y}] }
    let gridCache = null
    const mouse = { x: -1, y: -1 }
    let sectionOffsets = []
    let currentSection = 0
    let currentColors = SECTION_COLORS[0]
    let wavefronts = []
    let nextWaveTime = 2000

    // ── Resize & build geometry ───────────────────────────────────
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Build line geometry
      const numLines = Math.ceil(H / LINE_SPACING) + 2
      lines = []
      for (let li = 0; li < numLines; li++) {
        const baseY = li * LINE_SPACING
        const points = []
        const nodes = []
        for (let x = 0; x <= W; x += 5) {
          const yOff = noise2D(x * 0.005, li * 7.3) * 3
          points.push({ x, y: baseY + yOff })
        }
        // Nodes every ~NODE_SPACING px along line
        for (let x = 60; x <= W - 60; x += NODE_SPACING) {
          const yOff = noise2D(x * 0.005, li * 7.3) * 3
          nodes.push({ x, y: baseY + yOff, alpha: NODE_IDLE_ALPHA, targetAlpha: 0, fadeTime: 0 })
        }
        lines.push({ baseY, points, nodes })
      }

      // Cache static layer to offscreen canvas
      const off = document.createElement('canvas')
      off.width = canvas.width
      off.height = canvas.height
      const oc = off.getContext('2d')
      oc.setTransform(dpr, 0, 0, dpr, 0, 0)

      oc.strokeStyle = `rgba(144, 167, 165, ${LINE_ALPHA})`
      oc.lineWidth = 0.5
      for (const line of lines) {
        oc.beginPath()
        oc.moveTo(line.points[0].x, line.points[0].y)
        for (let i = 1; i < line.points.length; i++) {
          oc.lineTo(line.points[i].x, line.points[i].y)
        }
        oc.stroke()
      }
      // Draw idle nodes
      oc.fillStyle = `rgba(144, 167, 165, ${NODE_IDLE_ALPHA})`
      for (const line of lines) {
        for (const n of line.nodes) {
          oc.beginPath()
          oc.arc(n.x, n.y, 1, 0, Math.PI * 2)
          oc.fill()
        }
      }
      gridCache = off

      cacheSectionOffsets()
    }

    // ── Section offset caching ────────────────────────────────────
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
        currentColors = SECTION_COLORS[Math.min(idx, SECTION_COLORS.length - 1)]
      }
    }

    // ── Wavefronts ────────────────────────────────────────────────
    function spawnWavefront() {
      if (wavefronts.length >= MAX_WAVEFRONTS) return
      const li = Math.floor(Math.random() * lines.length)
      const dir = Math.random() > 0.5 ? 1 : -1
      const colorArr = [currentColors[0], currentColors[1], ...PULSE_COLORS]
      const color = colorArr[Math.floor(Math.random() * colorArr.length)]
      wavefronts.push({
        lineIdx: li,
        x: dir > 0 ? -WAVEFRONT_WIDTH_MAX : W + WAVEFRONT_WIDTH_MAX,
        dir,
        speed: WAVEFRONT_SPEED + Math.random() * 40,
        width: WAVEFRONT_WIDTH_MIN + Math.random() * (WAVEFRONT_WIDTH_MAX - WAVEFRONT_WIDTH_MIN),
        color,
      })
    }

    // ── Mouse tracking ────────────────────────────────────────────
    function onMove(e) { mouse.x = e.clientX; mouse.y = e.clientY }
    function onLeave() { mouse.x = -1; mouse.y = -1 }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)

    resize()
    window.addEventListener('resize', resize)

    let lastSectionCheck = 0

    // ── Main render loop ──────────────────────────────────────────
    let prevTime = performance.now()

    function draw(now) {
      const dt = (now - prevTime) / 1000
      prevTime = now

      if (!gridCache) { raf.current = requestAnimationFrame(draw); return }

      // Throttled section check
      if (now - lastSectionCheck > 100) {
        updateSection()
        lastSectionCheck = now
      }

      // Spawn wavefronts
      nextWaveTime -= dt * 1000
      if (nextWaveTime <= 0) {
        spawnWavefront()
        nextWaveTime = 3000 + Math.random() * 2000
      }

      // Update wavefront positions
      for (const wf of wavefronts) {
        wf.x += wf.dir * wf.speed * dt
      }
      // Remove offscreen wavefronts
      wavefronts = wavefronts.filter(wf =>
        wf.dir > 0 ? wf.x - wf.width < W : wf.x + wf.width > 0
      )

      // ── Render ──────────────────────────────────────────────
      ctx.clearRect(0, 0, W, H)
      ctx.drawImage(gridCache, 0, 0, W, H)

      const mx = mouse.x, my = mouse.y
      const cursorOn = mx >= 0 && my >= 0
      const r2 = CURSOR_RADIUS * CURSOR_RADIUS
      let closestNode = null, closestDist = Infinity

      // Draw wavefronts & update nodes
      for (let li = 0; li < lines.length; li++) {
        const line = lines[li]

        // Check if this line has an active wavefront
        for (const wf of wavefronts) {
          if (wf.lineIdx !== li) continue
          const wfStart = wf.x - wf.width / 2
          const wfEnd = wf.x + wf.width / 2
          const c = wf.color

          // Draw bright wavefront segment
          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]}, 0.15)`
          ctx.lineWidth = 1
          ctx.beginPath()
          let started = false
          for (const pt of line.points) {
            if (pt.x >= wfStart && pt.x <= wfEnd) {
              if (!started) { ctx.moveTo(pt.x, pt.y); started = true }
              else ctx.lineTo(pt.x, pt.y)
            }
          }
          ctx.stroke()

          // Brighten nodes near wavefront
          for (const node of line.nodes) {
            if (node.x >= wfStart - 20 && node.x <= wfEnd + 20) {
              node.targetAlpha = 0.30
              node.fadeTime = 1.5
              node._color = c
            }
          }
        }

        // Update node fade
        for (const node of line.nodes) {
          if (node.fadeTime > 0) {
            node.fadeTime -= dt
            if (node.fadeTime <= 0) {
              node.targetAlpha = 0
            }
          }
          // Lerp alpha
          if (node.targetAlpha > 0 && node.alpha < node.targetAlpha) {
            node.alpha = Math.min(node.alpha + dt * 0.8, node.targetAlpha)
          } else if (node.alpha > NODE_IDLE_ALPHA) {
            node.alpha = Math.max(node.alpha - dt * 0.15, NODE_IDLE_ALPHA)
          }
        }

        // Cursor interaction
        if (cursorOn) {
          const yDist = Math.abs(line.baseY - my)
          if (yDist < CURSOR_RADIUS + 10) {
            // Brighten line segments near cursor
            ctx.strokeStyle = `rgba(144, 167, 165, 0.12)`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            let drawing = false
            for (const pt of line.points) {
              const dx = pt.x - mx, dy = pt.y - my
              const d2 = dx * dx + dy * dy
              if (d2 < r2) {
                if (!drawing) { ctx.moveTo(pt.x, pt.y); drawing = true }
                else ctx.lineTo(pt.x, pt.y)
              } else if (drawing) {
                drawing = false
              }
            }
            ctx.stroke()

            // Brighten & attract nodes
            for (const node of line.nodes) {
              const dx = node.x - mx, dy = node.y - my
              const d2 = dx * dx + dy * dy
              if (d2 < r2) {
                const p = 1 - d2 / r2
                const cursorAlpha = NODE_IDLE_ALPHA + p * p * (0.20 - NODE_IDLE_ALPHA)
                if (cursorAlpha > node.alpha) node.alpha = cursorAlpha

                if (d2 < closestDist) {
                  closestDist = d2
                  closestNode = node
                }
              }
            }
          }
        }
      }

      // Draw active nodes (above idle threshold)
      for (const line of lines) {
        for (const node of line.nodes) {
          if (node.alpha <= NODE_IDLE_ALPHA + 0.005) continue
          const c = node._color || PALETTE.teal
          // Soft glow
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]}, ${node.alpha * 0.35})`
          ctx.beginPath()
          ctx.arc(node.x, node.y, 5, 0, Math.PI * 2)
          ctx.fill()
          // Core
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]}, ${node.alpha})`
          ctx.beginPath()
          ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Closest node to cursor gets section-colored glow
      if (closestNode && cursorOn) {
        const c = currentColors[0]
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]}, 0.25)`
        ctx.beginPath()
        ctx.arc(closestNode.x, closestNode.y, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]}, 0.5)`
        ctx.beginPath()
        ctx.arc(closestNode.x, closestNode.y, 2.5, 0, Math.PI * 2)
        ctx.fill()
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
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  )
}
