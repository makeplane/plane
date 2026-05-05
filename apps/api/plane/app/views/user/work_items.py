# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import F, Q
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
        - parent is null (exclude sub-tasks)
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
                parent__isnull=True,
            )
            .select_related("workspace", "project", "state")
            .prefetch_related("assignees", "labels")
            .distinct()
        )

        if workspace_slug:
            qs = qs.filter(workspace__slug=workspace_slug)

        return qs


class UserWorkItemsTodayEndpoint(_BaseUserWorkItemsEndpoint):
    """
    GET /api/users/me/work-items/today/
    Returns open issues assigned to the current user where:
    - start_date is null OR start_date <= today (issue has started or has no start bound)
    - target_date is null OR target_date >= today (not yet overdue)
    Capped at 200 items (KISS — sub-task exclusion + state filter keeps count low).
    """

    def get(self, request):
        today = timezone.now().date()
        qs = self._get_base_queryset(request)

        qs = qs.filter(
            Q(start_date__isnull=True) | Q(start_date__lte=today),
            Q(target_date__isnull=True) | Q(target_date__gte=today),
        ).order_by(F("target_date").asc(nulls_last=True), "created_at")[:200]

        serializer = UserCrossWorkspaceWorkItemSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserWorkItemsOverdueEndpoint(_BaseUserWorkItemsEndpoint):
    """
    GET /api/users/me/work-items/overdue/
    Returns open issues assigned to the current user where target_date < today.
    Capped at 200 items.
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
