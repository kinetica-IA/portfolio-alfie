(function () {
  const BG_R = 240, BG_G = 249, BG_B = 249
  const FADE = 0.018

  const BLOBS = [
    { phase: 0.00, sx: 0.0025, sy: 0.0019, ax: 0.30, ay: 0.26, cr: 140, cg: 188, cb: 183 },
    { phase: 1.31, sx: 0.0033, sy: 0.0026, ax: 0.26, ay: 0.22, cr: 168, cg: 205, cb: 216 },
    { phase: 2.67, sx: 0.0019, sy: 0.0015, ax: 0.32, ay: 0.28, cr: 147, cg: 191, cb: 186 },
    { phase: 3.82, sx: 0.0036, sy: 0.0028, ax: 0.22, ay: 0.20, cr: 157, cg: 198, cb: 193 },
    { phase: 5.14, sx: 0.0028, sy: 0.0022, ax: 0.34, ay: 0.26, cr: 160, cg: 202, cb: 202 },
    { phase: 4.55, sx: 0.0021, sy: 0.0018, ax: 0.28, ay: 0.24, cr: 145, cg: 186, cb: 172 },
    { phase: 6.20, sx: 0.0029, sy: 0.0022, ax: 0.24, ay: 0.20, cr: 162, cg: 196, cb: 218 },
  ]

  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;opacity:0.55'
  document.body.prepend(canvas)

  const ctx = canvas.getContext('2d', { alpha: false })
  let w = 0, h = 0, t = 0, raf

  function reset() {
    w = canvas.width = window.innerWidth
    h = canvas.height = window.innerHeight
    ctx.fillStyle = `rgb(${BG_R},${BG_G},${BG_B})`
    ctx.fillRect(0, 0, w, h)
  }
  reset()
  window.addEventListener('resize', reset)

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  let paused = mq.matches
  mq.addEventListener('change', e => { paused = e.matches })

  function tick() {
    raf = requestAnimationFrame(tick)
    if (paused) return

    ctx.fillStyle = `rgba(${BG_R},${BG_G},${BG_B},${FADE})`
    ctx.fillRect(0, 0, w, h)

    const R = Math.min(w, h) * 0.22

    BLOBS.forEach(function (blob) {
      const bx = w * (0.5 + blob.ax * Math.sin(t * blob.sx + blob.phase))
      const by = h * (0.5 + blob.ay * Math.cos(t * blob.sy + blob.phase * 0.73))
      const breathe = (Math.sin(t * 0.0035 + blob.phase) + 1) * 0.5
      const rx = R * (0.90 + 0.18 * breathe)
      const ry = R * (0.90 + 0.18 * (1 - breathe * 0.6))
      const rMax = Math.max(rx, ry)
      const cr = blob.cr, cg = blob.cg, cb = blob.cb

      const grd = ctx.createRadialGradient(bx, by, 0, bx, by, rMax)
      grd.addColorStop(0,    `rgba(${cr},${cg},${cb},0.13)`)
      grd.addColorStop(0.38, `rgba(${cr},${cg},${cb},0.07)`)
      grd.addColorStop(0.72, `rgba(${cr},${cg},${cb},0.022)`)
      grd.addColorStop(1,    `rgba(${cr},${cg},${cb},0)`)
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()

      for (var i = 0; i < 90; i++) {
        var angle = Math.random() * Math.PI * 2
        var d = rMax * (0.46 + Math.random() * 0.84)
        var falloff = Math.max(0, 1 - (d / rMax - 0.46) / 0.84)
        var a = falloff * falloff * 0.10 * Math.random()
        var sz = 1 + Math.random() * 1.5
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${a})`
        ctx.fillRect(bx + Math.cos(angle) * d, by + Math.sin(angle) * d, sz, sz)
      }
    })

    t++
  }

  tick()
})()
