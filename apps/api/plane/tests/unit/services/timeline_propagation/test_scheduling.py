# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for `plane.app.services.timeline_propagation.scheduling` helpers.

Pure-Python tests — NO `@pytest.mark.django_db` (CONTEXT.md D-13).
Imports go through the package barrel (CONTEXT.md "Claude's Discretion" bullet 4
re-exports the helpers from `__init__.py`), so this file does NOT depth-import.

Coverage map (CONTEXT.md D-03 / RESEARCH.md Wave 3):
  TestRangeDuration         → range_duration (PROP-08 setup for Plan 02-02)
  TestAddCalendarDays       → add_calendar_days (PROP-11)
  TestNextValidStart        → next_valid_start (D-02 forward shift)
  TestPreviousValidTarget   → previous_valid_target (D-02 backward shift)
  TestIsValidRange          → is_valid_range (D-06 step 1)
  TestBoundaryViolation     → boundary_violation (PROP-10 / TEST-08)
"""

# Python imports
from datetime import date, timedelta

import pytest

# Module imports
from plane.app.services.timeline_propagation import (
    add_calendar_days,
    boundary_violation,
    is_valid_range,
    next_valid_start,
    previous_valid_target,
    range_duration,
)


@pytest.mark.unit
class TestRangeDuration:
    """range_duration(start, target) returns target - start (D-03)."""

    def test_zero_duration_when_start_equals_target(self):
        d = date(2026, 5, 4)
        assert range_duration(d, d) == timedelta(0)

    def test_one_day_duration_when_target_one_day_after_start(self):
        start = date(2026, 5, 4)
        target = date(2026, 5, 5)
        assert range_duration(start, target) == timedelta(days=1)

    def test_negative_duration_when_target_before_start(self):
        start = date(2026, 5, 10)
        target = date(2026, 5, 5)
        assert range_duration(start, target) == timedelta(days=-5)


@pytest.mark.unit
class TestAddCalendarDays:
    """add_calendar_days advances calendar (PROP-11; ignores weekends/holidays)."""

    def test_advances_calendar_across_weekend(self):
        # 2026-05-04 is a Monday; +5 days = 2026-05-09 (Saturday) — no working-day skip
        assert add_calendar_days(date(2026, 5, 4), 5) == date(2026, 5, 9)

    def test_negative_n_walks_backward(self):
        assert add_calendar_days(date(2026, 5, 10), -3) == date(2026, 5, 7)

    def test_zero_n_returns_same_date(self):
        d = date(2026, 5, 4)
        assert add_calendar_days(d, 0) == d


@pytest.mark.unit
class TestNextValidStart:
    """next_valid_start(after_target) = after_target + 1 day (D-02 / PROP-10)."""

    def test_is_target_plus_one(self):
        assert next_valid_start(date(2026, 5, 4)) == date(2026, 5, 5)


@pytest.mark.unit
class TestPreviousValidTarget:
    """previous_valid_target(before_start) = before_start - 1 day (D-02 mirror)."""

    def test_is_start_minus_one(self):
        assert previous_valid_target(date(2026, 5, 5)) == date(2026, 5, 4)


@pytest.mark.unit
class TestIsValidRange:
    """is_valid_range = (target >= start); equal dates are valid 0-day duration (D-03)."""

    def test_target_equal_start_is_valid(self):
        d = date(2026, 5, 4)
        assert is_valid_range(d, d) is True

    def test_target_after_start_is_valid(self):
        assert is_valid_range(date(2026, 5, 4), date(2026, 5, 5)) is True

    def test_target_before_start_is_invalid(self):
        assert is_valid_range(date(2026, 5, 5), date(2026, 5, 4)) is False


@pytest.mark.unit
class TestBoundaryViolation:
    """boundary_violation = (succ_start < pred_target + 1 day) — strict less-than (D-02 / PROP-10 / TEST-08)."""

    def test_adjacent_succ_start_equals_pred_target_plus_one_is_valid(self):
        # PROP-10 canonical adjacency: NOT a violation
        pred_target = date(2026, 5, 4)
        succ_start = date(2026, 5, 5)
        assert boundary_violation(pred_target, succ_start) is False

    def test_one_day_overlap_is_violation(self):
        # succ.start == pred.target → 1-day overlap → violation
        d = date(2026, 5, 4)
        assert boundary_violation(d, d) is True

    def test_succ_well_after_pred_is_valid(self):
        assert boundary_violation(date(2026, 5, 4), date(2026, 5, 20)) is False
