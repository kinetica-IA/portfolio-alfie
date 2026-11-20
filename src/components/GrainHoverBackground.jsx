import { useEffect, useRef } from 'react'
import { generateGrainTile } from './evidence/grain-tile.mjs'

// Calibrated parameters (same look as the previous full-viewport version:
// tones, opacity, density and 1 CSS px cells live in ./evidence/grain-tile.mjs;
// clear radius, softness and easing are unchanged).
const REFRESH_MS = 3500 // new noise at most this often, and only while the pointer moves
const CLEAR_R    = 130
const SOFTNESS   = 0.20
const LERP       = 0.12
const TILE_CSS   = 256  // grain tile side in CSS px, repeated as a pattern
const SETTLE_PX  = 0.3  // the frame loop stops when the eased hole is this close

// Performance model:
// - The grain is a 256 px tile generated once (pure function, seeded) and
//   repeated with createPattern, instead of one fillRect per viewport cell.
// - No interval and no idle requestAnimationFrame loop. Frames run only while the
//   eased hole catches up with a pointer/touch move, and each frame repaints only
//   the rectangle around the old and new hole.
// - prefers-reduced-motion: one static grain frame, no hover hole.
// - All listeners and pending frames are removed on unmount.

export default function GrainHoverBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas && canvas.getContext('2d', { alpha: true })
    if (!ctx) return undefined

    let W = 0, H = 0, dpr = 1, cell = 0
    let pattern = null
    let seed = 1
    let lastSeedAt = 0
    let raf = 0, resizeRaf = 0
    // Hole position in CSS px; `target` = pointer present; `has` = hole drawn.
    let mx = 0, my = 0, tx = 0, ty = 0
    let target = false, has = false
    let prevRect = null

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduced = mq.matches

    function buildPattern() {
      const tile = generateGrainTile({ tileCss: TILE_CSS, cell, seed })
      const tc = document.createElement('canvas')
      tc.width = tile.width
      tc.height = tile.height
      tc.getContext('2d').putImageData(new ImageData(tile.data, tile.width, tile.height), 0, 0)
      pattern = ctx.createPattern(tc, 'repeat')
    }

    function fillGrain(x, y, w, h) {
      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(x, y, w, h)
      ctx.fillStyle = pattern
      ctx.fillRect(x, y, w, h)
    }

    function holeRect(cx, cy) {
      const r = CLEAR_R * dpr + 2
      return { x: cx * dpr - r, y: cy * dpr - r, w: r * 2, h: r * 2 }
    }

    function cutHole(cx, cy) {
      const px = cx * dpr
      const py = cy * dpr
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

    function union(a, b) {
      if (!a) return b
      const x = Math.min(a.x, b.x)
      const y = Math.min(a.y, b.y)
      return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }
    }

    function paintFull() {
      fillGrain(0, 0, W, H)
      prevRect = null
      if (has) {
        cutHole(mx, my)
        prevRect = holeRect(mx, my)
      }
    }

    function frame() {
      raf = 0
      if (reduced) return

      if (!target) {
        // Pointer left: restore the grain where the hole was, then stop.
        if (has && prevRect) fillGrain(prevRect.x, prevRect.y, prevRect.w, prevRect.h)
        prevRect = null
        has = false
        return
      }

      mx += (tx - mx) * LERP
      my += (ty - my) * LERP
      if (Math.abs(tx - mx) < SETTLE_PX && Math.abs(ty - my) < SETTLE_PX) { mx = tx; my = ty }
      has = true

      const now = performance.now()
      if (now - lastSeedAt > REFRESH_MS) {
        // Occasional new noise while the user interacts (replaces the old 3.5 s timer).
        lastSeedAt = now
        seed = (seed + 1) >>> 0
        buildPattern()
        paintFull()
      } else {
        const next = holeRect(mx, my)
        const r = union(prevRect, next)
        fillGrain(r.x, r.y, r.w, r.h)
        cutHole(mx, my)
        prevRect = next
      }

      if (mx !== tx || my !== ty) raf = requestAnimationFrame(frame)
    }

    function schedule() {
      if (!raf && !reduced) raf = requestAnimationFrame(frame)
    }

    function setTarget(x, y) {
      if (reduced) return
      if (!target && !has) {
        // First entry: start the hole at the pointer and keep the current noise.
        mx = x
        my = y
        lastSeedAt = performance.now()
      }
      tx = x
      ty = y
      target = true
      schedule()
    }

    function clearTarget() {
      if (!target) return
      target = false
      schedule()
    }

    function resize() {
      resizeRaf = 0
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const nextCell = Math.max(1, Math.round(dpr))
      W = Math.round(window.innerWidth * dpr)
      H = Math.round(window.innerHeight * dpr)
      canvas.width = W
      canvas.height = H
      if (!pattern || nextCell !== cell) {
        cell = nextCell
        buildPattern()
      }
      paintFull()
    }

    const onResize = () => { if (!resizeRaf) resizeRaf = requestAnimationFrame(resize) }
    const onMove = (e) => setTarget(e.clientX, e.clientY)
    const onLeave = () => clearTarget()
    const onTouch = (e) => { const t = e.touches[0]; if (t) setTarget(t.clientX, t.clientY) }
    const onMq = (e) => {
      reduced = e.matches
      if (reduced) {
        if (raf) cancelAnimationFrame(raf)
        raf = 0
        target = false
        has = false
        paintFull() // static frame, no hole
      }
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    window.addEventListener('blur', onLeave)
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('touchend', onLeave)
    window.addEventListener('touchcancel', onLeave)
    mq.addEventListener('change', onMq)

    resize() // first paint: one static grain frame (also under reduced motion)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      if (resizeRaf) cancelAnimationFrame(resizeRaf)
      raf = 0
      resizeRaf = 0
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('blur', onLeave)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchend', onLeave)
      window.removeEventListener('touchcancel', onLeave)
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
