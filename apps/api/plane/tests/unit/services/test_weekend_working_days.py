# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date

import pytest

from plane.app.services.weekend_working_days import (
    add_working_days,
    count_working_days,
    is_weekend,
    is_working_day,
    latest_working_day_on_or_before,
    normalize_working_day_schedule,
    subtract_working_days,
)


@pytest.mark.unit
class TestWeekendWorkingDays:
    def test_friday_plus_one_working_day_ends_friday(self):
        assert add_working_days(date(2026, 5, 8), 1) == date(2026, 5, 8)

    def test_friday_plus_two_working_days_ends_monday(self):
        assert add_working_days(date(2026, 5, 8), 2) == date(2026, 5, 11)

    def test_thursday_plus_three_working_days_ends_monday(self):
        assert add_working_days(date(2026, 5, 7), 3) == date(2026, 5, 11)

    def test_saturday_plus_one_working_day_ends_next_monday(self):
        assert add_working_days(date(2026, 5, 9), 1) == date(2026, 5, 11)

    def test_counts_working_days_across_weekend(self):
        assert count_working_days(date(2026, 5, 8), date(2026, 5, 11)) == 2

    def test_monday_minus_two_working_days_starts_friday(self):
        assert subtract_working_days(date(2026, 5, 11), 2) == date(2026, 5, 8)

    def test_weekend_target_minus_one_working_day_starts_previous_friday(self):
        assert subtract_working_days(date(2026, 5, 10), 1) == date(2026, 5, 8)

    def test_normalizes_start_change_by_preserving_existing_working_duration(self):
        assert normalize_working_day_schedule(
            current_start_date=date(2026, 5, 7),
            current_target_date=date(2026, 5, 11),
            current_planned_duration_working_days=3,
            start_date=date(2026, 5, 8),
        ) == (date(2026, 5, 8), date(2026, 5, 12), 3)

    def test_normalizes_target_change_by_recalculating_working_duration(self):
        assert normalize_working_day_schedule(
            current_start_date=date(2026, 5, 8),
            current_target_date=date(2026, 5, 8),
            current_planned_duration_working_days=None,
            target_date=date(2026, 5, 11),
        ) == (date(2026, 5, 8), date(2026, 5, 11), 2)

    def test_weekend_target_edit_clears_duration(self):
        start, target, duration = normalize_working_day_schedule(
            current_start_date=date(2026, 1, 5),
            current_target_date=date(2026, 1, 9),
            current_planned_duration_working_days=5,
            target_date=date(2026, 1, 11),  # Sunday — never round-trips
        )
        assert (start, target, duration) == (date(2026, 1, 5), date(2026, 1, 11), None)

    def test_target_edit_beyond_max_duration_clears_duration(self):
        start, target, duration = normalize_working_day_schedule(
            current_start_date=date(2026, 1, 5),
            current_target_date=date(2026, 1, 9),
            current_planned_duration_working_days=5,
            target_date=date(2027, 6, 1),  # 367 working days from start
        )
        assert (start, target, duration) == (date(2026, 1, 5), date(2027, 6, 1), None)

    def test_target_edit_at_max_duration_boundary_keeps_duration(self):
        start, target, duration = normalize_working_day_schedule(
            current_start_date=date(2026, 1, 5),
            current_target_date=date(2026, 1, 9),
            current_planned_duration_working_days=5,
            target_date=date(2027, 5, 31),  # exactly 366 working days, lands Monday
        )
        assert duration == 366

    def test_weekend_start_roundtrip_keeps_duration(self):
        start, target, duration = normalize_working_day_schedule(
            current_start_date=date(2026, 1, 10),  # Saturday start is allowed by spec
            current_target_date=None,
            current_planned_duration_working_days=None,
            target_date=date(2026, 1, 12),  # Monday; count=1 and add(Sat,1)==Monday
        )
        assert (start, target, duration) == (date(2026, 1, 10), date(2026, 1, 12), 1)

    def test_weekend_and_working_day_classification(self):
        assert is_weekend(date(2026, 5, 9)) is True
        assert is_working_day(date(2026, 5, 9)) is False
        assert is_weekend(date(2026, 5, 11)) is False
        assert is_working_day(date(2026, 5, 11)) is True

    def test_rejects_non_positive_duration(self):
        with pytest.raises(ValueError, match="duration must be at least 1"):
            add_working_days(date(2026, 5, 8), 0)

        with pytest.raises(ValueError, match="duration must be at least 1"):
            subtract_working_days(date(2026, 5, 8), 0)

    def test_rejects_target_before_start_when_counting(self):
        with pytest.raises(ValueError, match="target must be on or after start"):
            count_working_days(date(2026, 5, 11), date(2026, 5, 8))

    def test_latest_working_day_on_or_before_weekday_is_identity(self):
        assert latest_working_day_on_or_before(date(2026, 1, 12)) == date(2026, 1, 12)

    def test_latest_working_day_on_or_before_saturday_snaps_to_friday(self):
        assert latest_working_day_on_or_before(date(2026, 1, 10)) == date(2026, 1, 9)

    def test_latest_working_day_on_or_before_sunday_snaps_to_friday(self):
        assert latest_working_day_on_or_before(date(2026, 1, 11)) == date(2026, 1, 9)
