# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Shared base for every Nexus public-API view.

Inherits Plane's `BaseAPIView`, so authentication (X-Api-Key / Bearer personal
access token), API-key rate limiting, exception mapping and cursor pagination
behave exactly like the stock /api/v1 endpoints.
"""

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response

from plane.api.views.base import BaseAPIView
from plane.db.models import Project, Workspace
from plane.utils.permissions import ProjectEntityPermission, WorkspaceEntityPermission


class NexusAPIView(BaseAPIView):
    """Workspace-scoped by default: members read, admins and members write."""

    permission_classes = [WorkspaceEntityPermission]

    def get_workspace(self) -> Workspace:
        return get_object_or_404(Workspace, slug=self.workspace_slug)

    def get_project(self) -> Project:
        return get_object_or_404(Project, pk=self.project_id, workspace__slug=self.workspace_slug)

    def paginated(self, request, queryset, serializer_class, **serializer_kwargs):
        """Cursor-paginate a queryset in the shape plane-sdk's Paginated* models expect."""
        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda rows: serializer_class(rows, many=True, **serializer_kwargs).data,
        )

    @staticmethod
    def error(message: str, code: str | None = None, http_status: int = status.HTTP_400_BAD_REQUEST) -> Response:
        body = {"error": message}
        if code:
            body["code"] = code
        return Response(body, status=http_status)


class NexusProjectAPIView(NexusAPIView):
    """Project-scoped: project members read, project admins and members write."""

    permission_classes = [ProjectEntityPermission]
