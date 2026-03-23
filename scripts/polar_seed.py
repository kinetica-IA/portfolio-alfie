#!/usr/bin/env python3
"""
polar_seed.py — Seed public/data/polar_live.json from polar_daily_6m.csv
=========================================================================
Run ONCE locally before the first GitHub Action runs.
This seeds the 201-day historical series into the repo.

Usage:
    cd /Users/alfonsonavarro/portfolio-alfie
    python scripts/polar_seed.py

After running:
    git add public/data/polar_live.json
    git commit -m "feat: seed polar biometrics history (201 days)"
    git push
"""

import csv
import json
from datetime import date
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
CSV_PATH  = Path("/Users/alfonsonavarro/IO/clinical/data/polar_daily_6m.csv")
LIVE_JSON = Path("public/data/polar_live.json")

FINDING = {
    "spearman_rho":    0.431,
    "p_value":         0.016,
    "auc":             0.656,
    "sensitivity_pct": 81,
    "n_pairs":         39,
    "description":     "Nocturnal ANS predicts PEM 48h ahead",
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _f(v) -> float | None:
    """Parse float, return None if empty or invalid."""
    try:
        return float(v) if v and v.strip() != "" else None
    except (ValueError, AttributeError):
        return None


def _i(v) -> int | None:
    """Parse int, return None if empty or invalid."""
    try:
        return int(float(v)) if v and v.strip() != "" else None
    except (ValueError, AttributeError):
        return None


def _s(v) -> str | None:
    """Return non-empty string or None."""
    return v.strip() if v and v.strip() else None


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if not CSV_PATH.exists():
        print(f"ERROR: CSV not found at {CSV_PATH}")
        raise SystemExit(1)

    rows = []
    with open(CSV_PATH, newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            entry = {
                "date":               r["date"],
                # HRV
                "hrv_rmssd_night":    _f(r.get("hrv_rmssd_night")),
                "hrv_rri_mean_ms":    _f(r.get("hrv_rri_mean_ms")),
                "hrv_rmssd_daily":    _f(r.get("hrv_rmssd_daily")),
                # Sleep
                "sleep_score":        _f(r.get("sleep_score")),
                "sleep_duration_h":   _f(r.get("sleep_duration_h")),
                # Recovery / ANS
                "recovery_indicator": _s(r.get("recovery_indicator")),
                "recovery_sublevel":  _s(r.get("recovery_sublevel")),
                "ans_status":         _f(r.get("ans_status")),
                # Activity
                "steps":              _i(r.get("steps")),
            }
            # Drop all-None entries (days with only training data)
            non_null = {k: v for k, v in entry.items() if k != "date" and v is not None}
            if non_null:
                # Keep only non-None fields (plus date)
                entry = {"date": entry["date"], **non_null}
                rows.append(entry)

    rows.sort(key=lambda r: r["date"])

    latest = rows[-1] if rows else {}

    data = {
        "updated_at": f"{date.today().isoformat()}T00:00:00Z",
        "latest":     latest,
        "series":     rows,
        "finding":    FINDING,
    }

    LIVE_JSON.parent.mkdir(parents=True, exist_ok=True)
    LIVE_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False))

    print(f"✓ Seeded {len(rows)} days → {LIVE_JSON}")
    print(f"  Date range: {rows[0]['date']} → {rows[-1]['date']}")
    print(f"  Latest HRV (night):  {latest.get('hrv_rmssd_night')}")
    print(f"  Latest sleep score:  {latest.get('sleep_score')}")
    print(f"  Latest steps:        {latest.get('steps')}")
    print()
    print("Next steps:")
    print("  git add public/data/polar_live.json")
    print("  git commit -m 'feat: seed polar biometrics history'")
    print("  git push")


if __name__ == "__main__":
    main()
