// node --test tests/evidence/*.test.mjs
// Reads PNG dimensions from the IHDR chunk, so it needs no image library.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const NAMES = ['home', 'projects', 'website', 'prompt-lab', 'polar', 'editorial-checker', 'es']
const MANIFEST = path.join(ROOT, 'src/components/evidence/og-manifest.json')
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function pngSize(buf) {
  assert.ok(buf.subarray(0, 8).equals(PNG_SIG), 'not a PNG')
  assert.equal(buf.toString('ascii', 12, 16), 'IHDR')
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

const havePngs = NAMES.some((n) => fs.existsSync(path.join(ROOT, 'public/og', `${n}.png`)))

test('OG images: all seven exist, are 1200x630 PNG and match the manifest', { skip: !havePngs && 'no PNGs generated yet' }, () => {
  assert.ok(fs.existsSync(MANIFEST), 'og-manifest.json missing')
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
  assert.deepEqual(Object.keys(manifest).sort(), [...NAMES].sort())
  for (const name of NAMES) {
    const entry = manifest[name]
    assert.equal(entry.path, `/og/${name}.png`)
    const buf = fs.readFileSync(path.join(ROOT, 'public', entry.path))
    assert.deepEqual(pngSize(buf), { width: 1200, height: 630 }, name)
    assert.equal(entry.width, 1200)
    assert.equal(entry.height, 630)
    assert.equal(createHash('sha256').update(buf).digest('hex'), entry.sha256, `${name} sha256`)
    assert.equal(entry.bytes, buf.length)
    assert.ok(entry.title.trim().length > 0 && entry.alt.trim().length > 0)
    assert.equal(entry.lang, name === 'es' ? 'es' : 'en')
  }
})

test('OG cards use the approved English headline and the Spanish clinical title', async () => {
  const { CARDS } = await import('../../scripts/generate-og.mjs')
  assert.deepEqual(CARDS.map((c) => c.name), NAMES)
  assert.equal(CARDS.find((c) => c.name === 'home').title, 'AI-assisted workflows, built to be checked.')
  assert.equal(CARDS.find((c) => c.name === 'es').title, 'Kinetica AI — Osteopatía y biomecánica')
  assert.match(CARDS.find((c) => c.name === 'polar').tag, /N=1, retrospective/)
  assert.match(CARDS.find((c) => c.name === 'editorial-checker').tag, /approval: false/)
})
