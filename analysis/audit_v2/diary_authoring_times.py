#!/usr/bin/env python3
"""Audit v2 / C2 — reconstruct when each diary row was actually authored.

data/diary_live.csv carries no entry timestamp. Git does: every row entered the
file in some commit, and the commit's author date is an upper bound on when the
subject wrote it. This walks the file's history and reports, per diary date,
the commit in which that date first appeared.

Requires a full (non-shallow) clone: run `git fetch --unshallow origin` first.
Read-only.
"""

from __future__ import annotations

import csv
import io
import statistics
import subprocess
from collections import Counter
from datetime import datetime


def sh(*args: str) -> str:
    return subprocess.run(args, capture_output=True, text=True).stdout


def main() -> None:
    if sh("git", "rev-parse", "--is-shallow-repository").strip() == "true":
        print("WARNING: shallow clone — authoring times will be wrong. "
              "Run: git fetch --unshallow origin")

    log = sh("git", "log", "--format=%H|%aI", "--follow", "--reverse",
             "--", "data/diary_live.csv").strip().splitlines()

    first_seen: dict[str, str] = {}
    for line in log:
        sha, ts = line.split("|")
        blob = sh("git", "show", f"{sha}:data/diary_live.csv")
        if not blob:
            continue
        for row in csv.DictReader(io.StringIO(blob)):
            first_seen.setdefault(row["date"], ts)

    print(f"commits touching data/diary_live.csv: {len(log)}")
    print(f"distinct diary dates ever present:    {len(first_seen)}\n")

    print(f"{'diary_date':<12} {'first authored at':<27} {'lag_days':>9}")
    lags = []
    for d in sorted(first_seen):
        ts = first_seen[d]
        lag = ((datetime.fromisoformat(ts)
                - datetime.fromisoformat(d + "T00:00:00+00:00")).total_seconds()
               / 86400.0)
        lags.append(lag)
        print(f"{d:<12} {ts:<27} {lag:>9.2f}")

    n = len(lags)
    print(f"\nlag (days between the day described and the day it was written):")
    print(f"  min={min(lags):.2f}  median={statistics.median(lags):.2f}  "
          f"max={max(lags):.2f}  mean={statistics.mean(lags):.2f}")
    for k in (2, 7, 30, 90):
        print(f"  authored >{k:>2}d after the reported day: "
              f"{sum(1 for x in lags if x > k)}/{n}")
    print(f"  authored within 2d of the reported day:  "
          f"{sum(1 for x in lags if abs(x) <= 2)}/{n}")

    print("\nauthoring sessions (commit timestamp -> diary dates written):")
    for ts, c in sorted(Counter(first_seen.values()).items()):
        print(f"  {ts}  ->  {c}")


if __name__ == "__main__":
    main()
