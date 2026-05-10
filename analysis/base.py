"""
Base contract for all analysis modules.
Every analysis must implement load(), run(), and export().
"""
from abc import ABC, abstractmethod
from pathlib import Path

class BaseAnalysis(ABC):

    @abstractmethod
    def load(self, unified_csv: Path, diary_csv: Path | None = None) -> None:
        """Load L3 unified data and optional symptom diary."""

    @abstractmethod
    def run(self) -> dict:
        """Execute analysis. Return findings as a dict."""

    @abstractmethod
    def export(self, output_dir: Path) -> None:
        """Write results to output_dir (JSON, CSV, or parquet)."""
