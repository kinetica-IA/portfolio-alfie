# Visual evidence components

Package I (diagrams, Open Graph images) and the grain tile used by package F.

## ProjectDiagram

```astro
---
import ProjectDiagram from '../../components/evidence/ProjectDiagram.astro'
---
<ProjectDiagram project="prompt-lab" />
```

Adjust the relative path to the page's location (from `src/pages/projects/[slug].astro`
it is `../../components/evidence/ProjectDiagram.astro`).

| Prop | Type | Required | Notes |
|---|---|---|---|
| `project` | `'website' \| 'prompt-lab' \| 'polar' \| 'editorial-checker'` | yes | Unknown values throw at build time. |
| `id` | `string` | no | DOM id prefix. Only needed if the same project diagram is rendered twice on one page. |

Behaviour:
- `<figure>` with a caption, an inline `<svg role="img">` (with `<title>` and `<desc>`) and an
  ordered list with the same steps as text.
- Without JS: the whole diagram and every step are visible; the step buttons stay hidden.
- With JS: "Previous step", "Next step" and "Show all steps" highlight one step at a time.
  Nothing advances on its own. The single `aria-live="polite"` region is written only after a
  button press. Buttons use `aria-disabled`, so focus is never lost at the ends.
- `prefers-reduced-motion`: no transitions (highlighting is instant).
- The script re-initialises on `astro:page-load` (ClientRouter) and is idempotent.
- Layout: a vertical version by default and a horizontal one when the figure is at least
  760px wide (container query). At 390px the vertical version needs no horizontal scroll; the
  canvas still has `overflow-x: auto` as a guard.
- Styles are scoped and use only variables from `src/styles/tokens*.css`.
- English only. A Spanish version for `/es` would need translated step text in `diagrams.mjs`.

Content and geometry live in `diagrams.mjs` (pure module, also used by the tests).

### Sources of each step

Every step has a `sources` array and a comment with the path. Files are cited as path:line;
`portfolio.json` is cited by entry id and field (`src/data/portfolio.json#prompt-lab.evidence[1]`),
because other agents add fields to it and its line numbers move. The cited fields are the original
Spanish ones. Only these files are
used: `src/data/portfolio.json`, `scripts/polar/README.md`, `scripts/editorial/README.md`,
`.github/workflows/deploy.yml` and, for the website stack, `package.json`.

| Diagram | Step | Source |
|---|---|---|
| website | Astro + React source | package.json:14-22 |
| website | Push to main or manual run | .github/workflows/deploy.yml:3-10 |
| website | GitHub Actions build (Node 22, npm ci, npm run build) | deploy.yml:21-44 |
| website | Upload dist/ as Pages artifact | deploy.yml:46-49 |
| website | Deploy to GitHub Pages | deploy.yml:51-60 |
| prompt-lab | Prompt + task | portfolio.json#prompt-lab.intro, .flow[0] |
| prompt-lab | Auditor v0.4 | portfolio.json#prompt-lab.status, .evidence[0] |
| prompt-lab | Keep / Ask to clarify / Propose justified change | portfolio.json#prompt-lab.intro |
| prompt-lab | Automatic contract checks (8/10 reference, 10/10 v0.4, 18 Nov 2026) | portfolio.json#prompt-lab.flow[2], .evidence[1] |
| prompt-lab | Human verdict (partial) | portfolio.json#prompt-lab.evidence[1], .limits[0] |
| polar | Days in calendar order, lags 0/1, 61 paired dates | scripts/polar/README.md:20; portfolio.json#polar.intro, .flow[1], .evidence[0] |
| polar | 30 observations before the first evaluation, ≥3 per class | scripts/polar/README.md:23-24 |
| polar | Train on earlier days, evaluate one day; median/scaling on training only | scripts/polar/README.md:22,24-25 |
| polar | History grows | scripts/polar/README.md:23 |
| polar | N=1, retrospective; aggregates only | scripts/polar/README.md:14-16,28-29; portfolio.json#polar.limits[0] |
| editorial-checker | Markdown files (informes, lab) | scripts/editorial/README.md:12; portfolio.json#io3-alma.flow[0] |
| editorial-checker | Local rules, standard library, no models | scripts/editorial/README.md:3,12; portfolio.json#io3-alma.intro |
| editorial-checker | JSON report to stdout, no file changes | scripts/editorial/README.md:10; portfolio.json#io3-alma.flow[2] |
| editorial-checker | Exit code 0 / 1 / 2 | scripts/editorial/README.md:14-20 |
| editorial-checker | approval: false, a person decides | scripts/editorial/README.md:22; portfolio.json#io3-alma.flow[3] |

Notes:
- `deploy.yml:6-9` also lists a `workflow_run` trigger. The diagram names only push to main
  and the manual run, which are also in the file; it does not describe the other trigger.
- The Polar timeline is schematic (12 cells): the cell count is not the real number of days,
  and the figure says so ("Schematic, not to scale").

If the READMEs or deploy.yml change, update the line numbers. `tests/evidence/diagrams.test.mjs`
checks that each cited file exists, that the lines are in range, that each portfolio reference
resolves to text, and that key facts (8/10, 10/10, partial review, 61 dates, 30 observations,
N-of-1, no model calls) are still in the sources.

## Open Graph images

Files: `public/og/{home,projects,website,prompt-lab,polar,editorial-checker,es}.png`, 1200x630.
Manifest: `og-manifest.json` (name → path, title, alt, lang, width, height, bytes, sha256).

```sh
node scripts/generate-og.mjs          # regenerate PNGs and manifest
node scripts/generate-og.mjs --check  # verify sizes and hashes against the manifest
```

- Real text only: the approved headline ("AI-assisted workflows, built to be checked."),
  project names with one line each, and a neutral Spanish card ("Kinetica AI — Osteopatía y
  biomecánica"). No screenshots, mockups, stock or generated imagery.
- Background: the site's own grain tile with a fixed seed.
- Rasterised with `sharp` (already in devDependencies). Fonts come from the system: Montserrat
  if installed, otherwise a system sans; DM Mono if installed, otherwise Menlo / a monospace.
  The current files were made with Montserrat and Menlo (DM Mono is not installed on the
  generating machine). Hashes depend on the installed fonts: regenerate and commit PNGs and
  manifest together.
- `alt` in the manifest can be used for `og:image:alt` / `twitter:image:alt`.

## Grain tile (package F)

`grain-tile.mjs` exports `generateGrainTile({ tileCss, cell, seed, opacity, density })`, a pure
seeded generator returning RGBA pixels. `src/components/GrainHoverBackground.jsx` puts one
256px tile into a canvas pattern; `scripts/generate-og.mjs` uses it for the OG background.

## Tests

```sh
node --test tests/evidence/*.test.mjs
```
