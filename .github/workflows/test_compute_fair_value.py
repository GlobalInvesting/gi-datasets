#!/usr/bin/env python3
"""
test_compute_fair_value.py — regression guards for compute_fair_value.py and
export_fair_value_history.py.

Run: python3 test_compute_fair_value.py   (or: pytest test_compute_fair_value.py)

Covers the two defects found in the v8.574.26 audit of the GBP pairs:
  1. A feature column that is constant in the training window but carries
     floating-point noise was not recognised as constant, so it was
     standardised into values of order 1e14.
  2. A scored row whose inputs lie far outside the region the trailing window
     was fitted on (a slow macro input stepping to a new level on the scored
     day) produced a fair value and z that were pure extrapolation (z = 37 on
     GBPAUD). Such rows are now re-fitted without the one input causing it
     (published as Regularized, with excluded_inputs), or withheld if no
     single exclusion restores support.
"""
import math
import os
import random
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import compute_fair_value as cfv  # noqa: E402


def _rows(n, ca_step_on_last=False, seed=7, also_prod=False):
    rng = random.Random(seed)
    rows = []
    spot = 1.0
    for i in range(n):
        spot += rng.uniform(-0.004, 0.004)
        rows.append({
            "date": f"2026-01-{i + 1:03d}",
            "spot": spot,
            "rate_diff": 1.0 + rng.uniform(-0.3, 0.3),
            "stress": float(rng.choice([0, 1, 2])),
            "ca_diff": 0.84 + (0.0162 if i >= n - 30 else 0.0),
            "tb_diff": -9.0 + rng.choice([0.0, 0.5, 1.0]),
            "prod_diff": 1.5 if i < n - 20 else -0.2,
        })
    if ca_step_on_last:
        rows[-1]["ca_diff"] = 1.13
    if also_prod:
        rows[-1]["prod_diff"] = 9.0
    return rows


def test_constant_column_with_float_noise_is_standardised_as_constant():
    base = 0.1 + 0.2
    rows = [dict(r) for r in _rows(40)]
    for i, r in enumerate(rows):
        r["ca_diff"] = base + (1e-16 if i % 2 else 0.0)
    _, sigma = cfv._fv_standardize(rows)
    assert sigma["ca_diff"] == 1.0


def test_real_variation_is_not_treated_as_constant():
    rows = _rows(40)
    _, sigma = cfv._fv_standardize(rows)
    assert sigma["ca_diff"] > 1e-4
    assert sigma["tb_diff"] > 0.1


def test_in_support_row_is_scored():
    rows = _rows(70)
    out = cfv.compute_pair_summary(rows)
    assert "error" not in out
    assert out["fairValue"] is not None and out["z"] is not None
    assert abs(out["z"]) < 6


def test_single_extrapolating_input_is_excluded_and_labelled_regularized():
    rows = _rows(70, ca_step_on_last=True)
    out = cfv.compute_pair_summary(rows)
    assert "error" not in out
    assert out["excluded_inputs"] == ["ca_diff"]
    assert out["identifiable"] is False and out["fit"] == "Regularized"
    assert out["z"] is not None and abs(out["z"]) < 6


def test_row_with_two_extrapolating_inputs_is_withheld():
    rows = _rows(70, ca_step_on_last=True, also_prod=True)
    out = cfv.compute_pair_summary(rows)
    assert out.get("error") == "out_of_support"
    assert "z" not in out and "fairValue" not in out
    assert out["spot"] == rows[-1]["spot"]


def test_in_support_row_has_no_exclusion():
    out = cfv.compute_pair_summary(_rows(70))
    assert "excluded_inputs" not in out


def test_support_ratio_flags_only_the_extrapolating_row():
    ok = _rows(70)
    jump = _rows(70, ca_step_on_last=True)
    lam = 1.0
    in_ratio = cfv.fv_support_ratio(ok[-60:-1], ok[-1], lam)
    out_ratio = cfv.fv_support_ratio(jump[-60:-1], jump[-1], lam)
    assert in_ratio is not None and in_ratio <= cfv.FV_EXTRAPOLATION_FACTOR
    assert out_ratio is not None and out_ratio > cfv.FV_EXTRAPOLATION_FACTOR


def test_score_row_matches_manual_fair_value_for_in_support_row():
    rows = _rows(70)
    train = rows[-60:-1]
    scored = cfv.fv_score_row(train, rows[-1])
    assert scored["status"] == "computed"
    reg = cfv.fv_regress(train)
    fv = reg["beta"][0] + sum(reg["beta"][i + 1] * rows[-1][k] for i, k in enumerate(cfv.FV_FEATURE_KEYS))
    assert math.isclose(scored["fair_value"], fv, rel_tol=1e-12)
    assert math.isclose(scored["z"], (rows[-1]["spot"] - fv) / reg["residStd"], rel_tol=1e-12)


def test_export_marks_reduced_and_withheld_rows():
    import export_fair_value_history as ex

    reduced = ex.export_pair_history("testpair", _rows(70, ca_step_on_last=True))[-1]
    assert reduced["model_status"] == "computed_reduced"
    assert reduced["fit"] == "Regularized" and reduced["z_score"] != ""

    withheld = ex.export_pair_history("testpair", _rows(70, ca_step_on_last=True, also_prod=True))[-1]
    assert withheld["model_status"] == "out_of_support"
    assert withheld["fair_value"] == "" and withheld["z_score"] == ""


def test_summary_and_export_agree_on_last_row():
    import export_fair_value_history as ex

    for kwargs in ({}, {"ca_step_on_last": True}, {"ca_step_on_last": True, "also_prod": True}):
        rows = _rows(70, **kwargs)
        summary = cfv.compute_pair_summary(rows)
        last = ex.export_pair_history("testpair", rows)[-1]
        if "z" in summary:
            assert last["model_status"].startswith("computed")
            assert math.isclose(float(last["z_score"]), summary["z"], abs_tol=1e-4)
        else:
            assert last["model_status"] == "out_of_support"


if __name__ == "__main__":
    tests = [(n, f) for n, f in sorted(globals().items()) if n.startswith("test_") and callable(f)]
    failed = 0
    for name, fn in tests:
        try:
            fn()
            print(f"PASS {name}")
        except Exception as e:
            failed += 1
            print(f"FAIL {name}: {type(e).__name__}: {e}")
    print(f"{len(tests) - failed} passed, {failed} failed")
    sys.exit(1 if failed else 0)
