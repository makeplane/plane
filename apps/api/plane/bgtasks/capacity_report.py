# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from celery import shared_task
from django.db.models import Sum, F, Value, CharField
from django.db.models.functions import Coalesce

from plane.db.models import IssueWorkLog, Issue, ProjectMember
from plane.utils.exception_logger import log_exception


@shared_task
def generate_capacity_report(workspace_slug: str, project_id: str, date_from: str, date_to: str):
    """Generate per-member capacity report for a project.

    Computes total logged minutes vs total estimated minutes for each member
    who is assigned issues in the project during the given date range.

    Args:
        workspace_slug: Workspace slug string.
        project_id: Project UUID as string.
        date_from: Start date in YYYY-MM-DD format.
        date_to: End date in YYYY-MM-DD format.

    Returns:
        dict with member capacity data, or error dict on failure.
    """
    try:
        # Get all project members
        members = (
            ProjectMember.objects.filter(
                workspace__slug=workspace_slug,
                project_id=project_id,
                is_active=True,
            )
            .select_related("member")
            .values_list("member_id", "member__display_name", "member__avatar")
        )

        member_map = {
            str(mid): {"display_name": name, "avatar_url": avatar or ""}
            for mid, name, avatar in members
        }

        # Get logged time per member in date range
        logged_qs = (
            IssueWorkLog.objects.filter(
                workspace__slug=workspace_slug,
                project_id=project_id,
                logged_at__range=[date_from, date_to],
            )
            .values("logged_by")
            .annotate(total_logged=Sum("duration_minutes"))
        )

        logged_map = {str(row["logged_by"]): row["total_logged"] for row in logged_qs}

        # Daily mapping for Heatmap
        daily_logged_qs = (
            IssueWorkLog.objects.filter(
                workspace__slug=workspace_slug,
                project_id=project_id,
                logged_at__range=[date_from, date_to],
            )
            .values("logged_by", "logged_at")
            .annotate(daily_logged=Sum("duration_minutes"))
        )
        member_days_map = {str(mid): {} for mid in member_map.keys()}
        for row in daily_logged_qs:
            mid = str(row["logged_by"])
            if mid in member_days_map:
                date_str = str(row["logged_at"])
                member_days_map[mid][date_str] = row["daily_logged"]

        # Get estimated time per assignee (from issues assigned in project)
        estimated_qs = (
            Issue.issue_objects.filter(
                workspace__slug=workspace_slug,
                project_id=project_id,
                estimate_time__isnull=False,
            )
            .values("assignees")
            .annotate(
                total_estimated=Sum("estimate_time"),
                issue_count=Sum(Value(1)),
            )
        )

        estimated_map = {}
        issue_count_map = {}
        for row in estimated_qs:
            assignee_id = str(row["assignees"]) if row["assignees"] else None
            if assignee_id:
                estimated_map[assignee_id] = row["total_estimated"] or 0
                issue_count_map[assignee_id] = row["issue_count"] or 0

        # Build result
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

        return {
            "date_from": date_from,
            "date_to": date_to,
            "members": result_members,
            "project_total_logged": total_logged,
            "project_total_estimated": total_estimated,
        }

    except Exception as e:
        log_exception(e)
        return {"error": str(e)}
