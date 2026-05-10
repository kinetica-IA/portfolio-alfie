"""L5 predictor retrain: multi-target logistic regression with LOO-CV.

Reads diary_features.csv (L4 output) and trains a forward-selected
logistic regression for each symptom target. Methodology is consistent
with model v3 documented in METHODOLOGY.md:
  - greedy forward feature selection (max 5 features)
  - leave-one-out cross-validation for AUC estimation
  - bootstrap 95% CI on LOO AUC (N=1000)
  - separate deployment model using only lag≥2 features (48h-ahead)

Key change from legacy retrain_predictor.py: features are read from the
clean L3/L4 pipeline output instead of polar_live.json. This removes the
seed-data contamination path and makes features reproducible.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, roc_auc_score
from sklearn.model_selection import LeaveOneOut
from sklearn.preprocessing import StandardScaler

from pipeline._logging import log_pipeline
from pipeline._schemas import PipelineModel
from pipeline.config import DATA_PROCESSED_DIR

# ── Configuration ──────────────────────────────────────────────────────────────

CANDIDATE_FEATURES: list[tuple[str, list[int]]] = [
    ("ans_status",          [0, 1, 2, 3]),
    ("hrv_rmssd_night",     [0, 1, 2, 3]),
    ("recovery_sublevel",   [0, 1, 2, 3]),
    ("sleep_wake_min",      [0, 1, 2]),
    ("sleep_interruptions", [0, 1, 2]),
    ("hrv_sdnn",            [0, 1, 2]),
    ("hrv_pnn50",           [0, 1, 2]),
    ("hrv_lf_hf_ratio",     [0, 1, 2]),
    ("hrv_hf_power",        [0, 1, 2]),
    ("hrv_sd1",             [0, 1, 2]),
    ("hrv_sd2",             [0, 1, 2]),
    ("hrv_dfa_alpha1",      [0, 1, 2]),
    ("hrv_rmssd_calc",      [0, 1, 2]),
]

TARGETS: list[dict] = [
    {"name": "severity",              "diary_key": "severidad_global", "threshold": 6},
    {"name": "pem",                   "diary_key": "pem",              "threshold": 5},
    {"name": "fatiga",                "diary_key": "fatiga",           "threshold": 6},
    {"name": "niebla_mental",         "diary_key": "niebla_mental",    "threshold": 5},
    {"name": "disfuncion_autonomica", "diary_key": "disfuncion_autonomica", "threshold": 5},
]

MAX_FEATURES: int = 5
MIN_AUC_IMPROVEMENT: float = 0.01
N_BOOTSTRAP: int = 1000
DEPLOYMENT_LAGS: list[int] = [2, 3]


# ── Schema ─────────────────────────────────────────────────────────────────────

class TargetResult(PipelineModel):
    """Per-target training result stored in predictor_results.json."""

    target_name: str
    n_training: int
    n_positive: int
    n_negative: int
    selected_features: list[str]
    auc_loo: float
    auc_ci95_lower: float | None
    auc_ci95_upper: float | None
    sensitivity: float
    specificity: float
    coefficients: dict[str, float]
    intercept: float
    scaler_mean: dict[str, float]
    scaler_scale: dict[str, float]


# ── Metadata ───────────────────────────────────────────────────────────────────

def _build_metadata() -> dict:
    """Build a metadata block for predictor_results.json."""
    from datetime import datetime, timezone
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "model_version": "v3.1",
        "validation": "LOO-CV + bootstrap 1000×",
        "feature_selection": "forward greedy per target, max 5 features, stop if AUC gain < 0.01",
        "candidate_features": 13,
        "candidate_lags": [0, 1, 2],
        "n_targets": 5,
    }


# ── Helpers ────────────────────────────────────────────────────────────────────

def _safe_float(v: object) -> float | None:
    """Convert to float, returning None for missing or non-finite values."""
    try:
        f = float(v)  # type: ignore[arg-type]
        return f if math.isfinite(f) else None
    except (TypeError, ValueError):
        return None


def _expand_feature_names(
    candidates: list[tuple[str, list[int]]],
) -> list[tuple[str, str, int]]:
    """Expand (feature, lags) config to (col_name, feature, lag) triples.

    Args:
        candidates: List of (feature_name, lag_list) pairs.

    Returns:
        List of (col_name, feature_name, lag) for all valid combinations.
    """
    result = []
    for feat, lags in candidates:
        for lag in lags:
            result.append((f"{feat}_t{lag}", feat, lag))
    return result


def _build_matrix(
    df: pd.DataFrame,
    target_key: str,
    threshold: float,
    feature_col_names: list[str],
) -> tuple[np.ndarray | None, np.ndarray | None, list[str]]:
    """Build X, y matrices from diary_features DataFrame for one target.

    Drops rows where the target is missing. Imputes missing feature values
    with the column median. Returns None if insufficient data.

    Args:
        df: diary_features DataFrame indexed by date.
        target_key: Column name of the target symptom.
        threshold: Binarisation threshold (y=1 if target >= threshold).
        feature_col_names: List of feature column names to use.

    Returns:
        Tuple of (X array, y array, actual_feature_names) or (None, None, [])
        if fewer than 10 paired rows are available.
    """
    if target_key not in df.columns:
        return None, None, []

    sub = df.dropna(subset=[target_key]).copy()
    if len(sub) < 10:
        return None, None, []

    # Only keep feature columns that actually exist in the DataFrame
    available = [c for c in feature_col_names if c in sub.columns]

    X_raw = sub[available].values.astype(float)
    # Median imputation column-wise
    for j in range(X_raw.shape[1]):
        col = X_raw[:, j]
        nan_mask = np.isnan(col)
        if nan_mask.all():
            X_raw[:, j] = 0.0
        elif nan_mask.any():
            median = float(np.nanmedian(col))
            X_raw[nan_mask, j] = median

    y = (sub[target_key].values >= threshold).astype(int)
    return X_raw, y, available


# ── LOO-CV ─────────────────────────────────────────────────────────────────────

def _loo_cv(
    X: np.ndarray,
    y: np.ndarray,
    feature_indices: list[int],
) -> tuple[float, np.ndarray, np.ndarray, float, float]:
    """Run LOO-CV on selected features with logistic regression.

    Args:
        X: Full feature matrix (n × p).
        y: Binary target vector (n,).
        feature_indices: Column indices to use.

    Returns:
        Tuple of (auc, y_true, y_prob, sensitivity, specificity).
    """
    Xs = X[:, feature_indices]
    loo = LeaveOneOut()
    y_true: list[int] = []
    y_prob: list[float] = []

    clf_factory = lambda: LogisticRegression(
        C=0.5, max_iter=1000, class_weight="balanced", random_state=42
    )

    for tr, te in loo.split(Xs):
        sc = StandardScaler().fit(Xs[tr])
        clf = clf_factory()
        try:
            clf.fit(sc.transform(Xs[tr]), y[tr])
            prob = float(clf.predict_proba(sc.transform(Xs[te]))[0, 1])
        except Exception:
            prob = float(y[tr].mean())
        y_true.append(int(y[te][0]))
        y_prob.append(prob)

    yt = np.array(y_true)
    yp = np.array(y_prob)
    ypred = (yp >= 0.5).astype(int)

    try:
        auc = float(roc_auc_score(yt, yp))
    except Exception:
        auc = 0.5

    tn, fp, fn, tp = confusion_matrix(yt, ypred, labels=[0, 1]).ravel()
    sens = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    return auc, yt, yp, sens, spec


# ── Forward selection ──────────────────────────────────────────────────────────

def _forward_select(X: np.ndarray, y: np.ndarray, n_cols: int) -> list[int]:
    """Greedy forward selection maximising LOO-CV AUC.

    Args:
        X: Feature matrix.
        y: Binary target.
        n_cols: Number of columns in X.

    Returns:
        Ordered list of selected column indices.
    """
    available = list(range(n_cols))
    selected: list[int] = []
    best_auc = 0.0

    for _ in range(MAX_FEATURES):
        best_candidate = None
        best_candidate_auc = best_auc

        for idx in available:
            trial = selected + [idx]
            auc, *_ = _loo_cv(X, y, trial)
            if auc > best_candidate_auc:
                best_candidate_auc = auc
                best_candidate = idx

        if best_candidate is None or (best_candidate_auc - best_auc) < MIN_AUC_IMPROVEMENT:
            break

        selected.append(best_candidate)
        available.remove(best_candidate)
        best_auc = best_candidate_auc

    return selected


# ── Bootstrap CI ───────────────────────────────────────────────────────────────

def _bootstrap_ci(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    n_boot: int = N_BOOTSTRAP,
) -> tuple[float | None, float | None]:
    """Bootstrap 95% CI for AUC.

    Args:
        y_true: True binary labels.
        y_prob: Predicted probabilities.
        n_boot: Number of bootstrap resamples.

    Returns:
        Tuple of (lower_bound, upper_bound) or (None, None) if unstable.
    """
    rng = np.random.RandomState(42)
    n = len(y_true)
    aucs: list[float] = []
    for _ in range(n_boot):
        idx = rng.randint(0, n, size=n)
        yt_b = y_true[idx]
        yp_b = y_prob[idx]
        if len(np.unique(yt_b)) < 2:
            continue
        try:
            aucs.append(float(roc_auc_score(yt_b, yp_b)))
        except Exception:
            continue
    if len(aucs) < 100:
        return None, None
    aucs.sort()
    return round(aucs[int(0.025 * len(aucs))], 4), round(aucs[int(0.975 * len(aucs))], 4)


# ── Per-target training ────────────────────────────────────────────────────────

def _train_target(
    df: pd.DataFrame,
    target_cfg: dict,
    feature_col_names: list[str],
) -> TargetResult | None:
    """Train and evaluate a single target.

    Args:
        df: diary_features DataFrame.
        target_cfg: Dict with keys "name", "diary_key", "threshold".
        feature_col_names: All available feature column names.

    Returns:
        TargetResult on success, None if insufficient data.
    """
    name = target_cfg["name"]
    diary_key = target_cfg["diary_key"]
    threshold = target_cfg["threshold"]

    X, y, available_feats = _build_matrix(df, diary_key, threshold, feature_col_names)
    if X is None or y is None or len(y) < 10:
        return None

    n = len(y)
    pos = int(y.sum())
    neg = n - pos
    if pos < 3 or neg < 3:
        return None

    selected_idx = _forward_select(X, y, len(available_feats))

    if not selected_idx:
        # Fallback: top 3 by univariate AUC
        univariate = [((_loo_cv(X, y, [j])[0]), j) for j in range(len(available_feats))]
        univariate.sort(reverse=True)
        selected_idx = [j for _, j in univariate[:3]]

    selected_names = [available_feats[i] for i in selected_idx]
    auc, yt, yp, sens, spec = _loo_cv(X, y, selected_idx)
    ci_lo, ci_hi = _bootstrap_ci(yt, yp)

    # Fit final model on all data for coefficient export
    Xs_final = X[:, selected_idx]
    sc_final = StandardScaler().fit(Xs_final)
    clf_final = LogisticRegression(
        C=0.5, max_iter=1000, class_weight="balanced", random_state=42
    )
    clf_final.fit(sc_final.transform(Xs_final), y)

    coefs = {feat: round(float(c), 6) for feat, c in zip(selected_names, clf_final.coef_[0])}

    log_pipeline("L5", f"retrain:{name}", n, n)
    print(
        f"  features: {', '.join(selected_names)} — "
        f"AUC {auc:.3f} [{ci_lo or '?'}, {ci_hi or '?'}] — n={n}",
        flush=True,
    )

    return TargetResult(
        target_name=name,
        n_training=n,
        n_positive=pos,
        n_negative=neg,
        selected_features=selected_names,
        auc_loo=round(auc, 4),
        auc_ci95_lower=ci_lo,
        auc_ci95_upper=ci_hi,
        sensitivity=round(sens, 4),
        specificity=round(spec, 4),
        coefficients=coefs,
        intercept=round(float(clf_final.intercept_[0]), 6),
        scaler_mean={f: round(float(m), 6) for f, m in zip(selected_names, sc_final.mean_)},
        scaler_scale={f: round(float(s), 6) for f, s in zip(selected_names, sc_final.scale_)},
    )


# ── Deployment model ───────────────────────────────────────────────────────────

def _fit_deployment_model(
    df: pd.DataFrame,
    target_cfg: dict,
    feature_col_names: list[str],
) -> dict | None:
    """Fit the realistic 48h-ahead predictor using only lag≥2 features.

    This is the model consumed by log_diary.py for prospective prediction.
    Only features available ≥48h before symptom date are included.

    Args:
        df: diary_features DataFrame.
        target_cfg: Target configuration dict.
        feature_col_names: All available feature column names.

    Returns:
        Dict with selected features, AUC, coefficients, and scaler params.
    """
    deploy_feats = [
        c for c in feature_col_names
        if any(c.endswith(f"_t{lag}") for lag in DEPLOYMENT_LAGS)
    ]

    X, y, available_feats = _build_matrix(
        df, target_cfg["diary_key"], target_cfg["threshold"], deploy_feats
    )
    if X is None or y is None or len(y) < 10:
        return None

    n = len(y)
    pos = int(y.sum())
    neg = n - pos
    if pos < 3 or neg < 3:
        return None

    selected_idx = _forward_select(X, y, len(available_feats))
    if not selected_idx:
        univariate = [((_loo_cv(X, y, [j])[0]), j) for j in range(len(available_feats))]
        univariate.sort(reverse=True)
        selected_idx = [j for _, j in univariate[:3]]

    selected_names = [available_feats[i] for i in selected_idx]
    auc, yt, yp, sens, spec = _loo_cv(X, y, selected_idx)
    ci_lo, ci_hi = _bootstrap_ci(yt, yp)

    Xs_final = X[:, selected_idx]
    sc_final = StandardScaler().fit(Xs_final)
    clf_final = LogisticRegression(
        C=0.5, max_iter=1000, class_weight="balanced", random_state=42
    )
    clf_final.fit(sc_final.transform(Xs_final), y)

    coefs = {feat: round(float(c), 6) for feat, c in zip(selected_names, clf_final.coef_[0])}

    log_pipeline("L5", "retrain:deployment", n, n)
    print(
        f"  disfuncion_autonomica lag≥2 — features: {', '.join(selected_names)} — "
        f"AUC {auc:.3f} [{ci_lo or '?'}, {ci_hi or '?'}]",
        flush=True,
    )

    return {
        "target": target_cfg["name"],
        "target_name": target_cfg["name"],
        "lags": DEPLOYMENT_LAGS,
        "selected_features": selected_names,
        "auc_loo": round(auc, 4),
        "auc_ci95_lower": ci_lo,
        "auc_ci95_upper": ci_hi,
        "sensitivity": round(sens, 4),
        "specificity": round(spec, 4),
        "n_training": n,
        "n_positive": pos,
        "n_negative": neg,
        "coefficients": coefs,
        "intercept": round(float(clf_final.intercept_[0]), 6),
        "scaler_mean": {f: round(float(m), 6) for f, m in zip(selected_names, sc_final.mean_)},
        "scaler_scale": {f: round(float(s), 6) for f, s in zip(selected_names, sc_final.scale_)},
    }


# ── Main entry point ──────────────────────────────────────────────────────────

def retrain(diary_features_path: Path | None = None) -> dict:
    """Retrain all targets and the deployment model from diary_features.

    Args:
        diary_features_path: Path to L4 diary_features.csv. Defaults to
            data/processed/L4/diary_features.csv.

    Returns:
        Dict ready to serialise as predictor_results.json, containing
        "targets" (5 TargetResult dicts) and "deployment_model".

    Raises:
        FileNotFoundError: If diary_features.csv does not exist.
    """
    if diary_features_path is None:
        diary_features_path = DATA_PROCESSED_DIR / "L4" / "diary_features.csv"

    if not diary_features_path.exists():
        raise FileNotFoundError(f"diary_features.csv not found: {diary_features_path}")

    df = pd.read_csv(diary_features_path, parse_dates=["date"])
    df = df.set_index("date").sort_index()

    # All t-prefixed columns are feature candidates
    feature_col_names = [c for c in df.columns if any(
        c == f"{feat}_t{lag}"
        for feat, lags in CANDIDATE_FEATURES
        for lag in lags
    )]

    results: dict[str, dict] = {}
    for target_cfg in TARGETS:
        tr = _train_target(df, target_cfg, feature_col_names)
        if tr is not None:
            results[target_cfg["name"]] = tr.model_dump()

    # Deployment model: disfuncion_autonomica with lag≥2 only
    deploy_target = next(t for t in TARGETS if t["name"] == "disfuncion_autonomica")
    deployment = _fit_deployment_model(df, deploy_target, feature_col_names)

    return {
        "metadata": _build_metadata(),
        "targets": results,
        "deployment_model": deployment,
    }


if __name__ == "__main__":
    out_dir = DATA_PROCESSED_DIR / "L5"
    out_dir.mkdir(parents=True, exist_ok=True)

    results = retrain()

    out_path = out_dir / "predictor_results.json"
    out_path.write_text(json.dumps(results, indent=2, default=str))
    print(f"Written → {out_path}")
