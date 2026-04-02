import { useRef, useEffect } from 'react'

/*
 * ArchitecturalGrid — Living clinical infrastructure
 *
 * Three layers of ambient motion:
 * 1. Static grid lines + idle nodes (cached offscreen)
 * 2. Ambient node activations with color + propagation
 * 3. Cursor proximity: node glow + line segment emphasis
 *
 * Feels: infrastructural, intelligent, slow, alive.
 */

const CELL = 60
const LINE_ALPHA = 0.055
const NODE_IDLE = 0.035
const NODE_ACTIVE_MIN = 0.12
const NODE_ACTIVE_MAX = 0.22
const NODE_CURSOR = 0.24
const CURSOR_RADIUS = 160
const FADE_IN = 0.0035
const FADE_OUT = 0.0008

const PALETTE = [
  [144, 167, 165], // teal
  [107, 158, 122], // green
  [106, 134, 144], // slate
  [93, 138, 130],  // sea
  [107, 138, 109], // moss
]

export default function ArchitecturalGrid() {
  const canvasRef = useRef(null)
  const raf = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W, H, cols, rows, gridCache
    let nodeOpacity, nodeTarget, nodeColor
    const mouse = { x: -1, y: -1 }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      cols = Math.floor(W / CELL) + 1
      rows = Math.floor(H / CELL) + 1
      const n = (cols + 1) * (rows + 1)
      nodeOpacity = new Float32Array(n)
      nodeTarget = new Float32Array(n)
      nodeColor = new Uint8Array(n)

      // Cache static grid
      const off = document.createElement('canvas')
      off.width = canvas.width
      off.height = canvas.height
      const oc = off.getContext('2d')
      oc.setTransform(dpr, 0, 0, dpr, 0, 0)

      oc.strokeStyle = `rgba(144, 167, 165, ${LINE_ALPHA})`
      oc.lineWidth = 0.5
      for (let x = 0; x <= cols; x++) {
        oc.beginPath(); oc.moveTo(x * CELL, 0); oc.lineTo(x * CELL, H); oc.stroke()
      }
      for (let y = 0; y <= rows; y++) {
        oc.beginPath(); oc.moveTo(0, y * CELL); oc.lineTo(W, y * CELL); oc.stroke()
      }
      for (let y = 0; y <= rows; y++) {
        for (let x = 0; x <= cols; x++) {
          oc.fillStyle = `rgba(144, 167, 165, ${NODE_IDLE})`
          oc.fillRect(x * CELL - 1, y * CELL - 1, 2, 2)
        }
      }
      gridCache = off
    }

    resize()
    window.addEventListener('resize', resize)

    function onMove(e) { mouse.x = e.clientX; mouse.y = e.clientY }
    function onLeave() { mouse.x = -1; mouse.y = -1 }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)

    // Ambient activation with propagation
    let nextPulse = performance.now() + 2000

    function pulse() {
      if (!nodeOpacity) return
      const total = (cols + 1) * (rows + 1)
      // Seed 1-2 origin nodes
      const seeds = 1 + Math.floor(Math.random() * 2)
      for (let s = 0; s < seeds; s++) {
        const ox = Math.floor(Math.random() * (cols + 1))
        const oy = Math.floor(Math.random() * (rows + 1))
        const ci = Math.floor(Math.random() * PALETTE.length)
        const strength = NODE_ACTIVE_MIN + Math.random() * (NODE_ACTIVE_MAX - NODE_ACTIVE_MIN)

        // Activate seed + 1-ring neighbors (propagation)
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = ox + dx, ny = oy + dy
            if (nx < 0 || nx > cols || ny < 0 || ny > rows) continue
            const idx = ny * (cols + 1) + nx
            if (idx >= total) continue
            const falloff = (dx === 0 && dy === 0) ? 1 : 0.4
            nodeTarget[idx] = Math.max(nodeTarget[idx], strength * falloff)
            nodeColor[idx] = ci
          }
        }
      }
    }

    function draw() {
      if (!nodeOpacity || !gridCache) { raf.current = requestAnimationFrame(draw); return }

      const now = performance.now()
      if (now >= nextPulse) {
        pulse()
        nextPulse = now + 2000 + Math.random() * 3000
      }

      const mx = mouse.x, my = mouse.y
      const cursorOn = mx >= 0 && my >= 0
      const total = (cols + 1) * (rows + 1)

      // Update opacities
      for (let y = 0; y <= rows; y++) {
        for (let x = 0; x <= cols; x++) {
          const idx = y * (cols + 1) + x
          if (idx >= total) continue

          // Cursor proximity
          if (cursorOn) {
            const dx = x * CELL - mx, dy2 = y * CELL - my
            const d2 = dx * dx + dy2 * dy2
            const r2 = CURSOR_RADIUS * CURSOR_RADIUS
            if (d2 < r2) {
              const p = 1 - d2 / r2
              const ct = NODE_IDLE + p * p * (NODE_CURSOR - NODE_IDLE)
              if (ct > nodeTarget[idx]) nodeTarget[idx] = ct
            }
          }

          // Lerp
          if (nodeOpacity[idx] < nodeTarget[idx]) {
            nodeOpacity[idx] = Math.min(nodeOpacity[idx] + FADE_IN, nodeTarget[idx])
          } else if (nodeOpacity[idx] > NODE_IDLE) {
            nodeOpacity[idx] = Math.max(nodeOpacity[idx] - FADE_OUT, NODE_IDLE)
            if (nodeOpacity[idx] <= NODE_IDLE + 0.002) nodeTarget[idx] = 0
          }
        }
      }

      // Render
      ctx.clearRect(0, 0, W, H)
      ctx.drawImage(gridCache, 0, 0, W, H)

      // Cursor line emphasis — light up grid segments near pointer
      if (cursorOn) {
        const cx = Math.round(mx / CELL) * CELL
        const cy = Math.round(my / CELL) * CELL
        ctx.strokeStyle = `rgba(144, 167, 165, 0.08)`
        ctx.lineWidth = 0.5
        // Horizontal segment
        ctx.beginPath()
        ctx.moveTo(cx - CELL, cy); ctx.lineTo(cx + CELL, cy)
        ctx.stroke()
        // Vertical segment
        ctx.beginPath()
        ctx.moveTo(cx, cy - CELL); ctx.lineTo(cx, cy + CELL)
        ctx.stroke()
      }

      // Active nodes
      for (let y = 0; y <= rows; y++) {
        for (let x = 0; x <= cols; x++) {
          const idx = y * (cols + 1) + x
          if (idx >= total) continue
          const a = nodeOpacity[idx]
          if (a <= NODE_IDLE + 0.005) continue

          const px = x * CELL, py = y * CELL
          const c = PALETTE[nodeColor[idx] || 0]

          // Soft glow
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]}, ${a * 0.35})`
          ctx.beginPath()
          ctx.arc(px, py, 6, 0, Math.PI * 2)
          ctx.fill()

          // Core dot
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]}, ${a})`
          ctx.beginPath()
          ctx.arc(px, py, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      raf.current = requestAnimationFrame(draw)
    }
    draw()

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
