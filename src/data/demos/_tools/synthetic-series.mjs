// Deterministic synthetic series for the Polar method view. Not real data.
// mulberry32: tiny seeded PRNG, so the same seed always yields the same series.
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** [{day, signal, label}] for days 1..nDays. signal in [0.05, 0.95]; label 0/1. */
export function makeSeries(seed, nDays) {
  const rand = mulberry32(seed)
  const days = []
  let level = 0.5
  for (let d = 1; d <= nDays; d++) {
    level = Math.min(0.95, Math.max(0.05, level + 0.35 * (0.5 - level) + (rand() - 0.5) * 0.5))
    const signal = Math.round(level * 100) / 100
    const prev = d > 1 ? days[d - 2].signal : signal
    const label = rand() < 0.25 + 0.5 * prev ? 1 : 0
    days.push({ day: d, signal, label })
  }
  return days
}
