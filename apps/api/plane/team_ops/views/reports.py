# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models.functions import Lower

# Third party imports
from rest_framework import status
from rest_framework.exceptions import ParseError
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import User, Workspace
from plane.team_ops.models import LeaveType, WorkMode
from plane.team_ops.services.access import CALENDAR_ROLES, CalendarAccess
from plane.team_ops.services.reports import (
    FLAG_LABELS,
    MAX_COMPARISON_DAYS,
    REPORT_NOTICE,
    plan_summary,
    planned_vs_logged,
)
from plane.team_ops.services.team_view import visible_people
from plane.team_ops.services.csv_export import csv_response, csv_safe, hours
from plane.team_ops.services.date_params import parse_day_range

KIND_COLUMNS = {
    "ONSITE": "Onsite days",
    "REMOTE": "Remote days",
    "OFF": "Day off days",
    "LEAVE": "Leave days",
    "HOLIDAY": "Holidays",
    "UNPLANNED": "Not planned working days",
}

# What a day is called in the CSV rows of the planned-versus-logged report.
KIND_LABELS = {
    **{mode.value: mode.label for mode in WorkMode},
    "HOLIDAY": "Holiday",
    "UNPLANNED": "Not planned",
}


def _wants_csv(params):
    """`export=csv` asks for a download. (`format` is left alone: DRF reads it to pick a renderer.)"""
    export = params.get("export", "json").lower()
    if export not in ("json", "csv"):
        raise ParseError(detail="Invalid export. Use json or csv.")
    return export == "csv"


def _people_names(user_ids):
    return {
        row["id"]: (row["display_name"] or row["email"], row["email"])
        for row in User.objects.filter(id__in=user_ids)
        .order_by(Lower("display_name"))
        .values("id", "display_name", "email")
    }


class _ReportEndpoint(BaseAPIView):
    max_days = None

    def _prepare(self, request, slug):
        """The workspace, the caller's access, the date range and the people the report covers.

        People who may not see the team get their own row only; leads get their teams; admins everyone.
        """
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)
        params = request.query_params
        kwargs = {"max_days": self.max_days} if self.max_days else {}
        start, end = parse_day_range(params, require=True, **kwargs)
        wants_csv = _wants_csv(params)
        people = visible_people(access, workspace, params)
        return workspace, access, start, end, people, wants_csv


class CalendarPlanSummaryReportEndpoint(_ReportEndpoint):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """Days per work mode, holidays and unplanned working days for each person, with planned hours.

        Filters: `team`, `project`, `user`. Add `export=csv` to download it.
        """
        workspace, access, start, end, people, wants_csv = self._prepare(request, slug)
        report = plan_summary(workspace, access.settings, people, start, end)

        if wants_csv:
            names = _people_names([row["user"] for row in report["people"]])
            header = ["Person", "Email", *KIND_COLUMNS.values(), "Planned hours", "Leave by type"]
            rows = []
            for row in report["people"]:
                name, email = (csv_safe(value) for value in names.get(row["user"], ("", "")))
                leave = ", ".join(
                    f"{LeaveType(kind).label}: {count}" for kind, count in sorted(row["leave_by_type"].items())
                )
                rows.append(
                    [name, email, *(row["counts"][kind] for kind in KIND_COLUMNS), hours(row["planned_seconds"]), leave]
                )
            totals = report["totals"]
            rows.append(
                ["Total", "", *(totals["counts"][kind] for kind in KIND_COLUMNS), hours(totals["planned_seconds"]), ""]
            )
            return csv_response(f"plan-summary_{start}_{end}.csv", header, rows, REPORT_NOTICE)

        return Response({"from": start, "to": end, **report}, status=status.HTTP_200_OK)


class CalendarPlannedVsLoggedReportEndpoint(_ReportEndpoint):
    max_days = MAX_COMPARISON_DAYS

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """Planned hours next to the time logged in Time Tracking, per person and per day.

        Filters: `team`, `project`, `user`. Add `export=csv` for one row per person and day.
        """
        workspace, access, start, end, people, wants_csv = self._prepare(request, slug)
        report = planned_vs_logged(workspace, access.settings, people, start, end)

        if wants_csv:
            names = _people_names([row["user"] for row in report["people"]])
            header = ["Date", "Person", "Email", "Plan", "Planned hours", "Logged hours", "Difference hours", "Note"]
            rows = []
            for row in report["people"]:
                name, email = (csv_safe(value) for value in names.get(row["user"], ("", "")))
                for day in row["days"]:
                    plan = KIND_LABELS.get(day["kind"], "")
                    difference = day["logged_seconds"] - day["planned_seconds"]
                    rows.append(
                        [
                            day["date"],
                            name,
                            email,
                            plan,
                            hours(day["planned_seconds"]),
                            hours(day["logged_seconds"]),
                            f"{difference / 3600:+.2f}",
                            FLAG_LABELS.get(day["flag"], ""),
                        ]
                    )
            return csv_response(f"planned-vs-logged_{start}_{end}.csv", header, rows, REPORT_NOTICE)

        return Response({"from": start, "to": end, **report}, status=status.HTTP_200_OK)
