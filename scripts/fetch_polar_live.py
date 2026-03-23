#!/usr/bin/env python3
"""
Polar AccessLink v3 → public/data/polar_live.json
==================================================
Runs nightly via GitHub Action (polar-biometrics.yml).
Fetches yesterday's sleep, nightly recharge and activity,
merges with existing series, and writes polar_live.json.

Required env vars:
    POLAR_ACCESS_TOKEN  — bearer token (GitHub Secret)
    POLAR_USER_ID       — Polar user ID (hardcoded fallback: 63255666)
"""

import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path

import httpx

API_BASE  = "https://www.polaraccesslink.com/v3"
LIVE_JSON = Path("public/data/polar_live.json")

FINDING = {
    "spearman_rho":    0.431,
    "p_value":         0.016,
    "auc":             0.656,
    "sensitivity_pct": 81,
    "n_pairs":         39,
    "description":     "Nocturnal ANS predicts PEM 48h ahead",
}

MAX_SERIES_DAYS = 365


# ── API helpers ───────────────────────────────────────────────────────────────

def api_get(client: httpx.Client, path: str, params: dict | None = None):
    resp = client.get(f"{API_BASE}{path}", params=params)
    if resp.status_code == 200:
        return resp.json()
    if resp.status_code in (204, 404):
        return None
    print(f"  WARN {path} → {resp.status_code}: {resp.text[:200]}", file=sys.stderr)
    return None


# ── Data fetchers ─────────────────────────────────────────────────────────────

def fetch_nightly_recharge(client: httpx.Client, day: str) -> dict:
    """
    GET /v3/users/nightly-recharge/{date}
    Returns ans_charge (1-100), hrv_avg_ms, beat_to_beat_avg_ms, heart_rate_avg.
    """
    nr = api_get(client, f"/users/nightly-recharge/{day}")
    if not nr:
        return {}
    return {
        "hrv_rmssd_night":    nr.get("hrv_avg_ms"),
        "hrv_rri_mean_ms":    nr.get("beat_to_beat_avg_ms"),
        "ans_charge":         nr.get("ans_charge"),      # 1-100 scale
        "ans_score":          nr.get("score"),
        "recovery_heart_rate": nr.get("heart_rate_avg"),
        "breathing_rate":     nr.get("breathing_rate"),
    }


def fetch_sleep(client: httpx.Client, day: str) -> dict:
    """
    GET /v3/users/sleep/{date}
    Returns sleep_score, total_sleep_time (s), hrv_avg_ms.
    """
    sl = api_get(client, f"/users/sleep/{day}")
    if not sl:
        return {}
    total_s = sl.get("total_sleep_time")
    return {
        "sleep_score":      sl.get("sleep_score"),
        "sleep_duration_h": round(total_s / 3600, 2) if total_s else None,
        "sleep_hrv_avg_ms": sl.get("hrv_avg_ms"),
    }


def fetch_activity(client: httpx.Client, day: str) -> dict:
    """
    GET /v3/users/activities?from=&to=&steps=true
    Returns active_steps, active_calories.
    """
    acts = api_get(client, "/users/activities",
                   params={"from": day, "to": day, "steps": "true"})
    if not acts:
        return {}
    items = acts.get("activities") or acts.get("activity") or []
    if not items:
        return {}
    a = items[0]
    return {
        "steps":           a.get("active_steps") or a.get("step_count"),
        "active_calories": a.get("active_calories"),
    }


def fetch_day(client: httpx.Client, day: str) -> dict:
    """Merge all available metrics for a single date."""
    row = {"date": day}
    row.update(fetch_nightly_recharge(client, day))
    row.update(fetch_sleep(client, day))
    row.update(fetch_activity(client, day))
    # Drop None values to keep JSON clean
    return {k: v for k, v in row.items() if v is not None}


# ── Series management ─────────────────────────────────────────────────────────

def load_existing() -> dict:
    if LIVE_JSON.exists():
        try:
            return json.loads(LIVE_JSON.read_text())
        except Exception as e:
            print(f"  WARN could not read existing JSON: {e}", file=sys.stderr)
    return {"updated_at": "", "latest": {}, "series": [], "finding": FINDING}


def upsert_series(series: list, row: dict) -> list:
    """Insert or replace the entry for row['date']. Keep last MAX_SERIES_DAYS."""
    by_date = {r["date"]: r for r in series}
    by_date[row["date"]] = row
    return sorted(by_date.values(), key=lambda r: r["date"])[-MAX_SERIES_DAYS:]


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    token = os.environ.get("POLAR_ACCESS_TOKEN", "").strip()
    if not token:
        print("ERROR: POLAR_ACCESS_TOKEN not set.", file=sys.stderr)
        sys.exit(1)

    yesterday = (date.today() - timedelta(days=1)).isoformat()
    print(f"Fetching Polar data for {yesterday} …")

    client = httpx.Client(
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
        timeout=30,
    )

    try:
        row = fetch_day(client, yesterday)
    finally:
        client.close()

    print(f"  Row: {json.dumps(row)}")

    # Load, update and write
    data = load_existing()
    data["updated_at"] = f"{date.today().isoformat()}T06:00:00Z"
    data["latest"]     = row
    data["series"]     = upsert_series(data.get("series", []), row)
    data["finding"]    = FINDING

    LIVE_JSON.parent.mkdir(parents=True, exist_ok=True)
    LIVE_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False))

    print(f"  Written: {LIVE_JSON}  ({LIVE_JSON.stat().st_size:,} bytes)")
    print(f"  Series length: {len(data['series'])} days")
    print("Done.")


if __name__ == "__main__":
    main()
