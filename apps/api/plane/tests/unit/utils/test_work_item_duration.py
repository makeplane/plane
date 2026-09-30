# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date, datetime
from types import SimpleNamespace

import pytest
from plane.utils.work_item_duration import (
    WORK_ITEM_DURATION_MIN,
    calculate_start_date_from_duration,
    calculate_target_date_from_duration,
    calculate_work_item_duration,
    normalize_work_item_duration,
    reconcile_work_item_duration,
    to_work_item_date,
)


def work_item(start_date=None, target_date=None, duration=None):
    """Stand-in for an Issue instance, holding only the fields duration cares about."""
    return SimpleNamespace(start_date=start_date, target_date=target_date, duration=duration)


@pytest.mark.unit
class TestWorkItemDurationHelpers:
    def test_duration_is_counted_inclusively(self):
        assert calculate_work_item_duration("2026-01-01", "2026-01-05") == 5
        assert calculate_work_item_duration(date(2026, 2, 2), date(2026, 2, 6)) == 5

    def test_single_day_work_item_lasts_one_day(self):
        assert calculate_work_item_duration("2026-01-01", "2026-01-01") == 1

    def test_missing_date_yields_no_duration(self):
        assert calculate_work_item_duration(None, "2026-01-05") is None
        assert calculate_work_item_duration("2026-01-01", None) is None
        assert calculate_work_item_duration(None, None) is None

    def test_backwards_range_reports_non_positive_duration(self):
        assert calculate_work_item_duration("2026-01-10", "2026-01-05") < WORK_ITEM_DURATION_MIN

    def test_target_date_is_derived_from_start_date(self):
        assert calculate_target_date_from_duration("2026-01-01", 5) == "2026-01-05"
        assert calculate_target_date_from_duration("2026-01-01", 1) == "2026-01-01"

    def test_start_date_is_derived_from_target_date(self):
        assert calculate_start_date_from_duration("2026-01-10", 3) == "2026-01-08"
        assert calculate_start_date_from_duration("2026-01-10", 1) == "2026-01-10"

    def test_month_and_year_boundaries(self):
        assert calculate_target_date_from_duration("2026-12-30", 5) == "2027-01-03"
        assert calculate_start_date_from_duration("2027-01-03", 5) == "2026-12-30"
        # 2028 is a leap year, so February has 29 days
        assert calculate_target_date_from_duration("2028-02-27", 4) == "2028-03-01"

    def test_duration_is_normalized_to_whole_days_of_at_least_one(self):
        assert normalize_work_item_duration(3.4) == 3
        assert normalize_work_item_duration(3.6) == 4
        assert normalize_work_item_duration(2.5) == 3  # matches JavaScript's Math.round
        assert normalize_work_item_duration(0) == WORK_ITEM_DURATION_MIN
        assert normalize_work_item_duration(-5) == WORK_ITEM_DURATION_MIN
        assert normalize_work_item_duration(None) is None
        assert normalize_work_item_duration("") is None
        assert normalize_work_item_duration("not a number") is None
        assert normalize_work_item_duration(True) is None

    def test_duration_accepts_numeric_strings_from_payloads(self):
        assert normalize_work_item_duration("5") == 5

    def test_dates_are_parsed_back_for_serializer_callers(self):
        assert to_work_item_date("2026-01-05") == date(2026, 1, 5)
        assert to_work_item_date(date(2026, 1, 5)) == date(2026, 1, 5)
        assert to_work_item_date(datetime(2026, 1, 5, 13, 30)) == date(2026, 1, 5)
        assert to_work_item_date(None) is None
        assert to_work_item_date("") is None
        assert to_work_item_date("not a date") is None


@pytest.mark.unit
class TestReconcileDurationEdit:
    def test_target_date_is_calculated_when_start_date_exists(self):
        result = reconcile_work_item_duration(work_item(start_date=date(2026, 1, 1)), {"duration": 5})
        assert result == {"duration": 5, "target_date": "2026-01-05"}

    def test_start_date_is_calculated_when_only_target_date_exists(self):
        result = reconcile_work_item_duration(work_item(target_date=date(2026, 1, 10)), {"duration": 3})
        assert result == {"duration": 3, "start_date": "2026-01-08"}

    def test_start_date_stays_anchored_when_both_dates_exist(self):
        result = reconcile_work_item_duration(
            work_item(start_date=date(2026, 2, 2), target_date=date(2026, 2, 6), duration=5),
            {"duration": 8},
        )
        assert result == {"duration": 8, "target_date": "2026-02-09"}

    def test_duration_can_be_stored_without_any_dates(self):
        assert reconcile_work_item_duration(work_item(), {"duration": 4}) == {"duration": 4}

    def test_clearing_the_duration_leaves_dates_untouched(self):
        result = reconcile_work_item_duration(
            work_item(start_date=date(2026, 1, 1), target_date=date(2026, 1, 5), duration=5),
            {"duration": None},
        )
        assert result == {"duration": None}

    def test_out_of_range_duration_is_clamped_before_deriving_dates(self):
        result = reconcile_work_item_duration(work_item(start_date=date(2026, 1, 1)), {"duration": 0})
        assert result == {"duration": WORK_ITEM_DURATION_MIN, "target_date": "2026-01-01"}

    def test_duration_works_on_create_without_an_instance(self):
        result = reconcile_work_item_duration(None, {"duration": 5, "start_date": "2026-01-01"})
        assert result == {"duration": 5, "target_date": "2026-01-05"}


@pytest.mark.unit
class TestReconcileDateEdit:
    def test_duration_is_calculated_once_both_dates_are_set(self):
        result = reconcile_work_item_duration(
            work_item(start_date=date(2026, 2, 2)), {"target_date": "2026-02-06"}
        )
        assert result == {"duration": 5}

    def test_duration_is_recalculated_when_a_date_moves(self):
        result = reconcile_work_item_duration(
            work_item(start_date=date(2026, 2, 2), target_date=date(2026, 2, 6), duration=5),
            {"start_date": "2026-02-04"},
        )
        assert result == {"duration": 3}

    def test_missing_target_date_is_derived_from_an_existing_duration(self):
        result = reconcile_work_item_duration(work_item(duration=5), {"start_date": "2026-01-01"})
        assert result == {"target_date": "2026-01-05"}

    def test_missing_start_date_is_derived_from_an_existing_duration(self):
        result = reconcile_work_item_duration(work_item(duration=3), {"target_date": "2026-01-10"})
        assert result == {"start_date": "2026-01-08"}

    def test_a_cleared_date_is_never_resurrected(self):
        current = work_item(start_date=date(2026, 1, 1), target_date=date(2026, 1, 5), duration=5)
        assert reconcile_work_item_duration(current, {"target_date": None}) == {}
        assert reconcile_work_item_duration(current, {"start_date": None}) == {}

    def test_duration_survives_when_both_dates_are_cleared(self):
        result = reconcile_work_item_duration(
            work_item(start_date=date(2026, 1, 1), target_date=date(2026, 1, 5), duration=5),
            {"start_date": None, "target_date": None},
        )
        assert result == {}

    def test_nothing_is_derived_when_one_date_is_known_and_no_duration_is_set(self):
        assert reconcile_work_item_duration(work_item(), {"start_date": "2026-01-01"}) == {}

    def test_target_date_is_dragged_along_when_start_date_slips_past_it(self):
        result = reconcile_work_item_duration(
            work_item(start_date=date(2026, 1, 1), target_date=date(2026, 1, 5), duration=5),
            {"start_date": "2026-01-10"},
        )
        assert result == {"duration": 5, "target_date": "2026-01-14"}

    def test_start_date_is_pulled_back_when_target_date_moves_before_it(self):
        result = reconcile_work_item_duration(
            work_item(start_date=date(2026, 1, 10), target_date=date(2026, 1, 14), duration=5),
            {"target_date": "2026-01-05"},
        )
        assert result == {"duration": 5, "start_date": "2026-01-01"}

    def test_previous_date_range_is_used_when_no_duration_is_stored(self):
        result = reconcile_work_item_duration(
            work_item(start_date=date(2026, 1, 1), target_date=date(2026, 1, 3)),
            {"start_date": "2026-01-10"},
        )
        assert result == {"duration": 3, "target_date": "2026-01-12"}

    def test_payload_without_duration_fields_is_left_alone(self):
        current = work_item(start_date=date(2026, 1, 1), target_date=date(2026, 1, 5), duration=5)
        assert reconcile_work_item_duration(current, {"name": "renamed"}) == {}
        assert reconcile_work_item_duration(current, {}) == {}
        assert reconcile_work_item_duration(current, None) == {}
