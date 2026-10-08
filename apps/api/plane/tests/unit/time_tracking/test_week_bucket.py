# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date, timedelta

import pytest
from django.db.models import F, IntegerField, Value

from plane.tests.factories_time_tracking import TimeEntryFactory
from plane.time_tracking.models import TimeEntry
from plane.time_tracking.reports import WeekStart, week_start_of

# 2026-12-28 is a Monday; the range crosses into 2027 (Jan 1 2027 is a Friday)
DAYS = [date(2026, 12, 26) + timedelta(days=i) for i in range(14)]


@pytest.mark.unit
class TestWeekStartPython:
    @pytest.mark.parametrize(
        "day,week_start,expected",
        [
            (date(2027, 1, 1), 0, date(2026, 12, 27)),  # Sunday start
            (date(2027, 1, 1), 1, date(2026, 12, 28)),  # Monday start
            (date(2027, 1, 1), 6, date(2026, 12, 26)),  # Saturday start
            (date(2026, 12, 27), 0, date(2026, 12, 27)),  # a Sunday is its own week start
            (date(2026, 12, 27), 1, date(2026, 12, 21)),  # ...but belongs to the previous Monday week
            (date(2026, 12, 26), 6, date(2026, 12, 26)),
        ],
    )
    def test_week_start_of(self, day, week_start, expected):
        assert week_start_of(day, week_start) == expected


@pytest.mark.unit
class TestWeekStartSQL:
    @pytest.mark.parametrize("week_start", [0, 1, 6])
    def test_sql_matches_python_across_a_year_boundary(self, world, week_start):
        for day in DAYS:
            TimeEntryFactory(project=world.web, user=world.ben, spent_on=day)
        rows = (
            TimeEntry.objects.filter(user=world.ben)
            .annotate(bucket=WeekStart(F("spent_on"), Value(week_start, output_field=IntegerField())))
            .values_list("spent_on", "bucket")
        )
        assert len(rows) == len(DAYS)
        for spent_on, bucket in rows:
            assert bucket == week_start_of(spent_on, week_start), (spent_on, week_start)
            assert bucket <= spent_on < bucket + timedelta(days=7)
