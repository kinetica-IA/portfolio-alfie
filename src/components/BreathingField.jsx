import { useRef, useEffect } from 'react'

/*
 * BreathingField v4 — CSS-anchored cone of revolution
 *
 * Wraps the h1 title. The canvas extends upward from the title via CSS.
 * Cone vertex = bottom-center of canvas = just above the h1.
 * Zero DOM queries — position is 100% CSS-driven, fully responsive.
 */

// ── Palette ─────────────────────────────────────────────────────────
const WARM_COLORS = [
  [235, 165, 35],
  [230, 135, 50],
  [215, 130, 70],
  [242, 190, 55],
  [210, 175, 95],
]

const COOL_COLORS = [
  [60,  155, 140],
  [120, 185, 180],
  [105, 185, 205],
  [80,  175, 120],
  [80,  145, 160],
  [85,  155, 100],
]

// ── Config ──────────────────────────────────────────────────────────
const RAY_COUNT        = 200
const CONE_HALF_ANGLE  = 0.4363
const CONE_VARIATION   = 0.5236
const MIN_RAY_LENGTH   = 0.25
const MAX_RAY_LENGTH   = 0.80

const LINE_WIDTH_MIN   = 0.08
const LINE_WIDTH_MAX   = 1.1
const BASE_ALPHA       = 0.50
const PULSE_SPEED      = 0.0009
const PULSE_AMP        = 0.03
const ROTATION_SPEED   = 0.00004
const PERSPECTIVE      = 900
const CURSOR_RADIUS    = 250
const CURSOR_PUSH      = 0.04

const CURVE_AMP        = 0.06
const CURVE_SPEED      = 0.0005

const BREATH_SPEED     = 0.000523
const BREATH_MIX       = 0.45

const TRAIL_ALPHA_MULT = 0.07

const PULSE_REACT_RANGE = 0.10
const PULSE_REACT_BOOST = 0.25

const HALO_DEPTH_THRESH = 0.55
const HALO_WIDTH_MULT   = 3.5
const HALO_ALPHA_MULT   = 0.12

const PULSE_BPM         = 33
const PULSE_INTERVAL    = 60000 / PULSE_BPM

// ── Responsive ──────────────────────────────────────────────────────
const MOBILE_BP         = 480
const MOBILE_RAY_THIN   = 0.65

// ── Ray generation ──────────────────────────────────────────────────
function generateRays() {
  const rays = []
  for (let i = 0; i < RAY_COUNT; i++) {
    const phi = (i / RAY_COUNT) * Math.PI * 2
    const theta = CONE_HALF_ANGLE + Math.random() * CONE_VARIATION
    const length = MIN_RAY_LENGTH + Math.random() * (MAX_RAY_LENGTH - MIN_RAY_LENGTH)
    const warmIdx = Math.floor(Math.random() * WARM_COLORS.length)
    const coolIdx = Math.floor(Math.random() * COOL_COLORS.length)

    rays.push({
      phi, theta, length,
      baseWidth: LINE_WIDTH_MIN + Math.random() * (LINE_WIDTH_MAX - LINE_WIDTH_MIN),
      baseAlpha: BASE_ALPHA * (0.35 + Math.random() * 0.65),
      warmColor: WARM_COLORS[warmIdx],
      coolColor: COOL_COLORS[coolIdx],
      colorT: Math.random(),
      speedJitter: 0.85 + Math.random() * 0.30,
      curvePhase: Math.random() * Math.PI * 2,
      prevTipX: null,
      prevTipY: null,
    })
  }
  return rays
}

// ── Cone builder ────────────────────────────────────────────────────
function buildCone(rays, fx, fy, maxReach, pulse, rot, direction, mouse, cursorOn, cr2, drawList, H, now, pulseY) {
  for (let i = 0; i < rays.length; i++) {
    const ray = rays[i]

    const rayRot = rot * ray.speedJitter
    const cosRot = Math.cos(rayRot)
    const sinRot = Math.sin(rayRot)

    const len = ray.length * maxReach * pulse
    const sinT = Math.sin(ray.theta)
    const cosT = Math.cos(ray.theta)

    const localX = len * sinT * Math.cos(ray.phi)
    const localY = direction * len * cosT
    const localZ = len * sinT * Math.sin(ray.phi)

    const worldX = localX * cosRot - localZ * sinRot
    const worldZ = localX * sinRot + localZ * cosRot
    const worldY = localY

    const pScale = PERSPECTIVE / (PERSPECTIVE + worldZ)

    const depthFactor = Math.max(0.01, pScale)
    const dWidth  = 0.10 + depthFactor * 0.90
    const dLength = 0.40 + depthFactor * 0.60
    const dAlpha  = 0.03 + depthFactor * depthFactor * 0.97

    const adjLen = len * dLength
    const aLocalX = adjLen * sinT * Math.cos(ray.phi)
    const aLocalY = direction * adjLen * cosT
    const aLocalZ = adjLen * sinT * Math.sin(ray.phi)
    const aWorldX = aLocalX * cosRot - aLocalZ * sinRot
    const aWorldZ = aLocalX * sinRot + aLocalZ * cosRot
    const aWorldY = aLocalY
    const aPScale = PERSPECTIVE / (PERSPECTIVE + aWorldZ)

    let tipX = fx + aWorldX * aPScale
    let tipY = fy + aWorldY * aPScale

    // Skip lines below vertex (cone opens upward only)
    if (direction === -1 && tipY > fy) continue
    if (direction === 1 && tipY < fy) continue

    // Cursor push
    if (cursorOn) {
      const dx = tipX - mouse.x, dy = tipY - mouse.y
      const d2 = dx * dx + dy * dy
      if (d2 < cr2) {
        const push = CURSOR_PUSH * maxReach * (1 - d2 / cr2) * aPScale
        const pushAngle = Math.atan2(tipY - fy, tipX - fx)
        tipX += Math.cos(pushAngle) * push
        tipY += Math.sin(pushAngle) * push
      }
    }

    // Pulse reaction
    let pulseBoost = 0
    if (pulseY !== null) {
      const distToPulse = Math.abs(tipY - pulseY) / H
      if (distToPulse < PULSE_REACT_RANGE) {
        pulseBoost = (1 - distToPulse / PULSE_REACT_RANGE) * PULSE_REACT_BOOST
      }
    }

    // Color breathing
    const breathPhase = Math.sin(now * BREATH_SPEED) * 0.5 + 0.5
    const effectiveColorT = ray.colorT * (1 - BREATH_MIX) + breathPhase * BREATH_MIX

    // Curve control point
    const curveOffset = Math.sin(now * CURVE_SPEED + ray.curvePhase) * adjLen * CURVE_AMP

    drawList.push({
      fx, fy, tipX, tipY,
      alpha: ray.baseAlpha * Math.max(0.03, dAlpha) * (1 + pulseBoost),
      width: ray.baseWidth * Math.max(0.1, dWidth) * (1 + pulseBoost * 0.5),
      warmColor: ray.warmColor,
      coolColor: ray.coolColor,
      colorT: effectiveColorT,
      depth: worldZ,
      depthFactor,
      curveOffset,
      prevTipX: ray.prevTipX,
      prevTipY: ray.prevTipY,
      rayRef: ray,
    })

    ray.prevTipX = tipX
    ray.prevTipY = tipY
  }
}

// ── Component ───────────────────────────────────────────────────────
export default function BreathingField({ children }) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const raf = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')

    let W, H, dpr, maxReach, isMobile
    const mouse = { x: -1, y: -1 }
    const rays = generateRays()

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      // Canvas width = full viewport width (so cone can spread wide)
      W = window.innerWidth
      // Canvas height = distance from top of .hero to the h1 title
      // The wrapper is positioned where the h1 is (by CSS flow).
      // We measure how far the wrapper is from the top of the hero section.
      const heroEl = wrap.closest('.hero')
      const wrapRect = wrap.getBoundingClientRect()
      const heroRect = heroEl ? heroEl.getBoundingClientRect() : wrapRect

      // Canvas covers from the hero top down to the wrapper top
      H = wrapRect.top - heroRect.top
      // Minimum height so cone has room even on small screens
      H = Math.max(H, 120)

      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      isMobile = W <= MOBILE_BP

      // maxReach scales with available space
      maxReach = Math.min(W * 0.50, H * 0.90)
      if (isMobile) maxReach *= 0.60
    }

    function onMove(e) { mouse.x = e.clientX; mouse.y = e.clientY }
    function onLeave() { mouse.x = -1; mouse.y = -1 }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', resize)
    resize()

    let frameCount = 0
    function draw(now) {
      // Re-measure every ~60 frames to catch layout shifts
      if (++frameCount >= 60) { frameCount = 0; resize() }

      ctx.clearRect(0, 0, W, H)

      const pulse = 1 + Math.sin(now * PULSE_SPEED) * PULSE_AMP
      const rot = now * ROTATION_SPEED

      const cursorOn = mouse.x >= 0
      const cr2 = CURSOR_RADIUS * CURSOR_RADIUS

      // Focal point = bottom-center of canvas = just above the title
      const fX = W * 0.5
      const fY = H  // bottom of canvas

      const beatProgress = (now % PULSE_INTERVAL) / PULSE_INTERVAL
      const pulseY = fY - beatProgress * H * 0.3

      const drawList = []

      buildCone(rays,
        fX, fY,
        maxReach, pulse, rot, -1, mouse, cursorOn, cr2, drawList, H, now, pulseY)

      // Sort back-to-front
      drawList.sort((a, b) => a.depth - b.depth)

      // ── Draw rays ──────────────────────────────────────────────
      for (let i = 0; i < drawList.length; i++) {
        const d = drawList[i]

        const ct = d.colorT
        const wc = d.warmColor
        const cc = d.coolColor
        const r = wc[0] + (cc[0] - wc[0]) * ct
        const g = wc[1] + (cc[1] - wc[1]) * ct
        const b = wc[2] + (cc[2] - wc[2]) * ct
        const a = d.alpha

        // Trail ghost
        if (d.prevTipX !== null && d.prevTipY !== null) {
          const ghostAlpha = a * TRAIL_ALPHA_MULT
          ctx.strokeStyle = `rgba(${r|0}, ${g|0}, ${b|0}, ${ghostAlpha})`
          ctx.lineWidth = d.width * 0.6
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(d.prevTipX, d.prevTipY)
          ctx.lineTo(d.tipX, d.tipY)
          ctx.stroke()
        }

        // Gradient ray
        const grad = ctx.createLinearGradient(d.fx, d.fy, d.tipX, d.tipY)
        grad.addColorStop(0,    `rgba(${r|0}, ${g|0}, ${b|0}, ${a * 0.6})`)
        grad.addColorStop(0.25, `rgba(${r|0}, ${g|0}, ${b|0}, ${a})`)
        grad.addColorStop(0.65, `rgba(${r|0}, ${g|0}, ${b|0}, ${a * 0.45})`)
        grad.addColorStop(1,    `rgba(${r|0}, ${g|0}, ${b|0}, ${a * 0.1})`)

        ctx.strokeStyle = grad
        ctx.lineWidth = isMobile ? d.width * MOBILE_RAY_THIN : d.width
        ctx.lineCap = 'round'

        // Quadratic curve
        const midX = (d.fx + d.tipX) / 2
        const midY = (d.fy + d.tipY) / 2
        const rayAngle = Math.atan2(d.tipY - d.fy, d.tipX - d.fx)
        const perpAngle = rayAngle + Math.PI * 0.5
        const cpX = midX + Math.cos(perpAngle) * d.curveOffset
        const cpY = midY + Math.sin(perpAngle) * d.curveOffset

        ctx.beginPath()
        ctx.moveTo(d.fx, d.fy)
        ctx.quadraticCurveTo(cpX, cpY, d.tipX, d.tipY)
        ctx.stroke()

        // Halo glow on front rays
        if (d.depthFactor > HALO_DEPTH_THRESH) {
          const haloStrength = (d.depthFactor - HALO_DEPTH_THRESH) / (1 - HALO_DEPTH_THRESH)
          const haloAlpha = a * HALO_ALPHA_MULT * haloStrength
          ctx.strokeStyle = `rgba(${r|0}, ${g|0}, ${b|0}, ${haloAlpha})`
          ctx.lineWidth = d.width * HALO_WIDTH_MULT
          ctx.beginPath()
          ctx.moveTo(d.fx, d.fy)
          ctx.quadraticCurveTo(cpX, cpY, d.tipX, d.tipY)
          ctx.stroke()
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
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '100%',       /* canvas sits ABOVE the children (h1) */
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {children}
    </div>
  )
}
