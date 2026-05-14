(function () {
  var TEAL_TONES = [
    [140, 188, 183],
    [147, 191, 186],
    [93,  138, 130],
    [106, 134, 144],
    [145, 186, 172],
  ]
  var OPACITY    = 0.27
  var DENSITY    = 0.80
  var REFRESH_MS = 3500
  var CLEAR_R    = 130
  var SOFTNESS   = 0.20
  var LERP       = 0.12
  var SIZE       = 1

  var canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText = [
    'position:fixed', 'inset:0', 'width:100vw', 'height:100vh',
    'z-index:0', 'pointer-events:none',
  ].join(';')
  document.body.appendChild(canvas)

  var ctx = canvas.getContext('2d', { alpha: true })
  var W = 0, H = 0, dpr = 1
  var mx = -9999, my = -9999, tx = -9999, ty = -9999
  var grainCanvas, grainCtx
  var raf, grainTimer

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = Math.round(window.innerWidth  * dpr)
    H = Math.round(window.innerHeight * dpr)
    canvas.width  = W
    canvas.height = H
    grainCanvas = document.createElement('canvas')
    grainCanvas.width  = W
    grainCanvas.height = H
    grainCtx = grainCanvas.getContext('2d')
    generateGrain()
  }

  function generateGrain() {
    grainCtx.clearRect(0, 0, W, H)
    var s = Math.max(1, Math.round(SIZE * dpr))
    var cols  = Math.ceil(W / s)
    var rows  = Math.ceil(H / s)
    var total = cols * rows
    for (var i = 0; i < total; i++) {
      if (Math.random() > DENSITY) continue
      var tone = TEAL_TONES[(Math.random() * TEAL_TONES.length) | 0]
      var a    = OPACITY * (0.3 + Math.random() * 0.7)
      var col  = i % cols
      var row  = (i / cols) | 0
      grainCtx.fillStyle = 'rgba(' + tone[0] + ',' + tone[1] + ',' + tone[2] + ',' + a.toFixed(3) + ')'
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
      var px = mx * dpr
      var py = my * dpr
      var r  = CLEAR_R * dpr
      ctx.globalCompositeOperation = 'destination-out'
      var grad = ctx.createRadialGradient(px, py, 0, px, py, r)
      grad.addColorStop(0,        'rgba(0,0,0,1)')
      grad.addColorStop(SOFTNESS, 'rgba(0,0,0,0.6)')
      grad.addColorStop(1,        'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  var mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  var paused = mq.matches

  window.addEventListener('resize',      resize)
  window.addEventListener('mousemove',   function (e) { tx = e.clientX; ty = e.clientY })
  window.addEventListener('mouseleave',  function ()  { tx = -9999; ty = -9999 })
  window.addEventListener('touchmove',   function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY }, { passive: true })
  window.addEventListener('touchend',    function ()  { tx = -9999; ty = -9999 })
  mq.addEventListener('change', function (e) {
    paused = e.matches
    if (paused) { cancelAnimationFrame(raf); clearInterval(grainTimer) }
    else        { draw(); startRefresh() }
  })

  resize()
  if (!paused) { draw(); startRefresh() }
})()
