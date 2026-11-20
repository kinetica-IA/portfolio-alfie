// Polar fixtures: saved aggregates equal the public summary; method helpers never leak the future.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FIXTURES, readJson, sha256File } from './helpers.mjs'
import { badgesFor } from '../../src/components/demos/lib/polar-results.mjs'
import { evalRange, clampEvalDay, cellRoles, trainingStats, foldSkipped, valueText, roleText } from '../../src/components/demos/lib/polar-method.mjs'
import { makeSeries } from '../../src/data/demos/_tools/synthetic-series.mjs'

const SUMMARY = 'public/data/polar-retrospective-summary.json'
const summary = readJson(SUMMARY)
const results = readJson(FIXTURES.polarResults)
const method = readJson(FIXTURES.polarMethod)

test('results fixture schema and source hash', () => {
  assert.equal(results.demo, 'polar-results')
  assert.equal(results.source.path, SUMMARY)
  assert.equal(results.source.sha256, sha256File(SUMMARY))
  assert.equal(results.participants, 1)
  assert.equal(results.targets.length, 5)
  assert.ok(results.limits_en.includes('Retrospective, one person (N=1). Not causal, not clinically validated, not a prediction service.'))
})

test('every saved value equals the public summary exactly', () => {
  for (const t of results.targets) {
    const src = summary.results[t.key]
    assert.ok(src, t.key)
    for (const k of ['paired_observations', 'evaluated_observations', 'evaluated_positive', 'evaluated_negative', 'skipped_folds', 'auroc', 'average_precision', 'brier', 'reference_brier']) {
      assert.equal(t[k], src[k], `${t.key}.${k}`)
    }
  }
  assert.equal(results.paired_observations, summary.paired_observations)
  assert.equal(results.method.min_train_observations, summary.configuration.min_train_observations)
})

test('badges supported by the data: fatigue worse than baseline, brain fog unstable, others none', () => {
  const by = Object.fromEntries(results.targets.map((t) => [t.key, badgesFor(t, results.method.min_training_class_count).map((b) => b.text)]))
  assert.deepEqual(by.fatigue, ['Worse than baseline'])
  assert.deepEqual(by.brain_fog, ['Unstable: 1 negative observation'])
  assert.deepEqual(by.severity, [])
  assert.deepEqual(by.pem, [])
  assert.deepEqual(by.autonomic, [])
})

test('synthetic series is deterministic for its seed', () => {
  assert.equal(method.synthetic, true)
  assert.match(method.label_en, /^Synthetic data — illustrates the method, not results\.$/)
  assert.deepEqual(makeSeries(method.seed, method.n_days), method.days)
  assert.notDeepEqual(makeSeries(method.seed + 1, method.n_days), method.days)
})

test('eval range starts after the minimum training history', () => {
  assert.deepEqual(evalRange(40, 30, 0), { min: 31, max: 40 })
  assert.deepEqual(evalRange(40, 30, 1), { min: 32, max: 40 })
  assert.equal(clampEvalDay(5, { min: 31, max: 40 }), 31)
  assert.equal(clampEvalDay('99', { min: 31, max: 40 }), 40)
  assert.equal(clampEvalDay('abc', { min: 31, max: 40 }), 31)
})

test('no future leakage: nothing on or after the evaluated day is training, for every slider position', () => {
  const n = method.n_days
  const minTrain = method.method_from_public_summary.min_train_observations
  for (const lag of [0, 1]) {
    const range = evalRange(n, minTrain, lag)
    for (let e = range.min; e <= range.max; e++) {
      const { signal, label } = cellRoles(n, lag, e)
      for (let d = 1; d <= n; d++) {
        if (d >= e) assert.notEqual(label[d - 1], 'train', `label day ${d} at eval ${e}`)
        if (d >= e - lag) assert.notEqual(signal[d - 1], 'train', `signal day ${d} at eval ${e} lag ${lag}`)
      }
      assert.equal(label.filter((r) => r === 'eval').length, 1)
      assert.equal(signal.filter((r) => r === 'eval').length, 1)
      assert.equal(signal.indexOf('eval') + 1, e - lag)
      const stats = trainingStats(method.days, lag, e)
      assert.equal(stats.observations, e - 1 - lag)
      assert.ok(stats.observations >= minTrain)
      assert.equal(foldSkipped(stats, method.method_from_public_summary.min_training_class_count), false)
    }
  }
})

test('lag 1 leaves day 1 label unpaired and the same-day signal unused', () => {
  const { signal, label } = cellRoles(40, 1, 35)
  assert.equal(label[0], 'unpaired')
  assert.equal(signal[34], 'unused')
  assert.equal(signal[33], 'eval')
  assert.equal(label[34], 'eval')
})

test('aria-valuetext wording', () => {
  assert.equal(valueText(34, 0, { observations: 33 }), 'Day 34: 33 training observations')
  assert.equal(valueText(34, 1, { observations: 32 }), 'Day 34 (signal from day 33): 32 training observations')
  assert.equal(roleText('eval'), 'evaluated')
})
