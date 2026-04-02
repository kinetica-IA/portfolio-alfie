import { useRef, useEffect } from 'react'

/*
 * AnimatedBackground — Full-bleed 2D canvas
 * Perlin-like flowing waves + floating particles + dot grid
 * Kinetica palette: accent #90a7a5, green #6b9e7a, warm #c4855a
 */

// Simple Perlin-like noise (value noise with smoothstep)
function hash(x, y) {
  let h = x * 374761393 + y * 668265263
  h = (h ^ (h >> 13)) * 1274126177
  return ((h ^ (h >> 16)) & 0x7fffffff) / 0x7fffffff
}

function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

function noise2D(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = smoothstep(x - ix), fy = smoothstep(y - iy)
  const a = hash(ix, iy), b = hash(ix + 1, iy)
  const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1)
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}

function fbm(x, y, octaves = 3) {
  let v = 0, amp = 1, freq = 1, total = 0
  for (let i = 0; i < octaves; i++) {
    v += noise2D(x * freq, y * freq) * amp
    total += amp
    amp *= 0.5
    freq *= 2
  }
  return v / total
}

const COLORS = [
  [144, 167, 165], // accent
  [107, 158, 122], // green
  [196, 133, 90],  // warm
]

export default function AnimatedBackground() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -1, y: -1 })
  const particlesRef = useRef(null)
  const rafRef = useRef(null)

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

    // Init particles
    const PARTICLE_COUNT = 160
    if (!particlesRef.current) {
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0003,
        vy: (Math.random() - 0.5) * 0.0003,
        size: 1 + Math.random() * 1.5,
        color: COLORS[Math.floor(Math.random() * 3)],
        alpha: 0.08 + Math.random() * 0.14,
        phase: Math.random() * Math.PI * 2,
      }))
    }
    const particles = particlesRef.current

    // Mouse
    function onMouse(e) {
      mouseRef.current.x = e.clientX / W
      mouseRef.current.y = e.clientY / H
    }
    window.addEventListener('pointermove', onMouse)

    // Animation
    let t = 0
    function draw() {
      t += 0.003
      ctx.clearRect(0, 0, W, H)

      // ── Dot grid ──────────────────────────
      const spacing = 60
      ctx.fillStyle = 'rgba(144, 167, 165, 0.04)'
      for (let gx = spacing / 2; gx < W; gx += spacing) {
        for (let gy = spacing / 2; gy < H; gy += spacing) {
          ctx.beginPath()
          ctx.arc(gx, gy, 0.8, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ── Flowing waves (Perlin) ────────────
      const WAVE_COUNT = 5
      for (let w = 0; w < WAVE_COUNT; w++) {
        const baseY = H * (0.2 + w * 0.15)
        const col = COLORS[w % 3]
        ctx.beginPath()
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]}, 0.07)`
        ctx.lineWidth = 1.5

        for (let x = 0; x <= W; x += 4) {
          const nx = x / W * 3
          const n = fbm(nx + t * 0.3 + w * 1.7, w * 0.5 + t * 0.1, 3)
          const y = baseY + (n - 0.5) * 80
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      // ── Mouse ripple ──────────────────────
      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      if (mx >= 0 && my >= 0) {
        const px = mx * W, py = my * H
        for (let ring = 0; ring < 3; ring++) {
          const r = 30 + ring * 25 + Math.sin(t * 4) * 5
          const alpha = 0.04 - ring * 0.012
          ctx.beginPath()
          ctx.arc(px, py, r, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(144, 167, 165, ${Math.max(0, alpha)})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }

      // ── Particles ─────────────────────────
      for (const p of particles) {
        // Drift
        p.x += p.vx + Math.sin(t + p.phase) * 0.00008
        p.y += p.vy + Math.cos(t * 0.7 + p.phase) * 0.00006

        // Wrap
        if (p.x < -0.02) p.x = 1.02
        if (p.x > 1.02) p.x = -0.02
        if (p.y < -0.02) p.y = 1.02
        if (p.y > 1.02) p.y = -0.02

        // Mouse repulsion
        if (mx >= 0) {
          const dx = p.x - mx, dy = p.y - my
          const dist2 = dx * dx + dy * dy
          if (dist2 < 0.01) {
            const force = 0.0003 / (dist2 + 0.001)
            p.x += dx * force
            p.y += dy * force
          }
        }

        const sx = p.x * W, sy = p.y * H
        ctx.beginPath()
        ctx.arc(sx, sy, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]}, ${p.alpha})`
        ctx.fill()
      }

      // ── Connections between nearby particles ──
      ctx.lineWidth = 0.5
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = (particles[i].x - particles[j].x) * W
          const dy = (particles[i].y - particles[j].y) * H
          const dist2 = dx * dx + dy * dy
          if (dist2 < 6400) { // 80px radius
            const alpha = (1 - dist2 / 6400) * 0.03
            ctx.beginPath()
            ctx.moveTo(particles[i].x * W, particles[i].y * H)
            ctx.lineTo(particles[j].x * W, particles[j].y * H)
            ctx.strokeStyle = `rgba(144,167,165,${alpha})`
            ctx.stroke()
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMouse)
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
      }}
    />
  )
}
