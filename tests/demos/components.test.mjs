// Static checks on the three demo components: required copy, no free input, no network, a11y hooks.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readText } from './helpers.mjs'
import { nextTabIndex } from '../../src/components/demos/lib/tabs.mjs'

const SRC = {
  promptLab: readText('src/components/demos/PromptLabDemo.astro'),
  editorial: readText('src/components/demos/EditorialDemo.astro'),
  polar: readText('src/components/demos/PolarDemo.astro'),
}
const LIBS = ['tabs', 'editorial', 'polar-method', 'polar-results'].map((n) => readText(`src/components/demos/lib/${n}.mjs`))

test('required copy is present verbatim', () => {
  assert.ok(SRC.promptLab.includes('9 active / 4 reserved, not run'))
  assert.ok(SRC.promptLab.includes('10 cases'))
  assert.ok(SRC.promptLab.includes('not v0.4'))
  assert.ok(SRC.promptLab.includes('No saved v0.4 output'))
  assert.ok(SRC.editorial.includes('Saved output of the local reviewer on synthetic samples. This page does not analyse your text.'))
  assert.ok(SRC.editorial.includes('No warnings ≠ approved.'))
  assert.ok(SRC.editorial.includes('approval: {String(s.result.clinical_or_publication_approval)}'))
  assert.ok(SRC.polar.includes('Retrospective, one person (N=1). Not causal, not clinically validated, not a prediction service.'))
  assert.ok(SRC.polar.includes('{method.label_en}'))
})

test('origin labels SAVED / LOCAL are rendered', () => {
  assert.ok(SRC.promptLab.includes('>SAVED<'))
  assert.ok(SRC.editorial.includes('>SAVED<'))
  assert.ok(SRC.polar.includes('>SAVED<'))
  assert.ok(SRC.polar.includes('>LOCAL<'))
})

test('no free text input, no network or model calls', () => {
  for (const [name, src] of Object.entries(SRC)) {
    assert.ok(!/<textarea/i.test(src), `${name} has a textarea`)
    assert.ok(!/type=["']text["']/i.test(src), `${name} has a text input`)
    assert.ok(!/contenteditable/i.test(src), `${name} is contenteditable`)
  }
  for (const src of [...Object.values(SRC), ...LIBS]) {
    for (const bad of ['fetch(', 'XMLHttpRequest', 'api.anthropic', 'apiKey', 'WebSocket', 'sendBeacon']) {
      assert.ok(!src.includes(bad), `found ${bad}`)
    }
  }
})

test('scripts re-initialise on astro:page-load and tabs are ARIA tabs', () => {
  for (const src of Object.values(SRC)) assert.ok(src.includes("addEventListener('astro:page-load'"))
  for (const src of [SRC.promptLab, SRC.editorial]) {
    assert.ok(src.includes('role="tablist"'))
    assert.ok(src.includes('role="tab"'))
    assert.ok(src.includes('aria-controls='))
    assert.ok(src.includes('data-tabs-index'), 'anchor index for no-JS')
  }
  assert.ok(SRC.polar.includes('type="range"'))
  assert.ok(SRC.polar.includes('aria-valuetext='))
  assert.ok(SRC.polar.includes('<table'))
  for (const src of Object.values(SRC)) assert.ok(src.includes('prefers-reduced-motion'))
})

test('nextTabIndex: arrows wrap, Home/End jump, other keys ignored', () => {
  assert.equal(nextTabIndex('ArrowRight', 0, 3), 1)
  assert.equal(nextTabIndex('ArrowRight', 2, 3), 0)
  assert.equal(nextTabIndex('ArrowLeft', 0, 3), 2)
  assert.equal(nextTabIndex('ArrowDown', 1, 3), 2)
  assert.equal(nextTabIndex('ArrowUp', 1, 3), 0)
  assert.equal(nextTabIndex('Home', 2, 3), 0)
  assert.equal(nextTabIndex('End', 0, 3), 2)
  assert.equal(nextTabIndex('Enter', 1, 3), null)
  assert.equal(nextTabIndex('ArrowRight', 0, 0), null)
})
