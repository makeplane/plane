# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Daily and weekly work reports and the team board that shows who has written theirs."""

# Python imports
from datetime import timedelta

# Django imports
from django.db import transaction
from django.utils import timezone

# Third party imports
from rest_framework.exceptions import ParseError

# Module imports
from plane.team_ops.models import WorkReport
from plane.team_ops.services.day_resolution import resolve_days
from plane.team_ops.services.time_logged import logged_seconds_by_day
from plane.team_ops.services.weekly_plan import today_in_timezone

DAILY, WEEKLY = WorkReport.Kind.DAILY.value, WorkReport.Kind.WEEKLY.value

STATUS_SUBMITTED = "SUBMITTED"
STATUS_DRAFT = "DRAFT"
STATUS_MISSING = "MISSING"
STATUS_NOT_EXPECTED = "NOT_EXPECTED"

# Longest range of the board: a day-by-day grid of two months, or about a year of weeks.
MAX_BOARD_DAYS = {DAILY: 62, WEEKLY: 366}


def parse_kind(value):
    kind = (value or "").upper()
    if kind not in (DAILY, WEEKLY):
        raise ParseError(detail="Invalid kind. Use DAILY or WEEKLY.")
    return kind


def week_start(day):
    """The Monday of the week containing `day`."""
    return day - timedelta(days=day.weekday())


def period_end(kind, start):
    return start if kind == DAILY else start + timedelta(days=6)


def validate_period(kind, start, today):
    """A report covers a whole day or Monday-to-Sunday week, and cannot be about the future."""
    if kind == WEEKLY and start.weekday() != 0:
        raise ParseError(detail="A weekly report starts on a Monday.")
    latest = today if kind == DAILY else week_start(today)
    if start > latest:
        raise ParseError(detail="A report cannot be written for a period that has not started.")


def save_report(*, workspace, user, kind, start, data, submit):
    """Write (or rewrite) one person's report; with `submit` it is handed in.

    The first submission fixes `submitted_at` and the Time Tracking total of the period.
    """
    end = period_end(kind, start)
    with transaction.atomic():
        report, _ = WorkReport.objects.select_for_update().get_or_create(
            workspace=workspace, user=user, kind=kind, period_start=start
        )
        for field in ("done", "blockers", "next_steps"):
            if field in data:
                setattr(report, field, data[field])
        if submit:
            if report.status != WorkReport.Status.SUBMITTED:
                logged = logged_seconds_by_day(workspace, [(user.id, user.user_timezone)], start, end)
                report.submitted_at = timezone.now()
                report.logged_seconds = sum(logged.values())
            report.status = WorkReport.Status.SUBMITTED
        report.save()
    return report


def _expected(day):
    """Is a person expected to report on this resolved day?"""
    if day["mode"] in ("ONSITE", "REMOTE"):
        return True
    return day["mode"] is None and day["is_working_day"]


def board(workspace, settings_row, people, kind, start, end):
    """For each person, the status of every report period in `[start, end]`.

    A period is expected when the person works on at least one of its days (a working day that is
    not a holiday, day off or leave). Periods that have not started yet are never expected.
    """
    user_ids = [user_id for user_id, _ in people]
    timezones = dict(people)
    first = week_start(start) if kind == WEEKLY else start
    step = 7 if kind == WEEKLY else 1
    starts = []
    cursor = first
    while cursor <= end:
        starts.append(cursor)
        cursor += timedelta(days=step)

    resolved = resolve_days(workspace, settings_row, user_ids, first, period_end(kind, starts[-1]))
    reports = {
        (report.user_id, report.period_start): report.status
        for report in WorkReport.objects.filter(
            workspace=workspace, user_id__in=user_ids, kind=kind, period_start__in=starts
        )
    }

    rows = []
    for user_id in user_ids:
        today = today_in_timezone(timezones[user_id])
        days = {day["date"]: day for day in resolved[user_id]}
        cells, missing = [], 0
        for period in starts:
            status = reports.get((user_id, period))
            if status is None:
                covered = [period + timedelta(days=offset) for offset in range(1 if kind == DAILY else 7)]
                expected = period <= today and any(_expected(days[d.isoformat()]) for d in covered)
                status = STATUS_MISSING if expected else STATUS_NOT_EXPECTED
            missing += status == STATUS_MISSING
            cells.append({"start": period.isoformat(), "status": status})
        rows.append({"user": user_id, "periods": cells, "missing": missing})
    return {"periods": [period.isoformat() for period in starts], "people": rows}
