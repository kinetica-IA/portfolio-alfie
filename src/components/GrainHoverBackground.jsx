import { useEffect, useRef } from 'react'

// Kinetica teal palette for grain particles
const TEAL_TONES = [
  [140, 188, 183],
  [147, 191, 186],
  [93, 138, 130],
  [106, 134, 144],
  [145, 186, 172],
]

// Calibrated parameters
const OPACITY     = 0.27
const DENSITY     = 0.80
const REFRESH_MS  = 3500
const CLEAR_R     = 130
const SOFTNESS    = 0.20
const LERP        = 0.12
const SIZE        = 1

export default function GrainHoverBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: true })

    let W = 0, H = 0, dpr = 1
    let mx = -9999, my = -9999, tx = -9999, ty = -9999
    let grainCanvas, grainCtx
    let raf, grainTimer

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = Math.round(window.innerWidth * dpr)
      H = Math.round(window.innerHeight * dpr)
      canvas.width = W
      canvas.height = H
      grainCanvas = document.createElement('canvas')
      grainCanvas.width = W
      grainCanvas.height = H
      grainCtx = grainCanvas.getContext('2d')
      generateGrain()
    }

    function generateGrain() {
      grainCtx.clearRect(0, 0, W, H)
      const s = Math.max(1, Math.round(SIZE * dpr))
      const cols = Math.ceil(W / s)
      const rows = Math.ceil(H / s)
      const total = cols * rows
      for (let i = 0; i < total; i++) {
        if (Math.random() > DENSITY) continue
        const tone = TEAL_TONES[(Math.random() * TEAL_TONES.length) | 0]
        const a = OPACITY * (0.3 + Math.random() * 0.7)
        const col = i % cols
        const row = (i / cols) | 0
        grainCtx.fillStyle = `rgba(${tone[0]},${tone[1]},${tone[2]},${a.toFixed(3)})`
        grainCtx.fillRect(col * s, row * s, s, s)
      }
    }

    function startRefresh() {
      clearInterval(grainTimer)
      grainTimer = setInterval(generateGrain, REFRESH_MS)
    }

    function draw() {
      raf = requestAnimationFrame(draw)
      mx += (tx - mx) * LERP
      my += (ty - my) * LERP
      ctx.clearRect(0, 0, W, H)
      ctx.drawImage(grainCanvas, 0, 0)

      if (mx > -5000) {
        const px = mx * dpr
        const py = my * dpr
        const r = CLEAR_R * dpr
        ctx.globalCompositeOperation = 'destination-out'
        const grad = ctx.createRadialGradient(px, py, 0, px, py, r)
        grad.addColorStop(0, 'rgba(0,0,0,1)')
        grad.addColorStop(SOFTNESS, 'rgba(0,0,0,0.6)')
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(px, py, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'
      }
    }

    const onMove = (e) => { tx = e.clientX; ty = e.clientY }
    const onLeave = () => { tx = -9999; ty = -9999 }
    const onTouch = (e) => { const t = e.touches[0]; tx = t.clientX; ty = t.clientY }
    const onTouchEnd = () => { tx = -9999; ty = -9999 }

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    let paused = mq.matches
    const onMq = (e) => {
      paused = e.matches
      if (paused) { cancelAnimationFrame(raf); clearInterval(grainTimer) }
      else { draw(); startRefresh() }
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    mq.addEventListener('change', onMq)

    resize()
    if (!paused) { draw(); startRefresh() }

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(grainTimer)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchend', onTouchEnd)
      mq.removeEventListener('change', onMq)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
