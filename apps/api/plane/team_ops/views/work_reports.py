# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers, status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import User, Workspace
from plane.team_ops.models import WorkReport
from plane.team_ops.serializers import validate_calendar_date
from plane.team_ops.services.access import CALENDAR_ROLES, CalendarAccess, calendar_user_ids
from plane.team_ops.services.date_params import parse_day, parse_day_range
from plane.team_ops.services.team_view import visible_people
from plane.team_ops.services.time_entry import parse_uuid
from plane.team_ops.services.time_logged import logged_issues
from plane.team_ops.services.weekly_plan import today_in_timezone
from plane.team_ops.services.work_reports import (
    MAX_BOARD_DAYS,
    board,
    parse_kind,
    period_end,
    save_report,
    validate_period,
)


class ReportWriteSerializer(serializers.Serializer):
    done = serializers.CharField(required=False, allow_blank=True, max_length=10000)
    blockers = serializers.CharField(required=False, allow_blank=True, max_length=10000)
    next_steps = serializers.CharField(required=False, allow_blank=True, max_length=10000)
    submit = serializers.BooleanField(required=False, default=False)


def _report_payload(kind, start, user, report):
    return {
        "kind": kind,
        "period_start": start,
        "period_end": period_end(kind, start),
        "user": user.id,
        "done": report.done if report else "",
        "blockers": report.blockers if report else "",
        "next_steps": report.next_steps if report else "",
        "status": report.status if report else None,
        "submitted_at": report.submitted_at if report else None,
        "logged_seconds": report.logged_seconds if report else 0,
    }


class WorkReportListEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """Reports of one person (the caller by default) whose period starts in `[from, to]`."""
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)
        params = request.query_params
        kind = parse_kind(params.get("kind"))
        start, end = parse_day_range(params, require=True)
        target_id = parse_uuid(params["user"], "user") if params.get("user") else request.user.id
        if not access.can_view_user(target_id):
            return Response({"error": "You don't have the required permissions."}, status=status.HTTP_403_FORBIDDEN)

        reports = WorkReport.objects.filter(
            workspace=workspace, user_id=target_id, kind=kind, period_start__gte=start, period_start__lte=end
        )
        results = [
            _report_payload(kind, report.period_start, report.user, report) for report in reports.select_related("user")
        ]
        return Response({"results": results}, status=status.HTTP_200_OK)


class WorkReportDetailEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug, kind, day):
        """One report, or an empty one, with what the person logged in Time Tracking that period."""
        kind = parse_kind(kind)
        start = validate_calendar_date(parse_day(day, "date"))
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)
        target_id = (
            parse_uuid(request.query_params["user"], "user") if request.query_params.get("user") else request.user.id
        )
        if not access.can_view_user(target_id) or target_id not in calendar_user_ids(workspace):
            return Response({"error": "You don't have the required permissions."}, status=status.HTTP_403_FORBIDDEN)

        user = User.objects.get(pk=target_id)
        report = WorkReport.objects.filter(workspace=workspace, user=user, kind=kind, period_start=start).first()
        payload = _report_payload(kind, start, user, report)
        payload["suggestions"] = logged_issues(workspace, user.id, user.user_timezone, start, period_end(kind, start))
        return Response(payload, status=status.HTTP_200_OK)

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def put(self, request, slug, kind, day):
        """Save the caller's own report. People only ever write their own."""
        kind = parse_kind(kind)
        start = validate_calendar_date(parse_day(day, "date"))
        workspace = Workspace.objects.get(slug=slug)
        validate_period(kind, start, today_in_timezone(request.user.user_timezone))

        serializer = ReportWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        report = save_report(
            workspace=workspace, user=request.user, kind=kind, start=start, data=data, submit=data.pop("submit")
        )
        return Response(_report_payload(kind, start, request.user, report), status=status.HTTP_200_OK)


class WorkReportBoardEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """Who has handed in their reports, who has not. Needs the right to see the team."""
        workspace = Workspace.objects.get(slug=slug)
        access = CalendarAccess(request.user, workspace)
        if not access.can_view_team:
            return Response({"error": "You don't have the required permissions."}, status=status.HTTP_403_FORBIDDEN)
        params = request.query_params
        kind = parse_kind(params.get("kind"))
        start, end = parse_day_range(params, require=True, max_days=MAX_BOARD_DAYS[kind])
        people = visible_people(access, workspace, params)
        return Response(
            {"from": start, "to": end, "kind": kind, **board(workspace, access.settings, people, kind, start, end)}
        )
