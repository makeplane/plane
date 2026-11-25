# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date, timedelta

import pytest

from plane.utils.product_progress import indicator, percent, project_today

TODAY = date(2026, 11, 25)


def day(offset):
    return TODAY + timedelta(days=offset)


def check(group="started", start=-10, end=30, progress=None, overdue_tasks=False):
    return indicator(group, day(start), day(end), progress, overdue_tasks, TODAY)


@pytest.mark.unit
class TestIndicator:
    @pytest.mark.parametrize("group", ["completed", "cancelled"])
    def test_closed_wins_over_overdue(self, group):
        assert check(group=group, end=-5, overdue_tasks=True) == group

    def test_overdue_starts_the_day_after_the_end(self):
        assert check(end=-1, progress=100) == "overdue"
        assert check(end=0, progress=100) == "on_track"

    @pytest.mark.parametrize(
        "end,progress,expected",
        [
            (7, 79, "at_risk"),
            (7, 80, "on_track"),
            (8, 0, "on_track"),
            (7, None, "at_risk"),
            (0, 0, "at_risk"),
        ],
    )
    def test_risk_limits(self, end, progress, expected):
        assert check(end=end, progress=progress) == expected

    def test_overdue_tasks_are_a_risk_even_before_the_start(self):
        assert check(start=3, overdue_tasks=True) == "at_risk"

    def test_not_started(self):
        assert check(start=1) == "not_started"
        assert check(start=0) == "on_track"


@pytest.mark.unit
class TestPercent:
    def test_values(self):
        assert percent(0, 0) is None
        assert percent(0, 3) == 0
        assert percent(1, 3) == 33
        # Never 100 while a task is open.
        assert percent(999, 1000) == 99
        assert percent(3, 3) == 100

    def test_unknown_timezone(self):
        assert project_today("Nowhere/Land") == project_today("UTC")
