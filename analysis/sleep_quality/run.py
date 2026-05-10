"""SleepQuality analysis — fatiga predictor from L4 diary features."""

from __future__ import annotations

import json
from pathlib import Path

from analysis.base import BaseAnalysis
from pipeline.config import DATA_PROCESSED_DIR

import analysis.sleep_quality.l5_retrain as l5_retrain
import analysis.sleep_quality.l5_publish as l5_publish


class SleepQualityAnalysis(BaseAnalysis):

    def load(self, unified_csv: Path, diary_csv: Path | None = None) -> None:
        """Verify that L4 diary_features.csv exists and has the fatiga column."""
        import pandas as pd
        diary_features_path = DATA_PROCESSED_DIR / "L4" / "diary_features.csv"
        if not diary_features_path.exists():
            raise FileNotFoundError(f"diary_features.csv not found: {diary_features_path}")
        cols = pd.read_csv(diary_features_path, nrows=0).columns.tolist()
        if "fatiga" not in cols:
            raise ValueError("diary_features.csv does not contain required column 'fatiga'")
        print(f"  verified: {diary_features_path} ({len(cols)} columns, 'fatiga' present)",
              flush=True)

    def run(self) -> dict:
        """Retrain fatiga LOO-CV model and write sleep_quality_results.json."""
        results = l5_retrain.retrain()
        out_dir = DATA_PROCESSED_DIR / "L5"
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "sleep_quality_results.json"
        out_path.write_text(json.dumps(results, indent=2, default=str))
        print(f"  Written → {out_path}", flush=True)
        return results

    def export(self, output_dir: Path) -> None:
        """Upsert sleep_quality block into polar_live.json."""
        l5_publish.publish()


if __name__ == "__main__":
    analysis = SleepQualityAnalysis()
    analysis.load(Path("."))
    results = analysis.run()
    analysis.export(DATA_PROCESSED_DIR / "L5")
