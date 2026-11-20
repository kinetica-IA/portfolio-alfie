// Editorial fixture: saved reviewer output matches the samples byte for byte.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { FIXTURES, ROOT, readJson, sha256, sha256File } from './helpers.mjs'
import { splitLines, lineId, parseLineHash, flaggedLines } from '../../src/components/demos/lib/editorial.mjs'

const ed = readJson(FIXTURES.editorial)
const EXPECTED = { SIN_HALLAZGOS_EN_ESTAS_REGLAS: 0, REQUIERE_REVISION_HUMANA: 1, ERROR: 2 }

test('schema of the editorial fixture', () => {
  assert.equal(ed.demo, 'editorial')
  assert.match(ed.generated_at, /^\d{4}-\d{2}-\d{2}T/)
  assert.equal(ed.reviewer.path, 'scripts/editorial/revisar_contenido.py')
  assert.match(ed.reviewer.version, /^\d+\.\d+\.\d+$/)
  assert.match(ed.reviewer.sha256, /^[0-9a-f]{64}$/)
  assert.match(ed.reviewer.runtime, /^Python 3\./)
  assert.ok(Array.isArray(ed.samples) && ed.samples.length >= 3)
  for (const s of ed.samples) {
    assert.equal(typeof s.id, 'string')
    assert.equal(s.synthetic, true)
    assert.match(s.run.date, /^\d{4}-\d{2}-\d{2}T/)
    assert.match(s.run.command, /^python3 scripts\/editorial\/revisar_contenido\.py --content-root src\/data\/demos\/editorial\/samples\/[a-z-]+$/)
    assert.equal(typeof s.run.exit_code, 'number')
    assert.equal(typeof s.run.stdout, 'string')
    assert.ok(s.files.length >= 1)
  }
})

test('exit codes 0, 1 and 2 are all present and match the status', () => {
  const codes = new Set(ed.samples.map((s) => s.run.exit_code))
  assert.deepEqual([...codes].sort(), [0, 1, 2])
  for (const s of ed.samples) {
    assert.equal(s.run.exit_code, EXPECTED[s.result.status], s.id)
    assert.equal(ed.status_codes.find((c) => c.status === s.result.status).code, s.run.exit_code)
  }
})

test('approval is always false', () => {
  for (const s of ed.samples) assert.equal(s.result.clinical_or_publication_approval, false, s.id)
})

test('saved stdout is byte-identical to the parsed result and its sha256', () => {
  for (const s of ed.samples) {
    assert.equal(sha256(s.run.stdout), s.run.stdout_sha256, s.id)
    assert.deepEqual(JSON.parse(s.run.stdout), s.result, s.id)
  }
})

test('sha256 of every sample matches the file on disk and the reviewer report', () => {
  for (const s of ed.samples) {
    for (const f of s.files) {
      const disk = readFileSync(`${ROOT}/${f.path}`, 'utf8')
      assert.equal(disk, f.text, `${f.path} text drifted`)
      assert.equal(sha256File(f.path), f.sha256, f.path)
      const row = s.result.files.find((r) => r.file === f.reviewer_path)
      assert.ok(row, `${f.reviewer_path} missing from reviewer output`)
      assert.equal(row.sha256, f.sha256, `${f.path} reviewer sha256`)
    }
  }
})

test('reviewer script is unchanged since the fixture was generated (regenerate if this fails)', () => {
  assert.equal(sha256File(ed.reviewer.path), ed.reviewer.sha256)
})

test('status 1 sample has warnings anchored to real lines; status 2 has errors', () => {
  const review = ed.samples.find((s) => s.run.exit_code === 1)
  const findings = review.result.files.flatMap((f) => f.findings)
  assert.ok(findings.length > 0)
  const lines = splitLines(review.files[0].text)
  for (const f of findings) {
    assert.ok(Number.isInteger(f.line) && f.line >= 1 && f.line <= lines.length, `line ${f.line}`)
    if (f.expression) assert.ok(lines[f.line - 1].includes(f.expression), `line ${f.line} lacks ${f.expression}`)
  }
  const error = ed.samples.find((s) => s.run.exit_code === 2)
  const errors = [...error.result.errors, ...error.result.files.flatMap((f) => f.errors)]
  assert.ok(errors.length > 0)
  const clean = ed.samples.find((s) => s.run.exit_code === 0)
  assert.equal(clean.result.files.flatMap((f) => f.findings).length, 0)
})

test('line helpers: split like Python splitlines, ids and hash parsing', () => {
  assert.deepEqual(splitLines('a\nb\n'), ['a', 'b'])
  assert.deepEqual(splitLines('a\r\n\r\nb'), ['a', '', 'b'])
  assert.equal(lineId('needs-review', 12), 'ed-needs-review-L12')
  assert.deepEqual(parseLineHash('#ed-needs-review-L12'), { sampleId: 'needs-review', line: 12 })
  assert.equal(parseLineHash('#something-else'), null)
  const review = ed.samples.find((s) => s.run.exit_code === 1)
  assert.ok(flaggedLines(review.result).size > 0)
})
