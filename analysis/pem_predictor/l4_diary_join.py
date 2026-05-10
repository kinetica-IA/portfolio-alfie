"""L4 diary join: pairs L3 daily frame with diary symptom entries and adds lags.

For each diary entry date, the unified Polar data from that date (t0) and the
three preceding nights (t1, t2, t3) are added as lagged feature columns.
These lags represent the temporal window before symptom onset — clinically
relevant because ANS dysregulation precedes ME/CFS flares by 1-3 days.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd
from pydantic import ValidationError

from pipeline._logging import log_pipeline
from pipeline._schemas import DataFrameRow, PipelineModel
from pipeline.config import DATA_DIR, DATA_PROCESSED_DIR, DIARY_FILE

LAG_COLUMNS: list[str] = [
    "hrv_rmssd_night",
    "hrv_rmssd_calc",
    "hrv_lf_hf_ratio",
    "hrv_sd1",
    "hrv_sd2",
    "ans_status",
    "recovery_indicator",
    "recovery_sublevel",
]
N_LAGS: int = 4  # t0, t1, t2, t3


# ── Output schema ─────────────────────────────────────────────────────────────

class DiaryFeaturesRow(DataFrameRow):
    """Per diary-entry row with symptom scores (lag columns appended dynamically)."""

    severidad_global: float | None
    fatiga: float | None
    pem: float | None
    niebla_mental: float | None
    disfuncion_autonomica: float | None
    dolor: float | None


# ── Builder ────────────────────────────────────────────────────────────────────

def build_diary_features(
    daily_unified_path: Path | None = None,
    diary_path: Path | None = None,
) -> pd.DataFrame:
    """Join unified daily frame with diary, generate temporal lags.

    For each diary date D, adds columns ``<feature>_t0`` … ``<feature>_t3``
    representing Polar data from day D, D-1, D-2, D-3 respectively.
    Lag values missing from unified frame (e.g. no Polar data on that day)
    are kept as NaN — the retrain script handles imputation.

    Args:
        daily_unified_path: Path to L3 daily_unified.csv. Defaults to
            data/processed/L3/daily_unified.csv.
        diary_path: Path to diary. Defaults to data/diary_live.csv.

    Returns:
        DataFrame indexed by date with symptom columns and lagged features.
        One row per diary entry (inner join — only days with a symptom log).

    Raises:
        ValueError: If diary date range does not overlap daily_unified.

    Example:
        >>> df = build_diary_features()
        [L4:build_diary_features] 243 daily × 61 diary → 61 paired
        [L4:build_diary_features:lags] 8 features × 4 lags = 32 lagged columns added
        [L4:build_diary_features:final] 61 rows × 77 total columns written
    """
    if daily_unified_path is None:
        daily_unified_path = DATA_PROCESSED_DIR / "L3" / "daily_unified.csv"
    if diary_path is None:
        diary_path = DIARY_FILE

    if not daily_unified_path.exists():
        raise FileNotFoundError(f"daily_unified.csv not found: {daily_unified_path}")
    if not diary_path.exists():
        raise FileNotFoundError(f"diary_live.csv not found: {diary_path}")

    unified = pd.read_csv(daily_unified_path, parse_dates=["date"])
    unified = unified.set_index("date").sort_index()

    diary = pd.read_csv(diary_path, parse_dates=["date"])
    diary = diary.set_index("date").sort_index()

    n_unified = len(unified)
    n_diary = len(diary)

    # Guard: check overlap
    if unified.index.max() < diary.index.min():
        raise ValueError(
            f"No date overlap: unified ends {unified.index.max().date()}, "
            f"diary starts {diary.index.min().date()}"
        )

    # Inner join: keep only diary dates present in unified
    diary_cols = ["schema_version", "severidad_global", "fatiga", "pem",
                  "niebla_mental", "disfuncion_autonomica", "dolor", "nota"]
    diary_subset = diary[[c for c in diary_cols if c in diary.columns]]
    paired = unified.join(diary_subset, how="inner")
    n_paired = len(paired)

    log_pipeline("L4", "build_diary_features", n_unified, n_paired,
                 f"{n_diary} diary entries, {n_unified - n_paired} unmatched unified" if n_paired < n_diary else None)
    print(f"  [{n_unified} daily × {n_diary} diary → {n_paired} paired]", flush=True)

    # Add lag features: for each diary date, look up t-lag days prior
    lag_df = pd.DataFrame(index=paired.index)
    for col in LAG_COLUMNS:
        if col not in unified.columns:
            continue
        series = unified[col]
        for lag in range(N_LAGS):
            col_name = f"{col}_t{lag}"
            lag_df[col_name] = paired.index.map(
                lambda d, s=series, l=lag: (
                    s.get(d - pd.Timedelta(days=l)) if (d - pd.Timedelta(days=l)) in s.index else float("nan")
                )
            )

    n_lag_cols = len(lag_df.columns)
    log_pipeline("L4", "build_diary_features:lags", N_LAGS * len(LAG_COLUMNS), n_lag_cols)
    print(f"  [{len(LAG_COLUMNS)} features × {N_LAGS} lags = {n_lag_cols} lagged columns added]", flush=True)

    result = pd.concat([paired, lag_df], axis=1)
    log_pipeline("L4", "build_diary_features:final", n_paired, len(result))
    print(f"  [{len(result)} rows × {len(result.columns)} total columns written]", flush=True)

    return result


# ── Entry point ────────────────────────────────────────────────────────────────

def run() -> None:
    out_dir = DATA_PROCESSED_DIR / "L4"
    out_dir.mkdir(parents=True, exist_ok=True)

    df = build_diary_features()

    parquet_path = out_dir / "diary_features.parquet"
    csv_path = out_dir / "diary_features.csv"
    df.to_parquet(parquet_path)
    df.to_csv(csv_path)

    print(f"Written {len(df)} rows × {len(df.columns)} cols → {parquet_path}")
    print(f"Written CSV → {csv_path}")


if __name__ == "__main__":
    run()
