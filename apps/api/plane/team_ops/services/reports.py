# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Reports over the work calendar, with the time logged in Time Tracking next to it.

A work mode is a plan. Nothing here measures presence: the planned numbers and the logged
numbers sit side by side so that people can compare them, and every export says so.
"""

# Python imports
from collections import Counter
from datetime import date as date_type

# Module imports
from plane.team_ops.models import LeaveType, WorkMode
from plane.team_ops.services.day_resolution import resolve_days
from plane.team_ops.services.team_view import (
    KIND_HOLIDAY,
    KIND_UNPLANNED,
    KINDS,
    day_kind,
)
from plane.team_ops.services.weekly_plan import today_in_timezone
from plane.team_ops.services.time_logged import logged_seconds_by_day

REPORT_NOTICE = "A work mode is a plan, not proof of presence or of hours worked."

# Longest period the planned-versus-logged report covers: it lists every day.
MAX_COMPARISON_DAYS = 93

WORKING = (WorkMode.ONSITE.value, WorkMode.REMOTE.value)
DAYS_OFF = (WorkMode.OFF.value, WorkMode.LEAVE.value, KIND_HOLIDAY)

FLAG_PLANNED_NOTHING_LOGGED = "PLANNED_NOTHING_LOGGED"
FLAG_LOGGED_ON_DAY_OFF = "LOGGED_ON_DAY_OFF"
FLAG_LOGGED_NOT_PLANNED = "LOGGED_NOT_PLANNED"

FLAG_LABELS = {
    FLAG_PLANNED_NOTHING_LOGGED: "Planned, nothing logged",
    FLAG_LOGGED_ON_DAY_OFF: "Logged on a day off",
    FLAG_LOGGED_NOT_PLANNED: "Logged with no plan",
}


def plan_summary(workspace, settings_row, people, start, end):
    """Days per category and planned hours for each person over `[start, end]`."""
    user_ids = [user_id for user_id, _ in people]
    resolved = resolve_days(workspace, settings_row, user_ids, start, end)

    rows = []
    totals = {"counts": dict.fromkeys(KINDS, 0), "planned_seconds": 0}
    for user_id in user_ids:
        counts = dict.fromkeys(KINDS, 0)
        leave_by_type = Counter()
        planned_seconds = 0
        for day in resolved[user_id]:
            kind = day_kind(day)
            if kind:
                counts[kind] += 1
            if day["mode"] in WORKING:
                planned_seconds += day["planned_seconds"]
            if day["mode"] == WorkMode.LEAVE.value:
                leave_by_type[day["leave_type"] or LeaveType.OTHER.value] += 1
        rows.append(
            {
                "user": user_id,
                "counts": counts,
                "planned_seconds": planned_seconds,
                "leave_by_type": dict(leave_by_type),
            }
        )
        for kind, count in counts.items():
            totals["counts"][kind] += count
        totals["planned_seconds"] += planned_seconds

    return {"people": rows, "totals": totals, "notice": REPORT_NOTICE}


def _flag(kind, mode, logged_seconds, is_past):
    """What stands out about a day when the plan and the logged time are put side by side, if anything."""
    if kind in DAYS_OFF and logged_seconds > 0:
        return FLAG_LOGGED_ON_DAY_OFF
    if kind in (None, KIND_UNPLANNED) and logged_seconds > 0:
        return FLAG_LOGGED_NOT_PLANNED
    if mode in WORKING and logged_seconds == 0 and is_past:
        return FLAG_PLANNED_NOTHING_LOGGED
    return None


def planned_vs_logged(workspace, settings_row, people, start, end):
    """Planned and logged seconds for each person, with the days where the two disagree.

    Days in the future are never flagged as "planned, nothing logged". Each person's "today" comes
    from their own timezone, the same one their logged time is cut by.
    """
    user_ids = [user_id for user_id, _ in people]
    timezones = dict(people)
    resolved = resolve_days(workspace, settings_row, user_ids, start, end)
    logged = logged_seconds_by_day(workspace, people, start, end)

    rows = []
    totals = {"planned_seconds": 0, "logged_seconds": 0, "flags": dict.fromkeys(FLAG_LABELS, 0)}
    for user_id in user_ids:
        today = today_in_timezone(timezones[user_id])
        planned_total = logged_total = 0
        flags = dict.fromkeys(FLAG_LABELS, 0)
        days = []
        for day in resolved[user_id]:
            on_date = date_type.fromisoformat(day["date"])
            seconds = logged.get((user_id, on_date), 0)
            kind = day_kind(day)
            planned = day["planned_seconds"] if day["mode"] in WORKING else 0
            flag = _flag(kind, day["mode"], seconds, is_past=on_date <= today)
            planned_total += planned
            logged_total += seconds
            if flag:
                flags[flag] += 1
            if day["mode"] or seconds:
                days.append(
                    {
                        "date": day["date"],
                        "kind": kind,
                        "planned_seconds": planned,
                        "logged_seconds": seconds,
                        "flag": flag,
                    }
                )
        rows.append(
            {
                "user": user_id,
                "planned_seconds": planned_total,
                "logged_seconds": logged_total,
                "difference_seconds": logged_total - planned_total,
                "flags": flags,
                "days": days,
            }
        )
        totals["planned_seconds"] += planned_total
        totals["logged_seconds"] += logged_total
        for flag, count in flags.items():
            totals["flags"][flag] += count

    return {"people": rows, "totals": totals, "flag_labels": FLAG_LABELS, "notice": REPORT_NOTICE}
