# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.permissions.workspace import WorkspaceMemberPermission
from plane.db.models import Issue, IssueType, Project, Workspace
from plane.db.models.issue_type import ProjectIssueType
from .base import BaseAPIView


def _serialize_type(issue_type, default_type_id=None):
    return {
        "id": str(issue_type.id),
        "name": issue_type.name,
        "description": issue_type.description,
        "color": issue_type.color,
        "is_epic": issue_type.is_epic,
        "is_default": default_type_id is not None and str(issue_type.id) == str(default_type_id),
        "level": issue_type.level,
    }


class IssueTypeListEndpoint(BaseAPIView):
    """Questimus fork change (migration-karol.md §7.6): list a project's issue types.

    Issue types are workspace-level (migration-karol.md §7.12): every project
    sees the full workspace type set; `is_default` reflects the project's
    default type (Ticket). Powers the type badge, the modal selector and the
    type-based views.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        project = Project.objects.filter(id=project_id, workspace__slug=slug).first()
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        default_type_id = (
            ProjectIssueType.objects.filter(
                project_id=project_id, is_default=True, deleted_at__isnull=True
            )
            .values_list("issue_type_id", flat=True)
            .first()
        )
        issue_types = IssueType.objects.filter(workspace__slug=slug, is_active=True).order_by("level", "name")
        data = [_serialize_type(t, default_type_id) for t in issue_types]
        return Response(data, status=status.HTTP_200_OK)


class WorkspaceIssueTypeEndpoint(BaseAPIView):
    """Questimus fork change (migration-karol.md §7.12): central issue-type
    management — list all workspace types, create new ones (joined to every
    project automatically)."""

    permission_classes = [WorkspaceMemberPermission]

    def get(self, request, slug):
        issue_types = IssueType.objects.filter(workspace__slug=slug, is_active=True).order_by("level", "name")
        data = [_serialize_type(t) for t in issue_types]
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request, slug):
        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST)
        if IssueType.objects.filter(workspace__slug=slug, name=name, is_active=True).exists():
            return Response({"error": "An issue type with this name already exists"}, status=status.HTTP_400_BAD_REQUEST)

        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        issue_type = IssueType.objects.create(
            workspace=workspace,
            name=name,
            description=request.data.get("description", ""),
            color=request.data.get("color", "#3f76ff"),
        )
        # Join the new type to every project in the workspace
        project_ids = Project.objects.filter(workspace__slug=slug, archived_at__isnull=True).values_list("id", flat=True)
        ProjectIssueType.objects.bulk_create(
            [ProjectIssueType(project_id=pid, issue_type=issue_type, workspace=workspace) for pid in project_ids],
            ignore_conflicts=True,
        )
        return Response(_serialize_type(issue_type), status=status.HTTP_201_CREATED)


class WorkspaceIssueTypeDetailEndpoint(BaseAPIView):
    """Questimus fork change (§7.12): update (rename/color/description) or
    delete a workspace issue type. Deletion is blocked while issues reference
    the type."""

    permission_classes = [WorkspaceMemberPermission]

    def _get_type(self, slug, pk):
        return IssueType.objects.filter(workspace__slug=slug, pk=pk, is_active=True).first()

    def patch(self, request, slug, pk):
        issue_type = self._get_type(slug, pk)
        if not issue_type:
            return Response({"error": "Issue type not found"}, status=status.HTTP_404_NOT_FOUND)

        name = (request.data.get("name") or "").strip()
        if name and name != issue_type.name:
            if IssueType.objects.filter(workspace__slug=slug, name=name, is_active=True).exclude(pk=pk).exists():
                return Response({"error": "An issue type with this name already exists"}, status=status.HTTP_400_BAD_REQUEST)
            issue_type.name = name
        if "description" in request.data:
            issue_type.description = request.data.get("description", "")
        if "color" in request.data:
            issue_type.color = request.data.get("color", issue_type.color)
        issue_type.save()
        return Response(_serialize_type(issue_type), status=status.HTTP_200_OK)

    def delete(self, request, slug, pk):
        issue_type = self._get_type(slug, pk)
        if not issue_type:
            return Response({"error": "Issue type not found"}, status=status.HTTP_404_NOT_FOUND)

        in_use = Issue.objects.filter(workspace__slug=slug, type=issue_type).count()
        if in_use:
            return Response(
                {"error": f"Cannot delete: {in_use} issue(s) still use this type"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        issue_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
