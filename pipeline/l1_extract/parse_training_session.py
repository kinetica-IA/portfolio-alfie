"""L1 parser: Polar training session files (142 individual JSONs).

Each file represents one session. Multiple sessions per day are possible,
so the output is indexed by session_start_time (datetime), not by date.
Aggregation to per-day zone distribution is handled by L2.

Zone durations are stored in the session JSON as milliseconds inside
exercises[0].zones[type=ZONE_TYPE_HEART_RATE].zones[0-4].inZone.
Missing inZone fields (no time in that zone) default to 0.
"""

from __future__ import annotations

import json
from datetime import date, datetime
from pathlib import Path

import pandas as pd
from pydantic import ValidationError

from pipeline._logging import log_pipeline
from pipeline._schemas import PipelineModel
from pipeline.config import DATA_PROCESSED_DIR, RAW_DATA_DIR


# ── Input schema ────────────────────────────────────────────────────────────

class TrainingSessionRaw(PipelineModel):
    """Core fields from a Polar training session JSON."""

    startTime: str
    durationMillis: int | None = None
    calories: int | None = None
    hrAvg: int | None = None
    hrMax: int | None = None
    sport: dict | None = None
    exercises: list[dict] | None = None


# ── Output schema ────────────────────────────────────────────────────────────

class TrainingSessionRow(PipelineModel):
    """One row per training session (NOT per day)."""

    date: date
    session_start_time: datetime
    duration_min: float
    calories: int | None
    avg_hr: int | None
    max_hr: int | None
    sport: str
    zone1_min: float
    zone2_min: float
    zone3_min: float
    zone4_min: float
    zone5_min: float


# ── Zone extraction helper ───────────────────────────────────────────────────

def _extract_hr_zones(exercises: list[dict] | None) -> tuple[float, float, float, float, float]:
    """Extract zone 1-5 durations in minutes from exercises zone data.

    Looks for the ZONE_TYPE_HEART_RATE zone type in the first exercise.
    Zones are stored in order (index 0 = zone 1). Returns zeros if not found.

    Args:
        exercises: List of exercise dicts from session JSON.

    Returns:
        Tuple of (z1_min, z2_min, z3_min, z4_min, z5_min).
    """
    if not exercises:
        return 0.0, 0.0, 0.0, 0.0, 0.0

    for exercise in exercises:
        for zone_group in exercise.get("zones", []):
            if zone_group.get("type") == "ZONE_TYPE_HEART_RATE":
                zones = zone_group.get("zones", [])
                # zones list is ordered z1..z5; inZone is in milliseconds
                def _ms_to_min(i: int) -> float:
                    if i >= len(zones):
                        return 0.0
                    return zones[i].get("inZone", 0) / 60_000.0

                return (
                    _ms_to_min(0),
                    _ms_to_min(1),
                    _ms_to_min(2),
                    _ms_to_min(3),
                    _ms_to_min(4),
                )
    return 0.0, 0.0, 0.0, 0.0, 0.0


# ── Parser ────────────────────────────────────────────────────────────────────

def parse_training_session(input_files: list[Path] | None = None) -> pd.DataFrame:
    """Parse Polar training session JSONs to a per-session DataFrame.

    Index is session_start_time (datetime); date is kept as a column for
    easy daily grouping in L2. Multiple sessions per day are preserved.

    Args:
        input_files: List of training-session-*.json paths. If None,
            auto-discovers all from RAW_DATA_DIR.

    Returns:
        DataFrame indexed by session_start_time with columns:
        date, duration_min, calories, avg_hr, max_hr, sport,
        zone1_min through zone5_min.

    Raises:
        FileNotFoundError: If RAW_DATA_DIR has no training session files.

    Example:
        >>> df = parse_training_session()
        [L1:parse_training_session] 142 input → 142 valid
        >>> len(df)
        142
    """
    if input_files is None:
        input_files = sorted(RAW_DATA_DIR.glob("training-session-*.json"))
        if not input_files:
            raise FileNotFoundError(f"No training-session-*.json in {RAW_DATA_DIR}")

    n_input = len(input_files)
    rows: list[TrainingSessionRow] = []
    dropped = 0

    for path in input_files:
        try:
            with path.open() as fh:
                data = json.load(fh)
            raw = TrainingSessionRaw.model_validate(data)
            start_dt = datetime.fromisoformat(raw.startTime)
        except (json.JSONDecodeError, ValidationError, ValueError, TypeError):
            dropped += 1
            continue

        duration_min = (raw.durationMillis or 0) / 60_000.0
        sport_id = str((raw.sport or {}).get("id", "unknown"))
        z1, z2, z3, z4, z5 = _extract_hr_zones(raw.exercises)

        rows.append(
            TrainingSessionRow(
                date=start_dt.date(),
                session_start_time=start_dt,
                duration_min=duration_min,
                calories=raw.calories,
                avg_hr=raw.hrAvg,
                max_hr=raw.hrMax,
                sport=sport_id,
                zone1_min=z1,
                zone2_min=z2,
                zone3_min=z3,
                zone4_min=z4,
                zone5_min=z5,
            )
        )

    log_pipeline(
        "L1",
        "parse_training_session",
        n_input,
        len(rows),
        f"parse error ×{dropped}" if dropped else None,
    )

    df = pd.DataFrame([r.model_dump() for r in rows])
    df["session_start_time"] = pd.to_datetime(df["session_start_time"])
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("session_start_time").sort_index()
    return df


if __name__ == "__main__":
    out_dir = DATA_PROCESSED_DIR / "L1"
    out_dir.mkdir(parents=True, exist_ok=True)
    df = parse_training_session()
    out_path = out_dir / "training_session.parquet"
    df.to_parquet(out_path)
    print(f"Written {len(df)} rows → {out_path}")
