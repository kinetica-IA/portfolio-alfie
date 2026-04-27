"""L3 unified daily frame builder.

Outer-merges all L1 and L2 parquets on calendar date, producing one row
per day across the full observation window. NaN marks absence from a source
(e.g. orthostatic tests appear on 8 days only; rest days have no zone data).

Writes both parquet (machine-readable) and CSV (human inspection + portfolio
runtime). The CSV is the canonical artifact for L4 (diary join, model retrain)
and for the portfolio time-series visualisations.

Run: python -m pipeline.l3_unified
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from pipeline._logging import log_pipeline
from pipeline.config import DATA_PROCESSED_DIR


# ── Source registry ───────────────────────────────────────────────────────────

# Each entry: (parquet_path, optional_prefix_for_column_disambiguation)
# Prefix is None when column names are already unique across all sources.
_SOURCES: list[tuple[Path, str | None]] = [
    (DATA_PROCESSED_DIR / "L1" / "nightly_recovery.parquet", None),
    (DATA_PROCESSED_DIR / "L1" / "sleep.parquet", None),
    (DATA_PROCESSED_DIR / "L1" / "ppi_summary.parquet", None),
    (DATA_PROCESSED_DIR / "L1" / "activity.parquet", None),
    (DATA_PROCESSED_DIR / "L1" / "247ohr.parquet", None),
    (DATA_PROCESSED_DIR / "L1" / "orthostatic.parquet", None),
    (DATA_PROCESSED_DIR / "L1" / "fitness_test.parquet", None),
    (DATA_PROCESSED_DIR / "L2" / "hrv_features.parquet", None),
    (DATA_PROCESSED_DIR / "L2" / "daily_zones.parquet", None),
    (DATA_PROCESSED_DIR / "L2" / "session_strata.parquet", None),
]


# ── Builder ───────────────────────────────────────────────────────────────────

def build_daily_frame() -> pd.DataFrame:
    """Build the canonical daily unified frame from L1+L2 parquets.

    Reads:
        - data/processed/L1/nightly_recovery.parquet
        - data/processed/L1/sleep.parquet
        - data/processed/L1/ppi_summary.parquet
        - data/processed/L1/activity.parquet
        - data/processed/L1/247ohr.parquet
        - data/processed/L1/orthostatic.parquet (sparse, 8 days only)
        - data/processed/L1/fitness_test.parquet (sparse, 11 days only)
        - data/processed/L2/hrv_features.parquet
        - data/processed/L2/daily_zones.parquet
        - data/processed/L2/session_strata.parquet

    Date range: from min(any source) to max(any source).
    Outer merge — preserves all dates that appear in any source.
    Ordered chronologically.

    Returns:
        DataFrame indexed by date, columns from all sources.
        Includes a ``stratum`` column: training days carry their L2
        classification; all other days are labelled "rest".

    Side effects:
        Writes parquet and CSV to data/processed/L3/.

    Raises:
        FileNotFoundError: If any required L1/L2 parquet is missing.
    """
    frames: list[pd.DataFrame] = []

    for path, _ in _SOURCES:
        if not path.exists():
            raise FileNotFoundError(f"Required parquet not found: {path}")
        df = pd.read_parquet(path)
        df.index = pd.to_datetime(df.index)
        df.index.name = "date"

        # Drop non-date columns that would create ambiguity on merge
        # (session_start_time and test_time are session-level, not day-level)
        for col in ("session_start_time", "test_time"):
            if col in df.columns:
                df = df.drop(columns=[col])

        # For sparse sources with duplicate dates (orthostatic had 8 tests
        # on potentially non-unique days), keep the last entry per day.
        df = df[~df.index.duplicated(keep="last")]
        frames.append(df)

    # Outer merge: start with first frame, join all others
    unified = frames[0]
    for other in frames[1:]:
        unified = unified.join(other, how="outer", rsuffix="_dup")
        # Drop any accidental duplicate columns from rsuffix collision
        dup_cols = [c for c in unified.columns if c.endswith("_dup")]
        if dup_cols:
            unified = unified.drop(columns=dup_cols)

    unified = unified.sort_index()

    # Fill rest days in stratum column
    if "stratum" in unified.columns:
        unified["stratum"] = unified["stratum"].fillna("rest")

    n_sources = len(_SOURCES)
    log_pipeline("L3", "build_daily_frame", n_sources, len(unified))

    return unified


if __name__ == "__main__":
    out_dir = DATA_PROCESSED_DIR / "L3"
    out_dir.mkdir(parents=True, exist_ok=True)

    df = build_daily_frame()

    parquet_path = out_dir / "daily_unified.parquet"
    csv_path = out_dir / "daily_unified.csv"

    df.to_parquet(parquet_path)
    df.to_csv(csv_path)

    print(f"Written {len(df)} rows × {len(df.columns)} cols → {parquet_path}")
    print(f"Written CSV → {csv_path}")
    print(f"Date range: {df.index.min().date()} → {df.index.max().date()}")
    print(f"Columns: {df.columns.tolist()}")
