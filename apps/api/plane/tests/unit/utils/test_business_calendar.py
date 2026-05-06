# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for BusinessCalendarService and its supporting modules.

Coverage targets:
  - plane/utils/business_calendar/service.py
  - plane/utils/business_calendar/resolver.py
  - plane/utils/business_calendar/cache.py
  - plane/db/models/business_calendar.py (signal handlers)
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone as dt_timezone
from unittest.mock import MagicMock, patch

import pytest

from plane.utils.business_calendar.service import BusinessCalendarService, VN_TZ


# ---------------------------------------------------------------------------
# Helpers — minimal fake schedule object (no DB required for logic tests)
# ---------------------------------------------------------------------------

def _make_schedule(
    week_pattern: list[bool] | None = None,
    schedule_id: uuid.UUID | None = None,
    timezone: str = "Asia/Ho_Chi_Minh",
) -> MagicMock:
    """Return a mock WorkSchedule with Mon–Fri working, Sat/Sun off by default."""
    schedule = MagicMock()
    schedule.id = schedule_id or uuid.uuid4()
    schedule.timezone = timezone
    schedule.week_pattern = week_pattern if week_pattern is not None else [True, True, True, True, True, False, False]
    return schedule


def _make_year_data(
    holidays: dict | None = None,
    overrides: dict | None = None,
) -> dict:
    return {
        "holidays": holidays or {},
        "overrides": overrides or {},
    }


# ---------------------------------------------------------------------------
# Pure logic tests — DB not needed; cache and resolver are mocked
# ---------------------------------------------------------------------------

@pytest.mark.unit
class TestIsWorkingDay:
    """Tests for BusinessCalendarService.is_working_day()."""

    def _run(
        self,
        d: date,
        holidays: dict | None = None,
        overrides: dict | None = None,
        week_pattern: list[bool] | None = None,
        schedule_id: uuid.UUID | None = None,
    ) -> bool:
        schedule = _make_schedule(week_pattern=week_pattern, schedule_id=schedule_id)
        year_data = _make_year_data(holidays=holidays, overrides=overrides)
        with (
            patch("plane.utils.business_calendar.service.resolve_schedule", return_value=schedule),
            patch("plane.utils.business_calendar.service.get_or_build_year_data", return_value=year_data),
        ):
            return BusinessCalendarService.is_working_day(d, schedule_id)

    # --- weekday pattern ---

    def test_monday_is_working(self):
        assert self._run(date(2025, 4, 28)) is True  # Monday

    def test_saturday_is_not_working(self):
        assert self._run(date(2025, 4, 26)) is False  # Saturday — no override

    def test_sunday_is_not_working(self):
        assert self._run(date(2025, 4, 27)) is False  # Sunday — no override

    # --- holiday list ---

    def test_holiday_returns_false(self):
        """30/4/2025 in holidays → False."""
        assert self._run(
            date(2025, 4, 30),
            holidays={date(2025, 4, 30): "Giải Phóng Miền Nam"},
        ) is False

    def test_normal_weekday_not_in_holiday_list_is_working(self):
        assert self._run(date(2025, 4, 29)) is True  # Tuesday, no holiday

    # --- DayOverride beats everything ---

    def test_swap_day_saturday_override_workday(self):
        """26/4/2025 (Sat) with WORKDAY override → True (MOLISA swap-day)."""
        assert self._run(
            date(2025, 4, 26),
            overrides={date(2025, 4, 26): {"type": "WORKDAY", "reason": "làm bù"}},
        ) is True

    def test_override_holiday_on_weekday_returns_false(self):
        """A forced HOLIDAY override on a weekday beats week_pattern."""
        assert self._run(
            date(2025, 4, 28),  # Monday
            overrides={date(2025, 4, 28): {"type": "HOLIDAY", "reason": "compensatory"}},
        ) is False

    def test_override_beats_holiday_list(self):
        """WORKDAY override on a date that also appears in holiday list → True."""
        d = date(2025, 4, 30)
        assert self._run(
            d,
            holidays={d: "Giải Phóng Miền Nam"},
            overrides={d: {"type": "WORKDAY", "reason": "special"}},
        ) is True

    # --- default schedule fallback ---

    def test_none_schedule_id_uses_default(self):
        """Passing schedule_id=None must call resolve_schedule(None)."""
        schedule = _make_schedule()
        year_data = _make_year_data()
        with (
            patch("plane.utils.business_calendar.service.resolve_schedule", return_value=schedule) as mock_resolve,
            patch("plane.utils.business_calendar.service.get_or_build_year_data", return_value=year_data),
        ):
            BusinessCalendarService.is_working_day(date(2025, 4, 28), None)
            mock_resolve.assert_called_once_with(None)

    # --- custom week pattern ---

    def test_saturday_working_in_55_day_schedule(self):
        """5.5-day schedule: Sat morning = True (week_pattern[5]=True)."""
        pattern = [True, True, True, True, True, True, False]
        assert self._run(date(2025, 4, 26), week_pattern=pattern) is True


@pytest.mark.unit
class TestNextWorkingDay:
    """Tests for BusinessCalendarService.next_working_day()."""

    def _run(
        self,
        d: date,
        holidays: dict | None = None,
        overrides: dict | None = None,
    ) -> date:
        schedule = _make_schedule()
        year_data = _make_year_data(holidays=holidays, overrides=overrides)
        with (
            patch("plane.utils.business_calendar.service.resolve_schedule", return_value=schedule),
            patch("plane.utils.business_calendar.service.get_or_build_year_data", return_value=year_data),
        ):
            return BusinessCalendarService.next_working_day(d)

    def test_friday_next_is_monday(self):
        """Fri 25/4 → next working = Mon 28/4 (skip weekend)."""
        assert self._run(date(2025, 4, 25)) == date(2025, 4, 28)

    def test_skips_holiday_after_weekend(self):
        """Fri 25/4 → Mon 28/4 is holiday → Tue 29/4."""
        assert self._run(
            date(2025, 4, 25),
            holidays={date(2025, 4, 28): "holiday"},
        ) == date(2025, 4, 29)

    def test_thursday_next_is_friday(self):
        assert self._run(date(2025, 4, 24)) == date(2025, 4, 25)

    def test_swap_day_saturday_counts_as_next(self):
        """If Sat has WORKDAY override, it is the next working day after Fri."""
        assert self._run(
            date(2025, 4, 25),
            overrides={date(2025, 4, 26): {"type": "WORKDAY", "reason": "bù"}},
        ) == date(2025, 4, 26)


@pytest.mark.unit
class TestAddBusinessDays:
    """Tests for BusinessCalendarService.add_business_days()."""

    def _run(
        self,
        d: date,
        n: int,
        holidays: dict | None = None,
        overrides: dict | None = None,
    ) -> date:
        schedule = _make_schedule()
        year_data = _make_year_data(holidays=holidays, overrides=overrides)
        with (
            patch("plane.utils.business_calendar.service.resolve_schedule", return_value=schedule),
            patch("plane.utils.business_calendar.service.get_or_build_year_data", return_value=year_data),
        ):
            return BusinessCalendarService.add_business_days(d, n)

    def test_add_zero_returns_same_date(self):
        assert self._run(date(2025, 4, 28), 0) == date(2025, 4, 28)

    def test_add_5_business_days_from_monday(self):
        """Mon 28/4 + 5 = Mon 5/5 (skip Sat/Sun)."""
        assert self._run(date(2025, 4, 28), 5) == date(2025, 5, 5)

    def test_add_1_from_friday_skips_weekend(self):
        assert self._run(date(2025, 4, 25), 1) == date(2025, 4, 28)

    def test_add_negative_walks_back(self):
        """Mon 28/4 - 1 = Fri 25/4."""
        assert self._run(date(2025, 4, 28), -1) == date(2025, 4, 25)

    def test_add_skips_holiday(self):
        """Mon 28/4 + 1, but Tue is holiday → Wed 30/4."""
        assert self._run(
            date(2025, 4, 28),
            1,
            holidays={date(2025, 4, 29): "holiday"},
        ) == date(2025, 4, 30)


@pytest.mark.unit
class TestWorkingDaysBetween:
    """Tests for BusinessCalendarService.working_days_between()."""

    def _run(
        self,
        start: date,
        end: date,
        holidays: dict | None = None,
        overrides: dict | None = None,
    ) -> int:
        schedule = _make_schedule()
        year_data = _make_year_data(holidays=holidays, overrides=overrides)
        with (
            patch("plane.utils.business_calendar.service.resolve_schedule", return_value=schedule),
            patch("plane.utils.business_calendar.service.get_or_build_year_data", return_value=year_data),
        ):
            return BusinessCalendarService.working_days_between(start, end)

    def test_same_date_returns_zero(self):
        assert self._run(date(2025, 4, 28), date(2025, 4, 28)) == 0

    def test_mon_to_fri_is_five(self):
        """Half-open [Mon, Sat) = 5 working days."""
        assert self._run(date(2025, 4, 28), date(2025, 5, 3)) == 5

    def test_excludes_end_date(self):
        """[Mon, Tue) = 1 working day (Mon counted, Tue excluded)."""
        assert self._run(date(2025, 4, 28), date(2025, 4, 29)) == 1

    def test_holiday_reduces_count(self):
        """[Mon, Fri) with Wed holiday = 3 working days."""
        assert self._run(
            date(2025, 4, 28),
            date(2025, 5, 2),
            holidays={date(2025, 4, 30): "holiday"},
        ) == 3

    def test_swap_day_increases_count(self):
        """[Fri, Mon) with Sat=WORKDAY override = 2 (Fri + Sat)."""
        assert self._run(
            date(2025, 4, 25),
            date(2025, 4, 28),
            overrides={date(2025, 4, 26): {"type": "WORKDAY", "reason": "bù"}},
        ) == 2

    def test_reverse_range_is_negative(self):
        """end < start → negative count."""
        result = self._run(date(2025, 4, 29), date(2025, 4, 28))
        assert result == -1


@pytest.mark.unit
class TestTimezoneHandling:
    """Tests for BusinessCalendarService._to_vn_date timezone normalisation."""

    def _run(self, d, holidays: dict | None = None) -> bool:
        schedule = _make_schedule()
        year_data = _make_year_data(holidays=holidays)
        with (
            patch("plane.utils.business_calendar.service.resolve_schedule", return_value=schedule),
            patch("plane.utils.business_calendar.service.get_or_build_year_data", return_value=year_data),
        ):
            return BusinessCalendarService.is_working_day(d)

    def test_utc_datetime_crossing_midnight_uses_vn_date(self):
        """
        2025-04-29 18:00 UTC = 2025-04-30 01:00 VN+07.
        30/4 is a holiday → should return False when checked as VN date.
        """
        utc_dt = datetime(2025, 4, 29, 18, 0, 0, tzinfo=dt_timezone.utc)
        result = self._run(
            utc_dt,
            holidays={date(2025, 4, 30): "Giải Phóng Miền Nam"},
        )
        assert result is False

    def test_utc_datetime_before_midnight_vn_uses_previous_date(self):
        """
        2025-04-29 16:00 UTC = 2025-04-29 23:00 VN+07 → still 29/4.
        29/4 is a Tuesday (working day) → True.
        """
        utc_dt = datetime(2025, 4, 29, 16, 0, 0, tzinfo=dt_timezone.utc)
        result = self._run(utc_dt)
        assert result is True

    def test_naive_datetime_treated_as_utc(self):
        """Naive datetime crossing midnight VN treated as UTC."""
        naive_dt = datetime(2025, 4, 29, 18, 0, 0)  # naive → UTC → VN = 30/4
        result = self._run(
            naive_dt,
            holidays={date(2025, 4, 30): "holiday"},
        )
        assert result is False

    def test_date_object_passes_through_unchanged(self):
        """Plain date objects bypass tz conversion."""
        assert self._run(date(2025, 4, 28)) is True  # Monday, no holiday


@pytest.mark.unit
class TestCacheHitMiss:
    """Tests for cache interaction in resolver."""

    def test_cache_hit_skips_db(self):
        """On cache hit, get_or_build_year_data must not query DB."""
        from plane.utils.business_calendar import resolver as resolver_mod

        cached_data = {
            "holidays": {date(2025, 4, 30): "holiday"},
            "overrides": {},
        }
        schedule = _make_schedule()
        with (
            patch.object(resolver_mod, "get_year_data", return_value=cached_data) as mock_get,
            patch.object(resolver_mod, "set_year_data") as mock_set,
            patch.object(resolver_mod, "build_year_data") as mock_build,
        ):
            result = resolver_mod.get_or_build_year_data(schedule, 2025)

        mock_get.assert_called_once_with(schedule.id, 2025)
        mock_build.assert_not_called()
        mock_set.assert_not_called()
        assert result == cached_data

    def test_cache_miss_builds_and_stores(self):
        """On cache miss, build_year_data is called and result stored."""
        from plane.utils.business_calendar import resolver as resolver_mod

        fresh_data = {"holidays": {}, "overrides": {}}
        schedule = _make_schedule()
        with (
            patch.object(resolver_mod, "get_year_data", return_value=None),
            patch.object(resolver_mod, "build_year_data", return_value=fresh_data) as mock_build,
            patch.object(resolver_mod, "set_year_data") as mock_set,
        ):
            result = resolver_mod.get_or_build_year_data(schedule, 2025)

        mock_build.assert_called_once_with(schedule, 2025)
        mock_set.assert_called_once_with(schedule.id, 2025, fresh_data)
        assert result == fresh_data


# ---------------------------------------------------------------------------
# DB-level tests — require Django DB (--nomigrations: models created from ORM)
# ---------------------------------------------------------------------------

@pytest.mark.unit
@pytest.mark.django_db
class TestSignalHandlers:
    """Verify cache invalidation signals fire on Holiday/DayOverride create/delete."""

    def test_holiday_create_invalidates_cache(self):
        """Creating a Holiday must delete the corresponding cache key."""
        import plane.db.models.business_calendar as bc_module
        from plane.db.models import WorkSchedule, Holiday

        schedule = WorkSchedule.objects.create(
            name="Test Schedule",
            week_pattern=[True, True, True, True, True, False, False],
            timezone="Asia/Ho_Chi_Minh",
            is_default=False,
            country_code="VN",
        )
        expected_key = f"calendar:{schedule.id}:2025"
        mock_cache = MagicMock()

        with patch.object(bc_module, "cache", mock_cache):
            Holiday.objects.create(schedule=schedule, date=date(2025, 4, 30), name="Test Holiday")
        mock_cache.delete.assert_called_with(expected_key)

    def test_holiday_delete_invalidates_cache(self):
        """Deleting a Holiday must delete the corresponding cache key."""
        import plane.db.models.business_calendar as bc_module
        from plane.db.models import WorkSchedule, Holiday

        schedule = WorkSchedule.objects.create(
            name="Test Schedule 2",
            week_pattern=[True, True, True, True, True, False, False],
            timezone="Asia/Ho_Chi_Minh",
            is_default=False,
            country_code="VN",
        )
        holiday = Holiday.objects.create(
            schedule=schedule, date=date(2025, 5, 1), name="Labour Day"
        )
        expected_key = f"calendar:{schedule.id}:2025"
        mock_cache = MagicMock()

        # BaseModel.delete() dispatches a Celery soft-delete task — mock to avoid RabbitMQ
        with (
            patch.object(bc_module, "cache", mock_cache),
            patch("plane.bgtasks.deletion_task.soft_delete_related_objects.delay"),
        ):
            holiday.delete()
        mock_cache.delete.assert_called_with(expected_key)

    def test_day_override_create_invalidates_cache(self):
        """Creating a DayOverride must delete the corresponding cache key."""
        import plane.db.models.business_calendar as bc_module
        from plane.db.models import WorkSchedule, DayOverride

        schedule = WorkSchedule.objects.create(
            name="Test Schedule 3",
            week_pattern=[True, True, True, True, True, False, False],
            timezone="Asia/Ho_Chi_Minh",
            is_default=False,
            country_code="VN",
        )
        expected_key = f"calendar:{schedule.id}:2025"
        mock_cache = MagicMock()

        with patch.object(bc_module, "cache", mock_cache):
            DayOverride.objects.create(
                schedule=schedule,
                date=date(2025, 4, 26),
                type="WORKDAY",
                reason="swap",
            )
        mock_cache.delete.assert_called_with(expected_key)

    def test_work_schedule_delete_clears_all_year_cache(self):
        """Soft-deleting a WorkSchedule must clear all calendar:{id}:* cache entries.

        Plane uses SoftDeleteModel — .delete() calls .save(deleted_at=now) not
        the DB DELETE, so the post_save signal fires, not post_delete.
        """
        import plane.db.models.business_calendar as bc_module
        from plane.db.models import WorkSchedule

        schedule = WorkSchedule.objects.create(
            name="Test Schedule 4",
            week_pattern=[True, True, True, True, True, False, False],
            timezone="Asia/Ho_Chi_Minh",
            is_default=False,
            country_code="VN",
        )
        schedule_id = schedule.id
        mock_cache = MagicMock()
        mock_cache.delete_pattern = MagicMock()

        # SoftDeleteModel.delete() sets deleted_at and calls save() + Celery delay
        with (
            patch.object(bc_module, "cache", mock_cache),
            patch("plane.bgtasks.deletion_task.soft_delete_related_objects.delay"),
        ):
            schedule.delete()  # triggers post_save with deleted_at set
        mock_cache.delete_pattern.assert_called_once_with(f"calendar:{schedule_id}:*")


@pytest.mark.unit
@pytest.mark.django_db
class TestSeedDataIntegration:
    """
    Verify the seeded default schedule and known holiday/swap dates.
    These tests work against the ORM without migrations (--nomigrations),
    so we create the seed data directly in the fixture.
    """

    @pytest.fixture(autouse=True)
    def _create_default_schedule(self, db):
        from plane.db.models import WorkSchedule, Holiday, DayOverride

        self.schedule = WorkSchedule.objects.create(
            id=uuid.UUID("00000000-0000-0000-0000-000000000099"),
            name="Vietnam Banking (test)",
            week_pattern=[True, True, True, True, True, False, False],
            timezone="Asia/Ho_Chi_Minh",
            is_default=True,
            country_code="VN",
        )
        # Seed key 2025 dates
        Holiday.objects.create(schedule=self.schedule, date=date(2025, 4, 30), name="Giải Phóng Miền Nam")
        Holiday.objects.create(schedule=self.schedule, date=date(2025, 5, 1), name="Quốc tế Lao động")
        Holiday.objects.create(schedule=self.schedule, date=date(2025, 5, 2), name="Nghỉ bù")
        DayOverride.objects.create(
            schedule=self.schedule,
            date=date(2025, 4, 26),
            type="WORKDAY",
            reason="Làm bù cho ngày nghỉ 2/5/2025",
            swap_with_date=date(2025, 5, 2),
        )
        DayOverride.objects.create(
            schedule=self.schedule,
            date=date(2025, 4, 27),
            type="WORKDAY",
            reason="Làm bù cho ngày nghỉ 30/4/2025",
            swap_with_date=date(2025, 4, 30),
        )

    def test_holiday_30_april_2025_is_not_working(self):
        """30/4/2025 is in holiday list → False."""
        with patch("plane.utils.business_calendar.cache.cache") as mock_cache:
            mock_cache.get.return_value = None
            mock_cache.set.return_value = None
            result = BusinessCalendarService.is_working_day(date(2025, 4, 30))
        assert result is False

    def test_swap_day_26_april_2025_is_working(self):
        """26/4/2025 (Saturday) has WORKDAY override → True."""
        with patch("plane.utils.business_calendar.cache.cache") as mock_cache:
            mock_cache.get.return_value = None
            mock_cache.set.return_value = None
            result = BusinessCalendarService.is_working_day(date(2025, 4, 26))
        assert result is True

    def test_default_schedule_resolution(self):
        """resolve_schedule(None) returns the is_default=True, workspace=None schedule."""
        from plane.utils.business_calendar.resolver import resolve_schedule
        resolved = resolve_schedule(None)
        assert resolved.id == self.schedule.id
        assert resolved.is_default is True
        assert resolved.workspace is None
