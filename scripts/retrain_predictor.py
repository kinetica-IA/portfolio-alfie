#!/usr/bin/env python3
"""
retrain_predictor.py — Multi-target predictor with expanded HRV features
=========================================================================
Reads:
  - data/diary_live.csv          (symptom diary)
  - public/data/polar_live.json  (biometric series with HRV features)

Writes:
  - public/data/polar_live.json  (updates "predictor" and "finding" blocks)

Model v3: Multi-target (severity, PEM, fatiga, niebla_mental, disfuncion_autonomica)
  - Forward feature selection per target (max 5 features)
  - LOO-CV with LR, RF, GB
  - Bootstrap 95% CIs on AUC
  - Expanded HRV features from Session A (SDNN, pNN50, LF/HF, HF, SD1, SD2, DFA α1)
"""

import csv
import json
import math
import sys
from datetime import datetime, timedelta
from pathlib import Path

# ── Optional deps (installed by GitHub Action) ────────────────────────────────
try:
    import numpy as np
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.model_selection import LeaveOneOut
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import roc_auc_score, confusion_matrix
    from scipy.stats import spearmanr
    HAS_ML = True
except ImportError:
    HAS_ML = False
    print("WARN: numpy/sklearn/scipy not found.", file=sys.stderr)

# ── Paths ─────────────────────────────────────────────────────────────────────
DIARY_CSV = Path("data/diary_live.csv")
LIVE_JSON = Path("public/data/polar_live.json")

# ── Config ────────────────────────────────────────────────────────────────────
CANDIDATE_FEATURES = [
    ("ans_status",          [0, 1, 2, 3]),
    ("hrv_rmssd_night",     [0, 1, 2, 3]),
    ("recovery_sublevel",   [0, 1, 2, 3]),
    ("sleep_wake_min",      [0, 1, 2]),
    ("sleep_interruptions", [0, 1, 2]),
    ("hrv_rri_mean_ms",     [2]),
    # ── New HRV features (from Session A) ──
    ("hrv_sdnn",            [0, 1, 2]),
    ("hrv_pnn50",           [0, 1, 2]),
    ("hrv_lf_hf_ratio",     [0, 1, 2]),
    ("hrv_hf_power",        [0, 1, 2]),
    ("hrv_sd1",             [0, 1, 2]),
    ("hrv_sd2",             [0, 1, 2]),
    ("hrv_dfa_alpha1",      [0, 1, 2]),
]

TARGETS = [
    {"name": "severity",              "diary_key": "sev",     "threshold": 6},
    {"name": "pem",                   "diary_key": "pem",     "threshold": 5},
    {"name": "fatiga",                "diary_key": "fatiga",  "threshold": 6},
    {"name": "niebla_mental",         "diary_key": "niebla",  "threshold": 5},
    {"name": "disfuncion_autonomica", "diary_key": "auton",   "threshold": 5},
]

MAX_FEATURES = 5
MIN_AUC_IMPROVEMENT = 0.01
N_BOOTSTRAP = 1000

MODELS = {
    "logistic_regression": lambda: LogisticRegression(
        C=0.5, max_iter=1000, class_weight="balanced", random_state=42),
    "random_forest": lambda: RandomForestClassifier(
        n_estimators=200, min_samples_leaf=5, class_weight="balanced", random_state=42),
    "gradient_boosting": lambda: GradientBoostingClassifier(
        n_estimators=100, learning_rate=0.05, min_samples_leaf=5, random_state=42),
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _f(v):
    try:
        return float(v) if v and str(v).strip() not in ("", "None") else None
    except (ValueError, TypeError):
        return None


def _safe_round(v, n=4):
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    return round(float(v), n)


def load_diary():
    if not DIARY_CSV.exists():
        print(f"ERROR: {DIARY_CSV} not found", file=sys.stderr)
        return []
    rows = []
    with open(DIARY_CSV, newline="") as f:
        for r in csv.DictReader(f):
            sev = _f(r.get("severidad_global"))
            if sev is not None:
                rows.append({
                    "date":    r["date"],
                    "sev":     sev,
                    "pem":     _f(r.get("pem")),
                    "fatiga":  _f(r.get("fatiga")),
                    "niebla":  _f(r.get("niebla_mental")),
                    "auton":   _f(r.get("disfuncion_autonomica")),
                    "dolor":   _f(r.get("dolor")),
                })
    return sorted(rows, key=lambda r: r["date"])


def load_polar():
    if not LIVE_JSON.exists():
        return {}
    try:
        return {r["date"]: r for r in json.loads(LIVE_JSON.read_text()).get("series", [])}
    except Exception as e:
        print(f"WARN: could not load polar_live.json: {e}", file=sys.stderr)
        return {}


def polar_at(polar, date_str, lag):
    dt = datetime.strptime(date_str, "%Y-%m-%d") - timedelta(days=lag)
    return polar.get(dt.strftime("%Y-%m-%d"), {})


# ── Feature expansion ────────────────────────────────────────────────────────

def expand_feature_names():
    """Return list of (feature_name, polar_key, lag) for all candidates."""
    result = []
    for feat, lags in CANDIDATE_FEATURES:
        for lag in lags:
            name = f"{feat}_t{lag}"
            result.append((name, feat, lag))
    return result


def build_dataset(diary, polar, target_key, threshold):
    """Build X matrix and y vector for a given target.
    Returns (X, y, feature_names, dates, n_imputed_per_feature)."""
    all_features = expand_feature_names()

    # First pass: collect all raw values to compute medians for imputation
    raw_rows = []
    for row in diary:
        target_val = row.get(target_key)
        if target_val is None:
            continue

        feat_vals = {}
        has_any = False
        for fname, polar_key, lag in all_features:
            p = polar_at(polar, row["date"], lag)
            v = _f(p.get(polar_key))
            feat_vals[fname] = v
            if v is not None:
                has_any = True

        if has_any:
            raw_rows.append({
                "date": row["date"],
                "target": 1 if target_val >= threshold else 0,
                **feat_vals,
            })

    if not raw_rows:
        return None, None, [], [], {}

    feature_names = [f[0] for f in all_features]

    # Compute medians for imputation
    medians = {}
    for fname in feature_names:
        vals = [r[fname] for r in raw_rows if r[fname] is not None]
        medians[fname] = sorted(vals)[len(vals) // 2] if vals else 0.0

    # Build matrices
    X = np.zeros((len(raw_rows), len(feature_names)))
    y = np.array([r["target"] for r in raw_rows])
    dates = [r["date"] for r in raw_rows]

    n_imputed = {}
    for j, fname in enumerate(feature_names):
        imp_count = 0
        for i, r in enumerate(raw_rows):
            if r[fname] is not None:
                X[i, j] = r[fname]
            else:
                X[i, j] = medians[fname]
                imp_count += 1
        n_imputed[fname] = imp_count

    return X, y, feature_names, dates, n_imputed


# ── LOO-CV for a model on selected features ──────────────────────────────────

def loo_cv(X, y, feature_indices, model_factory):
    """Run LOO-CV and return (auc, y_true, y_prob, sens, spec)."""
    Xs = X[:, feature_indices]
    loo = LeaveOneOut()
    y_true, y_prob = [], []

    for tr, te in loo.split(Xs):
        sc = StandardScaler().fit(Xs[tr])
        clf = model_factory()
        try:
            clf.fit(sc.transform(Xs[tr]), y[tr])
            prob = clf.predict_proba(sc.transform(Xs[te]))[0, 1]
        except Exception:
            prob = float(y[tr].mean())
        y_true.append(int(y[te][0]))
        y_prob.append(float(prob))

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

    return auc, yt, yp, sens, spec, int(tp), int(fp), int(tn), int(fn)


# ── Forward selection ─────────────────────────────────────────────────────────

def forward_select(X, y, feature_names, model_factory):
    """Greedy forward feature selection maximizing LOO-CV AUC."""
    n_features = X.shape[1]
    available = list(range(n_features))
    selected = []
    best_auc = 0.0

    for step in range(MAX_FEATURES):
        best_candidate = None
        best_candidate_auc = best_auc

        for idx in available:
            trial = selected + [idx]
            auc, _, _, _, _, _, _, _, _ = loo_cv(X, y, trial, model_factory)
            if auc > best_candidate_auc:
                best_candidate_auc = auc
                best_candidate = idx

        if best_candidate is None or (best_candidate_auc - best_auc) < MIN_AUC_IMPROVEMENT:
            break

        selected.append(best_candidate)
        available.remove(best_candidate)
        best_auc = best_candidate_auc

    return selected, best_auc


# ── Bootstrap CI ──────────────────────────────────────────────────────────────

def bootstrap_auc_ci(y_true, y_prob, n_boot=N_BOOTSTRAP):
    """Bootstrap 95% CI for AUC."""
    rng = np.random.RandomState(42)
    n = len(y_true)
    aucs = []
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
    lo = aucs[int(0.025 * len(aucs))]
    hi = aucs[int(0.975 * len(aucs))]
    return round(lo, 4), round(hi, 4)


# ── Spearman lag analysis ────────────────────────────────────────────────────

def run_lag_analysis(diary, polar):
    """Spearman correlation of each candidate feature+lag vs severity."""
    lag_results = {}
    for feat, lags in CANDIDATE_FEATURES:
        lag_results[feat] = {}
        for lag in lags:
            pairs = []
            for row in diary:
                p = polar_at(polar, row["date"], lag)
                pv = _f(p.get(feat))
                sv = row.get("sev")
                if pv is not None and sv is not None:
                    pairs.append((pv, 1 if sv >= 6 else 0))
            if len(pairs) >= 10:
                rho, pval = spearmanr([x[0] for x in pairs], [x[1] for x in pairs])
                lag_results[feat][lag] = {
                    "rho": round(float(rho), 3),
                    "p":   round(float(pval), 4),
                    "n":   len(pairs),
                }
            else:
                lag_results[feat][lag] = {"rho": None, "p": None, "n": len(pairs)}
    return lag_results


# ── Single target training ────────────────────────────────────────────────────

def run_single_target(diary, polar, target_cfg):
    """Train and evaluate models for one target. Returns result dict."""
    name = target_cfg["name"]
    diary_key = target_cfg["diary_key"]
    threshold = target_cfg["threshold"]

    X, y, feature_names, dates, n_imputed = build_dataset(
        diary, polar, diary_key, threshold)

    if X is None or len(y) < 10:
        print(f"    {name}: insufficient data (n={0 if y is None else len(y)})")
        return {
            "best_model": None, "best_auc": None, "best_auc_ci95": None,
            "sensitivity": None, "specificity": None, "selected_features": [],
            "n_training": 0 if y is None else len(y), "threshold": threshold,
            "models": {},
        }

    n = len(y)
    pos = int(y.sum())
    neg = n - pos
    print(f"    {name}: n={n} pos={pos} neg={neg} threshold>={threshold}")

    if pos < 3 or neg < 3:
        print(f"    {name}: too few positives or negatives, skipping")
        return {
            "best_model": None, "best_auc": None, "best_auc_ci95": None,
            "sensitivity": None, "specificity": None, "selected_features": [],
            "n_training": n, "n_positive": pos, "n_negative": neg,
            "threshold": threshold, "models": {},
        }

    # Forward selection with LR (fast, good baseline)
    lr_factory = MODELS["logistic_regression"]
    selected_idx, _ = forward_select(X, y, feature_names, lr_factory)

    if not selected_idx:
        # Fallback: use top 3 features by univariate AUC
        univariate_aucs = []
        for j in range(X.shape[1]):
            auc_j, _, _, _, _, _, _, _, _ = loo_cv(X, y, [j], lr_factory)
            univariate_aucs.append((auc_j, j))
        univariate_aucs.sort(reverse=True)
        selected_idx = [idx for _, idx in univariate_aucs[:3]]

    selected_names = [feature_names[i] for i in selected_idx]
    print(f"      Selected features: {selected_names}")

    # Evaluate all 3 models on the selected features
    model_results = {}
    best_model_name = None
    best_auc = 0.0
    best_yt = None
    best_yp = None

    for mname, mfactory in MODELS.items():
        auc, yt, yp, sens, spec, tp, fp, tn, fn = loo_cv(
            X, y, selected_idx, mfactory)

        model_results[mname] = {
            "auc": _safe_round(auc),
            "sensitivity": _safe_round(sens),
            "specificity": _safe_round(spec),
            "accuracy": _safe_round((tp + tn) / n),
            "tp": tp, "fp": fp, "tn": tn, "fn": fn,
        }

        if auc > best_auc:
            best_auc = auc
            best_model_name = mname
            best_yt = yt
            best_yp = yp

    # Bootstrap CI for best model
    ci_lo, ci_hi = None, None
    if best_yt is not None:
        ci_lo, ci_hi = bootstrap_auc_ci(best_yt, best_yp)

    best_metrics = model_results.get(best_model_name, {})
    print(f"      Best: {best_model_name} AUC={best_auc:.4f} "
          f"CI=[{ci_lo}, {ci_hi}] "
          f"Sens={best_metrics.get('sensitivity')} Spec={best_metrics.get('specificity')}")

    return {
        "best_model": best_model_name,
        "best_auc": _safe_round(best_auc),
        "best_auc_ci95": [ci_lo, ci_hi] if ci_lo is not None else None,
        "sensitivity": best_metrics.get("sensitivity"),
        "specificity": best_metrics.get("specificity"),
        "selected_features": selected_names,
        "n_training": n,
        "n_positive": pos,
        "n_negative": neg,
        "threshold": threshold,
        "models": model_results,
    }


# ── Core analysis ─────────────────────────────────────────────────────────────

def run_analysis(diary, polar):
    n_diary = len(diary)
    print(f"  Diary: {n_diary} entries  |  Polar series: {len(polar)} days")

    # ── Spearman lag analysis ────────────────────────────────────────────────
    lag_results = run_lag_analysis(diary, polar)
    ans_lag2 = lag_results.get("ans_status", {}).get(2, {})
    hrv_lag2 = lag_results.get("hrv_rmssd_night", {}).get(2, {})

    # ── Multi-target training ────────────────────────────────────────────────
    print("\n  Training multi-target models...")
    targets_results = {}
    for tcfg in TARGETS:
        targets_results[tcfg["name"]] = run_single_target(diary, polar, tcfg)

    # ── Backward-compatible severity result (top-level predictor fields) ─────
    sev_result = targets_results.get("severity", {})
    sev_lr = sev_result.get("models", {}).get("logistic_regression", {})

    # ── Residual analysis (severity LR) ──────────────────────────────────────
    # Re-run severity LOO-CV to get residuals for residual analysis
    X_sev, y_sev, fnames_sev, dates_sev, _ = build_dataset(
        diary, polar, "sev", 6)
    residual_results = {"generated": datetime.now().strftime("%Y-%m-%d %H:%M")}

    if X_sev is not None and len(y_sev) >= 10:
        sel_idx_sev = [fnames_sev.index(f) for f in sev_result.get("selected_features", [])
                       if f in fnames_sev]
        if sel_idx_sev:
            _, yt_sev, yp_sev, _, _, _, _, _, _ = loo_cv(
                X_sev, y_sev, sel_idx_sev, MODELS["logistic_regression"])
            residuals = yt_sev - yp_sev

            # Build lookup for diary rows by date
            diary_by_date = {r["date"]: r for r in diary}
            for symptom_key, label in [("niebla", "brain_fog"), ("auton", "autonomic_dysfunction")]:
                pairs = []
                for i, d in enumerate(dates_sev):
                    sv = diary_by_date.get(d, {}).get(symptom_key)
                    if sv is not None:
                        pairs.append((residuals[i], sv))
                if len(pairs) >= 10:
                    rho, pval = spearmanr([p[0] for p in pairs], [p[1] for p in pairs])
                    residual_results[label] = {
                        "rho": round(float(rho), 3), "p": round(float(pval), 4), "n": len(pairs)}
                else:
                    residual_results[label] = {"rho": None, "p": None, "n": len(pairs)}

    print(f"\n  Severity: AUC={sev_result.get('best_auc')} "
          f"features={sev_result.get('selected_features')}")
    print(f"  ANS lag-2: rho={ans_lag2.get('rho')}  p={ans_lag2.get('p')}")

    return {
        # ── Backward compatible fields ──
        "model_version":    "v3",
        "n_diary":          n_diary,
        "n_training":       sev_result.get("n_training", 0),
        "n_positive":       sev_result.get("n_positive", 0),
        "n_negative":       sev_result.get("n_negative", 0),
        "threshold":        6,
        "ans_lag2_rho":     ans_lag2.get("rho"),
        "ans_lag2_p":       ans_lag2.get("p"),
        "ans_lag2_n":       ans_lag2.get("n"),
        "hrv_lag2_rho":     hrv_lag2.get("rho"),
        "hrv_lag2_p":       hrv_lag2.get("p"),
        "auc":              sev_result.get("best_auc"),
        "sensitivity":      sev_result.get("sensitivity"),
        "specificity":      sev_result.get("specificity"),
        "accuracy":         sev_lr.get("accuracy"),
        "tp": sev_lr.get("tp", 0), "fp": sev_lr.get("fp", 0),
        "tn": sev_lr.get("tn", 0), "fn": sev_lr.get("fn", 0),
        "features":         sev_result.get("selected_features", []),
        "lag_analysis": {
            feat: {str(l): v for l, v in lags.items()}
            for feat, lags in lag_results.items()
        },
        "residuals":        residual_results,
        "generated":        datetime.now().strftime("%Y-%m-%d %H:%M"),
        "models":           sev_result.get("models", {}),
        # ── New: multi-target ──
        "targets":          targets_results,
    }


def _minimal_result(n_diary, n_rec, ans_lag2, hrv_lag2, lag_results):
    return {
        "model_version": "v3",
        "n_diary":       n_diary,
        "n_training":    n_rec,
        "ans_lag2_rho":  ans_lag2.get("rho"),
        "ans_lag2_p":    ans_lag2.get("p"),
        "hrv_lag2_rho":  hrv_lag2.get("rho"),
        "auc":           None,
        "sensitivity":   None,
        "lag_analysis":  {
            feat: {str(l): v for l, v in lags.items()}
            for feat, lags in lag_results.items()
        },
        "generated": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("retrain_predictor.py  [model v3 — multi-target + HRV expanded]")
    print("=" * 60)

    if not HAS_ML:
        print("ERROR: pip install numpy scikit-learn scipy")
        sys.exit(1)

    diary = load_diary()
    polar = load_polar()

    if not diary:
        print("ERROR: No diary entries.")
        sys.exit(1)

    print(f"Running analysis on {len(diary)} diary entries...")
    results = run_analysis(diary, polar)

    if not LIVE_JSON.exists():
        print(f"ERROR: {LIVE_JSON} not found.")
        sys.exit(1)

    live = json.loads(LIVE_JSON.read_text())
    live["predictor"] = results

    # Update top-level finding block (backward compatible — severity)
    if results.get("auc") is not None:
        targets_summary = {}
        for tname, tres in results.get("targets", {}).items():
            if tres.get("best_auc") is not None:
                targets_summary[tname] = {
                    "auc": tres["best_auc"],
                    "ci95": tres.get("best_auc_ci95"),
                    "best_model": tres.get("best_model"),
                    "n": tres.get("n_training"),
                }

        live["finding"] = {
            "spearman_rho":    results.get("ans_lag2_rho"),
            "p_value":         results.get("ans_lag2_p"),
            "auc":             results["auc"],
            "sensitivity_pct": round(results["sensitivity"] * 100, 1)
                               if results.get("sensitivity") else None,
            "n_pairs":         results["n_training"],
            "n_diary":         results["n_diary"],
            "description":     "Nocturnal ANS predicts PEM 48h ahead · model v3",
            "targets_summary": targets_summary,
        }

    LIVE_JSON.write_text(json.dumps(live, indent=2, ensure_ascii=False))
    print(f"\nUpdated {LIVE_JSON}")
    print(f"  Severity: AUC={results.get('auc')}  "
          f"Sens={results.get('sensitivity')}  "
          f"n={results.get('n_training')}")

    targets = results.get("targets", {})
    for tname, tres in targets.items():
        print(f"  {tname}: AUC={tres.get('best_auc')} "
              f"CI={tres.get('best_auc_ci95')} "
              f"model={tres.get('best_model')} "
              f"feats={tres.get('selected_features')}")


if __name__ == "__main__":
    main()
