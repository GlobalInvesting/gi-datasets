#!/usr/bin/env python3
"""
export_fair_value_history.py  v1.0 — Point-in-time CSV export of the FX Fair
Value BEER model, for subscriber backtesting (Dool Nath's request, 2026-09-03
email thread: "would it be possible to have past data ... to backtest other
hypothesis").

WHY THIS FILE EXISTS / WHAT IT DOES NOT CLAIM
────────────────────────────────────────────────
This is NOT the "fully backfilled, long-history" CSV Santiago already told
Dool is still being scoped (productivity differential lacks clean daily
history across all 32 pairs yet — see fetch_labor_productivity.py's own
header). This script exports exactly what fair-value-data/{pair}.json
already holds for real: currently ~64 real, non-estimated daily rows per
pair (2026-06-03 onward), same point-in-time data compute_fair_value.py
reads for the live panel. Nothing here is interpolated, estimated, or
back-filled beyond what already exists on disk — per GUIDELINES.md's
data-integrity rule, this script would rather export a short honest history
than a longer fabricated one.

Because FV_MIN_ROWS/FV_ROLLING_WINDOW = 60 (business days), a pair only gets
a genuine walk-forward Fair Value/Z-score once it has 60 usable rows behind
it — right now that's true for the *last few* dates only (5 of 64 rows as of
2026-09-03), not the whole window. Rows before that point are exported with
their raw inputs (spot + 5 BEER features) and blank
fair_value/z_score/lambda/fit columns, `model_status=insufficient_history` —
not zero-filled, not dropped. This mirrors exactly what the live panel does
today (raw inputs shown, "—" for Fair Value) rather than inventing a
regression result the underlying data can't yet support. Coverage will grow
by one computed row per pair per weekday session automatically, with zero
code changes needed here.

METHODOLOGY — WALK-FORWARD, NO LOOKAHEAD (per GUIDELINES.md's point-in-time
integrity rule)
────────────────────────────────────────────────────────────────────────────
For a row at business-day index i (0-based, chronological), only rows
[max(0, i+1-FV_ROLLING_WINDOW) .. i] are ever used, and within that window
the row being scored (index i) is EXCLUDED from the training fit — the exact
same walk-forward split compute_fair_value.py's compute_pair_summary() uses
for the live "today" value, just re-run for every historical date instead of
only the most recent one. A backtester reading this CSV is seeing, for every
computed row, only the regression a live user would have seen on that same
date — no future data ever leaks into a historical fair_value/z_score.

This script does NOT duplicate the regression math — it imports
fv_score_row()/fv_usable_rows() from
compute_fair_value.py directly (must run from the same directory / be on
sys.path), so there is exactly one implementation of the BEER ridge
regression in this repo, not two silently drifting copies.

WRITES (to the public site repo, alongside fair-value-data/*.json)
────────────────────────────────────────────────────────────────────────────
  fair-value-data/backtest/{pair}.csv   — one file per pair, full history
  fair-value-data/backtest/all_pairs.csv — same rows, all pairs concatenated
  fair-value-data/backtest/manifest.json — coverage stats + methodology
                                            disclosure, read by access.html /
                                            guide pages to render an honest
                                            "X of 32 pairs have N computed
                                            days" line rather than a static
                                            claim that goes stale.

PERFORMANCE NOTE (flagged, not fixed — not a problem at current scale)
────────────────────────────────────────────────────────────────────────────
Re-running fv_regress() (12-lambda x 5-fold CV) for every computable
historical row, every session, is O(rows_with_60d_history) regressions per
pair. At today's scale (5 computed rows x 32 pairs = 160 regressions) this
runs in well under a second. Once usable history is in the hundreds of rows
per pair, this cost grows linearly — worth revisiting (e.g. cache
already-computed historical rows and only compute the newest one each
session) if a future session finds this script's runtime becoming a real
cost, but not a real problem today with the actual data volume on disk.
"""
from __future__ import annotations

import csv
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from compute_fair_value import (  # noqa: E402
    FV_FEATURE_KEYS,
    FV_MIN_ROWS,
    FV_ROLLING_WINDOW,
    PAIR_IDS,
    fv_score_row,
    fv_usable_rows,
)

SCRIPT_VERSION = "1.0"

SITE_DIR = Path(os.environ.get("SITE_DIR", "."))
FV_DIR = SITE_DIR / "fair-value-data"
OUT_DIR = FV_DIR / "backtest"

CSV_COLUMNS = [
    "date", "spot", "rate_diff", "stress", "ca_diff", "tb_diff", "prod_diff",
    "fair_value", "z_score", "lambda", "fit", "model_status",
]


def _load_json(path: Path):
    try:
        return json.loads(path.read_text())
    except Exception as e:
        print(f"  WARN: could not read {path}: {e}")
        return None


def _row_out(row: dict, computed: dict | None, status: str) -> dict:
    out = {"date": row.get("date"), "spot": row.get("spot")}
    for key in FV_FEATURE_KEYS:
        out[key] = row.get(key)
    if computed:
        out["fair_value"] = computed["fair_value"]
        out["z_score"] = computed["z_score"]
        out["lambda"] = computed["lambda"]
        out["fit"] = computed["fit"]
    else:
        out["fair_value"] = ""
        out["z_score"] = ""
        out["lambda"] = ""
        out["fit"] = ""
    out["model_status"] = status
    return out


def export_pair_history(pair_id: str, rows: list[dict]) -> list[dict]:
    """Walk-forward export for one pair. Returns the list of output rows
    (dicts matching CSV_COLUMNS) in chronological order."""
    usable = fv_usable_rows(rows)
    out_rows: list[dict] = []

    for i, row in enumerate(usable):
        n_seen = i + 1
        if n_seen < FV_MIN_ROWS:
            out_rows.append(_row_out(row, None, "insufficient_history"))
            continue

        window = usable[max(0, n_seen - FV_ROLLING_WINDOW):n_seen]
        train_rows = window[:-1]  # exclude the row being scored — no lookahead
        scored = fv_score_row(train_rows, row)

        if scored["status"] != "computed":
            status = "out_of_support" if scored["status"] == "out_of_support" else "regression_failed"
            out_rows.append(_row_out(row, None, status))
            continue

        status = "computed_reduced" if scored.get("excluded") else "computed"
        computed = {
            "fair_value": round(scored["fair_value"], 6),
            "z_score": round(scored["z"], 4),
            "lambda": scored["lambda"],
            "fit": "Solid" if scored["identifiable"] else "Regularized",
        }
        out_rows.append(_row_out(row, computed, status))

    return out_rows


def _write_csv(path: Path, rows: list[dict]) -> None:
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        w.writeheader()
        for r in rows:
            w.writerow(r)


def main() -> None:
    if not FV_DIR.exists():
        print(f"ERROR: {FV_DIR} does not exist — run log_fair_value_inputs.py first.")
        sys.exit(1)

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    all_rows: list[dict] = []
    manifest_pairs: dict[str, dict] = {}
    total_computed = 0

    for pair_id in PAIR_IDS:
        path = FV_DIR / f"{pair_id}.json"
        rows = _load_json(path) if path.exists() else None
        if not isinstance(rows, list):
            print(f"  WARN [{pair_id}]: {path} missing or malformed — skipping.")
            continue

        pair_rows = export_pair_history(pair_id, rows)
        _write_csv(OUT_DIR / f"{pair_id}.csv", pair_rows)

        computed_rows = [r for r in pair_rows if r["model_status"].startswith("computed")]
        total_computed += len(computed_rows)
        manifest_pairs[pair_id] = {
            "totalRows": len(pair_rows),
            "computedRows": len(computed_rows),
            "firstDate": pair_rows[0]["date"] if pair_rows else None,
            "lastDate": pair_rows[-1]["date"] if pair_rows else None,
            "firstComputedDate": computed_rows[0]["date"] if computed_rows else None,
        }

        for r in pair_rows:
            r2 = dict(r)
            r2["pair"] = pair_id
            all_rows.append(r2)

    all_rows.sort(key=lambda r: (r["date"] or "", r["pair"]))
    # all_pairs.csv uses its own column order (pair first).
    with (OUT_DIR / "all_pairs.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["pair"] + CSV_COLUMNS)
        w.writeheader()
        for r in all_rows:
            w.writerow({**{c: r.get(c, "") for c in CSV_COLUMNS}, "pair": r["pair"]})

    from datetime import datetime, timezone
    manifest = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "script_version": SCRIPT_VERSION,
        "methodology": (
            "Walk-forward, no-lookahead export of the same server-side BEER "
            "ridge regression the live Fair Value panel uses "
            "(compute_fair_value.py). Each computed row's fair_value/z_score "
            "used only data available up to and including that row's own "
            "date -- never later data. Rows before a pair reaches 60 usable "
            "business days show raw inputs only "
            "(model_status=insufficient_history); a regression that fails "
            "or has zero residual variance on a given window shows "
            "model_status=regression_failed; a row whose inputs lie materially "
            "outside the region the trailing window was fitted on (hidden "
            "extrapolation) is re-fitted without the one input that causes it "
            "(model_status=computed_reduced, fit=Regularized), or, if no "
            "single exclusion restores support, shows "
            "model_status=out_of_support and carries no fair_value/z_score. No value in this export is "
            "estimated or interpolated -- every spot/rate_diff/stress/"
            "ca_diff/tb_diff/prod_diff figure is the same real, dated input "
            "the live panel logs."
        ),
        "min_rows_for_regression": FV_MIN_ROWS,
        "rolling_window": FV_ROLLING_WINDOW,
        "feature_keys": FV_FEATURE_KEYS,
        "pairs_exported": len(manifest_pairs),
        "total_computed_rows_all_pairs": total_computed,
        "pairs": manifest_pairs,
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2))

    print(f"\nDone — {len(manifest_pairs)}/{len(PAIR_IDS)} pairs exported to {OUT_DIR}.")
    print(f"  Total computed (walk-forward fair_value/z_score) rows across all pairs: {total_computed}")
    print(f"  all_pairs.csv rows: {len(all_rows)}")


if __name__ == "__main__":
    main()
