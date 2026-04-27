"""L2 feature computer: training session strata classification.

Reads daily_zones.parquet and classifies each training day into a
polarisation stratum. This is the primary variable used in the portfolio
visualisation to show training structure over time.

Stratum logic (mutually exclusive, evaluated in priority order):
  pure_z2   : pct_z1z2 >= 0.85  → predominantly aerobic base
  z3_trap   : pct_z3 >= 0.40    → lactate threshold grey zone
  polarized : has_z5_peaks AND pct_z3 < 0.20 AND pct_z1z2 >= 0.40 → high-low
  mixed     : any training day not matching above
  rest      : no training (not in daily_zones — assigned in L3 unified frame)

Note: "rest" is not assigned here. L3 populates it for dates absent in
daily_zones but present in the unified frame date range.
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal

import pandas as pd

from pipeline._logging import log_pipeline
from pipeline._schemas import DataFrameRow
from pipeline.config import DATA_PROCESSED_DIR

Stratum = Literal["pure_z2", "z3_trap", "polarized", "mixed"]


# ── Output schema ─────────────────────────────────────────────────────────────

class SessionStratumRow(DataFrameRow):
    """Per training-day stratum classification."""

    stratum: str


# ── Classifier ────────────────────────────────────────────────────────────────

def _classify_stratum(
    pct_z1z2: float,
    pct_z3: float,
    has_z5_peaks: bool,
) -> Stratum:
    """Classify a training day into a polarisation stratum.

    Priority order: pure_z2 → z3_trap → polarized → mixed.

    Args:
        pct_z1z2: Fraction of session time in zones 1+2.
        pct_z3: Fraction of session time in zone 3.
        has_z5_peaks: True if at least 3 min in zone 5.

    Returns:
        One of "pure_z2", "z3_trap", "polarized", "mixed".
    """
    if pct_z1z2 >= 0.85:
        return "pure_z2"
    if pct_z3 >= 0.40:
        return "z3_trap"
    if has_z5_peaks and pct_z3 < 0.20 and pct_z1z2 >= 0.40:
        return "polarized"
    return "mixed"


def compute_session_strata(zones_path: Path | None = None) -> pd.DataFrame:
    """Classify training days into polarisation strata.

    Reads daily_zones.parquet and applies the stratum classifier to each row.
    Only training days are classified; rest days are absent from the output.

    Args:
        zones_path: Path to daily_zones.parquet. Defaults to
            data/processed/L2/daily_zones.parquet.

    Returns:
        DataFrame indexed by date with a single column "stratum".

    Raises:
        FileNotFoundError: If the zones parquet does not exist.

    Example:
        >>> df = compute_session_strata()
        [L2:compute_session_strata] N training-days input → N valid
    """
    if zones_path is None:
        zones_path = DATA_PROCESSED_DIR / "L2" / "daily_zones.parquet"

    if not zones_path.exists():
        raise FileNotFoundError(f"daily_zones.parquet not found: {zones_path}")

    zones = pd.read_parquet(zones_path)
    n_input = len(zones)

    strata = zones.apply(
        lambda r: _classify_stratum(
            float(r["pct_z1z2"]),
            float(r["pct_z3"]),
            bool(r["has_z5_peaks"]),
        ),
        axis=1,
    )

    df = pd.DataFrame({"stratum": strata}, index=zones.index)
    df.index.name = "date"

    log_pipeline("L2", "compute_session_strata", n_input, len(df))
    return df


if __name__ == "__main__":
    out_dir = DATA_PROCESSED_DIR / "L2"
    out_dir.mkdir(parents=True, exist_ok=True)
    df = compute_session_strata()
    out_path = out_dir / "session_strata.parquet"
    df.to_parquet(out_path)
    print(f"Written {len(df)} rows → {out_path}")
