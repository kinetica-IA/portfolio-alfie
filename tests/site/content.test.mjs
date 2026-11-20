// English content contracts: four projects, slugs, case template markers,
// PromptLab history unchanged, Polar N=1 visible, language and schema rules.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'

const ROOT = new URL('../../', import.meta.url)
const read = p => readFileSync(new URL(p, ROOT), 'utf8')
const portfolio = JSON.parse(read('src/data/portfolio.json'))
const profile = JSON.parse(read('src/data/profile.en.json'))
const bySlug = Object.fromEntries(portfolio.map(p => [p.slug, p]))

function walk(dir) {
  return readdirSync(new URL(dir, ROOT)).flatMap(f => {
    const p = `${dir}/${f}`
    return statSync(new URL(p, ROOT)).isDirectory() ? walk(p) : [p]
  })
}

test('four projects with the contract slugs and old ids', () => {
  assert.equal(portfolio.length, 4)
  assert.deepEqual(
    portfolio.map(p => [p.id, p.slug]).sort(),
    [['io3-alma', 'editorial-checker'], ['polar', 'polar'], ['prompt-lab', 'prompt-lab'], ['web', 'website']],
  )
})

test('each project has the English card and "At a glance" fields', () => {
  for (const p of portfolio) {
    const en = p.en
    for (const k of ['name', 'discipline', 'status', 'cardProof', 'summary', 'next', 'metric', 'aiNote']) {
      assert.ok(typeof en[k] === 'string' && en[k].length > 0, `${p.slug}.${k}`)
    }
    for (const k of ['what', 'did', 'proof', 'limits']) assert.ok(en.glance[k], `${p.slug}.glance.${k}`)
    assert.ok(en.actions.length >= 1, `${p.slug} needs an action`)
    assert.ok(en.proof.length && en.limits.length && en.flow.length, p.slug)
  }
})

test('Polar card shows "N=1 retrospective"', () => {
  assert.match(bySlug.polar.en.status, /N=1 retrospective/)
})

test('PromptLab: earlier 16 Nov table unchanged and labelled as not v0.4', () => {
  const h = bySlug['prompt-lab'].en.history
  assert.equal(h.summary, 'Earlier evaluation (16 Nov 2026, 10 cases, not v0.4)')
  assert.deepEqual(h.rows, [['Baseline', '8/10', '1'], ['Candidate', '9/10', '1']])
  assert.match(h.caption, /ten cases per variant/)
  // the Spanish record keeps the same figures
  const es = read('src/pages/lab/proyectos/[id].astro')
  assert.match(es, /<th scope="row">Base<\/th><td>8\/10<\/td><td>1<\/td>/)
  assert.match(es, /<th scope="row">Candidata<\/th><td>9\/10<\/td><td>1<\/td>/)
})

test('PromptLab: 9 active / 4 reserved stay separate from the 10-case results', () => {
  const en = bySlug['prompt-lab'].en
  assert.match(en.proof[0], /nine active development cases/)
  assert.match(en.proof[0], /four reserved cases/)
  assert.match(en.glance.proof, /10 cases/)
  assert.doesNotMatch(en.glance.proof, /9 active|reserved/)
})

// Integrated by the coordinator: every case page renders its diagram and demo,
// and no INSERT marker is left behind.
const WIRED = {
  'website': ['<ProjectDiagram project="website" />'],
  'prompt-lab': ['<ProjectDiagram project="prompt-lab" />', '<PromptLabDemo />'],
  'polar': ['<ProjectDiagram project="polar" />', '<PolarDemo />'],
  'editorial-checker': ['<ProjectDiagram project="editorial-checker" />', '<EditorialDemo />'],
}
for (const [slug, tags] of Object.entries(WIRED)) {
  test(`case page ${slug} renders its diagram and demo, with no INSERT markers left`, () => {
    const page = read(`src/pages/projects/${slug}.astro`)
    for (const t of tags) assert.ok(page.includes(t), `${slug}: ${t}`)
    assert.ok(!page.includes('INSERT:'), `${slug}: leftover INSERT marker`)
    assert.match(page, /import ProjectDiagram from '\.\.\/\.\.\/components\/evidence\/ProjectDiagram\.astro'/)
  })
}

test('PromptLab case: v0.4 demo first, history inside <details> after it', () => {
  const page = read('src/pages/projects/prompt-lab.astro')
  const demo = page.indexOf('<PromptLabDemo />')
  assert.ok(demo > -1, 'demo rendered')
  assert.ok(page.indexOf('<details') > demo)
})

// Candidate finder for over-claiming words in the English copy. A human
// review is still required (negations such as "not validated" are allowed).
const EN_TEXT = JSON.stringify([portfolio.map(p => p.en), profile])
  + ['src/pages/index.astro', 'src/pages/contact.astro', 'src/pages/projects/index.astro'].map(read).join('\n')
  + walk('src/components/site').filter(f => f.endsWith('.astro')).map(read).join('\n')

test('no over-claiming terms in English copy', () => {
  for (const w of ['engineer', 'senior', 'expert', 'fluent', 'certified', 'clients', 'production', 'validated', 'predicts']) {
    assert.doesNotMatch(EN_TEXT, new RegExp(`\\b${w}\\b`, 'i'), w)
  }
  assert.doesNotMatch(JSON.stringify(bySlug.polar.en), /reproducib/i)
  assert.doesNotMatch(JSON.stringify(bySlug['editorial-checker'].en), /\bAI agent/i)
  assert.doesNotMatch(EN_TEXT, /\b(six|6) projects\b/i)
})

test('no CV download anywhere in pages or site components', () => {
  const all = walk('src/pages').concat(walk('src/components/site')).map(read).join('\n')
  assert.doesNotMatch(all, /\bCV\b|curriculum|resume\.pdf|\.pdf"/i)
})

test('home hero uses the approved headline, subtitle and availability', () => {
  assert.equal(profile.headline, 'AI-assisted workflows, built to be checked.')
  assert.match(profile.subtitle, /^Entry-level profile in AI & workflow automation\./)
  const avail = profile.availability.map(a => a.detail).join(' | ')
  assert.match(avail, /Ogre, Latvia, from 7 January 2027/)
  assert.match(avail, /daily on-site work in Riga/)
  assert.match(avail, /Spoken B2; reading and writing at C level \(self-assessed, no certificate\)/)
  const hero = read('src/components/site/HomeHero.astro')
  assert.match(hero, /See projects/)
  assert.match(hero, /href="\/contact\/"/)
  assert.doesNotMatch(hero, /aria-live=/)
})

test('no aria-live on rotating text', () => {
  assert.doesNotMatch(read('src/components/Hero.jsx'), /aria-live=/)
})

test('lang per page: English root/projects, Spanish /es and /lab', () => {
  for (const f of walk('src/pages').filter(f => f.endsWith('.astro'))) {
    const txt = read(f)
    const isEs = f.includes('/pages/es/') || f.includes('/pages/lab/')
    if (!/<Layout[\s>]/.test(txt)) continue
    if (isEs) assert.match(txt, /lang="es"/, f)
    else assert.match(txt, /lang="en"/, f)
  }
})

test('MedicalBusiness schema only on Spanish clinical pages', () => {
  for (const f of walk('src/pages').filter(f => f.endsWith('.astro'))) {
    const txt = read(f)
    if (/medicalSchema/.test(txt)) assert.ok(f.includes('/pages/es/'), f)
  }
  const layout = read('src/layouts/Layout.astro')
  assert.match(layout, /\{medicalSchema && \(/)
})

test('Layout: skip link, main#main, og/twitter tags, only used font families', () => {
  const layout = read('src/layouts/Layout.astro')
  assert.match(layout, /<main id="main" tabindex="-1"/)
  assert.match(layout, /class="skip-link" href="#main"/)
  assert.match(layout, /Skip to content/)
  assert.match(layout, /Saltar al contenido/)
  for (const t of ['og:title', 'og:description', 'og:image', 'twitter:card']) assert.ok(layout.includes(t), t)
  const fontLinks = layout.match(/fonts\.googleapis\.com\/css2\?[^"]+/g) || []
  assert.equal(fontLinks.length, 1)
  assert.doesNotMatch(fontLinks[0], /Fraunces|family=Inter|JetBrains/)
  assert.match(fontLinks[0], /family=Montserrat.*family=DM\+Mono/)
})
