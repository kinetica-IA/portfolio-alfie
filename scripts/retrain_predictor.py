#!/usr/bin/env python3
"""
retrain_predictor.py — Reentrenar predictor y actualizar polar_live.json
========================================================================
Lee:
  - data/diary_live.csv          (síntomas, en el repo del portfolio)
  - public/data/polar_live.json  (serie Polar, actualizada nocturnamente)

Escribe:
  - public/data/polar_live.json  (añade / actualiza bloque "predictor")

Ejecutado por el GitHub Action polar-retrain.yml cada vez que
se hace push de data/diary_live.csv.
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
    print("WARN: numpy/sklearn/scipy not found — using cached metrics only.", file=sys.stderr)

# ── Paths ─────────────────────────────────────────────────────────────────────
DIARY_CSV  = Path("data/diary_live.csv")
LIVE_JSON  = Path("public/data/polar_live.json")

# ── Helpers ───────────────────────────────────────────────────────────────────

def _f(v):
    try:
        return float(v) if v and str(v).strip() not in ("", "None") else None
    except (ValueError, TypeError):
        return None


def load_diary() -> list[dict]:
    """Load diary_live.csv as list of dicts."""
    if not DIARY_CSV.exists():
        print(f"ERROR: {DIARY_CSV} not found", file=sys.stderr)
        return []
    rows = []
    with open(DIARY_CSV, newline="") as f:
        for r in csv.DictReader(f):
            sev = _f(r.get("severidad_global"))
            if sev is not None:
                rows.append({
                    "date":      r["date"],
                    "severidad": sev,
                    "fatiga":    _f(r.get("fatiga")),
                    "pem":       _f(r.get("pem")),
                    "niebla":    _f(r.get("niebla_mental")),
                    "autonomica":_f(r.get("disfuncion_autonomica")),
                    "dolor":     _f(r.get("dolor")),
                    "zolpidem":  _f(r.get("zolpidem")) or 0.0,
                })
    return sorted(rows, key=lambda r: r["date"])


def load_polar_series() -> dict:
    """Load polar series as {date: row} from polar_live.json."""
    if not LIVE_JSON.exists():
        return {}
    try:
        data = json.loads(LIVE_JSON.read_text())
        return {r["date"]: r for r in data.get("series", [])}
    except Exception as e:
        print(f"WARN: could not load polar_live.json: {e}", file=sys.stderr)
        return {}


def get_polar_at(polar: dict, date_str: str, lag: int) -> dict:
    dt  = datetime.strptime(date_str, "%Y-%m-%d") - timedelta(days=lag)
    return polar.get(dt.strftime("%Y-%m-%d"), {})


# ── Core analysis ─────────────────────────────────────────────────────────────

def run_analysis(diary_rows: list, polar: dict) -> dict:
    """
    Full Spearman + lag + LOO-CV logistic regression.
    Returns a results dict suitable for embedding in polar_live.json.
    """
    n_diary = len(diary_rows)
    print(f"  Diary: {n_diary} entries  |  Polar series: {len(polar)} days")

    # ── Spearman lag-2 for key feature ───────────────────────────────────────
    lag_results = {}
    for pf in ["ans_status", "hrv_rmssd_night"]:
        lag_results[pf] = {}
        for lag in range(4):
            pairs = []
            for row in diary_rows:
                p  = get_polar_at(polar, row["date"], lag)
                pv = p.get(pf)
                sv = row.get("severidad")
                if pv is not None and sv is not None:
                    pairs.append((float(pv), float(sv)))
            if len(pairs) >= 5:
                xs = [p[0] for p in pairs]
                ys = [p[1] for p in pairs]
                rho, pval = spearmanr(xs, ys)
                lag_results[pf][lag] = {
                    "rho": round(float(rho), 3),
                    "p":   round(float(pval), 4),
                    "n":   len(pairs),
                }
            else:
                lag_results[pf][lag] = {"rho": None, "p": None, "n": len(pairs)}

    # ── Key finding: ANS lag-2 ────────────────────────────────────────────────
    ans_lag2 = lag_results.get("ans_status", {}).get(2, {})
    hrv_lag2 = lag_results.get("hrv_rmssd_night", {}).get(2, {})

    # ── Build training dataset (lag-2 features) ───────────────────────────────
    records = []
    rec_vals = []

    for row in diary_rows:
        p2 = get_polar_at(polar, row["date"], 2)
        p1 = get_polar_at(polar, row["date"], 1)

        ans2 = p2.get("ans_status")
        hrv2 = p2.get("hrv_rmssd_night")
        rec1 = p1.get("recovery_indicator") or p1.get("ans_score")
        zlp  = row.get("zolpidem", 0.0)
        sv   = row.get("severidad")

        if ans2 is None or hrv2 is None or sv is None:
            continue

        if rec1 is not None:
            rec_vals.append(float(rec1))

        records.append({
            "date":    row["date"],
            "ans_t2":  float(ans2),
            "hrv_t2":  float(hrv2),
            "rec_t1":  float(rec1) if rec1 is not None else None,
            "zlp":     float(zlp),
            "severidad": float(sv),
            "target":  1 if float(sv) >= 7 else 0,
        })

    n_rec = len(records)
    print(f"  Training records (ans+hrv available): {n_rec}")

    if n_rec < 8:
        print("  WARN: n insufficient for stable model — returning correlation only.")
        return {
            "n_diary": n_diary,
            "n_training": n_rec,
            "ans_lag2_rho": ans_lag2.get("rho"),
            "ans_lag2_p":   ans_lag2.get("p"),
            "ans_lag2_n":   ans_lag2.get("n"),
            "hrv_lag2_rho": hrv_lag2.get("rho"),
            "hrv_lag2_p":   hrv_lag2.get("p"),
            "auc":          None,
            "sensitivity":  None,
            "specificity":  None,
            "n_positive":   sum(r["target"] for r in records),
            "n_negative":   n_rec - sum(r["target"] for r in records),
            "lag_analysis": lag_results,
            "generated":    datetime.now().strftime("%Y-%m-%d %H:%M"),
        }

    # ── LOO-CV Logistic Regression ────────────────────────────────────────────
    rec_med = sorted(rec_vals)[len(rec_vals) // 2] if rec_vals else 3.0
    pos = sum(r["target"] for r in records)
    neg = n_rec - pos

    X_raw = np.array([
        [r["ans_t2"],
         r["hrv_t2"],
         r["rec_t1"] if r["rec_t1"] is not None else rec_med,
         r["zlp"]]
        for r in records
    ], dtype=float)
    y = np.array([r["target"] for r in records])

    loo     = LeaveOneOut()
    y_true  = []
    y_prob  = []

    for tr_idx, te_idx in loo.split(X_raw):
        sc    = StandardScaler().fit(X_raw[tr_idx])
        clf   = LogisticRegression(C=0.5, max_iter=1000, class_weight="balanced",
                                   random_state=42)
        try:
            clf.fit(sc.transform(X_raw[tr_idx]), y[tr_idx])
            prob = clf.predict_proba(sc.transform(X_raw[te_idx]))[0, 1]
        except Exception:
            prob = float(y[tr_idx].mean())
        y_true.append(int(y[te_idx][0]))
        y_prob.append(float(prob))

    y_true = np.array(y_true)
    y_prob = np.array(y_prob)
    y_pred = (y_prob >= 0.5).astype(int)

    try:
        auc = float(roc_auc_score(y_true, y_prob))
    except Exception:
        auc = float("nan")

    if pos > 0 and neg > 0:
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    else:
        tn = fp = fn = tp = 0

    sens = tp / (tp + fn) if (tp + fn) > 0 else float("nan")
    spec = tn / (tn + fp) if (tn + fp) > 0 else float("nan")
    acc  = (tp + tn) / n_rec

    # Full-model coefficients
    sc_full = StandardScaler().fit(X_raw)
    m_full  = LogisticRegression(C=0.5, max_iter=1000, class_weight="balanced",
                                 random_state=42).fit(sc_full.transform(X_raw), y)
    feat_names = ["ans_t2", "hrv_t2", "rec_t1", "zlp"]
    coefs = {k: round(float(v), 4) for k, v in zip(feat_names, m_full.coef_[0])}

    print(f"  AUC={auc:.3f}  Sens={sens:.3f}  Spec={spec:.3f}  TP={tp} FP={fp} TN={tn} FN={fn}")

    return {
        "n_diary":      n_diary,
        "n_training":   n_rec,
        "n_positive":   int(pos),
        "n_negative":   int(neg),
        "ans_lag2_rho": ans_lag2.get("rho"),
        "ans_lag2_p":   ans_lag2.get("p"),
        "ans_lag2_n":   ans_lag2.get("n"),
        "hrv_lag2_rho": hrv_lag2.get("rho"),
        "hrv_lag2_p":   hrv_lag2.get("p"),
        "auc":          round(auc, 4) if not math.isnan(auc) else None,
        "sensitivity":  round(sens, 4) if not math.isnan(sens) else None,
        "specificity":  round(spec, 4) if not math.isnan(spec) else None,
        "accuracy":     round(acc, 4),
        "tp": int(tp), "fp": int(fp), "tn": int(tn), "fn": int(fn),
        "coefficients": coefs,
        "lag_analysis": {
            pf: {str(l): v for l, v in lags.items()}
            for pf, lags in lag_results.items()
        },
        "generated": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("retrain_predictor.py")
    print("=" * 50)

    if not HAS_ML:
        print("ERROR: Missing ML dependencies. Run: pip install numpy scikit-learn scipy")
        sys.exit(1)

    # Load data
    diary  = load_diary()
    polar  = load_polar_series()

    if not diary:
        print("ERROR: No diary entries found.")
        sys.exit(1)

    print(f"Running analysis on {len(diary)} diary entries…")
    results = run_analysis(diary, polar)

    # Update polar_live.json
    if not LIVE_JSON.exists():
        print(f"ERROR: {LIVE_JSON} not found — run polar_seed.py first.")
        sys.exit(1)

    live = json.loads(LIVE_JSON.read_text())
    live["predictor"] = results

    # Also update the top-level "finding" block with live values
    if results.get("auc") is not None:
        live["finding"] = {
            "spearman_rho":    results.get("ans_lag2_rho") or live["finding"].get("spearman_rho"),
            "p_value":         results.get("ans_lag2_p")   or live["finding"].get("p_value"),
            "auc":             results["auc"],
            "sensitivity_pct": round(results["sensitivity"] * 100, 1) if results.get("sensitivity") else None,
            "n_pairs":         results["n_training"],
            "n_diary":         results["n_diary"],
            "description":     "Nocturnal ANS predicts PEM 48h ahead",
        }

    LIVE_JSON.write_text(json.dumps(live, indent=2, ensure_ascii=False))
    print(f"✓ Updated {LIVE_JSON}")
    print(f"  AUC={results.get('auc')}  Sens={results.get('sensitivity')}  n={results.get('n_training')}")
    print(f"  ANS lag-2: ρ={results.get('ans_lag2_rho')}  p={results.get('ans_lag2_p')}")


if __name__ == "__main__":
    main()
