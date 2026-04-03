/**
 * OrganicSymbols — Canvas-based living micro-animations
 *
 * Each symbol is a tiny canvas with thin lines (~0.45px),
 * continuous breathing, and hover interaction — matching
 * the Möbius hero animation style.
 */

import { useRef, useEffect } from 'react'

/* ── Shared canvas wrapper ────────────────────────────────── */

const PALETTE = {
  teal:  [144, 167, 165],
  sea:   [93, 138, 130],
  green: [107, 158, 122],
  ice:   [133, 168, 184],
  moss:  [107, 138, 109],
  warm:  [196, 133, 90],
  sand:  [174, 156, 120],
  clay:  [168, 130, 110],
  slate: [130, 140, 148],
}

function resolveColor(cssColor) {
  for (const [name, rgb] of Object.entries(PALETTE)) {
    if (cssColor.includes(name)) return rgb
  }
  return PALETTE.teal
}

function useCanvasSymbol(size, colorStr, drawFn) {
  const canvasRef = useRef(null)
  const hovRef = useRef(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const c = resolveColor(colorStr)

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = size + 'px'
    canvas.style.height = size + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    let t0 = null, raf

    function frame(ts) {
      if (!t0) t0 = ts
      const sec = (ts - t0) / 1000
      ctx.clearRect(0, 0, size, size)
      drawFn(ctx, size, c, sec, hovRef.current)
      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [size, colorStr, drawFn])

  return { canvasRef, hovRef, wrapRef }
}

function SymbolWrap({ canvasRef, hovRef, wrapRef, className }) {
  return (
    <div
      ref={wrapRef}
      className={`org-symbol-wrap ${className || ''}`}
      onMouseEnter={() => { hovRef.current = true }}
      onMouseLeave={() => { hovRef.current = false }}
      style={{ display: 'inline-flex', cursor: 'default' }}
    >
      <canvas
        ref={canvasRef}
        className="org-canvas"
        style={{ transition: 'filter 0.5s ease' }}
      />
    </div>
  )
}


/* ── 1. PulseSymbol — thin ECG line that traces + breathes ── */

function drawPulse(ctx, S, c, t, hov) {
  const cx = S / 2, cy = S / 2
  const breathe = 1 + Math.sin(t * 0.8) * 0.05
  const alpha = hov ? 0.42 : 0.2
  const lw = hov ? 0.65 : 0.4

  // ECG wave path
  const amp = S * 0.25 * breathe
  const w = S * 0.8
  const x0 = S * 0.1

  ctx.beginPath()
  ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`
  ctx.lineWidth = lw
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  const points = [
    [0, 0], [0.25, 0], [0.32, -0.15], [0.38, 0.6],
    [0.42, -0.85], [0.48, 0.35], [0.55, -0.08], [0.62, 0], [1, 0]
  ]

  for (let i = 0; i < points.length; i++) {
    const px = x0 + points[i][0] * w
    const py = cy + points[i][1] * amp
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.stroke()

  // Traveling dot along the ECG
  const progress = (t * 0.35) % 1
  const seg = progress * (points.length - 1)
  const idx = Math.floor(seg)
  const frac = seg - idx
  const next = Math.min(idx + 1, points.length - 1)
  const dx = x0 + (points[idx][0] + (points[next][0] - points[idx][0]) * frac) * w
  const dy = cy + (points[idx][1] + (points[next][1] - points[idx][1]) * frac) * amp

  // Glow
  ctx.beginPath()
  ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${hov ? 0.12 : 0.04})`
  ctx.arc(dx, dy, hov ? 5 : 3.5, 0, Math.PI * 2)
  ctx.fill()
  // Core
  ctx.beginPath()
  ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${hov ? 0.8 : 0.38})`
  ctx.arc(dx, dy, hov ? 1.6 : 1.1, 0, Math.PI * 2)
  ctx.fill()

  // Breathing ring
  const ringR = (S * 0.32) * breathe
  ctx.beginPath()
  ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${(hov ? 0.15 : 0.06) * (0.7 + Math.sin(t * 1.2) * 0.3)})`
  ctx.lineWidth = 0.3
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
  ctx.stroke()
}

export function PulseSymbol({ color = 'var(--sea)', size = 44, className = '' }) {
  const { canvasRef, hovRef, wrapRef } = useCanvasSymbol(size, color, drawPulse)
  return <SymbolWrap canvasRef={canvasRef} hovRef={hovRef} wrapRef={wrapRef} className={className} />
}


/* ── 2. OrbitSymbol — thin ring + orbiting dot ──────────── */

function drawOrbit(ctx, S, c, t, hov) {
  const cx = S / 2, cy = S / 2
  const breathe = 1 + Math.sin(t * 0.7) * 0.04
  const R = S * 0.34 * breathe
  const alpha = hov ? 0.38 : 0.16

  // Orbit ring
  ctx.beginPath()
  ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`
  ctx.lineWidth = hov ? 0.6 : 0.35
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.stroke()

  // Inner whisper ring
  ctx.beginPath()
  ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha * 0.4})`
  ctx.lineWidth = 0.25
  ctx.arc(cx, cy, R * 0.45, 0, Math.PI * 2)
  ctx.stroke()

  // Orbiting dot
  const angle = t * 0.6
  const dx = cx + Math.cos(angle) * R
  const dy = cy + Math.sin(angle) * R

  ctx.beginPath()
  ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${hov ? 0.12 : 0.03})`
  ctx.arc(dx, dy, hov ? 5 : 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${hov ? 0.8 : 0.4})`
  ctx.arc(dx, dy, hov ? 1.6 : 1, 0, Math.PI * 2)
  ctx.fill()

  // Second slower dot — opposite
  const a2 = t * 0.35 + Math.PI
  const dx2 = cx + Math.cos(a2) * R * 0.45
  const dy2 = cy + Math.sin(a2) * R * 0.45

  ctx.beginPath()
  ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${hov ? 0.6 : 0.25})`
  ctx.arc(dx2, dy2, hov ? 1.2 : 0.8, 0, Math.PI * 2)
  ctx.fill()

  // Center dot
  ctx.beginPath()
  ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${hov ? 0.4 : 0.12})`
  ctx.arc(cx, cy, 1 * breathe, 0, Math.PI * 2)
  ctx.fill()
}

export function OrbitSymbol({ color = 'var(--teal)', size = 44, className = '' }) {
  const { canvasRef, hovRef, wrapRef } = useCanvasSymbol(size, color, drawOrbit)
  return <SymbolWrap canvasRef={canvasRef} hovRef={hovRef} wrapRef={wrapRef} className={className} />
}


/* ── 3. SignalSymbol — undulating sine wave + traveling dots ── */

function drawSignal(ctx, S, c, t, hov) {
  const cy = S / 2
  const breathe = 1 + Math.sin(t * 0.9) * 0.06
  const alpha = hov ? 0.40 : 0.18
  const amp = S * 0.22 * breathe
  const pad = S * 0.08

  // Flowing sine wave
  ctx.beginPath()
  ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`
  ctx.lineWidth = hov ? 0.6 : 0.38
  ctx.lineCap = 'round'

  for (let x = pad; x <= S - pad; x += 1) {
    const norm = (x - pad) / (S - 2 * pad)
    const y = cy + Math.sin(norm * Math.PI * 2.5 + t * 0.8) * amp * (0.4 + norm * 0.6)
    x === pad ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()

  // Second harmonic wave — lighter
  ctx.beginPath()
  ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha * 0.5})`
  ctx.lineWidth = 0.25
  for (let x = pad; x <= S - pad; x += 1) {
    const norm = (x - pad) / (S - 2 * pad)
    const y = cy + Math.sin(norm * Math.PI * 4 + t * 1.2 + 1) * amp * 0.35
    x === pad ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()

  // Traveling dot on main wave
  const prog = (t * 0.3) % 1
  const px = pad + prog * (S - 2 * pad)
  const py = cy + Math.sin(prog * Math.PI * 2.5 + t * 0.8) * amp * (0.4 + prog * 0.6)

  ctx.beginPath()
  ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${hov ? 0.12 : 0.04})`
  ctx.arc(px, py, hov ? 5 : 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${hov ? 0.8 : 0.38})`
  ctx.arc(px, py, hov ? 1.5 : 1, 0, Math.PI * 2)
  ctx.fill()
}

export function SignalSymbol({ color = 'var(--green)', size = 44, className = '' }) {
  const { canvasRef, hovRef, wrapRef } = useCanvasSymbol(size, color, drawSignal)
  return <SymbolWrap canvasRef={canvasRef} hovRef={hovRef} wrapRef={wrapRef} className={className} />
}


/* ── 4. CellSymbol — morphing ellipse + drifting organelles ── */

function drawCell(ctx, S, c, t, hov) {
  const cx = S / 2, cy = S / 2
  const alpha = hov ? 0.38 : 0.16
  const lw = hov ? 0.6 : 0.38

  // Morphing membrane
  ctx.beginPath()
  ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`
  ctx.lineWidth = lw
  const steps = 80
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const wobble = 1 + Math.sin(a * 3 + t * 0.6) * 0.08 + Math.sin(a * 5 + t * 0.9) * 0.04
    const rx = S * 0.35 * wobble
    const ry = S * 0.30 * (1 + Math.sin(t * 0.5) * 0.06) * wobble
    const x = cx + Math.cos(a) * rx
    const y = cy + Math.sin(a) * ry
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.stroke()

  // Inner membrane
  ctx.beginPath()
  ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha * 0.4})`
  ctx.lineWidth = 0.25
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const wobble = 1 + Math.sin(a * 2 + t * 0.8 + 1) * 0.1
    const rx = S * 0.18 * wobble
    const ry = S * 0.16 * wobble
    const x = cx + Math.cos(a) * rx
    const y = cy + Math.sin(a) * ry
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.stroke()

  // Drifting organelles
  const orgs = [
    { speed: 0.4, dist: 0.22, phase: 0 },
    { speed: 0.3, dist: 0.15, phase: 2.1 },
    { speed: 0.25, dist: 0.1, phase: 4.2 },
  ]
  for (const o of orgs) {
    const ox = cx + Math.cos(t * o.speed + o.phase) * S * o.dist
    const oy = cy + Math.sin(t * o.speed * 1.3 + o.phase) * S * o.dist * 0.8
    ctx.beginPath()
    ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${hov ? 0.6 : 0.25})`
    ctx.arc(ox, oy, hov ? 1.3 : 0.9, 0, Math.PI * 2)
    ctx.fill()
  }

  // Nucleus
  ctx.beginPath()
  ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${hov ? 0.35 : 0.1})`
  const nR = (S * 0.06) * (1 + Math.sin(t * 0.7) * 0.15)
  ctx.arc(cx, cy, nR, 0, Math.PI * 2)
  ctx.fill()
}

export function CellSymbol({ color = 'var(--warm)', size = 44, className = '' }) {
  const { canvasRef, hovRef, wrapRef } = useCanvasSymbol(size, color, drawCell)
  return <SymbolWrap canvasRef={canvasRef} hovRef={hovRef} wrapRef={wrapRef} className={className} />
}


/* ── 5. NetworkSymbol — 3 nodes + thin edges + traveling packet ── */

function drawNetwork(ctx, S, c, t, hov) {
  const alpha = hov ? 0.38 : 0.16
  const lw = hov ? 0.55 : 0.35

  // 3 node positions — gently drifting
  const nodes = [
    { bx: 0.25, by: 0.25, drift: 0 },
    { bx: 0.75, by: 0.35, drift: 1.5 },
    { bx: 0.45, by: 0.78, drift: 3 },
  ]
  const pts = nodes.map(n => ({
    x: n.bx * S + Math.sin(t * 0.4 + n.drift) * S * 0.03,
    y: n.by * S + Math.cos(t * 0.35 + n.drift) * S * 0.03,
  }))

  // Edges
  ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`
  ctx.lineWidth = lw
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      ctx.beginPath()
      ctx.moveTo(pts[i].x, pts[i].y)
      ctx.lineTo(pts[j].x, pts[j].y)
      ctx.stroke()
    }
  }

  // Nodes
  for (const p of pts) {
    ctx.beginPath()
    ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${hov ? 0.1 : 0.04})`
    ctx.arc(p.x, p.y, hov ? 4.5 : 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${hov ? 0.75 : 0.35})`
    ctx.arc(p.x, p.y, hov ? 1.4 : 0.9, 0, Math.PI * 2)
    ctx.fill()
  }

  // Traveling data packet along edges
  const totalEdges = 3
  const edgePairs = [[0,1],[1,2],[2,0]]
  const cycleT = (t * 0.4) % totalEdges
  const edgeIdx = Math.floor(cycleT)
  const frac = cycleT - edgeIdx
  const [a, b] = edgePairs[edgeIdx]
  const px = pts[a].x + (pts[b].x - pts[a].x) * frac
  const py = pts[a].y + (pts[b].y - pts[a].y) * frac

  ctx.beginPath()
  ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${hov ? 0.85 : 0.4})`
  ctx.arc(px, py, hov ? 1.6 : 1, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${hov ? 0.12 : 0.03})`
  ctx.arc(px, py, hov ? 5 : 3, 0, Math.PI * 2)
  ctx.fill()
}

export function NetworkSymbol({ color = 'var(--ice)', size = 44, className = '' }) {
  const { canvasRef, hovRef, wrapRef } = useCanvasSymbol(size, color, drawNetwork)
  return <SymbolWrap canvasRef={canvasRef} hovRef={hovRef} wrapRef={wrapRef} className={className} />
}


/* ── 6. HelixSymbol — two thin twisting strands + rungs ──── */

function drawHelix(ctx, S, c, t, hov) {
  const alpha = hov ? 0.38 : 0.17
  const lw = hov ? 0.6 : 0.38
  const pad = S * 0.1
  const h = S - 2 * pad
  const cx = S / 2
  const amp = S * 0.22
  const twist = 2.5

  // Two helix strands
  for (const sign of [1, -1]) {
    ctx.beginPath()
    ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`
    ctx.lineWidth = lw
    ctx.lineCap = 'round'
    for (let i = 0; i <= 60; i++) {
      const frac = i / 60
      const y = pad + frac * h
      const phase = frac * Math.PI * twist + t * 0.5
      const x = cx + Math.sin(phase) * amp * sign * (1 + Math.sin(t * 0.6) * 0.05)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // Cross rungs
  const rungs = 6
  for (let r = 0; r < rungs; r++) {
    const frac = (r + 0.5) / rungs
    const y = pad + frac * h
    const phase = frac * Math.PI * twist + t * 0.5
    const x1 = cx + Math.sin(phase) * amp * (1 + Math.sin(t * 0.6) * 0.05)
    const x2 = cx - Math.sin(phase) * amp * (1 + Math.sin(t * 0.6) * 0.05)
    const depth = Math.cos(phase)
    const rungAlpha = alpha * (0.3 + Math.abs(depth) * 0.5)

    ctx.beginPath()
    ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${rungAlpha})`
    ctx.lineWidth = 0.25
    ctx.moveTo(x1, y)
    ctx.lineTo(x2, y)
    ctx.stroke()
  }

  // Traveling dot up the helix
  const prog = (t * 0.15) % 1
  const py = pad + prog * h
  const phase = prog * Math.PI * twist + t * 0.5
  const px = cx + Math.sin(phase) * amp * (1 + Math.sin(t * 0.6) * 0.05)

  ctx.beginPath()
  ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${hov ? 0.8 : 0.35})`
  ctx.arc(px, py, hov ? 1.5 : 1, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${hov ? 0.12 : 0.03})`
  ctx.arc(px, py, hov ? 5 : 3, 0, Math.PI * 2)
  ctx.fill()
}

export function HelixSymbol({ color = 'var(--sea)', size = 44, className = '' }) {
  const { canvasRef, hovRef, wrapRef } = useCanvasSymbol(size, color, drawHelix)
  return <SymbolWrap canvasRef={canvasRef} hovRef={hovRef} wrapRef={wrapRef} className={className} />
}


/* ── Ambient floating decorators for margins ─────────────── */

export function FloatingDecorators() {
  return (
    <div className="floating-deco" aria-hidden="true">
      <span className="deco deco--plus deco--1">+</span>
      <span className="deco deco--dot deco--2" />
      <span className="deco deco--ring deco--3" />
      <span className="deco deco--plus deco--4">+</span>
      <span className="deco deco--dot deco--5" />

      <style>{`
        .floating-deco {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .deco {
          position: absolute;
          display: block;
          color: var(--teal);
          opacity: 0;
          animation: decoFloat 8s ease-in-out infinite;
        }
        .deco--plus {
          font-family: var(--mono);
          font-size: 14px;
          font-weight: 300;
          line-height: 1;
        }
        .deco--dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--teal);
        }
        .deco--ring {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 0.8px solid var(--sea);
        }
        .deco--1 { top: 18%; left: 5%; animation-delay: 0s; color: var(--teal); }
        .deco--2 { top: 38%; right: 6%; animation-delay: 2s; background: var(--sea); }
        .deco--3 { top: 55%; left: 4%; animation-delay: 4s; border-color: var(--green); }
        .deco--4 { top: 72%; right: 5%; animation-delay: 1s; color: var(--warm); }
        .deco--5 { top: 88%; left: 7%; animation-delay: 3s; background: var(--ice); }

        @keyframes decoFloat {
          0%, 100% { opacity: 0; transform: translateY(0px) rotate(0deg); }
          20% { opacity: 0.28; }
          50% { opacity: 0.18; transform: translateY(-8px) rotate(45deg); }
          80% { opacity: 0.28; }
        }
        @media (max-width: 768px) {
          .floating-deco { display: none; }
        }
      `}</style>
    </div>
  )
}

/* ── Section eyebrow icon helper ─────────────────────────── */
export const SECTION_SYMBOLS = {
  clinical: PulseSymbol,
  flagship: SignalSymbol,
  founder: CellSymbol,
  systems: NetworkSymbol,
  published: HelixSymbol,
  contact: OrbitSymbol,
}
