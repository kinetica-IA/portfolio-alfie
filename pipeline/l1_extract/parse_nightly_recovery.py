"""L1 parser: Polar nightly recovery metrics.

Reads the consolidated nightly_recovery JSON (not the blob, which is L2
territory). Produces one row per night with HRV and recovery indicators.
The full-baseline field set is present in 214/216 rows; the remaining 2
early rows have only the minimal set (no ansStatus, no baseline_rmssd).
Those are kept — downstream code handles NaN explicitly.
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pandas as pd
from pydantic import ValidationError

from pipeline._logging import log_pipeline
from pipeline._schemas import DataFrameRow, PipelineModel
from pipeline.config import DATA_PROCESSED_DIR, RAW_DATA_DIR


# ── Input schema ────────────────────────────────────────────────────────────

class NightlyRecoveryRaw(PipelineModel):
    """Polar nightly_recovery JSON record (consolidated file, not blob)."""

    night: str
    meanNightlyRecoveryRmssd: float | None = None
    meanNightlyRecoveryRri: float | None = None
    meanNightlyRecoveryRespirationInterval: float | None = None
    ansStatus: float | None = None
    ansRate: float | None = None
    recoveryIndicator: int | None = None
    recoveryIndicatorSubLevel: int | None = None
    meanBaselineRmssd: float | None = None


# ── Output schema ───────────────────────────────────────────────────────────

class NightlyRecoveryRow(DataFrameRow):
    """One row per night in the nightly_recovery parquet."""

    hrv_rmssd_night: float | None
    hrv_rri_mean_ms: float | None
    hrv_resp_interval: float | None
    ans_status: float | None
    ans_rate: float | None
    recovery_indicator: int | None
    recovery_sublevel: int | None
    baseline_rmssd: float | None


# ── Parser ───────────────────────────────────────────────────────────────────

def parse_nightly_recovery(input_files: list[Path] | None = None) -> pd.DataFrame:
    """Parse Polar nightly_recovery JSON to per-night DataFrame.

    Reads the consolidated file (excludes blob variant). Drops rows with
    unparseable dates or where every HRV and recovery field is null.
    Partial nulls are preserved — the pipeline surfaces gaps, not hides them.

    Args:
        input_files: List of nightly_recovery*.json paths (excluding blob).
            If None, auto-discovers from RAW_DATA_DIR.

    Returns:
        DataFrame indexed by date with columns matching NightlyRecoveryRow.
        Columns: hrv_rmssd_night, hrv_rri_mean_ms, hrv_resp_interval,
        ans_status, ans_rate, recovery_indicator, recovery_sublevel,
        baseline_rmssd.

    Raises:
        FileNotFoundError: If RAW_DATA_DIR has no matching files.

    Example:
        >>> df = parse_nightly_recovery()
        [L1:parse_nightly_recovery] 216 input → 213 valid → 3 dropped (reason: invalid date)
        >>> df.shape[1]
        8
    """
    if input_files is None:
        candidates = [
            f for f in RAW_DATA_DIR.glob("nightly_recovery_*.json")
            if "blob" not in f.name
        ]
        if not candidates:
            raise FileNotFoundError(
                f"No nightly_recovery*.json (non-blob) found in {RAW_DATA_DIR}"
            )
        input_files = candidates

    records: list[dict] = []
    for path in input_files:
        with path.open() as fh:
            records.extend(json.load(fh))

    n_input = len(records)
    rows: list[NightlyRecoveryRow] = []
    dropped_invalid_date = 0
    dropped_no_data = 0

    for rec in records:
        try:
            raw = NightlyRecoveryRaw.model_validate(rec)
        except ValidationError:
            dropped_invalid_date += 1
            continue

        try:
            night_date = date.fromisoformat(raw.night)
        except (ValueError, TypeError):
            dropped_invalid_date += 1
            continue

        hrv_fields = (
            raw.meanNightlyRecoveryRmssd,
            raw.meanNightlyRecoveryRri,
            raw.meanNightlyRecoveryRespirationInterval,
            raw.ansStatus,
            raw.ansRate,
            raw.recoveryIndicator,
            raw.recoveryIndicatorSubLevel,
            raw.meanBaselineRmssd,
        )
        if all(v is None for v in hrv_fields):
            dropped_no_data += 1
            continue

        rows.append(
            NightlyRecoveryRow(
                date=night_date,
                hrv_rmssd_night=raw.meanNightlyRecoveryRmssd,
                hrv_rri_mean_ms=raw.meanNightlyRecoveryRri,
                hrv_resp_interval=raw.meanNightlyRecoveryRespirationInterval,
                ans_status=raw.ansStatus,
                ans_rate=raw.ansRate,
                recovery_indicator=raw.recoveryIndicator,
                recovery_sublevel=raw.recoveryIndicatorSubLevel,
                baseline_rmssd=raw.meanBaselineRmssd,
            )
        )

    n_dropped = dropped_invalid_date + dropped_no_data
    n_valid = n_input - n_dropped
    reason_parts = []
    if dropped_invalid_date:
        reason_parts.append(f"invalid date ×{dropped_invalid_date}")
    if dropped_no_data:
        reason_parts.append(f"no useful data ×{dropped_no_data}")
    log_pipeline(
        "L1",
        "parse_nightly_recovery",
        n_input,
        n_valid,
        "; ".join(reason_parts) if reason_parts else None,
    )

    df = pd.DataFrame([r.model_dump() for r in rows])
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date").sort_index()
    return df


if __name__ == "__main__":
    out_dir = DATA_PROCESSED_DIR / "L1"
    out_dir.mkdir(parents=True, exist_ok=True)
    df = parse_nightly_recovery()
    out_path = out_dir / "nightly_recovery.parquet"
    df.to_parquet(out_path)
    print(f"Written {len(df)} rows → {out_path}")
