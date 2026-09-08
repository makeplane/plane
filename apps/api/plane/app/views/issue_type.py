# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.db.models.issue_type import ProjectIssueType
from .base import BaseAPIView


class IssueTypeListEndpoint(BaseAPIView):
    """Questimus fork change (migration-karol.md §7.6): list a project's issue types.

    Issue types are DB-only in this Plane version (no API endpoints, no GUI
    selector/badge) — the web UI needs this endpoint to render the type
    selector and badge (Phase 3, "Issue type UI" ticket).
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        project_issue_types = (
            ProjectIssueType.objects.filter(
                project_id=project_id,
                project__workspace__slug=slug,
                deleted_at__isnull=True,
            )
            .select_related("issue_type")
            .order_by("level", "issue_type__name")
        )
        data = [
            {
                "id": pit.issue_type_id,
                "name": pit.issue_type.name,
                "description": pit.issue_type.description,
                "is_epic": pit.issue_type.is_epic,
                "is_default": pit.is_default,
                "level": pit.level,
            }
            for pit in project_issue_types
        ]
        return Response(data, status=status.HTTP_200_OK)
