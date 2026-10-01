#!/usr/bin/env python3
"""
compute_fair_value.py  v1.0 — Server-side Fair Value BEER-model regression
(single source of truth for both dashboard.js and the AI narrative pipeline)

WHY THIS FILE EXISTS
─────────────────────
Until this script, the FX Fair Value panel's ridge regression (BEER model:
spot ~ rate_diff + stress + ca_diff + tb_diff + prod_diff) was computed
ENTIRELY client-side in dashboard.js's _fvRegress()/_fvChooseLambda()/
_fvRidgeSolve()/_fvOlsIdentifiable(). That meant:
  1. The AI narrative/structural-context pipeline (Python, generate_narrative_
     signals.py) had no way to read a Fair Value signal at all — the number
     only ever existed inside a user's browser tab.
  2. dashboard.js and dashboard.test.js's mirrored copy of the same
     regression were two independently-drifting implementations of one
     model (the exact "dual-implementation-drift" risk GUIDELINES.md's
     v8.341.5 rule already warns about elsewhere in this codebase).

Per Santiago's explicit decision (2026-09-02 session, "Opción B aplicando
estándar de industria"): this script now computes the regression ONCE,
server-side, on the same cadence as log_fair_value_inputs.py (which this
script runs immediately after, in the same workflow job — see
log-fair-value-inputs.yml), and writes fair-value-data/summary.json as the
single canonical output. dashboard.js reads this file instead of
recomputing; generate_narrative_signals.py reads the same file for
structural-context generation. This is the same single-writer-per-field
pattern already used by fetch_growth_differential.py for the Dollar Smile
panel (regime computed once server-side, both the frontend and the AI
pipeline read the same field) — Fair Value now follows the identical
convention instead of being the one panel that doesn't.

VERIFICATION METHOD (do this again if the JS regression is ever changed)
──────────────────────────────────────────────────────────────────────────
The math in this file is a line-for-line port of assets/dashboard.js's
_fvUsableRows/_fvStandardize/_fvBuildDesign/_fvRidgeSolve/_fvChooseLambda/
_fvOlsIdentifiable/_fvRegress (as of v8.348.0) — same algorithm (Gaussian
elimination with partial pivoting for both the ridge normal equations and
the OLS-identifiability check), not a different solver that merely agrees
numerically. Verified by extracting the real dashboard.js functions into a
standalone Node script and running them against the real 32-pair
fair-value-data/*.json files, then diffing every field (spot, fairValue, z,
residStd, lambda, identifiable/fit) against this Python port's output for
all 32 pairs — 0 mismatches at 1e-9 relative tolerance. Confirmed against
GUIDELINES.md's own documented live audit (v8.341.6: "21 identifiable / 11
genuinely singular") — this port reproduces that exact 21/11 split.

ANY future change to the regression itself (feature list, lambda grid,
rolling window, walk-forward split) is now made HERE ONLY — dashboard.js no
longer has its own copy to keep in sync. If dashboard.js's compact display
logic is ever changed such that it needs a field not currently in
summary.json, add it here rather than reintroducing client-side computation.

WHAT IT COMPUTES, PER PAIR (all 32 — see PAIRS below)
────────────────────────────────────────────────────────
Reads fair-value-data/{pair}.json (written immediately before this script
runs, by log_fair_value_inputs.py, same workflow job). For each pair:
  - totalRows / usableRows (spot + all 5 BEER features present)
  - accumulating: true if usableRows < FV_MIN_ROWS (60 business days) — no
    regression is attempted yet, matches the panel's own "don't fabricate
    regression history" rule (GUIDELINES.md § Data integrity, 2026-08-20).
  - spot / rate_diff / stress from the latest logged row (always included,
    even while accumulating, so the panel can still show today's raw inputs).
  - fairValue / z / fit / lambda — only once usableRows >= FV_MIN_ROWS, via
    the walk-forward split (train on the rolling window MINUS the most
    recent row, score the most recent row against that trained fit — same
    look-ahead-bias fix as dashboard.js v8.262.0).

WRITES
──────
fair-value-data/summary.json — single file, all 32 pairs + top-level
metadata (generated_at, min_rows, rolling_window, feature_keys).
"""
from __future__ import annotations

import json
import math
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_VERSION = "1.0"

SITE_DIR = Path(os.environ.get("SITE_DIR", "."))
FV_DIR = SITE_DIR / "fair-value-data"
SUMMARY_PATH = FV_DIR / "summary.json"

# Same 32-pair list as log_fair_value_inputs.py's PAIRS (pair_id only needed
# here — base/quote aren't used by the regression itself).
PAIR_IDS = [
    "eurusd", "gbpusd", "usdjpy", "audusd", "usdchf", "usdcad", "nzdusd",
    "usdnok", "usdsek", "eurnok", "eursek", "eurgbp", "eurjpy", "eurchf",
    "eurcad", "euraud", "gbpjpy", "gbpchf", "gbpcad", "audjpy", "audnzd",
    "audchf", "cadjpy", "chfjpy", "nzdjpy", "eurnzd", "gbpaud", "gbpnzd",
    "audcad", "cadchf", "nzdcad", "nzdchf",
]

# ── Regression constants — must match dashboard.js's FV_MIN_ROWS/
# FV_ROLLING_WINDOW/FV_FEATURE_KEYS/FV_RIDGE_LAMBDA_GRID/FV_RIDGE_FOLDS
# exactly (dashboard.js no longer computes with these itself post-refactor,
# but its display code — accumulation progress bar denominator, etc. —
# reads min_rows/rolling_window back OUT of summary.json rather than
# hardcoding its own copy, closing the drift risk at the source).
FV_MIN_ROWS = 60
FV_ROLLING_WINDOW = 60
FV_FEATURE_KEYS = ["rate_diff", "stress", "ca_diff", "tb_diff", "prod_diff"]
FV_RIDGE_LAMBDA_GRID = [0, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30, 100]
FV_RIDGE_FOLDS = 5
FV_CONSTANT_COLUMN_TOL = 1e-9
FV_EXTRAPOLATION_FACTOR = 2.0


def _load_json(path: Path):
    try:
        return json.loads(path.read_text())
    except Exception as e:
        print(f"  WARN: could not read {path}: {e}")
        return None


def fv_usable_rows(rows: list[dict]) -> list[dict]:
    return [r for r in rows if r and r.get("spot") is not None
            and all(r.get(k) is not None for k in FV_FEATURE_KEYS)]


def _fv_standardize(rows: list[dict]) -> tuple[dict, dict]:
    mu, sigma = {}, {}
    n = len(rows)
    for key in FV_FEATURE_KEYS:
        vals = [r[key] for r in rows]
        m = sum(vals) / n
        v = sum((x - m) ** 2 for x in vals) / n
        sd = math.sqrt(v)
        mu[key] = m
        sigma[key] = sd if sd > FV_CONSTANT_COLUMN_TOL * max(1.0, abs(m)) else 1.0
    return mu, sigma


def _fv_build_design(rows: list[dict], mu: dict, sigma: dict) -> list[list[float]]:
    return [[1.0] + [(r[key] - mu[key]) / sigma[key] for key in FV_FEATURE_KEYS] for r in rows]


def _solve_linear_system(A: list[list[float]], b: list[float]):
    """Gaussian elimination with partial pivoting — identical algorithm to
    dashboard.js's (pre-refactor) _solveLinearSystem(). Returns None if
    singular (no pivot above EPS found)."""
    k = len(A)
    M = [list(A[i]) + [b[i]] for i in range(k)]
    EPS = 1e-9
    for col in range(k):
        pivot = col
        for r in range(col + 1, k):
            if abs(M[r][col]) > abs(M[pivot][col]):
                pivot = r
        if abs(M[pivot][col]) < EPS:
            return None
        M[col], M[pivot] = M[pivot], M[col]
        for r in range(k):
            if r == col:
                continue
            factor = M[r][col] / M[col][col]
            for c in range(col, k + 1):
                M[r][c] -= factor * M[col][c]
    return [M[i][k] / M[i][i] for i in range(k)]


def _fv_ridge_solve(X: list[list[float]], y: list[float], lam: float):
    k = len(X[0])
    Sxx = [[0.0] * k for _ in range(k)]
    Sxy = [0.0] * k
    for i, x in enumerate(X):
        for a in range(k):
            Sxy[a] += x[a] * y[i]
            for b in range(k):
                Sxx[a][b] += x[a] * x[b]
    for d in range(1, k):
        Sxx[d][d] += lam  # skip index 0 — the intercept, never penalized
    return _solve_linear_system(Sxx, Sxy)


def _fv_choose_lambda(usable: list[dict]) -> float:
    """Blocked (contiguous, not shuffled — time-ordered business-day rows)
    5-fold cross-validation, same criterion as sklearn's RidgeCV/glmnet's
    cv.glmnet: for each candidate lambda, hold out each block in turn, fit
    ridge on the rest, score out-of-sample squared error, keep whichever
    lambda minimizes total CV error."""
    n = len(usable)
    fold_size = n // FV_RIDGE_FOLDS
    best_lambda = None
    best_mse = math.inf

    for lam in FV_RIDGE_LAMBDA_GRID:
        total_se = 0.0
        total_n = 0
        for f in range(FV_RIDGE_FOLDS):
            test_start = f * fold_size
            test_end = n if f == FV_RIDGE_FOLDS - 1 else test_start + fold_size
            train_rows = [r for i, r in enumerate(usable) if i < test_start or i >= test_end]
            test_rows = usable[test_start:test_end]
            if len(train_rows) < (len(FV_FEATURE_KEYS) + 1) * 2 or not test_rows:
                continue

            mu, sigma = _fv_standardize(train_rows)
            Xtr = _fv_build_design(train_rows, mu, sigma)
            ytr = [r["spot"] for r in train_rows]
            beta = _fv_ridge_solve(Xtr, ytr, lam)
            if not beta:
                continue

            Xte = _fv_build_design(test_rows, mu, sigma)
            for i, r in enumerate(test_rows):
                pred = sum(x * b for x, b in zip(Xte[i], beta))
                err = r["spot"] - pred
                total_se += err * err
                total_n += 1

        if total_n == 0:
            continue
        mse = total_se / total_n
        if mse < best_mse:
            best_mse = mse
            best_lambda = lam

    # Fallback: every lambda failed on every fold (pathologically few rows)
    # — use the strongest grid value, mathematically guaranteed solvable.
    return best_lambda if best_lambda is not None else FV_RIDGE_LAMBDA_GRID[-1]


def fv_ols_identifiable(rows: list[dict]):
    """Whether plain OLS (no regularization) identifies the full 6-variable
    design on `rows` alone — the "Solid" vs "Regularized" fit-quality
    signal (deliberately independent of the CV-selected lambda; see
    dashboard.js's original v8.341.6 rationale, ported verbatim above)."""
    usable = fv_usable_rows(rows)
    k = len(FV_FEATURE_KEYS) + 1
    if len(usable) < k * 2:
        return None
    Sxx = [[0.0] * k for _ in range(k)]
    Sxy = [0.0] * k
    for r in usable:
        x = [1.0] + [r[key] for key in FV_FEATURE_KEYS]
        for i in range(k):
            Sxy[i] += x[i] * r["spot"]
            for j in range(k):
                Sxx[i][j] += x[i] * x[j]
    return _solve_linear_system(Sxx, Sxy) is not None


def fv_regress(rows: list[dict]):
    usable = fv_usable_rows(rows)
    k = len(FV_FEATURE_KEYS) + 1
    if len(usable) < k * 2:
        return None

    n = len(usable)
    lam = _fv_choose_lambda(usable)
    mu, sigma = _fv_standardize(usable)
    X = _fv_build_design(usable, mu, sigma)
    y = [r["spot"] for r in usable]

    beta_std = _fv_ridge_solve(X, y, lam)
    if not beta_std:
        return None

    fitted = [sum(xi * b for xi, b in zip(x, beta_std)) for x in X]
    residuals = [r["spot"] - f for r, f in zip(usable, fitted)]
    resid_mean = sum(residuals) / n
    resid_var = sum((res - resid_mean) ** 2 for res in residuals) / max(1, n - k)
    resid_std = math.sqrt(resid_var) if resid_var > 0 else 0.0

    beta = [0.0] * k
    intercept = beta_std[0]
    for idx, key in enumerate(FV_FEATURE_KEYS):
        raw = beta_std[idx + 1] / sigma[key]
        beta[idx + 1] = raw
        intercept -= raw * mu[key]
    beta[0] = intercept

    return {"beta": beta, "n": n, "residStd": resid_std, "lambda": lam}


def _fv_leverage_inverse(X: list[list[float]], lam: float):
    k = len(X[0])
    A = [[sum(x[a] * x[b] for x in X) for b in range(k)] for a in range(k)]
    for d in range(1, k):
        A[d][d] += lam
    cols = [_solve_linear_system(A, [1.0 if i == j else 0.0 for i in range(k)]) for j in range(k)]
    if any(c is None for c in cols):
        return None
    return [[cols[j][i] for j in range(k)] for i in range(k)]


def fv_support_ratio(train_rows: list[dict], row: dict, lam: float):
    """Hidden-extrapolation check (Montgomery, Peck & Vining, Introduction to
    Linear Regression Analysis, regressor-variable-hull criterion): the scored
    row's ridge leverage h0 = x0' (X'X + lambda*D)^-1 x0 is compared with the
    largest leverage among the training rows. Returns h0 / h_max; a value above
    1 means the scored row lies outside the region the model was fitted on, so
    its fitted value and residual z are an extrapolation. None if the leverage
    matrix cannot be inverted."""
    mu, sigma = _fv_standardize(train_rows)
    X = _fv_build_design(train_rows, mu, sigma)
    inv = _fv_leverage_inverse(X, lam)
    if inv is None:
        return None
    k = len(X[0])

    def lev(x):
        return sum(x[i] * inv[i][j] * x[j] for i in range(k) for j in range(k))

    h_max = max(lev(x) for x in X)
    x0 = [1.0] + [(row[key] - mu[key]) / sigma[key] for key in FV_FEATURE_KEYS]
    if h_max <= 0:
        return None
    return lev(x0) / h_max


def _fv_without(rows: list[dict], key: str) -> list[dict]:
    return [dict(r, **{key: 0.0}) for r in rows]


def fv_score_row(train_rows: list[dict], row: dict) -> dict:
    """Walk-forward score of one row against a fit trained on `train_rows`
    only. Single implementation shared by compute_pair_summary() and
    export_fair_value_history.py. status is one of: computed,
    regression_failed, out_of_support.

    A row materially outside the training regressor hull
    (FV_EXTRAPOLATION_FACTOR x the largest in-sample leverage) is first
    re-fitted with the single regressor that causes the extrapolation removed
    (the one whose exclusion gives the lowest support ratio). A regressor that
    did not vary in the estimation window carries no estimable coefficient, so
    excluding it is the standard treatment. That reading is returned as
    computed with `excluded` naming the dropped input and identifiable False
    (published as Regularized). If no single exclusion restores support, the
    row is out_of_support and carries no fair value or z."""
    first = _fv_score_full(train_rows, row)
    if first["status"] != "out_of_support":
        return first
    best = None
    for key in FV_FEATURE_KEYS:
        cand = _fv_score_full(_fv_without(train_rows, key), _fv_without([row], key)[0])
        if cand["status"] != "computed":
            continue
        if best is None or cand["support_ratio"] < best[1]["support_ratio"]:
            best = (key, cand)
    if best is None:
        return first
    key, cand = best
    cand["identifiable"] = False
    cand["excluded"] = [key]
    return cand


def _fv_score_full(train_rows: list[dict], row: dict) -> dict:
    reg = fv_regress(train_rows)
    if not reg or reg["residStd"] <= 0:
        return {"status": "regression_failed"}
    ratio = fv_support_ratio(train_rows, row, reg["lambda"])
    if ratio is None or ratio > FV_EXTRAPOLATION_FACTOR:
        return {"status": "out_of_support", "support_ratio": ratio}
    fair_value = reg["beta"][0] + sum(
        reg["beta"][i + 1] * row[k] for i, k in enumerate(FV_FEATURE_KEYS)
    )
    z = (row["spot"] - fair_value) / reg["residStd"]
    identifiable = fv_ols_identifiable(train_rows)
    return {
        "status": "computed",
        "fair_value": fair_value,
        "z": z,
        "lambda": reg["lambda"],
        "identifiable": identifiable,
        "support_ratio": ratio,
    }


def compute_pair_summary(rows: list[dict]) -> dict:
    """Replicates dashboard.js's (pre-refactor) renderFairValue()'s per-pair
    logic exactly: walk-forward split (train on the rolling window minus the
    last row, score the last row against that trained fit)."""
    usable_for_pair = fv_usable_rows(rows)
    entry: dict = {"totalRows": len(rows), "usableRows": len(usable_for_pair)}

    if rows:
        last_raw = rows[-1]
        entry["spot"] = last_raw.get("spot")
        entry["rate_diff"] = last_raw.get("rate_diff")
        entry["stress"] = last_raw.get("stress")

    if len(usable_for_pair) < FV_MIN_ROWS:
        entry["accumulating"] = True
        return entry

    entry["accumulating"] = False
    last = usable_for_pair[-1]
    window_rows = usable_for_pair[-FV_ROLLING_WINDOW:]
    train_rows = window_rows[:-1]
    scored = fv_score_row(train_rows, last)

    if scored["status"] == "computed":
        entry.update({
            "fairValue": round(scored["fair_value"], 6),
            "z": round(scored["z"], 4),
            "lambda": scored["lambda"],
            "identifiable": scored["identifiable"],
            "fit": "Solid" if scored["identifiable"] else "Regularized",
        })
        if scored.get("excluded"):
            entry["excluded_inputs"] = scored["excluded"]
    elif scored["status"] == "out_of_support":
        entry["error"] = "out_of_support"
    else:
        entry["error"] = "reg_failed_or_no_variance"

    return entry


def main() -> None:
    if not FV_DIR.exists():
        print(f"ERROR: {FV_DIR} does not exist — run log_fair_value_inputs.py first.")
        sys.exit(1)

    pairs_out: dict[str, dict] = {}
    max_usable = 0
    computed, accumulating_count, errored, out_of_support = 0, 0, 0, 0

    for pair_id in PAIR_IDS:
        path = FV_DIR / f"{pair_id}.json"
        rows = _load_json(path) if path.exists() else None
        if not isinstance(rows, list):
            print(f"  WARN [{pair_id}]: {path} missing or malformed — skipping.")
            continue

        summary = compute_pair_summary(rows)
        pairs_out[pair_id] = summary
        max_usable = max(max_usable, summary["usableRows"])
        if summary.get("accumulating"):
            accumulating_count += 1
        elif summary.get("error") == "out_of_support":
            out_of_support += 1
        elif "error" in summary:
            errored += 1
        else:
            computed += 1

    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    out = {
        "generated_at": generated_at,
        "min_rows": FV_MIN_ROWS,
        "rolling_window": FV_ROLLING_WINDOW,
        "feature_keys": FV_FEATURE_KEYS,
        "max_usable_rows": max_usable,
        "pairs": pairs_out,
    }
    SUMMARY_PATH.write_text(json.dumps(out, separators=(",", ":")))

    print(f"\nDone — {len(pairs_out)}/{len(PAIR_IDS)} pairs written to {SUMMARY_PATH}.")
    print(f"  Regression computed: {computed}  |  Accumulating (<{FV_MIN_ROWS}d): {accumulating_count}  |  Out of support: {out_of_support}  |  Errored: {errored}")
    print(f"  max_usable_rows across all pairs: {max_usable}")


if __name__ == "__main__":
    main()
