// Schema, origin labels and privacy checks for every published demo fixture.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DATA, FIXTURES, ROOT, listFiles, readJson, walk } from './helpers.mjs'

const ORIGINS = new Set(['SAVED', 'LOCAL'])

test('every demo fixture parses and has schema_version 1 and a demo id', () => {
  for (const rel of Object.values(FIXTURES)) {
    const d = readJson(rel)
    assert.equal(d.schema_version, 1, rel)
    assert.equal(typeof d.demo, 'string', rel)
    assert.equal(typeof d.generator, 'string', rel)
    assert.match(d.generator, /^node src\/data\/demos\/_tools\/build-[a-z-]+\.mjs/, rel)
  }
})

test('origin labels: every shown result carries SAVED or LOCAL', () => {
  const ed = readJson(FIXTURES.editorial)
  assert.equal(ed.origin, 'SAVED')
  for (const s of ed.samples) assert.equal(s.origin, 'SAVED', s.id)

  const pl = readJson(FIXTURES.promptLab)
  assert.equal(pl.historical_summary.origin, 'SAVED')
  assert.equal(pl.synthetic_replay.origin, 'SAVED')
  for (const c of pl.cases) assert.equal(c.historical.origin, 'SAVED', c.id)

  assert.equal(readJson(FIXTURES.polarResults).origin, 'SAVED')
  const method = readJson(FIXTURES.polarMethod)
  assert.equal(method.origin, 'LOCAL')
  assert.equal(method.synthetic, true)

  for (const rel of Object.values(FIXTURES)) {
    for (const [k, v, path] of walk(readJson(rel))) {
      if (k === 'origin') assert.ok(ORIGINS.has(v), `${rel} ${path} = ${v}`)
    }
  }
})

test('no private fields and no local /Users/ paths in any published demo data', () => {
  const files = listFiles(DATA).filter((p) => !p.includes(`${'/'}_tools${'/'}`))
  assert.ok(files.length > 0)
  for (const abs of files) {
    const text = readFileSync(abs, 'utf8')
    const rel = abs.slice(ROOT.length + 1)
    assert.ok(!text.includes('/Users/'), `${rel} contains /Users/`)
    assert.ok(!/private-models|private-[a-z]+\.json/i.test(text), `${rel} mentions a private-* artefact`)
    if (abs.endsWith('.json')) {
      for (const [k, , path] of walk(JSON.parse(text))) {
        assert.ok(!/^private/i.test(k), `${rel} has private field at ${path}`)
      }
    }
  }
})

test('Polar fixtures do not copy diary column names', () => {
  const DIARY_COLUMNS = ['severidad_global', 'fatiga', 'niebla_mental', 'disfuncion_autonomica']
  for (const rel of [FIXTURES.polarResults, FIXTURES.polarMethod]) {
    const text = readFileSync(`${ROOT}/${rel}`, 'utf8')
    for (const col of DIARY_COLUMNS) assert.ok(!text.includes(col), `${rel} contains ${col}`)
    for (const [k, , path] of walk(JSON.parse(text))) assert.notEqual(k, 'column', `${rel} ${path}`)
  }
})

test('generators contain no network or model calls', () => {
  const tools = listFiles(`${DATA}/_tools`)
  for (const abs of tools) {
    const text = readFileSync(abs, 'utf8')
    for (const bad of ['fetch(', 'http.request', 'https.request', 'api.anthropic', 'apiKey', 'XMLHttpRequest']) {
      assert.ok(!text.includes(bad), `${abs.slice(ROOT.length + 1)} contains ${bad}`)
    }
  }
})
