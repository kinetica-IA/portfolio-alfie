"""L1 parser: Polar PPI (RR interval) samples from 32 monthly JSON files.

Writes two outputs:
- ppi_summary.parquet   : per-night summary statistics (mean, IQR).
- rr_raw_arrays.parquet : per-night raw interval arrays for L2 HRV computation.

Physiological filter: 300 < pulseLength < 2000 ms. Values outside this range
are ectopic beats or motion artefacts and would corrupt frequency-domain HRV.
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

RR_MIN_MS: float = 300.0
RR_MAX_MS: float = 2000.0


# ── Output schemas ───────────────────────────────────────────────────────────

class RRNightlyRow(DataFrameRow):
    """Per-night RR interval summary for ppi_summary.parquet."""

    rr_intervals_count: int
    rr_intervals_mean_ms: float
    rr_intervals_p25_ms: float
    rr_intervals_p75_ms: float


# ── Parser ───────────────────────────────────────────────────────────────────

def parse_ppi_samples(input_files: list[Path] | None = None) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Parse Polar PPI sample files into per-night summary and raw arrays.

    Aggregates all device entries for each day. Applies physiological filter
    (300–2000 ms) before computing statistics or storing arrays.

    Args:
        input_files: List of ppi_samples_*.json paths. If None, auto-discovers
            all ppi_samples_*.json from RAW_DATA_DIR.

    Returns:
        Tuple of (summary_df, raw_df):
        - summary_df: DataFrame indexed by date with rr_intervals_count,
          rr_intervals_mean_ms, rr_intervals_p25_ms, rr_intervals_p75_ms.
        - raw_df: DataFrame indexed by date with rr_intervals_ms (object column
          containing numpy arrays of valid pulse lengths).

    Raises:
        FileNotFoundError: If RAW_DATA_DIR has no ppi_samples files.

    Example:
        >>> summary, raw = parse_ppi_samples()
        [L1:parse_ppi_samples] 32 files · N total samples → M after filter (reason: outside 300-2000ms)
    """
    if input_files is None:
        input_files = sorted(RAW_DATA_DIR.glob("ppi_samples_*.json"))
        if not input_files:
            raise FileNotFoundError(f"No ppi_samples_*.json in {RAW_DATA_DIR}")

    day_buckets: dict[date, list[float]] = {}
    n_total = 0
    n_filtered = 0

    for path in input_files:
        with path.open() as fh:
            day_entries: list[dict] = json.load(fh)

        for entry in day_entries:
            try:
                day = date.fromisoformat(entry["date"])
            except (KeyError, ValueError):
                continue

            if day not in day_buckets:
                day_buckets[day] = []

            for device in entry.get("devicePpiSamplesList", []):
                for sample in device.get("ppiSamples", []):
                    pl = sample.get("pulseLength")
                    if pl is None:
                        continue
                    n_total += 1
                    if RR_MIN_MS < pl < RR_MAX_MS:
                        day_buckets[day].append(float(pl))
                    else:
                        n_filtered += 1

    n_valid_total = n_total - n_filtered
    log_pipeline(
        "L1",
        "parse_ppi_samples",
        n_total,
        n_valid_total,
        f"outside {int(RR_MIN_MS)}-{int(RR_MAX_MS)} ms" if n_filtered else None,
    )

    summary_rows: list[dict] = []
    raw_rows: list[dict] = []

    for day, intervals in sorted(day_buckets.items()):
        arr = np.array(intervals, dtype=np.float64)
        if len(arr) == 0:
            continue
        summary_rows.append(
            {
                "date": day,
                "rr_intervals_count": len(arr),
                "rr_intervals_mean_ms": float(np.mean(arr)),
                "rr_intervals_p25_ms": float(np.percentile(arr, 25)),
                "rr_intervals_p75_ms": float(np.percentile(arr, 75)),
            }
        )
        raw_rows.append({"date": day, "rr_intervals_ms": arr})

    summary_df = pd.DataFrame(summary_rows)
    summary_df["date"] = pd.to_datetime(summary_df["date"])
    summary_df = summary_df.set_index("date").sort_index()

    raw_df = pd.DataFrame(raw_rows)
    raw_df["date"] = pd.to_datetime(raw_df["date"])
    raw_df = raw_df.set_index("date").sort_index()

    return summary_df, raw_df


if __name__ == "__main__":
    out_dir = DATA_PROCESSED_DIR / "L1"
    out_dir.mkdir(parents=True, exist_ok=True)

    summary, raw = parse_ppi_samples()

    summary_path = out_dir / "ppi_summary.parquet"
    summary.to_parquet(summary_path)
    print(f"Written {len(summary)} rows → {summary_path}")

    raw_path = out_dir / "rr_raw_arrays.parquet"
    raw.to_parquet(raw_path)
    print(f"Written {len(raw)} rows → {raw_path}")
