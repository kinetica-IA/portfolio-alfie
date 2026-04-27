"""L5 publish: atomically regenerate public/data/polar_live.json.

Reads L3 daily_unified.csv and L5 predictor_results.json, builds the
runtime JSON consumed by the portfolio React app, and atomically swaps
the live file. The existing file is backed up before the swap.

Atomic swap procedure: write to a .tmp sibling, validate it parses, then
rename. If any step fails, the existing file is untouched.

Run: python -m pipeline.l5_publish
"""

from __future__ import annotations

import json
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

from pipeline._logging import log_pipeline
from pipeline.config import DATA_PROCESSED_DIR, POLAR_LIVE_FILE

SCHEMA_VERSION: str = "v3.1"
BACKUP_SUFFIX: str = "backup-pre-pipeline-v3.1"


# ── Payload builder ────────────────────────────────────────────────────────────

def _git_short_sha() -> str:
    """Return the current git HEAD short SHA for provenance tracking."""
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except Exception:
        return "unknown"


def _series_rows(df: pd.DataFrame) -> list[dict]:
    """Convert the unified DataFrame to a list of JSON-serialisable dicts.

    NaN values are replaced with None for valid JSON. The date index is
    included as an ISO string.

    Args:
        df: daily_unified DataFrame indexed by date.

    Returns:
        List of dicts, one per day, ordered chronologically.
    """
    records = []
    for date_idx, row in df.iterrows():
        entry: dict = {"date": str(date_idx.date())}
        for col, val in row.items():
            if pd.isna(val):
                entry[col] = None
            elif isinstance(val, (bool, np.bool_)):
                entry[col] = bool(val)
            elif isinstance(val, (int, np.integer)):
                entry[col] = int(val)
            elif isinstance(val, (float, np.floating)):
                entry[col] = round(float(val), 6)
            else:
                entry[col] = val
        records.append(entry)
    return records


def _build_headline(predictor: dict) -> dict:
    """Build the headline metric block for polar_live.json.

    The headline is INTENTIONALLY locked to the deployment model target
    (autonomic dysfunction), not the highest AUC across all targets.

    Reason: brain fog has class split ~9:1 (positive:negative), making
    its AUC statistically inflated. Selecting it as headline would lead
    the portfolio with a number we explicitly document as unreliable.

    Autonomic dysfunction is the target with:
    - balanced classes
    - physiologically coherent feature selection
    - the only target that runs in production via deployment_model

    Args:
        predictor: Dict from predictor_results.json.

    Returns:
        Headline dict with metric, value, target, n, ci95, features.

    Raises:
        KeyError: If disfuncion_autonomica target is missing from results.
    """
    HEADLINE_TARGET: str = "disfuncion_autonomica"

    if HEADLINE_TARGET not in predictor.get("targets", {}):
        raise KeyError(
            f"Required headline target '{HEADLINE_TARGET}' not in "
            f"predictor results. Available: {list(predictor.get('targets', {}).keys())}"
        )

    t = predictor["targets"][HEADLINE_TARGET]
    return {
        "metric": "AUC",
        "value": round(t["auc_loo"], 3),
        "target": HEADLINE_TARGET,
        "n": t["n_training"],
        "ci95": [
            round(t["auc_ci95_lower"], 3),
            round(t["auc_ci95_upper"], 3),
        ],
        "features": t["selected_features"],
    }


def build_payload(
    daily_unified_path: Path | None = None,
    predictor_path: Path | None = None,
    n_diary_entries: int | None = None,
) -> dict:
    """Build the full polar_live.json payload dict.

    Args:
        daily_unified_path: Path to L3 daily_unified.csv.
        predictor_path: Path to L5 predictor_results.json.
        n_diary_entries: Number of diary entries (for data_window metadata).

    Returns:
        Dict ready for json.dumps.

    Raises:
        FileNotFoundError: If either source file is missing.
    """
    if daily_unified_path is None:
        daily_unified_path = DATA_PROCESSED_DIR / "L3" / "daily_unified.csv"
    if predictor_path is None:
        predictor_path = DATA_PROCESSED_DIR / "L5" / "predictor_results.json"

    if not daily_unified_path.exists():
        raise FileNotFoundError(f"daily_unified.csv not found: {daily_unified_path}")
    if not predictor_path.exists():
        raise FileNotFoundError(f"predictor_results.json not found: {predictor_path}")

    df = pd.read_csv(daily_unified_path, parse_dates=["date"])
    df = df.set_index("date").sort_index()

    predictor = json.loads(predictor_path.read_text())

    series = _series_rows(df)
    latest = series[-1] if series else {}
    headline = _build_headline(predictor)

    deploy = predictor.get("deployment_model") or {}
    n_training_sessions = int(df["sessions_count"].notna().sum()) if "sessions_count" in df.columns else 0
    n_diary = n_diary_entries or len([r for r in series if r.get("severidad_global") is not None])
    n_paired = predictor.get("targets", {}).get("severity", {}).get("n_training") or n_diary

    return {
        "schema_version": SCHEMA_VERSION,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "pipeline_run_id": _git_short_sha(),

        "latest": latest,

        "series": series,

        "predictor": {
            "version": "v3",
            "methodology_doc": "/methodology",
            "targets": predictor.get("targets", {}),
            "deployment_model": deploy,
        },

        "headline": headline,

        "data_window": {
            "start": str(df.index.min().date()),
            "end": str(df.index.max().date()),
            "n_days": len(df),
            "n_diary_entries": n_diary,
            "n_paired": n_paired,
            "n_training_sessions": n_training_sessions,
        },
    }


# ── Atomic swap ────────────────────────────────────────────────────────────────

def publish_polar_live(
    target: Path | None = None,
    daily_unified_path: Path | None = None,
    predictor_path: Path | None = None,
    n_diary_entries: int | None = None,
) -> None:
    """Atomically replace polar_live.json with the new v3.1 payload.

    Backs up the existing file, writes to a .tmp sibling, validates that
    the JSON parses, then renames into place. If any step fails, the
    existing file is untouched.

    Args:
        target: Destination path. Defaults to public/data/polar_live.json.
        daily_unified_path: Passed through to build_payload.
        predictor_path: Passed through to build_payload.
        n_diary_entries: Diary entry count for metadata.

    Raises:
        FileNotFoundError: If source files are missing.
        ValueError: If the generated JSON does not round-trip parse.
    """
    if target is None:
        target = POLAR_LIVE_FILE

    # Backup existing file
    if target.exists():
        backup = target.with_name(f"polar_live.{BACKUP_SUFFIX}.json")
        shutil.copy2(target, backup)
        size_kb = target.stat().st_size // 1024
        log_pipeline("L5", "publish", 1, 1)
        print(f"  backed up old polar_live.json ({size_kb} KB) → {backup.name}", flush=True)

    payload = build_payload(daily_unified_path, predictor_path, n_diary_entries)

    n_series = len(payload.get("series", []))
    n_targets = len(payload.get("predictor", {}).get("targets", {}))
    headline_auc = payload.get("headline", {}).get("value", 0)
    print(
        f"  writing {SCHEMA_VERSION} payload: {n_series} series entries, "
        f"{n_targets} targets, headline {headline_auc:.3f}",
        flush=True,
    )

    tmp = target.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, indent=2, default=str))
    # Validate round-trip
    parsed = json.loads(tmp.read_text())
    if "schema_version" not in parsed:
        tmp.unlink(missing_ok=True)
        raise ValueError("Payload validation failed: schema_version missing after round-trip")

    tmp.replace(target)
    size_kb = target.stat().st_size // 1024
    log_pipeline("L5", "publish:swap", 1, 1)
    print(f"  atomic swap completed → {target} ({size_kb} KB)", flush=True)


if __name__ == "__main__":
    publish_polar_live(n_diary_entries=61)
