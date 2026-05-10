# analysis/sleep_quality

Single-target logistic regression predicting high-fatigue days from nocturnal HRV features. Part of the ANS predictor pipeline.

## Purpose and scope

Predicts whether a diary day will be a high-fatigue day (fatiga ≥ 6/10, self-rated 0–10) using nocturnal HRV features recorded in the nights before. Trained and validated on N=1 longitudinal data. Not intended for generalisation to other individuals.

## Input

| File | Description |
|---|---|
| `data/processed/L4/diary_features.csv` | L4 output: one row per diary entry, paired with lagged HRV features |

Key columns used:

| Column | Description |
|---|---|
| `fatiga` | Target — self-rated fatigue 0–10; binarized at ≥ 6 |
| `hrv_rmssd_calc_t{0–3}` | Nocturnal RMSSD (calculated), lags 0–3 nights prior |
| `hrv_rmssd_night_t{0–3}` | Nocturnal RMSSD (Polar native), lags 0–3 nights prior |
| `hrv_lf_hf_ratio_t{0–3}` | LF/HF ratio, lags 0–3 |
| `hrv_sd1_t{0–3}` | Poincaré SD1, lags 0–3 |
| `hrv_sd2_t{0–3}` | Poincaré SD2, lags 0–3 |

20 candidate columns total (5 features × 4 lags).

## Pipeline

```
l5_retrain.py   reads diary_features.csv
                → forward-selects features
                → LOO-CV AUC + bootstrap CI
                → writes data/processed/L5/sleep_quality_results.json

l5_publish.py   reads sleep_quality_results.json + public/data/polar_live.json
                → upserts "sleep_quality" key (atomic swap)
                → writes public/data/polar_live.json

run.py          SleepQualityAnalysis(BaseAnalysis)
                load() → verify diary_features.csv has fatiga column
                run()  → calls l5_retrain.retrain()
                export() → calls l5_publish.publish()
```

## Model

| Parameter | Value |
|---|---|
| Algorithm | `sklearn.linear_model.LogisticRegression` |
| Regularisation | C=0.5 (L2) |
| Class weighting | `class_weight="balanced"` |
| Max iterations | 1000 |
| Random seed | 42 |
| Scaler | `StandardScaler`, re-fit inside every LOO fold |
| Cross-validation | `LeaveOneOut` (no held-out test set) |
| Feature selection | Greedy forward, max 5 features, stop if AUC gain < 0.01 |
| Bootstrap CI | 1000 resamples, percentile method, seed=42 |
| Binarisation threshold | fatiga ≥ 6.0 → positive class |

## Result

Trained on 61 diary entries paired from 243 nights of nocturnal HRV.

| Metric | Value |
|---|---|
| Selected features | `hrv_rmssd_night_t0`, `hrv_rmssd_night_t1` |
| AUC LOO-CV | 0.7703 |
| CI₉₅ (bootstrap) | [0.6405, 0.8939] |
| Sensitivity | 0.65 (37 positive days) |
| Specificity | 0.71 (24 negative days) |
| Intercept | 0.104775 |

Coefficients (negative = higher RMSSD associated with lower fatigue probability):

| Feature | Coefficient |
|---|---|
| `hrv_rmssd_night_t0` | −0.921591 |
| `hrv_rmssd_night_t1` | −0.364245 |

Forward selection stopped at two features. No feature from lags t2 or t3 improved AUC by ≥ 0.01.

## How to run

```bash
# From repo root
python -m analysis.sleep_quality.run
```

Requires `data/processed/L4/diary_features.csv` (produced by `python -m analysis.pem_predictor.l4_diary_join`) and `public/data/polar_live.json`.

To run steps individually:

```bash
python -m analysis.sleep_quality.l5_retrain   # writes sleep_quality_results.json
python -m analysis.sleep_quality.l5_publish   # upserts polar_live.json
```

## Output

| File | Contents |
|---|---|
| `data/processed/L5/sleep_quality_results.json` | `metadata` + `fatiga` TargetResult (coefficients, scaler params, AUC, CI, sens/spec) |
| `public/data/polar_live.json` | Updated in-place: `sleep_quality` key added/replaced |

## Limitations

- **N-of-1**: trained on a single subject. AUC and feature selection are subject-specific and cannot be interpreted as population-level results.
- **No test set**: LOO-CV provides an unbiased AUC estimate within the training set but does not constitute prospective validation.
- **Small positive class**: 37 positive / 24 negative days. The `class_weight="balanced"` setting compensates, but confidence intervals are wide (CI₉₅ ≈ 0.28 wide).
- **Feature leakage risk**: t0 features include data from the same night as the symptom diary entry. For prospective use, restrict to lag ≥ 1 features.
- **Not a clinical tool**: this analysis is not validated for diagnostic, prognostic, or treatment decisions.
