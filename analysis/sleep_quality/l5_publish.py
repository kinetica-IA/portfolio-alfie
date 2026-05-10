"""L5 sleep-quality publish: upsert "sleep_quality" key in polar_live.json.

Reads sleep_quality_results.json (L5 output) and the existing polar_live.json,
inserts or replaces the top-level "sleep_quality" key with the fatiga
TargetResult dict, then atomically swaps the file in place.

No other keys in polar_live.json are modified.

Atomic swap procedure: write to a .tmp sibling, validate it parses, then
rename. If any step fails, the existing file is untouched.

Run: python -m analysis.sleep_quality.l5_publish
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from pipeline._logging import log_pipeline
from pipeline.config import DATA_PROCESSED_DIR, POLAR_LIVE_FILE

SLEEP_QUALITY_KEY: str = "sleep_quality"


# ── Publish ────────────────────────────────────────────────────────────────────

def publish(
    target: Path | None = None,
    sleep_quality_results_path: Path | None = None,
) -> None:
    """Upsert "sleep_quality" block into polar_live.json atomically.

    Args:
        target: Destination path. Defaults to public/data/polar_live.json.
        sleep_quality_results_path: Path to sleep_quality_results.json.
            Defaults to data/processed/L5/sleep_quality_results.json.

    Raises:
        FileNotFoundError: If either source file is missing.
        ValueError: If sleep_quality_results.json lacks "fatiga" key, or if
            the generated JSON does not round-trip parse correctly.
    """
    if target is None:
        target = POLAR_LIVE_FILE
    if sleep_quality_results_path is None:
        sleep_quality_results_path = DATA_PROCESSED_DIR / "L5" / "sleep_quality_results.json"

    if not target.exists():
        raise FileNotFoundError(f"polar_live.json not found: {target}")
    if not sleep_quality_results_path.exists():
        raise FileNotFoundError(
            f"sleep_quality_results.json not found: {sleep_quality_results_path}"
        )

    payload = json.loads(target.read_text())
    sq_results = json.loads(sleep_quality_results_path.read_text())

    fatiga_block = sq_results.get("fatiga")
    if fatiga_block is None:
        raise ValueError("sleep_quality_results.json missing 'fatiga' key")

    old_auc = payload.get(SLEEP_QUALITY_KEY, {}).get("auc_loo", "—")
    payload[SLEEP_QUALITY_KEY] = fatiga_block
    new_auc = fatiga_block.get("auc_loo", "—")

    log_pipeline("L5", "sleep_quality:publish", 1, 1)
    print(
        f"  upsert '{SLEEP_QUALITY_KEY}': AUC {old_auc} → {new_auc} "
        f"(n={fatiga_block.get('n_training', '?')})",
        flush=True,
    )

    backup = target.with_name("polar_live.pre-sleep-quality.json")
    shutil.copy2(target, backup)
    size_kb_old = target.stat().st_size // 1024
    print(f"  backed up polar_live.json ({size_kb_old} KB) → {backup.name}", flush=True)

    tmp = target.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, indent=2, default=str))
    parsed = json.loads(tmp.read_text())
    if "schema_version" not in parsed:
        tmp.unlink(missing_ok=True)
        raise ValueError("Payload validation failed: schema_version missing after round-trip")

    tmp.replace(target)
    size_kb = target.stat().st_size // 1024
    log_pipeline("L5", "sleep_quality:publish:swap", 1, 1)
    print(f"  atomic swap completed → {target} ({size_kb} KB)", flush=True)


# ── Entry point ────────────────────────────────────────────────────────────────

def run() -> None:
    publish()


if __name__ == "__main__":
    run()
