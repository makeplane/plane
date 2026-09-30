# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Project, ProjectTemplate
from plane.utils.project_template_issue_types import seed_project_issue_types_from_template_payload


class WorkspaceProjectIssueTypeSeedEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def post(self, request, slug, project_id):
        template_id = request.data.get("template_id")
        if not template_id:
            return Response({"error": "template_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            uuid.UUID(str(template_id))
        except (ValueError, TypeError, AttributeError):
            return Response({"error": "Invalid template_id"}, status=status.HTTP_400_BAD_REQUEST)

        project = Project.objects.filter(id=project_id, workspace__slug=slug, deleted_at__isnull=True).first()
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        template = ProjectTemplate.objects.filter(
            id=template_id,
            workspace_id=project.workspace_id,
            deleted_at__isnull=True,
        ).first()
        if not template:
            return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)

        payload = template.payload if isinstance(template.payload, dict) else {}
        seed_project_issue_types_from_template_payload(
            project=project,
            payload=payload,
            created_by_id=getattr(request.user, "id", None),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
