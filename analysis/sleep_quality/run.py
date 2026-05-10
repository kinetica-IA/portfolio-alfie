"""
SleepQuality analysis — stub.
Consumes: data/processed/L3/daily_unified.csv
Diary:    not required
Status:   not implemented
"""
from analysis.base import BaseAnalysis
from pathlib import Path

class SleepQualityAnalysis(BaseAnalysis):
    def load(self, unified_csv: Path, diary_csv: Path | None = None):
        raise NotImplementedError

    def run(self) -> dict:
        raise NotImplementedError

    def export(self, output_dir: Path) -> None:
        raise NotImplementedError
