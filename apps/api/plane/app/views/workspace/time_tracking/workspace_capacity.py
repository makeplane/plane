# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

from datetime import timedelta

from django.db.models import Count, Q, Sum
from django.utils import timezone

from rest_framework.response import Response
from rest_framework import status

from plane.app.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import IssueWorkLog, ProjectMember, Workspace, WorkspaceMember


class WorkspaceCapacityEndpoint(BaseAPIView):
    """
    Per-member capacity report for all workspace projects (filtered by user membership).

    GET /api/workspaces/<slug>/time-tracking/analytics/capacity/
    ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&limit=100&offset=0
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        user = request.user

        # --- date range parsing ---
        today = timezone.now().date()
        default_start = today - timedelta(days=today.weekday())  # Monday
        default_end = default_start + timedelta(days=6)  # Sunday

        date_from = request.query_params.get("date_from", default_start.isoformat())
        date_to = request.query_params.get("date_to", default_end.isoformat())
        member_ids = request.query_params.get("member_id", None)

        # --- workspace bounds validation ---
        try:
            workspace = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        min_date = workspace.created_at.date()
        max_date = timezone.now().date() + timedelta(days=7)

        try:
            from datetime import date as _date

            parsed_from = _date.fromisoformat(date_from)
            parsed_to = _date.fromisoformat(date_to)
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        if parsed_from < min_date:
            return Response(
                {"error": f"date_from cannot be before workspace creation date ({min_date.isoformat()})."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if parsed_from > max_date:
            return Response(
                {"error": f"date_from cannot be more than 7 days in the future."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- MEMBER filtering ---
        is_admin = WorkspaceMember.objects.filter(
            member=user,
            workspace__slug=slug,
            role=20,
            is_active=True,
        ).exists()

        if is_admin:
            member_filter = {
                "workspace__slug": slug,
                "is_active": True,
            }
            worklog_filter = {
                "workspace__slug": slug,
                "logged_at__range": [date_from, date_to],
            }
        else:
            member_project_ids = list(
                ProjectMember.objects.filter(
                    member=user,
                    is_active=True,
                    project__workspace__slug=slug,
                ).values_list("project_id", flat=True)
            )
            if not member_project_ids:
                return Response(
                    {
                        "date_from": date_from,
                        "date_to": date_to,
                        "members": [],
                        "total_logged": 0,
                        "daily_totals": {},
                        "limit": 100,
                        "offset": 0,
                        "total_count": 0,
                    },
                    status=status.HTTP_200_OK,
                )
            member_filter = {
                "workspace__slug": slug,
                "is_active": True,
                "project_id__in": member_project_ids,
            }
            worklog_filter = {
                "workspace__slug": slug,
                "project_id__in": member_project_ids,
                "logged_at__range": [date_from, date_to],
            }

        if member_ids:
            member_id_list = member_ids.split(",")
            member_filter["member_id__in"] = member_id_list
            worklog_filter["logged_by__in"] = member_id_list

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

        # --- get active project members ---
        members = (
            ProjectMember.objects.filter(**member_filter)
            .select_related("member")
            .values_list("member_id", "member__display_name", "member__avatar")
        )

        member_map = {
            str(mid): {"display_name": name, "avatar_url": avatar or ""}
            for mid, name, avatar in members
        }

        # --- aggregate logged time per member ---
        logged_qs = (
            IssueWorkLog.objects.filter(**worklog_filter)
            .values("logged_by")
            .annotate(total_logged=Sum("duration_minutes"))
        )
        logged_map = {str(row["logged_by"]): row["total_logged"] for row in logged_qs}

        # --- daily mapping ---
        daily_logged_qs = (
            IssueWorkLog.objects.filter(**worklog_filter)
            .values("logged_by", "logged_at")
            .annotate(
                daily_logged=Sum("duration_minutes"),
                daily_issues=Count("issue_id", distinct=True),
            )
        )
        member_days_map = {str(mid): {} for mid in member_map.keys()}
        for row in daily_logged_qs:
            mid = str(row["logged_by"])
            if mid in member_days_map:
                date_str = str(row["logged_at"])
                member_days_map[mid][date_str] = row["daily_logged"]

        # --- build result ---
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

        # Sort: by logged desc
        result_members.sort(key=lambda m: -m["total_logged_minutes"])

        total_count = len(result_members)
        paginated_members = result_members[offset : offset + limit]

        # --- workspace-wide daily totals ---
        daily_totals = {}
        for row in daily_logged_qs:
            date_str = str(row["logged_at"])
            if date_str not in daily_totals:
                daily_totals[date_str] = {"minutes": 0, "issue_count": 0}
            daily_totals[date_str]["minutes"] += row["daily_logged"]
            daily_totals[date_str]["issue_count"] += row["daily_issues"]

        return Response(
            {
                "date_from": date_from,
                "date_to": date_to,
                "members": paginated_members,
                "total_logged": total_logged,
                "daily_totals": daily_totals,
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
            },
            status=status.HTTP_200_OK,
        )