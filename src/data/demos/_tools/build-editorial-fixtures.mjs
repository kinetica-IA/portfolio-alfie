#!/usr/bin/env node
// Runs the CURRENT local editorial reviewer (scripts/editorial/revisar_contenido.py, unmodified)
// on each synthetic sample root and saves its real stdout, exit code, date, version, command and
// the sha256 of every sample file. The reviewer uses only the Python standard library; it does not
// touch the network or call a model. Nothing is rewritten: stdout is stored byte for byte.
//
// Usage, from the repository root:
//   node src/data/demos/_tools/build-editorial-fixtures.mjs
import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { REPO_ROOT, DEMOS_DATA, sha256, sha256File, repoRel, writeJson, assertPublishable } from './common.mjs'

const REVIEWER = 'scripts/editorial/revisar_contenido.py'
const SAMPLES_DIR = resolve(DEMOS_DATA, 'editorial', 'samples')
const OUT = resolve(DEMOS_DATA, 'editorial', 'editorial-demo.json')

// Display order and English copy written for the demo (the samples themselves are Spanish
// because the reviewer's rules target Spanish patient-facing copy).
const SAMPLES = [
  { id: 'no-findings', label: 'Sample A · clean', summary: 'Declares a (fictitious) DOI and avoids the flagged expressions.' },
  { id: 'needs-review', label: 'Sample B · flagged', summary: 'No DOI declared, a promise-like sentence and a negated one. A phrase inside a code block is ignored by design.' },
  { id: 'error', label: 'Sample C · error', summary: 'A code block is opened and never closed, so the rest of the file cannot be reviewed.' },
]

const RULES_EN = {
  REFERENCIAS_PENDIENTES: 'No DOI declared in the literal format the rule expects. Sources must be checked by a person; no DOI is resolved.',
  EXPRESION_A_REVISAR: 'Expression from the watch list. A person decides whether it is a problem; nothing is blocked or rewritten.',
  EXPRESION_CON_CONTEXTO: 'Watch-list expression next to a negation, quote or example marker. Still needs a human reading.',
}

const python = spawnSync('python3', ['--version'], { encoding: 'utf8' })
const pythonVersion = (python.stdout || python.stderr).trim()
const reviewerSource = readFileSync(join(REPO_ROOT, REVIEWER), 'utf8')
const reviewerVersion = (reviewerSource.match(/^VERSION = '([^']+)'/m) || [])[1] ?? null

function listFiles(dir) {
  const out = []
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...listFiles(p))
    else out.push(p)
  }
  return out
}

const generatedAt = new Date().toISOString()
const samples = SAMPLES.map((meta) => {
  const root = join(SAMPLES_DIR, meta.id)
  const rootRel = repoRel(root)
  const args = [REVIEWER, '--content-root', rootRel]
  const run = spawnSync('python3', args, { cwd: REPO_ROOT, encoding: 'utf8' })
  if (run.error) throw run.error
  const stdout = run.stdout
  const parsed = JSON.parse(stdout)
  const files = listFiles(root)
    .filter((p) => p.endsWith('.md'))
    .map((p) => {
      const text = readFileSync(p, 'utf8')
      return {
        path: repoRel(p),
        reviewer_path: repoRel(p).slice(rootRel.length + 1),
        sha256: sha256File(p),
        text,
      }
    })
  return {
    id: meta.id,
    label: meta.label,
    summary: meta.summary,
    synthetic: true,
    origin: 'SAVED',
    run: {
      date: generatedAt,
      command: ['python3', ...args].join(' '),
      cwd: 'repository root',
      exit_code: run.status,
      stderr: run.stderr,
      stdout,
      stdout_sha256: sha256(stdout),
    },
    result: parsed,
    files,
  }
})

const fixture = {
  schema_version: 1,
  demo: 'editorial',
  origin: 'SAVED',
  origin_note: 'Real output of the unmodified local reviewer, run on invented (synthetic) Markdown samples.',
  generated_at: generatedAt,
  generator: 'node src/data/demos/_tools/build-editorial-fixtures.mjs',
  reviewer: {
    path: REVIEWER,
    version: reviewerVersion,
    sha256: sha256(reviewerSource),
    runtime: pythonVersion,
  },
  status_codes: [
    { status: 'SIN_HALLAZGOS_EN_ESTAS_REGLAS', code: 0, en: 'No findings under these rules' },
    { status: 'REQUIERE_REVISION_HUMANA', code: 1, en: 'Needs human review' },
    { status: 'ERROR', code: 2, en: 'Error: not fully reviewed' },
  ],
  rules_en: RULES_EN,
  samples,
}

assertPublishable(fixture)
writeJson(OUT, fixture)
for (const s of samples) console.log(`${s.id}: exit ${s.run.exit_code} ${s.result.status}`)
