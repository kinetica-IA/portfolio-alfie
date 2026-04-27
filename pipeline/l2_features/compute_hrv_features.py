"""L2 feature computer: HRV features from raw RR interval arrays.

Reads rr_raw_arrays.parquet (L1 output) and computes time-domain and
frequency-domain HRV metrics via neurokit2 for each night with a
sufficient RR array. Nights with fewer than 100 valid intervals are
dropped — this is the minimum required for reliable frequency-domain
estimation (LF/HF power via Lomb-Scargle or Welch).

Polar's own RMSSD (from nightly_recovery.parquet) is cross-referenced but
not overwritten. The recalculated hrv_rmssd_calc serves as an internal
consistency check between the GDPR export and our own computation.
"""

from __future__ import annotations

import warnings
from pathlib import Path

import neurokit2 as nk
import numpy as np
import pandas as pd

from pipeline._logging import log_pipeline
from pipeline._schemas import DataFrameRow
from pipeline.config import DATA_PROCESSED_DIR

MIN_RR_COUNT: int = 100
# Frequency/nonlinear HRV requires a stationary segment; 400 intervals
# (~5-10 min at resting HR) is the standard clinical minimum window.
FREQ_WINDOW: int = 400


# ── Output schema ─────────────────────────────────────────────────────────────

class HRVFeaturesRow(DataFrameRow):
    """Per-night HRV features for hrv_features.parquet."""

    hrv_sdnn: float | None
    hrv_pnn50: float | None
    hrv_rmssd_calc: float | None
    hrv_lf_power: float | None
    hrv_hf_power: float | None
    hrv_lf_hf_ratio: float | None
    hrv_sd1: float | None
    hrv_sd2: float | None
    hrv_dfa_alpha1: float | None


# ── Helper ────────────────────────────────────────────────────────────────────

def _safe_get(d: dict, *keys: str) -> float | None:
    """Retrieve the first matching key from a dict, returning None if absent."""
    for k in keys:
        val = d.get(k)
        if val is not None and not (isinstance(val, float) and np.isnan(val)):
            return float(val)
    return None


# ── Feature computer ──────────────────────────────────────────────────────────

def compute_hrv_features(raw_arrays_path: Path | None = None) -> pd.DataFrame:
    """Compute time-domain and frequency-domain HRV metrics from raw RR arrays.

    For each night, neurokit2.hrv() is called on the cleaned RR interval
    array. Nights with fewer than MIN_RR_COUNT intervals are excluded as
    insufficient for frequency-domain analysis.

    Args:
        raw_arrays_path: Path to rr_raw_arrays.parquet. Defaults to
            data/processed/L1/rr_raw_arrays.parquet.

    Returns:
        DataFrame indexed by date with columns matching HRVFeaturesRow:
        hrv_sdnn, hrv_pnn50, hrv_rmssd_calc, hrv_lf_power, hrv_hf_power,
        hrv_lf_hf_ratio, hrv_sd1, hrv_sd2, hrv_dfa_alpha1.

    Raises:
        FileNotFoundError: If the raw arrays parquet does not exist.

    Example:
        >>> df = compute_hrv_features()
        [L2:compute_hrv_features] 239 input → N valid → K dropped (reason: insufficient RR samples)
    """
    if raw_arrays_path is None:
        raw_arrays_path = DATA_PROCESSED_DIR / "L1" / "rr_raw_arrays.parquet"

    if not raw_arrays_path.exists():
        raise FileNotFoundError(f"rr_raw_arrays.parquet not found: {raw_arrays_path}")

    raw_df = pd.read_parquet(raw_arrays_path)
    n_input = len(raw_df)

    rows: list[dict] = []
    dropped_insufficient = 0
    dropped_error = 0

    for date_idx, row in raw_df.iterrows():
        arr: np.ndarray = row["rr_intervals_ms"]
        if len(arr) < MIN_RR_COUNT:
            dropped_insufficient += 1
            continue

        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                # Full array → time-domain (SDNN, RMSSD, pNN50 are stable over long windows)
                peaks_full = nk.intervals_to_peaks(arr)
                td = nk.hrv_time(peaks_full, sampling_rate=1000, show=False).iloc[0].to_dict()

                # 400-interval window → frequency-domain and nonlinear (require stationarity)
                window = arr[:FREQ_WINDOW]
                peaks_w = nk.intervals_to_peaks(window)
                fd = nk.hrv_frequency(peaks_w, sampling_rate=1000, show=False).iloc[0].to_dict()
                nl = nk.hrv_nonlinear(peaks_w, sampling_rate=1000, show=False).iloc[0].to_dict()

            lf = _safe_get(fd, "HRV_LF")
            hf = _safe_get(fd, "HRV_HF")
            lf_hf = (lf / hf) if (lf is not None and hf is not None and hf > 0) else None

            rows.append(
                {
                    "date": date_idx,
                    "hrv_sdnn": _safe_get(td, "HRV_SDNN"),
                    "hrv_pnn50": _safe_get(td, "HRV_pNN50"),
                    "hrv_rmssd_calc": _safe_get(td, "HRV_RMSSD"),
                    "hrv_lf_power": lf,
                    "hrv_hf_power": hf,
                    "hrv_lf_hf_ratio": lf_hf,
                    "hrv_sd1": _safe_get(nl, "HRV_SD1"),
                    "hrv_sd2": _safe_get(nl, "HRV_SD2"),
                    "hrv_dfa_alpha1": _safe_get(nl, "HRV_DFA_alpha1"),
                }
            )
        except Exception:
            dropped_error += 1
            continue

    n_dropped = dropped_insufficient + dropped_error
    reason_parts = []
    if dropped_insufficient:
        reason_parts.append(f"insufficient RR samples (<{MIN_RR_COUNT}) ×{dropped_insufficient}")
    if dropped_error:
        reason_parts.append(f"computation error ×{dropped_error}")
    log_pipeline(
        "L2",
        "compute_hrv_features",
        n_input,
        n_input - n_dropped,
        "; ".join(reason_parts) if reason_parts else None,
    )

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date").sort_index()
    return df


if __name__ == "__main__":
    out_dir = DATA_PROCESSED_DIR / "L2"
    out_dir.mkdir(parents=True, exist_ok=True)
    df = compute_hrv_features()
    out_path = out_dir / "hrv_features.parquet"
    df.to_parquet(out_path)
    print(f"Written {len(df)} rows → {out_path}")
