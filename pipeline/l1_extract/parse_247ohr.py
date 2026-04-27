"""L1 parser: Polar 247 Optical Heart Rate (continuous 24/7 HR, 8 monthly files).

Each monthly file contains a list of deviceDays, each with HR samples at
irregular intervals (not every second is present). L1 computes per-day
summary statistics only. Minute-level resolution is not stored at this tier.

The `TIMED_24_7` source tag in samples confirms these are background
optical HR measurements, not exercise-derived.
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd

from pipeline._logging import log_pipeline
from pipeline._schemas import DataFrameRow, PipelineModel
from pipeline.config import DATA_PROCESSED_DIR, RAW_DATA_DIR


# ── Input schema ──────────────────────────────────────────────────────────────

class OHRRaw(PipelineModel):
    """Top-level Polar 247ohr monthly JSON."""

    deviceDays: list[dict] | None = None


# ── Output schema ─────────────────────────────────────────────────────────────

class HRContinuousDailyRow(DataFrameRow):
    """Per-day HR summary from continuous 24/7 optical HR monitoring."""

    hr_min: int | None
    hr_max: int | None
    hr_mean: float | None
    hr_p25: float | None
    hr_p50: float | None
    hr_p75: float | None
    n_samples: int


# ── Parser ────────────────────────────────────────────────────────────────────

def parse_247ohr(input_files: list[Path] | None = None) -> pd.DataFrame:
    """Parse Polar 24/7 OHR monthly JSONs to a per-day HR summary DataFrame.

    Aggregates all HR samples within each calendar day across devices.
    Days with zero samples after aggregation are dropped.

    Args:
        input_files: List of 247ohr_*.json paths. If None, auto-discovers
            from RAW_DATA_DIR.

    Returns:
        DataFrame indexed by date with columns matching HRContinuousDailyRow:
        hr_min, hr_max, hr_mean, hr_p25, hr_p50, hr_p75, n_samples.

    Raises:
        FileNotFoundError: If RAW_DATA_DIR has no 247ohr files.

    Example:
        >>> df = parse_247ohr()
        [L1:parse_247ohr] N days · M total samples → K valid days
        >>> "hr_mean" in df.columns
        True
    """
    if input_files is None:
        input_files = sorted(RAW_DATA_DIR.glob("247ohr_*.json"))
        if not input_files:
            raise FileNotFoundError(f"No 247ohr_*.json in {RAW_DATA_DIR}")

    day_buckets: dict[date, list[int]] = {}
    n_total_samples = 0

    for path in input_files:
        with path.open() as fh:
            data = json.load(fh)
        raw = OHRRaw.model_validate(data)
        for day_entry in raw.deviceDays or []:
            try:
                day = date.fromisoformat(day_entry["date"])
            except (KeyError, ValueError):
                continue
            if day not in day_buckets:
                day_buckets[day] = []
            for sample in day_entry.get("samples", []):
                hr = sample.get("heartRate")
                if hr is not None:
                    day_buckets[day].append(int(hr))
                    n_total_samples += 1

    rows: list[HRContinuousDailyRow] = []
    for day, hrs in sorted(day_buckets.items()):
        if not hrs:
            continue
        arr = np.array(hrs, dtype=np.float64)
        rows.append(
            HRContinuousDailyRow(
                date=day,
                hr_min=int(arr.min()),
                hr_max=int(arr.max()),
                hr_mean=float(arr.mean()),
                hr_p25=float(np.percentile(arr, 25)),
                hr_p50=float(np.percentile(arr, 50)),
                hr_p75=float(np.percentile(arr, 75)),
                n_samples=len(hrs),
            )
        )

    n_input_days = len(day_buckets)
    n_empty = n_input_days - len(rows)
    log_pipeline(
        "L1",
        "parse_247ohr",
        n_input_days,
        len(rows),
        "zero samples" if n_empty else None,
    )
    print(f"  [{n_total_samples:,} total HR samples across {len(rows)} days]", flush=True)

    df = pd.DataFrame([r.model_dump() for r in rows])
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date").sort_index()
    return df


if __name__ == "__main__":
    out_dir = DATA_PROCESSED_DIR / "L1"
    out_dir.mkdir(parents=True, exist_ok=True)
    df = parse_247ohr()
    out_path = out_dir / "247ohr.parquet"
    df.to_parquet(out_path)
    print(f"Written {len(df)} rows → {out_path}")
