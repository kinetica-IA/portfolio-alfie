"""L1 parser: Polar sleep_result + sleep_score merged on night date.

sleep_result (226 nights): duration, efficiency, phases (REM/deep/wake),
interruptions — all ISO 8601 durations.
sleep_score (218 nights): numeric scores per dimension.
Left-merge on date produces 226 rows; 8 nights lack score data (NaN).
"""

from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path
from typing import Any

import pandas as pd
from pydantic import ValidationError

from pipeline._logging import log_pipeline
from pipeline._schemas import DataFrameRow, PipelineModel
from pipeline.config import DATA_PROCESSED_DIR, RAW_DATA_DIR


# ── ISO 8601 duration helper ─────────────────────────────────────────────────

def _iso_duration_to_minutes(s: str) -> float:
    """Convert an ISO 8601 duration string to decimal minutes.

    Handles hours, minutes, and seconds components. Does not support
    year/month designators (not used in Polar exports).

    Args:
        s: ISO 8601 duration, e.g. "PT8H1M30S", "PT44M", "PT0S".

    Returns:
        Duration in decimal minutes (e.g. "PT8H1M30S" → 481.5).

    Raises:
        ValueError: If the string is not a recognisable ISO 8601 duration.

    Example:
        >>> _iso_duration_to_minutes("PT8H1M30S")
        481.5
        >>> _iso_duration_to_minutes("PT44M")
        44.0
    """
    match = re.fullmatch(
        r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?",
        s.strip(),
    )
    if not match:
        raise ValueError(f"Unrecognised ISO 8601 duration: {s!r}")
    hours = float(match.group(1) or 0)
    minutes = float(match.group(2) or 0)
    seconds = float(match.group(3) or 0)
    return hours * 60.0 + minutes + seconds / 60.0


# ── Input schemas ────────────────────────────────────────────────────────────

class SleepResultRaw(PipelineModel):
    """Raw Polar sleep_result list item."""

    night: str
    evaluation: dict[str, Any] | None = None


class SleepScoreRaw(PipelineModel):
    """Raw Polar sleep_score list item."""

    night: str
    sleepScoreResult: dict[str, Any] | None = None


# ── Output schema ────────────────────────────────────────────────────────────

class SleepRow(DataFrameRow):
    """One row per night in the sleep parquet."""

    sleep_duration_h: float | None
    sleep_asleep_h: float | None
    sleep_efficiency_pct: float | None
    sleep_rem_pct: float | None
    sleep_deep_pct: float | None
    sleep_wake_min: float | None
    sleep_interruptions: int | None
    sleep_long_interruptions: int | None
    sleep_score: float | None
    sleep_continuity_score: float | None
    sleep_efficiency_score: float | None
    sleep_rem_score: float | None
    sleep_n3_score: float | None
    sleep_long_int_score: float | None


# ── Helpers ──────────────────────────────────────────────────────────────────

def _safe_minutes(value: str | None) -> float | None:
    """Convert an ISO duration to minutes, returning None on failure."""
    if value is None:
        return None
    try:
        return _iso_duration_to_minutes(value)
    except ValueError:
        return None


def _find_sleep_result_file() -> Path:
    """Return the single sleep_result JSON file from RAW_DATA_DIR.

    Raises:
        FileNotFoundError: If no sleep_result file is found.
    """
    candidates = list(RAW_DATA_DIR.glob("sleep_result_*.json"))
    if not candidates:
        raise FileNotFoundError(f"No sleep_result_*.json in {RAW_DATA_DIR}")
    return candidates[0]


def _find_sleep_score_file() -> Path:
    """Return the single sleep_score JSON file from RAW_DATA_DIR.

    Raises:
        FileNotFoundError: If no sleep_score file is found.
    """
    candidates = list(RAW_DATA_DIR.glob("sleep_score_*.json"))
    if not candidates:
        raise FileNotFoundError(f"No sleep_score_*.json in {RAW_DATA_DIR}")
    return candidates[0]


# ── Parser ───────────────────────────────────────────────────────────────────

def parse_sleep(
    result_file: Path | None = None,
    score_file: Path | None = None,
) -> pd.DataFrame:
    """Parse Polar sleep_result + sleep_score into a merged per-night DataFrame.

    Left-merges on night date (sleep_result is the left table). Nights present
    in sleep_result but not sleep_score will have null score columns. Drops
    rows with invalid dates or fully null payloads.

    Args:
        result_file: Path to sleep_result_*.json. Defaults to auto-discovery.
        score_file: Path to sleep_score_*.json. Defaults to auto-discovery.

    Returns:
        DataFrame indexed by date with columns matching SleepRow.

    Raises:
        FileNotFoundError: If either source file is missing.

    Example:
        >>> df = parse_sleep()
        [L1:parse_sleep:result] 226 input → 226 valid
        [L1:parse_sleep:score]  218 input → 218 valid
        [L1:parse_sleep:merged] 226 rows after outer merge
        >>> df.shape[1]
        14
    """
    if result_file is None:
        result_file = _find_sleep_result_file()
    if score_file is None:
        score_file = _find_sleep_score_file()

    # ── Parse sleep_result ───────────────────────────────────────────────────
    with result_file.open() as fh:
        result_records: list[dict] = json.load(fh)

    n_result = len(result_records)
    result_rows: list[dict] = []
    dropped_result = 0

    for rec in result_records:
        try:
            raw = SleepResultRaw.model_validate(rec)
            night_date = date.fromisoformat(raw.night)
        except (ValidationError, ValueError, TypeError):
            dropped_result += 1
            continue

        ev = raw.evaluation or {}
        analysis = ev.get("analysis") or {}
        phases = ev.get("phaseDurations") or {}
        interruptions = ev.get("interruptions") or {}

        span_min = _safe_minutes(ev.get("sleepSpan"))
        asleep_min = _safe_minutes(ev.get("asleepDuration"))
        wake_min = _safe_minutes(phases.get("wake"))

        result_rows.append(
            {
                "date": night_date,
                "sleep_duration_h": span_min / 60.0 if span_min is not None else None,
                "sleep_asleep_h": asleep_min / 60.0 if asleep_min is not None else None,
                "sleep_efficiency_pct": analysis.get("efficiencyPercent"),
                "sleep_rem_pct": phases.get("remPercentage"),
                "sleep_deep_pct": phases.get("deepPercentage"),
                "sleep_wake_min": wake_min,
                "sleep_interruptions": interruptions.get("totalCount"),
                "sleep_long_interruptions": interruptions.get("longCount"),
            }
        )

    log_pipeline("L1", "parse_sleep:result", n_result, len(result_rows),
                 f"invalid ×{dropped_result}" if dropped_result else None)

    # ── Parse sleep_score ────────────────────────────────────────────────────
    with score_file.open() as fh:
        score_records: list[dict] = json.load(fh)

    n_score = len(score_records)
    score_rows: list[dict] = []
    dropped_score = 0

    for rec in score_records:
        try:
            raw = SleepScoreRaw.model_validate(rec)
            night_date = date.fromisoformat(raw.night)
        except (ValidationError, ValueError, TypeError):
            dropped_score += 1
            continue

        sr = raw.sleepScoreResult or {}
        score_rows.append(
            {
                "date": night_date,
                "sleep_score": sr.get("sleepScore"),
                "sleep_continuity_score": sr.get("continuityScore"),
                "sleep_efficiency_score": sr.get("efficiencyScore"),
                "sleep_rem_score": sr.get("remScore"),
                "sleep_n3_score": sr.get("n3Score"),
                "sleep_long_int_score": sr.get("longInterruptionsScore"),
            }
        )

    log_pipeline("L1", "parse_sleep:score", n_score, len(score_rows),
                 f"invalid ×{dropped_score}" if dropped_score else None)

    # ── Merge ────────────────────────────────────────────────────────────────
    df_result = pd.DataFrame(result_rows)
    df_score = pd.DataFrame(score_rows)

    df = df_result.merge(df_score, on="date", how="left")
    log_pipeline("L1", "parse_sleep:merged", len(df_result), len(df))

    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date").sort_index()
    return df


if __name__ == "__main__":
    out_dir = DATA_PROCESSED_DIR / "L1"
    out_dir.mkdir(parents=True, exist_ok=True)
    df = parse_sleep()
    out_path = out_dir / "sleep.parquet"
    df.to_parquet(out_path)
    print(f"Written {len(df)} rows → {out_path}")
