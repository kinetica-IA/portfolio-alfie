"""Retrospective N-of-1 benchmark. Local CSV inputs; aggregate publication only.

No network access, variable search or public deployment occurs in this script.
The final fitted models and input fingerprints belong in a private output folder.
"""
from __future__ import annotations

import argparse
from datetime import date
import hashlib
import importlib.metadata
import json
from pathlib import Path
import warnings

import numpy as np
import pandas as pd
from sklearn.exceptions import ConvergenceWarning
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# Fixed before examining any new model results. PPI-derived metrics are excluded:
# their historical parser does not establish a nocturnal measurement window.
FEATURES = ["hrv_rmssd_night", "ans_status", "recovery_sublevel",
            "sleep_wake_min", "sleep_interruptions"]
LAGS = [0, 1]
TARGETS = {
    "severity": ("severidad_global", 6),
    "fatigue": ("fatiga", 6),
    "pem": ("pem", 5),
    "brain_fog": ("niebla_mental", 5),
    "autonomic": ("disfuncion_autonomica", 5),
}
MIN_TRAIN = 30
MIN_CLASS = 3


def configuration() -> dict:
    return {"features": FEATURES, "calendar_lags": LAGS,
            "targets": {k: {"column": v[0], "threshold": v[1]} for k, v in TARGETS.items()},
            "min_train_observations": MIN_TRAIN, "min_training_class_count": MIN_CLASS,
            "evaluation": "expanding history, one later observation at a time",
            "imputation": "training-fold median; empty training columns retained as zero",
            "scaling": "training-fold StandardScaler",
            "estimator": "LogisticRegression", "C": 0.5,
            "class_weight": "balanced", "max_iter": 3000, "random_state": 42,
            "feature_selection": "none", "hyperparameter_search": "none",
            "reference": "prevalence of positive labels in the training history"}


def read_calendar_csv(path: Path) -> pd.DataFrame:
    frame = pd.read_csv(path)
    if "date" not in frame or frame.empty:
        raise ValueError("Nonempty calendar CSV with date column required")
    timestamps = pd.to_datetime(frame["date"], errors="raise")
    if timestamps.isna().any() or timestamps.duplicated().any():
        raise ValueError("Missing or duplicate calendar date")
    if not timestamps.eq(timestamps.dt.normalize()).all():
        raise ValueError("Expected calendar dates, not time-of-day entries")
    return frame.assign(date=timestamps).set_index("date").sort_index()


def pair_inputs(daily: pd.DataFrame, diary: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    if not daily.index.is_unique or not diary.index.is_unique:
        raise ValueError("Duplicate source dates")
    missing = [f for f in FEATURES if f not in daily]
    if missing:
        raise ValueError("Missing configured feature columns: " + ", ".join(missing))
    common = diary.index.intersection(daily.index).sort_values()
    if common.empty:
        raise ValueError("No matching dates")
    matrix = pd.DataFrame(index=common)
    for feature in FEATURES:
        values = pd.to_numeric(daily[feature], errors="raise")
        for lag in LAGS:
            # Reindex by calendar day, never by previous diary row.
            matrix[f"{feature}_t{lag}"] = values.reindex(
                common - pd.Timedelta(days=lag)).to_numpy()
    if np.isinf(matrix.to_numpy(dtype=float)).any():
        raise ValueError("Infinite feature value")
    return matrix, diary.reindex(common)


def estimator() -> Pipeline:
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median", keep_empty_features=True)),
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(C=0.5, class_weight="balanced",
                                          max_iter=3000, random_state=42)),
    ])


def fit_model(X: pd.DataFrame, y: np.ndarray) -> Pipeline:
    model = estimator()
    # A failed fit is recorded as a failed fold, never a successful model.
    with warnings.catch_warnings():
        warnings.simplefilter("error", ConvergenceWarning)
        model.fit(X, y)
    return model


def train_target(X: pd.DataFrame, scores: pd.Series, threshold: float) -> tuple[dict, dict]:
    scores = pd.to_numeric(scores, errors="raise")
    if ((scores.dropna() < 0) | (scores.dropna() > 10)).any():
        raise ValueError("Symptom score outside declared 0–10 scale")
    valid = scores.notna()
    frame = X.loc[valid].sort_index()
    y = (scores.reindex(frame.index) >= threshold).to_numpy(dtype=int)
    observed, predictions, references, trace = [], [], [], []
    failed = []
    for i in range(MIN_TRAIN, len(y)):
        past_X, past_y = frame.iloc[:i], y[:i]
        assert past_X.index.max() < frame.index[i]
        counts = np.bincount(past_y, minlength=2)
        if counts.min() < MIN_CLASS:
            failed.append({"test_position": i, "reason": "insufficient_training_class_count"})
            continue
        try:
            model = fit_model(past_X, past_y)
            probability = float(model.predict_proba(frame.iloc[[i]])[0, 1])
        except (ValueError, FloatingPointError, ConvergenceWarning) as exc:
            failed.append({"test_position": i, "reason": type(exc).__name__})
            continue
        observed.append(int(y[i])); predictions.append(probability)
        references.append(float(past_y.mean()))
        trace.append({"train_rows": i, "test_position": i,
                      "train_end": str(past_X.index.max().date()),
                      "test_date": str(frame.index[i].date())})
    yt = np.array(observed, dtype=int)
    probability = np.array(predictions, dtype=float)
    both_classes = len(np.unique(yt)) == 2
    metrics = {
        "paired_observations": len(y), "evaluated_observations": len(yt),
        "evaluated_positive": int(yt.sum()), "evaluated_negative": int(len(yt) - yt.sum()),
        "skipped_folds": len(failed),
        "auroc": float(roc_auc_score(yt, probability)) if both_classes else None,
        "average_precision": float(average_precision_score(yt, probability)) if both_classes else None,
        "brier": float(brier_score_loss(yt, probability)) if len(yt) else None,
        "reference_brier": float(brier_score_loss(yt, references)) if len(yt) else None,
        "final_fit": False,
    }
    final = {}
    if len(y) >= MIN_TRAIN and np.bincount(y, minlength=2).min() >= MIN_CLASS:
        full = fit_model(frame, y)
        final = {
            "features": list(frame.columns),
            "imputer_median": full["imputer"].statistics_.tolist(),
            "scaler_mean": full["scaler"].mean_.tolist(),
            "scaler_scale": full["scaler"].scale_.tolist(),
            "coefficients": full["classifier"].coef_[0].tolist(),
            "intercept": float(full["classifier"].intercept_[0]),
            "threshold": threshold,
        }
        metrics["final_fit"] = True
    private = {"model": final, "evaluation_trace": trace, "failed_folds": failed}
    return metrics, private


def run(daily_path: Path, diary_path: Path, output: Path, analysis_date: str) -> dict:
    date.fromisoformat(analysis_date)
    daily, diary = read_calendar_csv(daily_path), read_calendar_csv(diary_path)
    X, symptoms = pair_inputs(daily, diary)
    results, models = {}, {}
    for name, (column, threshold) in TARGETS.items():
        if column not in symptoms:
            raise ValueError("Missing target column: " + column)
        results[name], models[name] = train_target(X, symptoms[column], threshold)
    report = {
        "schema_version": 1, "analysis_date": analysis_date,
        "study": "retrospective exploratory N-of-1",
        "participants": 1, "paired_observations": len(X),
        "configuration": configuration(), "results": results,
        "limitations": [
            "One participant; no population generalization or causal inference.",
            "Historical sequential evaluation, not prospective clinical validation.",
            "Irregular, sparse diary and unverified historical recording timestamps.",
            "Temporal dependence and multiple exploratory targets; no significance claims.",
            "Historical daily aggregates have not been fully rebuilt from the raw export.",
            "No personal series, daily scores or diagnostic service published.",
        ],
    }
    fingerprints = {"daily_sha256": hashlib.sha256(daily_path.read_bytes()).hexdigest(),
                    "diary_sha256": hashlib.sha256(diary_path.read_bytes()).hexdigest(),
                    "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
    private = {"input_fingerprints": fingerprints, "models": models,
               "versions": {p: importlib.metadata.version(p) for p in
                            ["numpy", "pandas", "scikit-learn", "scipy"]},
               "feature_nonmissing_counts": X.notna().sum().to_dict()}
    output.mkdir(parents=True, exist_ok=True)
    (output / "public-summary.json").write_text(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n")
    (output / "private-models-and-provenance.json").write_text(json.dumps(private, ensure_ascii=False, indent=2, allow_nan=False) + "\n")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--daily", required=True, type=Path)
    parser.add_argument("--diary", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--analysis-date", required=True)
    args = parser.parse_args()
    summary = run(args.daily, args.diary, args.output, args.analysis_date)
    print(json.dumps({"paired": summary["paired_observations"], "results": summary["results"]}, ensure_ascii=False))
