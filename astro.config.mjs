import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://www.kineticaai.com',
  integrations: [react(), sitemap()],
  outDir: 'dist',
  // Clinical pages moved to /es/ (2026-11-20). On GitHub Pages these become
  // static HTML pages with <meta http-equiv="refresh"> + canonical link.
  // /about and / are kept as English pages with visible links to /es/.
  redirects: {
    '/informes': '/es/informes/',
    '/informes/[slug]': '/es/informes/[slug]',
    '/profesionales': '/es/profesionales/',
  },
})
