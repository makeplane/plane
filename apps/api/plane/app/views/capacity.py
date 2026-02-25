# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta

from django.db.models import Sum, Value, Count
from django.utils import timezone

from rest_framework.response import Response
from rest_framework import status

from plane.app.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import IssueWorkLog, Issue, ProjectMember


class ProjectCapacityEndpoint(BaseAPIView):
    """Per-member capacity report for a project.

    GET /api/workspaces/<slug>/projects/<project_id>/time-tracking/capacity/
    Query params:
        date_from (optional): YYYY-MM-DD, defaults to current week Monday
        date_to   (optional): YYYY-MM-DD, defaults to current week Sunday
    """

    @allow_permission([ROLE.ADMIN], level="PROJECT")
    def get(self, request, slug, project_id):
        # Parse date range, default to current week
        today = timezone.now().date()
        default_start = today - timedelta(days=today.weekday())  # Monday
        default_end = default_start + timedelta(days=6)  # Sunday

        date_from = request.query_params.get("date_from", default_start.isoformat())
        date_to = request.query_params.get("date_to", default_end.isoformat())
        member_ids = request.query_params.get("member_id", None)

        # Base filters
        member_filters = {
            "workspace__slug": slug,
            "project_id": project_id,
            "is_active": True,
        }
        worklog_filters = {
            "workspace__slug": slug,
            "project_id": project_id,
            "logged_at__range": [date_from, date_to],
        }
        issue_filters = {
            "workspace__slug": slug,
            "project_id": project_id,
        }

        if member_ids:
            member_id_list = member_ids.split(",")
            member_filters["member_id__in"] = member_id_list
            worklog_filters["logged_by__in"] = member_id_list
            issue_filters["assignees__in"] = member_id_list

        # Get all active project members
        members = (
            ProjectMember.objects.filter(**member_filters)
            .select_related("member")
            .values_list("member_id", "member__display_name", "member__avatar")
        )

        member_map = {
            str(mid): {"display_name": name, "avatar_url": avatar or ""}
            for mid, name, avatar in members
        }

        # Aggregate logged time per member in date range
        logged_qs = (
            IssueWorkLog.objects.filter(**worklog_filters)
            .values("logged_by")
            .annotate(total_logged=Sum("duration_minutes"))
        )
        logged_map = {str(row["logged_by"]): row["total_logged"] for row in logged_qs}

        # Daily mapping for Heatmap
        daily_logged_qs = (
            IssueWorkLog.objects.filter(**worklog_filters)
            .values("logged_by", "logged_at")
            .annotate(
                daily_logged=Sum("duration_minutes"),
                daily_issues=Count("issue_id", distinct=True)
            )
        )
        member_days_map = {str(mid): {} for mid in member_map.keys()}
        for row in daily_logged_qs:
            mid = str(row["logged_by"])
            if mid in member_days_map:
                date_str = str(row["logged_at"])
                member_days_map[mid][date_str] = row["daily_logged"]

        # Aggregate estimated time and issue count per member
        estimated_map = {str(mid): 0 for mid in member_map.keys()}
        issue_count_map = {str(mid): 0 for mid in member_map.keys()}

        # Fetch all relevant issues and their assignees at once
        # Use base objects to catch all states, but manually exclude archived/draft
        issues = (
            Issue.objects.filter(**issue_filters)
            .filter(archived_at__isnull=True, is_draft=False)
            .prefetch_related("assignees", "estimate_point")
        )

        for issue in issues:
            # Calculate total minutes for this issue (Robust check)
            issue_minutes = issue.estimate_time or 0
            
            # Check for points (Direct field)
            if not issue_minutes and issue.point:
                issue_minutes = issue.point * 60
            
            # Check for linked estimate points
            if not issue_minutes and issue.estimate_point:
                try:
                    # Often points represent hours (1 point = 1 hour)
                    point_val = float(issue.estimate_point.value)
                    issue_minutes = int(point_val * 60)
                except (ValueError, TypeError):
                    pass
            
            assigned_members = issue.assignees.all()
            for assignee in assigned_members:
                mid = str(assignee.id)
                if mid in estimated_map:
                    estimated_map[mid] += issue_minutes
                    issue_count_map[mid] += 1

        # Build response
        result_members = []
        total_logged = 0
        total_estimated = 0

        for mid, info in member_map.items():
            member_logged = logged_map.get(mid, 0) or 0
            member_estimated = estimated_map.get(mid, 0)
            member_issues = issue_count_map.get(mid, 0)

            if member_estimated > 0 and member_logged > member_estimated:
                member_status = "overload"
            elif member_estimated > 0 and member_logged < member_estimated:
                member_status = "under"
            elif member_estimated == 0 and member_logged > 0:
                member_status = "overload"  # Logged time without estimation
            else:
                member_status = "normal"

            total_logged += member_logged
            total_estimated += member_estimated

            result_members.append({
                "member_id": mid,
                "display_name": info["display_name"],
                "avatar_url": info["avatar_url"],
                "total_logged_minutes": member_logged,
                "total_estimated_minutes": member_estimated,
                "issue_count": member_issues,
                "status": member_status,
                "days": member_days_map.get(mid, {}),
            })

        # Sort: overloaded first, then by logged desc
        status_order = {"overload": 0, "under": 1, "normal": 2}
        result_members.sort(
            key=lambda m: (status_order.get(m["status"], 3), -m["total_logged_minutes"])
        )

        # Project-wide daily totals
        project_days_map = {}
        for row in daily_logged_qs:
            date_str = str(row["logged_at"])
            if date_str not in project_days_map:
                project_days_map[date_str] = {"minutes": 0, "issue_count": 0}
            project_days_map[date_str]["minutes"] += row["daily_logged"]
            project_days_map[date_str]["issue_count"] += row["daily_issues"]

        return Response(
            {
                "date_from": date_from,
                "date_to": date_to,
                "members": result_members,
                "project_total_logged": total_logged,
                "project_total_estimated": total_estimated,
                "project_daily_totals": project_days_map,
            },
            status=status.HTTP_200_OK,
        )
