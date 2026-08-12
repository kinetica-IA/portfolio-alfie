# Kinetica AI — Phase 0 Frontend Audit

**Date:** 2026-08-12
**Branch:** `claude/kinetica-clinical-pivot-sr9c2o` (see "Deviations" §9 — brief specifies `clinical-pivot`)
**Scope:** Full repository audit ahead of the clinical repositioning (clinical-AI portfolio → private osteopathy/biomechanics practice under KINETICAAI).
**Status:** Awaiting Alfonso's review and approval before Phase 1 (Purge) begins. No code was modified to produce this document; a local `npm ci && npm run build` was run to verify the build baseline, then the build output was discarded.

---

## 1. Component inventory

`src/App.jsx` composes the current single-page site. Actually-wired components vs. orphaned ones:

| Component | Wired in? | Generic or product-specific | Notes |
|---|---|---|---|
| `TopBar.jsx` | ✅ `App.jsx` | **Generic shell**, product-specific content | Fixed nav bar, brand wordmark, nav links (`#system #evidence #research #about`), LinkedIn/GitHub/email icons |
| `Hero.jsx` | ✅ `App.jsx` | **Generic shell**, product-specific copy | Headline/sub/CTA structure reusable; current copy ("243 days… auditable clinical AI") is product-specific |
| `LivePulse.jsx` | ✅ `App.jsx` (renders inside Hero, conditional on Polar data) | Product-specific | Reads `usePolarData()` → sparkline of `hrv_rmssd_night`. Whole component is predictor-tied |
| `Pillars.jsx` | ✅ `App.jsx` | Product-specific content, generic layout | "Pipeline / Predictors / Architecture & safety" cards |
| `Evidence.jsx` | ✅ `App.jsx` | Product-specific | AUC/day-count/RAG-accuracy stat blocks |
| `OpenResearch.jsx` | ✅ `App.jsx` | Product-specific | Cards + index rows linking to all 8 deprecated static HTML pages + GitHub repo |
| `FounderContact.jsx` | ✅ `App.jsx` | **Generic shell** (bio/timeline/credentials/contact pattern), product-specific content | Timeline, Coursera credential list, badges, contact CTA — pattern is reusable for `/about`, content needs full rewrite |
| `FooterField.jsx` | ✅ `App.jsx` | **Generic**, keep verbatim | Wordmark + copyright line only |
| `SectionDivider.jsx` | ✅ `App.jsx` (×4) | **Generic**, keep verbatim | Animated line + pulsing node between sections |
| `GrainHoverBackground.jsx` | ✅ `Layout.astro` | **Generic**, keep verbatim | Cursor-reveal grain canvas, brand-teal toned but not product-specific |
| `OrganicSymbols.jsx` (`FloatingDecorators` + 6 canvas symbols) | ✅ `Layout.astro` (`FloatingDecorators` only) | **Generic**, keep verbatim | The 6 named symbol exports (`PulseSymbol`, `OrbitSymbol`, `SignalSymbol`, `CellSymbol`, `NetworkSymbol`, `HelixSymbol`) are only consumed by `Pillars`/`FounderContact`/`OpenResearch`, which are being replaced — symbols themselves are content-neutral micro-animations and can be reused or dropped per new design |
| `Reveal.jsx` | ❌ not imported anywhere | **Generic**, unused wrapper | Thin wrapper around `useReveal`; every section implements its own reveal inline instead. Dead code today, safe generic utility to keep or delete |
| `BreathingField.jsx` | ❌ not imported anywhere | Orphaned | "Dual 3D cones" hero background experiment. No live reference in `App.jsx`, `Layout.astro`, or any static HTML page |
| `FilmGrain.jsx` | ❌ not imported anywhere | Orphaned | Click-to-reveal film-grain effect with an on-page debug panel (`window.__FILM_PARAMS`, press-F overlay). No live reference anywhere |

**Hooks** (`src/hooks/`):

| Hook | Used by | Generic/reusable |
|---|---|---|
| `useReveal.js` | Evidence, FounderContact, LivePulse, OpenResearch, Pillars, Reveal, SectionDivider | ✅ Generic — **keep** |
| `useWordStagger.js` | FounderContact | ✅ Generic — **keep** |
| `useTextDecode.js` (binary 0/1 decode effect) | Imported by `FounderContact.jsx` but **never invoked** (dead import — no `useTextDecode(...)` call in the file body) | ✅ Generic — **keep**. **This is the "existing hero text-animation component" the pivot brief refers to.** Important: it is currently *not* wired into `Hero.jsx` or `TopBar.jsx` at all — the live hero uses a plain fade/translateY stagger, not a decode effect. It exists as working, tested infrastructure but needs to be newly wired into the hero for the "Recupera tu movimiento ↔ Del síntoma al mecanismo" alternating subtitle in Phase 2 |
| `useCountUp.js` | **Not imported anywhere** | Generic but currently orphaned. New IA (hero / about / informes / lab / contacto) has no metrics dashboard to count up — candidate for deletion unless Alfonso wants to reserve it |
| `usePolarData.js` | `App.jsx` | Product-specific (fetches `/data/polar_live.json`) — **kill** |

**Astro layer:**

| File | Role | Generic/keep |
|---|---|---|
| `src/layouts/Layout.astro` | `<head>` shell: SEO meta, Open Graph, Schema.org JSON-LD, font preconnects, Cloudflare + GoatCounter analytics, ntfy.sh visit-ping script, mounts `GrainHoverBackground` + `FloatingDecorators` | **Keep shell**, all title/description/OG/Schema.org content is product-specific and needs full rewrite (see §2) |
| `src/pages/index.astro` | Single route, mounts `<App client:load />` | Keep as scaffold; will become the new `/` hero route |

---

## 2. Route inventory

Astro currently defines exactly **one** route (`src/pages/index.astro` → `/`). Everything else the site serves is a static file dropped into `public/` and copied verbatim into `dist/` by the build (confirmed via a clean `npm run build`: only `/index.html` is generated by Astro; the 8 HTML files below are copied as static assets, unrouted by Astro).

| Route / file | Content type | Proposed status |
|---|---|---|
| `/` (`src/pages/index.astro` + `App.jsx`) | Clinical-AI portfolio single-pager (Hero, Pillars, Evidence, OpenResearch, FounderContact) | **Repurpose** → new hero + nav shell (Phase 2) |
| `/ans-predictor.html` | ANS multi-symptom predictor writeup, AUC/CI tables, ROC/forest-plot/confusion-matrix visualizations | **Delete** |
| `/convergence-analysis.html` | Cross-predictor convergence analysis (ANS vs. Sleep models) | **Delete** |
| `/diary.html` | DSQ symptom-diary web form, writes to `data/diary_live.csv` via GitHub Contents API using a user-supplied PAT stored in the browser | **Delete** (also a lingering security surface — a client-side GitHub PAT input — worth flagging even independent of the pivot) |
| `/io-architecture.html` | IO3 LangGraph agent architecture + ALMA safety-layer documentation | **Delete** |
| `/knowledge-rag.html` | Clinical knowledge/RAG corpus documentation | **Delete** |
| `/lyme-hrv.html` | "ANS as Lyme Biomarker" — predictor-metrics page tied to the old multi-symptom model | **Delete** — see §9 nuance on "lyme" as a purge keyword |
| `/pipeline.html` | L0–L6 data pipeline documentation/diagram | **Delete** |
| `/sleep-quality-predictor.html` | Sleep-quality predictor writeup | **Delete** |
| `/googleaa24cf9918593077.html` | Google Search Console verification file (0 bytes) | **Keep** — generic site infra, unrelated to product content |

New route map (Phase 2, not yet built):

```
/                    hero + animated slogan
/about               biography, credentials, service scope
/informes/atm-les    generic clinical report
/informes/psoriasis  generic clinical report
/informes/bruxismo   generic clinical report
/lab                 cards: IA in osteopathy, Lyme n-of-1, + future cards
```

This requires introducing Astro routing beyond the single `index.astro` (e.g. `src/pages/about.astro`, `src/pages/informes/[slug].astro` or static files, `src/pages/lab/index.astro`) plus a `src/content/` collection for the Markdown Alfonso will supply in Phase 3. None of this exists yet — it is new build, not a repurpose of existing route files.

---

## 3. Asset inventory

| Asset | Path | Tied to deprecated predictor? | Proposed status |
|---|---|---|---|
| `p5.png` | `public/assets/p5.png` (1.2 MB) | Yes — only referenced by the 8 deprecated HTML pages (`grep` confirms 8 matches, all in files on the Phase-1 kill list) | **Delete** |
| `biomech.svg`, `consult.svg`, `neuro.svg` | `public/icons/` | Yes — same 8 files reference `icons/biomech`, `icons/consult`, `icons/neuro` | **Delete** |
| `ambient.js` | `public/ambient.js` (79 lines) | Yes — legacy vanilla-JS background-blob script used only by the static HTML pages (the live Astro app has its own React equivalent, `GrainHoverBackground.jsx`) | **Delete** |
| `grain-hover.js` | `public/grain-hover.js` (106 lines) | Yes — same situation as `ambient.js`, duplicative of `GrainHoverBackground.jsx` | **Delete** |
| `public/scripts/pipeline.js`, `public/styles/pipeline.css` | 172 + 320 lines | Yes — support `pipeline.html` only | **Delete** |
| `public/data/polar_live.json` (18.8 KB), `public/data/io3_state.json` (2.4 KB, contains an `Anthropic` string), `public/data/pipeline_state.json` (3.7 KB) | `public/data/` | Yes — biometric/predictor state written by the Python pipeline and GitHub Actions, read by `usePolarData.js` and the deprecated pages | **Delete**, and see §9 re: the two data-writing workflows |
| `data/diary_live.csv` | repo root `data/` | Yes — symptom diary written by `/diary.html` and consumed by the retrain pipeline | **Delete** |
| `favicon.svg`, `og-image.jpg`, `manifest.webmanifest`, `CNAME`, `robots.txt` | `public/` | No — generic site infra, referenced from `Layout.astro`/build config | **Keep**, but `og-image.jpg` almost certainly depicts the old clinical-AI brand framing and `manifest.webmanifest`'s `description` field says "Clinical AI systems for wearable autonomic monitoring…" — both need new content in Phase 2/3, not deletion. No new image can be produced without material from Alfonso (see §9) |

---

## 4. Styling inventory

- **Design tokens**: `src/styles/tokens.css` (full reset + tokens, used by `index.astro`) and `src/styles/tokens-vars.css` (variables-only subset, meant to be `<style>`-embedded into standalone static HTML — actually **not currently linked from any of the 8 static pages** based on grep; each static page appears to inline its own copy of the palette instead. Worth confirming with Alfonso whether `tokens-vars.css` was ever actually wired up, since it becomes moot once those 8 pages are deleted).
- **Palette**: 10 named colors (`--teal #90a7a5`, `--green #6b9e7a`, `--warm #c4855a`, `--slate #6a8690`, `--sea #5d8a82`, `--moss #6b8a6d`, `--ice #85a8b8`, `--clay #a8796e`, `--sand #bfa87a`, `--gold #d4a843`) on a `--bg: #f0f9f9` mint-white ground. **This is brand identity — keep.**
- **Typography**: Montserrat (`--sans`, weights 300–600) + DM Mono (`--mono`, weights 400–500), loaded via Google Fonts `<link>` in `Layout.astro`. **Keep.**
- **Motion tokens**: `--ease-out`, `--duration-reveal` (1.6s), `--duration-hover` (0.3s), `--anim-fast/base/slow`. **Keep** — these drive `useReveal`/`useWordStagger` and all the section-reveal CSS.
- **Animation/text component for hero reuse**: `useTextDecode.js` — see §1. This is the component the pivot brief means by "the text-animation component used in the current hero" — worth flagging that as of today it is *not* actually active in the hero (dead import in `FounderContact.jsx`, absent from `Hero.jsx`/`TopBar.jsx`). It is fully functional and generic; it simply needs to be wired in fresh.
- **Reduced-motion handling**: both token files include a `prefers-reduced-motion: reduce` block that zeroes out animation/transition durations site-wide. **Keep** — good baseline accessibility practice, directly relevant to the Lighthouse accessibility gate in Phase 4.
- **Per-component `<style>` blocks**: every `.jsx` component ships its own scoped `<style>{​`…`}​` template string rather than a shared stylesheet. This pattern is itself generic/reusable — new components (informe pages, lab cards) can follow the same convention.

---

## 5. Build state

- **Astro**: `^6.1.3` (installed: 6.x, static output mode, `site: 'https://www.kineticaai.com'`)
- **React**: `^19.0.0` / `react-dom ^19.0.0`, via `@astrojs/react ^5.0.2`
- **Other deps**: `@paper-design/shaders-react 0.0.76` (declared in `package.json` — **not found referenced anywhere** in `src/` or `public/` via grep; appears to be an unused dependency already, independent of the pivot), `@astrojs/sitemap ^3.7.2`, `sharp ^0.34.5`, `vite ^6.3.0`
- **No lint/format tooling**: no `.eslintrc*`, `.prettierrc*`, or `.editorconfig` found anywhere in the repo; `package.json` has no `lint` script. The Phase 4 "zero warnings" gate refers to the Astro/Vite build output, not a separate lint pass, since there is no linter configured.
- **Verified build baseline** (ran `npm ci && npm run build` locally, then discarded `dist/` and `.astro/`):
  - Clean install: 319 packages, 0 errors (10 audit advisories reported by `npm audit`, pre-existing, unrelated to this task)
  - `astro build` completes in ~2.5s, **zero warnings**, one static route (`/index.html`) plus a generated sitemap
  - All `public/*` files (including the 8 deprecated HTML pages, `ambient.js`, `grain-hover.js`, `p5.png`, etc.) are copied verbatim into `dist/` — confirming they are static passthrough assets, not Astro-rendered routes
  - Total `dist/` size: 2.1 MB
- **CI/CD**: `.github/workflows/deploy.yml` — Node 22, `npm ci && npm run build`, deploys `dist/` to GitHub Pages on push to `main` or on completion of the `Biometrics Live Update` workflow. **Preserve as-is** per ground rules; it has no awareness of specific routes/content and needs no change for the pivot.
- **Two additional workflows exist that are entirely predictor-infrastructure** and are not mentioned in the brief's "preserve CI/CD" scope in the same way `deploy.yml` is — see §9 for the explicit question this raises:
  - `.github/workflows/polar-biometrics.yml` — daily cron, fetches Polar HRV data, writes `public/data/polar_live.json` + `pipeline_state.json`, commits to `main`
  - `.github/workflows/polar-retrain.yml` — triggered on push to `data/diary_live.csv`, retrains the predictor, commits `polar_live.json`

---

## 6. Kill list

Everything below is proposed for deletion in Phase 1. Each item's one-line justification is the "tied to deprecated predictor/portfolio" test from the brief §0.

**Routes / static pages** (`public/*.html`, 7000 lines total across 8 files):
- `ans-predictor.html`, `convergence-analysis.html`, `diary.html`, `io-architecture.html`, `knowledge-rag.html`, `lyme-hrv.html`, `pipeline.html`, `sleep-quality-predictor.html` — all are content pages for the deprecated ANS/IO3/ALMA/predictor product surface.

**Assets:**
- `public/assets/p5.png`, `public/icons/biomech.svg`, `public/icons/consult.svg`, `public/icons/neuro.svg`, `public/ambient.js`, `public/grain-hover.js`, `public/scripts/pipeline.js`, `public/styles/pipeline.css`, `public/data/polar_live.json`, `public/data/io3_state.json`, `public/data/pipeline_state.json`, `data/diary_live.csv` — each is referenced only by, or produced only for, the deprecated pages/pipeline above.

**Components:**
- `src/components/LivePulse.jsx` — renders the live HRV sparkline; predictor-tied, no purpose once `polar_live.json` is gone.
- `src/components/Pillars.jsx`, `src/components/Evidence.jsx`, `src/components/OpenResearch.jsx` — copy and links are 100% product-specific (predictor AUCs, IO3, ALMA, GitHub repo links); the new IA (`/about`, `/informes/*`, `/lab`) replaces these outright rather than reskinning them.
- `src/components/BreathingField.jsx`, `src/components/FilmGrain.jsx` — orphaned/unused today (confirmed: not imported anywhere), no destination in the new design. Flagged as a question, not an automatic delete — see §9.

**Hooks:**
- `src/hooks/usePolarData.js` — fetches the deleted `polar_live.json`.
- `src/hooks/useCountUp.js` — orphaned today; no metrics UI in the new IA. Flagged as a question, not an automatic delete — see §9.

**Root-level planning/audit docs** (not part of the shipped site, but part of the repo and explicitly "deprecated portfolio" material):
- `REDESIGN-BRIEF.md` (42 KB Isidor-vs-Kinetica visual redesign brief for the old product)
- `portfolio-audit-report.md` (prior clinical-AI portfolio audit, superseded by this document)
- `viz-implementation-notes.md` (implementation notes for `ans-predictor.html` visualizations)
- `docs/ANS_PREDICTOR_PIPELINE.md`, `docs/pipeline_run_order.md`

**Python data pipeline** (entire directory trees, feeding only the deleted predictor pages/data):
- `analysis/`, `pipeline/`, `scripts/` (all 8 scripts), `notebooks/`, `pyproject.toml`, `uv.lock`
- `data/processed/` (currently empty `.gitkeep` placeholders only)
- Two GitHub Actions workflows: `.github/workflows/polar-biometrics.yml`, `.github/workflows/polar-retrain.yml`

**Schema.org / SEO content in `Layout.astro`** (not whole-file deletion — the file is kept as the shared `<head>` shell, but its content needs full replacement in Phase 2):
- `<title>`, meta description/keywords, Open Graph tags, and the entire `@graph` JSON-LD block (`Organization`/`Person`/`SoftwareApplication`/`Dataset` referencing `polar-lyme-predictor`, HRV, autonomic nervous system, N-of-1 longitudinal study)

---

## 7. Keep list

Preserved verbatim (or near-verbatim, content aside):

- `src/components/TopBar.jsx` — nav shell, will get new nav items (Inicio / Sobre mí / Informes / Lab / Contacto) but the component structure, scroll-hide behavior, and mobile breakpoint logic stay
- `src/components/FooterField.jsx` — generic, only the copyright name needs to persist (already does: "Alfonso Navarro")
- `src/components/SectionDivider.jsx` — generic animated divider, reusable across any new section
- `src/components/GrainHoverBackground.jsx` — generic cursor-reveal grain background, brand-colored but content-neutral
- `src/components/OrganicSymbols.jsx` → `FloatingDecorators` export — generic ambient decoration; the 6 named symbol components are reusable if the new design wants iconography, optional otherwise
- `src/components/Reveal.jsx` — generic reveal wrapper (currently unused but harmless, low-cost to keep)
- `src/hooks/useReveal.js`, `useWordStagger.js`, `useTextDecode.js` — generic, reusable animation hooks. **`useTextDecode.js` is specifically named for reuse in the new hero's alternating slogan** per the brief.
- `src/styles/tokens.css`, `src/styles/tokens-vars.css` — full brand palette, typography scale, motion tokens, reduced-motion handling
- `src/layouts/Layout.astro` — kept as the `<head>`/analytics/font shell; **content inside it (title, meta, OG, JSON-LD) is rewritten, not the file's role**
- `.github/workflows/deploy.yml` — CI/CD pipeline, unchanged
- `public/favicon.svg`, `public/manifest.webmanifest`, `public/CNAME`, `public/robots.txt`, `public/googleaa24cf9918593077.html` — generic site infra (manifest/OG description text needs a content update in Phase 2/3, not deletion)
- Cloudflare Web Analytics + GoatCounter script tags in `Layout.astro` — generic, product-neutral analytics (see §9 re: the ntfy.sh visit-ping script, which is a separate judgment call)
- Primary contact channels — LinkedIn (`navarro-kinetica-ai`) and a `mailto:` link — the *pattern* is generic and directly matches the brief's CTA requirement; the specific email address and whether GitHub stays are open questions (§9)

---

## 8. Extended purge terms

Base pattern from the brief:
```
predictor|io3|alma|ans-predictor|hrv-pipeline|samd|mdr|ai-act|anthropic-evaluator
```

Extended terms found during this audit (case-insensitive), to be combined with the base pattern for the Phase 1 acceptance grep over `src/ public/ content/`:

```
ans predictor|ans_predictor|multi-symptom|multi symptom
io3|io-architecture|io agent|langgraph
alma|safety layer|ethical framework
polar[_-]?live|polar_live\.json|polar-lyme-predictor|polar accesslink|polaraccesslink
pipeline_state|pipeline\.html|pipeline\.js|pipeline\.css
io3_state
diary_live|dsq[_ -]?diary|symptom diary
hrv[_-]?rmssd|rmssd|hrv[_-]?pipeline|heart rate variability
ans[_ -]?charge|autonomic (nervous system|dysfunction|burden)|disfuncion[_ ]?autonomica
lyme[- ]?hrv|lyme biomarker
convergence[- ]?analysis
sleep[- ]?quality[- ]?predictor
knowledge[- ]?rag|clinical rag|1,?880 (audited )?chunks
fatiga|niebla[_ ]?mental|severidad[_ ]?global|pem[_ -]?predictor|post-exertional malaise|myalgic encephalomyelitis|me/cfs
loo-cv|leave-one-out|bootstrap (1000|ci95)|auc\s*0\.\d\d|forest[- ]?plot|roc[- ]?curve|confusion matrix
n-of-1 (?!self-observation)   # see nuance below — "n-of-1" alone is not purge-worthy; only in predictor-metrics context
anthropic
mdr|samd|ai act|eu ai act
kinetica-ia/polar-lyme-predictor|github\.com/kinetica-ia
p5\.png|biomech\.svg|consult\.svg|neuro\.svg
ambient\.js|grain-hover\.js(?!.*GrainHoverBackground)   # the .jsx component name must not be caught by the .js filename pattern
usepolardata|livepulse
```

**Nuances the grep must not blindly apply** (flagging so Phase 1 doesn't over-delete):
1. **"Lyme"** — the new site *keeps* `lab/lyme-pipeline.md` (Alfonso's own n-of-1 self-observation narrative, per brief §Phase 3). Only the *old* `public/lyme-hrv.html` predictor page and any `lyme-hrv`/"ANS as Lyme Biomarker" strings are kill-list. A bare `lyme` pattern would false-positive on legitimate new content.
2. **"N-of-1"** — used both in the deprecated predictor framing (`hero-eyebrow`: "N-of-1 · longitudinal · open research") and is explicitly the correct label for Alfonso's retained Lyme self-observation case. The term itself isn't purge-worthy; only its co-occurrence with predictor/AUC/pipeline language is.
3. **"Osteopathy"** — already appears in the current bio copy (`FounderContact.jsx`: "Trained in osteopathy at UAB") and is obviously core to the new site — not a purge term, opposite in fact.

---

## 9. Deviations and open questions for Alfonso

Per the brief's own instruction ("Any deviation from the brief is proposed as a question, not executed"), flagging these before Phase 1 starts:

1. **Branch name.** The brief's ground rules specify a branch named `clinical-pivot`. This session's harness/system configuration designates `claude/kinetica-clinical-pivot-sr9c2o` as the working branch and the target for the eventual PR. I have developed on the harness-designated branch rather than creating `clinical-pivot`, since the harness does not permit pushing to an arbitrary branch name outside its own configuration. **Please confirm this is acceptable**, or let me know if you'd like the work mirrored onto a branch literally named `clinical-pivot` as well.

2. **Rollback tag timing.** Ground rules ask to "tag current main as `pre-clinical-pivot-2026-08-12` before any deletion." No tag exists yet. Since Phase 0 makes no deletions, I've held off creating/pushing it — I'll create and push this tag as the very first action of Phase 1, immediately before the first file is removed. Flag if you'd rather I create it now instead.

3. **Scope of the Python data pipeline** (`analysis/`, `pipeline/`, `scripts/`, `notebooks/`, `data/`, `pyproject.toml`, `uv.lock`, plus `polar-biometrics.yml` and `polar-retrain.yml`). Brief §0 says the deprecated product surface is "deprecated in full," which I read as covering this pipeline too, since its only output feeds pages/data now on the kill list. However, Phase 1's acceptance grep is explicitly scoped to `src/ public/ content/` — it would not "see" this directory tree at all. **I'm treating full deletion of this pipeline (code + the two workflows) as in-scope for Phase 1 and listed it in §6**, but want your explicit confirmation before removing it, since it also means the two workflows stop running (no more nightly Polar fetches or auto-retrain commits) and the Polar API secret becomes unused. Alternative: archive it to a separate branch/tag rather than delete outright, in case the raw physiological dataset has value to you outside the site.

4. **Contact email mismatch.** The live site uses `alfon.atman@gmail.com` (`TopBar.jsx`, `FounderContact.jsx`). Your account context for this session shows `alfonsonavarroarredondo@gmail.com`. The brief's CTA spec doesn't name an address. **Which email should the new `mailto:` CTA use?** I won't guess — this is exactly the kind of invented content the brief prohibits.

5. **Social links in the new nav/contact block.** The brief's new nav is `Inicio / Sobre mí / Informes / Lab / Contacto` with "Contacto" pointing to the preserved generic contact block. It doesn't say whether the current LinkedIn and GitHub icons in `TopBar.jsx` survive. GitHub in particular linked to the now-deleted `polar-lyme-predictor` open-research narrative — keeping the icon without that content would dangle. **Keep LinkedIn only, drop GitHub, or keep both pointing elsewhere?**

6. **`og-image.jpg` / `manifest.webmanifest` description.** Both currently carry old-brand content ("Clinical AI systems for wearable autonomic monitoring…"). Per the "no content invented" rule, I can rewrite the manifest's text once you approve copy, but the OG preview *image* itself needs new artwork from you — I can't generate a substitute without inventing visual content for a medical-practice brand.

7. **`BreathingField.jsx` and `FilmGrain.jsx`** — confirmed unused anywhere in the live build (dead code today, not wired into `App.jsx`, `Layout.astro`, or any static page). Proposed for deletion in §6, but since they're generic visual experiments (not predictor-specific), **flagging in case either was intended for reuse** in the new hero's ambient background before I remove them.

8. **`useCountUp.js`** — same situation: generic, currently orphaned, no destination in the new IA (`/about`, `/informes/*`, `/lab` have no metrics dashboard as currently briefed). Proposed for deletion; **flag if you want it kept** for a future numeric display (e.g. years in practice, case count).

9. **ntfy.sh visit-notification script** in `Layout.astro` (fires an unauthenticated POST to a public `ntfy.sh` topic on every page load, containing the path, referrer, browser language, and timestamp — visible to anyone who knows or discovers the topic name). This is generic infrastructure, not product-specific, so it's not on the kill list by the brief's own criteria — but the new site is a patient-facing medical practice, and I want to flag it explicitly rather than silently carry it forward. **Keep, remove, or replace with something more appropriate for a clinical site (e.g. just GoatCounter, which is already present and privacy-respecting)?**

10. **`@paper-design/shaders-react` dependency** — declared in `package.json` but not referenced anywhere in `src/` via grep. Appears to be pre-existing unused cruft, unrelated to the clinical pivot. Not touching it as part of this audit, flagging only for awareness; happy to remove it in Phase 1 as routine cleanup if you'd like.

11. **`/diary.html` security note** (unrelated to the pivot itself, but surfaced during the audit): the page takes a GitHub Personal Access Token as browser input and stores/uses it client-side to write directly to the repo. Since this page is being deleted entirely per the brief, this resolves itself — noting only so it's not mistaken for an oversight.

---

## Summary

Phase 0 is complete. No code, content, or configuration was changed — this document plus a discarded local build (`dist/`, `.astro/` were removed after verification, `git status` is clean) are the only outputs.

**Proposed next step (Phase 1 — Purge):** pending your review and approval of this document, and answers to §9 questions #1–#6 in particular (branch, tag timing, pipeline scope, contact email, social links, OG image) since those materially affect what gets deleted and what the surviving contact/nav block looks like. Items #7–#11 are lower-stakes and I'm comfortable defaulting to the proposal in §6/§7 if you don't have a strong preference.
