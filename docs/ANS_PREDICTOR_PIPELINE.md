---
title: ANS Predictor — Pipeline Documentation
version: 1.0
date: 2026-05-10
owner: Alfonso Navarro / Kinetica AI
status: production
---

# ANS Predictor — Pipeline Documentation

## 1. What this system does

This system collects continuous cardiac and sleep data from a wrist-worn Polar device, processes it through a seven-layer data pipeline, and trains a statistical model that predicts whether an autonomic symptom event will occur within the next 48 hours. The model's output — including daily biometric time series, model performance metrics, and feature selection results — is published automatically to a public portfolio site. The entire process runs on a single subject over an 8-month observation window.

---

## 2. Clinical context

**Condition.** The subject has a documented condition characterised by post-exertional malaise (PEM), fatigue, brain fog, and autonomic dysregulation — a symptom cluster consistent with Myalgic Encephalomyelitis / Chronic Fatigue Syndrome (ME/CFS). The diary records six symptom dimensions on a numeric scale: global severity, fatigue, PEM, cognitive fog, autonomic dysfunction, and pain.

**The question the system addresses.** Can autonomic nervous system (ANS) signals measured by a consumer wearable predict symptom severity 48 hours in advance? The ANS governs involuntary physiological regulation — heart rate, blood pressure, digestion — and its dysfunction is considered a core mechanism in ME/CFS. Disruption in ANS balance frequently becomes measurable in wearable data before subjective symptoms peak.

**Why heart rate variability.** Heart rate variability (HRV) — the millisecond-to-millisecond variation in the time between heartbeats — is a non-invasive proxy for ANS state. Higher HRV generally reflects parasympathetic (rest-and-digest) dominance; suppressed HRV reflects sympathetic activation or autonomic exhaustion. Time-domain metrics such as RMSSD (root mean square of successive RR differences) and frequency-domain metrics such as the LF/HF ratio quantify this balance from overnight recordings.

**Why 48 hours.** The literature and the code comment in `pipeline/l4_diary_join.py` both note that ANS dysregulation precedes ME/CFS flares by one to three days. The deployment model (`pipeline/l5_retrain.py`) is therefore restricted to features from 48 to 72 hours before the symptom date (lags t2 and t3 only), representing a clinically realistic advance-warning scenario.

---

## 3. Data sources

**Device.** Two Polar devices are used. The Polar Grit X2 is the primary wrist-worn sports watch, worn continuously for sleep, activity, and 24/7 optical HR recording. The Polar H10 is an ECG chest strap used exclusively for orthostatic tests — its electrode-based signal provides beat-to-beat RR intervals at higher precision than optical PPG, making it the appropriate sensor for the short supine-to-standing autonomic reactivity protocol. Data was obtained via Polar's GDPR personal data export, producing 1,025 JSON files totalling approximately 1.1 GB.

**Observation window.** 2025-08-25 to 2026-04-27 — 243 calendar days.

**Sensor streams extracted.**

| Source | Records | What it measures |
|---|---|---|
| Nightly recovery (HRV) | 216 nights | Overnight RMSSD, mean RR interval, ANS status score, recovery indicator (1–5 scale), recovery sub-level (1–100 scale), respiratory interval |
| Sleep result + sleep score | 226 nights | Sleep duration, efficiency, REM and deep sleep percentages, wake minutes, interruption count; six sleep quality sub-scores |
| PPI samples (pulse intervals) | 16,632,396 samples across 239 nights | Raw pulse-to-pulse intervals (optical approximation of RR intervals), at millisecond resolution; 396 samples rejected outside the physiological range 300–2,000 ms |
| Daily activity | 242 days | Calorie expenditure, MET-minutes, time in sedentary / light / moderate / vigorous / non-wear activity levels (ISO 8601 durations) |
| 24/7 optical heart rate | 239 days, 633,125 samples | Background resting heart rate: minimum, maximum, mean, 25th / 50th / 75th percentiles per day |
| Orthostatic tests | 8 occasions | HRV and RR interval in supine and standing positions; autonomic reactivity deltas on standing |
| Fitness tests (OwnIndex) | 11 occasions | VO2max estimate and fitness class |
| Training sessions | 142 sessions across 107 days | Duration, caloric expenditure, average and maximum heart rate, time in each of the five HR training zones |

**Symptom diary.** 61 manually logged entries (one per day) recording the six symptom dimensions listed above. This is the outcome variable against which all biometric features are evaluated.

---

## 4. Pipeline architecture

The pipeline is organised into seven discrete layers (L0–L6). Each layer has defined inputs and outputs; every drop or transformation is logged with a reason.

**L0 — Raw ingest.** The starting point is the Polar GDPR export: 1,025 JSON files across 11 distinct data source types, covering the full observation window. This directory lives outside the code repository because it contains raw personal cardiac data that is never committed to version control. It is read-only at L0; no transformation occurs here.

**L1 — Structured extract.** Eight parsers (`pipeline/l1_extract/`) each consume one source type and produce a typed, validated table. Input validation is performed by Pydantic v2 schemas: if Polar changes its JSON format, the parser raises a clear error rather than silently producing incorrect data. Outputs are Apache Parquet files (a column-oriented binary format suited to tabular time series). The PPI parser handles 16.6 million raw pulse-length samples, filtering out 396 values outside the physiological range 300–2,000 ms. The orthostatic parser computes autonomic reactivity at parse time (delta RMSSD = standing minus supine; delta RR = supine minus standing). Every parser emits a structured log line: input count, valid count, and the reason for any dropped records.

**L2 — Derived features.** Three feature computers (`pipeline/l2_features/`) operate on L1 outputs to produce metrics that require calculation across multiple raw values. The HRV computer reads the nightly arrays of raw pulse intervals and runs three neurokit2 algorithms: time-domain analysis over the full overnight array (SDNN, RMSSD, pNN50), and frequency-domain and nonlinear analysis over the first 400 intervals — the standard stationary window required for reliable spectral estimation (LF power, HF power, LF/HF ratio, SD1, SD2, DFA-α1). Nights with fewer than 100 valid intervals are excluded. The zone-distribution computer aggregates training session heart rate zone data into per-day totals and percentages. The session-strata computer classifies each training day into one of four polarisation categories: pure aerobic base, lactate threshold grey zone, polarised high-low, or mixed.

**L3 — Unified daily frame.** The ten L1 and L2 Parquet files are outer-merged on calendar date (`pipeline/l3_unified.py`). The result is one row per calendar day, 243 rows by 70 columns. A NaN value in any column means that source had no data for that day — this is expected: orthostatic tests appear on only 8 days; fitness tests on 11; training zone data on 107. Non-training days are labelled with stratum "rest". The unified frame is written as both Parquet (machine-readable) and CSV (human-inspectable), and the CSV is the canonical input for all downstream steps.

**L4 — Diary join.** The unified daily frame is inner-joined with the symptom diary on date (`pipeline/l4_diary_join.py`). Only the 61 days that have a diary entry are retained. For each such day D, the pipeline adds lagged copies of eight HRV and ANS columns — data from day D (lag t0), D−1 (lag t1), D−2 (lag t2), and D−3 (lag t3). These 32 lagged columns (8 features × 4 lags) represent the temporal history available before a symptom event. The output is 61 rows by 110 columns.

**L5 — Model training and publish.** The model step (`pipeline/l5_retrain.py`) trains a separate logistic regression for each of the five symptom targets. Logistic regression estimates the probability that a target score exceeds a clinical threshold (between 5 and 6 on the symptom scale, depending on the dimension). Feature selection is greedy and forward: features are added one at a time, keeping each addition only if it improves the area under the ROC curve (AUC) by at least 0.01, up to a maximum of five features. Performance is estimated by leave-one-out cross-validation (LOO-CV): for each diary entry, the model is trained on all other entries and then asked to predict that one — this prevents the model from seeing its own test data during training. A 95% confidence interval on the AUC is computed by bootstrapping the LOO predictions 1,000 times. A separate deployment model is fit for the autonomic dysfunction target using only lag-2 and lag-3 features, representing the realistic 48h-ahead scenario. The publish step (`pipeline/l5_publish.py`) then reads the 243-day unified frame and the predictor results, builds the full version-3.1 JSON payload, validates it, and atomically replaces `public/data/polar_live.json`.

**L6 — Pipeline state.** A state publisher (`pipeline/l6_publish_state.py`) reads all L0–L6 outputs, collects per-layer metrics (row counts, date ranges, model AUC, file sizes), and writes `public/data/pipeline_state.json`. This file is consumed by the pipeline status dashboard at `/pipeline.html` on the portfolio site.

---

## 5. Key output metrics

The headline metric is AUC for the **autonomic dysfunction** target. AUC (area under the receiver operating characteristic curve) ranges from 0.5 (no better than chance) to 1.0 (perfect discrimination). An AUC of 0.829 means that in 82.9% of random pairs where one day had a symptom event and one did not, the model assigned a higher risk score to the day with the event.

This target was selected as the headline — rather than the highest AUC across all targets — because its class distribution is balanced and its feature selection is physiologically coherent. The code explicitly documents that brain fog (niebla_mental) has an approximately 9:1 class split (positive events outnumber negatives), which inflates its AUC to 0.988 in a way that is statistically unreliable on a small sample.

**Per-target results (LOO-CV, verified run 2026-05-10).**

| Target | n | AUC (LOO-CV) | 95% CI | Features selected |
|---|---|---|---|---|
| Global severity | 61 | 0.837 | [0.727, 0.942] | hrv_rmssd_night_t0, ans_status_t2 |
| Post-exertional malaise | 61 | 0.799 | [0.685, 0.904] | hrv_rmssd_night_t0, hrv_rmssd_calc_t1 |
| Fatigue | 61 | 0.770 | [0.641, 0.894] | hrv_rmssd_night_t0, hrv_rmssd_night_t1 |
| Brain fog | 61 | 0.988 | [0.950, 1.000] | ans_status_t0, hrv_rmssd_night_t1, recovery_sublevel_t3 |
| **Autonomic dysfunction** (headline) | **55** | **0.829** | **[0.715, 0.937]** | **hrv_rmssd_night_t0, recovery_sublevel_t3** |
| Autonomic dysfunction — 48h deployment model | 55 | 0.688 | [0.542, 0.830] | hrv_rmssd_calc_t2, hrv_rmssd_night_t2 |

**What the selected features mean.**

- `hrv_rmssd_night_t0` — Polar's own RMSSD measurement from the previous night, taken at the time of the diary entry (same-day lag). RMSSD is the standard clinical HRV metric; lower values reflect autonomic stress.
- `recovery_sublevel_t3` — Polar's recovery sub-level score (1–100) from three nights prior. This represents ANS state 72 hours before the symptom event — the key predictor in the deployment scenario.
- `hrv_rmssd_calc_t2` — RMSSD recalculated from raw pulse intervals (L2 computation) from two nights prior.
- `ans_status_t0` — Polar's continuous ANS deviation score on the day of the symptom entry.

The consistent appearance of same-night RMSSD (`hrv_rmssd_night_t0`) across four of five targets is consistent with the hypothesis that overnight autonomic state is the most proximate signal of the condition's daily fluctuation.

---

## 6. Limitations

**Sample size.** All data comes from a single subject. No generalisability to other individuals or populations can be claimed from this analysis.

**Training set size.** The model is trained on between 55 and 61 symptom-diary entries, depending on the target. LOO-CV on samples this small is known to be optimistic relative to true out-of-sample performance; the 95% confidence intervals reflect bootstrap uncertainty over the same LOO predictions, not an independent holdout.

**Deployment performance.** The 48h-ahead deployment model — which is the only version with practical clinical utility — has an AUC of 0.688, substantially lower than the same-day model (0.829). The advance prediction is feasible but substantially noisier.

**Optical sensor accuracy.** Pulse-to-pulse intervals from optical PPG sensors are less precise than ECG-derived RR intervals. Motion artefacts, skin tone, and perfusion differences introduce noise that a physiological filter (300–2,000 ms) can only partially address.

**Sparse data sources.** Orthostatic tests were performed on 8 occasions and fitness tests on 11. These appear as predominantly missing values in the unified frame and were not selected by forward feature selection, limiting what can be concluded about orthostatic autonomic reactivity from this dataset.

**Class imbalance.** The brain fog target has an approximate 9:1 positive-to-negative class ratio, making its AUC of 0.988 unreliable. This target is excluded from the deployment model and is not used as the headline metric.

**Missing feature imputation.** Where a feature value is absent for a given diary date (e.g. no nightly recovery data on that night), the training matrix uses column-median imputation. This introduces a small systematic bias in nights with missing data.

**No external validation.** The model has not been tested on data from a separate observation period or a different subject. All reported metrics are internal LOO estimates.

**No regulatory status.** This system is a research and portfolio demonstration. It has no MDR, FDA, or equivalent regulatory clearance and makes no claims of diagnostic utility.

---

## 7. Tech stack

| Component | Role in this system |
|---|---|
| **Python 3.11+** | Runtime for the entire pipeline (L1–L6) |
| **Pydantic v2** | Input and output schema validation at every L1 parser; catches Polar format changes at ingest |
| **pandas** | Tabular data manipulation across all pipeline layers; merge, groupby, time-series indexing |
| **NumPy** | Array arithmetic for RR interval filtering, HRV statistics, percentile computation |
| **neurokit2** | HRV computation: time-domain (`hrv_time`), frequency-domain (`hrv_frequency`), nonlinear (`hrv_nonlinear`) |
| **scikit-learn** | Logistic regression, leave-one-out cross-validation, standard scaling, ROC AUC |
| **PyArrow / Parquet** | Columnar binary storage for all intermediate pipeline outputs (L1–L4) |
| **httpx** | HTTP client for Polar AccessLink v3 API (nightly fetch workflow) |
| **uv** | Python dependency and virtual environment management |
| **GitHub Actions** | Workflow automation: nightly API fetch (cron 06:00 UTC), retrain on diary change (push trigger), site deploy |
| **Polar AccessLink v3 API** | Live data endpoint (`/v3/users/nightly-recharge`, `/v3/users/sleep`, `/v3/users/activities`) |
| **Astro / React / Vite** | Portfolio frontend that reads `polar_live.json` at runtime and renders the biometric time series |
