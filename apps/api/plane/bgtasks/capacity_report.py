# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from celery import shared_task
from django.db.models import Sum

from plane.db.models import IssueWorkLog, ProjectMember
from plane.utils.exception_logger import log_exception


@shared_task
def generate_capacity_report(workspace_slug: str, project_id: str, date_from: str, date_to: str):
    """Generate per-member capacity report for a project.

    Computes total logged minutes per member during the given date range.

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

        # Build result
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

        return {
            "date_from": date_from,
            "date_to": date_to,
            "members": result_members,
            "project_total_logged": total_logged,
        }

    except Exception as e:
        log_exception(e)
        return {"error": str(e)}
