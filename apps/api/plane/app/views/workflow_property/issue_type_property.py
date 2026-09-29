# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""§14.3 + §17 — ``(issue_type, property)`` association CRUD.

Permissions (§18.1):

- read: any workspace member;
- write: project ADMIN.

The endpoint lives under the project URL scope
(``/workspaces/:slug/projects/:project_id/issue-types/:type_id/properties/``)
because the association is project-scoped (every project that opts
into a type independently attaches the property it wants exposed).
"""

# Python imports
import logging

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import (
    IssueTypePropertyReadSerializer,
    IssueTypePropertyUpdateSerializer,
    IssueTypePropertyWriteSerializer,
)
from plane.app.views import BaseAPIView
from plane.db.models import (
    IssueType,
    Project,
    ProjectMember,
    Workspace,
    WorkspaceMember,
)

logger = logging.getLogger("plane.workflow")


def _get_issue_type(project, issue_type_id):
    return (
        IssueType.objects.filter(workspace_id=project.workspace_id, pk=issue_type_id)
        .first()
    )


class IssueTypePropertyListEndpoint(BaseAPIView):
    """``GET``/``POST`` per-(project, type) property attachments."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_type_id):
        project = Project.objects.filter(pk=project_id).first()
        if project is None:
            return Response(
                {"error": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        issue_type = _get_issue_type(project, issue_type_id)
        if issue_type is None:
            return Response(
                {"error": "Issue type not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        attachments = (
            IssueTypePropertyReadSerializer.Meta.model.objects
            .filter(project=project, issue_type=issue_type)
            .select_related("property")
            .order_by("sequence", "created_at")
        )
        return Response(
            IssueTypePropertyReadSerializer(attachments, many=True).data,
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id, issue_type_id):
        project = Project.objects.filter(pk=project_id).first()
        if project is None:
            return Response(
                {"error": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        issue_type = _get_issue_type(project, issue_type_id)
        if issue_type is None:
            return Response(
                {"error": "Issue type not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = IssueTypePropertyWriteSerializer(
            data=request.data,
            context={
                "project": project,
                "project_id": project.id,
                "issue_type_id": issue_type.id,
                "request": request,
            },
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        attachment = serializer.save(
            project=project,
            workspace_id=project.workspace_id,
            created_by_id=request.user.id,
            updated_by_id=request.user.id,
        )
        return Response(
            IssueTypePropertyReadSerializer(attachment).data,
            status=status.HTTP_201_CREATED,
        )


class IssueTypePropertyDetailEndpoint(BaseAPIView):
    """``GET``/``PATCH``/``DELETE`` for one ``(issue_type, property)`` row."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_type_id, attachment_id):
        project = Project.objects.filter(pk=project_id).first()
        if project is None:
            return Response(
                {"error": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        attachment = (
            IssueTypePropertyReadSerializer.Meta.model.objects
            .filter(
                project=project,
                issue_type_id=issue_type_id,
                pk=attachment_id,
            )
            .select_related("property")
            .first()
        )
        if attachment is None:
            return Response(
                {"error": "Property attachment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            IssueTypePropertyReadSerializer(attachment).data,
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN])
    def patch(self, request, slug, project_id, issue_type_id, attachment_id):
        project = Project.objects.filter(pk=project_id).first()
        if project is None:
            return Response(
                {"error": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        attachment = (
            IssueTypePropertyReadSerializer.Meta.model.objects
            .filter(
                project=project,
                issue_type_id=issue_type_id,
                pk=attachment_id,
            )
            .first()
        )
        if attachment is None:
            return Response(
                {"error": "Property attachment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = IssueTypePropertyUpdateSerializer(
            attachment,
            data=request.data,
            partial=True,
            context={
                "project": project,
                "project_id": project.id,
                "issue_type_id": issue_type_id,
                "request": request,
            },
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(updated_by_id=request.user.id)
        attachment.refresh_from_db()
        return Response(
            IssueTypePropertyReadSerializer(attachment).data,
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN])
    def delete(self, request, slug, project_id, issue_type_id, attachment_id):
        project = Project.objects.filter(pk=project_id).first()
        if project is None:
            return Response(
                {"error": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        attachment = (
            IssueTypePropertyReadSerializer.Meta.model.objects
            .filter(
                project=project,
                issue_type_id=issue_type_id,
                pk=attachment_id,
            )
            .first()
        )
        if attachment is None:
            return Response(
                {"error": "Property attachment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        attachment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
