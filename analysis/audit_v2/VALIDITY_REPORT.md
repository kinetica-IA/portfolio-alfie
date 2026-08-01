# ANS Predictor — End-to-End Validity Audit (v2)

- **Spec:** `ANS Predictor — End-to-End Validity Audit (v2)`, version 2.0-draft, 2026-08-01
- **Executed:** 2026-08-01, against `kinetica-ia/portfolio-alfie` @ `62d3142` (branch `claude/ans-predictor-validity-audit-v6fw0v`)
- **Scope:** upstream validity threats only. v1.0 estimator checks were not re-run.
- **Writes:** this file only. No production code or canonical data was modified.

---

## 0. Precondition that governs every check below

**The repository does not contain the feature data the published models were trained on.**

| Fact | Value | Provenance |
|---|---|---|
| Raw Polar export location | `~/IO3/clinical_data_backup/polar_export_2026-04-27` — outside the repo, absent from this environment | `pipeline/config.py:13-16`; `ls ~/IO3` → `No such file or directory` |
| `data/processed/L1…L5` | empty except `.gitkeep` | `.gitignore:29-40`; directory listing |
| Diary date range | 2025-09-02 → 2026-04-02, 61 rows | `data/diary_live.csv` (61 data lines) |
| Published feature series date range | 2026-05-02 → 2026-07-30, 90 rows | `public/data/polar_live.json:13` (`series`), `scripts/fetch_polar_live.py:27` (`PUBLISHED_SERIES_DAYS = 90`) |
| **Date intersection (diary ∩ series)** | **0 days** | computed |
| Columns present in `series` | `date, recovery_sublevel, recovery_heart_rate, sleep_score, sleep_wake_min, active_calories` — **no HRV column at all** | computed over all 90 rows |

Consequence: for the 55–61 diary days that produced every published AUC, **not one feature value exists in this repository.** Any check requiring a paired (feature, target) row is `UNCOMPUTABLE` here, and is reported as such rather than inferred.

**Second precondition.** The v1.0 apparatus the spec refers to is not in this repo. `grep -rI` across the whole tree (excluding `.git`, `node_modules`) returns **zero** hits for `embargo`, `permutation`, `nested`, `TimeSeriesSplit`, `GroupKFold`, `purge`, and `0.795`. There is no `analysis/audit_v1/`. The only validation implemented anywhere is LOO-CV + bootstrap (`analysis/pem_predictor/l5_retrain.py:180-301`). Every spec instruction of the form "re-run the headline blocked+embargo + nested-selection model" therefore has no runnable referent and is reported `UNCOMPUTABLE`, distinct from "computed and passed".

**Third precondition.** Two artifacts published from this project disagree about the headline model on an identical sample. This is used as evidence in C7 and is stated here because it affects which "headline" each check refers to:

| | `public/data/polar_live.json` (run B) | `public/ans-predictor.html:568` `VIZ_DATA` (run A, generated 2026-05-15) |
|---|---|---|
| `disfuncion_autonomica` features | `hrv_rmssd_night_t0`, `recovery_sublevel_t3` | `hrv_rmssd_night_t0`, `sleep_wake_min_t2` |
| AUC (LOO) | 0.8288 | 0.837 |
| n / pos / neg | 55 / 32 / 23 | 55 / 32 / 23 |
| Underlying frame | 243 days | `n_polar_days: 255`, `data_paths.diary: "polar-lyme-predictor/data/diary_live.csv"` — a different repo |

---

## C1 — Temporal alignment of target and features

**Question.** For a diary row of calendar day `D`, does `hrv_rmssd_night_t0` come from the night preceding `D` (prediction) or the night following it (retrodiction)?

### C1.1 — Join key construction, verbatim

The diary/feature join and the lag ladder (`analysis/pem_predictor/l4_diary_join.py:107` and `:115-126`):

```python
paired = unified.join(diary_subset, how="inner")            # :107
...
lag_df = pd.DataFrame(index=paired.index)                   # :115
for col in LAG_COLUMNS:
    ...
    series = unified[col]
    for lag in range(N_LAGS):
        col_name = f"{col}_t{lag}"
        lag_df[col_name] = paired.index.map(
            lambda d, s=series, l=lag: (
                s.get(d - pd.Timedelta(days=l)) if (d - pd.Timedelta(days=l)) in s.index else float("nan")
            )
        )
```

The legacy path is equivalent (`scripts/retrain_predictor.py:131-133`):

```python
def polar_at(polar, date_str, lag):
    dt = datetime.strptime(date_str, "%Y-%m-%d") - timedelta(days=lag)
    return polar.get(dt.strftime("%Y-%m-%d"), {})
```

So `<feature>_tK` for diary day `D` is **the row keyed `D − K` in the unified frame**. The join carries no time-of-day information whatsoever. The entire temporal validity of the model therefore rests on a single unstated assumption: *what night the date key on each feature row refers to.* That key is assigned independently by each L1 parser, and **the parsers do not agree.**

### C1.2 — Three mutually incompatible night-date conventions in one codebase

| Feature family | Date key assigned by | Rule | Night that `date = D` refers to |
|---|---|---|---|
| `hrv_rmssd_night`, `ans_status`, `recovery_sublevel`, `recovery_indicator`, `hrv_rri_mean_ms` | `pipeline/l1_extract/parse_nightly_recovery.py:112` — `night_date = date.fromisoformat(raw.night)` | Polar's own `night` field, passed through unexamined (`:29`) | **Undetermined by any code or data in this repo.** |
| same fields, live path | `scripts/fetch_polar_live.py:148,157,114` — `yesterday = today − 1d`; row stored as `{"date": yesterday}` from `GET /v3/users/nightly-recharge/{yesterday}` (`:54`) | Whatever Polar AccessLink means by its path date | **Undetermined.** Not cross-checked against the GDPR `night` field anywhere. |
| `hrv_rmssd_calc`, `hrv_sdnn`, `hrv_pnn50`, `hrv_lf_hf_ratio`, `hrv_hf_power`, `hrv_sd1`, `hrv_sd2`, `hrv_dfa_alpha1` — **pipeline path (produces the published models)** | `pipeline/l1_extract/parse_ppi_samples.py:80` — `day = date.fromisoformat(entry["date"])` | The PPI file's calendar-day container. **No night window is applied at all.** `:110-123` buckets *every* sample of calendar day `D`, 00:00–23:59, daytime included | **Not a night.** All of calendar day `D`. |
| same fields — **script path** | `scripts/extract_rr.py:24-32` — `assign_night()` | Explicit and documented: `"""Night of date X = X 22:00 → X+1 06:00."""` (`:26-27`) | **The night that *follows* day `D`.** |

Three observations follow directly, none requiring the raw data:

1. **`hrv_rmssd_calc_tK` in the published models is not a night measurement.** The models in `public/data/polar_live.json` were produced by `analysis/pem_predictor/l5_retrain.py` (its `CANDIDATE_FEATURES` at `:36-50` is the only list that includes `hrv_rmssd_calc`, at `:49`; `scripts/retrain_predictor.py:45-60` does not). That path sources `hrv_rmssd_calc` from `parse_ppi_samples.py` → `compute_hrv_features.py`, where the time-domain metrics including RMSSD are computed on the **full day array** (`pipeline/l2_features/compute_hrv_features.py:108-109`, `peaks_full = nk.intervals_to_peaks(arr)`), the frequency/nonlinear metrics on the **first 400 intervals of the calendar day** (`:112`, `window = arr[:FREQ_WINDOW]`). `hrv_rmssd_calc_t0` therefore contains RR intervals recorded *during the waking hours of day `D` itself*, contemporaneous with and subsequent to the symptoms being scored. `hrv_rmssd_calc_t1` contains all of day `D−1`, up to 23:59.

2. **Documentation asserts the opposite.** `docs/ANS_PREDICTOR_PIPELINE.md:113` and the following lines state: "`hrv_rmssd_night_t0` — Polar's own RMSSD measurement **from the previous night**", and "`hrv_rmssd_calc_t2` — RMSSD recalculated from raw pulse intervals (L2 computation) **from two nights prior**." The second claim is contradicted by `parse_ppi_samples.py:80`: no night extraction is performed on that path. The first claim is unverifiable — it is an assertion about Polar's `night` field, which no code in this repo inspects and no committed data exhibits.

3. **The magnitude discrepancy is consistent with (1), not with the documentation.** From `public/data/polar_live.json`, `scaler_mean` values fitted on the training sample:

   | Feature | Sample mean (ms) | Source line |
   |---|---|---|
   | `hrv_rmssd_night_t0` (Polar, night) | **38.47** | `polar_live.json` → `predictor.targets.disfuncion_autonomica.scaler_mean` |
   | `hrv_rmssd_night_t2` (Polar, night) | **39.97** | `predictor.deployment_model.scaler_mean` |
   | `hrv_rmssd_calc_t1` (recomputed) | **67.88** | `predictor.targets.pem.scaler_mean` |
   | `hrv_rmssd_calc_t2` (recomputed) | **66.55** | `predictor.deployment_model.scaler_mean` |

   The "internal consistency check between the GDPR export and our own computation" (`compute_hrv_features.py:10-11`) disagrees with the quantity it is checking by **+73%**. Two mechanisms in the code produce exactly this: a whole-day window that includes waking, postural and motion-laden RR (`parse_ppi_samples.py:110-123`), and the absence of any NN/ectopic filter on that path — `parse_ppi_samples.py:93` applies only a 300–2000 ms physiological band, while the successive-difference filter that RMSSD requires (`scripts/extract_rr.py:35-43`, `nn_filter`) exists only on the script path and is never applied in the pipeline. A >70% inflation of a successive-difference statistic is the expected signature of retained artifacts. This discrepancy is not surfaced anywhere in the published artifacts or the methodology document.

### C1.3 — The lag ladder is not monotone across feature families

Within one family the ladder is monotone by construction (`l4_diary_join.py:124`, `d − l days` for `l ∈ 0..3`). **Across** families it is not: `hrv_rmssd_night_tK` and `hrv_rmssd_calc_tK` carry the same subscript while denoting different physical intervals, offset by up to one full night. The published `deployment_model` combines exactly these two (`polar_live.json` → `predictor.deployment_model.selected_features`: `["hrv_rmssd_calc_t2", "hrv_rmssd_night_t2"]`), so its two coefficients (−0.755 and +0.539) are fitted on windows that the code cannot be shown to align.

This propagates into the deployment claim. `DEPLOYMENT_LAGS = [2, 3]` is justified as "lags available ≥48h before symptom date" (`scripts/retrain_predictor.py:73`; `analysis/pem_predictor/l5_retrain.py:63,389-391`). Under the calendar-day bucketing actually used, `hrv_rmssd_calc_t2` for target day `D` closes at 23:59 on `D−2` — roughly 24 h, not 48 h, before day `D` begins. Under the `extract_rr.py` convention it closes at 06:00 on `D−1`, i.e. **after** the moment the CLI issues its D+2 forecast (`scripts/log_diary.py:285,288`). The 48-hour horizon is not established by either convention.

### C1.4 — The requested measurements

The spec asks for 10 sampled rows with diary date, diary ingestion timestamp, `night_t0` sleep start/end, and the resulting gap in hours.

`UNCOMPUTABLE: sleep start/end timestamps not present in any repository artifact.` `pipeline/l1_extract/parse_sleep.py:193-205` extracts only ISO-8601 *durations* (`sleepSpan`, `asleepDuration`, phase durations); no clock time is retained. `pipeline/l3_unified.py:85-87` explicitly drops `session_start_time` and `test_time` before merging. `public/data/polar_live.json` carries no timestamp on any series row.

`UNCOMPUTABLE: diary ingestion/entry timestamp not present in data/diary_live.csv.` The schema is date-only — `scripts/log_diary.py:40-41`:

```python
DIARY_COLS = ["date", "schema_version", "severidad_global", "fatiga", "pem",
              "niebla_mental", "disfuncion_autonomica", "dolor", "nota"]
```

and the date is `date.today().isoformat()` or a `--date` override (`:240`), never a timestamp. **The sign and magnitude of the gap between night end and diary entry cannot be computed for any row, and no artifact in this repository could ever have computed it.**

### C1 — Verdict

- **Kill criterion:** median gap between `night_t0` end and the diary day is negative.
- **Directly against that criterion: `UNCOMPUTABLE`** — the timestamps required to evaluate it do not exist (`parse_sleep.py:193-205`; `log_diary.py:40-41`).
- **On the underlying question the criterion exists to answer: `FAIL`.**

The failure does not depend on the missing timestamps. Alignment is asserted in `docs/ANS_PREDICTOR_PIPELINE.md:113` but implemented three different ways in three files, and for the `hrv_rmssd_calc` family the implementation used by the published models (`parse_ppi_samples.py:80`) demonstrably admits RR intervals recorded **on and after the symptom day being predicted**. `hrv_rmssd_calc_t1` carries the `pem` model (AUC 0.7988) and `hrv_rmssd_calc_t2` carries the entire `deployment_model` (AUC 0.6875). Those two models are retrodictive-contaminated by construction, and the 48h horizon claim is unsupported.

The headline target's features (`hrv_rmssd_night_t0`, `recovery_sublevel_t3`) come from the Polar `night` key, which is neither validated nor documented anywhere in the codebase. Its direction is **unknown, not confirmed.** The v1.0 AUCs cannot be declared void on that basis — but neither can they be declared aligned. **This is a single-field check against the raw export that has never been performed, and the entire headline result is conditional on its outcome.**

---

## C2 — Rater–instrument circularity

**Question.** Could the subject have seen a device-derived recovery/HRV figure before completing the diary entry for that day?

### C2.1 — Entry time of day

`UNCOMPUTABLE: diary entry timestamp not present in data/diary_live.csv.` Schema is date-only (`scripts/log_diary.py:40-41`); no hour is recorded, and `--date` (`:226,240`) permits retrospective entry for an arbitrary past date with no marker distinguishing same-day from backfilled rows. The distribution of entry hour cannot be produced, now or retrospectively. **Flagged unresolved, as the spec requires.**

### C2.2 — Exposure is not merely possible; it is implemented

The check asks whether the subject *could* have seen a device figure. The codebase answers affirmatively on three independent channels, each citable:

1. **The logging tool shows a model forecast for a future diary day, in the same session as the entry.** `scripts/log_diary.py:284-297`: after writing the row for `entry_date` (`:279`), the CLI computes `day_after = entry_date + 2` (`:285`) and prints `"Prob. disfunción autonómica en {day_after}: {prob}%  →  Riesgo {ALTO|MODERADO|BAJO}"` (`:294`), with the driving feature values printed immediately above (`:292-293`). Two days later the subject is asked to score `disfuncion_autonomica` for exactly that date (`:257`). **The instrument tells the rater what number to expect for the target, 48 hours before the rater produces it.** The forecast is derived from HRV (`predict_48h`, `:130-175`).
2. **The subject's own public site renders the device HRV figure.** `src/components/LivePulse.jsx:42-45` reads `hrv_rmssd_night` from `polar_live.json` and displays the latest value plus a sparkline in the site's live ribbon.
3. **The Polar device and app themselves display Nightly Recharge, ANS status and recovery each morning.** These are the source of `hrv_rmssd_night`, `ans_status`, `recovery_sublevel` (`scripts/fetch_polar_live.py:57-64`). No blinding procedure exists anywhere in the repository.

Channel 1 is currently inert but was live: `predict_48h` returns `None` when any required feature is absent (`:154-155`), and the current `deployment_model` requires `hrv_rmssd_calc_t2`, a key that `scripts/merge_hrv.py:14-24` explicitly excludes from `polar_live.json` (`"# Features to merge (hrv_rmssd_calc excluded …)"`) and `fetch_polar_live.py` never writes. That the loop is presently broken is an accident of a feature-name mismatch, not a design safeguard — and `log_diary.py:43-44` hardcodes `MODEL_SENSITIVITY = 0.7188`, `MODEL_N = 54`, which is the fingerprint of a model that *was* firing at n=54, i.e. across the tail of the 55-row training sample.

### C2.3 — Displayed vs. blinded metric

The spec asks for Spearman ρ of the diary score against the device-displayed nightly value versus against a re-derivation the subject never saw, with n and CI.

`UNCOMPUTABLE: no paired (feature, target) row exists in this repository` (see §0 — zero date overlap; no HRV column in `series`). Neither ρ can be computed.

What can be reported from the published artifacts is the behaviour of forward selection when both were offered as candidates. `analysis/pem_predictor/l5_retrain.py:36-50` offers the displayed family (`ans_status`, `hrv_rmssd_night`, `recovery_sublevel` at lags 0–3) and the blinded re-derivation (`hrv_rmssd_calc` at lags 0–2, line `:49`) to the same greedy selector:

| Target | 1st selected | Displayed? | 2nd/3rd selected | Coefficient signs |
|---|---|---|---|---|
| severity | `hrv_rmssd_night_t0` | yes | `ans_status_t2` | −1.171 / +0.463 |
| pem | `hrv_rmssd_night_t0` | yes | `hrv_rmssd_calc_t1` | −1.099 / **+0.373** |
| fatiga | `hrv_rmssd_night_t0` | yes | `hrv_rmssd_night_t1` | −0.922 / −0.364 |
| niebla_mental | `ans_status_t0` | yes | `hrv_rmssd_night_t1`, `recovery_sublevel_t3` | −2.008 / −0.904 / +0.608 |
| disfuncion_autonomica | `hrv_rmssd_night_t0` | yes | `recovery_sublevel_t3` | −1.216 / +0.463 |

In **5 of 5** targets the first-selected — and dominant — feature is a number the subject sees on the device every morning. The blinded re-derivation is never selected first, appears in exactly one target, and there carries a coefficient of the **opposite sign** to the RMSSD term it accompanies (+0.373 against −1.099), which is a suppressor pattern rather than an independent physiological contribution. This is consistent with the expectancy hypothesis and consistent with a real coupling that Polar's on-device signal-cleaning captures better than the pipeline's unfiltered whole-day recomputation (C1.2, item 3). **It does not discriminate between them.**

### C2 — Verdict

- **Kill criterion:** association present with the displayed metric and absent or materially weaker with the blinded re-derivation.
- **Verdict: `UNCOMPUTABLE` on the statistic; `FAIL` on the design question the statistic proxies.**

The statistic cannot be computed. The design question does not need it: exposure is not a hypothetical, it is instrumented. `scripts/log_diary.py:294` prints a model-derived probability for `disfuncion_autonomica` on day `D+2` to the same person who will then rate `disfuncion_autonomica` on day `D+2`. A diary that is scored after the rater has been shown a forecast of that score is not an independent measurement of the outcome, and no analysis performed on it can separate physiology from expectancy.

**Residual uncertainty, recorded explicitly as the spec requires:** the direction and size of the expectancy effect are unknown and unbounded by anything in this repository. The selection pattern above is suggestive and nothing more. **No statistical test resolves this. Only a blinded diary period — entries logged with the device readout and the forecast withheld — can.** Until then, the published framing "nocturnal ANS predicts PEM 48h ahead" (`scripts/retrain_predictor.py:671`) is not supportable as a physiological claim.

---

## C3 — Missingness mechanism

**Question.** Are the 55–61 diary days a random subset of the 243 nights?

### C3.1 — Nights with HRV but no diary, and diary with no HRV

From the published state file (`public/data/polar_live.json` → `data_window`; `public/data/pipeline_state.json`):

| Quantity | Value | Provenance |
|---|---|---|
| Calendar days in window (2025-08-25 → 2026-04-27) | 243 | `polar_live.json` `data_window.n_days`; `pipeline_state.json` `summary.total_days` |
| Nights with HRV features | 239 | `pipeline_state.json` L2 `metrics.nights_with_hrv` |
| Diary entries | 61 | computed from `data/diary_live.csv` |
| Paired days | 61 | `data_window.n_paired`; `pipeline_state.json` L4 `metrics.paired_days` |
| **Nights with HRV, no diary** | **178** (239 − 61) | derived |
| **Diary entries with no HRV** | **0** (61 paired = 61 entries) | derived from `n_paired == n_diary_entries` |

**73.4% of nights with usable HRV have no diary entry.** The join keeps only diary dates (`l4_diary_join.py:107`, `how="inner"`), so this attrition is invisible downstream — no artifact records which 178 nights were dropped.

### C3.2 — HRV level on diary-present vs diary-absent days

`UNCOMPUTABLE: hrv_rmssd_night not present for any day of the observation window in any committed artifact.` (§0 — the published `series` covers 2026-05-02 → 2026-07-30 and contains no HRV column; L1–L3 are gitignored; the raw export is absent.) Mann–Whitney U, effect size, and per-group n cannot be produced.

This is the single most consequential gap in this audit. The check that would establish whether the sample is selected on a correlate of the target requires one column of 243 numbers that no committed artifact carries.

### C3.3 — Diary presence over calendar time — computed

Computed from `data/diary_live.csv` (61 rows, 61 unique dates, 2025-09-02 → 2026-04-02, span 213 days → **28.6% calendar coverage**):

```
  2025-09: 16/30  ################
  2025-10:  6/31  ######
  2025-11:  4/30  ####
  2025-12:  3/31  ###
  2026-01:  2/31  ##
  2026-02: 28/28  ############################
  2026-03:  1/31  #
  2026-04:  1/30  #
```

Gap distribution between consecutive entries (days): `{1: 42, 2: 4, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 2, 9: 2, 13: 1, 15: 2, 17: 1, 19: 1, 32: 1}`.

**Runs of absence > 5 days: 10.**

| From | To | Days absent |
|---|---|---|
| 2025-09-23 | 2025-09-30 | 6 |
| 2025-10-08 | 2025-10-21 | 12 |
| 2025-10-24 | 2025-11-01 | 7 |
| 2025-11-04 | 2025-11-21 | 16 |
| 2025-11-21 | 2025-12-06 | 14 |
| 2025-12-11 | 2025-12-30 | 18 |
| 2025-12-30 | 2026-01-14 | 14 |
| 2026-01-14 | 2026-01-23 | 8 |
| 2026-01-23 | 2026-02-01 | 8 |
| 2026-03-01 | 2026-04-02 | 31 |

The sample is not a scatter of days across the window. **28 of 61 entries (45.9%) come from a single complete calendar month, February 2026 (28/28 days).** The remaining 33 are spread over 185 days at 18% density, including a 31-day and an 18-day blackout. The 15 non-February entries between 2025-10-01 and 2026-04-02 are a 7%-density sample of that stretch. Whatever governed logging in February did not govern the rest of the window, and any process that produces a solid 28-day block surrounded by month-long silences is a *state* of the subject, not a sampling design.

### C3.4 — `met_minutes` on present vs absent days

`UNCOMPUTABLE: met_minutes not present in any committed artifact.` The field is defined and populated only inside the ungitignored-output pipeline (`pipeline/l1_extract/parse_activity.py:53` schema, `:119` `met_minutes=summ.get("dailyMetMinutes")`); `data/processed/L1/activity.parquet` is not committed (`.gitignore:29-31`), and `met_minutes` is absent from `public/data/polar_live.json`.

### C3.5 — Additional missingness structure, computed

The spec asks about the 55–61 range. The 6-row difference is not noise and is not random:

- All 61 rows have `severidad_global`, `fatiga`, `pem`, `niebla_mental`. **6 rows lack `disfuncion_autonomica`** (and the same 6 lack `dolor`), giving the headline target n=55. Recomputed positives/negatives at threshold ≥5: **55 / 32 / 23**, matching the published `n_training / n_positive / n_negative` exactly.
- Those 6 rows are `2025-09-13, 2025-09-15, 2025-09-22, 2025-09-23, 2025-09-30, 2025-10-01` — **all six are `DIARY_v1`**, and all six fall in the first 30 days of the window. `disfuncion_autonomica` is optional at the prompt (`scripts/log_diary.py:257`, `required=False`).
- The dropped rows are **worse days**: mean `pem` 7.83 vs 5.49 in the retained group; mean `fatiga` 6.67 vs 5.79; `severidad_global` 5.83 vs 5.66.
- `analysis/pem_predictor/l5_retrain.py:156` (`sub = df.dropna(subset=[target_key])`) silently removes them. The published artifacts report `n_training: 55` with no indication that the excluded 6 are systematically the highest-PEM days in the record.

Related, and load-bearing for what the target *is*: the diary carries three schema versions (`DIARY_v1` ×10, `DIARY_v2` ×25, `DIARY_v3` ×26). Under v3, `severidad_global` is the mean of the available component scores (`log_diary.py:260-261`). Recomputing that definition against each row:

| Schema | n | Rows where `severidad_global == mean(components)` | Mean stored | Mean recomputed |
|---|---|---|---|---|
| DIARY_v1 | 10 | **0 / 10** | 5.75 | 7.09 |
| DIARY_v2 | 25 | **2 / 25** | 5.72 | 5.50 |
| DIARY_v3 | 26 | **26 / 26** | 5.62 | 5.62 |

`severidad_global` is computed by a different rule in the first 35 rows than in the last 26, and no code in the repo converts between them. The `severity` target (AUC 0.8374, n=61) is fitted across all three. This does not affect the `disfuncion_autonomica` headline, which uses a directly-elicited component score.

### C3 — Verdict

- **Kill criterion:** diary presence significantly associated with HRV level.
- **Verdict: `UNCOMPUTABLE` on the HRV association; `FAIL` on randomness of the subset.**

The specific test the kill criterion names cannot be run. But the question it asks — "are the 55–61 diary days a random subset of the 243 nights?" — is answered **no** by the calendar structure alone: 178 of 239 HRV nights are discarded by an inner join that records nothing about them, 46% of the surviving sample is one contiguous month, ten absence runs exceed five days, and the 6 rows that separate n=61 from n=55 are excluded by a mechanism (`DIARY_v1` optional field) that correlates with markedly higher PEM. **The published AUC is conditioned on an unmodelled selection process and is not reported as such anywhere** — not in `README.md:23`, not in `docs/ANS_PREDICTOR_PIPELINE.md` §6 Limitations, not in `polar_live.json.headline`.

---

## C4 — Signal quality as confounder

**Question.** Does nightly PPG/RR data quality co-vary with both RMSSD and the symptom score?

### C4.1 — Available per-night quality fields

| Field the spec asks for | Status | Provenance |
|---|---|---|
| Artifact / ectopic beat percentage | `UNCOMPUTABLE: never stored per night in any artifact` | `parse_ppi_samples.py:92-96` increments `n_total` / `n_filtered` as **module-level scalars across all 32 input files**, logged once at `:99-105` and then discarded. The per-day loop at `:110-123` writes only `rr_intervals_count`, mean, p25, p75. `scripts/extract_rr.py:35-43` `nn_filter` likewise returns a filtered list without recording how many intervals it removed. |
| Coverage fraction | `UNCOMPUTABLE: not derived anywhere` — `rr_intervals_count` exists (`parse_ppi_samples.py:117`) but is never normalised by recording duration and is not among `LAG_COLUMNS` (`l4_diary_join.py:20-29`) or `CANDIDATE_FEATURES` (`l5_retrain.py:36-50`), so it never reaches the model matrix |
| Wake / awake minutes | **Defined and used as a feature** — `sleep_wake_min` (`parse_sleep.py:191,201`), candidate at lags 0–2 (`l5_retrain.py:40`) | present in code; **values `UNCOMPUTABLE` for the training window** (§0) |
| Recording duration | `sleep_duration_h` / `sleep_asleep_h` defined (`parse_sleep.py:196-197`) but **not** in `CANDIDATE_FEATURES` (`l5_retrain.py:36-50`) or `LAG_COLUMNS` (`l4_diary_join.py:20-29`) — never reaches the model |

The dropped-nights counter is the sharpest illustration: `compute_hrv_features.py:100-102,139-144` discards any night with fewer than 100 valid RR intervals and reports only an aggregate count. Which nights were dropped, and whether they cluster with diary-present or diary-absent days, is not recoverable from any artifact.

### C4.2 — Correlations of quality with `hrv_rmssd_night_t0` and with the target

`UNCOMPUTABLE: no paired (quality, feature, target) rows exist in this repository` (§0).

### C4.3 — Re-run with the strongest quality covariate forced in

`UNCOMPUTABLE` for two independent reasons: (a) no feature data (§0); (b) **no blocked+embargo + nested-selection pipeline exists in this repository** to re-run, and no code path anywhere supports forcing a covariate — `_forward_select` (`l5_retrain.py:232-265`) starts from `selected = []` with no mechanism to seed it. The spec's reference to "exactly as `met_minutes` was forced in v1.0" has no counterpart in this codebase; `met_minutes` appears only at `parse_activity.py:53,119` and in a notebook cell, never in any model.

### C4.4 — What the artifacts nonetheless show

Two quality-adjacent facts are on the record and bear directly on the kill criterion:

1. **A quality proxy already outranks physiology in one published run.** `sleep_wake_min_t2` — minutes awake during the night, which is simultaneously a sleep-quality metric and a PPG-recording-quality metric (movement and wake bouts are the dominant source of PPI artifacts) — was the **second selected feature for the headline target** in run A (`public/ans-predictor.html:568`, `disfuncion_autonomica.selected_features = ["hrv_rmssd_night_t0", "sleep_wake_min_t2"]`, LR AUC 0.837, weight −0.398) and for `fatiga` in that same run. It was displaced by `recovery_sublevel_t3` in run B for a net AUC change of −0.008. The model does not distinguish between "autonomic state" and "how much the subject moved while the sensor was recording"; forward selection swaps one for the other at essentially no cost.
2. **The recomputed RMSSD is quality-corrupted by construction** (C1.2, item 3): +73% against Polar's own figure, on a path with no NN/ectopic filter and no night window. Any model term built on `hrv_rmssd_calc` — `pem`'s second feature and the deployment model's leading feature — is loaded with artifact variance of unmeasured size.

### C4 — Verdict

- **Kill criterion:** the `hrv_rmssd_night_t0` coefficient collapses toward zero when quality is included.
- **Verdict: `UNCOMPUTABLE`.**

The test cannot be run, and — more seriously — **it cannot be run from the current pipeline outputs even with the raw export in hand**, because the per-night quality fields it requires (ectopic fraction, coverage) are computed and then thrown away (`parse_ppi_samples.py:92-105`; `compute_hrv_features.py:139-144`). Producing them requires a change to L1/L2, which is outside this audit's write scope. The confound is therefore **untested and, as the pipeline stands, untestable** — while the one quality-adjacent variable that does reach the selector was chosen as the headline model's second feature in a published run.

---

## C5 — Threshold sensitivity

**Question.** Is the result an artifact of dichotomising `disfuncion_autonomica` at exactly 5?

### C5.1 — Class balance at each candidate cut — computed

Computed from `data/diary_live.csv`, `disfuncion_autonomica`, n=55 non-null. Full ordinal distribution:

```
0.0: 5   1.0: 4   2.5: 1   3.0: 4   4.0: 8   4.5: 1   5.0: 10
5.5: 2   6.0: 9   6.5: 1   7.0: 2   7.5: 1   8.0: 3   8.5: 2   9.0: 2
```
mean 4.673 · median 5.0 · sd 2.446 · range 0.0–9.0

| Threshold | Positives | Negatives | Base rate | Minority n | ≥15 in minority? |
|---|---|---|---|---|---|
| 3 | 45 | 10 | 0.818 | 10 | no |
| **4** | 41 | 14 | 0.745 | 14 | **no — 14** |
| **5 (published)** | **32** | **23** | **0.582** | **23** | yes |
| **6** | 20 | 35 | 0.364 | 20 | yes |
| **7** | 10 | 45 | 0.182 | 10 | **no** |
| 8 | 7 | 48 | 0.127 | 7 | no |

Thresholds 5 and 32/23 reproduce the published `n_training`/`n_positive`/`n_negative` exactly. **Of the four thresholds the spec names, only 5 and 6 satisfy the spec's own ≥15-minority rule.** At 4 the minority is 14; at 7 it is 10.

**The decisive number: 10 of 55 observations (18.2%) sit at exactly 5.0 — the cut point itself.** Moving the rule from `≥5` to `>5` reclassifies nearly a fifth of the sample, taking the base rate from 0.582 to 0.400. The published dichotomisation is applied at the single most densely populated value in the distribution, and 5.0 is also the sample median. This is the maximally cut-sensitive choice available.

For context, the threshold is a hardcoded constant with no stated derivation: `{"name": "disfuncion_autonomica", "diary_key": "disfuncion_autonomica", "threshold": 5}` (`analysis/pem_predictor/l5_retrain.py:57`; identically `scripts/retrain_predictor.py:67`). `docs/ANS_PREDICTOR_PIPELINE.md:67` describes it only as "a clinical threshold (between 5 and 6 on the symptom scale, depending on the dimension)". The diary prompt's own anchors are "0-2 leve · 3-5 moderado · 6-8 severo · 9-10 incapacitante" (`scripts/log_diary.py:252`) — under which **≥5 places the top of the "moderate" band into the positive class**, and the natural clinical cut implied by the instrument's own wording is ≥6, not ≥5.

### C5.2 — Re-run the nested pipeline at 4, 5, 6, 7

`UNCOMPUTABLE: no feature data (§0), and no blocked+embargo + nested-selection pipeline exists in this repository` (§0, second precondition). AUC, PR-AUC, and permutation p cannot be produced at any threshold. **PR-AUC and permutation p are not computed anywhere in this codebase at any threshold** — `l5_retrain.py` emits AUC, bootstrap CI, sensitivity and specificity only (`:364-379`); `average_precision_score` and any label-shuffling null are absent from the entire tree.

### C5.3 — Undichotomised ordinal analysis

`UNCOMPUTABLE: requires hrv_rmssd_night_t0 values, absent (§0).` Spearman ρ and ordinal regression against the raw score cannot be produced.

Structurally, no ordinal analysis exists in the codebase: every target passes through `(sub[target_key].values >= threshold).astype(int)` (`l5_retrain.py:174`) before any model sees it. Information from a 0–10 instrument with 15 distinct observed levels is compressed to one bit before analysis, at the modal value.

### C5 — Verdict

- **Kill criterion:** significance present only at threshold 5, or absent in the undichotomised ordinal analysis.
- **Verdict: `UNCOMPUTABLE` on the sensitivity sweep; `FAIL` on the precondition it was meant to test.**

The sweep cannot be run. But the cut point does not survive inspection: it is hardcoded without derivation, it contradicts the severity bands of the instrument that produced the data, it sits on the sample median, and **18.2% of observations sit exactly on it**, so an off-by-one-half-point in the rule moves the base rate by 18 points. Two of the four thresholds the spec asks for are not runnable on this sample at all under its own ≥15 rule, which is itself a finding: at n=55 there is only one alternative cut (6) available, so the sweep — even fully executed — could never have been more than a two-point comparison. The undichotomised analysis that would settle the question has never been performed and is not supported anywhere in the pipeline.

---

## C6 — Shared temporal drift

**Question.** Is the association a common trend rather than a day-to-day coupling?

### C6.1 — Observation window — computed

| Quantity | Value |
|---|---|
| First diary date (target non-null) | 2025-09-02 |
| Last diary date | 2026-04-02 |
| Span | **213 days** |
| Observations | **55** |
| **Coverage** | **25.8%** |
| Feature-side window (`data_window`) | 2025-08-25 → 2026-04-27, 243 days (`polar_live.json` `data_window`) |

### C6.2 — Detrend both series and re-run

`UNCOMPUTABLE: hrv_rmssd_night_t0 values absent (§0); no blocked+embargo nested model exists to re-run (§0).` Neither the linear nor the 14-day rolling-mean detrended re-fit can be produced. Note additionally that a 14-day rolling mean is not well defined on this sampling pattern: outside February 2026 the median inter-entry gap exceeds 5 days and two gaps exceed 18 days (C3.3), so most 14-day windows contain one or two observations.

### C6.3 — Trend and lag-1 ACF of the target — computed

Computed from `data/diary_live.csv` (`disfuncion_autonomica`, n=55; binary `y = score ≥ 5`):

**Trend in the target**

| Quantity | Value |
|---|---|
| Ordinal vs day-index, OLS slope | −0.00127 /day (**−0.27 points over 212 days**) |
| Pearson r | −0.036, p = 0.795 |
| Spearman ρ | −0.063, p = 0.647 |
| Binary y vs day-index, Pearson r | −0.098, p = 0.476 |
| Base rate, first half / second half | 0.630 / 0.536 |

**There is no detectable linear trend in the target.** Detrending it is close to a no-op (removing the fitted line changes the lag-1 ACF from +0.1412 to +0.1423). Whether a trend exists in the *feature* — and therefore whether a shared drift exists — is `UNCOMPUTABLE`.

**Lag-1 autocorrelation — and a correction to the v1.0 claim**

| Statistic | Value | n |
|---|---|---|
| Binary y, **row order** (gaps ignored) | **−0.0280** | 55 |
| Ordinal, **row order** (gaps ignored) | +0.1412 | 55 |
| Binary y, **true calendar-adjacent pairs** | **+0.0903** | 38 |
| Ordinal, **true calendar-adjacent pairs** | **+0.3751** | 38 |
| Ordinal, linearly detrended, row order | +0.1423 | 55 |

The v1.0 figure of ≈ −0.03 **reproduces exactly (−0.0280) — but only under two choices that together manufacture it**: dichotomising the target first, and treating consecutive *rows* as consecutive *days*. The second is invalid on this sample: only 42 of 60 inter-entry gaps are 1 day, and the run structure includes gaps of 15, 17, 19 and 32 days (C3.3). Correcting just that, on the pairs that genuinely are one calendar day apart (n=38), the ordinal target's lag-1 autocorrelation is **+0.375** — an order of magnitude larger and opposite in sign to the reported value. Dichotomising suppresses it to +0.090.

The v1.0 claim that the target is serially independent is therefore an artifact of the two transformations applied before measuring it. **On the underlying daily scores the target is materially autocorrelated day to day**, which is what one would expect of a symptom course and which bears directly on every LOO-CV estimate in the published set: LOO on a serially correlated series with 42 adjacent-day pairs leaks neighbouring-day information into each held-out fold.

### C6 — Verdict

- **Kill criterion:** AUC drops toward the base rate after detrending.
- **Verdict: `UNCOMPUTABLE`.**

The detrended re-fit cannot be run. Two computed sub-results stand on their own: (a) the target carries **no linear trend** (r = −0.036, p = 0.795), so if a shared drift is driving the association it must originate on the feature side; (b) **the v1.0 lag-1 ACF of ≈ −0.03 does not survive correction.** It is reproducible only on the dichotomised target with calendar gaps ignored; on true adjacent-day pairs the ordinal figure is **+0.375 (n=38)**. The v1.0 independence claim should be withdrawn regardless of the outcome of any other check.

---

## C7 — Is this a model or a single correlation?

**Question.** Does anything beyond `hrv_rmssd_night_t0` contribute?

### C7.1 — Univariate model under blocked+embargo

`UNCOMPUTABLE: no feature data (§0); no blocked+embargo pipeline exists (§0).` AUC, PR-AUC and permutation p for a univariate fit cannot be produced. The spec's v1.0 comparator of 0.795 does not appear anywhere in the repository; the published headline figures are 0.8288 (`polar_live.json`), 0.829 (`README.md:23`, `pipeline_state.json`, `docs/ANS_PREDICTOR_PIPELINE.md:108`) and 0.837 (`public/ans-predictor.html:568`).

### C7.2 — What the published artifacts establish anyway

Three lines of evidence from committed artifacts, all pointing the same way.

**(a) A derivable upper bound on the univariate AUC.** Forward selection adds a feature only if it improves LOO AUC by at least `MIN_AUC_IMPROVEMENT = 0.01` (`l5_retrain.py:61,258`), and step 1 is by construction the best single feature. The headline model's final AUC is 0.8288 with two features. Therefore:

> **AUC(`hrv_rmssd_night_t0` alone) ≤ 0.8288 − 0.01 = 0.8188**, and selection stopped at two features, meaning no third feature anywhere in the 40-column candidate space added another 0.01.

The entire published multivariate apparatus buys **at most 0.010–0.019 AUC** over one variable — against the spec's stated SE of ≈ ±0.06 at n=55, i.e. **between one sixth and one third of a standard error.**

**(b) The second feature is interchangeable.** On an identical sample (n=55, 32 positive, 23 negative), two published runs selected different second features and landed 0.008 apart:

| Run | Features | AUC | Weights |
|---|---|---|---|
| A — `public/ans-predictor.html:568` (2026-05-15) | `hrv_rmssd_night_t0`, **`sleep_wake_min_t2`** | 0.837 | −1.085, −0.398 |
| B — `public/data/polar_live.json` | `hrv_rmssd_night_t0`, **`recovery_sublevel_t3`** | 0.8288 | −1.216, +0.463 |

"Minutes awake two nights ago" and "Polar recovery sub-level three nights ago" are different constructs on different lags, and the model is indifferent between them. Whatever occupies slot 2 is fitting noise.

**(c) Instability is systematic, not confined to the headline.** Across the same two runs on the same 61-row diary:

| Target | Run A features (LR AUC) | Run B features (AUC) | ΔAUC |
|---|---|---|---|
| severity | `hrv_rmssd_night_t0`, `ans_status_t2`, `hrv_sdnn_t2`, `hrv_dfa_alpha1_t2`, `recovery_sublevel_t0` (0.9209) | `hrv_rmssd_night_t0`, `ans_status_t2` (0.8374) | **−0.084** |
| pem | `hrv_rmssd_night_t0`, `hrv_pnn50_t1`, `hrv_rmssd_night_t1` (0.7951) | `hrv_rmssd_night_t0`, `hrv_rmssd_calc_t1` (0.7988) | +0.004 |
| fatiga | `hrv_rmssd_night_t0`, `sleep_wake_min_t2`, `hrv_hf_power_t0` (0.83) | `hrv_rmssd_night_t0`, `hrv_rmssd_night_t1` (0.7703) | **−0.060** |
| niebla_mental | `ans_status_t0`, `hrv_rmssd_night_t1`, `recovery_sublevel_t3` (0.9879) | identical (0.9879) | 0.000 |
| disfuncion_autonomica | `hrv_rmssd_night_t0`, `sleep_wake_min_t2` (0.837) | `hrv_rmssd_night_t0`, `recovery_sublevel_t3` (0.8288) | −0.008 |

Feature sets past position 1 are unstable in 4 of 5 targets; two AUCs move by ≈1 SE or more. **The one invariant across every target and every run is `hrv_rmssd_night_t0`** — first-selected in 4 of 5 targets in both runs, always with a large negative coefficient (−0.92 to −1.34), while every companion term carries a coefficient one third its size or smaller and flips sign between runs.

### C7 — Verdict

- **Interpretation, not a kill criterion.**
- **Verdict: `UNCOMPUTABLE` on the requested univariate re-fit; the interpretive question is nonetheless answered.**

The requested univariate model cannot be fitted here. It does not need to be: the stopping rule bounds the multivariate gain at **≤ 0.019 AUC**, the second feature is interchangeable between two unrelated variables at a cost of 0.008, and the only stable structure across five targets and two independent runs is a single negative association between Polar's nightly RMSSD and a self-reported symptom score.

**The honest object is a univariate association.** `hrv_rmssd_night_t0` versus a self-reported symptom threshold, N-of-1, single subject, 55 observations across 213 calendar days at 26% coverage — with the machine-learning framing ("multi-target predictor", "forward feature selection", five targets, three model families) dropped. That framing describes procedure, not findings; on this evidence it adds no discriminative power over one correlation, and it obscures the two threats (C1 alignment, C2 circularity) that determine whether the correlation means anything.

---

## Summary of verdicts

| Check | Kill criterion | Verdict |
|---|---|---|
| **C1** Temporal alignment | median night-end→diary gap negative | **`UNCOMPUTABLE` on the stated criterion (no timestamps anywhere); `FAIL` on the question** — three conflicting night-date conventions; the `hrv_rmssd_calc` family used by 2 published models is whole-calendar-day, contradicting `docs/…:113` |
| **C2** Rater–instrument circularity | association with displayed metric, absent with blinded | **`UNCOMPUTABLE` on the statistic; `FAIL` on the design** — the logging tool prints an HRV-derived forecast for day D+2 to the person who will score day D+2 |
| **C3** Missingness mechanism | presence associated with HRV level | **`UNCOMPUTABLE` on the HRV test; `FAIL` on randomness** — 178/239 HRV nights dropped silently; 46% of the sample is one month; the 6 rows separating n=61 from n=55 are the highest-PEM days |
| **C4** Signal quality confounder | coefficient collapses with quality included | **`UNCOMPUTABLE`** — per-night ectopic/coverage figures are computed then discarded (`parse_ppi_samples.py:92-105`); untestable without an L1/L2 change |
| **C5** Threshold sensitivity | significance only at 5, or absent ordinally | **`UNCOMPUTABLE` on the sweep; `FAIL` on the cut** — 18.2% of observations sit exactly on the threshold; only 2 of 4 requested cuts are runnable at n=55 |
| **C6** Shared temporal drift | AUC → base rate after detrending | **`UNCOMPUTABLE`** — but the target has no linear trend (p = 0.795), and the v1.0 lag-1 ACF claim does not survive correction |
| **C7** Model vs single correlation | interpretive | **`UNCOMPUTABLE` on the re-fit; the interpretation is settled** — multivariate gain bounded at ≤ 0.019 AUC; slot 2 is interchangeable |

---

## Which v1.0 claims survive C1–C7

**Do not survive:**

1. **"Lag-1 ACF of the target ≈ −0.03, therefore observations are serially independent."** Refuted by direct computation. The figure reproduces (−0.0280) only on the dichotomised target with calendar gaps treated as adjacency. On genuinely calendar-adjacent pairs the ordinal target's lag-1 ACF is **+0.3751 (n=38)**; the binary version is **+0.0903**. Withdraw. Every LOO-CV estimate in the published set inherits this: 42 adjacent-day pairs leak into their own held-out folds.

2. **"The 55–61 diary days support an unconditional AUC."** Refuted. 178 of 239 HRV nights carry no diary and are dropped by an inner join that records nothing about them; 28 of 61 entries are one contiguous month; ten absence runs exceed five days; the 6 rows excluded from the headline n=55 have mean PEM 7.83 versus 5.49 for those retained. Every published AUC is conditional on an unmodelled selection process, and no artifact says so.

3. **"The deployment model predicts 48h ahead."** Refuted on the code. Under the calendar-day bucketing actually used (`parse_ppi_samples.py:80`), `hrv_rmssd_calc_t2` closes ~24h before the target day; under the alternative convention in `extract_rr.py:26-27` it closes *after* the CLI issues the forecast. The horizon is not established under either reading. Separately, `predict_48h` cannot currently fire at all: it requires `hrv_rmssd_calc_t2`, a key `scripts/merge_hrv.py:14-24` explicitly excludes from `polar_live.json`.

4. **"The finding is a multi-target machine-learning predictor."** Refuted by the artifacts. The stopping rule bounds the multivariate contribution at ≤0.019 AUC over one variable (≈⅓ SE at n=55); the headline's second feature swapped between two unrelated variables across published runs for ΔAUC = 0.008; feature sets past position 1 are unstable in 4 of 5 targets. What exists is one correlation.

5. **"`hrv_rmssd_calc` serves as an internal consistency check on the GDPR export"** (`compute_hrv_features.py:10-11`). Refuted. It disagrees with the quantity it checks by **+73%** (66.5–67.9 ms vs 38.5–40.0 ms) on the same nights, with two mechanisms in the code sufficient to explain it (whole-day window; no NN/ectopic filter on that path). It is not a consistency check; it is an independent and less clean measurement, and the discrepancy is reported nowhere.

**Survive, unchanged:**

6. **Sample arithmetic.** n=61 diary entries, n=55 for `disfuncion_autonomica`, 32 positive / 23 negative at threshold ≥5 — all recomputed from `data/diary_live.csv` and matching the published values exactly.

7. **The published limitations already on record** in `docs/ANS_PREDICTOR_PIPELINE.md` §6 — single subject, no generalisability, LOO optimism at n≈55, PPG inferior to ECG, median imputation bias, no external validation, no regulatory status. Nothing in this audit contradicts any of them. They are necessary and, as this audit shows, not sufficient.

**Neither confirmed nor refuted — the load-bearing unknowns:**

8. **Whether `hrv_rmssd_night_t0` precedes or follows the diary day (C1).** Undetermined. The direction is asserted at `docs/ANS_PREDICTOR_PIPELINE.md:113` and implemented nowhere that can be checked: `parse_nightly_recovery.py:112` passes Polar's `night` field through without inspection, and no artifact retains a sleep timestamp. **This is a one-column check against the raw export that has never been run, and every headline AUC is conditional on its outcome.**

9. **Whether the association is physiology or expectancy (C2).** Undetermined and, as instrumented, undeterminable. Exposure is not hypothetical: `scripts/log_diary.py:294` prints an HRV-derived probability of `disfuncion_autonomica` for day D+2 to the person who will score `disfuncion_autonomica` on day D+2, and `src/components/LivePulse.jsx:42-45` renders the nightly RMSSD on the subject's own site. **No statistical test resolves this. Only a blinded diary period does.**

10. **Whether recording quality drives the association (C4).** Untested and untestable from current outputs — the per-night quality fields are computed and discarded. Meanwhile `sleep_wake_min_t2`, simultaneously a sleep and a PPG-quality metric, was the headline model's second feature in one published run.

**Bottom line.** Of the seven checks, none returns a clean `PASS`. Four (C4, C5-sweep, C6, C7-refit) could not be computed because the repository does not contain the data or the pipeline they require. Three (C1, C2, C3) return `FAIL` on the underlying validity question on the strength of code and committed artifacts alone, without needing the missing data. The published claim — "Nocturnal ANS predicts PEM 48h ahead · model v3" (`scripts/retrain_predictor.py:671`), AUC 0.829 (`README.md:23`) — is not supported at the level it is stated. What is supported is a single negative association, of unverified temporal direction, between a device figure the subject sees daily and a symptom score the subject reports, on a non-random 26% sample of one person's calendar.
