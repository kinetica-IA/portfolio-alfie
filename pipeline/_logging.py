"""Structured logging for pipeline functions.

Every public pipeline function emits a single line per call:
    [LEVEL:function_name] N input → M valid → K dropped (reason: ...)

This is the contract that makes the pipeline traceable. The notebook
walkthrough in step 4 will display these lines verbatim as evidence
of every drop and transformation.
"""

from __future__ import annotations
import sys


def log_pipeline(
    level: str,
    function: str,
    n_input: int,
    n_valid: int,
    reason: str | None = None,
) -> None:
    """Emit a structured pipeline log line.

    Args:
        level: One of "L1", "L2", "L3".
        function: Calling function name.
        n_input: Number of input items received.
        n_valid: Number of items that passed validation.
        reason: If items were dropped, human-readable reason.

    Example:
        >>> log_pipeline("L1", "parse_nightly_recovery", 216, 213, "rmssd <= 0")
        [L1:parse_nightly_recovery] 216 input → 213 valid → 3 dropped (reason: rmssd <= 0)
    """
    n_dropped: int = n_input - n_valid
    if n_dropped > 0 and reason:
        line = (
            f"[{level}:{function}] {n_input} input → {n_valid} valid "
            f"→ {n_dropped} dropped (reason: {reason})"
        )
    elif n_dropped > 0:
        line = (
            f"[{level}:{function}] {n_input} input → {n_valid} valid "
            f"→ {n_dropped} dropped"
        )
    else:
        line = f"[{level}:{function}] {n_input} input → {n_valid} valid"
    print(line, file=sys.stdout, flush=True)
