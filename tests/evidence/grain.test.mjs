// node --test tests/evidence/*.test.mjs
// Grain tile: bounded, deterministic; plus a reproducible before/after measurement.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateGrainTile, mulberry32, TEAL_TONES } from '../../src/components/evidence/grain-tile.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

test('tile size is bounded and follows the cell size', () => {
  const t = generateGrainTile({ tileCss: 256, cell: 2, seed: 3 })
  assert.equal(t.width, 512)
  assert.equal(t.height, 512)
  assert.equal(t.data.length, 512 * 512 * 4)
  assert.equal(t.cells, 256 * 256)
  const huge = generateGrainTile({ tileCss: 100000, cell: 99, seed: 1 })
  assert.equal(huge.width, 512 * 4) // clamped to 512 cells x 4 px
  const tiny = generateGrainTile({ tileCss: 0, cell: 0 })
  assert.equal(tiny.width, 1)
})

test('same seed gives the same tile; another seed differs', () => {
  const a = generateGrainTile({ seed: 42 })
  const b = generateGrainTile({ seed: 42 })
  const c = generateGrainTile({ seed: 43 })
  assert.deepEqual(a.data, b.data)
  assert.notDeepEqual(a.data, c.data)
  assert.equal(mulberry32(9)(), mulberry32(9)())
})

test('tile keeps the original look: tones, density ~80%, alpha 0.27*(0.3..1)', () => {
  const t = generateGrainTile({ seed: 5 })
  const tones = new Set(TEAL_TONES.map((c) => c.join(',')))
  let painted = 0
  for (let p = 0; p < t.data.length; p += 4) {
    const a = t.data[p + 3]
    if (a === 0) continue
    painted++
    assert.ok(tones.has(`${t.data[p]},${t.data[p + 1]},${t.data[p + 2]}`))
    assert.ok(a >= Math.floor(0.27 * 0.3 * 255) && a <= Math.ceil(0.27 * 255))
  }
  assert.equal(painted, t.painted)
  const density = painted / t.cells
  assert.ok(density > 0.78 && density < 0.82, `density ${density}`)
})

// ── Measurement ──────────────────────────────────────────────────────────
// "Before" reproduces the previous generateGrain() loop of GrainHoverBackground.jsx
// (git 6e17e9d, lines 46-65) with a counting 2D-context stub.
const TONES = TEAL_TONES
function legacyGenerate(W, H, dpr, ctx) {
  const s = Math.max(1, Math.round(1 * dpr))
  const cols = Math.ceil(W / s)
  const rows = Math.ceil(H / s)
  const total = cols * rows
  for (let i = 0; i < total; i++) {
    if (Math.random() > 0.8) continue
    const tone = TONES[(Math.random() * TONES.length) | 0]
    const a = 0.27 * (0.3 + Math.random() * 0.7)
    const col = i % cols
    const row = (i / cols) | 0
    ctx.fillStyle = `rgba(${tone[0]},${tone[1]},${tone[2]},${a.toFixed(3)})`
    ctx.fillRect(col * s, row * s, s, s)
  }
  return total
}

function median(xs) { const s = [...xs].sort((a, b) => a - b); return s[s.length >> 1] }
function time(fn, runs = 5) {
  const out = []
  for (let i = 0; i < runs; i++) { const t0 = performance.now(); fn(); out.push(performance.now() - t0) }
  return median(out)
}

test('measurement: per-generation work and idle work, before vs after', (t) => {
  const viewports = [
    { name: 'mobile 390x844 @2x', w: 390, h: 844, dpr: 2 },
    { name: 'desktop 1275x717 @2x', w: 1275, h: 717, dpr: 2 },
  ]
  const rows = []
  for (const v of viewports) {
    const W = Math.round(v.w * v.dpr)
    const H = Math.round(v.h * v.dpr)
    let fillRects = 0
    const ctx = { fillStyle: '', fillRect() { fillRects++ } }
    const cells = legacyGenerate(W, H, v.dpr, ctx)
    const legacyMs = time(() => legacyGenerate(W, H, v.dpr, { fillStyle: '', fillRect() {} }))
    const tile = generateGrainTile({ tileCss: 256, cell: Math.round(v.dpr), seed: 1 })
    const tileMs = time(() => generateGrainTile({ tileCss: 256, cell: Math.round(v.dpr), seed: 1 }))
    rows.push({
      viewport: v.name,
      before_cells_per_generation: cells,
      before_fillRect_and_fillStyle_strings: fillRects,
      before_generations_per_idle_minute: +(60000 / 3500).toFixed(1),
      before_full_canvas_frames_per_idle_minute: 3600, // rAF draw() at ~60 Hz with no pointer
      before_ms_per_generation_median: +legacyMs.toFixed(2),
      after_cells_once: tile.cells,
      after_fillRect_calls: 0, // pixels written into one ImageData
      after_generations_per_idle_minute: 0,
      after_frames_per_idle_minute: 0,
      after_ms_per_tile_median: +tileMs.toFixed(2),
    })
    assert.ok(tile.cells * 4 < cells, 'tile must be far smaller than the viewport grid')
  }
  t.diagnostic(JSON.stringify(rows, null, 2))
  if (process.env.GRAIN_MEASURE_OUT) fs.writeFileSync(process.env.GRAIN_MEASURE_OUT, JSON.stringify(rows, null, 2))
})

test('component: no interval, rAF only on demand, static frame under reduced motion, cleanup', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/components/GrainHoverBackground.jsx'), 'utf8')
  assert.doesNotMatch(src, /setInterval/)
  assert.match(src, /generateGrainTile/)
  assert.match(src, /createPattern\(tc, 'repeat'\)/)
  assert.match(src, /prefers-reduced-motion: reduce/)
  assert.match(src, /resize\(\) \/\/ first paint/)
  for (const ev of ['resize', 'mousemove', 'touchmove', 'touchend', 'touchcancel', 'blur']) {
    assert.match(src, new RegExp(`removeEventListener\\('${ev}'`), `missing cleanup for ${ev}`)
  }
  assert.match(src, /cancelAnimationFrame\(raf\)/)
  assert.match(src, /mq\.removeEventListener\('change'/)
})
