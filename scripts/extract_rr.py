#!/usr/bin/env python3
"""Extract nightly RR intervals from Polar PPI samples ZIP.

Extracts 22:00-06:00 window, applies NN filtering (removes ectopic beats),
and writes one row per valid night.
"""

import csv
import json
import zipfile
from datetime import datetime, timedelta
from collections import defaultdict

ZIP_PATH = "/Users/alfonsonavarro/Desktop/datos_nuevos_polar.zip"
OUTPUT = "data/hrv_rr_nightly.csv"
MIN_RR = 300
MAX_RR = 2000
MIN_SAMPLES = 1000
NIGHT_START_HOUR = 22
NIGHT_END_HOUR = 6
NN_THRESHOLD = 0.20  # remove RR where diff > 20% of previous


def assign_night(dt_str):
    """Assign a datetime string to a night date (the date when night starts).
    Night of date X = X 22:00 → X+1 06:00."""
    dt = datetime.fromisoformat(dt_str)
    if dt.hour >= NIGHT_START_HOUR:
        return dt.date().isoformat()
    elif dt.hour < NIGHT_END_HOUR:
        return (dt.date() - timedelta(days=1)).isoformat()
    return None


def nn_filter(rr_list):
    """Filter to Normal-to-Normal intervals: remove ectopic beats."""
    if len(rr_list) < 2:
        return rr_list
    filtered = [rr_list[0]]
    for i in range(1, len(rr_list)):
        if abs(rr_list[i] - rr_list[i - 1]) <= NN_THRESHOLD * rr_list[i - 1]:
            filtered.append(rr_list[i])
    return filtered


def main():
    nights = defaultdict(list)

    with zipfile.ZipFile(ZIP_PATH) as z:
        ppi_files = sorted(f for f in z.namelist() if "ppi_samples" in f.lower())
        print(f"PPI files found: {len(ppi_files)}")

        for pf in ppi_files:
            data = json.loads(z.read(pf))
            for day_entry in data:
                for device in day_entry.get("devicePpiSamplesList", []):
                    for sample in device.get("ppiSamples", []):
                        rr = sample["pulseLength"]
                        if rr < MIN_RR or rr > MAX_RR:
                            continue
                        night = assign_night(sample["sampleDateTime"])
                        if night is not None:
                            nights[night].append(rr)

    valid = 0
    discarded = 0
    with open(OUTPUT, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["date", "n_rr", "rr_intervals_json"])
        for date in sorted(nights.keys()):
            rrs = nn_filter(nights[date])
            if len(rrs) >= MIN_SAMPLES:
                writer.writerow([date, len(rrs), json.dumps(rrs)])
                valid += 1
            else:
                discarded += 1

    print(f"Total nights: {valid + discarded}")
    print(f"Valid (>={MIN_SAMPLES} RR): {valid}")
    print(f"Discarded: {discarded}")


if __name__ == "__main__":
    main()
