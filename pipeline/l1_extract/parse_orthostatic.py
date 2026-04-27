"""L1 parser: Polar orthostatic test results (8 individual JSONs).

Computes autonomic reactivity deltas at parse time:
  delta_rmssd = rmssd_stand - rmssd_supine  (negative = blunted HRV response)
  delta_rr    = rr_supine   - rr_stand      (positive = expected HR rise on standing)

These are the primary biomarkers of orthostatic autonomic function and are
computed here rather than deferred to L2 because they require only within-test
arithmetic and have no dependency on other sources.
"""

from __future__ import annotations

import json
from datetime import date, datetime
from pathlib import Path

import pandas as pd
from pydantic import ValidationError

from pipeline._logging import log_pipeline
from pipeline._schemas import DataFrameRow, PipelineModel
from pipeline.config import DATA_PROCESSED_DIR, RAW_DATA_DIR


# ── Input schema ──────────────────────────────────────────────────────────────

class OrthostaticResultRaw(PipelineModel):
    """orthostaticTestResult sub-object."""

    rrAvgSupine: float | None = None
    rrAvgStand: float | None = None
    rrMinStandup: float | None = None
    rmssdSupine: float | None = None
    rmssdStand: float | None = None


class OrthostaticRaw(PipelineModel):
    """Top-level Polar orthostatic test JSON."""

    startTime: str
    orthostaticTestResult: OrthostaticResultRaw | None = None


# ── Output schema ─────────────────────────────────────────────────────────────

class OrthostaticRow(DataFrameRow):
    """One row per orthostatic test in the orthostatic parquet."""

    test_time: datetime
    rmssd_supine: float | None
    rmssd_stand: float | None
    rr_supine_ms: float | None
    rr_stand_ms: float | None
    rr_min_standup_ms: float | None
    delta_rmssd: float | None
    delta_rr: float | None


# ── Parser ────────────────────────────────────────────────────────────────────

def parse_orthostatic(input_files: list[Path] | None = None) -> pd.DataFrame:
    """Parse Polar orthostatic test JSONs to a sparse per-test DataFrame.

    Computes delta_rmssd (rmssd_stand - rmssd_supine) and delta_rr
    (rr_supine - rr_stand) as autonomic reactivity metrics.

    Args:
        input_files: List of orthostatic-test-result-*.json paths.
            If None, auto-discovers from RAW_DATA_DIR.

    Returns:
        DataFrame indexed by date with columns matching OrthostaticRow.
        Only 8 rows (one per test); sparse in the unified frame.

    Raises:
        FileNotFoundError: If RAW_DATA_DIR has no orthostatic files.

    Example:
        >>> df = parse_orthostatic()
        [L1:parse_orthostatic] 8 input → 8 valid
        >>> df.shape
        (8, 8)
    """
    if input_files is None:
        input_files = sorted(RAW_DATA_DIR.glob("orthostatic-test-result-*.json"))
        if not input_files:
            raise FileNotFoundError(
                f"No orthostatic-test-result-*.json in {RAW_DATA_DIR}"
            )

    n_input = len(input_files)
    rows: list[OrthostaticRow] = []
    dropped = 0

    for path in input_files:
        try:
            with path.open() as fh:
                data = json.load(fh)
            raw = OrthostaticRaw.model_validate(data)
            test_dt = datetime.fromisoformat(raw.startTime)
        except (json.JSONDecodeError, ValidationError, ValueError, TypeError):
            dropped += 1
            continue

        res = raw.orthostaticTestResult or OrthostaticResultRaw()

        rmssd_supine = res.rmssdSupine
        rmssd_stand = res.rmssdStand
        rr_supine = res.rrAvgSupine
        rr_stand = res.rrAvgStand

        delta_rmssd = (
            (rmssd_stand - rmssd_supine)
            if rmssd_stand is not None and rmssd_supine is not None
            else None
        )
        delta_rr = (
            (rr_supine - rr_stand)
            if rr_supine is not None and rr_stand is not None
            else None
        )

        rows.append(
            OrthostaticRow(
                date=test_dt.date(),
                test_time=test_dt,
                rmssd_supine=rmssd_supine,
                rmssd_stand=rmssd_stand,
                rr_supine_ms=rr_supine,
                rr_stand_ms=rr_stand,
                rr_min_standup_ms=res.rrMinStandup,
                delta_rmssd=delta_rmssd,
                delta_rr=delta_rr,
            )
        )

    log_pipeline(
        "L1",
        "parse_orthostatic",
        n_input,
        len(rows),
        f"parse error ×{dropped}" if dropped else None,
    )

    df = pd.DataFrame([r.model_dump() for r in rows])
    df["date"] = pd.to_datetime(df["date"])
    df["test_time"] = pd.to_datetime(df["test_time"])
    df = df.set_index("date").sort_index()
    return df


if __name__ == "__main__":
    out_dir = DATA_PROCESSED_DIR / "L1"
    out_dir.mkdir(parents=True, exist_ok=True)
    df = parse_orthostatic()
    out_path = out_dir / "orthostatic.parquet"
    df.to_parquet(out_path)
    print(f"Written {len(df)} rows → {out_path}")
