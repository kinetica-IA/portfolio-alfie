import { useRef, useEffect } from 'react'

/*
 * BreathingField v3 — Dual 3D cones of revolution
 *
 * Organic respiratory animation for Kinetica AI.
 * Two symmetric cones rotate in opposition with perspective projection.
 * v2: dynamic aspect scaling, scroll fade, aggressive depth,
 *     motion trails, speed jitter, curved rays, sympathetic/parasympathetic
 *     color breathing, and pulse-reactive ray intensification.
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

// v2: aggressive depth range
const LINE_WIDTH_MIN   = 0.08
const LINE_WIDTH_MAX   = 1.1
const BASE_ALPHA       = 0.50
const PULSE_SPEED      = 0.0009
const PULSE_AMP        = 0.03
const ROTATION_SPEED   = 0.00004
const PERSPECTIVE      = 900
const CURSOR_RADIUS    = 250
const CURSOR_PUSH      = 0.04

// v2: curve oscillation
const CURVE_AMP        = 0.06       // max perpendicular offset as fraction of ray length
const CURVE_SPEED      = 0.0005     // oscillation frequency

// v2: color breathing (~12s cycle)
const BREATH_SPEED     = 0.000523   // 2π / 12016ms ≈ 12s period
const BREATH_MIX       = 0.45       // how much breathing dominates vs static colorT

// v2: trail config
const TRAIL_ALPHA_MULT = 0.07       // ghost opacity relative to ray alpha

// v2: pulse reaction (invisible heartbeat drives ray intensity)
const PULSE_REACT_RANGE = 0.10      // fraction of H within which rays react
const PULSE_REACT_BOOST = 0.25      // max alpha/width boost

// v2: front ray halo
const HALO_DEPTH_THRESH = 0.55      // depthFactor above which halo appears
const HALO_WIDTH_MULT   = 3.5       // halo width relative to ray width
const HALO_ALPHA_MULT   = 0.12      // halo opacity relative to ray alpha

// ── Spine (invisible heartbeat — drives ray reaction only) ───────
const PULSE_BPM         = 33
const PULSE_INTERVAL    = 60000 / PULSE_BPM

// ── Focal position ──────────────────────────────────────────────────
const FOCAL_X = 0.50
const FOCAL_Y = 0.38    // above hero title

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
      // v2 additions
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

    // v2: per-ray rotation with jitter
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

    // v2: more aggressive depth mapping
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

    // Skip: top cone lines below apex, bottom cone lines above apex
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

    // v2: pulse reaction — rays near spine pulse get boost
    let pulseBoost = 0
    if (pulseY !== null) {
      const distToPulse = Math.abs(tipY - pulseY) / H
      if (distToPulse < PULSE_REACT_RANGE) {
        pulseBoost = (1 - distToPulse / PULSE_REACT_RANGE) * PULSE_REACT_BOOST
      }
    }

    // v2: color breathing — sympathetic/parasympathetic oscillation
    const breathPhase = Math.sin(now * BREATH_SPEED) * 0.5 + 0.5
    const effectiveColorT = ray.colorT * (1 - BREATH_MIX) + breathPhase * BREATH_MIX

    // v2: curve control point
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
      // v2: trail data
      prevTipX: ray.prevTipX,
      prevTipY: ray.prevTipY,
      rayRef: ray,
    })

    // Update prev for next frame
    ray.prevTipX = tipX
    ray.prevTipY = tipY
  }
}

// ── Component ───────────────────────────────────────────────────────
export default function BreathingField() {
  const canvasRef = useRef(null)
  const raf = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W, H, dpr, maxReach
    const mouse = { x: -1, y: -1 }

    const rays = generateRays()

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const parent = canvas.parentElement
      W = parent ? parent.offsetWidth : window.innerWidth
      H = parent ? parent.offsetHeight : window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      maxReach = Math.min(W, H) * 0.70
    }

    function onMove(e) { mouse.x = e.clientX; mouse.y = e.clientY }
    function onLeave() { mouse.x = -1; mouse.y = -1 }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', resize)
    resize()

    function draw(now) {
      ctx.clearRect(0, 0, W, H)

      const pulse = 1 + Math.sin(now * PULSE_SPEED) * PULSE_AMP
      const rot = now * ROTATION_SPEED

      const cursorOn = mouse.x >= 0
      const cr2 = CURSOR_RADIUS * CURSOR_RADIUS

      // ── Invisible heartbeat (drives pulse reaction on rays) ──────
      const focalY = FOCAL_Y * H
      const beatProgress = (now % PULSE_INTERVAL) / PULSE_INTERVAL
      const pulseY = focalY - beatProgress * H * 0.3  // pulse travels upward from apex

      // ── Build draw list ──────────────────────────────────────────
      const drawList = []

      buildCone(rays,
        FOCAL_X * W, focalY,
        maxReach, pulse, rot, -1, mouse, cursorOn, cr2, drawList, H, now, pulseY)

      // Sort back-to-front
      drawList.sort((a, b) => a.depth - b.depth)

      // ── Draw rays ────────────────────────────────────────────────
      for (let i = 0; i < drawList.length; i++) {
        const d = drawList[i]

        const ct = d.colorT
        const wc = d.warmColor
        const cc = d.coolColor
        const r = wc[0] + (cc[0] - wc[0]) * ct
        const g = wc[1] + (cc[1] - wc[1]) * ct
        const b = wc[2] + (cc[2] - wc[2]) * ct

        // v2: trail ghost from previous frame
        if (d.prevTipX !== null && d.prevTipY !== null) {
          const ghostAlpha = d.alpha * TRAIL_ALPHA_MULT
          ctx.strokeStyle = `rgba(${r|0}, ${g|0}, ${b|0}, ${ghostAlpha})`
          ctx.lineWidth = d.width * 0.6
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(d.prevTipX, d.prevTipY)
          ctx.lineTo(d.tipX, d.tipY)
          ctx.stroke()
        }

        // v2: curved ray with gradient
        const grad = ctx.createLinearGradient(d.fx, d.fy, d.tipX, d.tipY)
        grad.addColorStop(0,    `rgba(${r|0}, ${g|0}, ${b|0}, ${d.alpha * 0.6})`)
        grad.addColorStop(0.25, `rgba(${r|0}, ${g|0}, ${b|0}, ${d.alpha})`)
        grad.addColorStop(0.65, `rgba(${r|0}, ${g|0}, ${b|0}, ${d.alpha * 0.45})`)
        grad.addColorStop(1,    `rgba(${r|0}, ${g|0}, ${b|0}, ${d.alpha * 0.1})`)

        ctx.strokeStyle = grad
        ctx.lineWidth = d.width
        ctx.lineCap = 'round'

        // v2: quadratic curve instead of straight line
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

        // v2: halo glow on front rays
        if (d.depthFactor > HALO_DEPTH_THRESH) {
          const haloStrength = (d.depthFactor - HALO_DEPTH_THRESH) / (1 - HALO_DEPTH_THRESH)
          const haloAlpha = d.alpha * HALO_ALPHA_MULT * haloStrength
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
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
