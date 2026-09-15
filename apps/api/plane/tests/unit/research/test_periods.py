# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date

import pytest

from plane.research.utils.periods import (
    InvalidPeriod,
    current_period,
    monthly_period,
    parse_period,
    weekly_period,
)

pytestmark = pytest.mark.unit


class TestWeeklyPeriod:
    def test_iso_week_boundaries(self):
        # 2026-09-15 is a Tuesday in ISO week 38
        key, start, end = weekly_period(date(2026, 9, 15))
        assert key == "2026-W38"
        assert start == date(2026, 9, 14)
        assert end == date(2026, 9, 20)
        assert start.isoweekday() == 1
        assert end.isoweekday() == 7

    def test_year_boundary_belongs_to_the_iso_year(self):
        key, start, _ = weekly_period(date(2026, 1, 1))
        assert key == "2026-W01"
        assert start == date(2025, 12, 29)

    def test_parse_explicit_week(self):
        key, start, end = parse_period("WEEKLY", "2026-W01")
        assert key == "2026-W01"
        assert start == date(2025, 12, 29)
        assert end == date(2026, 1, 4)

    def test_invalid_week_is_rejected(self):
        with pytest.raises(InvalidPeriod):
            parse_period("WEEKLY", "2026-38")
        with pytest.raises(InvalidPeriod):
            parse_period("WEEKLY", "2026-W60")


class TestMonthlyPeriod:
    def test_calendar_month_boundaries(self):
        key, start, end = monthly_period(date(2026, 9, 15))
        assert key == "2026-09"
        assert start == date(2026, 9, 1)
        assert end == date(2026, 9, 30)

    def test_february_leap_year(self):
        _, start, end = parse_period("MONTHLY", "2028-02")
        assert start == date(2028, 2, 1)
        assert end == date(2028, 2, 29)

    def test_invalid_month_is_rejected(self):
        with pytest.raises(InvalidPeriod):
            parse_period("MONTHLY", "2026-13")
        with pytest.raises(InvalidPeriod):
            parse_period("MONTHLY", "2026-W10")


class TestTimezoneHandling:
    def test_current_period_defaults_to_reference_date(self):
        key, _, _ = current_period("WEEKLY", reference=date(2026, 9, 15))
        assert key == "2026-W38"

    def test_unknown_report_type_is_rejected(self):
        with pytest.raises(InvalidPeriod):
            current_period("DAILY", reference=date(2026, 9, 15))
