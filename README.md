# kineticaai.com

Source code of [www.kineticaai.com](https://www.kineticaai.com), Alfonso Navarro's
portfolio site. It is a static site built with **Astro 6** and **React 19** and
published on **GitHub Pages**.

The site serves two audiences from one build:

- an **English technical portfolio** for employers: the root page and `/projects/`;
- the **Spanish clinical site** (osteopathy and biomechanics) under `/es/`.

| Route | Language | Content |
|---|---|---|
| `/` | English | Role, skills, availability and entry to the projects |
| `/projects/` | English | Index of the four projects |
| `/projects/{website,prompt-lab,polar,editorial-checker}/` | English | One case page per project, with its demo and stated limits |
| `/es/` | Spanish | Clinical home, about, reports (`/es/informes/`) and contact |

URLs published before this structure keep working, either directly or through a
static redirect page (GitHub Pages has no server-side redirects).

## The four projects

| Project | Where the code lives | What it is |
|---|---|---|
| **Website** | This repository | The Astro/React site itself, built statically and deployed with GitHub Actions. |
| **Prompt Lab** | Separate public repository: [kinetica-IA/prompt-lab](https://github.com/kinetica-IA/prompt-lab) | A prompt auditor (auditor v0.4, pilot infrastructure 0.2.0) with local checks for saved responses. This site only shows saved outputs; it does not call any model. |
| **Polar retrospective (N-of-1)** | [`scripts/polar/`](scripts/polar/README.md) | A retrospective benchmark on one person's wearable and symptom-diary data, evaluated with a growing history (each day is scored only by a model trained on earlier days). Personal data is not included; the site shows aggregate results only. |
| **Editorial checker v1.0** | [`scripts/editorial/`](scripts/editorial/README.md) | A deterministic, standard-library Python CLI that flags lines in Markdown content for human review. Exit codes: `0` no findings under its limited rules, `1` needs human review, `2` error. It always reports `clinical_or_publication_approval: false`. |

Each project page on the site states what was tested, how, and what is still
unverified. The detailed documentation of the two Python tools is in Spanish, in
their own README files.

## Requirements

- **Node.js `>=22.12.0 <23`** (declared in `package.json` `engines`; `.nvmrc` pins major version 22).
- **npm**, using the committed `package-lock.json` (`npm ci`, not `npm install`, to reproduce a build).
- **Python 3.13** for the tools in `scripts/` (not needed to build the site).

If you use nvm, `nvm use` selects the version in `.nvmrc`. Neither `.nvmrc` nor
`engines` changes the Node version of your shell by itself; check with
`node --version`.

## Commands

From the repository root, with Node 22 active:

```sh
npm ci            # install the exact dependency tree from package-lock.json
npm run dev       # local development server (astro dev)
npm run build     # static build into dist/ (astro build)
npm run preview   # serve the built dist/ locally (astro preview)
```

`dist/`, `.astro/` and `node_modules/` are local build artefacts and are not committed.

### Front-end data and component tests

Node's built-in test runner, no extra dependencies:

```sh
node --test "tests/**/*.test.mjs"
```

### Python tools

Editorial checker (standard library only, no install step):

```sh
python3 -m unittest discover -s scripts/editorial -v
python3 scripts/editorial/revisar_contenido.py --content-root src/content
```

The checker writes JSON to stdout and does not modify files. It is not wired into
`npm run build`, CI or any hook.

Polar benchmark tests (synthetic data only), in a virtual environment outside the
repository or in the ignored `.venv/`:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r scripts/polar/requirements.txt
.venv/bin/python -m unittest discover -s scripts/polar -v
```

The tests build small synthetic tables in temporary folders. Running
`train_retrospective.py` itself needs private input files that are not part of
this repository; its private output (`private-models-and-provenance.json`) must
never be committed. See [`scripts/polar/README.md`](scripts/polar/README.md).

## Repository layout

```
.github/workflows/deploy.yml   build + deploy to GitHub Pages
astro.config.mjs               site URL, React and sitemap integrations
public/                        static files copied as-is (favicon, CNAME, robots.txt,
                               og-image, standalone HTML artefacts, aggregate JSON,
                               portfolio demo files, social preview images in og/)
scripts/editorial/             editorial checker v1.0 (Python, stdlib) and its tests
scripts/polar/                 Polar retrospective benchmark (Python) and its tests
scripts/generate-og.mjs        generator for the social preview images in public/og/
src/content/                   Markdown collections (informes, lab, pages)
src/content.config.ts          Zod schemas for the content collections
src/data/                      structured project data (portfolio.json, demo data)
src/components/                React/Astro components (site/, demos/, evidence/)
src/layouts/                   page layout
src/pages/                     routes (file-based routing)
src/styles/                    design tokens and global CSS
tests/                         Node test-runner tests for demo data, components and assets
```

`public/pranayama/` holds a separate standalone static app; it is not one of the
four portfolio projects.

Repository documents:

- [`CLAUDE.md`](CLAUDE.md): content and publishing contract for the clinical content (Spanish).
- [`DESARROLLO-LOCAL.md`](DESARROLLO-LOCAL.md): local development notes (Spanish).
- [`CONSOLIDACION.md`](CONSOLIDACION.md) and [`AUDIT.md`](AUDIT.md): historical records of earlier reviews.

## Deployment

`.github/workflows/deploy.yml` runs on every push to `main` and on manual dispatch
(`workflow_dispatch`). It installs dependencies with `npm ci` on Node 22, runs
`npm run build` and publishes `dist/` to GitHub Pages; `public/CNAME` maps it to
`www.kineticaai.com`.

**There is no staging branch: a push to `main` publishes the live site.** Review
the full diff before merging.

The workflow also declares a `workflow_run` trigger for a workflow named
"Biometrics Live Update". That workflow is no longer in this repository.

## Data and privacy

- Health data, diaries, wearable exports, trained models and credentials do not
  belong in this repository.
- Published Polar figures are aggregates (`public/data/polar-retrospective-summary.json`).
- `public/portfolio-demo/` contains two downloadable code bundles (the editorial
  checker with two synthetic example files; the Polar benchmark with a synthetic
  demo) and two Prompt Lab JSON files of saved outputs (a dated evaluation record
  and a synthetic replay).
- `.env` files and `.venv/` are ignored by Git.
