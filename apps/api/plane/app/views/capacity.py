# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta

from django.db.models import Count, Q, Sum
from django.utils import timezone

from rest_framework.response import Response
from rest_framework import status

from plane.app.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import Issue, IssueWorkLog, ProjectMember


class ProjectCapacityEndpoint(BaseAPIView):
    """Per-member capacity report for a project.

    GET /api/workspaces/<slug>/projects/<project_id>/time-tracking/capacity/
    Query params:
        date_from (optional): YYYY-MM-DD, defaults to current week Monday
        date_to   (optional): YYYY-MM-DD, defaults to current week Sunday
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
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
        if member_ids:
            member_id_list = member_ids.split(",")
            member_filters["member_id__in"] = member_id_list
            worklog_filters["logged_by__in"] = member_id_list

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

        # Build response
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
                "project_daily_totals": project_days_map,
            },
            status=status.HTTP_200_OK,
        )


class ProjectCapacityDayDetailsEndpoint(BaseAPIView):
    """
    List all worklog entries aggregated by issue for a specific member on a specific date.
    Used by Capacity heatmap cell click → task list popover.

    GET /api/workspaces/<slug>/projects/<project_id>/time-tracking/capacity/day-details/
    ?member_id=<uuid>&date=YYYY-MM-DD
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        member_id = request.query_params.get("member_id")
        date = request.query_params.get("date")

        if not member_id or not date:
            return Response({"error": "member_id and date are required."}, status=400)

        worklogs = (
            IssueWorkLog.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                logged_by_id=member_id,
                logged_at=date,
            )
            .select_related("issue__project")
            .values(
                "issue_id",
                "issue__name",
                "issue__sequence_id",
                "issue__project__identifier",
            )
            .annotate(total_minutes=Sum("duration_minutes"))
            .order_by("-total_minutes")
        )

        tasks = [
            {
                "issue_id": str(wl["issue_id"]),
                "issue_name": wl["issue__name"],
                "issue_identifier": f"{wl['issue__project__identifier']}-{wl['issue__sequence_id']}",
                "total_minutes": wl["total_minutes"],
            }
            for wl in worklogs
        ]

        return Response({"tasks": tasks}, status=status.HTTP_200_OK)


class ProjectCapacityCategoriesEndpoint(BaseAPIView):
    """
    Category distribution for capacity view.
    Groups all project issues by main_task_category and sub_task_category FK fields.

    GET /api/workspaces/<slug>/projects/<project_id>/time-tracking/capacity/categories/
    ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&member_id=<uuid>  (all optional)
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        member_id = request.query_params.get("member_id")

        # Base: active issues in this project
        base_qs = Issue.issue_objects.filter(
            workspace__slug=slug,
            project_id=project_id,
        )

        if member_id:
            base_qs = base_qs.filter(assignees__id=member_id)

        # Filter to issues with worklogs in date range (if dates given)
        if date_from or date_to:
            wl_filters = Q(workspace__slug=slug, project_id=project_id)
            if date_from:
                wl_filters &= Q(logged_at__gte=date_from)
            if date_to:
                wl_filters &= Q(logged_at__lte=date_to)
            issue_ids_with_logs = (
                IssueWorkLog.objects.filter(wl_filters)
                .values_list("issue_id", flat=True)
                .distinct()
            )
            base_qs = base_qs.filter(id__in=issue_ids_with_logs)

        def count_by_category(qs, category_field):
            """Count issues grouped by category FK name; null → 'Uncategorized'."""
            name_field = f"{category_field}__name"
            categorized = (
                qs.filter(**{f"{category_field}__isnull": False})
                .values(name_field)
                .annotate(count=Count("id", distinct=True))
                .order_by("-count")
            )
            uncategorized_count = qs.filter(**{f"{category_field}__isnull": True}).count()
            result = [{"name": row[name_field], "count": row["count"]} for row in categorized]
            if uncategorized_count > 0:
                result.append({"name": "Uncategorized", "count": uncategorized_count})
            return result

        return Response(
            {
                "main_task_categories": count_by_category(base_qs, "main_task_category"),
                "sub_task_categories": count_by_category(base_qs, "sub_task_category"),
            },
            status=status.HTTP_200_OK,
        )
