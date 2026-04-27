"""L1 parser: Polar daily activity files (242 individual JSONs).

The Polar GDPR export does not include step count or GPS distance in
activity files — only energy expenditure, MET minutes, and activity level
durations (sedentary, light, moderate, vigorous, non-wear).
These are used as-is; step data is not available in this export format.

Activity level durations derive from ISO 8601 fields in activityLevels[].
"""

from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path

import pandas as pd
from pydantic import ValidationError

from pipeline._logging import log_pipeline
from pipeline._schemas import DataFrameRow, PipelineModel
from pipeline.config import DATA_PROCESSED_DIR, RAW_DATA_DIR


# ── ISO duration helper (same contract as parse_sleep._iso_duration_to_minutes)

def _iso_to_minutes(s: str | None) -> float:
    """Convert ISO 8601 duration to decimal minutes; returns 0.0 on failure."""
    if not s:
        return 0.0
    m = re.fullmatch(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?", s.strip())
    if not m:
        return 0.0
    return float(m.group(1) or 0) * 60.0 + float(m.group(2) or 0) + float(m.group(3) or 0) / 60.0


# ── Input schema ──────────────────────────────────────────────────────────────

class ActivityRaw(PipelineModel):
    """Top-level fields from a Polar daily activity JSON."""

    date: str
    summary: dict | None = None


# ── Output schema ─────────────────────────────────────────────────────────────

class ActivityRow(DataFrameRow):
    """One row per day in the activity parquet."""

    daily_calories: int | None
    met_minutes: float | None
    sedentary_min: float | None
    light_min: float | None
    moderate_min: float | None
    vigorous_min: float | None
    non_wear_min: float | None


# ── Parser ────────────────────────────────────────────────────────────────────

def parse_activity(input_files: list[Path] | None = None) -> pd.DataFrame:
    """Parse Polar daily activity JSONs to a per-day DataFrame.

    Extracts calories, MET minutes, and activity level durations.
    Step count and GPS distance are not present in Polar GDPR exports.

    Args:
        input_files: List of activity-*.json paths. If None, auto-discovers
            all from RAW_DATA_DIR.

    Returns:
        DataFrame indexed by date with columns matching ActivityRow.

    Raises:
        FileNotFoundError: If RAW_DATA_DIR has no activity files.

    Example:
        >>> df = parse_activity()
        [L1:parse_activity] 242 input → 242 valid
        >>> df.shape[1]
        7
    """
    if input_files is None:
        input_files = sorted(RAW_DATA_DIR.glob("activity-*.json"))
        if not input_files:
            raise FileNotFoundError(f"No activity-*.json in {RAW_DATA_DIR}")

    n_input = len(input_files)
    rows: list[ActivityRow] = []
    dropped = 0

    for path in input_files:
        try:
            with path.open() as fh:
                data = json.load(fh)
            raw = ActivityRaw.model_validate(data)
            day = date.fromisoformat(raw.date)
        except (json.JSONDecodeError, ValidationError, ValueError, TypeError):
            dropped += 1
            continue

        summ = raw.summary or {}
        levels: dict[str, float] = {}
        for level_entry in summ.get("activityLevels", []):
            lvl = level_entry.get("level", "")
            dur = _iso_to_minutes(level_entry.get("duration"))
            levels[lvl] = levels.get(lvl, 0.0) + dur

        # CONTINUOS_MODERATE + INTERMITTENT_MODERATE → moderate
        moderate = levels.get("CONTINUOS_MODERATE", 0.0) + levels.get("INTERMITTENT_MODERATE", 0.0)
        vigorous = levels.get("CONTINUOS_VIGOROUS", 0.0) + levels.get("INTERMITTENT_VIGOROUS", 0.0)

        rows.append(
            ActivityRow(
                date=day,
                daily_calories=summ.get("calories"),
                met_minutes=summ.get("dailyMetMinutes"),
                sedentary_min=levels.get("SEDENTARY") or None,
                light_min=levels.get("LIGHT") or None,
                moderate_min=moderate or None,
                vigorous_min=vigorous or None,
                non_wear_min=levels.get("NON_WEAR") or None,
            )
        )

    log_pipeline(
        "L1",
        "parse_activity",
        n_input,
        len(rows),
        f"parse error ×{dropped}" if dropped else None,
    )

    df = pd.DataFrame([r.model_dump() for r in rows])
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date").sort_index()
    return df


if __name__ == "__main__":
    out_dir = DATA_PROCESSED_DIR / "L1"
    out_dir.mkdir(parents=True, exist_ok=True)
    df = parse_activity()
    out_path = out_dir / "activity.parquet"
    df.to_parquet(out_path)
    print(f"Written {len(df)} rows → {out_path}")
