# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

from collections import defaultdict
from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Issue, IssueWorkLog, ProjectMember, WorkspaceMember


def _get_week_start(raw_date_str):
    """Parse optional week_start string, snap to Monday. Returns (date, error_str)."""
    if raw_date_str:
        from datetime import date as _date
        try:
            d = _date.fromisoformat(raw_date_str)
            return d - timedelta(days=d.weekday()), None
        except ValueError:
            return None, "Invalid date format. Use YYYY-MM-DD."
    today = timezone.now().date()
    return today - timedelta(days=today.weekday()), None


class CrossWorkspaceTimesheetEndpoint(BaseAPIView):
    """
    My Timesheet grid across ALL workspaces the current user is a member of.
    Shows ALL issues assigned to the user (with their logged time for the week, 0 if no logs).

    GET /api/workspaces/<slug>/time-tracking/cross-workspace/timesheet/
    ?week_start=YYYY-MM-DD  (optional, defaults to current week Monday)

    <slug> is used for auth context only; data spans ALL user workspaces.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        week_start, err = _get_week_start(request.query_params.get("week_start"))
        if err:
            return Response({"error": err}, status=400)
        week_end = week_start + timedelta(days=6)

        # All workspace IDs this user is actively a member of
        user_workspace_ids = list(
            WorkspaceMember.objects.filter(
                member=request.user,
                is_active=True,
            ).values_list("workspace_id", flat=True)
        )

        # All issues assigned to this user across their workspaces
        assigned_issues = list(
            Issue.issue_objects.filter(
                workspace_id__in=user_workspace_ids,
                assignees=request.user,
            )
            .select_related("project", "workspace")
            .values(
                "id",
                "name",
                "sequence_id",
                "project__identifier",
                "project_id",
                "workspace__slug",
                "workspace__name",
            )
        )

        assigned_issue_ids = [i["id"] for i in assigned_issues]

        # Worklogs by this user for the week, restricted to assigned issues
        worklogs = (
            IssueWorkLog.objects.filter(
                issue_id__in=assigned_issue_ids,
                logged_by=request.user,
                logged_at__range=[week_start, week_end],
            )
            .values("issue_id", "logged_at")
            .annotate(total=Sum("duration_minutes"))
        )

        issue_days = defaultdict(lambda: defaultdict(int))
        for wl in worklogs:
            iid = str(wl["issue_id"])
            day = wl["logged_at"].isoformat()
            issue_days[iid][day] += wl["total"]

        rows = []
        for issue in assigned_issues:
            iid = str(issue["id"])
            days = dict(issue_days[iid])
            total = sum(days.values())
            rows.append({
                "issue_id": iid,
                "issue_name": issue["name"],
                "issue_identifier": f"{issue['project__identifier']}-{issue['sequence_id']}",
                "project_id": str(issue["project_id"]),
                "workspace_slug": issue["workspace__slug"],
                "workspace_name": issue["workspace__name"],
                "days": days,
                "total_minutes": total,
            })

        rows.sort(key=lambda r: -r["total_minutes"])

        daily_totals = defaultdict(int)
        for r in rows:
            for day, mins in r["days"].items():
                daily_totals[day] += mins

        grand_total = sum(r["total_minutes"] for r in rows)

        return Response(
            {
                "week_start": week_start.isoformat(),
                "week_end": week_end.isoformat(),
                "rows": rows,
                "daily_totals": dict(daily_totals),
                "grand_total_minutes": grand_total,
            },
            status=status.HTTP_200_OK,
        )


class CrossWorkspaceCapacityEndpoint(BaseAPIView):
    """
    Capacity report across ALL workspaces the current user is a member of.
    Lists ALL members from all user workspaces with their logged time in date range.

    GET /api/workspaces/<slug>/time-tracking/cross-workspace/capacity/
    ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD  (optional, defaults to current week)

    <slug> is used for auth context only.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        today = timezone.now().date()
        default_start = today - timedelta(days=today.weekday())
        default_end = default_start + timedelta(days=6)

        date_from = request.query_params.get("date_from", default_start.isoformat())
        date_to = request.query_params.get("date_to", default_end.isoformat())

        # All workspace IDs the user is actively a member of
        user_workspace_ids = list(
            WorkspaceMember.objects.filter(
                member=request.user,
                is_active=True,
            ).values_list("workspace_id", flat=True)
        )

        # All active project members across those workspaces (deduplicated by user)
        members_qs = (
            ProjectMember.objects.filter(
                workspace_id__in=user_workspace_ids,
                is_active=True,
            )
            .select_related("member", "workspace")
            .values_list("member_id", "member__display_name", "member__avatar", "workspace__slug")
        )

        member_map = {}
        for mid, name, avatar, ws_slug in members_qs:
            key = str(mid)
            if key not in member_map:
                member_map[key] = {
                    "display_name": name,
                    "avatar_url": avatar or "",
                    "workspaces": set(),
                }
            member_map[key]["workspaces"].add(ws_slug)

        worklog_filters = {
            "workspace_id__in": user_workspace_ids,
            "logged_at__range": [date_from, date_to],
        }

        # Total per member
        logged_qs = (
            IssueWorkLog.objects.filter(**worklog_filters)
            .values("logged_by")
            .annotate(total_logged=Sum("duration_minutes"))
        )
        logged_map = {str(r["logged_by"]): r["total_logged"] for r in logged_qs}

        # Daily per member
        daily_qs = (
            IssueWorkLog.objects.filter(**worklog_filters)
            .values("logged_by", "logged_at")
            .annotate(daily_logged=Sum("duration_minutes"))
        )
        member_days_map = {mid: {} for mid in member_map.keys()}
        for row in daily_qs:
            mid = str(row["logged_by"])
            if mid in member_days_map:
                member_days_map[mid][str(row["logged_at"])] = row["daily_logged"]

        result_members = []
        total_logged = 0
        for mid, info in member_map.items():
            member_logged = logged_map.get(mid, 0) or 0
            total_logged += member_logged
            result_members.append({
                "member_id": mid,
                "display_name": info["display_name"],
                "avatar_url": info["avatar_url"],
                "total_logged_minutes": member_logged,
                "days": member_days_map.get(mid, {}),
            })

        result_members.sort(key=lambda m: -m["total_logged_minutes"])

        return Response(
            {
                "date_from": date_from,
                "date_to": date_to,
                "members": result_members,
                "project_total_logged": total_logged,
            },
            status=status.HTTP_200_OK,
        )


class CrossWorkspaceCapacityDayDetailsEndpoint(BaseAPIView):
    """
    Day-level work item details for a member across ALL user workspaces.
    Used by the capacity heatmap popover in cross-workspace mode.

    GET /api/workspaces/<slug>/time-tracking/cross-workspace/capacity/day-details/
    ?member_id=<uuid>&date=YYYY-MM-DD
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        member_id = request.query_params.get("member_id")
        date_str = request.query_params.get("date")

        if not member_id or not date_str:
            return Response({"error": "member_id and date are required."}, status=400)

        user_workspace_ids = list(
            WorkspaceMember.objects.filter(
                member=request.user,
                is_active=True,
            ).values_list("workspace_id", flat=True)
        )

        worklogs = (
            IssueWorkLog.objects.filter(
                workspace_id__in=user_workspace_ids,
                logged_by_id=member_id,
                logged_at=date_str,
            )
            .select_related("issue__project", "issue__workspace")
            .values(
                "issue_id",
                "issue__name",
                "issue__sequence_id",
                "issue__project__identifier",
            )
            .annotate(total=Sum("duration_minutes"))
        )

        tasks = [
            {
                "issue_id": str(wl["issue_id"]),
                "issue_name": wl["issue__name"],
                "issue_identifier": f"{wl['issue__project__identifier']}-{wl['issue__sequence_id']}",
                "total_minutes": wl["total"],
            }
            for wl in worklogs
        ]
        tasks.sort(key=lambda t: -t["total_minutes"])

        return Response({"tasks": tasks}, status=status.HTTP_200_OK)
