#!/usr/bin/env python3
"""Compute HRV features from nightly RR intervals.

Uses scipy for frequency domain and numpy for everything else.
neurokit2 is only used for DFA alpha1.
"""

import csv
import json
import sys
import warnings

import numpy as np
from scipy import signal, interpolate

warnings.filterwarnings("ignore")
csv.field_size_limit(sys.maxsize)

INPUT = "data/hrv_rr_nightly.csv"
OUTPUT = "data/hrv_features.csv"

COLS = [
    "date", "hrv_sdnn", "hrv_rmssd_calc", "hrv_pnn50",
    "hrv_lf_power", "hrv_hf_power", "hrv_lf_hf_ratio",
    "hrv_sd1", "hrv_sd2", "hrv_dfa_alpha1",
]

# Frequency bands (Hz)
LF_BAND = (0.04, 0.15)
HF_BAND = (0.15, 0.4)
RESAMPLE_HZ = 4.0  # interpolation rate for frequency analysis
MAX_RR_FREQ = 5000  # subsample for frequency analysis


def time_domain(rr):
    """SDNN, RMSSD, pNN50 from RR intervals (ms)."""
    diffs = np.diff(rr)
    sdnn = float(np.std(rr, ddof=1))
    rmssd = float(np.sqrt(np.mean(diffs ** 2)))
    pnn50 = float(np.sum(np.abs(diffs) > 50) / len(diffs) * 100)
    return round(sdnn, 4), round(rmssd, 4), round(pnn50, 4)


def poincare(rr):
    """SD1 and SD2 from Poincaré plot."""
    x = rr[:-1]
    y = rr[1:]
    sd1 = float(np.std((y - x) / np.sqrt(2), ddof=1))
    sd2 = float(np.std((y + x) / np.sqrt(2), ddof=1))
    return round(sd1, 4), round(sd2, 4)


def frequency_domain(rr):
    """LF, HF power and LF/HF ratio via Welch PSD on interpolated RR."""
    if len(rr) > MAX_RR_FREQ:
        start = (len(rr) - MAX_RR_FREQ) // 2
        rr = rr[start:start + MAX_RR_FREQ]

    # Create time axis (cumulative sum in seconds)
    t = np.cumsum(rr) / 1000.0
    t = t - t[0]

    # Interpolate to uniform sampling
    f_interp = interpolate.interp1d(t, rr, kind="cubic", fill_value="extrapolate")
    t_uniform = np.arange(0, t[-1], 1.0 / RESAMPLE_HZ)
    rr_uniform = f_interp(t_uniform)

    # Welch PSD
    freqs, psd = signal.welch(rr_uniform, fs=RESAMPLE_HZ, nperseg=min(256, len(rr_uniform)))

    # Band power
    lf_idx = (freqs >= LF_BAND[0]) & (freqs < LF_BAND[1])
    hf_idx = (freqs >= HF_BAND[0]) & (freqs < HF_BAND[1])

    lf_power = float(np.trapz(psd[lf_idx], freqs[lf_idx]))
    hf_power = float(np.trapz(psd[hf_idx], freqs[hf_idx]))
    lf_hf = round(lf_power / hf_power, 4) if hf_power > 0 else None

    return round(lf_power, 4), round(hf_power, 4), lf_hf


def dfa_alpha1(rr, min_box=4, max_box=16):
    """Detrended Fluctuation Analysis alpha1 (short-term)."""
    N = len(rr)
    y = np.cumsum(rr - np.mean(rr))

    box_sizes = np.arange(min_box, max_box + 1)
    flucts = []

    for bs in box_sizes:
        n_segments = N // bs
        if n_segments < 1:
            continue
        y_cut = y[:n_segments * bs].reshape(n_segments, bs)
        x = np.arange(bs)
        # Fit linear trend per segment, compute residuals
        rms_list = []
        for seg in y_cut:
            coeffs = np.polyfit(x, seg, 1)
            trend = np.polyval(coeffs, x)
            rms_list.append(np.sqrt(np.mean((seg - trend) ** 2)))
        flucts.append(np.mean(rms_list))

    if len(flucts) < 2:
        return None

    log_bs = np.log(box_sizes[:len(flucts)])
    log_fl = np.log(flucts)
    alpha = float(np.polyfit(log_bs, log_fl, 1)[0])
    return round(alpha, 4)


def compute_night(rr):
    """Compute all HRV metrics for one night."""
    sdnn, rmssd, pnn50 = time_domain(rr)
    sd1, sd2 = poincare(rr)
    lf, hf, lf_hf = frequency_domain(rr)
    alpha1 = dfa_alpha1(rr)

    return {
        "hrv_sdnn": sdnn,
        "hrv_rmssd_calc": rmssd,
        "hrv_pnn50": pnn50,
        "hrv_lf_power": lf,
        "hrv_hf_power": hf,
        "hrv_lf_hf_ratio": lf_hf,
        "hrv_sd1": sd1,
        "hrv_sd2": sd2,
        "hrv_dfa_alpha1": alpha1,
    }


def main():
    with open(INPUT) as f:
        rows = list(csv.DictReader(f))

    results = []
    errors = 0

    for i, row in enumerate(rows):
        date = row["date"]
        try:
            rr = np.array(json.loads(row["rr_intervals_json"]), dtype=float)
            metrics = compute_night(rr)
            metrics["date"] = date
            results.append(metrics)
        except Exception as e:
            print(f"  ERROR {date}: {e}")
            results.append({"date": date})
            errors += 1

        if (i + 1) % 50 == 0:
            print(f"  Processed {i + 1}/{len(rows)}...")

    with open(OUTPUT, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=COLS)
        writer.writeheader()
        writer.writerows(results)

    valid = len(results) - errors
    print(f"\nNoches calculadas: {valid}")
    print(f"Noches con error: {errors}")

    for col in ["hrv_sdnn", "hrv_rmssd_calc", "hrv_lf_hf_ratio", "hrv_dfa_alpha1"]:
        vals = [float(r[col]) for r in results if r.get(col) and r[col] is not None]
        if vals:
            print(f"  {col} mean: {sum(vals)/len(vals):.2f}")


if __name__ == "__main__":
    main()
