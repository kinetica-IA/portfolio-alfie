#!/usr/bin/env python3
"""Merge computed HRV features into polar_live.json.

Adds new columns from hrv_features.csv to existing series entries.
Does NOT overwrite existing columns. Does NOT touch predictor or finding.
"""

import csv
import json

HRV_CSV = "data/hrv_features.csv"
POLAR_JSON = "public/data/polar_live.json"

# Features to merge (hrv_rmssd_calc excluded — hrv_rmssd_night already exists from Polar)
MERGE_COLS = [
    "hrv_sdnn",
    "hrv_pnn50",
    "hrv_lf_power",
    "hrv_hf_power",
    "hrv_lf_hf_ratio",
    "hrv_sd1",
    "hrv_sd2",
    "hrv_dfa_alpha1",
]


def main():
    with open(HRV_CSV) as f:
        hrv_by_date = {r["date"]: r for r in csv.DictReader(f)}

    with open(POLAR_JSON) as f:
        polar = json.load(f)

    series = polar["series"]
    series_by_date = {s["date"]: s for s in series}

    merged = 0
    no_match = 0

    for date, hrv_row in sorted(hrv_by_date.items()):
        if date not in series_by_date:
            no_match += 1
            continue

        entry = series_by_date[date]
        added = False
        for col in MERGE_COLS:
            val = hrv_row.get(col)
            if val and val != "None" and val != "":
                entry[col] = round(float(val), 4)
                added = True

        if added:
            merged += 1

    with open(POLAR_JSON, "w") as f:
        json.dump(polar, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Fechas mergeadas: {merged}")
    print(f"Fechas sin match en polar_live: {no_match}")
    print(f"Nuevas claves: {MERGE_COLS}")


if __name__ == "__main__":
    main()
