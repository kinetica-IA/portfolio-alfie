import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import numpy as np
import pandas as pd
import train_retrospective as train


class TemporalBenchmarkTests(unittest.TestCase):
    def fixtures(self, n=42):
        days = pd.date_range("2020-01-01", periods=n)
        X = pd.DataFrame({f"f{i}": np.cos(np.arange(n) * (i + 1)) for i in range(3)}, index=days)
        X.iloc[0, 0] = np.nan
        scores = pd.Series(np.where(np.arange(n) % 2, 7, 3), index=days)
        return X, scores

    def test_reserved_values_do_not_enter_training_preprocessing(self):
        X, scores = self.fixtures()
        states = []
        original = train.fit_model

        def spy(frame, y):
            fitted = original(frame, y)
            states.append((len(frame), fitted["imputer"].statistics_.copy(),
                           fitted["classifier"].coef_.copy()))
            return fitted

        with patch.object(train, "fit_model", side_effect=spy):
            train.train_target(X, scores, 6)
        first = states[0]
        changed = X.copy()
        changed.iloc[30:] = 100000
        changed_scores = scores.copy()
        changed_scores.iloc[30:] = 9
        states.clear()
        with patch.object(train, "fit_model", side_effect=spy):
            train.train_target(changed, changed_scores, 6)
        second = states[0]
        self.assertEqual(first[0], 30)
        np.testing.assert_allclose(first[1], second[1])
        np.testing.assert_allclose(first[2], second[2])

    def test_evaluation_only_uses_earlier_dates(self):
        X, scores = self.fixtures()
        metrics, private = train.train_target(X, scores, 6)
        self.assertEqual(metrics["evaluated_observations"], 12)
        self.assertEqual(metrics["skipped_folds"], 0)
        for row in private["evaluation_trace"]:
            self.assertLess(row["train_end"], row["test_date"])
            self.assertEqual(row["train_rows"], row["test_position"])

    def test_calendar_lag_is_not_previous_available_row(self):
        index = pd.to_datetime(["2020-01-01", "2020-01-03"])
        daily = pd.DataFrame({f: [10.0, 30.0] for f in train.FEATURES}, index=index)
        diary = pd.DataFrame({"fatiga": [4]}, index=index[1:])
        X, _ = train.pair_inputs(daily, diary)
        self.assertEqual(X.iloc[0]["hrv_rmssd_night_t0"], 30)
        self.assertTrue(pd.isna(X.iloc[0]["hrv_rmssd_night_t1"]))

    def test_one_class_history_is_skipped_not_replaced_by_fake_fit(self):
        X, scores = self.fixtures()
        scores[:] = 8
        metrics, private = train.train_target(X, scores, 6)
        self.assertEqual(metrics["evaluated_observations"], 0)
        self.assertEqual(metrics["skipped_folds"], 12)
        self.assertIsNone(metrics["auroc"])
        self.assertFalse(metrics["final_fit"])
        self.assertEqual(private["model"], {})

    def test_public_output_has_no_personal_rows_or_input_paths(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)
            index = pd.date_range("2020-01-01", periods=42)
            daily = pd.DataFrame({f: 10 + np.sin(np.arange(42)) for f in train.FEATURES}, index=index)
            diary = pd.DataFrame({col: np.where(np.arange(42) % 2, 7, 3)
                                  for col, _ in train.TARGETS.values()}, index=index)
            diary["nota"] = "PRIVATE_NOTE_NEVER_PUBLISH"
            daily.to_csv(path / "daily.csv", index_label="date")
            diary.to_csv(path / "diary.csv", index_label="date")
            report = train.run(path / "daily.csv", path / "diary.csv", path / "result", "2026-11-15")
            text = json.dumps(report)
            for forbidden in ["PRIVATE_NOTE_NEVER_PUBLISH", str(path), "evaluation_trace", "2020-01-01", "coefficients", "imputer_median"]:
                self.assertNotIn(forbidden, text)
            self.assertEqual(report["participants"], 1)
            self.assertEqual(len(report["results"]), 5)


if __name__ == "__main__":
    unittest.main()
