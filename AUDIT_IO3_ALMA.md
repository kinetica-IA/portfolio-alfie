# AUDIT — Remove IO3 / ALMA from kineticaai.com portfolio

- Branch: `claude/remove-io3-alma-portfolio-0eb635`
- HEAD: `dd8e1067e8b0cea2a74ab324a59b8cdda50d89c9`
- Working tree: clean
- Date: 2026-07-10

## 1. Reference map

| File | Line | Term | Bucket |
|---|---|---|---|
| `public/io-architecture.html` | (entire file, 1200+ lines) | IO3, IO Agent, ALMA, enriched_context, clinical_rules.yaml, context engine, post-response safety, deterministic-first | **A** |
| `public/data/io3_state.json` | (entire file) | io3_path, alma, io3_kb, io3_sessions | **D** |
| `scripts/extract_io3_state.py` | (entire file) | IO3, alma, clinical_rules.yaml | **A** |
| `src/components/OpenResearch.jsx` | 57–63 | IO3 Clinical Agent card (`INDEX` array item 1) | **C** |
| `src/components/OpenResearch.jsx` | 65–70 | ALMA Safety & Evaluation card (`INDEX` array item 2) | **C** |
| `public/diary.html` | 575 | `<a href="/io-architecture.html">IO Architecture →</a>` | **C** |
| `public/lyme-hrv.html` | 620 | `<a href="/io-architecture.html">IO Architecture →</a>` | **C** |
| `public/knowledge-rag.html` | 362 | `<a href="/io-architecture.html">IO3 Architecture →</a>` (footer link) | **C** |
| `public/knowledge-rag.html` | 169, 212, 213, 218, 253, 351 | prose mentions of "IO3 clinical agent", `io3_kb`, `io3_deltas` collection names | **E** |
| `public/knowledge-rag.html` | 329 | "IO agent capabilities" (prose, RAG eval finding) | **E** |
| `REDESIGN-BRIEF.md` | 365 | "Item 02: IO3 Clinical AI Agent (keep)" | **E** |
| `REDESIGN-BRIEF.md` | 378 | "ALMA Ethical Framework" (proposed new card) | **E** |
| `REDESIGN-BRIEF.md` | 416–420 | "Card 3: IO3 Architecture" (proposed card, links to `/io-architecture.html`) | **E** |
| `REDESIGN-BRIEF.md` | 420 | `Link: /io-architecture.html` (design-brief prose, not live markup) | **E** |
| `REDESIGN-BRIEF.md` | 546 | "Sys-num 04 (ALMA)" — color-token usage note | **E** |
| `notebooks/01_pipeline_walkthrough.ipynb` | 17, 58 | `~/IO3/clinical_data_backup/...` — local GDPR export folder path | **E** |
| `notebooks/01_pipeline_walkthrough.ipynb` | 340, 584 | base64 PNG data that happens to contain the substring "IO3" | **E** |
| `pipeline/config.py` | 15 | `~/IO3/clinical_data_backup/...` — same local folder path | **E** |

## 2. Bucket definitions applied

- **A — DELETE-FILE**: file exists solely to document or serve IO3/ALMA.
- **B — EDIT**: none found. No file has *mixed* content requiring a partial edit beyond a single inbound link (those are classified C, not B, since removing one `<a>` doesn't touch surrounding unrelated content).
- **C — INBOUND-LINK**: nav/card/footer links pointing at the bucket-A file.
- **D — ASSET**: exclusive to bucket-A files (exclusivity proven below).
- **E — LEAVE**: incidental or out-of-scope; rationale given per row above and expanded in §4.

## 3. Proposed change set (for Phase 2, pending "yes")

### git rm (bucket A + D)
```
git rm public/io-architecture.html
git rm public/data/io3_state.json
git rm scripts/extract_io3_state.py
```

### Edits (bucket C — remove the whole semantic block, not orphaned fragments)

**`src/components/OpenResearch.jsx`**
Remove the two `INDEX` array entries in full (object literals, including trailing comma), lines 57–71:
```js
  {
    badge: 'AGENT',
    color: 'var(--moss)',
    title: 'IO3 Clinical Agent',
    copy: 'A LangGraph agent orchestrating models, clinical rules and retrieval for guarded chronic-care reasoning.',
    ctaHref: '/io-architecture.html',
    external: false,
  },
  {
    badge: 'SAFETY',
    color: 'var(--warm)',
    title: 'ALMA Safety & Evaluation',
    copy: 'A deterministic safety layer screening responses for pharmacological risk, diagnostic overreach and scope violations.',
    ctaHref: '/io-architecture.html#alma',
    external: false,
  },
```
(The `INDEX` array continues with `KNOWLEDGE` and `REPOSITORY` entries — those stay untouched.)

**`public/diary.html`** — remove line 575 only:
```html
    <a href="/io-architecture.html" style="font-family:'DM Mono',monospace; font-size:0.6rem; color:var(--accent); text-decoration:none;">IO Architecture →</a>
```
Surrounding `<div>` with the other two footer links (`ANS Article →`, `kineticaai.com →`) stays.

**`public/lyme-hrv.html`** — remove line 620 only:
```html
      <a href="/io-architecture.html" class="footer-link">IO Architecture →</a>
```
Surrounding `.footer-links` div with LinkedIn / kineticaai.com links stays.

**`public/knowledge-rag.html`** — remove line 362 only:
```html
      <a href="/io-architecture.html" class="footer-link">IO3 Architecture →</a>
```
Surrounding `.footer-links` div with `ANS Predictor →` / `kineticaai.com →` links stays. (All other IO3-related prose in this file is bucket E — see §4.)

### Sitemap
No committed `sitemap.xml`/`sitemap-index.xml` exists in the repo — it's generated at build time by `@astrojs/sitemap` from Astro routes (`src/pages/index.astro` is the only route; the static `public/*.html` files are not part of Astro's route graph). Nothing to edit.

## 4. Residual mentions (bucket E) — rationale

1. **`public/knowledge-rag.html`** (lines 169, 212, 213, 218, 253, 329, 351): This is a standalone, separately-linked page ("Clinical Knowledge & RAG" — its own card in `OpenResearch.jsx`, not part of the IO3/ALMA cards being removed). Its prose describes the *knowledge base itself* (ChromaDB collections literally named `io3_kb` / `io3_deltas`), which is real, documented infrastructure independent of the io-architecture.html page being deleted. The task's explicit deletion target is `io-architecture.html` only — this page was not named for deletion or rewrite. Renaming the collection references would misrepresent the actual system. **Flagging for your confirmation**: if you want these prose mentions scrubbed too (turning this into a bucket-B edit), say so explicitly and I'll add exact line ranges before Phase 2.

2. **`REDESIGN-BRIEF.md`** (lines 365, 378, 416–420, 546): This is an internal design/planning document (not a live site page, not built, not linked from the site) proposing future redesign work — it explicitly lists "IO3 Clinical AI Agent (keep)" and a not-yet-built "ALMA Ethical Framework" card as *proposed* additions. Since the task's scope is the public site, and this doc is planning material describing work that in part contradicts the removal (it says "keep"), touching it is a judgment call outside a mechanical audit. Recommend you decide separately whether this brief should be revised/archived.

3. **`notebooks/01_pipeline_walkthrough.ipynb`** (lines 17, 58) and **`pipeline/config.py`** (line 15): The string `IO3` here is a personal local filesystem folder name (`~/IO3/clinical_data_backup/...`), an unrelated coincidental reuse — it's where GDPR Polar exports are backed up on this machine, nothing to do with the IO3 Clinical Agent product. Leave untouched.

4. **`notebooks/01_pipeline_walkthrough.ipynb`** (lines 340, 584): Matches are inside base64-encoded PNG image blobs (matplotlib chart output); the substring "IO3" occurs by chance inside the encoded binary data. Not a textual reference. Leave untouched.

## 5. Dead-link forecast after removal

After deleting bucket A + D and applying the bucket-C edits above:
- `rg -i '(IO3|ALMA|io-architecture)'` will return **zero hits** except the bucket-E residuals in §4 (knowledge-rag.html prose, REDESIGN-BRIEF.md, and the two unrelated local-path references).
- No remaining internal `href`/`src` will point at `/io-architecture.html` or `/data/io3_state.json` — all five inbound links are covered by the change set.
- `sitemap.xml`, `robots.txt`, `404.html`, `CNAME`, and `.github/workflows/*.yml` contain **no references** to IO3/ALMA/io-architecture — confirmed by direct inspection. `robots.txt` already blanket-disallows `/data/`, so no update needed there either. No breakage risk in any of these.
- `scripts/extract_io3_state.py` is not invoked by `npm run build`, any `package.json` script, or any GitHub Actions workflow — removing it has no build-time effect.

## 6. Summary

The audit found one clear deletion target (`public/io-architecture.html`), one asset used exclusively by it (`public/data/io3_state.json`), and one generator script with no other purpose or caller (`scripts/extract_io3_state.py`). Five inbound links across `OpenResearch.jsx`, `diary.html`, `lyme-hrv.html`, and `knowledge-rag.html` need trimming — each a clean single-block removal with no orphaned markup risk. No sitemap, robots.txt, 404, CNAME, or CI workflow references exist, so there's no dead-link or build risk beyond the five inbound links already covered. Three categories of residual "IO3" mentions were left in bucket E for your explicit call: the `knowledge-rag.html` prose describing real ChromaDB collection names, the internal `REDESIGN-BRIEF.md` planning doc, and unrelated local-filesystem path strings in the notebook/pipeline config that coincidentally reuse "IO3" as a folder name.

**Waiting for your explicit "yes" to proceed to Phase 2.**
