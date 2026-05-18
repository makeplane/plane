# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import re

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE
from plane.app.views.base import BaseAPIView
from plane.bgtasks.copy_project_task import copy_project_task
from plane.db.models import Project, ProjectCopyJob, ProjectIdentifier, Workspace, WorkspaceMember
from plane.utils.instance_admin import is_instance_admin

_IDENTIFIER_RE = re.compile(r"^[A-Z0-9_-]{1,12}$")


def _is_workspace_admin(user, workspace) -> bool:
    return WorkspaceMember.objects.filter(
        member=user,
        workspace=workspace,
        role=ROLE.ADMIN.value,
        is_active=True,
    ).exists()


class ProjectCopyView(BaseAPIView):
    """POST — enqueue a project copy job."""

    def post(self, request, slug, project_id):
        # --- Source workspace permission ---
        try:
            source_ws = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response({"error": "Source workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        if not _is_workspace_admin(request.user, source_ws) and not is_instance_admin(request.user):
            return Response({"error": "You do not have permission."}, status=status.HTTP_403_FORBIDDEN)

        # --- Source project ---
        try:
            source_project = Project.objects.get(id=project_id, workspace=source_ws)
        except Project.DoesNotExist:
            return Response({"error": "Source project not found."}, status=status.HTTP_404_NOT_FOUND)

        # --- Request body validation ---
        target_slug = request.data.get("target_workspace_slug", "").strip()
        identifier = request.data.get("identifier", "").strip().upper()
        name_override = request.data.get("name", "").strip()

        if not target_slug:
            return Response(
                {"error": "target_workspace_slug is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not identifier:
            return Response({"error": "identifier is required."}, status=status.HTTP_400_BAD_REQUEST)
        if name_override and len(name_override) > 255:
            return Response({"error": "name must be 255 characters or fewer."}, status=status.HTTP_400_BAD_REQUEST)
        if not _IDENTIFIER_RE.match(identifier):
            return Response(
                {"error": "identifier must match ^[A-Z0-9_-]{1,12}$."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Target workspace permission ---
        try:
            target_ws = Workspace.objects.get(slug=target_slug)
        except Workspace.DoesNotExist:
            return Response({"error": "Target workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        if not _is_workspace_admin(request.user, target_ws) and not is_instance_admin(request.user):
            return Response(
                {"error": "You do not have permission in the target workspace."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # --- Identifier uniqueness check ---
        if ProjectIdentifier.objects.filter(
            name=identifier, workspace=target_ws, deleted_at__isnull=True
        ).exists():
            return Response(
                {
                    "error": "identifier_conflict",
                    "message": f"Identifier '{identifier}' already exists in the target workspace.",
                },
                status=status.HTTP_409_CONFLICT,
            )

        # --- Create job and enqueue ---
        job = ProjectCopyJob.objects.create(
            source_project=source_project,
            source_workspace=source_ws,
            target_workspace=target_ws,
            initiated_by=request.user,
            identifier=identifier,
            name_override=name_override,
        )
        copy_project_task.delay(str(job.id))
        return Response({"job_id": str(job.id)}, status=status.HTTP_202_ACCEPTED)


class ProjectCopyStatusView(BaseAPIView):
    """GET — poll the status of a project copy job."""

    def get(self, request, slug, project_id, job_id):
        try:
            source_ws = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        if not _is_workspace_admin(request.user, source_ws) and not is_instance_admin(request.user):
            return Response({"error": "You do not have permission."}, status=status.HTTP_403_FORBIDDEN)

        try:
            job = ProjectCopyJob.objects.get(id=job_id, source_project_id=project_id, initiated_by=request.user)
        except ProjectCopyJob.DoesNotExist:
            return Response({"error": "Copy job not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            {
                "status": job.status,
                "new_project_id": str(job.new_project_id) if job.new_project_id else None,
                "error": job.error or None,
            },
            status=status.HTTP_200_OK,
        )
