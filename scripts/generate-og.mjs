#!/usr/bin/env node
// Generate the Open Graph images in public/og/ (1200x630 PNG) from real text,
// and write src/components/evidence/og-manifest.json (path, title, lang,
// dimensions, sha256).
//
// Usage (from the web root):   node scripts/generate-og.mjs
//                              node scripts/generate-og.mjs --check   (verify only)
//
// - Text only: headline and project lines come from the approved positioning
//   (PLAN-INTEGRADO §2) and src/data/portfolio.json. No product mockups, stock
//   or generated imagery. The background grain is the site's own seeded tile.
// - Rasterised with `sharp` (already a devDependency). Nothing is downloaded.
// - Fonts: system-installed Montserrat and DM Mono if present; otherwise the
//   SVG falls back to the system sans/monospace. Hashes therefore depend on the
//   fonts of the machine that runs this script; re-run and commit the manifest
//   together with the PNGs.

import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateGrainTile } from '../src/components/evidence/grain-tile.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'public/og')
const MANIFEST = path.join(ROOT, 'src/components/evidence/og-manifest.json')
const WIDTH = 1200
const HEIGHT = 630

const HEADLINE = 'AI-assisted workflows, built to be checked.'

// Each card: only real text. Sources in comments.
export const CARDS = [
  {
    name: 'home',
    lang: 'en',
    eyebrow: 'Kinetica AI · Alfonso Navarro',
    // Source: PLAN-INTEGRADO.md §2 (headline and subtitle)
    title: HEADLINE,
    lines: [
      'AI & Workflow Automation (entry level). Four public projects with tests, saved results and stated limits.',
    ],
    tag: 'Moving to Latvia on 7 January 2027 · open to on-site work in Riga',
  },
  {
    name: 'projects',
    lang: 'en',
    eyebrow: 'Kinetica AI · Projects',
    // Source: PLAN-INTEGRADO.md §2, §5 (four projects)
    title: 'Four public projects',
    lines: ['Website · Prompt Lab v0.4 · Polar retrospective · Editorial checker v1.0'],
    tag: HEADLINE,
  },
  {
    name: 'website',
    lang: 'en',
    eyebrow: 'Project · Website',
    // Source: package.json; .github/workflows/deploy.yml
    title: 'kineticaai.com',
    lines: ['Astro + React site, built with GitHub Actions and deployed to GitHub Pages.'],
    tag: 'Astro · React · GitHub Pages',
  },
  {
    name: 'prompt-lab',
    lang: 'en',
    eyebrow: 'Project · Prompt Lab',
    // Source: src/data/portfolio.json (prompt-lab.intro, evidence[1])
    title: 'Prompt Lab v0.4',
    lines: ['Reviews LLM prompts: keep the prompt, ask to clarify, or propose a justified change.'],
    tag: 'Saved results · automatic checks, partial human review',
  },
  {
    name: 'polar',
    lang: 'en',
    eyebrow: 'Project · Polar',
    // Source: src/data/portfolio.json (polar.intro, problem, limits[0]); scripts/polar/README.md:23-29
    title: 'Polar retrospective study',
    lines: ['Watch metrics and diary symptoms, evaluated with a growing history and no future data.'],
    tag: 'N=1, retrospective · no causal or clinical claims',
  },
  {
    name: 'editorial-checker',
    lang: 'en',
    eyebrow: 'Project · Editorial checker',
    // Source: scripts/editorial/README.md:3,10-22
    title: 'Editorial checker v1.0',
    lines: ['Local rule-based review of Markdown files. JSON report and exit codes 0 / 1 / 2.'],
    tag: 'No model calls · approval: false',
  },
  {
    name: 'es',
    lang: 'es',
    eyebrow: 'Kinetica AI',
    // Source: src/layouts/Layout.astro (default Spanish title and description)
    title: 'Kinetica AI — Osteopatía y biomecánica',
    lines: ['Consulta clínica y biomecánica.'],
    tag: 'kineticaai.com/es',
  },
]

const C = {
  bg: '#f0f9f9',
  heading: '#34504b',
  text: '#3d5c57',
  sec: '#4d6e68',
  sea: '#5d8a82',
  fillSea: 'rgba(93,138,130,0.10)',
}
const SANS = "Montserrat, 'Helvetica Neue', Arial, sans-serif"
const MONO = "'DM Mono', Menlo, 'SF Mono', monospace"

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function wrap(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const out = []
  let line = ''
  for (const w of words) {
    if (!line) line = w
    else if ((line + ' ' + w).length <= maxChars) line += ' ' + w
    else { out.push(line); line = w }
  }
  if (line) out.push(line)
  return out
}

export function cardSvg(card) {
  const x = 88
  const maxW = WIDTH - x - 88
  const titleSize = card.title.length > 30 ? 60 : 68
  const titleLines = wrap(card.title, Math.floor(maxW / (titleSize * 0.6)))
  const bodySize = 30
  const bodyLines = card.lines.flatMap((l) => wrap(l, Math.floor(maxW / (bodySize * 0.56))))

  let y = 132
  const parts = []
  parts.push(`<rect x="0" y="0" width="14" height="${HEIGHT}" fill="${C.sea}"/>`)
  parts.push(
    `<text x="${x}" y="${y}" font-family="${esc(MONO)}" font-size="24" font-weight="500" letter-spacing="2.5" fill="${C.sec}">${esc(card.eyebrow.toUpperCase())}</text>`,
  )
  y += 92
  for (const l of titleLines) {
    parts.push(`<text x="${x}" y="${y}" font-family="${esc(SANS)}" font-size="${titleSize}" font-weight="600" fill="${C.heading}">${esc(l)}</text>`)
    y += Math.round(titleSize * 1.18)
  }
  y += 18
  for (const l of bodyLines) {
    parts.push(`<text x="${x}" y="${y}" font-family="${esc(SANS)}" font-size="${bodySize}" font-weight="400" fill="${C.text}">${esc(l)}</text>`)
    y += Math.round(bodySize * 1.4)
  }

  const tagSize = 22
  const tagW = Math.min(maxW, Math.round(card.tag.length * tagSize * 0.6) + 40)
  const tagY = HEIGHT - 112
  parts.push(`<rect x="${x}" y="${tagY}" width="${tagW}" height="48" rx="24" fill="${C.fillSea}" stroke="${C.sea}" stroke-width="2"/>`)
  parts.push(`<text x="${x + 20}" y="${tagY + 31}" font-family="${esc(MONO)}" font-size="${tagSize}" font-weight="500" fill="${C.heading}">${esc(card.tag)}</text>`)

  if (card.name !== 'es') {
    parts.push(`<text x="${WIDTH - 88}" y="${HEIGHT - 40}" text-anchor="end" font-family="${esc(MONO)}" font-size="20" fill="${C.sec}">kineticaai.com</text>`)
  }

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">${parts.join('')}</svg>`,
    overflow: y > tagY - 10,
  }
}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

function altFor(card) {
  return `${card.title} — ${card.lines.join(' ')} ${card.tag}`.trim()
}

async function loadSharp() {
  try {
    return (await import('sharp')).default
  } catch {
    console.error('sharp is not installed in node_modules. Run `npm ci` first (do not add new dependencies), then re-run this script.')
    process.exit(1)
  }
}

async function generate() {
  const sharp = await loadSharp()
  fs.mkdirSync(OUT_DIR, { recursive: true })

  // Site grain, slightly lighter for a thumbnail. Fixed seed => same background each run.
  const tile = generateGrainTile({ tileCss: 256, cell: 1, seed: 7, opacity: 0.2 })
  const tilePng = await sharp(Buffer.from(tile.data.buffer), { raw: { width: tile.width, height: tile.height, channels: 4 } })
    .png()
    .toBuffer()

  const manifest = {}
  for (const card of CARDS) {
    const { svg, overflow } = cardSvg(card)
    if (overflow) throw new Error(`Text overflows the tag area in ${card.name}`)
    const file = path.join(OUT_DIR, `${card.name}.png`)
    const png = await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background: C.bg } })
      .composite([
        { input: tilePng, tile: true, top: 0, left: 0 },
        { input: Buffer.from(svg), top: 0, left: 0 },
      ])
      .flatten({ background: C.bg })
      .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
      .toBuffer()
    fs.writeFileSync(file, png)
    const meta = await sharp(png).metadata()
    if (meta.width !== WIDTH || meta.height !== HEIGHT) throw new Error(`${card.name}: ${meta.width}x${meta.height}`)
    manifest[card.name] = {
      path: `/og/${card.name}.png`,
      title: card.title,
      alt: altFor(card),
      lang: card.lang,
      width: meta.width,
      height: meta.height,
      bytes: png.length,
      sha256: sha256(png),
    }
    console.log(`${card.name.padEnd(18)} ${meta.width}x${meta.height}  ${png.length} B  ${manifest[card.name].sha256.slice(0, 12)}`)
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`manifest: ${path.relative(ROOT, MANIFEST)}`)
}

async function check() {
  const sharp = await loadSharp()
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
  let ok = true
  for (const card of CARDS) {
    const entry = manifest[card.name]
    const file = path.join(ROOT, 'public', entry?.path ?? `/og/${card.name}.png`)
    if (!entry || !fs.existsSync(file)) { console.error(`missing: ${card.name}`); ok = false; continue }
    const buf = fs.readFileSync(file)
    const meta = await sharp(buf).metadata()
    const good = meta.width === WIDTH && meta.height === HEIGHT && sha256(buf) === entry.sha256
    console.log(`${good ? 'ok  ' : 'FAIL'} ${card.name}`)
    ok &&= good
  }
  process.exit(ok ? 0 : 1)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) await check()
  else await generate()
}
