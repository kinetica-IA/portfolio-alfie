// Pure grain-tile generator used by src/components/GrainHoverBackground.jsx
// and by scripts/generate-og.mjs. No DOM: returns RGBA pixels that the caller
// puts into an ImageData (browser) or a raw buffer (sharp).
//
// Same look as the original per-viewport loop: 1 CSS px cells, 80% density,
// five Kinetica teal tones, alpha = 0.27 * (0.3..1.0). The difference is that
// the noise is generated once for a small tile that the canvas repeats as a
// pattern, instead of for every cell of the viewport every 3.5 s.

export const TEAL_TONES = [
  [140, 188, 183],
  [147, 191, 186],
  [93, 138, 130],
  [106, 134, 144],
  [145, 186, 172],
]

export const GRAIN_DEFAULTS = Object.freeze({
  opacity: 0.27,
  density: 0.8,
  tileCss: 256, // tile side in CSS px (cells)
  maxTileCss: 512,
})

// mulberry32: small deterministic PRNG so a seed always gives the same tile.
export function mulberry32(seed) {
  let a = seed >>> 0
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Generate one square grain tile.
 * @param {object} [o]
 * @param {number} [o.tileCss=256]  cells per side (1 cell = 1 CSS px); clamped to 1..512
 * @param {number} [o.cell=1]       device pixels per cell (round(dpr)); clamped to 1..4
 * @param {number} [o.seed=1]
 * @param {number} [o.opacity=0.27]
 * @param {number} [o.density=0.8]
 * @returns {{ width: number, height: number, data: Uint8ClampedArray, cells: number, painted: number }}
 */
export function generateGrainTile(o = {}) {
  const tileCss = Math.max(1, Math.min(GRAIN_DEFAULTS.maxTileCss, Math.round(o.tileCss ?? GRAIN_DEFAULTS.tileCss)))
  const cell = Math.max(1, Math.min(4, Math.round(o.cell ?? 1)))
  const opacity = o.opacity ?? GRAIN_DEFAULTS.opacity
  const density = o.density ?? GRAIN_DEFAULTS.density
  const rand = mulberry32(o.seed ?? 1)

  const side = tileCss * cell
  const data = new Uint8ClampedArray(side * side * 4)
  const nTones = TEAL_TONES.length
  let painted = 0

  for (let row = 0; row < tileCss; row++) {
    for (let col = 0; col < tileCss; col++) {
      // Same draw order as the original: skip test, tone, alpha.
      if (rand() > density) continue
      const tone = TEAL_TONES[(rand() * nTones) | 0]
      const a = Math.round(opacity * (0.3 + rand() * 0.7) * 255)
      painted++
      const y0 = row * cell
      const x0 = col * cell
      for (let dy = 0; dy < cell; dy++) {
        let p = ((y0 + dy) * side + x0) * 4
        for (let dx = 0; dx < cell; dx++) {
          data[p] = tone[0]
          data[p + 1] = tone[1]
          data[p + 2] = tone[2]
          data[p + 3] = a
          p += 4
        }
      }
    }
  }
  return { width: side, height: side, data, cells: tileCss * tileCss, painted }
}
