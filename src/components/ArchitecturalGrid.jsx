import { useRef, useEffect } from 'react'

/*
 * ArchitecturalGrid — Subtle living infrastructure grid
 * Thin lines, intersection nodes with slow ambient activation.
 * Cursor proximity causes nearby nodes to glow.
 * Extremely low contrast. Atmospheric, not decorative.
 */

const CELL = 60
const LINE_ALPHA = 0.06
const NODE_IDLE = 0.04
const NODE_ACTIVE = 0.16
const NODE_CURSOR = 0.20
const CURSOR_RADIUS = 140
const ACTIVATION_INTERVAL = [2500, 4500]
const FADE_IN = 0.003
const FADE_OUT = 0.001

export default function ArchitecturalGrid() {
  const canvasRef = useRef(null)
  const raf = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W, H, cols, rows, nodes, gridCache
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
      nodes = new Float32Array(cols * rows)
      const targets = new Float32Array(cols * rows)
      const nodeColors = new Uint8Array(cols * rows) // 0=teal, 1=green, 2=slate, 3=sea
      nodes._targets = targets
      nodes._colors = nodeColors

      // Cache static grid to offscreen canvas
      const off = document.createElement('canvas')
      off.width = canvas.width
      off.height = canvas.height
      const oc = off.getContext('2d')
      oc.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Draw grid lines
      oc.strokeStyle = `rgba(144, 167, 165, ${LINE_ALPHA})`
      oc.lineWidth = 1
      for (let x = 0; x <= cols; x++) {
        oc.beginPath()
        oc.moveTo(x * CELL, 0)
        oc.lineTo(x * CELL, H)
        oc.stroke()
      }
      for (let y = 0; y <= rows; y++) {
        oc.beginPath()
        oc.moveTo(0, y * CELL)
        oc.lineTo(W, y * CELL)
        oc.stroke()
      }

      // Draw idle nodes
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

    function onMove(e) {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    function onLeave() { mouse.x = -1; mouse.y = -1 }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)

    // Ambient activation timer
    let nextActivation = performance.now() + randomInterval()
    function randomInterval() {
      return ACTIVATION_INTERVAL[0] + Math.random() * (ACTIVATION_INTERVAL[1] - ACTIVATION_INTERVAL[0])
    }

    const NODE_PALETTE = [
      [144, 167, 165], // teal
      [107, 158, 122], // green
      [106, 134, 144], // slate
      [93, 138, 130],  // sea
    ]

    function activateRandom() {
      if (!nodes) return
      const count = 2 + Math.floor(Math.random() * 3)
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * cols * rows)
        nodes._targets[idx] = NODE_ACTIVE
        nodes._colors[idx] = Math.floor(Math.random() * NODE_PALETTE.length)
      }
    }

    function draw() {
      if (!nodes || !gridCache) { raf.current = requestAnimationFrame(draw); return }

      const now = performance.now()
      if (now >= nextActivation) {
        activateRandom()
        nextActivation = now + randomInterval()
      }

      // Update cursor proximity targets
      const targets = nodes._targets
      const mx = mouse.x, my = mouse.y
      const cursorActive = mx >= 0 && my >= 0

      for (let y = 0; y <= rows; y++) {
        for (let x = 0; x <= cols; x++) {
          const idx = y * (cols + 1) + x
          if (idx >= targets.length) continue

          // Cursor proximity
          if (cursorActive) {
            const dx = x * CELL - mx
            const dy = y * CELL - my
            const dist2 = dx * dx + dy * dy
            const r2 = CURSOR_RADIUS * CURSOR_RADIUS
            if (dist2 < r2) {
              const proximity = 1 - dist2 / r2
              const cursorTarget = NODE_IDLE + proximity * (NODE_CURSOR - NODE_IDLE)
              if (cursorTarget > targets[idx]) targets[idx] = cursorTarget
            }
          }

          // Lerp current toward target
          if (nodes[idx] < targets[idx]) {
            nodes[idx] = Math.min(nodes[idx] + FADE_IN, targets[idx])
          } else if (nodes[idx] > NODE_IDLE) {
            nodes[idx] = Math.max(nodes[idx] - FADE_OUT, NODE_IDLE)
            if (nodes[idx] <= NODE_IDLE + 0.001) targets[idx] = 0
          }
        }
      }

      // Render
      ctx.clearRect(0, 0, W, H)
      ctx.drawImage(gridCache, 0, 0, W, H)

      // Draw only active nodes (opacity > idle threshold)
      for (let y = 0; y <= rows; y++) {
        for (let x = 0; x <= cols; x++) {
          const idx = y * (cols + 1) + x
          if (idx >= nodes.length) continue
          if (nodes[idx] <= NODE_IDLE + 0.003) continue

          const alpha = nodes[idx]
          const px = x * CELL
          const py = y * CELL
          const c = NODE_PALETTE[nodes._colors[idx] || 0]

          // Glow halo
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]}, ${alpha * 0.4})`
          ctx.beginPath()
          ctx.arc(px, py, 5, 0, Math.PI * 2)
          ctx.fill()

          // Core
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]}, ${alpha})`
          ctx.fillRect(px - 1.5, py - 1.5, 3, 3)
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
