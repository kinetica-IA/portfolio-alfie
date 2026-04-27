"""L2 feature computer: daily training zone distribution.

Reads training_session.parquet (L1 output, indexed by session_start_time)
and aggregates zone durations per calendar day. Days with no sessions
are absent from the output (not zero-filled) — the L3 outer merge handles
the gap.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from pipeline._logging import log_pipeline
from pipeline._schemas import DataFrameRow
from pipeline.config import DATA_PROCESSED_DIR


# ── Output schema ─────────────────────────────────────────────────────────────

class DailyZonesRow(DataFrameRow):
    """Per training-day zone distribution for daily_zones.parquet."""

    sessions_count: int
    total_duration_min: float
    z1_total_min: float
    z2_total_min: float
    z3_total_min: float
    z4_total_min: float
    z5_total_min: float
    pct_z1z2: float
    pct_z3: float
    pct_z4z5: float
    has_z5_peaks: bool


# ── Feature computer ──────────────────────────────────────────────────────────

def compute_zone_distribution(session_path: Path | None = None) -> pd.DataFrame:
    """Aggregate training session zone durations to per-day totals.

    Computes zone percentages relative to total session time. Days with
    zero total duration are excluded to avoid division by zero.

    Args:
        session_path: Path to training_session.parquet. Defaults to
            data/processed/L1/training_session.parquet.

    Returns:
        DataFrame indexed by date with columns matching DailyZonesRow.

    Raises:
        FileNotFoundError: If the session parquet does not exist.

    Example:
        >>> df = compute_zone_distribution()
        [L2:compute_zone_distribution] N session-days input → M valid
    """
    if session_path is None:
        session_path = DATA_PROCESSED_DIR / "L1" / "training_session.parquet"

    if not session_path.exists():
        raise FileNotFoundError(f"training_session.parquet not found: {session_path}")

    sessions = pd.read_parquet(session_path)
    sessions["date"] = pd.to_datetime(sessions["date"])
    n_sessions = len(sessions)

    agg = (
        sessions.groupby("date")
        .agg(
            sessions_count=("duration_min", "count"),
            total_duration_min=("duration_min", "sum"),
            z1_total_min=("zone1_min", "sum"),
            z2_total_min=("zone2_min", "sum"),
            z3_total_min=("zone3_min", "sum"),
            z4_total_min=("zone4_min", "sum"),
            z5_total_min=("zone5_min", "sum"),
        )
        .reset_index()
    )

    # Drop days with zero total (no usable zone data)
    agg = agg[agg["total_duration_min"] > 0].copy()

    def _pct(num: pd.Series, denom: pd.Series) -> pd.Series:
        return (num / denom.replace(0, float("nan"))).fillna(0.0)

    total = agg["total_duration_min"]
    agg["pct_z1z2"] = _pct(agg["z1_total_min"] + agg["z2_total_min"], total)
    agg["pct_z3"] = _pct(agg["z3_total_min"], total)
    agg["pct_z4z5"] = _pct(agg["z4_total_min"] + agg["z5_total_min"], total)
    agg["has_z5_peaks"] = agg["z5_total_min"] >= 3.0

    n_days = len(agg)
    log_pipeline("L2", "compute_zone_distribution", n_days, n_days)
    print(f"  [{n_sessions} sessions → {n_days} training days]", flush=True)

    agg["date"] = pd.to_datetime(agg["date"])
    agg = agg.set_index("date").sort_index()
    return agg


if __name__ == "__main__":
    out_dir = DATA_PROCESSED_DIR / "L2"
    out_dir.mkdir(parents=True, exist_ok=True)
    df = compute_zone_distribution()
    out_path = out_dir / "daily_zones.parquet"
    df.to_parquet(out_path)
    print(f"Written {len(df)} rows → {out_path}")
