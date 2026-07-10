# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Date-range scheduling helpers for Timeline Dependency Schedule Propagation.

Pure-Python module — no DRF / no HTTP / no transactions / no ORM writes.

This module is the SINGLE seam for date arithmetic in `timeline_propagation/`
(CONTEXT.md D-03). `propagation.py` MUST NOT import `timedelta` directly;
every date computation routes through one of the six helpers below. ADR 0002's
Working Calendar follow-up replaces this one function module without touching
`propagation.py` (the deep-module-first directive: keep variability isolated
behind the small interface).

Calendar-day only (PROP-11). NO weekend/holiday logic in Phase 2.

Module scope (PROP-18): move-only.
"""

# Python imports
from datetime import date, timedelta

# Module imports
from plane.app.services.weekend_working_days import (
    add_working_days,
    latest_working_day_on_or_before,
    subtract_working_days,
)


def range_duration(start: date, target: date) -> timedelta:
    """Return `target - start`. `start == target` → `timedelta(0)` (D-03)."""
    return target - start


def add_calendar_days(d: date, n: int) -> date:
    """Return `d + n` calendar days (n may be negative). Calendar-day only (D-03 / PROP-11)."""
    return d + timedelta(days=n)


def target_for_working_duration(start: date, duration: int) -> date:
    """Return the target date for an inclusive weekend-only working-day duration."""
    return add_working_days(start, duration)


def start_for_working_duration(target: date, duration: int) -> date:
    """Return the start date for an inclusive weekend-only working-day duration."""
    return subtract_working_days(target, duration)


def working_day_target_on_or_before(target: date) -> date:
    """Snap a weekend-landing target to the closest earlier working day."""
    return latest_working_day_on_or_before(target)


def next_valid_start(after_target: date) -> date:
    """Return the earliest valid `start_date` for a successor whose predecessor ends on `after_target`.

    Per PRD line 82 / PROP-10 / D-02: `succ.start >= pred.target + 1 day`.
    """
    return after_target + timedelta(days=1)


def previous_valid_target(before_start: date) -> date:
    """Return the latest valid `target_date` for a predecessor whose successor starts on `before_start`.

    Mirror of `next_valid_start` for the backward (leftward) walk (D-02).
    """
    return before_start - timedelta(days=1)


def is_valid_range(start: date, target: date) -> bool:
    """Return True iff `target >= start` (zero-day duration is valid; D-03)."""
    return target >= start


def boundary_violation(predecessor_target: date, successor_start: date) -> bool:
    """Return True iff `successor_start < predecessor_target + 1 day` (D-02 / PROP-10).

    Strict less-than: `successor_start == predecessor_target + 1` is the canonical
    adjacent case and is VALID (returns False). `successor_start == predecessor_target`
    is a 1-day overlap and is a violation (returns True).
    """
    return successor_start < predecessor_target + timedelta(days=1)
