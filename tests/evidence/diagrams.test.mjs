// node --test tests/evidence/*.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SLUGS, DIAGRAMS, getDiagram, layoutFlow, layoutTimeline } from '../../src/components/evidence/diagrams.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const COMPONENT = fs.readFileSync(path.join(ROOT, 'src/components/evidence/ProjectDiagram.astro'), 'utf8')
const ALLOWED_SOURCES = [
  'src/data/portfolio.json',
  'scripts/polar/README.md',
  'scripts/editorial/README.md',
  '.github/workflows/deploy.yml',
  'package.json',
]

// "src/data/portfolio.json#prompt-lab.evidence[1]" -> that string in the entry with id "prompt-lab".
const PORTFOLIO = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/portfolio.json'), 'utf8'))
function resolvePortfolioRef(ref) {
  const [file, pointer] = ref.split('#')
  assert.equal(file, 'src/data/portfolio.json')
  const m = pointer.match(/^([a-z0-9-]+)\.([a-zA-Z]+)(?:\[(\d+)\])?$/)
  assert.ok(m, `bad reference ${ref}`)
  const entry = PORTFOLIO.find((e) => e.id === m[1])
  assert.ok(entry, `no portfolio entry ${m[1]}`)
  return m[3] === undefined ? entry[m[2]] : entry[m[2]]?.[Number(m[3])]
}

test('cited portfolio facts still say what the diagrams show', () => {
  const r = (x) => resolvePortfolioRef(`src/data/portfolio.json#${x}`)
  assert.match(r('prompt-lab.evidence[0]'), /v0\.4/)
  assert.match(r('prompt-lab.evidence[1]'), /8\/10/)
  assert.match(r('prompt-lab.evidence[1]'), /10\/10/)
  assert.match(r('prompt-lab.evidence[1]'), /parcial/)
  assert.match(r('prompt-lab.intro'), /conserva[\s\S]*aclaraciones[\s\S]*mejora justificada/)
  assert.match(r('polar.evidence[0]'), /61 fechas emparejadas/)
  assert.match(r('polar.limits[0]'), /una persona/)
  assert.match(r('io3-alma.intro'), /sin llamadas a modelos/)
  const polar = fs.readFileSync(path.join(ROOT, 'scripts/polar/README.md'), 'utf8')
  assert.match(polar, /historia creciente después de 30 observaciones/)
  assert.match(polar, /La última observación evaluada no\s+entra en el entrenamiento/)
  assert.match(polar, /N-of-1/)
})

test('the four contract slugs have a diagram, and nothing else', () => {
  assert.deepEqual([...SLUGS].sort(), ['editorial-checker', 'polar', 'prompt-lab', 'website'])
  assert.deepEqual(Object.keys(DIAGRAMS).sort(), [...SLUGS].sort())
  assert.throws(() => getDiagram('io3-alma'))
})

for (const slug of SLUGS) {
  test(`${slug}: title, desc and non-empty steps with text equivalent`, () => {
    const d = getDiagram(slug)
    assert.ok(d.title.trim().length > 10)
    assert.ok(d.desc.trim().length > 40)
    assert.ok(d.steps.length >= 3)
    for (const s of d.steps) {
      for (const k of ['label', 'title', 'detail']) {
        assert.equal(typeof s[k], 'string', `${slug} ${k}`)
        assert.ok(s[k].trim().length > 0, `${slug} empty ${k}`)
      }
      for (const b of s.branches ?? []) assert.ok(b.trim().length > 0)
    }
  })

  test(`${slug}: every step cites an allowed source that exists, with valid lines`, () => {
    for (const s of getDiagram(slug).steps) {
      assert.ok(s.sources?.length > 0, `${slug}: step "${s.title}" without source`)
      for (const ref of s.sources) {
        if (ref.includes('#')) {
          const value = resolvePortfolioRef(ref)
          assert.equal(typeof value, 'string', `${ref} does not resolve to text`)
          assert.ok(value.trim().length > 0, `${ref} is empty`)
          continue
        }
        const [file, lines] = ref.split(':')
        assert.ok(ALLOWED_SOURCES.includes(file), `${ref} not an allowed source`)
        const text = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n')
        for (const part of lines.split(',')) {
          const [a, b = a] = part.split('-').map(Number)
          assert.ok(a >= 1 && b >= a && b <= text.length, `${ref} out of range`)
        }
      }
    }
  })

  test(`${slug}: geometry stays inside the viewBox in both orientations`, () => {
    const d = getDiagram(slug)
    for (const o of ['wide', 'tall']) {
      const L = d.kind === 'flow' ? layoutFlow(d, o) : layoutTimeline(d, o)
      assert.ok(L.width > 0 && L.height > 0)
      if (d.kind === 'flow') {
        assert.equal(L.nodes.length, d.steps.length)
        for (const n of L.nodes) {
          assert.ok(n.x >= 0 && n.y >= 0 && n.x + n.w <= L.width && n.y + n.h <= L.height, `${slug} ${o}`)
        }
      } else {
        for (const r of L.rows) for (const c of r.cells) assert.ok(c.x >= 0 && c.x + c.w <= L.width + 0.01)
      }
    }
  })
}

test('prompt-lab shows keep / ask to clarify / propose justified change, auditor v0.4 and partial human verdict', () => {
  const d = getDiagram('prompt-lab')
  const all = JSON.stringify(d)
  assert.deepEqual(d.steps.find((s) => s.branches).branches, ['Keep', 'Ask to clarify', 'Propose justified change'])
  assert.match(all, /Auditor v0\.4/)
  assert.match(all, /Automatic contract checks/)
  assert.match(all, /Human verdict \(partial\)/)
})

test('editorial-checker shows exit codes 0/1/2 and approval: false', () => {
  const d = getDiagram('editorial-checker')
  const all = JSON.stringify(d)
  assert.match(all, /0 · no findings/)
  assert.match(all, /1 · human review/)
  assert.match(all, /2 · error/)
  assert.match(all, /approval: false/)
  const readme = fs.readFileSync(path.join(ROOT, 'scripts/editorial/README.md'), 'utf8')
  assert.match(readme, /clinical_or_publication_approval: false/)
})

test('polar shows N=1, retrospective and distinct training / evaluated states', () => {
  const d = getDiagram('polar')
  assert.equal(d.badge, 'N=1, retrospective')
  const L = layoutTimeline(d, 'wide')
  for (const r of L.rows) {
    const states = r.cells.map((c) => c.state)
    assert.equal(states.filter((s) => s === 'eval').length, 1)
    const e = states.indexOf('eval')
    assert.ok(states.slice(0, e).every((s) => s === 'train'), 'only earlier days train')
    assert.ok(states.slice(e + 1).every((s) => s === 'unused'), 'later days unused')
  }
  // Growing history: second fold trains on one more day.
  const count = (r) => r.cells.filter((c) => c.state === 'train').length
  assert.equal(count(L.rows[1]), count(L.rows[0]) + 1)
  assert.match(COMPONENT, /pd-cell--train \{ fill: var\(--sea\)/)
  assert.match(COMPONENT, /pd-cell--eval \{ fill: var\(--warm\)/)
})

test('website steps match deploy.yml', () => {
  const yml = fs.readFileSync(path.join(ROOT, '.github/workflows/deploy.yml'), 'utf8')
  for (const needle of ['branches: [ main ]', 'workflow_dispatch', 'node-version: "22"', 'npm ci', 'npm run build', 'upload-pages-artifact', 'path: ./dist', 'deploy-pages']) {
    assert.ok(yml.includes(needle), `deploy.yml lacks ${needle}`)
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
  assert.match(pkg.devDependencies.astro, /\^6\./)
  assert.match(pkg.dependencies.react, /\^19\./)
})

test('component: accessible SVG, user-driven steps, no autoplay, page-load re-init', () => {
  assert.match(COMPONENT, /role="img"/)
  assert.match(COMPONENT, /<title id=/)
  assert.match(COMPONENT, /<desc id=/)
  assert.match(COMPONENT, /<ol class="pd-steps">/)
  assert.match(COMPONENT, />Previous step</)
  assert.match(COMPONENT, />Next step</)
  assert.equal((COMPONENT.match(/aria-live=/g) || []).length, 1)
  assert.match(COMPONENT, /aria-live="polite"/)
  // Controls are hidden in the HTML and only revealed by the script (no-JS shows all steps).
  assert.match(COMPONENT, /data-pd-controls hidden/)
  assert.match(COMPONENT, /astro:page-load/)
  assert.match(COMPONENT, /prefers-reduced-motion: reduce\)[\s\S]*transition: none/)
  assert.doesNotMatch(COMPONENT, /setInterval|setTimeout|requestAnimationFrame|@keyframes|<animate/)
  // The live region is written only from the click path (render(true)).
  assert.match(COMPONENT, /render\(false\)/)
})
