# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date, datetime, timedelta, timezone as dt_timezone
from unittest.mock import patch

import pytest

from plane.utils.date_utils import get_analytics_date_range, get_chart_period_range

TODAY = date(2026, 9, 14)
WINDOW_DAYS = {"yesterday": 1, "last_7_days": 7, "last_30_days": 30, "last_3_months": 90}


def _span(start, end):
    """Inclusive number of days between two dates."""
    return (end - start).days + 1


@pytest.fixture(autouse=True)
def frozen_today():
    with patch(
        "plane.utils.date_utils.timezone.now",
        return_value=datetime(2026, 9, 14, 12, 0, tzinfo=dt_timezone.utc),
    ):
        yield


@pytest.mark.unit
class TestAnalyticsDateRange:
    @pytest.mark.parametrize("date_filter,days", WINDOW_DAYS.items())
    def test_current_window_covers_exactly_n_days(self, date_filter, days):
        current = get_analytics_date_range(date_filter)["current"]

        assert _span(current["gte"].date(), current["lte"].date()) == days

    @pytest.mark.parametrize("date_filter", ["last_7_days", "last_30_days", "last_3_months"])
    def test_current_window_ends_today(self, date_filter):
        assert get_analytics_date_range(date_filter)["current"]["lte"].date() == TODAY

    @pytest.mark.parametrize("date_filter", ["last_7_days", "last_30_days", "last_3_months"])
    def test_previous_window_is_same_length_and_directly_precedes_current(self, date_filter):
        ranges = get_analytics_date_range(date_filter)
        current, previous = ranges["current"], ranges["previous"]

        assert _span(previous["gte"].date(), previous["lte"].date()) == WINDOW_DAYS[date_filter]
        assert previous["lte"].date() + timedelta(days=1) == current["gte"].date()


@pytest.mark.unit
class TestChartPeriodRange:
    @pytest.mark.parametrize("date_filter,days", WINDOW_DAYS.items())
    def test_period_covers_exactly_n_days(self, date_filter, days):
        start, end = get_chart_period_range(date_filter)

        assert _span(start, end) == days

    @pytest.mark.parametrize("date_filter", ["last_7_days", "last_30_days", "last_3_months"])
    def test_period_ends_today(self, date_filter):
        assert get_chart_period_range(date_filter)[1] == TODAY
