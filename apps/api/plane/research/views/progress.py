# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Progress summary endpoint (§5.8) used by the midterm materials."""

from rest_framework import status
from rest_framework.response import Response

from plane.db.models import ResearchProjectProfile
from plane.research.services.progress import build_progress
from plane.research.utils.errors import ResearchErrorCode, research_not_found
from plane.research.views.base import ResearchAPIView

SECTION = "stages"


class ResearchProjectProgressEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/projects/<project_id>/progress/``"""

    def get(self, request, slug, project_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        profile = ResearchProjectProfile.objects.filter(workspace=workspace, project_id=project_id).first()
        if profile is None:
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        period_key = request.GET.get("period_key") or None
        return Response(
            build_progress(workspace, project_id, request.user, period_key=period_key),
            status=status.HTTP_200_OK,
        )
