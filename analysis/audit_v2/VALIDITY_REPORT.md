---
title: ANS Predictor — End-to-End Validity Audit (v2)
version: 2.0
date: 2026-08-01
owner: Alfonso Navarro
status: executed
scope: upstream validity threats only — v1.0 estimator checks not re-run
---

# ANS Predictor — End-to-End Validity Audit (v2)

Audit v1.0 stress-tested the estimator. This audit tests whether the rows, the
target and the feature timestamps mean what the model assumes they mean.

**Result: C1 FAIL, C2 FAIL.** Both binary gates fail. Per the audit spec, C3–C9
are moot; they are recorded below anyway because four of them fail independently,
and because two of those failures (C8, C9) are not reachable from C1/C2.

---

## 0. Execution environment and what could not be reached

This audit ran against the repository at commit `62d3142` on branch
`claude/ans-predictor-validity-audit-fld4yd`. Three classes of artefact
referenced by the checks are **not present**, which caps what is computable:

| Artefact | Path | State |
|---|---|---|
| L0 Polar GDPR export | `~/IO3/clinical_data_backup/polar_export_2026-04-27` (`pipeline/config.py:13-16`) | Absent — lives outside the repo by design |
| L1–L5 pipeline outputs | `data/processed/L{1..5}/` | Empty; `.gitkeep` only |
| Canonical model input | `data/processed/L3/daily_unified.csv`, `data/processed/L4/diary_features.csv` | Absent |
| Legacy HRV intermediates | `data/hrv_features.csv`, `data/hrv_rr_nightly.csv`, `data/polar_live.full.json` | Absent |

What **is** present: `data/diary_live.csv` (61 rows), `public/data/polar_live.json`
(90-day series, `2026-05-02 → 2026-07-30`), the full pipeline source, and — after
`git fetch --unshallow` — 434 commits of history.

**The published biometric series does not overlap the modelling window at all.**
Diary dates span `2025-09-02 → 2026-04-02`; the published series starts
`2026-05-02`. Intersection: **0 days** (`analysis/audit_v2/raw_output.txt`,
section A). No HRV value used by any published model is recoverable from this
repository. Every check whose kill criterion requires an HRV value paired to a
diary day is therefore `UNCOMPUTABLE` here, and is marked as such rather than
inferred.

Separately: **no v1.0 audit code or artefact exists in this repository.** A
search for `embargo`, `blocked`, `permutation`, `nested` across all `.py`, `.md`,
`.html` and `.jsx` files returns one unrelated hit (`scripts/extract_io3_state.py:32`,
a docstring reading "Read nested JSON key"). The v1.0 figures quoted in the audit
spec (blocked+embargo CV, nested selection AUC 0.795, `met_minutes` forced in,
lag-1 ACF ≈ −0.03) cannot be reproduced or inspected from here. Where a check
asks for a "re-run of the headline blocked+embargo + nested-selection model",
that model does not exist in this codebase: production code
(`analysis/pem_predictor/l5_retrain.py:180-227`) uses plain LeaveOneOut with
non-nested greedy forward selection and reports 0.829.

Reproduction scripts written for this audit:
`analysis/audit_v2/compute_checks.py`, `analysis/audit_v2/diary_authoring_times.py`.
Raw outputs: `analysis/audit_v2/raw_output.txt`, `analysis/audit_v2/raw_authoring.txt`.

---

## C1 — Temporal alignment of target and features

**Question.** For a diary row of calendar day `D`, does `hrv_rmssd_night_t0` come
from the night preceding `D` (prediction) or the night following it (retrodiction)?

### 1. The join key, verbatim

Inner join, `analysis/pem_predictor/l4_diary_join.py:107`:

```python
paired = unified.join(diary_subset, how="inner")
```

Lag ladder, `analysis/pem_predictor/l4_diary_join.py:114-126`:

```python
lag_df = pd.DataFrame(index=paired.index)
for col in LAG_COLUMNS:
    if col not in unified.columns:
        continue
    series = unified[col]
    for lag in range(N_LAGS):
        col_name = f"{col}_t{lag}"
        lag_df[col_name] = paired.index.map(
            lambda d, s=series, l=lag: (
                s.get(d - pd.Timedelta(days=l)) if (d - pd.Timedelta(days=l)) in s.index else float("nan")
            )
        )
```

The key is pure calendar-date subtraction on the L3 `DatetimeIndex`. `N_LAGS = 4`
(`:30`). The ladder is monotone **by construction** — `t0 > t1 > t2 > t3` in
calendar days, and no off-by-one is possible *within* the ladder. What the ladder
is anchored to is decided entirely upstream, at L1, and **the anchors are not the
same across sources.**

### 2. The anchors differ per source

| L3 column | Anchor assigned at L1 | Physical window covered for date `D` | Provenance |
|---|---|---|---|
| `hrv_rmssd_night`, `ans_status`, `recovery_indicator`, `recovery_sublevel` | Polar's own `night` string, used verbatim | **Unresolved** — no timestamp in the record | `pipeline/l1_extract/parse_nightly_recovery.py:112`, `:133` |
| `sleep_wake_min`, `sleep_interruptions`, `sleep_score` | Polar's own `night` string, used verbatim | **Unresolved** — same | `pipeline/l1_extract/parse_sleep.py:179`, `:195` |
| `hrv_rmssd_calc`, `hrv_sdnn`, `hrv_pnn50`, `hrv_lf_hf_ratio`, `hrv_hf_power`, `hrv_sd1`, `hrv_sd2`, `hrv_dfa_alpha1` | Calendar day of the PPI sample | **The whole of calendar day `D`, 00:00–24:00** | `pipeline/l1_extract/parse_ppi_samples.py:80`, `:87-96`, `:110-123` |
| `met_minutes`, `non_wear_min` | Calendar day | Whole of `D` | `pipeline/l1_extract/parse_activity.py:99`, `:117` |

The PPI path is unambiguous and is the decisive finding. `parse_ppi_samples.py:80`
buckets on `entry["date"]`; `:87-96` then walks **every device entry and every
sample for that day** into that bucket. There is no night window, no hour filter,
no sleep-interval intersection anywhere in the L1/L2 production path. The
docstring calls the output "per-night" (`:1-4`), and `compute_hrv_features.py:1-7`
calls the arrays "nightly", but the code aggregates 24 hours.

The volume figures in `docs/ANS_PREDICTOR_PIPELINE.md:42` confirm this
arithmetically: 16,632,396 samples over 239 days is **69,592 intervals per day**.
At a resting rate of 60 bpm a full 24 hours is ~86,400 beats; an 8-hour night is
~28,800. The bucket is ~80% of a full day, not a night.

**Consequence.** Every `*_t0` feature in the L2-derived block —
`hrv_rmssd_calc_t0`, `hrv_sdnn_t0`, `hrv_pnn50_t0`, `hrv_lf_hf_ratio_t0`,
`hrv_hf_power_t0`, `hrv_sd1_t0`, `hrv_sd2_t0`, `hrv_dfa_alpha1_t0` — is computed
from a signal window that **contains the entire symptom day it is used to
predict**, including the hours during which the symptoms occurred. That is
retrodiction by construction, not prediction. These eight columns are candidates
for every target (`analysis/pem_predictor/l5_retrain.py:36-50`, lag list `[0,1,2]`
for each), so they competed in every forward-selection run, and
`hrv_hf_power_t0` is a selected feature of the ANS model published on the
convergence page (`public/convergence-analysis.html:451`).

A second, compounding defect sits in the same block. `compute_hrv_features.py:112`:

```python
window = arr[:FREQ_WINDOW]
```

with `FREQ_WINDOW = 400` (`:30`). Because `arr` is the calendar-day bucket sorted
from 00:00, the frequency-domain and nonlinear features
(`hrv_lf_hf_ratio`, `hrv_hf_power`, `hrv_sd1`, `hrv_sd2`, `hrv_dfa_alpha1`) are
computed from the **first ~5–7 minutes after midnight opening day `D`** — not
from an overnight window, and not from a window chosen for stationarity in any
physiological sense. `docs/ANS_PREDICTOR_PIPELINE.md:61` describes this as
"the first 400 intervals — the standard stationary window required for reliable
spectral estimation", which describes the intent but not what the code selects.

### 3. Two mutually incompatible night conventions coexist in the repo

`scripts/extract_rr.py:24-31` defines:

```python
def assign_night(dt_str):
    """Assign a datetime string to a night date (the date when night starts).
    Night of date X = X 22:00 → X+1 06:00."""
```

Under this convention — night labelled by its **start** date — `hrv_*_t0` for
diary day `D` is drawn from `D 22:00 → D+1 06:00`, i.e. **the night that follows
day `D`**. This is the exact retrodiction the kill criterion names. This script
feeds `scripts/compute_hrv.py` → `scripts/merge_hrv.py`, which writes HRV columns
directly into `public/data/polar_live.json`, the input to the legacy trainer
`scripts/retrain_predictor.py:125`. The production path
(`parse_ppi_samples.py`) uses calendar-day bucketing instead. Two live code paths,
two different meanings of the same column name, and nothing in the repository
records which one produced the published `pipeline_run_id: 1102e14`.

### 4. Ten sampled rows with timestamps — not computable

Requested: for 10 sampled rows, diary `date`, diary entry timestamp, `night_t0`
sleep start and end, and the resulting lag in hours.

```
UNCOMPUTABLE: sleep_start / sleep_end not present in
  pipeline/l1_extract/parse_nightly_recovery.py (NightlyRecoveryRaw, :26-37)
UNCOMPUTABLE: sleep_start / sleep_end not present in
  pipeline/l1_extract/parse_sleep.py (SleepResultRaw, :62-66)
UNCOMPUTABLE: night_t0 values not present — data/processed/L3/daily_unified.csv absent
```

No parsed record in the entire L1 layer retains a clock time. `parse_sleep.py`
reads `sleepSpan` and `asleepDuration` as **durations** (`:189-190`) and discards
the interval they sit in. `l3_unified.py:85-87` explicitly drops
`session_start_time` and `test_time`, the only two time-of-day columns that reach
L3. The information needed to resolve the sign of the gap for the `night`-anchored
columns has been discarded at ingest and cannot be recovered downstream.

Diary entry timestamps are absent from `data/diary_live.csv` (columns:
`date, schema_version, severidad_global, fatiga, pem, niebla_mental,
disfuncion_autonomica, dolor, nota`) but **are** recoverable from git — see C2,
where they turn out to settle the question by a different route.

### 5. Lag ladder monotonicity for t1, t2, t3

Confirmed monotone and off-by-one-free within each source, by construction
(`l4_diary_join.py:120-126`, integer `pd.Timedelta(days=l)`). Confirmed **not**
comparable across sources: `hrv_rmssd_night_t0` and `hrv_rmssd_calc_t0` carry the
same `_t0` suffix, are treated as the same lag by the feature-selection loop, and
are anchored to different clocks. Whatever offset exists between Polar's `night`
label and a calendar day, it applies to one column and not the other. This is a
latent off-by-one **between** ladders that the code has no way to detect.

**Kill criterion.** If the median gap between `night_t0` end and the diary day is
negative, the model is retrodicting and every AUC in v1.0 is void.

**Computed value.** Median gap in hours: `UNCOMPUTABLE` (no timestamps survive
L1). Signed gap for the L2-derived `*_t0` block: **the window contains day `D`
itself** — gap spans `−24h` to `0h` relative to the reported day, i.e. negative
throughout. Under `extract_rr.py`'s convention the gap for the legacy HRV columns
is `−22h` to `−30h` (night *after* the day).

**Verdict: FAIL.**

The retrodiction the kill criterion describes is present and provable from source
for the eight L2-derived `*_t0` features and for the whole legacy HRV path. For
`hrv_rmssd_night_t0` specifically — the headline feature — the direction is
**UNRESOLVED**, and cannot be resolved from this repository at all: the field
that would settle it was never parsed. An unresolved direction on the headline
feature is not a pass. The in-code cross-check that would have caught this
(`compute_hrv_features.py:9-11`: "Polar's own RMSSD … is cross-referenced but
not overwritten … an internal consistency check") is described in a docstring and
is never asserted, logged, or reported anywhere in the codebase.

---

## C2 — Rater–instrument circularity

**Question.** Could the subject have seen a device-derived recovery/HRV figure
before completing the diary entry for that day?

### 1. Diary entry time of day

`data/diary_live.csv` has no timestamp column.

```
UNCOMPUTABLE: entry_timestamp not present in data/diary_live.csv
```

The audit spec directs that this be flagged as unresolved. It does not stay
unresolved. `scripts/log_diary.py:279` writes the row through `save_diary()`, and
`:201-217` commits it to git. **The commit history is an entry-time record**, and
after `git fetch --unshallow origin` the full history is available: 31 commits
touch `data/diary_live.csv`, back to `763bab9` (2026-03-23).

Walking every revision of the file and recording the commit in which each diary
date first appears (`analysis/audit_v2/diary_authoring_times.py`;
raw: `analysis/audit_v2/raw_authoring.txt`):

| Statistic | Value |
|---|---|
| Distinct diary dates ever present | 62 (61 current + 1 removed stub) |
| Lag between the day described and the day it was written — min | −215.34 d |
| — median | **+59.63 d** |
| — max | **+209.63 d** |
| — mean | +97.89 d |
| Authored > 7 days after the reported day | **60 / 62** |
| Authored > 30 days after | 53 / 62 |
| Authored > 90 days after | 29 / 62 |
| Authored within ±2 days of the reported day | 2 / 62 |

The two "within ±2 days" cases are not contemporaneous entries either:
`2026-04-02` was written on `2026-04-01T18:18` — the evening **before** the day it
describes — and `2026-11-03` was a future-dated stub written `2026-04-01T17:51`,
removed 26 days later by `c2cbdb6` ("fix(diary): remove future-dated stub entry").

The authoring sessions are two bulk events:

| Session | Diary dates written |
|---|---|
| `763bab9` — 2026-03-23T15:19:30+01:00 ("feat: portfolio vivo") | **39** dates, spanning 2025-09-02 → 2026-02-28 |
| 2026-04-01, 17:05–23:32 (23 commits, ~6.5 h) | **23** dates, spanning 2025-09-04 → 2026-04-02 |

The entire February 2026 block — 28 consecutive days, the densest and largest
contiguous run in the dataset — was written in the single commit `763bab9` on
2026-03-23, between 24 and 50 days after the days it describes.

**Not one of the 61 rows was written on the day it reports.**

### 2. Blinded re-derivation from raw RR

```
UNCOMPUTABLE: raw RR intervals not present — L0 export absent
  (pipeline/config.py:13-16) and data/processed/L1/rr_raw_arrays.parquet absent
UNCOMPUTABLE: device-displayed nightly value not present for any diary date —
  public/data/polar_live.json series covers 2026-05-02 → 2026-07-30,
  intersection with diary dates = 0
```

### 3. Spearman rho, displayed vs re-derived

```
UNCOMPUTABLE: both series absent (see above)
```

**Kill criterion.** Association present with the displayed metric and absent or
materially weaker with the blinded re-derivation → the finding is expectancy.

**Computed value.** The rho comparison is uncomputable. The prior question it was
designed to probe — *could* the subject have seen the device figure first — is
answered directly and in the affirmative, with a margin of months rather than
hours. By 2026-03-23 and 2026-04-01, when the diary was authored, the complete
Polar record for every date being scored had existed on the subject's device and
in the Polar app for weeks to months, and `public/data/polar_live.json` had been
in the repository since `763bab9`.

Two further exposure channels are in the code and are worth recording:

- `scripts/log_diary.py:282-301` displays the model's own 48h risk probability,
  the feature values behind it, and the AUC, immediately after each entry is
  saved. Run daily, this shows the subject a prediction for day `D+2` before
  day `D+2` is scored. (This path appears to be broken as written:
  `predict_48h` reads `dm["features"]` and `dm["coef"]` at `:143` and `:158`,
  while the stored block uses `selected_features` and `coefficients`
  (`public/data/polar_live.json`, `predictor.deployment_model`), which raises an
  uncaught `KeyError`. Whether the display ever rendered is not determinable from
  here; the intent in the code is unambiguous.)
- `scripts/log_diary.py:304-312` prints the last 7 days of the subject's own
  prior scores as a bar chart before the session ends, anchoring subsequent entries.

**Verdict: FAIL.**

The diary is a **retrospective reconstruction**, median 60 days after the fact,
produced in two sittings, by a subject with unrestricted prior access to the
device's own recovery and HRV displays for exactly those dates. This is a
stronger failure than the circularity the check was written to detect: it is not
that the subject *might* have seen the number before scoring the day, but that
the scoring was performed months later with the number available throughout, and
with recall as the only source for the symptom value.

**Residual uncertainty, stated explicitly as the spec requires.** No statistical
test resolves this, and none was available to run. The direction and magnitude of
the resulting bias are unknown and unbounded. Only a prospective, same-day,
device-blinded diary period would resolve it. Nothing in the current dataset can.

---

## C1/C2 gate

Both binary gates FAIL. Per the audit spec the remaining checks are moot, and no
AUC reported by v1.0 or by the production pipeline survives them. C3–C9 are
recorded below because C8 and C9 identify failures that are independent of C1 and
C2 and would remain after any fix to temporal alignment or diary protocol.

---

## C3 — Missingness mechanism

**Question.** Are the 55–61 diary days a random subset of the 243 nights?

**Computed values** (`analysis/audit_v2/raw_output.txt`, section C3):

| Quantity | Value |
|---|---|
| Diary entries | 61 |
| Diary span | 2025-09-02 → **2026-04-02** (213 calendar days) |
| Stated observation window | 2025-08-25 → 2026-04-27 (243 days), `public/data/polar_live.json` `data_window` |
| Days in the 243-day window with no diary entry | **182** |
| Coverage over the diary's own span | 61/213 = **0.286** |
| Inter-entry gap: median / mean / max | 1 d / 3.53 d / **32 d** |
| Runs of absence > 5 days | **10** |
| Total days inside those runs | 134 |
| `disfuncion_autonomica` non-null | 55/61 |
| `dolor` non-null | 55/61 |

Monthly entry counts:

| Month | 2025-09 | 2025-10 | 2025-11 | 2025-12 | 2026-01 | 2026-02 | 2026-03 | 2026-04 |
|---|---|---|---|---|---|---|---|---|
| Entries | 16 | 6 | 4 | 3 | 2 | **28** | 1 | 1 |

Runs of absence > 5 days: 6, 12, 7, 16, 14, 18, 14, 8, 8, and **31** days
(2026-03-01 → 2026-04-02).

Comparison of `hrv_rmssd_night_t0` on diary-present versus diary-absent days
(Mann–Whitney U, effect size), and the same for `met_minutes`:

```
UNCOMPUTABLE: hrv_rmssd_night not present for any diary-window date —
  data/processed/L3/daily_unified.csv absent; polar_live.json series does not
  overlap the diary window (0 shared dates)
UNCOMPUTABLE: met_minutes not present — same source absent.
  Note also that met_minutes appears in L1 (parse_activity.py:53) but is absent
  from LAG_COLUMNS (l4_diary_join.py:20-29) and from both CANDIDATE_FEATURES
  lists, so it never reaches L4 as a *_t0..t3 column at all.
```

**Kill criterion.** Diary presence significantly associated with HRV level → the
sample is selected on a correlate of the target.

**Verdict: UNCOMPUTABLE for the stated kill criterion; FAIL on the prior
question the check asks.**

The formal test cannot be run. It does not need to be run to answer "are the
diary days a random subset": they are demonstrably not. 28 of 61 entries (46%)
fall in a single month; 182 of 243 window days have no entry; the sampling is
two dense bursts separated by a five-month near-void with ten absence runs longer
than five days. Combined with C2 — the February block was written in one sitting
a month later — the selection mechanism is recall salience over a reconstructed
period, not any random or protocol-driven process. Whether that mechanism
correlates with HRV level is exactly what cannot be tested here, and it must be
reported as an unmodelled selection process of unknown direction.

One further inconsistency: `public/data/polar_live.json` publishes
`data_window.n_diary_entries = 61` over `start: 2025-08-25, end: 2026-04-27`,
but the last diary entry is 2026-04-02 and the first is 2025-09-02. The published
window overstates diary coverage at both ends by a combined 33 days.

---

## C4 — Signal quality as confounder

**Question.** Does nightly PPG/RR data quality co-vary with both RMSSD and the
symptom score?

### 1. Per-night quality fields available from source

| Quality dimension | Field | Status |
|---|---|---|
| Recording coverage | `rr_intervals_count` | Present — `parse_ppi_samples.py:33`, `:117` |
| Non-wear time | `non_wear_min` | Present — `parse_activity.py:58`, `:124` |
| Wake minutes | `sleep_wake_min` | Present — `parse_sleep.py:86`, `:201` |
| Recording duration | `sleep_duration_h`, `sleep_asleep_h` | Present — `parse_sleep.py:81-82` |
| Interruptions | `sleep_interruptions`, `sleep_long_interruptions` | Present — `parse_sleep.py:87-88` |
| **Artifact / ectopic beat percentage** | — | **Discarded at ingest** |

```
UNCOMPUTABLE: per-night artifact/ectopic percentage not present in
  pipeline/l1_extract/parse_ppi_samples.py — the physiological filter at :93-96
  increments a single global counter (n_filtered) and stores no per-day
  rejection count. RRNightlyRow (:30-37) has no artifact field.
```

This is a design loss, not a data gap: the filter at `parse_ppi_samples.py:93-96`
sees every rejected sample and its date, and throws the association away. The
reported figure — 396 rejections out of 16.6 M (`docs/ANS_PREDICTOR_PIPELINE.md:42`)
— is a single aggregate over 239 days. A per-night rejection rate of 0.0024%
average tells nothing about whether one night ran at 5% and another at 0%.

A second quality-relevant loss: `compute_hrv_features.py:135-137` catches every
exception from the neurokit2 block and drops the night with a bare
`dropped_error += 1`. Which nights failed, and why, is not recorded per date.

### 2. Correlation of each quality field with RMSSD and with the target

```
UNCOMPUTABLE: rr_intervals_count, non_wear_min, sleep_wake_min,
  sleep_duration_h, sleep_interruptions not present for any diary-window date —
  data/processed/L1/*.parquet and L3/daily_unified.csv absent
```

### 3. Re-run with the strongest quality covariate forced in

```
UNCOMPUTABLE: the referenced v1.0 model (blocked+embargo CV, nested selection,
  met_minutes forced in) does not exist in this repository — see section 0.
  Its input, data/processed/L4/diary_features.csv, is also absent.
```

**Kill criterion.** Coefficient collapses toward zero when quality is included →
recording-quality artifact.

**Verdict: UNCOMPUTABLE.**

Recorded alongside it: the single most informative quality covariate for a
PPG-derived HRV metric — the per-night ectopic/artifact rate — is not merely
missing from the analysis, it is structurally unavailable, because L1 computes it
and discards it. This check cannot be executed at any future date without
re-running L1 against the L0 export with a modified parser.

---

## C5 — Threshold sensitivity

**Question.** Is the result an artifact of dichotomising `disfuncion_autonomica`
at exactly 5?

**Computed values** (`analysis/audit_v2/raw_output.txt`, section C5). Target
distribution, n = 55 (6 of 61 rows have no value):

`min 0.0 · max 9.0 · mean 4.673 · median 5.0 · sd 2.446`

| Threshold | n_pos | n_neg | base rate | minority n | ≥ 15? |
|---|---|---|---|---|---|
| 3 | 45 | 10 | 0.818 | 10 | no |
| 4 | 41 | 14 | 0.745 | 14 | no |
| **5** (production, `l5_retrain.py:57`) | 32 | 23 | 0.582 | 23 | yes |
| 6 | 20 | 35 | 0.364 | 20 | yes |
| 7 | 10 | 45 | 0.182 | 10 | no |

Only thresholds 5 and 6 leave ≥ 15 in the minority class. Thresholds 4 and 7 are
excluded by the spec's own floor.

The cut at 5 is maximally fragile. The modal value of the target **is** 5.0
(10 of 55 observations), and all 10 sit exactly on the boundary:

- rows with `disfuncion_autonomica == 5.0`: **10**
- rows in the open interval (4, 5): **1**
- share of positives that sit exactly on the cut point: **10 / 32 = 31%**

Moving the cut by the smallest representable amount — from `>= 5` to `> 5` —
reclassifies 31% of the positive class. No other cut point in the range has
this property.

Re-running the nested pipeline at each threshold, and the undichotomised ordinal
analysis:

```
UNCOMPUTABLE: AUC / PR-AUC / permutation p at any threshold —
  data/processed/L4/diary_features.csv absent; no feature values available
UNCOMPUTABLE: Spearman rho and ordinal regression of disfuncion_autonomica
  against hrv_rmssd_night_t0 — hrv_rmssd_night not present for any diary date
```

**Kill criterion.** Significance present only at threshold 5, or absent in the
undichotomised ordinal analysis → cut-point artifact.

**Verdict: UNCOMPUTABLE for the kill criterion.**

Recorded finding, computable and unfavourable: the production cut point sits
exactly on the modal value of the target, 31% of positives are boundary cases,
and only one alternative threshold (6) satisfies the minority-class floor. The
sensitivity analysis the check calls for is not optional for a result presented
at this threshold, and it has not been performed anywhere in the repository.

---

## C6 — Shared temporal drift

**Question.** Is the association a common trend rather than a day-to-day coupling?

### 1. Observation window

First diary date `2025-09-02`, last `2026-04-02`, span **213 calendar days**
(212 days between endpoints). Published `data_window` claims
`2025-08-25 → 2026-04-27`, 243 days — see C3.

### 2. Trend in the target

Linear regression of `disfuncion_autonomica` on day-index (n = 55):

```
slope = -0.00127 / day    r = -0.0358    r² = 0.0013    p = 0.7951
implied drift over the 212-day span = -0.270 points on a 0-10 scale
```

There is **no linear drift in the target**. The same holds for every diary
dimension:

| Dimension | slope/day | r | p | n |
|---|---|---|---|---|
| `fatiga` | +0.00030 | +0.0087 | 0.9471 | 61 |
| `pem` | −0.00248 | −0.0806 | 0.5367 | 61 |
| `niebla_mental` | +0.00342 | +0.1131 | 0.3853 | 61 |
| `disfuncion_autonomica` | −0.00127 | −0.0358 | 0.7951 | 55 |
| `dolor` | −0.00161 | −0.0493 | 0.7209 | 55 |
| `severidad_global` | +0.00252 | +0.0799 | 0.5407 | 61 |

Detrending the HRV series and re-running the headline model:

```
UNCOMPUTABLE: hrv_rmssd_night_t0 not present for any diary date —
  no series to detrend, no model to re-run
```

### 3. Lag-1 ACF of the target

| Series | lag-1 ACF | n pairs |
|---|---|---|
| Raw, over consecutive **diary entries** (ignoring calendar gaps) | 0.1465 | 54 |
| Linearly detrended, same pairing | 0.1472 | 54 |
| Raw, restricted to **adjacent calendar days** | **0.3751** | 38 |
| Linearly detrended, adjacent calendar days | 0.3801 | 38 |
| After 14-day rolling-mean removal | 0.2314 | 54 |

**Kill criterion.** AUC drops toward the base rate after detrending → slow shared
drift, not a nightly signal.

**Verdict: PASS on the drift question; the v1.0 ACF claim is CONTRADICTED.**

The drift threat is genuinely absent — the target has no trend to share
(r² = 0.001, p = 0.80), so the association, whatever it is, is not a common
linear trend. Detrending the feature side is uncomputable, but with a flat target
it cannot rescue or destroy the result.

The v1.0 claim that lag-1 ACF ≈ −0.03 does not hold under any pairing computed
here. The correct comparison — genuinely adjacent calendar days, which is what
"lag-1" means for a daily series — gives **+0.375**, and detrending raises it
slightly to +0.380. The target is positively autocorrelated day to day at roughly
an order of magnitude above the claimed value. If v1.0 used ACF ≈ −0.03 to argue
that day-level observations are effectively independent, and thereby to justify
an embargo width or an effective sample size, that argument does not hold on
this data. The provenance of the −0.03 figure cannot be checked: no v1.0 code
exists in this repository.

---

## C7 — Is this a model or a single correlation?

**Question.** Does anything beyond `hrv_rmssd_night_t0` contribute?

```
UNCOMPUTABLE: univariate model on hrv_rmssd_night_t0 under blocked+embargo —
  feature values absent (data/processed/L4/diary_features.csv), and the
  blocked+embargo estimator does not exist in this repository (see section 0)
UNCOMPUTABLE: AUC, PR-AUC, permutation p for the univariate model
UNCOMPUTABLE: delta against the v1.0 nested-selection headline (0.795)
```

**Verdict: UNCOMPUTABLE.**

What the published artefacts show without any re-fitting, recorded for the record:

- `hrv_rmssd_night_t0` is the first-selected feature in **4 of the 5** published
  targets, and carries by far the largest standardised coefficient in each
  (`disfuncion_autonomica`: −1.216 vs +0.463 for `recovery_sublevel_t3`;
  `fatiga`: −0.922 vs −0.364 for `hrv_rmssd_night_t1`).
- The second feature in the headline model is `recovery_sublevel_t3` — Polar's
  own recovery score from the same nightly-recharge record family as
  `hrv_rmssd_night`, three days earlier. It is not an independent measurement
  channel.
- The selection rule stops at `MIN_AUC_IMPROVEMENT = 0.01`
  (`l5_retrain.py:61`, `:258`). Two features were retained, so the second bought
  at most whatever exceeded 0.01 — against an AUC standard error at n = 55 of
  roughly ±0.06. The second feature's contribution is, by the selector's own
  construction, an order of magnitude below the noise floor.

That is consistent with the interpretation the check anticipates — the honest
object is a univariate association — but it is not the test the check specifies,
and it is reported here as an observation about the published coefficients, not
as a computed result.

---

## C8 — Predictor/target independence

**Question.** For each model, do the target and the features descend from the
same raw stream within the same temporal window?

### Derivation chains

**Raw streams.** (S1) Polar optical PPG → PPI samples. (S2) Polar Nightly Recharge
record (device-computed, from S1 on-device). (S3) Polar sleep record. (S4) Polar
activity record. (S5) The subject's recalled symptom judgement.

| Model | Target | Target chain | Feature chain(s) | Shared stream | Shared window |
|---|---|---|---|---|---|
| **ANS / `disfuncion_autonomica`** (headline, AUC 0.829) | `disfuncion_autonomica ≥ 5` | S5 → `log_diary.py` → `diary_live.csv` → L4 join | `hrv_rmssd_night_t0`: S1 → device → S2 → `parse_nightly_recovery.py` → L3 → L4 lag t0. `recovery_sublevel_t3`: same, lag t3 | No | `t0`: unresolved (C1) |
| `severity` (AUC 0.837) | `severidad_global ≥ 6`, **itself a function of the other four diary targets** | S5 → arithmetic composite (see C9) | as above | No | as above |
| `pem`, `fatiga`, `niebla_mental` | S5, threshold | S5 | S1/S2/S3 | No | as above |
| **Deployment model** (AUC 0.688) | `disfuncion_autonomica ≥ 5` | S5 | `hrv_rmssd_calc_t2`: S1 → `parse_ppi_samples.py` (calendar-day bucket) → `compute_hrv_features.py` → L3 → lag t2. `hrv_rmssd_night_t2`: S2, lag t2 | No | No — both t2 |
| **Sleep Quality model** | **`fatiga ≥ 6`** — `analysis/sleep_quality/l5_retrain.py:41-42` | S5 | S1/S2 nocturnal HRV × lags t0–t3 | No | `t0`: unresolved |
| Convergence analysis | `fatiga ≥ 6` for **both** compared models | S5 | — | — | — |

No model's target is device-derived. The literal C8 kill criterion — target and
features descending from the same raw stream in the same window — is **not** met
by any model in the portfolio; every target is S5, every feature is S1–S4.

The check's own note directs it "first to the sleep-quality model if its target is
device-derived". It is not. It is something else:

### The Sleep Quality model is the fatiga model

`analysis/sleep_quality/l5_retrain.py:41-42` sets `TARGET_KEY = "fatiga"`,
`TARGET_THRESHOLD = 6.0` — identical to the PEM predictor's `fatiga` target
(`analysis/pem_predictor/l5_retrain.py:55`). Its candidate pool
(`sleep_quality/l5_retrain.py:33-39`: `hrv_rmssd_calc`, `hrv_rmssd_night`,
`hrv_lf_hf_ratio`, `hrv_sd1`, `hrv_sd2`) is a **strict subset** of the PEM
predictor's (`pem_predictor/l5_retrain.py:36-50`), except for two extra lags.
Same input file, same estimator, same LOO-CV, same seed, same C, same
`class_weight`.

Deep equality on the published artefacts (`analysis/audit_v2/raw_output.txt`,
section C8):

```
predictor.targets.fatiga == sleep_quality  →  True
```

All 14 keys match exactly: `selected_features = [hrv_rmssd_night_t0,
hrv_rmssd_night_t1]`, `auc_loo = 0.7703`, `n_training = 61`, `n_positive = 37`,
coefficients `−0.921591 / −0.364245`, intercept `0.104775`, and both scaler
blocks. The two "independent models" published in `public/data/polar_live.json`
are the same object.

### The convergence analysis is therefore circular

`public/convergence-analysis.html` presents these as "Two independent models, one
signal" (`:232`), "trained independently, on different feature candidates, asking
different clinical questions" (`:235-237`), and frames their agreement as
"the closest substitute for external validation" in N-of-1 research (`:263-268`).

Against the code:

| Claim on the page | Source | Actual |
|---|---|---|
| "asking different clinical questions" | `:236` | Same question: `fatiga ≥ 6` |
| "different feature candidates" | `:236` | Nested pools — sleep's 5 variables are a subset of ANS's 13 |
| "The Sleep predictor selected it from a different pool of 20 candidates" | `:276-277` | 5 variables × 4 lags, all present in the ANS pool |
| "independently converge on the same physiological signal … evidence of a real biological relationship" | `:267-269` | Two greedy searches over nested pools, same target, same data, same estimator, same seed |
| "42 shared diary days" (`:242`), ANS AUC 0.78 / Sleep AUC 0.70 | `:451` | Not reproducible from `polar_live.json`, where both fatiga blocks are identical at 0.7703, n=61, and the ANS feature set is `[hrv_rmssd_night_t0, hrv_rmssd_night_t1]`, not the `[hrv_rmssd_night_t0, sleep_wake_min_t2, hrv_hf_power_t0]` the page reports |

The page does partially self-correct at `:365-369` ("they are not independent
validations — both models use the shared feature hrv_rmssd_night_t0"), then
immediately re-asserts the stronger claim at `:371-375` ("The more meaningful
finding is the independent feature selection convergence … this is what would
survive a strict reproducibility test"). It would not. Two greedy forward searches
over nested candidate pools, on one dataset, against one target, with one seed,
converge on the same first feature **by construction**. The observation has zero
information content about biology.

**Kill criterion.** Shared stream and shared window → the model is a partial
identity, not a finding.

**Verdict: FAIL** — on the check's question, by a different mechanism than the one
it anticipated.

No target is device-derived, so no model is a stream-level partial identity. But
the portfolio's two "independent" models are byte-identical, and the convergence
analysis built on their agreement is a tautology presented as external validation.
Note also that the model published as the "Sleep Quality Predictor"
(`public/sleep-quality-predictor.html`) contains no sleep-quality variables at
all: its selected features are `hrv_rmssd_night_t0` and `hrv_rmssd_night_t1`, and
its target is fatigue.

---

## C9 — Algebraic coupling (composite targets)

**Question.** Does the target contain, algebraically, any variable that also
appears among the features?

### 1. The target formulae, explicitly

**Convergence model.** The check presumes a composite target drawing on both the
diary and the device. There is no such target. Both compared models use the same
plain diary threshold, `fatiga >= 6.0`
(`analysis/sleep_quality/l5_retrain.py:41-42`;
`analysis/pem_predictor/l5_retrain.py:55`). No difference, ratio, product, joint
threshold or agreement score enters any model's target. The convergence *page*
reports an agreement rate between two models' predictions, but no model is
trained on it.

```
UNCOMPUTABLE: no composite diary×device target exists in the codebase.
  Consequently the Oldham correction (step 4) is not applicable — there is no
  difference or change score to assess against a mean.
```

**Severity model.** A composite target does exist, and the check's logic applies
to it. `scripts/log_diary.py:260-261`:

```python
sev_components = [fatiga, pem, niebla] + ([auto] if auto is not None else []) + ([dolor] if dolor is not None else [])
sev_global = round(sum(sev_components) / len(sev_components), 1)
```

The `severity` target (`l5_retrain.py:53`, `severidad_global >= 6`, published
AUC 0.837, the highest of the five non-degenerate targets) is the **arithmetic
mean of the other four published targets plus `dolor`** — including
`disfuncion_autonomica`, the headline target. It is a *type* — a mean of
components — not an independent measurement, and it shares no variable with the
feature side, so it is not feature/target coupling. It is target/target coupling:
the portfolio presents five "targets" of which one is definitionally the average
of the rest.

### 2. Decomposition against each component

Spearman rho, `severidad_global` against each of its own constituents:

| Component | rho | p | n |
|---|---|---|---|
| `fatiga` | **+0.9135** | 1.0e−24 | 61 |
| `niebla_mental` | +0.8377 | 3.9e−17 | 61 |
| `dolor` | +0.7559 | 2.5e−11 | 55 |
| `disfuncion_autonomica` | +0.7246 | 4.0e−10 | 55 |
| `pem` | +0.7197 | 6.3e−11 | 61 |

These are not empirical associations. They are the correlation of a mean with its
own terms, and would be near this magnitude for pure noise components.

Cross-target Spearman (all diary-internal): every pair of the five symptom
dimensions correlates between **+0.62 and +0.89**
(`fatiga ~ niebla_mental` = +0.8949, p = 2.5e−22;
`disfuncion_autonomica ~ dolor` = +0.7514;
`pem ~ disfuncion_autonomica` = +0.7445). The five "different targets" are one
latent self-report factor. Five AUCs against five near-collinear targets are
approximately one result reported five times.

### 3. Synthetic null

```
UNCOMPUTABLE: the full nested pipeline cannot be run — no feature values
  (data/processed/L4/diary_features.csv absent) and no nested/embargo estimator
  in this repository. A 1000x synthetic null against an absent pipeline is not
  meaningful and was not fabricated.
```

### 4. Oldham's method

Not applicable — no difference or change score is used as a target anywhere in
the codebase (verified against `l5_retrain.py:52-58` and
`sleep_quality/l5_retrain.py:41-42`).

### An additional failure found while verifying the formula

Recomputing `severidad_global` from its own documented formula for all 61 rows
(`analysis/audit_v2/compute_checks.py`; raw output section C9):

| `schema_version` | rows | rows matching the formula (dev ≤ 0.05) | max deviation |
|---|---|---|---|
| `DIARY_v1` | 10 | **0 / 10** | **5.1** |
| `DIARY_v2` | 25 | 2 / 25 | 2.6 |
| `DIARY_v3` | 26 | **26 / 26** | 0.0 |
| **Total** | **61** | **28 / 61 (46%)** | **5.1** |

Only the 26 `DIARY_v3` rows — those actually produced by `log_diary.py` — follow
the documented formula. The 10 `DIARY_v1` rows follow no reconstructible rule:
`2025-10-24` stores `severidad_global = 1.5` where its own components average
`6.6`, and `2025-10-01` stores `3.0` against components averaging `7.3`. An
alternative formula (mean of `fatiga`, `pem`, `niebla_mental` only) fits no better
(0/10 for v1, max deviation 4.5).

The `severity` target is therefore a mixture of **three mutually incompatible
definitions** across the same 61-row training set, differing by up to 5.1 points
on a 0–10 scale — larger than the distance between the threshold (6) and either
extreme of the scale. The target column is not one variable.

**Kill criterion.** Synthetic-null AUC ≥ the 50th percentile of the observed AUC
distribution → the result is algebraic, not empirical.

**Verdict: FAIL** — on a different target than the check anticipated.

The synthetic null is uncomputable and the convergence target the check was
written for does not exist. What does exist is worse than the anticipated case:
the `severity` target is definitionally the mean of the other four published
targets, all five targets are mutually correlated at rho 0.62–0.89, and the
composite is computed by three different and undocumented rules across the
training set, deviating from its stated formula in 54% of rows.

As the audit spec notes, a permutation test does not detect this. Shuffling labels
leaves the definitional structure intact.

---

## Which v1.0 claims survive

**None of the performance claims survive.** C1 and C2 both fail, and the spec's
own gating makes every AUC in v1.0 void. Setting the gate aside and taking each
claim on its own merits:

### Do not survive

| Claim | Killed by | Why |
|---|---|---|
| Headline AUC 0.829 (0.795 nested) for `disfuncion_autonomica` | C1, C2 | Target is a recall reconstruction written median 60 days later by an unblinded subject; the temporal anchoring of the top feature is unresolved and unresolvable from the retained data |
| All five per-target AUCs (0.770–0.988) | C1, C2, C9 | Same, plus: the five targets are one latent factor (pairwise rho 0.62–0.89) |
| `severity` AUC 0.837 | C9 | Target is the arithmetic mean of the other four targets, computed by three incompatible rules across the training set |
| Deployment model AUC 0.688 | C1, C2 | Same target defects. Its features (`hrv_rmssd_calc_t2`, `hrv_rmssd_night_t2`) are the *only* published features free of the `t0` window contamination, but the target is unchanged |
| "48h advance warning" framing | C1, C2 | Advance warning of a symptom score that did not exist until months after the day it describes |
| "Two independent models converge on one signal" | C8 | The two model blocks are byte-identical; the pools are nested; the target is the same |
| Convergence page figures (42 shared days, ANS 0.78 / Sleep 0.70, r = 0.66, 79% agreement) | C8 | Not reproducible from the published artefacts, which show both fatiga models identical at 0.7703, n = 61 |
| "Sleep Quality Predictor" as a distinct analysis | C8 | Target is `fatiga`; features are two nocturnal RMSSD lags; no sleep variable is in the model |
| Lag-1 ACF ≈ −0.03, and any independence argument built on it | C6 | Adjacent-calendar-day lag-1 ACF is **+0.375** (+0.380 detrended) |
| `data_window` 2025-08-25 → 2026-04-27 with 61 diary entries | C3 | Diary spans 2025-09-02 → 2026-04-02; window overstated by 33 days |
| Any `*_t0` feature described as predictive | C1 | The eight L2-derived `*_t0` features are computed from a window containing the whole symptom day |

### Survive

| Claim | Check | Note |
|---|---|---|
| The result is not a shared linear drift | C6 | Target trend r² = 0.001, p = 0.795 across all six diary dimensions. Genuine pass |
| No model target is device-derived | C8 | Every target traces to self-report; no stream-level partial identity exists |
| No target uses a difference or change score | C9 | Oldham's correction is not needed anywhere |
| The lag ladder is internally monotone | C1 | Within a single L1 source. Not across sources |
| Existing documented limitations (n=1, LOO optimism, PPG imprecision, class imbalance on `niebla_mental`, no external validation) | — | All still true, and all understate the problem: they describe estimator limitations, not the validity failures above |

### Not tested by this audit

C4 (signal quality as confounder), C5 (threshold sensitivity of the AUC), and C7
(univariate vs multivariate) return `UNCOMPUTABLE` in this environment. Each
retains a recorded adverse structural finding — the per-night artifact rate is
discarded at ingest and is unrecoverable without re-running L1; the production cut
point sits exactly on the target's modal value with 31% of positives on the
boundary; the second feature in the headline model contributes less than the
selector's own 0.01 floor against an AUC standard error of ±0.06 — but none of
their kill criteria was evaluated. They remain open.

To close them, three artefacts must be made available to the audit environment:
`data/processed/L3/daily_unified.csv`, `data/processed/L4/diary_features.csv`, and
the v1.0 estimator code. C4 additionally requires re-running L1 against the L0
export with `parse_ppi_samples.py` modified to retain per-night rejection counts.

### What the data can still support

Nothing that requires the diary as a prospective outcome. The retrospective
authoring established in C2 is not a bias that can be adjusted for, bounded, or
noted as a limitation — it removes the temporal ordering the entire predictive
framing rests on. No re-analysis of this dataset recovers it.

A prospective, same-day, device-blinded diary period would produce data on which
C1–C7 could be executed properly. Until then, the defensible description of the
existing work is a data-engineering pipeline over eight months of wearable
telemetry, with an exploratory retrospective symptom annotation attached — not a
predictor, and not a finding.

---

*Report only. No production code, canonical data, or published artefact was
modified. Files written by this audit are confined to `analysis/audit_v2/`.*
