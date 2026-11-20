// WCAG 2.x contrast checks for the text and focus tokens in src/styles/tokens.css.
// Run: node --test tests/site/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8')
const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')))

function token(name) {
  const m = root.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`))
  assert.ok(m, `token --${name} not found as a hex value`)
  return m[1]
}
const channel = (hex, i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255
const lin = c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const lum = hex => 0.2126 * lin(channel(hex, 0)) + 0.7152 * lin(channel(hex, 1)) + 0.0722 * lin(channel(hex, 2))
export function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
// --fill-teal (rgba(144,167,165,0.10)) composited over --bg
const FILL_TEAL = '#e6f1f1'

test('ratio() matches known WCAG values', () => {
  assert.equal(ratio('#000000', '#ffffff').toFixed(1), '21.0')
  assert.equal(ratio('#777777', '#ffffff').toFixed(2), '4.48')
})

test('original tokens that motivated the change are below AA (documented)', () => {
  const bg = token('bg')
  assert.ok(ratio('#7a9e97', bg) < 3)   // old --text-dim, now --text-dim-soft
  assert.ok(ratio('#90a7a5', bg) < 3)   // --teal, old focus ring
})

for (const name of ['text', 'text-heading', 'text-sec', 'text-dim', 'green-text', 'sea-text', 'teal-text', 'clay-text', 'warm-text']) {
  test(`--${name} >= 4.5:1 on --bg and on --fill-teal`, () => {
    const bg = token('bg')
    assert.ok(ratio(token(name), bg) >= 4.5, `${name} on bg = ${ratio(token(name), bg).toFixed(2)}`)
    assert.ok(ratio(token(name), FILL_TEAL) >= 4.5, `${name} on fill-teal = ${ratio(token(name), FILL_TEAL).toFixed(2)}`)
  })
}

test('--focus-ring >= 3:1 on --bg and on --fill-teal', () => {
  const ring = token('focus-ring')
  assert.ok(ratio(ring, token('bg')) >= 3)
  assert.ok(ratio(ring, FILL_TEAL) >= 3)
})

test('white text on --green-text (primary button hover) >= 4.5:1', () => {
  assert.ok(ratio('#ffffff', token('green-text')) >= 4.5)
})

test('focus-visible and links use the new tokens', () => {
  assert.match(css, /:focus-visible\s*\{[^}]*var\(--focus-ring\)/)
  assert.match(css, /\ba\s*\{[^}]*color:\s*var\(--link\)/)
  assert.match(root, /--header-h:\s*56px/)
  assert.match(css, /scroll-padding-top:\s*calc\(var\(--header-h\)/)
})
