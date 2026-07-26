import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'

const SITE = 'https://www.kineticaai.com'

// The research pages are plain HTML in public/, so Astro's route graph never sees
// them and the generated sitemap listed only "/". Enumerate them explicitly.
// diary.html stays out on purpose: it is published but linked from nowhere.
const RESEARCH_PAGES = [
  'ans-predictor.html',
  'convergence-analysis.html',
  'io-architecture.html',
  'knowledge-rag.html',
  'lyme-hrv.html',
  'pipeline.html',
  'predictor-audit.html',
  'sleep-quality-predictor.html',
].map((page) => `${SITE}/${page}`)

export default defineConfig({
  site: SITE,
  integrations: [
    react(),
    sitemap({
      customPages: RESEARCH_PAGES,
      filter: (page) => !page.includes('/hero-lab') && !page.includes('diary.html'),
    }),
  ],
  outDir: 'dist',
})
