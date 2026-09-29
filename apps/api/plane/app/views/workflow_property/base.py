# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""§14 + §17 — workspace property CRUD.

Permissions (§18.1):

- read: any workspace member;
- write: workspace ADMIN.

The workspace property catalog is the root of the property tree; a
mistake here cascades into every type/issue downstream, so writes are
deliberately restricted to admins.
"""

# Python imports
import logging

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import (
    WorkspacePropertyCreateSerializer,
    WorkspacePropertyReadSerializer,
    WorkspacePropertyUpdateSerializer,
)
from plane.app.views import BaseAPIView
from plane.db.models import Workspace, WorkspaceMember

logger = logging.getLogger("plane.workflow")


class WorkspacePropertyListEndpoint(BaseAPIView):
    """``GET``/``POST`` workspace properties."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if workspace is None:
            return Response(
                {"error": "Workspace not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        properties = (
            WorkspacePropertyReadSerializer.Meta.model.objects
            .filter(workspace=workspace)
            .order_by("-created_at")
        )
        return Response(
            WorkspacePropertyReadSerializer(properties, many=True).data,
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if workspace is None:
            return Response(
                {"error": "Workspace not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = WorkspacePropertyCreateSerializer(
            data=request.data,
            context={"workspace_id": workspace.id, "request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        property_obj = serializer.save(
            workspace=workspace,
            created_by_id=request.user.id,
            updated_by_id=request.user.id,
        )
        return Response(
            WorkspacePropertyReadSerializer(property_obj).data,
            status=status.HTTP_201_CREATED,
        )


class WorkspacePropertyDetailEndpoint(BaseAPIView):
    """``GET``/``PATCH``/``DELETE`` for a single workspace property."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, property_id):
        workspace = Workspace.objects.filter(slug=slug).first()
        if workspace is None:
            return Response(
                {"error": "Workspace not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        property_obj = (
            WorkspacePropertyReadSerializer.Meta.model.objects
            .filter(workspace=workspace, pk=property_id)
            .first()
        )
        if property_obj is None:
            return Response(
                {"error": "Workflow property not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            WorkspacePropertyReadSerializer(property_obj).data,
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, property_id):
        workspace = Workspace.objects.filter(slug=slug).first()
        if workspace is None:
            return Response(
                {"error": "Workspace not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        property_obj = (
            WorkspacePropertyReadSerializer.Meta.model.objects
            .filter(workspace=workspace, pk=property_id)
            .first()
        )
        if property_obj is None:
            return Response(
                {"error": "Workflow property not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = WorkspacePropertyUpdateSerializer(
            property_obj,
            data=request.data,
            partial=True,
            context={"workspace_id": workspace.id, "request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(updated_by_id=request.user.id)
        return Response(
            WorkspacePropertyReadSerializer(property_obj).data,
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, property_id):
        workspace = Workspace.objects.filter(slug=slug).first()
        if workspace is None:
            return Response(
                {"error": "Workspace not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        property_obj = (
            WorkspacePropertyReadSerializer.Meta.model.objects
            .filter(workspace=workspace, pk=property_id)
            .first()
        )
        if property_obj is None:
            return Response(
                {"error": "Workflow property not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        property_obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
