# Demo components

Three self-contained Astro components for the English case pages. They take no props. Each renders complete HTML without JavaScript. A small `<script>` adds the interaction and re-initialises on `astro:page-load`, because the site uses `ClientRouter`.

Nothing calls a network service, an API or a model at runtime. Every shown result carries a visible origin label:

- **SAVED**: a real, dated result saved in the repository.
- **LOCAL**: computed in the browser on synthetic data.

## Imports

```astro
---
import PromptLabDemo from '../../components/demos/PromptLabDemo.astro'
import EditorialDemo from '../../components/demos/EditorialDemo.astro'
import PolarDemo from '../../components/demos/PolarDemo.astro'
---
{project === 'prompt-lab' && <PromptLabDemo />}
{project === 'editorial-checker' && <EditorialDemo />}
{project === 'polar' && <PolarDemo />}
```

Adjust the relative path to the page's location.

- **Props:** none.
- **One instance per page:** element ids such as `pl-case-*`, `ed-<sample>-L<n>` and `po-day` are fixed.
- **Headings:** each component starts at `<h2>`, so place it as a section of the case page.
- **Styling:** scoped CSS using the variables from `src/styles/tokens*.css`, with DM Mono and Montserrat. An optional `--header-h` is used for `scroll-margin-top` on editorial line anchors, with a fallback of 56px.

## Components

### `PromptLabDemo.astro`: original prompt → v0.4 revision → why

- **Interaction:** ARIA tabs, one per case. They respond to arrow keys, Home and End. Without JS, all cases show one after another with an anchor index.
- **What is shown:** four cases from the public development bank (D02, D03, D04, D09). Each case has three steps:
  1. The original prompt (verbatim, `lang="es"`).
  2. The v0.4 revision. This step is marked **PENDING** because no saved v0.4 output is public. Under it, the **SAVED** "historical 16 Nov evaluation, not v0.4" shows, for each variant: decision, automatic check, date, observed model, CLI version, `version: not v0.4`, `review: none` and origin.
  3. Why: the expected decision and rubric from the public bank, plus an English paraphrase.
- **Footer:**
  - A `<details>` block titled "Earlier evaluation (16 Nov 2026, 10 cases, not v0.4)", with baseline 8/10 and candidate 9/10 automatic checks.
  - The **SAVED** synthetic replay (no model, `real_passed_responses: 0`).
  - The line "Personal use choice — not a general benchmark."
- **Literal strings:** "9 active / 4 reserved, not run" and "10 cases".

### `EditorialDemo.astro`: saved reviewer output on synthetic samples

- **Interaction:** a tab selector for three samples, one per exit code (0 / 1 / 2).
- **Each sample shows:**
  - The source with line numbers.
  - Warnings linked to `#ed-<sample>-L<n>`. With JS, focus moves to the line; without JS, the browser jumps to it and `:target` highlights it.
  - Status, exit code and `approval: false`.
  - The command, date, reviewer version and Python version.
  - The raw saved stdout, byte for byte.
- **No free input:** there is no textarea or free input. The page never analyses visitor text.
- **Copy:**
  - "Saved output of the local reviewer on synthetic samples. This page does not analyse your text."
  - "No warnings ≠ approved."
- **Language of the samples:** they are in Spanish because the reviewer's rules target Spanish patient-facing copy. Their DOIs are fictitious placeholders (`10.0000/…`).

### `PolarDemo.astro`

**(a) SAVED results**

- Brier score per target against the reference, as HTML/CSS bars that stay readable on mobile, plus a data table with all saved metrics.
- The badges follow from the data:
  - "Worse than baseline" when the model Brier is greater than the reference Brier, which holds for fatigue.
  - "Unstable: N … observation(s)" when the evaluated minority class has fewer than `min_training_class_count` (3) observations, which holds for brain fog.
- These limits sit inside the figure:
  - "Retrospective, one person (N=1). Not causal, not clinically validated, not a prediction service."
  - "Aggregated results only; the diary and daily records stay private."

**(b) LOCAL method view on a deterministic synthetic series**

- It is labelled "Synthetic data — illustrates the method, not results."
- **Controls:**
  - A native `input type=range` with `aria-valuetext`, for example "Day 34: 33 training observations".
  - A lag 0/1 radio group.
- The browser only recolours training, evaluated and unused cells. No model is trained.
- **Without JS:** the controls are hidden, and the static SVG shows the first evaluated day with lag 0, together with a data table.
- **Reduced motion:** there are no transitions anywhere.

## Data sources

| Fixture | Origin | Source |
|---|---|---|
| `src/data/demos/prompt-lab/prompt-lab-demo.json` | SAVED, plus public inputs | Public repo https://github.com/kinetica-IA/prompt-lab at commit `d9424640e587312122c4955b9f167b785623bbd9` (2026-11-18): `tests/development.json` and `prompts/optimizer.md`. Both sha256 match `MANIFEST.json`. Also `public/portfolio-demo/PROMPT-LAB-EVALUACION-REAL-2026-11-16.json` (web commit `1233c06`) and `public/portfolio-demo/PROMPT-LAB-REPLAY-SINTETICO.json` (web commit `1233c06`) |
| `src/data/demos/editorial/editorial-demo.json` | SAVED (synthetic samples) | Real stdout and exit code of `scripts/editorial/revisar_contenido.py` v1.0.0, unmodified, run on `src/data/demos/editorial/samples/<id>/` |
| `src/data/demos/editorial/samples/**` | Synthetic | Invented Markdown. Each root has `informes/` and an empty `lab/` (kept by `.gitkeep`), because the reviewer reports an error if a collection is missing |
| `src/data/demos/polar/polar-results.json` | SAVED | `public/data/polar-retrospective-summary.json` (web commit `15e928c`, analysis date 2026-11-15). Diary column names are not copied |
| `src/data/demos/polar/polar-method-synthetic.json` | LOCAL (synthetic) | `mulberry32` with seed `20261120`, 40 days. The method settings (30 training observations minimum, lags 0/1, 3 per class) are taken from the public summary |

## Regenerating fixtures

Run from the repository root. These commands make no network calls and do not call a model.

```sh
# Prompt Lab: needs a read-only clone of the public repo (never push to it)
git clone https://github.com/kinetica-IA/prompt-lab.git ../prompt-lab-public-demos/prompt-lab
node src/data/demos/_tools/build-prompt-lab-fixture.mjs ../prompt-lab-public-demos/prompt-lab

# Editorial: runs the current local reviewer on each synthetic sample (python3, standard library)
node src/data/demos/_tools/build-editorial-fixtures.mjs

# Polar: copies public aggregates and regenerates the seeded synthetic series
node src/data/demos/_tools/build-polar-fixtures.mjs

# Tests (node:test, no dependencies)
node --test tests/demos/*.test.mjs
```

Notes on regeneration:

- If `scripts/editorial/revisar_contenido.py` changes, `tests/demos/editorial.test.mjs` fails on purpose. Regenerate the editorial fixture and review the diff.
- The Prompt Lab test that compares against the clone is skipped when `../prompt-lab-public-demos/prompt-lab` is absent.

## Limits

- **Prompt Lab:** no saved v0.4 output is public, so step 2 stays **PENDING**.
  - The 16 Nov evaluation is historical and is not v0.4.
  - The synthetic replay checks the plumbing, not the auditor.
  - Outputs from the 18 Nov v0.4 evaluation are not in the public repository and are not shown.
- **Editorial:** the samples are synthetic.
  - "No warnings" is not an approval.
  - The reviewer does not check facts, resolve DOIs or detect personal data.
  - The real run on nine site files is not reproduced here.
- **Polar:** the results are aggregates of one retrospective person (N=1). They are not causal, not clinically validated and not a prediction service.
  - The synthetic series illustrates the method only.
  - No daily records, diary fields, `private-*` files or models are published.
- **Pure helpers** are in `lib/*.mjs`: `tabs`, `editorial`, `polar-method` and `polar-results`. They are tested by `tests/demos/`.
