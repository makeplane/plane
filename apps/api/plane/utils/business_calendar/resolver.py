# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Schedule resolution and year-data builder for BusinessCalendarService."""

from __future__ import annotations

from datetime import date
from typing import Any
from uuid import UUID

from plane.utils.business_calendar.cache import get_year_data, set_year_data


def resolve_schedule(schedule_id: UUID | None) -> Any:
    """
    Return the WorkSchedule for the given id, or the instance-level default
    (workspace=None, is_default=True) when schedule_id is None.

    Raises WorkSchedule.DoesNotExist if no matching schedule found.
    """
    # Lazy import avoids circular import: utils → models → apps → utils
    from plane.db.models import WorkSchedule

    if schedule_id is not None:
        return WorkSchedule.objects.get(id=schedule_id)
    return WorkSchedule.objects.get(is_default=True, workspace=None)


def build_year_data(schedule: Any, year: int) -> dict[str, Any]:
    """
    Query DB for all Holiday and DayOverride records for the given schedule+year
    and return a dict suitable for cache storage.

    Returns:
        {
          "holidays":  {date: name_str, ...},
          "overrides": {date: {"type": "WORKDAY"|"HOLIDAY", "reason": str}, ...},
        }
    """
    holidays: dict[date, str] = {
        h.date: h.name
        for h in schedule.holidays.filter(date__year=year)
    }
    overrides: dict[date, dict[str, str]] = {
        ov.date: {"type": ov.type, "reason": ov.reason}
        for ov in schedule.overrides.filter(date__year=year)
    }
    return {"holidays": holidays, "overrides": overrides}


def get_or_build_year_data(schedule: Any, year: int) -> dict[str, Any]:
    """
    Return year data from cache, building and caching it on miss.
    O(1) on cache hit; one DB round-trip on miss fetching ~15-20 rows/year.
    """
    cached = get_year_data(schedule.id, year)
    if cached is not None:
        return cached
    data = build_year_data(schedule, year)
    set_year_data(schedule.id, year, data)
    return data
