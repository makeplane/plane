# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""BusinessCalendarService — working-day computation for Vietnam Banking calendar."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
from uuid import UUID

from plane.utils.business_calendar.resolver import get_or_build_year_data, resolve_schedule

# Default Vietnam timezone constant — always convert to this before .date()
VN_TZ = ZoneInfo("Asia/Ho_Chi_Minh")


class BusinessCalendarService:
    """
    Stateless service for working-day queries.

    Resolution priority (highest first):
      1. DayOverride  — WORKDAY or HOLIDAY manual override
      2. Holiday      — public holiday list
      3. week_pattern — default workweek booleans [Mon..Sun]

    All methods accept an optional ``schedule_id``; when None the instance-level
    default schedule (workspace=None, is_default=True) is used.
    """

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @classmethod
    def is_working_day(
        cls,
        d: date | datetime,
        schedule_id: UUID | None = None,
    ) -> bool:
        """Return True if *d* is a working day for the given schedule."""
        d = cls._to_vn_date(d)
        schedule = resolve_schedule(schedule_id)
        year_data = get_or_build_year_data(schedule, d.year)

        overrides = year_data.get("overrides", {})
        if d in overrides:
            return overrides[d]["type"] == "WORKDAY"

        holidays = year_data.get("holidays", {})
        if d in holidays:
            return False

        return bool(schedule.week_pattern[d.weekday()])

    @classmethod
    def next_working_day(
        cls,
        d: date | datetime,
        schedule_id: UUID | None = None,
    ) -> date:
        """Return the next working day strictly after *d* (skips weekends + holidays)."""
        d = cls._to_vn_date(d)
        candidate = d + timedelta(days=1)
        while not cls.is_working_day(candidate, schedule_id):
            candidate += timedelta(days=1)
        return candidate

    @classmethod
    def add_business_days(
        cls,
        d: date | datetime,
        n: int,
        schedule_id: UUID | None = None,
    ) -> date:
        """
        Add *n* business days to *d*.
        Negative *n* walks backwards.
        Returns *d* itself when n=0 (even if d is not a working day).
        """
        d = cls._to_vn_date(d)
        if n == 0:
            return d
        step = timedelta(days=1 if n > 0 else -1)
        remaining = abs(n)
        candidate = d
        while remaining > 0:
            candidate += step
            if cls.is_working_day(candidate, schedule_id):
                remaining -= 1
        return candidate

    @classmethod
    def working_days_between(
        cls,
        start: date | datetime,
        end: date | datetime,
        schedule_id: UUID | None = None,
    ) -> int:
        """
        Count working days in the half-open interval [start, end).
        Returns 0 when start >= end.
        Negative when end < start (end counted exclusively).
        """
        start = cls._to_vn_date(start)
        end = cls._to_vn_date(end)
        if start == end:
            return 0
        if start > end:
            return -cls.working_days_between(end, start, schedule_id)
        count = 0
        current = start
        while current < end:
            if cls.is_working_day(current, schedule_id):
                count += 1
            current += timedelta(days=1)
        return count

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _to_vn_date(d: date | datetime) -> date:
        """
        Normalise input to a ``date`` in Vietnam timezone.
        - datetime with tzinfo → converted to VN_TZ then .date()
        - naive datetime       → assumed UTC, localised to VN_TZ then .date()
        - date                 → returned as-is (no tz conversion needed)
        """
        if isinstance(d, datetime):
            if d.tzinfo is None:
                # Treat naive datetime as UTC
                d = d.replace(tzinfo=ZoneInfo("UTC"))
            return d.astimezone(VN_TZ).date()
        return d
