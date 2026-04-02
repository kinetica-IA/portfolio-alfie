import { useRef, useEffect } from 'react'

/*
 * AnimatedBackground — Subtle Game of Life on light #f0f9f9
 * 4px cells, ~3% density, low opacity, cursor seeds life
 */

const PALETTE = [
  [144, 167, 165],  // accent
  [107, 158, 122],  // green
  [196, 133, 90],   // warm
  [106, 134, 144],  // slate
  [94, 158, 163],   // sea
  [212, 168, 67],   // gold
  [90, 122, 100],   // moss
]

export default function AnimatedBackground() {
  const canvasRef = useRef(null)
  const mouse = useRef({ x: -1, y: -1 })
  const raf = useRef(null)
  const state = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W, H, CELL = 4, COLS, ROWS

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      COLS = Math.ceil(W / CELL) + 2
      ROWS = Math.ceil(H / CELL) + 2
      initGrid()
    }

    function initGrid() {
      const grid = new Uint8Array(COLS * ROWS)
      const colors = new Uint8Array(COLS * ROWS)
      for (let i = 0; i < grid.length; i++) {
        if (Math.random() < 0.03) {
          grid[i] = 1
          colors[i] = Math.floor(Math.random() * PALETTE.length)
        }
      }
      state.current = { grid, colors, next: new Uint8Array(COLS * ROWS), nextC: new Uint8Array(COLS * ROWS) }
    }

    function step() {
      const { grid, colors, next, nextC } = state.current
      next.fill(0); nextC.fill(0)
      for (let y = 1; y < ROWS - 1; y++) {
        for (let x = 1; x < COLS - 1; x++) {
          let n = 0
          const cc = new Uint8Array(PALETTE.length)
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (!dx && !dy) continue
              const i = (y + dy) * COLS + (x + dx)
              if (grid[i]) { n++; cc[colors[i]]++ }
            }
          }
          const i = y * COLS + x
          if (grid[i]) {
            if (n === 2 || n === 3) { next[i] = 1; nextC[i] = colors[i] }
          } else if (n === 3) {
            next[i] = 1
            let mc = 0, mv = 0
            for (let c = 0; c < PALETTE.length; c++) if (cc[c] > mv) { mv = cc[c]; mc = c }
            nextC[i] = mc
          }
        }
      }
      state.current.grid = next.slice()
      state.current.colors = nextC.slice()

      // Reseed if sparse
      let alive = 0
      for (let i = 0; i < next.length; i++) if (next[i]) alive++
      if (alive < COLS * ROWS * 0.015) {
        for (let i = 0; i < 60; i++) {
          const idx = Math.floor(Math.random() * COLS * ROWS)
          state.current.grid[idx] = 1
          state.current.colors[idx] = Math.floor(Math.random() * PALETTE.length)
        }
      }
    }

    function seedAt(px, py, r) {
      if (!state.current) return
      const cx = Math.floor(px / CELL), cy = Math.floor(py / CELL)
      const cr = Math.ceil(r / CELL)
      const col = Math.floor(Math.random() * PALETTE.length)
      for (let dy = -cr; dy <= cr; dy++) {
        for (let dx = -cr; dx <= cr; dx++) {
          if (dx * dx + dy * dy > cr * cr) continue
          const x = cx + dx, y = cy + dy
          if (x < 0 || x >= COLS || y < 0 || y >= ROWS) continue
          if (Math.random() < 0.4) {
            const i = y * COLS + x
            state.current.grid[i] = 1
            state.current.colors[i] = (col + Math.floor(Math.random() * 2)) % PALETTE.length
          }
        }
      }
    }

    resize()
    window.addEventListener('resize', resize)

    let lastSeed = 0
    function onMove(e) {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
      const now = Date.now()
      if (now - lastSeed > 60) { seedAt(e.clientX, e.clientY, 14); lastSeed = now }
    }
    window.addEventListener('pointermove', onMove)

    let frame = 0
    function draw() {
      frame++
      if (frame % 5 === 0) step()
      if (!state.current) { raf.current = requestAnimationFrame(draw); return }

      // Clear to bg
      ctx.fillStyle = '#f0f9f9'
      ctx.fillRect(0, 0, W, H)

      const { grid, colors } = state.current

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (!grid[y * COLS + x]) continue
          const col = PALETTE[colors[y * COLS + x]]
          const px = x * CELL, py = y * CELL
          ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},0.25)`
          ctx.fillRect(px, py, CELL, CELL)
        }
      }

      // Cursor glow
      const mx = mouse.current.x, my = mouse.current.y
      if (mx >= 0) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 60)
        grad.addColorStop(0, 'rgba(107,158,122,0.06)')
        grad.addColorStop(1, 'rgba(240,249,249,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(mx, my, 60, 0, Math.PI * 2)
        ctx.fill()
      }

      raf.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  )
}
