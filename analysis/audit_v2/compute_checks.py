#!/usr/bin/env python3
"""Audit v2 — computable checks against the artefacts present in this repo.

Read-only. Reads data/diary_live.csv and public/data/polar_live.json only.
Emits raw computed values to stdout; VALIDITY_REPORT.md quotes them verbatim.

Anything requiring data/processed/L1..L5 or the L0 Polar export is not
attempted here — those paths are absent from the repository (see report).
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

REPO = Path(__file__).resolve().parents[2]
DIARY = REPO / "data" / "diary_live.csv"
LIVE = REPO / "public" / "data" / "polar_live.json"

SYMPTOM_COLS = ["fatiga", "pem", "niebla_mental", "disfuncion_autonomica", "dolor"]


def hdr(s: str) -> None:
    print(f"\n{'=' * 78}\n{s}\n{'=' * 78}")


def main() -> None:
    diary = pd.read_csv(DIARY, parse_dates=["date"]).sort_values("date")
    live = json.loads(LIVE.read_text())

    # ── Data availability ────────────────────────────────────────────────
    hdr("A. ARTEFACT AVAILABILITY")
    for rel in [
        "data/processed/L1", "data/processed/L2", "data/processed/L3",
        "data/processed/L4", "data/processed/L5",
    ]:
        files = sorted(p.name for p in (REPO / rel).glob("*") if p.name != ".gitkeep")
        print(f"  {rel}: {files if files else 'EMPTY (only .gitkeep)'}")
    print(f"  data/diary_live.csv: {len(diary)} rows, cols={list(diary.columns)}")
    ser = pd.DataFrame(live["series"])
    print(f"  polar_live.json series: {len(ser)} rows "
          f"{ser['date'].min()} → {ser['date'].max()}, cols={list(ser.columns)}")
    diary_days = set(diary["date"].dt.strftime("%Y-%m-%d"))
    print(f"  diary ∩ series dates: {len(diary_days & set(ser['date']))}")
    print(f"  data/hrv_features.csv exists: {(REPO / 'data' / 'hrv_features.csv').exists()}")
    print(f"  data/hrv_rr_nightly.csv exists: {(REPO / 'data' / 'hrv_rr_nightly.csv').exists()}")
    print(f"  data/polar_live.full.json exists: {(REPO / 'data' / 'polar_live.full.json').exists()}")

    # ── C3: missingness ──────────────────────────────────────────────────
    hdr("C3. DIARY MISSINGNESS OVER CALENDAR TIME")
    d = diary["date"]
    span_start, span_end = d.min(), d.max()
    span_days = (span_end - span_start).days + 1
    print(f"  diary first={span_start.date()} last={span_end.date()} "
          f"span={span_days} calendar days, n_entries={len(diary)}")
    print(f"  coverage = {len(diary)}/{span_days} = {len(diary) / span_days:.3f}")
    print(f"  stated observation window (docs/polar_live) = 2025-08-25 → 2026-04-27 (243 d)")
    print(f"  diary entries fall inside 243-day window: "
          f"{((d >= '2025-08-25') & (d <= '2026-04-27')).sum()}")
    print(f"  days of the 243-day window with NO diary entry: {243 - len(diary)}")

    gaps = d.diff().dt.days.dropna()
    runs = [(d.iloc[i].date(), d.iloc[i + 1].date(), int(g) - 1)
            for i, g in enumerate(gaps) if g - 1 > 5]
    print(f"  gaps: max={int(gaps.max())}d  median={gaps.median()}d  mean={gaps.mean():.2f}d")
    print(f"  runs of absence > 5 days: {len(runs)}")
    for a, b, n in runs:
        print(f"    {a} → {b}: {n} consecutive days absent")
    absent_total = sum(n for _, _, n in runs)
    print(f"  total days inside absence-runs>5: {absent_total}")

    print("\n  monthly entry counts:")
    for k, v in diary.groupby(d.dt.to_period("M")).size().items():
        print(f"    {k}: {v}")

    # per-target availability
    print("\n  per-column non-null counts:")
    for c in SYMPTOM_COLS + ["severidad_global"]:
        print(f"    {c}: {diary[c].notna().sum()}/{len(diary)} non-null")

    # ── C5: threshold sensitivity (class balance only) ───────────────────
    hdr("C5. THRESHOLD SENSITIVITY — CLASS COUNTS AND ORDINAL DISTRIBUTION")
    da = diary["disfuncion_autonomica"].dropna()
    print(f"  disfuncion_autonomica: n={len(da)} (rows with value), "
          f"{len(diary) - len(da)} missing")
    print(f"  min={da.min()} max={da.max()} mean={da.mean():.3f} "
          f"median={da.median()} sd={da.std(ddof=1):.3f}")
    print("  value distribution:")
    for v, c in sorted(da.value_counts().items()):
        print(f"    {v}: {c}")
    print("\n  threshold  n_pos  n_neg  base_rate  minority_n  >=15?")
    for thr in [3, 4, 5, 6, 7]:
        y = (da.values >= thr).astype(int)
        pos, neg = int(y.sum()), int(len(y) - y.sum())
        minority = min(pos, neg)
        print(f"    {thr:>6}  {pos:>5}  {neg:>5}  {pos / len(y):>9.3f}  "
              f"{minority:>10}  {'yes' if minority >= 15 else 'NO'}")

    # ties exactly at 5
    print(f"\n  rows with disfuncion_autonomica exactly == 5.0: {(da == 5.0).sum()}")
    print(f"  rows in (4,5) exclusive: {((da > 4) & (da < 5)).sum()}")
    print(f"  fraction of positives at thr=5 that sit exactly on 5.0: "
          f"{(da == 5.0).sum()} / {(da >= 5).sum()}")

    # ── C6: temporal drift ───────────────────────────────────────────────
    hdr("C6. TEMPORAL DRIFT AND AUTOCORRELATION OF THE TARGET")
    s = diary.set_index("date")["disfuncion_autonomica"].dropna()
    t = (s.index - s.index.min()).days.values.astype(float)
    y = s.values.astype(float)
    sl, ic, r, p, se = stats.linregress(t, y)
    print(f"  raw target vs day-index: slope={sl:.5f}/day  r={r:.4f}  "
          f"r2={r ** 2:.4f}  p={p:.4f}  n={len(y)}")
    print(f"  implied drift over the {int(t.max())}-day span: {sl * t.max():+.3f} points")

    resid = y - (sl * t + ic)

    def acf1(v: np.ndarray) -> tuple[float, int]:
        a, b = v[:-1], v[1:]
        return float(np.corrcoef(a, b)[0, 1]), len(a)

    r1_raw, n1 = acf1(y)
    r1_det, _ = acf1(resid)
    print(f"  lag-1 ACF, raw target (consecutive DIARY ENTRIES, not calendar days): "
          f"{r1_raw:.4f} (n_pairs={n1})")
    print(f"  lag-1 ACF, linearly detrended:                                       "
          f"{r1_det:.4f}")

    # restrict to genuinely adjacent calendar days
    gapv = np.diff(s.index.values).astype("timedelta64[D]").astype(int)
    adj = gapv == 1
    if adj.sum() >= 3:
        ra = float(np.corrcoef(y[:-1][adj], y[1:][adj])[0, 1])
        rd = float(np.corrcoef(resid[:-1][adj], resid[1:][adj])[0, 1])
        print(f"  lag-1 ACF restricted to adjacent calendar days (n_pairs={int(adj.sum())}): "
              f"raw={ra:.4f}  detrended={rd:.4f}")
    else:
        print(f"  adjacent-calendar-day pairs: {int(adj.sum())} — too few for ACF")

    # 14-day rolling mean detrend
    roll = s.rolling("14D").mean()
    resid_roll = (s - roll).values
    r1_roll, _ = acf1(resid_roll)
    print(f"  lag-1 ACF after 14-day rolling-mean removal: {r1_roll:.4f}")

    print("\n  drift in every diary dimension (slope per day, r, p):")
    for c in SYMPTOM_COLS + ["severidad_global"]:
        ss = diary.set_index("date")[c].dropna()
        tt = (ss.index - ss.index.min()).days.values.astype(float)
        if len(ss) < 5:
            continue
        sl2, _, r2, p2, _ = stats.linregress(tt, ss.values.astype(float))
        print(f"    {c:<24} slope={sl2:+.5f}  r={r2:+.4f}  p={p2:.4f}  n={len(ss)}")

    # ── C9: algebraic coupling in the composite target ───────────────────
    hdr("C9. ALGEBRAIC COUPLING — severidad_global VS ITS COMPONENTS")
    print("  Formula per scripts/log_diary.py:260-261 —")
    print("    sev_components = [fatiga, pem, niebla] + [auto if present] + [dolor if present]")
    print("    severidad_global = round(mean(sev_components), 1)")
    ok = miss = 0
    devs = []
    for _, row in diary.iterrows():
        comps = [row["fatiga"], row["pem"], row["niebla_mental"]]
        for c in ("disfuncion_autonomica", "dolor"):
            if pd.notna(row[c]):
                comps.append(row[c])
        if any(pd.isna(x) for x in comps) or pd.isna(row["severidad_global"]):
            miss += 1
            continue
        recomputed = round(float(np.mean(comps)), 1)
        devs.append(abs(recomputed - float(row["severidad_global"])))
        ok += 1
    devs_arr = np.array(devs)
    print(f"\n  rows checked: {ok} (skipped {miss} for missing components)")
    print(f"  |recomputed − stored| : max={devs_arr.max():.4f}  "
          f"mean={devs_arr.mean():.4f}")
    print(f"  exact matches (dev <= 0.05): {int((devs_arr <= 0.05).sum())}/{ok} "
          f"= {(devs_arr <= 0.05).mean():.4f}")
    print(f"  rows deviating > 0.05: {int((devs_arr > 0.05).sum())}")
    by_ver = diary.groupby("schema_version").size().to_dict()
    print(f"  schema_version counts: {by_ver}")

    print("\n  Spearman rho between severidad_global and each of its own components:")
    for c in SYMPTOM_COLS:
        sub = diary[["severidad_global", c]].dropna()
        rho, pv = stats.spearmanr(sub["severidad_global"], sub[c])
        print(f"    severidad_global ~ {c:<24} rho={rho:+.4f}  p={pv:.3e}  n={len(sub)}")

    print("\n  Cross-target Spearman (all diary-internal, no device involved):")
    for i, a in enumerate(SYMPTOM_COLS):
        for b in SYMPTOM_COLS[i + 1:]:
            sub = diary[[a, b]].dropna()
            rho, pv = stats.spearmanr(sub[a], sub[b])
            print(f"    {a:<24} ~ {b:<24} rho={rho:+.4f}  p={pv:.3e}  n={len(sub)}")

    # ── C8: published-artefact identity check ────────────────────────────
    hdr("C8. PUBLISHED MODEL BLOCK IDENTITY (polar_live.json)")
    fat = live["predictor"]["targets"]["fatiga"]
    slq = live["sleep_quality"]
    print(f"  predictor.targets.fatiga == sleep_quality (deep equality): {fat == slq}")
    print(f"  keys compared: {sorted(fat.keys())}")
    for k in sorted(fat.keys()):
        if fat[k] != slq[k]:
            print(f"    DIFFERS {k}: {fat[k]!r} vs {slq[k]!r}")
    print(f"  fatiga block: features={fat['selected_features']} auc={fat['auc_loo']} "
          f"n={fat['n_training']}")
    print(f"  sleep_quality block: features={slq['selected_features']} auc={slq['auc_loo']} "
          f"n={slq['n_training']}")
    print(f"  headline: {live['headline']}")
    print(f"  data_window: {live['data_window']}")
    print(f"  pipeline_run_id: {live['pipeline_run_id']}  updated_at: {live['updated_at']}")

    hdr("DONE")


if __name__ == "__main__":
    main()
