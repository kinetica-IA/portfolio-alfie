---
title: Content and publishing contract — kineticaai.com
version: 1.0
date: 2026-08-19
owner: Alfonso Navarro
status: active
---

# CLAUDE.md

Working contract for content work in this repository. Read this before editing
any file under `src/content/`.

Repository: `portfolio-alfie` (GitHub org `kinetica-IA`)
Local path: `/Users/alfonsonavarro/portfolio-alfie-web-live`
Deploy: any push to `main` triggers GitHub Actions and publishes to
`www.kineticaai.com` in ~2 minutes. There is no staging branch.

Do not confuse this checkout with `/Users/alfonsonavarro/portfolio-alfie`,
which holds a live Polar sync and must not be touched.

---

## 1. Hard rules

- **Never `git push` without an explicit "sí" from Alfonso.** Show the exact
  command and the full diff first. A push is a publication to a live clinical
  site.
- Never invent, reformat or "fix" a DOI. If a DOI does not resolve, flag it and
  stop.
- Never add features, refactors, tests, logging or polish that were not asked
  for. If something is missing, say so in one line.
- Frontmatter structure is a contract validated by the Zod schema in
  `src/content.config.*`. Body prose is free.

## 2. Audience routing

Two audiences share one build and must not be blended:

| Route | Audience | Register |
|---|---|---|
| `/`, `/about`, `/informes/*` | patient, cold local traffic | plain Spanish, first person, problem-first |
| `/lab/*` | peers, technical readers, LinkedIn referrals | technical, methodological |

`/lab` is not first-level navigation for cold traffic. It is reached from
`/about` and from external links.

## 3. Voice

- First person singular. Write "valoro", "derivo", "coordino" — never the
  impersonal infinitive ("valorar", "derivar"), which reads as an internal
  protocol rather than as a person talking to a patient.
- Address the reader as "tú".
- Short, direct, warm. No em-dashes as connectors. No decorative emoji.
- Name the reader's problem before naming the technique. Patients do not search
  for methods, they search for what hurts.
- Every clinical claim carries a DOI already present in the frontmatter, or it
  is removed.
- Never position Alfonso against other professionals. No patient-pilgrimage
  narratives ("saw three physios, nobody found it"), no implication that others
  missed something. Describe the condition, not the failure of others.

## 4. Prohibited language (RD 1907/1996, art. 4)

Spanish law on advertising of services with an intended health purpose. The
following are blocked and must be flagged by the publish check:

- Guarantees of relief or cure: "garantizado", "resultados seguros",
  "sin riesgos", "elimina definitivamente", "curación".
- Numbered promises of outcome: "en 5 sesiones", "recupera tu vida en".
- Superlatives of provider quality: "el mejor tratamiento", "el único".
- Patient testimonials, before/after imagery, and any patient-identifying
  detail: age, sex, exact surgery date, rare diagnosis plus location, or any
  combination that allows re-identification in a small catchment area.
- Claims of therapeutic utility for a disease without a cited source.

`patient_register: true` is an internal editorial flag. It must never surface
in rendered output.

## 5. Media policy

**Images.** Place under `src/assets/`. Reference with relative markdown syntax
so Astro's asset pipeline optimises them. No `.md` to `.mdx` migration needed
for images alone. Always supply alt text in Spanish.

**Video — screen recordings.** Export 1080p, H.264, CRF 23. Strip audio when
the demo is self-explanatory. Then:

- under 5 MB: commit to `/public/video/`, embed as
  `<video muted loop playsinline preload="metadata" controls>`.
- 5 MB or more: host on an external CDN and embed by URL. Never commit it.
  Git history is permanent and this repository has already been purged once.

Prefer, in this order: (1) an annotated screenshot when the point is a result,
(2) an embedded interactive artefact when the point is something the reader can
manipulate, (3) video only when the essential content is a temporal sequence.

**Self-contained HTML artefacts.** Keep the original file untouched at
`/public/artefactos/<slug>.html` and embed it in a responsive iframe. Do not
rewrite the artefact to match the site Layout.

**MDX.** Markdown cannot host components. Rename to `.mdx` only the individual
files that need an embedded component. Leave every other file as plain `.md`.
Do not enable `markdown.format: 'mdx'` globally — it widens the build failure
surface across all content for the benefit of three files.

## 6. Publish skill — build brief

Build a skill, `content-publish`, that runs the following in order and stops on
the first failure:

1. `git pull origin main` and report if the working tree was not clean.
2. Validate frontmatter of every changed file against the collection schema.
3. Run the prohibited-language check from section 4 across changed bodies.
   Report line numbers. Do not auto-edit.
4. Run a PII check: age + sex + diagnosis co-occurrence, dates of surgery,
   place names smaller than a province.
5. Resolve every DOI in the changed frontmatter against PubMed. Report title
   mismatches. Do not correct them.
6. Verify media policy: any file added under `/public/video/` exceeding 5 MB is
   a failure.
7. `npm run build`. Report errors verbatim.
8. Print `git status` and the full diff, then stop and wait for "sí".
9. On "sí": commit with `content: <description>` and push to `main`. Then poll
   the Actions run and report the result.

## 7. Content state

Current files under `src/content/`:

```
pages/about.md
informes/atm-les.md
informes/psoriasis.md
informes/lumbar.md
lab/coordinacion-pilates-fusion.md
lab/ia-osteopatia.md
lab/entrenamiento-personalizado.md
lab/cut-cadena-posterior.md
lab/lyme-pipeline.md        # draft: true, excluded from build
```

Closed 2026-08-20:

- `about.md`: expanded — Cómo trabajo, La sesión, Lo que no hago, Escríbeme. ✓
- `lumbar.md`: voice pass (evalúo, te derivo); patient-pilgrimage intro
  removed; calibration paragraph added; cross-link to
  /lab/coordinacion-pilates-fusion. ✓
- `atm-les.md`: case-report heading removed. ✓
- `lyme-pipeline.md`: draft:true confirmed, excluded from all routes. ✓

Open:

- `atm-les.md`: voice and typos in body still pending — "se ha de evaluar",
  "derivar para", `reamatologo`, `promer`, `patologias`.
- `psoriasis.md`: same voice/typo pass needed (`respioración`, `evalúar`,
  infinitive headers).
- `about.md`: photo, Annuaire Santé QR (RPPS credential), `wa.me` CTA
  alongside the existing `mailto:`.
- `cut-cadena-posterior.md`: body empty; embed HTML artefact via iframe.
