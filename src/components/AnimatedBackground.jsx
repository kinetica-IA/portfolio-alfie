import { useRef, useEffect } from 'react'

/*
 * AnimatedBackground — Dark mode, dense, cursor-reactive
 * Full-bleed 2D canvas: dot grid + Perlin waves + particles + cursor bloom
 */

function hash(x, y) {
  let h = x * 374761393 + y * 668265263
  h = (h ^ (h >> 13)) * 1274126177
  return ((h ^ (h >> 16)) & 0x7fffffff) / 0x7fffffff
}
function smoothstep(t) { return t * t * (3 - 2 * t) }
function noise2D(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = smoothstep(x - ix), fy = smoothstep(y - iy)
  const a = hash(ix, iy), b = hash(ix + 1, iy)
  const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1)
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}
function fbm(x, y, oct = 3) {
  let v = 0, a = 1, f = 1, t = 0
  for (let i = 0; i < oct; i++) { v += noise2D(x * f, y * f) * a; t += a; a *= 0.5; f *= 2 }
  return v / t
}

const PALETTE = [
  [144, 167, 165],  // accent
  [124, 184, 138],  // green
  [212, 149, 90],   // warm
  [122, 156, 165],  // slate
  [110, 180, 186],  // sea
  [224, 184, 80],   // gold
  [106, 148, 116],  // moss
]

export default function AnimatedBackground() {
  const canvasRef = useRef(null)
  const mouse = useRef({ x: -1, y: -1, active: false })
  const particles = useRef(null)
  const raf = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W, H

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // Dense particles
    const COUNT = 300
    if (!particles.current) {
      particles.current = Array.from({ length: COUNT }, () => {
        const col = PALETTE[Math.floor(Math.random() * PALETTE.length)]
        return {
          x: Math.random(), y: Math.random(),
          vx: (Math.random() - 0.5) * 0.0002,
          vy: (Math.random() - 0.5) * 0.0002,
          size: 1 + Math.random() * 2,
          col,
          alpha: 0.06 + Math.random() * 0.12,
          baseAlpha: 0.06 + Math.random() * 0.12,
          phase: Math.random() * Math.PI * 2,
        }
      })
    }
    const pts = particles.current

    function onMove(e) {
      mouse.current.x = e.clientX / W
      mouse.current.y = e.clientY / H
      mouse.current.active = true
    }
    function onLeave() { mouse.current.active = false }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)

    let t = 0
    function draw() {
      t += 0.002
      ctx.fillStyle = 'rgba(10, 15, 15, 0.15)'
      ctx.fillRect(0, 0, W, H)

      const mx = mouse.current.x, my = mouse.current.y
      const cursorActive = mouse.current.active && mx >= 0

      // ── Dot grid ──────────────────────
      const sp = 50
      for (let gx = sp / 2; gx < W; gx += sp) {
        for (let gy = sp / 2; gy < H; gy += sp) {
          let alpha = 0.06
          // Cursor activates nearby dots
          if (cursorActive) {
            const dx = gx / W - mx, dy = gy / H - my
            const d2 = dx * dx + dy * dy
            if (d2 < 0.04) alpha = 0.06 + (1 - d2 / 0.04) * 0.15
          }
          ctx.fillStyle = `rgba(144,167,165,${alpha})`
          ctx.beginPath()
          ctx.arc(gx, gy, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ── Flowing waves ─────────────────
      const waves = 7
      for (let w = 0; w < waves; w++) {
        const baseY = H * (0.12 + w * 0.12)
        const col = PALETTE[w % PALETTE.length]
        let alpha = 0.06
        ctx.beginPath()
        ctx.lineWidth = 1.2

        for (let x = 0; x <= W; x += 3) {
          const nx = x / W * 3.5
          const n = fbm(nx + t * 0.35 + w * 1.3, w * 0.4 + t * 0.12, 3)
          let y = baseY + (n - 0.5) * 70

          // Cursor distorts waves nearby
          if (cursorActive) {
            const dx = x / W - mx
            const dy = y / H - my
            const d2 = dx * dx + dy * dy
            if (d2 < 0.03) {
              y += (1 - d2 / 0.03) * 30 * Math.sin(t * 6 + w)
              alpha = 0.06 + (1 - d2 / 0.03) * 0.08
            }
          }

          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`
        ctx.stroke()
      }

      // ── Cursor bloom ──────────────────
      if (cursorActive) {
        const px = mx * W, py = my * H
        // Radial glow
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 120)
        grad.addColorStop(0, 'rgba(124,184,138,0.06)')
        grad.addColorStop(0.5, 'rgba(144,167,165,0.03)')
        grad.addColorStop(1, 'rgba(10,15,15,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(px, py, 120, 0, Math.PI * 2)
        ctx.fill()

        // Rings
        for (let r = 0; r < 4; r++) {
          const radius = 20 + r * 22 + Math.sin(t * 5 + r) * 4
          const a = 0.08 - r * 0.018
          ctx.beginPath()
          ctx.arc(px, py, radius, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(124,184,138,${Math.max(0, a)})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }

      // ── Particles ─────────────────────
      for (const p of pts) {
        p.x += p.vx + Math.sin(t * 1.5 + p.phase) * 0.00006
        p.y += p.vy + Math.cos(t + p.phase) * 0.00005

        if (p.x < -0.02) p.x = 1.02
        if (p.x > 1.02) p.x = -0.02
        if (p.y < -0.02) p.y = 1.02
        if (p.y > 1.02) p.y = -0.02

        let drawAlpha = p.baseAlpha

        // Cursor activates nearby particles — brighter + bigger
        if (cursorActive) {
          const dx = p.x - mx, dy = p.y - my
          const d2 = dx * dx + dy * dy
          if (d2 < 0.02) {
            const force = 0.0004 / (d2 + 0.001)
            p.x += dx * force * 0.5
            p.y += dy * force * 0.5
            drawAlpha = p.baseAlpha + (1 - d2 / 0.02) * 0.35
          }
        }

        const sx = p.x * W, sy = p.y * H
        ctx.beginPath()
        ctx.arc(sx, sy, p.size * (drawAlpha > p.baseAlpha + 0.1 ? 1.5 : 1), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.col[0]},${p.col[1]},${p.col[2]},${drawAlpha})`
        ctx.fill()
      }

      // ── Connections (cursor-range only) ─
      if (cursorActive) {
        ctx.lineWidth = 0.5
        const cx = mx * W, cy = my * H
        for (let i = 0; i < pts.length; i++) {
          const ax = pts[i].x * W, ay = pts[i].y * H
          const dcx = ax - cx, dcy = ay - cy
          if (dcx * dcx + dcy * dcy > 22500) continue // 150px radius
          for (let j = i + 1; j < pts.length; j++) {
            const bx = pts[j].x * W, by = pts[j].y * H
            const dbx = bx - cx, dby = by - cy
            if (dbx * dbx + dby * dby > 22500) continue
            const dx = ax - bx, dy = ay - by
            const d2 = dx * dx + dy * dy
            if (d2 < 8100) { // 90px
              const alpha = (1 - d2 / 8100) * 0.08
              ctx.beginPath()
              ctx.moveTo(ax, ay)
              ctx.lineTo(bx, by)
              ctx.strokeStyle = `rgba(144,167,165,${alpha})`
              ctx.stroke()
            }
          }
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: '#0a0f0f',
      }}
    />
  )
}
