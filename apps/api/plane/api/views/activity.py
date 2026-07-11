# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# drf-spectacular imports
from drf_spectacular.utils import OpenApiResponse, extend_schema

# Module imports
from plane.api.serializers import IssueActivitySerializer
from plane.app.permissions import WorkspaceEntityPermission
from plane.db.models import IssueActivity
from plane.utils.activity_filters import (
    ActivityFilterError,
    apply_activity_filters,
    parse_activity_filters,
)
from plane.utils.order_queryset import ACTIVITY_ORDER_BY_ALLOWLIST, sanitize_order_by

from .base import BaseAPIView


class WorkspaceActivityListAPIEndpoint(BaseAPIView):
    """Read-only feed of work item activities across a workspace (v1)."""

    model = IssueActivity
    serializer_class = IssueActivitySerializer
    permission_classes = [WorkspaceEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return IssueActivity.objects.filter(
            ~Q(field__in=["comment", "vote", "reaction", "draft"]),
            workspace__slug=self.kwargs.get("slug"),
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
        ).select_related("actor", "workspace", "issue", "project")

    @extend_schema(
        operation_id="list_workspace_activities",
        summary="List workspace activities",
        description=(
            "Paginated read-only feed of work item activities across the workspace, "
            "restricted to the projects the requester is an active member of. "
            "Supports repeatable `actor` and `project` filters (UUIDs) and an "
            "inclusive `start_date` / `end_date` range (YYYY-MM-DD)."
        ),
        tags=["Work Items"],
        responses={
            200: OpenApiResponse(
                description="Paginated list of workspace activities",
                response=IssueActivitySerializer,
            ),
            400: OpenApiResponse(description="Invalid filter parameter"),
        },
    )
    def get(self, request, slug):
        """List workspace activities.

        Excludes comment, vote, reaction and draft activities — same contract
        as the per-work-item activity endpoint, widened to the workspace.
        """
        try:
            activity_filters = parse_activity_filters(request.query_params)
        except ActivityFilterError as e:
            return Response({"error": e.detail}, status=status.HTTP_400_BAD_REQUEST)

        queryset = apply_activity_filters(self.get_queryset(), activity_filters)

        return self.paginate(
            order_by=sanitize_order_by(
                request.GET.get("order_by", "-created_at"),
                ACTIVITY_ORDER_BY_ALLOWLIST,
                "-created_at",
            ),
            request=request,
            queryset=queryset,
            on_results=lambda activities: (
                IssueActivitySerializer(activities, many=True, fields=self.fields, expand=self.expand).data
            ),
            default_per_page=20,
            max_per_page=100,
        )
