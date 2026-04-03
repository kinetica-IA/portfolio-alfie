import { useRef, useEffect } from 'react'

/*
 * ClinicalField — Game of Life on micro-grid dots
 *
 * Dense, tiny, translucent dot grid with Conway's Game of Life.
 * Designed to be felt, not seen — a subtle living texture behind content.
 */

const PALETTE = {
  teal:  [144, 167, 165],
  green: [107, 158, 122],
  slate: [106, 134, 144],
  sea:   [93, 138, 130],
  moss:  [107, 138, 109],
  ice:   [133, 168, 184],
  warm:  [196, 133, 90],
  sand:  [191, 168, 122],
}
const ALL_COLORS = [PALETTE.teal, PALETTE.green, PALETTE.sea, PALETTE.moss, PALETTE.ice, PALETTE.slate]

const SECTION_COLORS = [
  [PALETTE.teal, PALETTE.sea],
  [PALETTE.sea, PALETTE.moss],
  [PALETTE.green, PALETTE.warm],
  [PALETTE.ice, PALETTE.teal],
  [PALETTE.slate, PALETTE.sea],
  [PALETTE.green, PALETTE.moss],
  [PALETTE.sea, PALETTE.sand],
]

// ── Tiny, dense, translucent grid ────────────────────────────────────
const CELL_SIZE = 18           // px between dots — tight grid
const DOT_RADIUS = 0.6        // tiny dots
const DOT_IDLE_ALPHA = 0.045  // barely visible idle
const ALIVE_ALPHA = 0.22      // alive — more visible
const ALIVE_RADIUS = 1.5      // alive cells grow bigger
const GLOW_RADIUS = 9         // diffuse glow around alive
const DYING_DURATION = 1.0    // slower fade-out for longer trails
const GEN_INTERVAL = 900     // ~0.9s between generations — breathing pace
const CURSOR_RADIUS = 120
const SEED_CHANCE = 0.09      // sparse initial seeding
const CURSOR_SEED_CHANCE = 0.15

export default function ClinicalField() {
  const canvasRef = useRef(null)
  const raf = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W, H, dpr
    let cols, rows
    let grid = []
    const mouse = { x: -1, y: -1 }
    let sectionOffsets = []
    let currentSection = 0
    let currentColors = SECTION_COLORS[0]
    let lastGenTime = 0

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      cols = Math.ceil(W / CELL_SIZE) + 1
      rows = Math.ceil(H / CELL_SIZE) + 1

      grid = []
      for (let r = 0; r < rows; r++) {
        const row = []
        for (let c = 0; c < cols; c++) {
          const alive = Math.random() < SEED_CHANCE
          const color = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)]
          row.push({ alive, dyingTimer: 0, color })
        }
        grid.push(row)
      }
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
        currentColors = SECTION_COLORS[Math.min(idx, SECTION_COLORS.length - 1)]
      }
    }

    function countNeighbors(r, c) {
      let count = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const nr = r + dr, nc = c + dc
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].alive) count++
        }
      }
      return count
    }

    function stepGeneration() {
      const newGrid = []
      const c1 = currentColors[0], c2 = currentColors[1]
      for (let r = 0; r < rows; r++) {
        const newRow = []
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c]
          const n = countNeighbors(r, c)
          const wasAlive = cell.alive
          const nowAlive = wasAlive ? (n === 2 || n === 3) : (n === 3)

          if (nowAlive && !wasAlive) {
            // New births get varied colors from full palette
            const birthColor = Math.random() < 0.6
              ? (Math.random() > 0.5 ? c1 : c2)
              : ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)]
            newRow.push({ alive: true, dyingTimer: 0, color: birthColor })
          } else if (nowAlive) {
            newRow.push({ alive: true, dyingTimer: 0, color: cell.color })
          } else if (!nowAlive && wasAlive) {
            newRow.push({ alive: false, dyingTimer: DYING_DURATION, color: cell.color })
          } else {
            newRow.push({ alive: false, dyingTimer: Math.max(0, cell.dyingTimer), color: cell.color })
          }
        }
        newGrid.push(newRow)
      }
      grid = newGrid
    }

    function seedNearCursor() {
      if (mouse.x < 0) return
      const cr = Math.round(mouse.y / CELL_SIZE)
      const cc = Math.round(mouse.x / CELL_SIZE)
      for (let dr = -3; dr <= 3; dr++) {
        for (let dc = -3; dc <= 3; dc++) {
          const r = cr + dr, c = cc + dc
          if (r >= 0 && r < rows && c >= 0 && c < cols && !grid[r][c].alive && Math.random() < CURSOR_SEED_CHANCE) {
            grid[r][c] = { alive: true, dyingTimer: 0, color: currentColors[0] }
          }
        }
      }
    }

    function onMove(e) { mouse.x = e.clientX; mouse.y = e.clientY }
    function onLeave() { mouse.x = -1; mouse.y = -1 }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    resize()
    window.addEventListener('resize', resize)

    let lastSectionCheck = 0
    let prevTime = performance.now()
    lastGenTime = prevTime

    function draw(now) {
      const dt = (now - prevTime) / 1000
      prevTime = now

      if (now - lastSectionCheck > 200) { updateSection(); lastSectionCheck = now }

      if (now - lastGenTime >= GEN_INTERVAL) {
        seedNearCursor()
        stepGeneration()
        lastGenTime = now
      }

      // Update dying timers
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c].dyingTimer > 0) grid[r][c].dyingTimer = Math.max(0, grid[r][c].dyingTimer - dt)
        }
      }

      ctx.clearRect(0, 0, W, H)

      const mx = mouse.x, my = mouse.y
      const cursorOn = mx >= 0
      const cr2 = CURSOR_RADIUS * CURSOR_RADIUS

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * CELL_SIZE
          const y = r * CELL_SIZE
          const cell = grid[r][c]
          const clr = cell.color

          let alpha = DOT_IDLE_ALPHA
          let radius = DOT_RADIUS
          let glowSize = 0

          if (cell.alive) {
            alpha = ALIVE_ALPHA
            radius = ALIVE_RADIUS
            glowSize = GLOW_RADIUS
          } else if (cell.dyingTimer > 0) {
            const t = cell.dyingTimer / DYING_DURATION
            alpha = DOT_IDLE_ALPHA + (ALIVE_ALPHA - DOT_IDLE_ALPHA) * t
            radius = DOT_RADIUS + (ALIVE_RADIUS - DOT_RADIUS) * t
            glowSize = GLOW_RADIUS * t
          }

          // Cursor: gentle proximity glow
          if (cursorOn) {
            const dx = x - mx, dy = y - my
            const d2 = dx * dx + dy * dy
            if (d2 < cr2) {
              const p = 1 - d2 / cr2
              alpha = Math.min(0.28, alpha + p * 0.12)
              radius = Math.max(radius, DOT_RADIUS + 0.8 * p)
            }
          }

          // Diffuse outer glow for alive/dying cells
          if (glowSize > 1) {
            ctx.fillStyle = `rgba(${clr[0]},${clr[1]},${clr[2]}, ${alpha * 0.12})`
            ctx.beginPath()
            ctx.arc(x, y, glowSize, 0, Math.PI * 2)
            ctx.fill()
          }

          // Inner glow ring
          if (glowSize > 0.5) {
            ctx.fillStyle = `rgba(${clr[0]},${clr[1]},${clr[2]}, ${alpha * 0.25})`
            ctx.beginPath()
            ctx.arc(x, y, radius + 1.5, 0, Math.PI * 2)
            ctx.fill()
          }

          // Core dot
          ctx.fillStyle = `rgba(${clr[0]},${clr[1]},${clr[2]}, ${alpha})`
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fill()
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
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  )
}
