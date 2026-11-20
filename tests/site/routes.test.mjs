// Every URL that was public before the restructure (inventory in
// implementacion/rutas.md) must still resolve: to a page, a redirect
// (astro.config.mjs → static meta-refresh page) or a file in public/.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync } from 'node:fs'

const ROOT = new URL('../../', import.meta.url)
const read = p => readFileSync(new URL(p, ROOT), 'utf8')
const exists = p => existsSync(new URL(p, ROOT))

function frontmatter(path) {
  const txt = read(path)
  const fm = txt.split('---')[1] ?? ''
  const get = k => (fm.match(new RegExp(`^${k}:\\s*"?([^"\\n]+)"?`, 'm')) || [])[1]
  return { slug: get('slug'), draft: /^draft:\s*true/m.test(fm) }
}
const collection = dir => readdirSync(new URL(`src/content/${dir}/`, ROOT))
  .filter(f => f.endsWith('.md'))
  .map(f => frontmatter(`src/content/${dir}/${f}`))

const informes = collection('informes').map(e => e.slug)
const labPublic = collection('lab').filter(e => !e.draft).map(e => e.slug)
const labDrafts = collection('lab').filter(e => e.draft).map(e => e.slug)
const portfolio = JSON.parse(read('src/data/portfolio.json'))

const config = read('astro.config.mjs')
const redirects = Object.fromEntries([...config.matchAll(/'(\/[^']*)':\s*'([^']*)'/g)].map(m => [m[1], m[2]]))

const strip = p => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p)

// Resolve a path to a page in src/pages (static or dynamic with known params).
function pageFor(path) {
  const p = strip(path.split('#')[0])
  if (p === '/' && exists('src/pages/index.astro')) return 'src/pages/index.astro'
  for (const f of [`src/pages${p}.astro`, `src/pages${p}/index.astro`]) if (exists(f)) return f
  const parts = p.split('/')
  const last = parts.pop()
  const dir = `src/pages${parts.join('/')}`
  const dynamic = [
    { file: `${dir}/[slug].astro`, ok: () => (dir.endsWith('/informes') ? informes : dir.endsWith('/lab') ? labPublic : []).includes(last) },
    { file: `${dir}/[id].astro`, ok: () => dir.endsWith('/lab/proyectos') && portfolio.some(x => x.id === last) },
  ]
  for (const d of dynamic) if (exists(d.file) && d.ok()) return d.file
  return null
}

function resolve(path) {
  const p = strip(path.split('#')[0])
  if (redirects[p]) return { via: 'redirect', to: redirects[p], page: pageFor(redirects[p]) }
  for (const [from, to] of Object.entries(redirects)) {
    const m = from.match(/^(.*)\/\[(\w+)\]$/)
    if (m && p.startsWith(m[1] + '/') && !p.slice(m[1].length + 1).includes('/')) {
      const target = to.replace(`[${m[2]}]`, p.slice(m[1].length + 1))
      return { via: 'redirect', to: target, page: pageFor(target) }
    }
  }
  return { via: 'page', page: pageFor(p) }
}

const OLD_PAGES = [
  '/', '/#contacto', '/about', '/profesionales', '/informes',
  ...informes.map(s => `/informes/${s}`),
  '/lab', ...labPublic.map(s => `/lab/${s}`),
  '/lab/proyectos', ...portfolio.map(x => `/lab/proyectos/${x.id}`),
]

for (const url of OLD_PAGES) {
  test(`old URL ${url} still resolves`, () => {
    const r = resolve(url)
    assert.ok(r.page, `${url} → ${JSON.stringify(r)}`)
  })
}

test('moved clinical routes redirect to /es/', () => {
  assert.equal(resolve('/informes').to, '/es/informes/')
  assert.equal(resolve('/informes/lumbar').to, '/es/informes/lumbar')
  assert.equal(resolve('/profesionales').to, '/es/profesionales/')
})

const NEW_PAGES = [
  '/projects/', '/projects/website/', '/projects/prompt-lab/', '/projects/polar/', '/projects/editorial-checker/',
  '/about/', '/contact/', '/es/', '/es/about/', '/es/informes/', '/es/profesionales/',
  ...informes.map(s => `/es/informes/${s}/`),
]
for (const url of NEW_PAGES) {
  test(`new URL ${url} has a page`, () => assert.ok(pageFor(url), url))
}

test('draft lab entries are still excluded from every lab route', () => {
  assert.ok(labDrafts.includes('lyme-pipeline'))
  for (const f of ['src/pages/lab/[slug].astro', 'src/pages/lab/index.astro', 'src/pages/es/index.astro']) {
    assert.match(read(f), /!e\.data\.draft/, f)
  }
})

const PUBLIC_FILES = [
  'artefactos/cut-cadena-posterior-v3.html',
  'data/polar-retrospective-summary.json',
  'portfolio-demo/IO3-ALMA-DEMO-LOCAL.zip',
  'portfolio-demo/POLAR-DEMO-SINTETICA.zip',
  'portfolio-demo/PROMPT-LAB-EVALUACION-REAL-2026-11-16.json',
  'portfolio-demo/PROMPT-LAB-REPLAY-SINTETICO.json',
  'favicon.svg', 'og-image.jpg', 'manifest.webmanifest', 'robots.txt',
]
for (const f of PUBLIC_FILES) {
  test(`public file /${f} is kept`, () => assert.ok(exists(`public/${f}`), f))
}

test('internal links in project actions point to existing pages or public files', () => {
  for (const item of portfolio) {
    for (const a of item.en.actions) {
      if (/^https?:/.test(a.href)) continue
      const ok = a.href.match(/\.(json|zip|html)$/) ? exists(`public${a.href}`) : !!resolve(a.href).page
      assert.ok(ok, `${item.slug}: ${a.href}`)
    }
  }
})
