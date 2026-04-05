import { useRef, useEffect, useState } from 'react'

// ════════════════════════════════════════════════════════════════════
// FilmGrain — Photographic grain with click-to-reveal reading strip
//
// 1. Static film grain texture covering the entire page
// 2. Click anywhere: a horizontal strip "cleans" the grain,
//    expanding left-to-right from the click point, revealing
//    the content beneath. Soft gradient edges — never a hard cut.
// 3. The strip follows the Y of the click, sized to reveal a
//    paragraph of text.
//
// Desktop only. Press F for debug panel.
// ════════════════════════════════════════════════════════════════════

const MOBILE_BP = 768

const PARAMS = {
  // Grain
  grainAlpha:    0.73,
  grainSize:     2,
  grainRange:    40,

  // Reveal strip
  stripHeight:   400,
  stripFadeV:    200,
  stripFadeH:    400,
  stripSpeed:    4000,
  stripEase:     0.15,
}
if (typeof window !== 'undefined') window.__FILM_PARAMS = PARAMS

// ── Debug Panel ────────────────────────────────────────────────────
function FilmDebug({ visible }) {
  const [, forceUpdate] = useState(0)
  if (!visible) return null

  const sliders = [
    { key: 'grainAlpha',  label: 'Grain Opacity',     min: 0.3, max: 1.0, step: 0.01 },
    { key: 'grainSize',   label: 'Grain Size (px)',    min: 1, max: 6, step: 0.5 },
    { key: 'grainRange',  label: 'Grain Intensity',    min: 2, max: 40, step: 1 },
    { key: 'stripHeight', label: 'Strip Height',       min: 60, max: 400, step: 10 },
    { key: 'stripFadeV',  label: 'Strip V-Fade',       min: 10, max: 200, step: 5 },
    { key: 'stripFadeH',  label: 'Strip H-Fade',       min: 20, max: 400, step: 10 },
    { key: 'stripSpeed',  label: 'Strip Speed (ms)',   min: 200, max: 4000, step: 100 },
    { key: 'stripEase',   label: 'Strip Smoothing',    min: 0.01, max: 0.15, step: 0.005 },
  ]

  return (
    <div style={{
      position: 'fixed', top: 10, left: 10, zIndex: 9999,
      background: 'rgba(0,0,0,0.88)', color: '#ccc', padding: '12px 16px',
      borderRadius: 8, fontFamily: 'monospace', fontSize: 11,
      maxHeight: '90vh', overflowY: 'auto', width: 260,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ color: '#d4a843', fontWeight: 'bold', marginBottom: 8, fontSize: 12 }}>
        FILM GRAIN — press F to close
      </div>
      {sliders.map(s => (
        <div key={s.key} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{s.label}</span>
            <span style={{ color: '#90a7a5' }}>{PARAMS[s.key].toFixed(s.step < 0.01 ? 3 : s.step < 1 ? 2 : 0)}</span>
          </div>
          <input type="range" min={s.min} max={s.max} step={s.step}
            value={PARAMS[s.key]}
            onChange={e => { PARAMS[s.key] = parseFloat(e.target.value); forceUpdate(n => n + 1) }}
            style={{ width: '100%', accentColor: '#d4a843' }}
          />
        </div>
      ))}
      <button onClick={() => {
        const out = {}; for (const k in PARAMS) out[k] = PARAMS[k]
        navigator.clipboard.writeText(JSON.stringify(out, null, 2))
      }} style={{
        marginTop: 8, width: '100%', padding: '6px 0',
        background: '#d4a843', color: '#fff', border: 'none',
        borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', fontSize: 11,
      }}>
        Copy params to clipboard
      </button>
    </div>
  )
}

export default function FilmGrain() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const [debugVisible, setDebugVisible] = useState(false)

  useEffect(() => {
    const onKey = e => { if (e.key === 'f' || e.key === 'F') setDebugVisible(v => !v) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W, H, dpr

    // Grain buffer (generated once per resize/param change)
    let grainCanvas = null
    let grainCtx = null

    // Reveal strip state
    const strip = {
      active: false,
      clickY: 0,         // page Y of click (includes scroll)
      clickX: 0,         // viewport X of click
      progress: 0,       // 0..1 animation progress
      currentY: -9999,   // smoothed Y position (viewport-relative)
      currentLeft: 0,    // current left edge of reveal
      currentRight: 0,   // current right edge of reveal
      startTime: 0,
    }

    function generateGrain() {
      const P = PARAMS
      const size = Math.max(1, Math.round(P.grainSize))
      const gW = Math.ceil(W / size)
      const gH = Math.ceil(H / size)

      grainCanvas = document.createElement('canvas')
      grainCanvas.width = gW
      grainCanvas.height = gH
      grainCtx = grainCanvas.getContext('2d')

      const imageData = grainCtx.createImageData(gW, gH)
      const data = imageData.data
      const baseR = 240, baseG = 249, baseB = 249
      const range = P.grainRange

      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 2 * range
        data[i]     = baseR + noise
        data[i + 1] = baseG + noise
        data[i + 2] = baseB + noise
        data[i + 3] = 255
      }
      grainCtx.putImageData(imageData, 0, 0)
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      generateGrain()
    }

    function onClick(e) {
      const cx = e.clientX ?? e.touches?.[0]?.clientX ?? W / 2
      const cy = e.clientY ?? e.touches?.[0]?.clientY ?? H / 2
      strip.active = true
      strip.clickY = cy + window.scrollY
      strip.clickX = cx
      strip.progress = 0
      strip.startTime = performance.now()
      strip.currentLeft = cx
      strip.currentRight = cx
    }

    window.addEventListener('click', onClick)
    window.addEventListener('touchstart', onClick, { passive: true })
    window.addEventListener('resize', resize)
    resize()

    function draw(now) {
      ctx.clearRect(0, 0, W, H)
      const P = PARAMS

      // ── Draw full grain ───────────────────────────────────────
      if (grainCanvas) {
        ctx.globalAlpha = P.grainAlpha
        ctx.drawImage(grainCanvas, 0, 0, W, H)
        ctx.globalAlpha = 1
      }

      // ── Reveal strip (erase grain in a horizontal band) ───────
      if (strip.active) {
        const elapsed = now - strip.startTime
        const targetProgress = Math.min(1, elapsed / P.stripSpeed)
        strip.progress += (targetProgress - strip.progress) * P.stripEase * 2

        // Strip Y in viewport coordinates (scroll-adjusted)
        const viewportY = strip.clickY - window.scrollY

        // Smooth Y tracking
        if (strip.currentY < -9000) strip.currentY = viewportY
        strip.currentY += (viewportY - strip.currentY) * P.stripEase

        // Expand horizontally from click point
        const targetLeft = 0
        const targetRight = W
        const expandProgress = Math.min(1, strip.progress * 1.5) // expand faster than fade
        strip.currentLeft += (targetLeft - strip.currentLeft) * P.stripEase * 3
        strip.currentRight += (targetRight - strip.currentRight) * P.stripEase * 3

        const cy = strip.currentY
        const halfH = P.stripHeight / 2
        const fadeV = P.stripFadeV
        const fadeH = P.stripFadeH
        const left = strip.currentLeft
        const right = strip.currentRight

        // Use destination-out to erase grain in the strip area
        // We draw a rectangle with a gradient alpha mask
        ctx.save()
        ctx.globalCompositeOperation = 'destination-out'

        // Vertical gradient mask (top fade → full clear → bottom fade)
        const topStart = cy - halfH - fadeV
        const topEnd = cy - halfH
        const botStart = cy + halfH
        const botEnd = cy + halfH + fadeV

        // Horizontal gradient mask
        const hLeft = left - fadeH
        const hRight = right + fadeH

        // Draw the eraser: a rect with radial-ish soft edges
        // We'll use multiple passes for smooth 2D fade

        // Vertical gradient
        const vGrad = ctx.createLinearGradient(0, topStart, 0, botEnd)
        vGrad.addColorStop(0, 'rgba(0,0,0,0)')
        const fadeVFrac = fadeV / (P.stripHeight + fadeV * 2)
        vGrad.addColorStop(fadeVFrac, `rgba(0,0,0,${strip.progress})`)
        vGrad.addColorStop(1 - fadeVFrac, `rgba(0,0,0,${strip.progress})`)
        vGrad.addColorStop(1, 'rgba(0,0,0,0)')

        ctx.fillStyle = vGrad

        // Clip to horizontal bounds with fade
        // Left fade
        if (fadeH > 0) {
          // Draw left fade region
          const lGrad = ctx.createLinearGradient(hLeft, 0, left, 0)
          lGrad.addColorStop(0, 'rgba(0,0,0,0)')
          lGrad.addColorStop(1, 'rgba(0,0,0,1)')

          // Center full region
          // Right fade region
          // Combine: draw 3 vertical strips

          // Left fade
          ctx.save()
          ctx.beginPath()
          ctx.rect(hLeft, topStart, fadeH, botEnd - topStart)
          ctx.clip()
          ctx.fillStyle = vGrad
          ctx.globalAlpha = 1
          // Multiply with horizontal fade
          ctx.fillRect(hLeft, topStart, fadeH, botEnd - topStart)
          // Now apply horizontal fade on top
          ctx.globalCompositeOperation = 'destination-in'
          ctx.fillStyle = lGrad
          ctx.fillRect(hLeft, topStart, fadeH, botEnd - topStart)
          ctx.restore()

          // Center (full opacity)
          ctx.save()
          ctx.globalCompositeOperation = 'destination-out'
          ctx.fillStyle = vGrad
          ctx.fillRect(left, topStart, right - left, botEnd - topStart)
          ctx.restore()

          // Right fade
          const rGrad = ctx.createLinearGradient(right, 0, hRight, 0)
          rGrad.addColorStop(0, 'rgba(0,0,0,1)')
          rGrad.addColorStop(1, 'rgba(0,0,0,0)')

          ctx.save()
          ctx.beginPath()
          ctx.rect(right, topStart, fadeH, botEnd - topStart)
          ctx.clip()
          ctx.globalCompositeOperation = 'destination-out'
          ctx.fillStyle = vGrad
          ctx.fillRect(right, topStart, fadeH, botEnd - topStart)
          ctx.globalCompositeOperation = 'destination-in'
          ctx.fillStyle = rGrad
          ctx.fillRect(right, topStart, fadeH, botEnd - topStart)
          ctx.restore()
        } else {
          ctx.fillRect(left, topStart, right - left, botEnd - topStart)
        }

        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('click', onClick)
      window.removeEventListener('touchstart', onClick)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <>
      <FilmDebug visible={debugVisible} />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw', height: '100vh',
          zIndex: 9998,
          pointerEvents: 'none',
          mixBlendMode: 'multiply',
        }}
      />
    </>
  )
}
