# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import Count, Q, Sum

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Issue, Project

from ..filters import exclude_running
from .base import ENTRY_RELATIONS, TimeTrackingBaseView, not_found
from .entries import RUNNING

WORK_ITEM_ENTRIES_LIMIT = 50


def get_visible_project(access, project_id):
    project = Project.objects.filter(id=project_id, workspace_id=access.workspace.id).first()
    if not access.can_view_project(project):
        raise not_found("Project not found.")
    return project


class ProjectIssueTimeTotalsEndpoint(TimeTrackingBaseView):
    """``{issue_id: seconds}`` of completed time for a project's work items (the spreadsheet column)."""

    def get(self, request, slug, project_id):
        access = self.get_access(request, slug)
        project = get_visible_project(access, project_id)
        totals = (
            exclude_running(access.visible_entries().filter(project_id=project.id, issue_id__isnull=False))
            .values("issue_id")
            .annotate(total=Sum("duration_seconds"))
            .order_by()
        )
        return Response({str(row["issue_id"]): row["total"] for row in totals}, status=status.HTTP_200_OK)


class WorkItemTimeEndpoint(TimeTrackingBaseView):
    """Everything the work item Time property shows (plan 7.3 #17)."""

    def get(self, request, slug, project_id, issue_id):
        access = self.get_access(request, slug)
        project = get_visible_project(access, project_id)
        if not Issue.objects.filter(id=issue_id, project_id=project.id).exists():
            raise not_found("Work item not found.")

        entries = access.visible_entries().filter(issue_id=issue_id)
        completed = exclude_running(entries)
        totals = completed.aggregate(
            total_seconds=Sum("duration_seconds"),
            billable_seconds=Sum("duration_seconds", filter=Q(is_billable=True)),
            entry_count=Count("id"),
        )
        by_user = completed.values("user_id").annotate(total_seconds=Sum("duration_seconds")).order_by("-total_seconds")
        latest = (
            entries.annotate(_running=RUNNING)
            .select_related(*ENTRY_RELATIONS)
            .order_by("-_running", "-spent_on", "-started_at", "-created_at")[:WORK_ITEM_ENTRIES_LIMIT]
        )
        running = entries.filter(started_at__isnull=False, ended_at__isnull=True).select_related(*ENTRY_RELATIONS)

        return Response(
            {
                "total_seconds": totals["total_seconds"] or 0,
                "billable_seconds": totals["billable_seconds"] or 0,
                "entry_count": totals["entry_count"],
                "by_user": [{"user_id": str(row["user_id"]), "total_seconds": row["total_seconds"]} for row in by_user],
                "entries": self.serialize(latest, access, many=True),
                "running": self.serialize(running, access, many=True),
            },
            status=status.HTTP_200_OK,
        )
