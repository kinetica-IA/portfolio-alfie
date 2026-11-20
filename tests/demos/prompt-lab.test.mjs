// Prompt Lab fixture: public sources only, honest labels, no v0.4 attribution.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { FIXTURES, ROOT, readJson, sha256, sha256File } from './helpers.mjs'

const pl = readJson(FIXTURES.promptLab)
const hist = readJson('public/portfolio-demo/PROMPT-LAB-EVALUACION-REAL-2026-11-16.json')
const replay = readJson('public/portfolio-demo/PROMPT-LAB-REPLAY-SINTETICO.json')

test('schema and public source with commit SHA', () => {
  assert.equal(pl.demo, 'prompt-lab')
  assert.equal(pl.public_repo.url, 'https://github.com/kinetica-IA/prompt-lab')
  assert.match(pl.public_repo.commit, /^[0-9a-f]{40}$/)
  assert.equal(pl.public_repo.auditor_version, 'v0.4')
  for (const f of [pl.public_repo.auditor_file, pl.public_repo.bank_file]) {
    assert.equal(f.commit, pl.public_repo.commit)
    assert.match(f.sha256, /^[0-9a-f]{64}$/)
    assert.equal(f.matches_manifest, true)
  }
  assert.ok(pl.cases.length >= 3)
})

test('no v0.4 output is claimed: all marked pending', () => {
  assert.equal(pl.public_repo.v04_saved_outputs_public, false)
  for (const c of pl.cases) {
    assert.equal(c.v04_output.available, false, c.id)
    assert.equal(c.v04_output.status, 'pending', c.id)
    assert.ok(!('output' in c.v04_output), c.id)
  }
})

test('historical evaluation is labelled as not v0.4 and keeps 10 cases', () => {
  assert.equal(pl.historical_summary.text, '10 cases')
  assert.equal(pl.historical_summary.cases, 10)
  assert.match(pl.historical_summary.label, /historical 16 Nov evaluation, not v0\.4/)
  for (const c of pl.cases) {
    assert.match(c.historical.label, /not v0\.4/)
    assert.equal(c.historical.version, 'not v0.4')
    assert.ok(['human', 'model', 'none'].includes(c.historical.review))
    assert.equal(c.historical.review, 'none')
  }
  assert.equal(pl.synthetic_replay.label, 'synthetic replay')
  assert.equal(pl.bank_status.text, '9 active / 4 reserved, not run')
})

test('historical values equal the public 16 Nov JSON', () => {
  const src = 'public/portfolio-demo/PROMPT-LAB-EVALUACION-REAL-2026-11-16.json'
  assert.equal(pl.historical_summary.source.sha256, sha256File(src))
  assert.equal(pl.historical_summary.date, hist.date)
  assert.equal(pl.historical_summary.responses, hist.responses)
  assert.equal(pl.historical_summary.human_reviews, hist.human_reviews)
  assert.equal(pl.historical_summary.baseline.automatic_pass, hist.variants.baseline.automatic_pass)
  assert.equal(pl.historical_summary.candidate.automatic_pass, hist.variants.candidate.automatic_pass)
  for (const c of pl.cases) {
    assert.equal(c.historical.date, hist.date)
    assert.equal(c.historical.model_observed, hist.model_observed)
    for (const v of c.historical.variants) {
      const h = hist.cases.find((x) => x.case === c.id && x.variant === v.variant)
      assert.ok(h, `${c.id} ${v.variant}`)
      assert.equal(v.decision, h.decision)
      assert.equal(v.automatic_checks_pass, h.automatic_checks.pass)
      assert.deepEqual(v.automatic_check_errors, h.automatic_checks.errors)
      assert.equal(v.response_sha256, h.sha256)
    }
  }
  assert.deepEqual(pl.synthetic_replay.steps, replay.steps)
  assert.equal(pl.synthetic_replay.real_passed_responses, replay.real_passed_responses)
})

// Optional: compare with the read-only public clone when it is present next to the web copy.
const CLONE = resolve(ROOT, '..', 'prompt-lab-public-demos', 'prompt-lab')
test('original prompts and rubrics equal the public bank (needs local clone)', { skip: !existsSync(join(CLONE, 'tests/development.json')) && 'public clone not present' }, () => {
  const raw = readFileSync(join(CLONE, 'tests/development.json'))
  assert.equal(sha256(raw), pl.public_repo.bank_file.sha256)
  const bank = JSON.parse(raw.toString('utf8'))
  for (const c of pl.cases) {
    const b = bank.find((x) => x.id === c.id)
    assert.ok(b, c.id)
    assert.equal(c.original.prompt, b.prompt)
    assert.deepEqual(c.original.context, b.context)
    assert.equal(c.expected.rubric, b.rubric)
    assert.deepEqual(c.expected.decisions, b.decisions)
  }
  assert.equal(sha256(readFileSync(join(CLONE, 'prompts/optimizer.md'))), pl.public_repo.auditor_file.sha256)
})
