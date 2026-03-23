#!/usr/bin/env python3
"""
retrain_predictor.py — Retrain predictor and update polar_live.json
====================================================================
Reads:
  - data/diary_live.csv          (symptom diary, lives in portfolio repo)
  - public/data/polar_live.json  (biometric series, updated nightly)

Writes:
  - public/data/polar_live.json  (updates "predictor" and "finding" blocks)

Triggered by GitHub Action polar-retrain.yml on every push to diary_live.csv.

Model v2 features (LOO-CV Logistic Regression, threshold sev ≥ 6):
  ans_t2          — ANS status 2 days before symptoms (primary predictor)
  hrv_t2          — Nocturnal RMSSD 2 days before
  rec_sublevel_t1 — Recovery sublevel (ANS charge 1–93) 1 day before
  wake_t0         — Sleep fragmentation (min awake) same night
  zlp             — Zolpidem (confound control)
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

# ── Helpers ───────────────────────────────────────────────────────────────────

def _f(v):
    try:
        return float(v) if v and str(v).strip() not in ("", "None") else None
    except (ValueError, TypeError):
        return None


def load_diary() -> list[dict]:
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
                    "zolpidem": _f(r.get("zolpidem")) or 0.0,
                })
    return sorted(rows, key=lambda r: r["date"])


def load_polar() -> dict:
    if not LIVE_JSON.exists():
        return {}
    try:
        return {r["date"]: r for r in json.loads(LIVE_JSON.read_text()).get("series", [])}
    except Exception as e:
        print(f"WARN: could not load polar_live.json: {e}", file=sys.stderr)
        return {}


def polar_at(polar: dict, date_str: str, lag: int) -> dict:
    dt = datetime.strptime(date_str, "%Y-%m-%d") - timedelta(days=lag)
    return polar.get(dt.strftime("%Y-%m-%d"), {})


# ── Core analysis ─────────────────────────────────────────────────────────────

def run_analysis(diary: list, polar: dict) -> dict:
    n_diary = len(diary)
    print(f"  Diary: {n_diary} entries  |  Polar series: {len(polar)} days")

    # ── Spearman lag analysis — all candidate features ────────────────────────
    CANDIDATE_FEATURES = [
        ("ans_status",        [0, 1, 2, 3]),
        ("hrv_rmssd_night",   [0, 1, 2, 3]),
        ("recovery_sublevel", [0, 1, 2, 3]),
        ("sleep_wake_min",    [0, 1, 2]),
        ("sleep_interruptions", [0, 1, 2]),
        ("hrv_rri_mean_ms",   [2]),
    ]

    lag_results = {}
    for feat, lags in CANDIDATE_FEATURES:
        lag_results[feat] = {}
        for lag in lags:
            pairs = []
            for row in diary:
                p   = polar_at(polar, row["date"], lag)
                pv  = _f(p.get(feat))
                sv  = row.get("sev")
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

    # Key finding values
    ans_lag2 = lag_results.get("ans_status", {}).get(2, {})
    hrv_lag2 = lag_results.get("hrv_rmssd_night", {}).get(2, {})

    # ── Build training dataset ────────────────────────────────────────────────
    records = []
    rec_vals, wake_vals = [], []

    for row in diary:
        p2 = polar_at(polar, row["date"], 2)
        p1 = polar_at(polar, row["date"], 1)
        p0 = polar_at(polar, row["date"], 0)

        ans2  = _f(p2.get("ans_status"))
        hrv2  = _f(p2.get("hrv_rmssd_night"))
        rec1  = _f(p1.get("recovery_sublevel"))   # ANS charge 1–93
        wake0 = _f(p0.get("sleep_wake_min"))       # fragmentation (min awake)
        zlp   = row.get("zolpidem", 0.0)
        sev   = row.get("sev")

        if ans2 is None or hrv2 is None or sev is None:
            continue

        if rec1 is not None:
            rec_vals.append(rec1)
        if wake0 is not None:
            wake_vals.append(wake0)

        records.append({
            "date":   row["date"],
            "ans_t2": ans2,
            "hrv_t2": hrv2,
            "rec_t1": rec1,
            "wake_t0": wake0,
            "zlp":    float(zlp),
            "target": 1 if sev >= 6 else 0,
        })

    n_rec = len(records)
    pos   = sum(r["target"] for r in records)
    neg   = n_rec - pos
    print(f"  Training records: {n_rec}  (pos={pos} neg={neg})")

    if n_rec < 10:
        print("  WARN: insufficient data for model — returning correlations only.")
        return _minimal_result(n_diary, n_rec, ans_lag2, hrv_lag2, lag_results)

    # Impute missing rec_t1 / wake_t0 with median
    rec_med  = sorted(rec_vals)[len(rec_vals) // 2]  if rec_vals  else 48.0
    wake_med = sorted(wake_vals)[len(wake_vals) // 2] if wake_vals else 25.0

    # ── LOO-CV ───────────────────────────────────────────────────────────────
    X_raw = np.array([
        [r["ans_t2"],
         r["hrv_t2"],
         r["rec_t1"]  if r["rec_t1"]  is not None else rec_med,
         r["wake_t0"] if r["wake_t0"] is not None else wake_med,
         r["zlp"]]
        for r in records
    ], dtype=float)
    y = np.array([r["target"] for r in records])

    loo    = LeaveOneOut()
    y_true, y_prob = [], []
    for tr, te in loo.split(X_raw):
        sc  = StandardScaler().fit(X_raw[tr])
        clf = LogisticRegression(C=0.5, max_iter=1000,
                                 class_weight="balanced", random_state=42)
        try:
            clf.fit(sc.transform(X_raw[tr]), y[tr])
            prob = clf.predict_proba(sc.transform(X_raw[te]))[0, 1]
        except Exception:
            prob = float(y[tr].mean())
        y_true.append(int(y[te][0]))
        y_prob.append(float(prob))

    yt    = np.array(y_true)
    yp    = np.array(y_prob)
    ypred = (yp >= 0.5).astype(int)

    try:
        auc = float(roc_auc_score(yt, yp))
    except Exception:
        auc = float("nan")

    tn, fp, fn, tp = confusion_matrix(yt, ypred, labels=[0, 1]).ravel()
    sens = tp / (tp + fn) if (tp + fn) > 0 else float("nan")
    spec = tn / (tn + fp) if (tn + fp) > 0 else float("nan")
    acc  = (tp + tn) / n_rec

    # Full-model coefficients
    FEAT_NAMES = ["ans_t2", "hrv_t2", "rec_sublevel_t1", "wake_t0", "zlp"]
    sc_full = StandardScaler().fit(X_raw)
    m_full  = LogisticRegression(C=0.5, max_iter=1000,
                                 class_weight="balanced", random_state=42
                                 ).fit(sc_full.transform(X_raw), y)
    coefs = {k: round(float(v), 4) for k, v in zip(FEAT_NAMES, m_full.coef_[0])}

    print(f"  AUC={auc:.4f}  Sens={sens:.3f}  Spec={spec:.3f}  "
          f"TP={tp} FP={fp} TN={tn} FN={fn}")
    print(f"  Coefs: {coefs}")
    print(f"  ANS lag-2: ρ={ans_lag2.get('rho')}  p={ans_lag2.get('p')}")

    return {
        "model_version":    "v2",
        "n_diary":          n_diary,
        "n_training":       n_rec,
        "n_positive":       int(pos),
        "n_negative":       int(neg),
        "threshold":        6,
        "ans_lag2_rho":     ans_lag2.get("rho"),
        "ans_lag2_p":       ans_lag2.get("p"),
        "ans_lag2_n":       ans_lag2.get("n"),
        "hrv_lag2_rho":     hrv_lag2.get("rho"),
        "hrv_lag2_p":       hrv_lag2.get("p"),
        "auc":              round(auc, 4) if not math.isnan(auc) else None,
        "sensitivity":      round(sens, 4) if not math.isnan(sens) else None,
        "specificity":      round(spec, 4) if not math.isnan(spec) else None,
        "accuracy":         round(acc, 4),
        "tp": int(tp), "fp": int(fp), "tn": int(tn), "fn": int(fn),
        "features":         FEAT_NAMES,
        "coefficients":     coefs,
        "imputed_rec_med":  rec_med,
        "imputed_wake_med": wake_med,
        "lag_analysis": {
            feat: {str(l): v for l, v in lags.items()}
            for feat, lags in lag_results.items()
        },
        "generated": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }


def _minimal_result(n_diary, n_rec, ans_lag2, hrv_lag2, lag_results):
    return {
        "model_version": "v2",
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
    print("retrain_predictor.py  [model v2]")
    print("=" * 50)

    if not HAS_ML:
        print("ERROR: pip install numpy scikit-learn scipy")
        sys.exit(1)

    diary = load_diary()
    polar = load_polar()

    if not diary:
        print("ERROR: No diary entries.")
        sys.exit(1)

    print(f"Running analysis on {len(diary)} diary entries…")
    results = run_analysis(diary, polar)

    if not LIVE_JSON.exists():
        print(f"ERROR: {LIVE_JSON} not found.")
        sys.exit(1)

    live = json.loads(LIVE_JSON.read_text())
    live["predictor"] = results

    # Update top-level finding block
    if results.get("auc") is not None:
        live["finding"] = {
            "spearman_rho":    results.get("ans_lag2_rho"),
            "p_value":         results.get("ans_lag2_p"),
            "auc":             results["auc"],
            "sensitivity_pct": round(results["sensitivity"] * 100, 1)
                               if results.get("sensitivity") else None,
            "n_pairs":         results["n_training"],
            "n_diary":         results["n_diary"],
            "description":     "Nocturnal ANS predicts PEM 48h ahead · model v2",
        }

    LIVE_JSON.write_text(json.dumps(live, indent=2, ensure_ascii=False))
    print(f"\n✓ Updated {LIVE_JSON}")
    print(f"  AUC={results.get('auc')}  "
          f"Sens={results.get('sensitivity')}  "
          f"n={results.get('n_training')}")


if __name__ == "__main__":
    main()
