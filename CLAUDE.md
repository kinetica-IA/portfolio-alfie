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
Local path: `/Users/alfonsonavarro/Code/portfolio-alfie-web-live`
Deploy: any push to `main` triggers GitHub Actions and publishes to
`www.kineticaai.com` in ~2 minutes. There is no staging branch.

Do not confuse this checkout with `/Users/alfonsonavarro/Code/portfolio-alfie`,
which contains historical research and Polar pipeline work. Its current runtime
status is not established by this file. Keep that checkout separate from clinical
site work; preserve its local branches, stash and uncommitted files.

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

## 6. Publication reference — use only for an explicit publishing task

This section describes a workflow reference, not an instruction to create a skill
or start publishing. Do not install tooling or resume an old task from this file.

1. Read `git status`, the current branch and the local/remote references. Check
   that this is the clinical checkout. Report uncommitted changes before planning
   an update; do not run an automatic `git pull` or merge as a preflight step.
2. Validate frontmatter of changed content against the collection schema.
3. Check the editorial restrictions in section 4 and report line numbers; do not
   auto-edit prose. Run the PII check for age, sex and diagnosis co-occurrence,
   surgery dates and places smaller than a province; report identifying details.
4. Resolve the DOIs used by changed content against PubMed, report title mismatches and do not
   invent or silently repair identifiers.
5. Check the media policy in section 5. New files under `/public/video/` larger
   than 5 MB fail that check.
6. Run `npm run build` when validating an authorized site change. Report errors.
7. Present the complete intended diff and exact commit/push commands. Wait for
   Alfonso's explicit "sí" before publishing; a push to `main` publishes.
   For a content commit, retain the `content: <description>` message convention.
8. After an authorized publication, verify its Actions result. Do not infer
   success from a local commit or from an old successful run.

## 7. State references, not a standing task list

Inspection on 2026-11-08 found that the old "Open" list was partly superseded:

- The listed voice/typo terms in `atm-les.md` and `psoriasis.md` were absent; the
  2026-08-20 commit records the voice rewrite. This does not certify every aspect
  of those clinical texts.
- `about.md` contains a WhatsApp link. Its photo and Annuaire Sante QR status were
  not confirmed by this audit and must be checked if requested.
- `cut-cadena-posterior.md` has a non-empty body and an iframe. The 2026-08-21
  commit records the standalone artefact and route work.
- Treat `lyme-pipeline.md` as excluded draft material unless a new explicit
  decision authorizes changing that publication restriction.

Read the current files and the user's request to decide what remains to do.
Do not recreate historical pending tasks or assume an old checklist is current.
