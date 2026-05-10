Last verified: 2026-05-10, all steps exit 0, 243 rows, AUC 0.829 [0.715, 0.936]

## Pipeline B — full local run order

### L1 — Structured extract

1. `uv run python -m pipeline.l1_extract.parse_nightly_recovery`
2. `uv run python -m pipeline.l1_extract.parse_sleep`
3. `uv run python -m pipeline.l1_extract.parse_ppi_samples`
4. `uv run python -m pipeline.l1_extract.parse_activity`
5. `uv run python -m pipeline.l1_extract.parse_247ohr`
6. `uv run python -m pipeline.l1_extract.parse_orthostatic`
7. `uv run python -m pipeline.l1_extract.parse_fitness_test`
8. `uv run python -m pipeline.l1_extract.parse_training_session`

### L2 — Derived features

9. `uv run python -m pipeline.l2_features.compute_hrv_features`
10. `uv run python -m pipeline.l2_features.compute_zone_distribution`
11. `uv run python -m pipeline.l2_features.compute_session_strata`

### L3 — Unified daily frame

12. `uv run python -m pipeline.l3_unified`

### L4 — Diary join

13. `uv run python -m pipeline.l4_diary_join`

### L5 — Model + publish

14. `uv run python -m pipeline.l5_retrain`
15. `uv run python -m pipeline.l5_publish`

### L6 — Pipeline state

16. `uv run python -m pipeline.l6_publish_state`
