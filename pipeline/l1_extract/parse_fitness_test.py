"""L1 parser: Polar fitness test results (VO2max estimates, 11 files).

Polar's OwnIndex is a non-invasive VO2max estimate based on resting HR,
age, sex, height, weight, and activity level. It is not a clinical VO2max
but tracks relative aerobic fitness trends reliably within-subject.
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


# ── Input schemas ─────────────────────────────────────────────────────────────

class FitnessTestResultRaw(PipelineModel):
    """fitnessTestResult sub-object from Polar fitness test JSON."""

    ownIndex: float | None = None
    fitnessClass: str | None = None


class FitnessTestRaw(PipelineModel):
    """Top-level Polar fitness test JSON."""

    startTime: str
    fitnessTestResult: FitnessTestResultRaw | None = None


# ── Output schema ─────────────────────────────────────────────────────────────

class FitnessTestRow(DataFrameRow):
    """One row per fitness test in the fitness_test parquet."""

    test_time: datetime
    vo2max_estimate: float | None
    fitness_class: str | None


# ── Parser ────────────────────────────────────────────────────────────────────

def parse_fitness_test(input_files: list[Path] | None = None) -> pd.DataFrame:
    """Parse Polar fitness test JSONs to a sparse per-test DataFrame.

    OwnIndex is stored as vo2max_estimate; fitnessClass as a normalised
    lowercase string (e.g. "VERY_GOOD" → "very_good").

    Args:
        input_files: List of fitness-test-results-*.json paths.
            If None, auto-discovers from RAW_DATA_DIR.

    Returns:
        DataFrame indexed by date with columns matching FitnessTestRow.
        Only 11 rows (one per test); sparse in the unified frame.

    Raises:
        FileNotFoundError: If RAW_DATA_DIR has no fitness test files.

    Example:
        >>> df = parse_fitness_test()
        [L1:parse_fitness_test] 11 input → 11 valid
        >>> df.shape
        (11, 3)
    """
    if input_files is None:
        input_files = sorted(RAW_DATA_DIR.glob("fitness-test-results-*.json"))
        if not input_files:
            raise FileNotFoundError(
                f"No fitness-test-results-*.json in {RAW_DATA_DIR}"
            )

    n_input = len(input_files)
    rows: list[FitnessTestRow] = []
    dropped = 0

    for path in input_files:
        try:
            with path.open() as fh:
                data = json.load(fh)
            raw = FitnessTestRaw.model_validate(data)
            test_dt = datetime.fromisoformat(raw.startTime)
        except (json.JSONDecodeError, ValidationError, ValueError, TypeError):
            dropped += 1
            continue

        res = raw.fitnessTestResult or FitnessTestResultRaw()
        fitness_class = (
            res.fitnessClass.lower() if res.fitnessClass else None
        )

        rows.append(
            FitnessTestRow(
                date=test_dt.date(),
                test_time=test_dt,
                vo2max_estimate=res.ownIndex,
                fitness_class=fitness_class,
            )
        )

    log_pipeline(
        "L1",
        "parse_fitness_test",
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
    df = parse_fitness_test()
    out_path = out_dir / "fitness_test.parquet"
    df.to_parquet(out_path)
    print(f"Written {len(df)} rows → {out_path}")
