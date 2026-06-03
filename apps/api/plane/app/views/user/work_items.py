# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
import datetime

from django.db.models import Case, F, IntegerField, Q, Value, When
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers import UserCrossWorkspaceWorkItemSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import Issue


class _BaseUserWorkItemsEndpoint(BaseAPIView):
    """
    Shared queryset builder for cross-workspace work item endpoints.
    Self-only: uses request.user implicitly — no ?user= param (prevents IDOR).
    Supports optional ?workspace=<slug> to filter to a single workspace.
    """

    use_read_replica = True

    def _get_base_queryset(self, request):
        """
        Build scoped queryset for the authenticated user across all active workspaces.
        Filters:
        - assignee = current user
        - workspace member active (excludes left/banned workspaces)
        - project member active (excludes inaccessible projects)
        - project not archived
        - state group in {backlog, unstarted, started} (open tasks only)

        Sub-tasks assigned to the user are included so the frontend can render
        them indented under their parent (only when the parent is also returned).
        """
        workspace_slug = request.query_params.get("workspace", None)

        qs = (
            Issue.issue_objects.filter(
                assignees=request.user,
                workspace__workspace_member__member=request.user,
                workspace__workspace_member__is_active=True,
                project__project_projectmember__member=request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
                state__group__in=["backlog", "unstarted", "started"],
            )
            .select_related("workspace", "project", "state")
            .prefetch_related("assignees", "labels")
            .distinct()
        )

        if workspace_slug:
            qs = qs.filter(workspace__slug=workspace_slug)

        return qs


def _progress_rank_annotation(today):
    """
    Compute progress-status rank in SQL (mirrors FE getProgressStatus):
      0 = off_track  (target_date < today)
      1 = due_today  (target_date == today)
      2 = at_risk    (target_date == today + 1)
      3 = on_track   (target_date >  today + 1)
      9 = no target_date
    """
    tomorrow = today + datetime.timedelta(days=1)
    return Case(
        When(target_date__isnull=True, then=Value(9)),
        When(target_date__lt=today, then=Value(0)),
        When(target_date=today, then=Value(1)),
        When(target_date=tomorrow, then=Value(2)),
        default=Value(3),
        output_field=IntegerField(),
    )


class UserWorkItemsTodayEndpoint(_BaseUserWorkItemsEndpoint):
    """
    GET /api/users/me/work-items/today/
    Returns open issues assigned to the current user where:
    - start_date is null OR start_date <= today (issue has started or has no start bound)
    - target_date is null OR target_date >= today (not yet overdue)
    Ordered by progress status (off_track → due_today → at_risk → on_track → no date),
    then target_date asc. Capped at 200.
    """

    def get(self, request):
        today = timezone.now().date()
        qs = self._get_base_queryset(request)

        qs = (
            qs.filter(
                Q(start_date__isnull=True) | Q(start_date__lte=today),
                Q(target_date__isnull=True) | Q(target_date__gte=today),
            )
            .annotate(_progress_rank=_progress_rank_annotation(today))
            .order_by("_progress_rank", F("target_date").asc(nulls_last=True), "created_at")[:200]
        )

        serializer = UserCrossWorkspaceWorkItemSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserWorkItemsOverdueEndpoint(_BaseUserWorkItemsEndpoint):
    """
    GET /api/users/me/work-items/overdue/
    Returns open issues assigned to the current user where target_date < today.
    All overdue items rank as off_track; ordered by target_date asc. Capped at 200.
    """

    def get(self, request):
        today = timezone.now().date()
        qs = self._get_base_queryset(request)

        qs = qs.filter(
            target_date__isnull=False,
            target_date__lt=today,
        ).order_by(F("target_date").asc(nulls_last=True), "created_at")[:200]

        serializer = UserCrossWorkspaceWorkItemSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
