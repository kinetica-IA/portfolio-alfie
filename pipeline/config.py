"""Pipeline configuration — paths and constants.

The raw data path lives OUTSIDE the repo because GDPR exports contain
sensitive personal cardiac data (raw RR intervals) that should not be
committed. This module is the single source of truth for that path.
"""

from pathlib import Path

REPO_ROOT: Path = Path(__file__).resolve().parent.parent

RAW_DATA_DIR: Path = Path.home() / "IO3" / "clinical_data_backup" / "polar_export_2026-04-27"

DATA_DIR: Path = REPO_ROOT / "data"
DATA_PROCESSED_DIR: Path = DATA_DIR / "processed"
DATA_RAW_DIR: Path = DATA_DIR / "raw"

PUBLIC_DATA_DIR: Path = REPO_ROOT / "public" / "data"

DIARY_FILE: Path = DATA_DIR / "diary_live.csv"
POLAR_LIVE_FILE: Path = PUBLIC_DATA_DIR / "polar_live.json"
PIPELINE_STATE_FILE: Path = PUBLIC_DATA_DIR / "pipeline_state.json"
