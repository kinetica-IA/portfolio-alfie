import { useRef, useEffect, useState } from 'react'

// ════════════════════════════════════════════════════════════════════
// FilmGrain — Photographic grain with click-to-reveal reading strip
// ════════════════════════════════════════════════════════════════════

const PARAMS = {
  grainAlpha:    0.63,
  grainSize:     0.4,
  grainRange:    50,
  stripHeight:   400,
  stripFadeV:    200,
  stripFadeH:    400,
  stripSpeed:    2000,
  stripEase:     0.15,
}
if (typeof window !== 'undefined') window.__FILM_PARAMS = PARAMS

function FilmDebug({ visible }) {
  const [, forceUpdate] = useState(0)
  if (!visible) return null

  const sliders = [
    { key: 'grainAlpha',  label: 'Grain Opacity',     min: 0.1, max: 1.0, step: 0.01 },
    { key: 'grainSize',   label: 'Grain Size (px)',    min: 0.25, max: 6, step: 0.25 },
    { key: 'grainRange',  label: 'Grain Intensity',    min: 2, max: 60, step: 1 },
    { key: 'stripHeight', label: 'Strip Height',       min: 100, max: 800, step: 20 },
    { key: 'stripFadeV',  label: 'Strip V-Fade',       min: 50, max: 500, step: 10 },
    { key: 'stripFadeH',  label: 'Strip H-Fade',       min: 50, max: 800, step: 20 },
    { key: 'stripSpeed',  label: 'Strip Speed (ms)',   min: 500, max: 8000, step: 200 },
    { key: 'stripEase',   label: 'Strip Smoothing',    min: 0.01, max: 0.2, step: 0.005 },
  ]

  return (
    <div style={{
      position: 'fixed', top: 10, left: 10, zIndex: 10000,
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
            <span style={{ color: '#90a7a5' }}>{PARAMS[s.key].toFixed(s.step < 0.1 ? 2 : s.step < 1 ? 1 : 0)}</span>
          </div>
          <input type="range" min={s.min} max={s.max} step={s.step}
            value={PARAMS[s.key]}
            onChange={e => { PARAMS[s.key] = parseFloat(e.target.value); forceUpdate(n => n + 1) }}
            style={{ width: '100%', accentColor: '#d4a843' }}
          />
        </div>
      ))}
      <button onClick={() => {
        navigator.clipboard.writeText(JSON.stringify(PARAMS, null, 2))
      }} style={{
        marginTop: 8, width: '100%', padding: '6px 0',
        background: '#d4a843', color: '#fff', border: 'none',
        borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', fontSize: 11,
      }}>Copy params</button>
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

    let W, H

    let grainCanvas = null
    let grainCtx = null

    const strip = {
      active: false, clickY: 0, clickX: 0, progress: 0,
      currentY: -9999, currentLeft: 0, currentRight: 0, startTime: 0,
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
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

      if (grainCanvas) {
        ctx.globalAlpha = P.grainAlpha
        ctx.drawImage(grainCanvas, 0, 0, W, H)
        ctx.globalAlpha = 1
      }

      if (strip.active) {
        const elapsed = now - strip.startTime
        const targetProgress = Math.min(1, elapsed / P.stripSpeed)
        strip.progress += (targetProgress - strip.progress) * P.stripEase * 2

        const viewportY = strip.clickY - window.scrollY
        if (strip.currentY < -9000) strip.currentY = viewportY
        strip.currentY += (viewportY - strip.currentY) * P.stripEase

        strip.currentLeft += (0 - strip.currentLeft) * P.stripEase * 3
        strip.currentRight += (W - strip.currentRight) * P.stripEase * 3

        const cy = strip.currentY
        const halfH = P.stripHeight / 2
        const fadeV = P.stripFadeV
        const fadeH = P.stripFadeH
        const left = strip.currentLeft
        const right = strip.currentRight

        ctx.save()
        ctx.globalCompositeOperation = 'destination-out'

        const topStart = cy - halfH - fadeV
        const botEnd = cy + halfH + fadeV
        const hLeft = left - fadeH
        const hRight = right + fadeH

        const vGrad = ctx.createLinearGradient(0, topStart, 0, botEnd)
        const fadeVFrac = fadeV / (P.stripHeight + fadeV * 2)
        vGrad.addColorStop(0, 'rgba(0,0,0,0)')
        vGrad.addColorStop(fadeVFrac, `rgba(0,0,0,${strip.progress})`)
        vGrad.addColorStop(1 - fadeVFrac, `rgba(0,0,0,${strip.progress})`)
        vGrad.addColorStop(1, 'rgba(0,0,0,0)')

        if (fadeH > 0) {
          const lGrad = ctx.createLinearGradient(hLeft, 0, left, 0)
          lGrad.addColorStop(0, 'rgba(0,0,0,0)')
          lGrad.addColorStop(1, 'rgba(0,0,0,1)')

          ctx.save()
          ctx.beginPath()
          ctx.rect(hLeft, topStart, fadeH, botEnd - topStart)
          ctx.clip()
          ctx.fillStyle = vGrad
          ctx.fillRect(hLeft, topStart, fadeH, botEnd - topStart)
          ctx.globalCompositeOperation = 'destination-in'
          ctx.fillStyle = lGrad
          ctx.fillRect(hLeft, topStart, fadeH, botEnd - topStart)
          ctx.restore()

          ctx.save()
          ctx.globalCompositeOperation = 'destination-out'
          ctx.fillStyle = vGrad
          ctx.fillRect(left, topStart, right - left, botEnd - topStart)
          ctx.restore()

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
          ctx.fillStyle = vGrad
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
      <canvas ref={canvasRef} aria-hidden="true" style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 9998, pointerEvents: 'none',
        mixBlendMode: 'multiply',
      }} />
    </>
  )
}
