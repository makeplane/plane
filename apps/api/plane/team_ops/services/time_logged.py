# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Time Tracking numbers per person and local day, for comparing with the work calendar.

The work calendar speaks in plain dates and Time Tracking in timestamps, so a day is cut in each
person's own profile timezone. There is no foreign key between the two: they only meet here, by
user and date.
"""

# Python imports
from collections import defaultdict
from datetime import datetime, time, timedelta, timezone as dt_timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

# Django imports
from django.db.models import Sum
from django.db.models.functions import TruncDate

# Module imports
from plane.team_ops.models import TimeEntry


def _zone(name):
    try:
        return ZoneInfo(name)
    except (ZoneInfoNotFoundError, ValueError):
        return dt_timezone.utc


def _by_timezone(users):
    """`{timezone_name: [user_id, ...]}` from `(user_id, timezone_name)` pairs."""
    groups = defaultdict(list)
    for user_id, tz_name in users:
        groups[tz_name].append(user_id)
    return groups


def _window(zone, start, end):
    """The instants where the local days `start` to `end` (both included) begin and end."""
    return (
        datetime.combine(start, time.min, tzinfo=zone),
        datetime.combine(end + timedelta(days=1), time.min, tzinfo=zone),
    )


def logged_seconds_by_day(workspace, users, start, end):
    """`{(user_id, date): seconds}` of time logged on each local day from `start` to `end`.

    `users` is a list of `(user_id, timezone_name)`.
    """
    logged = {}
    for tz_name, user_ids in _by_timezone(users).items():
        zone = _zone(tz_name)
        window_start, window_end = _window(zone, start, end)
        rows = (
            TimeEntry.objects.filter(
                workspace=workspace, user_id__in=user_ids, started_at__gte=window_start, started_at__lt=window_end
            )
            .annotate(day=TruncDate("started_at", tzinfo=zone))
            .values("user_id", "day")
            .annotate(seconds=Sum("duration_seconds"))
        )
        for row in rows:
            logged[(row["user_id"], row["day"])] = row["seconds"]
    return logged


def top_projects_on_day(workspace, users, day):
    """`{user_id: {"id", "name", "identifier", "seconds"}}`: the project each person logged most time on.

    Entries without a work item have no project and are left out.
    """
    best = {}
    for tz_name, user_ids in _by_timezone(users).items():
        window_start, window_end = _window(_zone(tz_name), day, day)
        rows = (
            TimeEntry.objects.filter(
                workspace=workspace,
                user_id__in=user_ids,
                started_at__gte=window_start,
                started_at__lt=window_end,
                project__isnull=False,
            )
            .values("user_id", "project_id", "project__name", "project__identifier")
            .annotate(seconds=Sum("duration_seconds"))
        )
        for row in rows:
            current = best.get(row["user_id"])
            if current is None or row["seconds"] > current["seconds"]:
                best[row["user_id"]] = {
                    "id": row["project_id"],
                    "name": row["project__name"],
                    "identifier": row["project__identifier"],
                    "seconds": row["seconds"],
                }
    return best


def logged_issues(workspace, user_id, timezone_name, start, end, limit=10):
    """The work items one person logged time on over `[start, end]`, most time first.

    Entries without a work item are left out. Used to suggest what to put in a report.
    """
    window_start, window_end = _window(_zone(timezone_name), start, end)
    rows = (
        TimeEntry.objects.filter(
            workspace=workspace,
            user_id=user_id,
            started_at__gte=window_start,
            started_at__lt=window_end,
            issue__isnull=False,
        )
        .values("issue_id", "issue__name", "issue__sequence_id", "issue__project__identifier")
        .annotate(seconds=Sum("duration_seconds"))
        .order_by("-seconds")[:limit]
    )
    return [
        {
            "issue": row["issue_id"],
            "name": row["issue__name"],
            "key": f"{row['issue__project__identifier']}-{row['issue__sequence_id']}",
            "seconds": row["seconds"],
        }
        for row in rows
    ]


def logged_by_project(workspace, users, start, end, limit=10):
    """The projects the given people logged the most time on over `[start, end]`, most time first.

    Entries without a work item have no project and are left out.
    """
    totals = {}
    for tz_name, user_ids in _by_timezone(users).items():
        window_start, window_end = _window(_zone(tz_name), start, end)
        rows = (
            TimeEntry.objects.filter(
                workspace=workspace,
                user_id__in=user_ids,
                started_at__gte=window_start,
                started_at__lt=window_end,
                project__isnull=False,
            )
            .values("project_id", "project__name", "project__identifier")
            .annotate(seconds=Sum("duration_seconds"))
        )
        for row in rows:
            entry = totals.setdefault(
                row["project_id"],
                {
                    "id": row["project_id"],
                    "name": row["project__name"],
                    "identifier": row["project__identifier"],
                    "seconds": 0,
                },
            )
            entry["seconds"] += row["seconds"]
    return sorted(totals.values(), key=lambda item: -item["seconds"])[:limit]
