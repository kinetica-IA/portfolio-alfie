import { useRef, useEffect } from 'react'

/*
 * AnimatedBackground — Game of Life + particles + cursor seeding
 * Full palette, high density, integrated with content
 */

const PALETTE = [
  [144, 167, 165],  // accent
  [124, 184, 138],  // green
  [212, 149, 90],   // warm
  [122, 156, 165],  // slate
  [110, 180, 186],  // sea
  [224, 184, 80],   // gold
  [106, 148, 116],  // moss
  [168, 196, 194],  // accent-bright
  [200, 164, 126],  // clay
]

export default function AnimatedBackground() {
  const canvasRef = useRef(null)
  const mouse = useRef({ x: -1, y: -1, pressed: false })
  const raf = useRef(null)
  const stateRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W, H, CELL, COLS, ROWS

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      CELL = 8
      COLS = Math.ceil(W / CELL) + 2
      ROWS = Math.ceil(H / CELL) + 2
      initGrid()
    }

    function initGrid() {
      const grid = new Uint8Array(COLS * ROWS)
      const colors = new Uint8Array(COLS * ROWS)
      // Sparse initial: ~8% alive
      for (let i = 0; i < grid.length; i++) {
        if (Math.random() < 0.08) {
          grid[i] = 1
          colors[i] = Math.floor(Math.random() * PALETTE.length)
        }
      }
      stateRef.current = { grid, colors, next: new Uint8Array(COLS * ROWS), nextColors: new Uint8Array(COLS * ROWS) }
    }

    function stepLife() {
      const { grid, colors, next, nextColors } = stateRef.current
      next.fill(0)
      nextColors.fill(0)

      for (let y = 1; y < ROWS - 1; y++) {
        for (let x = 1; x < COLS - 1; x++) {
          let alive = 0
          const colorCounts = new Uint8Array(PALETTE.length)

          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue
              const idx = (y + dy) * COLS + (x + dx)
              if (grid[idx]) {
                alive++
                colorCounts[colors[idx]]++
              }
            }
          }

          const idx = y * COLS + x
          if (grid[idx]) {
            // Survive with 2-3 neighbors
            if (alive === 2 || alive === 3) {
              next[idx] = 1
              nextColors[idx] = colors[idx]
            }
          } else {
            // Birth with exactly 3 neighbors
            if (alive === 3) {
              next[idx] = 1
              // Inherit dominant neighbor color
              let maxC = 0, maxV = 0
              for (let c = 0; c < PALETTE.length; c++) {
                if (colorCounts[c] > maxV) { maxV = colorCounts[c]; maxC = c }
              }
              nextColors[idx] = maxC
            }
          }
        }
      }

      // Swap
      stateRef.current.grid = next.slice()
      stateRef.current.colors = nextColors.slice()

      // Reseed if too sparse (< 3%)
      let total = 0
      for (let i = 0; i < next.length; i++) if (next[i]) total++
      if (total < COLS * ROWS * 0.03) {
        for (let i = 0; i < 80; i++) {
          const rx = Math.floor(Math.random() * COLS)
          const ry = Math.floor(Math.random() * ROWS)
          const idx = ry * COLS + rx
          stateRef.current.grid[idx] = 1
          stateRef.current.colors[idx] = Math.floor(Math.random() * PALETTE.length)
        }
      }
    }

    // Cursor seeding
    function seedAt(px, py, radius) {
      if (!stateRef.current) return
      const cx = Math.floor(px / CELL)
      const cy = Math.floor(py / CELL)
      const r = Math.ceil(radius / CELL)
      const col = Math.floor(Math.random() * PALETTE.length)

      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r) continue
          const x = cx + dx, y = cy + dy
          if (x < 0 || x >= COLS || y < 0 || y >= ROWS) continue
          if (Math.random() < 0.5) {
            const idx = y * COLS + x
            stateRef.current.grid[idx] = 1
            stateRef.current.colors[idx] = col + Math.floor(Math.random() * 3) < PALETTE.length
              ? col + Math.floor(Math.random() * 3)
              : col
          }
        }
      }
    }

    resize()
    window.addEventListener('resize', resize)

    function onMove(e) {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
      // Continuous seeding on hover
      seedAt(e.clientX, e.clientY, 20)
    }
    function onDown(e) {
      mouse.current.pressed = true
      seedAt(e.clientX, e.clientY, 40)
    }
    function onUp() { mouse.current.pressed = false }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)

    let frame = 0
    function draw() {
      frame++
      // Step every 4 frames (~15fps for life, 60fps render)
      if (frame % 4 === 0) stepLife()

      if (!stateRef.current) { raf.current = requestAnimationFrame(draw); return }

      // Fade trail (gives glow persistence)
      ctx.fillStyle = 'rgba(10, 15, 15, 0.12)'
      ctx.fillRect(0, 0, W, H)

      const { grid, colors } = stateRef.current

      // Draw cells
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const idx = y * COLS + x
          if (!grid[idx]) continue
          const col = PALETTE[colors[idx]] || PALETTE[0]
          const px = x * CELL, py = y * CELL

          // Glow: larger, lower opacity
          ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},0.12)`
          ctx.fillRect(px - 2, py - 2, CELL + 4, CELL + 4)

          // Core cell
          ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},0.4)`
          ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2)
        }
      }

      // Cursor glow
      const mx = mouse.current.x, my = mouse.current.y
      if (mx >= 0) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, mouse.current.pressed ? 80 : 50)
        grad.addColorStop(0, 'rgba(124,184,138,0.08)')
        grad.addColorStop(1, 'rgba(10,15,15,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(mx, my, mouse.current.pressed ? 80 : 50, 0, Math.PI * 2)
        ctx.fill()
      }

      raf.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background: '#0a0f0f',
      }}
    />
  )
}
