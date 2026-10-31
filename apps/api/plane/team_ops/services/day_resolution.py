# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Resolving what a day looks like for a person.

One function, `resolve_day`, decides it for every view and report:

1. an entry set by hand (`MANUAL`)
2. a holiday
3. an entry written out from the weekly plan (`TEMPLATE`)
4. otherwise nothing is planned

A working day is a configured working weekday that is not a holiday. A working day without a
plan is "unplanned".
"""

# Python imports
from collections import defaultdict
from datetime import timedelta

# Module imports
from plane.team_ops.models import CalendarEntry, CalendarHoliday

SOURCE_MANUAL = "MANUAL"
SOURCE_TEMPLATE = "TEMPLATE"
SOURCE_HOLIDAY = "HOLIDAY"
SOURCE_NONE = "NONE"


def iter_days(start, end):
    """Every date from `start` to `end`, both included."""
    for offset in range((end - start).days + 1):
        yield start + timedelta(days=offset)


def format_time(value):
    return value.strftime("%H:%M") if value else None


def planned_seconds(start_time, end_time):
    """Length of a planned window in seconds; 0 when the day has no times."""
    if not start_time or not end_time:
        return 0
    return (end_time.hour * 3600 + end_time.minute * 60 + end_time.second) - (
        start_time.hour * 3600 + start_time.minute * 60 + start_time.second
    )


def resolve_day(day, entry, holiday_name, working_weekdays):
    """The plan that applies to `day`, as the JSON the API returns."""
    if entry is not None and entry.source == CalendarEntry.Source.MANUAL:
        source, applied = SOURCE_MANUAL, entry
    elif holiday_name:
        source, applied = SOURCE_HOLIDAY, None
    elif entry is not None:
        source, applied = SOURCE_TEMPLATE, entry
    else:
        source, applied = SOURCE_NONE, None

    is_working_day = day.isoweekday() in working_weekdays and not holiday_name
    mode = applied.work_mode if applied else None
    return {
        "date": day.isoformat(),
        "mode": mode,
        "source": source,
        "planned_start_time": format_time(applied.planned_start_time) if applied else None,
        "planned_end_time": format_time(applied.planned_end_time) if applied else None,
        "planned_seconds": planned_seconds(applied.planned_start_time, applied.planned_end_time) if applied else 0,
        "description": applied.description if applied else "",
        "leave_type": applied.leave_type if applied else None,
        "holiday": holiday_name or None,
        "is_working_day": is_working_day,
        "is_unplanned": is_working_day and mode is None,
        "entry": applied.id if applied else None,
    }


def resolve_days(workspace, settings_row, user_ids, start, end):
    """`{user_id: [day, ...]}` for every date from `start` to `end`, for each of `user_ids`."""
    user_ids = list(user_ids)
    entries_by_user = defaultdict(dict)
    entries = CalendarEntry.objects.filter(
        workspace=workspace, user_id__in=user_ids, work_date__gte=start, work_date__lte=end
    )
    for entry in entries:
        entries_by_user[entry.user_id][entry.work_date] = entry

    holidays = dict(
        CalendarHoliday.objects.filter(workspace=workspace, date__gte=start, date__lte=end).values_list("date", "name")
    )
    working_weekdays = set(settings_row.working_weekdays)

    return {
        user_id: [
            resolve_day(day, entries_by_user[user_id].get(day), holidays.get(day), working_weekdays)
            for day in iter_days(start, end)
        ]
        for user_id in user_ids
    }
