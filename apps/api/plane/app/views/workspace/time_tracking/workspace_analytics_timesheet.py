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
from plane.db.models import IssueWorkLog, ProjectMember, Workspace, WorkspaceMember


class WorkspaceAnalyticsTimesheetEndpoint(BaseAPIView):
    """
    Week-grid timesheet for ALL workspace projects (filtered by user membership).

    GET /api/workspaces/<slug>/time-tracking/analytics/timesheet/
    ?week_start=YYYY-MM-DD&limit=100&offset=0
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        # --- week_start parsing ---
        raw = request.query_params.get("week_start")
        if raw:
            from datetime import date as _date

            try:
                d = _date.fromisoformat(raw)
                week_start = d - timedelta(days=d.weekday())
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            today = timezone.now().date()
            week_start = today - timedelta(days=today.weekday())

        week_end = week_start + timedelta(days=6)

        # --- workspace bounds validation ---
        try:
            workspace = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        min_date = workspace.created_at.date()
        max_date = timezone.now().date() + timedelta(days=7)

        if week_start < min_date:
            return Response(
                {"error": f"week_start cannot be before workspace creation date ({min_date.isoformat()})."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if week_start > max_date:
            return Response(
                {"error": f"week_start cannot be more than 7 days in the future."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- MEMBER filtering: ADMIN sees all, MEMBER sees only their projects ---
        user = request.user
        is_admin = WorkspaceMember.objects.filter(
            member=user,
            workspace__slug=slug,
            role=20,
            is_active=True,
        ).exists()

        if is_admin:
            project_filter = {"project__workspace__slug": slug}
        else:
            member_project_ids = list(
                ProjectMember.objects.filter(
                    member=user,
                    is_active=True,
                    project__workspace__slug=slug,
                ).values_list("project_id", flat=True)
            )
            if not member_project_ids:
                # No membership — return empty response
                return Response(
                    {
                        "week_start": week_start.isoformat(),
                        "week_end": week_end.isoformat(),
                        "rows": [],
                        "daily_totals": {},
                        "grand_total_minutes": 0,
                    },
                    status=status.HTTP_200_OK,
                )
            project_filter = {"project_id__in": member_project_ids}

        # --- pagination ---
        try:
            limit = int(request.query_params.get("limit", 100))
        except ValueError:
            limit = 100
        limit = min(limit, 1000)

        try:
            offset = int(request.query_params.get("offset", 0))
        except ValueError:
            offset = 0

        # --- fetch worklogs ---
        worklogs = (
            IssueWorkLog.objects.filter(
                workspace__slug=slug,
                logged_at__range=[week_start, week_end],
                **project_filter,
            )
            .select_related("issue__project", "logged_by")
            .values(
                "issue_id",
                "issue__name",
                "issue__sequence_id",
                "issue__project__identifier",
                "issue__project_id",
                "logged_by_id",
                "logged_by__display_name",
                "logged_by__avatar",
                "logged_at",
            )
            .annotate(total=Sum("duration_minutes"))
        )

        # --- build issue map ---
        issue_map = {}
        for wl in worklogs:
            iid = str(wl["issue_id"])
            date_str = wl["logged_at"].isoformat()
            uid = str(wl["logged_by_id"])
            mins = wl["total"]

            if iid not in issue_map:
                issue_map[iid] = {
                    "issue_id": iid,
                    "issue_name": wl["issue__name"],
                    "issue_identifier": f"{wl['issue__project__identifier']}-{wl['issue__sequence_id']}",
                    "project_id": str(wl["issue__project_id"]),
                    "days": defaultdict(int),
                    "by_user": {},
                    "total_minutes": 0,
                }

            issue_map[iid]["days"][date_str] += mins
            issue_map[iid]["total_minutes"] += mins

            if uid not in issue_map[iid]["by_user"]:
                issue_map[iid]["by_user"][uid] = {
                    "user_id": uid,
                    "display_name": wl["logged_by__display_name"],
                    "avatar_url": wl["logged_by__avatar"] or "",
                    "days": defaultdict(int),
                    "total_minutes": 0,
                }
            issue_map[iid]["by_user"][uid]["days"][date_str] += mins
            issue_map[iid]["by_user"][uid]["total_minutes"] += mins

        # --- serialize ---
        rows = []
        for info in issue_map.values():
            rows.append({
                **info,
                "days": dict(info["days"]),
                "by_user": [
                    {**u, "days": dict(u["days"])}
                    for u in info["by_user"].values()
                ],
            })
        rows.sort(key=lambda r: -r["total_minutes"])

        # --- apply pagination ---
        total_count = len(rows)
        paginated_rows = rows[offset : offset + limit]

        # --- daily totals ---
        daily_totals = defaultdict(int)
        for r in paginated_rows:
            for day, mins in r["days"].items():
                daily_totals[day] += mins

        grand_total = sum(r["total_minutes"] for r in paginated_rows)

        return Response(
            {
                "week_start": week_start.isoformat(),
                "week_end": week_end.isoformat(),
                "rows": paginated_rows,
                "daily_totals": dict(daily_totals),
                "grand_total_minutes": grand_total,
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
            },
            status=status.HTTP_200_OK,
        )