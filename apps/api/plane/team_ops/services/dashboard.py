# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The management dashboard: one view over the plan, Time Tracking and the work reports."""

# Python imports
from datetime import datetime, time as time_of_day, timedelta
from zoneinfo import ZoneInfo

# Django imports
from django.db.models import Count, Q, Sum

# Module imports
from plane.team_ops.models import WorkSession
from plane.team_ops.services.reports import plan_summary, planned_vs_logged
from plane.team_ops.services.team_view import summarize_team
from plane.team_ops.services.time_logged import logged_by_project
from plane.team_ops.services.weekly_plan import today_in_timezone
from plane.team_ops.services.work_reports import DAILY, board

# Longest period the dashboard covers.
MAX_DASHBOARD_DAYS = 62


def workday_summary(workspace, people, start, end, reference_timezone):
    """What was finished in the period: how many sessions, how many without a document, how many asked
    others to look, and where the time went."""
    zone = ZoneInfo(reference_timezone or "UTC")
    window = {
        "finished_at__gte": datetime.combine(start, time_of_day.min, zone),
        "finished_at__lt": datetime.combine(end + timedelta(days=1), time_of_day.min, zone),
    }
    sessions = WorkSession.objects.filter(workspace=workspace, user_id__in=[user_id for user_id, _ in people], **window)
    totals = sessions.aggregate(
        finished=Count("id"),
        no_document=Count("id", filter=Q(no_document=True)),
        needs_attention=Count("id", filter=Q(needs_attention=True)),
        seconds=Sum("duration_seconds"),
    )
    tasks = (
        sessions.exclude(issue__isnull=True)
        .values("issue_id", "issue__name", "issue__sequence_id", "issue__project__identifier")
        .annotate(seconds=Sum("duration_seconds"), sessions=Count("id"))
        .order_by("-seconds")[:5]
    )
    return {
        "finished": totals["finished"],
        "no_document": totals["no_document"],
        "needs_attention": totals["needs_attention"],
        "seconds": totals["seconds"] or 0,
        "tasks": [
            {
                "issue": row["issue_id"],
                "name": row["issue__name"],
                "key": f"{row['issue__project__identifier']}-{row['issue__sequence_id']}",
                "seconds": row["seconds"],
                "sessions": row["sessions"],
            }
            for row in tasks
        ],
    }


def build_dashboard(workspace, settings_row, people, start, end, reference_timezone):
    """Everything the dashboard shows for `people` over `[start, end]`.

    `today` is the plan of the day in `reference_timezone` (the viewer's), so it always says who is
    where right now, whatever period is selected.
    """
    today = today_in_timezone(reference_timezone)
    plan = plan_summary(workspace, settings_row, people, start, end)
    time = planned_vs_logged(workspace, settings_row, people, start, end)
    reports = board(workspace, settings_row, people, DAILY, start, end)

    report_totals = {"SUBMITTED": 0, "DRAFT": 0, "MISSING": 0}
    missing = {}
    for person in reports["people"]:
        missing[person["user"]] = person["missing"]
        for cell in person["periods"]:
            if cell["status"] in report_totals:
                report_totals[cell["status"]] += 1

    plan_by_user = {row["user"]: row for row in plan["people"]}
    people_rows = [
        {
            "user": row["user"],
            "plan_counts": plan_by_user[row["user"]]["counts"],
            "planned_seconds": row["planned_seconds"],
            "logged_seconds": row["logged_seconds"],
            "flags": row["flags"],
            "missing_reports": missing.get(row["user"], 0),
        }
        for row in time["people"]
    ]

    today_view = summarize_team(workspace, settings_row, people, today, today)["days"][0]
    return {
        "people_count": len(people),
        "today": {"date": today.isoformat(), "counts": today_view["counts"], "users": today_view["users"]},
        "plan": {"counts": plan["totals"]["counts"], "planned_seconds": plan["totals"]["planned_seconds"]},
        "time": time["totals"],
        "reports": report_totals,
        "projects": logged_by_project(workspace, people, start, end),
        "workday": workday_summary(workspace, people, start, end, reference_timezone),
        "people": people_rows,
    }
