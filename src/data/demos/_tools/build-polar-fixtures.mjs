#!/usr/bin/env node
// Builds the two Polar demo fixtures:
//   polar-results.json          SAVED: aggregates copied from public/data/polar-retrospective-summary.json
//                                (already public). Diary column names are deliberately NOT copied.
//   polar-method-synthetic.json  LOCAL: deterministic synthetic series (fixed seed) that only
//                                illustrates the expanding-history method. It is not real data and
//                                no model is trained on it, here or in the browser.
// No network, no private files, no retraining.
//
// Usage, from the repository root:
//   node src/data/demos/_tools/build-polar-fixtures.mjs
import { readFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { REPO_ROOT, DEMOS_DATA, sha256File, writeJson, assertPublishable } from './common.mjs'
import { evalRange, trainingStats, foldSkipped } from '../../../components/demos/lib/polar-method.mjs'
import { makeSeries } from './synthetic-series.mjs'

const SUMMARY = 'public/data/polar-retrospective-summary.json'
const OUT_DIR = resolve(DEMOS_DATA, 'polar')
mkdirSync(OUT_DIR, { recursive: true })

const summary = JSON.parse(readFileSync(join(REPO_ROOT, SUMMARY), 'utf8'))
const log = spawnSync('git', ['log', '-1', '--format=%H %cI', '--', SUMMARY], { cwd: REPO_ROOT, encoding: 'utf8' })
const [commit, commitDate] = log.stdout.trim().split(' ')
const cfg = summary.configuration

// ---------- (a) SAVED results ----------
const TARGET_EN = {
  severity: 'Overall severity',
  fatigue: 'Fatigue',
  pem: 'Post-exertional malaise',
  brain_fog: 'Brain fog',
  autonomic: 'Autonomic symptoms',
}
const METRIC_KEYS = ['paired_observations', 'evaluated_observations', 'evaluated_positive', 'evaluated_negative',
  'skipped_folds', 'auroc', 'average_precision', 'brier', 'reference_brier']

const results = {
  schema_version: 1,
  demo: 'polar-results',
  origin: 'SAVED',
  origin_note: 'Aggregated results already published on the site. No daily records, diary fields or private files.',
  generator: 'node src/data/demos/_tools/build-polar-fixtures.mjs',
  source: { path: SUMMARY, sha256: sha256File(join(REPO_ROOT, SUMMARY)), commit: commit || null, commit_date: commitDate || null },
  analysis_date: summary.analysis_date,
  study: summary.study,
  participants: summary.participants,
  paired_observations: summary.paired_observations,
  method: {
    feature_count: cfg.features.length,
    calendar_lags: cfg.calendar_lags,
    min_train_observations: cfg.min_train_observations,
    min_training_class_count: cfg.min_training_class_count,
    evaluation: cfg.evaluation,
    estimator: cfg.estimator,
    reference: cfg.reference,
  },
  limits_en: [
    'Retrospective, one person (N=1). Not causal, not clinically validated, not a prediction service.',
    'Aggregated results only; the diary and daily records stay private.',
  ],
  targets: Object.keys(TARGET_EN).map((key) => {
    const r = summary.results[key]
    if (!r) throw new Error(`Missing target ${key}`)
    return { key, label_en: TARGET_EN[key], ...Object.fromEntries(METRIC_KEYS.map((k) => [k, r[k]])) }
  }),
}

// ---------- (b) LOCAL synthetic method series ----------
const SEED = 20261120
const N_DAYS = 40
const days = makeSeries(SEED, N_DAYS)
// Sanity: every fold of the slider must have >= min class count in training, for both lags.
for (const lag of cfg.calendar_lags) {
  const range = evalRange(N_DAYS, cfg.min_train_observations, lag)
  for (let e = range.min; e <= range.max; e++) {
    if (foldSkipped(trainingStats(days, lag, e), cfg.min_training_class_count)) {
      throw new Error(`Seed ${SEED} gives a skipped fold at lag ${lag}, day ${e}; choose another seed`)
    }
  }
}

const method = {
  schema_version: 1,
  demo: 'polar-method',
  origin: 'LOCAL',
  synthetic: true,
  label_en: 'Synthetic data — illustrates the method, not results.',
  origin_note: 'Deterministic synthetic series. The browser only recolours the training/evaluated split; no model is trained.',
  generator: 'node src/data/demos/_tools/build-polar-fixtures.mjs',
  prng: 'mulberry32',
  seed: SEED,
  n_days: N_DAYS,
  method_from_public_summary: {
    source: SUMMARY,
    min_train_observations: cfg.min_train_observations,
    min_training_class_count: cfg.min_training_class_count,
    calendar_lags: cfg.calendar_lags,
  },
  days,
}

for (const obj of [results, method]) assertPublishable(obj)
writeJson(join(OUT_DIR, 'polar-results.json'), results)
writeJson(join(OUT_DIR, 'polar-method-synthetic.json'), method)
