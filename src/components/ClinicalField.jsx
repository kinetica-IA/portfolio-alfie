import { useRef, useEffect } from 'react'

/*
 * ClinicalField — Game of Life on grid dots
 *
 * A cellular automaton (Conway's Game of Life) runs on the same grid dot
 * layout as before. Cells propagate top-to-bottom with slow ~800ms generations.
 * Living cells glow with section-colored palette. Cursor seeds life nearby.
 * No wavefronts, no waves — just dots breathing in cellular rhythm.
 */

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
  sand:  [191, 168, 122],
}
const ALL_COLORS = [PALETTE.teal, PALETTE.green, PALETTE.sea, PALETTE.moss, PALETTE.ice, PALETTE.slate, PALETTE.warm, PALETTE.sand]

// Section color pairs [primary, secondary]
const SECTION_COLORS = [
  [PALETTE.teal, PALETTE.sea],     // 0 Hero
  [PALETTE.sea, PALETTE.moss],     // 1 ClinicalSignal
  [PALETTE.green, PALETTE.warm],   // 2 FlagshipProof
  [PALETTE.ice, PALETTE.teal],     // 3 Founder
  [PALETTE.slate, PALETTE.sea],    // 4 Systems
  [PALETTE.green, PALETTE.moss],   // 5 Published
  [PALETTE.sea, PALETTE.sand],     // 6 Contact
]

// ── Grid constants ───────────────────────────────────────────────────
const COL_SPACING = 55
const ROW_SPACING = 55
const DOT_RADIUS = 1.5
const DOT_IDLE_ALPHA = 0.10
const ALIVE_ALPHA = 0.28
const DYING_DURATION = 2.0  // seconds to fade from alive to idle
const GEN_INTERVAL = 900    // ms between generations — slow breathing
const CURSOR_RADIUS = 160
const SEED_CHANCE = 0.04    // initial alive probability — sparse
const CURSOR_SEED_CHANCE = 0.3 // chance to seed near cursor

export default function ClinicalField() {
  const canvasRef = useRef(null)
  const raf = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W, H, dpr
    let cols, rows
    let grid = []        // 2D: grid[row][col] = { alive, age, dyingTimer, color }
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

      cols = Math.ceil(W / COL_SPACING) + 1
      rows = Math.ceil(H / ROW_SPACING) + 1

      // Initialize grid
      grid = []
      for (let r = 0; r < rows; r++) {
        const row = []
        for (let c = 0; c < cols; c++) {
          const alive = Math.random() < SEED_CHANCE
          const color = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)]
          row.push({
            alive,
            age: alive ? 0 : -1,
            dyingTimer: 0,
            color,
          })
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

    // ── Game of Life step ─────────────────────────────────────────
    function countNeighbors(r, c) {
      let count = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const nr = r + dr
          const nc = c + dc
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            if (grid[nr][nc].alive) count++
          }
        }
      }
      return count
    }

    function stepGeneration() {
      const newGrid = []
      const sectionPrimary = currentColors[0]
      const sectionSecondary = currentColors[1]

      for (let r = 0; r < rows; r++) {
        const newRow = []
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c]
          const n = countNeighbors(r, c)
          let newAlive = false

          if (cell.alive) {
            // Standard: survive with 2 or 3
            newAlive = (n === 2 || n === 3)
          } else {
            // Birth with exactly 3
            newAlive = (n === 3)
          }

          if (newAlive && !cell.alive) {
            // Newly born — use section color
            const color = Math.random() > 0.5 ? sectionPrimary : sectionSecondary
            newRow.push({ alive: true, age: 0, dyingTimer: 0, color })
          } else if (newAlive && cell.alive) {
            // Survived
            newRow.push({ alive: true, age: cell.age + 1, dyingTimer: 0, color: cell.color })
          } else if (!newAlive && cell.alive) {
            // Just died — start dying fade
            newRow.push({ alive: false, age: -1, dyingTimer: DYING_DURATION, color: cell.color })
          } else {
            // Still dead
            newRow.push({
              alive: false,
              age: -1,
              dyingTimer: Math.max(0, cell.dyingTimer),
              color: cell.color,
            })
          }
        }
        newGrid.push(newRow)
      }
      grid = newGrid
    }

    // ── Seed cells near cursor ────────────────────────────────────
    function seedNearCursor() {
      if (mouse.x < 0 || mouse.y < 0) return
      const cr = Math.round(mouse.y / ROW_SPACING)
      const cc = Math.round(mouse.x / COL_SPACING)
      const range = 2
      for (let dr = -range; dr <= range; dr++) {
        for (let dc = -range; dc <= range; dc++) {
          const r = cr + dr
          const c = cc + dc
          if (r >= 0 && r < rows && c >= 0 && c < cols) {
            if (!grid[r][c].alive && Math.random() < CURSOR_SEED_CHANCE) {
              grid[r][c] = {
                alive: true,
                age: 0,
                dyingTimer: 0,
                color: currentColors[0],
              }
            }
          }
        }
      }
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
    lastGenTime = prevTime

    function draw(now) {
      const dt = (now - prevTime) / 1000
      prevTime = now

      // Throttled section check
      if (now - lastSectionCheck > 200) {
        updateSection()
        lastSectionCheck = now
      }

      // Game of Life generation step
      if (now - lastGenTime >= GEN_INTERVAL) {
        seedNearCursor()
        stepGeneration()
        lastGenTime = now
      }

      // Update dying timers
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c].dyingTimer > 0) {
            grid[r][c].dyingTimer = Math.max(0, grid[r][c].dyingTimer - dt)
          }
        }
      }

      // ── Render ──────────────────────────────────────────────
      ctx.clearRect(0, 0, W, H)

      const mx = mouse.x, my = mouse.y
      const cursorOn = mx >= 0 && my >= 0
      const cr2 = CURSOR_RADIUS * CURSOR_RADIUS

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * COL_SPACING
          const y = r * ROW_SPACING
          const cell = grid[r][c]
          const clr = cell.color

          let alpha = DOT_IDLE_ALPHA
          let radius = DOT_RADIUS

          if (cell.alive) {
            // Alive: brighter, slightly larger
            alpha = ALIVE_ALPHA
            radius = DOT_RADIUS + 0.8
          } else if (cell.dyingTimer > 0) {
            // Dying: fade from alive alpha to idle
            const t = cell.dyingTimer / DYING_DURATION
            alpha = DOT_IDLE_ALPHA + (ALIVE_ALPHA - DOT_IDLE_ALPHA) * t
            radius = DOT_RADIUS + 0.8 * t
          }

          // Cursor proximity boost
          if (cursorOn) {
            const dx = x - mx, dy = y - my
            const d2 = dx * dx + dy * dy
            if (d2 < cr2) {
              const p = 1 - d2 / cr2
              alpha = Math.min(0.45, alpha + p * 0.2)
              radius = Math.max(radius, DOT_RADIUS + 1.2 * p)
            }
          }

          // Draw glow for alive cells
          if (cell.alive || cell.dyingTimer > 0.5) {
            const glowAlpha = (cell.alive ? ALIVE_ALPHA : cell.dyingTimer / DYING_DURATION * ALIVE_ALPHA) * 0.3
            ctx.fillStyle = `rgba(${clr[0]},${clr[1]},${clr[2]}, ${glowAlpha})`
            ctx.beginPath()
            ctx.arc(x, y, radius + 3, 0, Math.PI * 2)
            ctx.fill()
          }

          // Draw dot
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
