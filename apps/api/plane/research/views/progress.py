# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Progress summary endpoint (§5.8) used by the midterm materials."""

from rest_framework import status
from rest_framework.response import Response

from plane.research.services.progress import build_progress
from plane.research.utils.errors import ResearchErrorCode, research_not_found
from plane.research.views.base import ResearchAPIView
from plane.research.views.projects import can_read_project_research_metadata, profile_queryset

SECTION = "stages"


class ResearchProjectProgressEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/projects/<project_id>/progress/``"""

    def get(self, request, slug, project_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        profile = profile_queryset(workspace).filter(project_id=project_id).first()
        if profile is None or not can_read_project_research_metadata(workspace, request.user, profile):
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        period_key = request.GET.get("period_key") or None
        return Response(
            build_progress(workspace, project_id, request.user, period_key=period_key),
            status=status.HTTP_200_OK,
        )
