# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Timeline and dual chain endpoints (§5.8, P1-E1)."""

from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.response import Response

from plane.research.services.chain import CHAINS, build_timeline, chain_groups
from plane.research.utils.errors import ResearchErrorCode, research_error, research_not_found
from plane.research.views.base import ResearchAPIView
from plane.research.views.projects import can_read_project_research_metadata, profile_queryset

SECTION = "stages"


class ResearchProjectTimelineEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/projects/<project_id>/timeline/``"""

    def get(self, request, slug, project_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        profile = profile_queryset(workspace).filter(project_id=project_id).first()
        if profile is None or not can_read_project_research_metadata(workspace, request.user, profile):
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")

        chain = str(request.GET.get("chain") or "").lower() or None
        if chain and chain not in CHAINS:
            return research_error(
                ResearchErrorCode.CHAIN_INVALID,
                "chain must be thinking or development.",
            )
        stage = str(request.GET.get("stage") or "").upper() or None
        date_from = parse_date(str(request.GET.get("date_from") or ""))
        date_to = parse_date(str(request.GET.get("date_to") or ""))
        source_system = str(request.GET.get("source_system") or "").upper() or None
        timeline = build_timeline(
            workspace,
            project_id,
            request.user,
            stage=stage,
            date_from=date_from,
            date_to=date_to,
            source_system=source_system,
            chain=chain,
        )
        return Response(timeline, status=status.HTTP_200_OK)


class ResearchProjectChainEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/projects/<project_id>/chain/``"""

    def get(self, request, slug, project_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        profile = profile_queryset(workspace).filter(project_id=project_id).first()
        if profile is None or not can_read_project_research_metadata(workspace, request.user, profile):
            return research_not_found(ResearchErrorCode.PROJECT_NOT_FOUND, "Research project not found.")
        chain = str(request.GET.get("chain") or "").lower() or None
        if chain and chain not in CHAINS:
            return research_error(
                ResearchErrorCode.CHAIN_INVALID,
                "chain must be thinking or development.",
            )
        timeline = build_timeline(workspace, project_id, request.user, chain=chain)
        return Response(
            {
                "project": str(project_id),
                "chain": chain,
                "groups": chain_groups(timeline),
                "degraded_sources": timeline["degraded_sources"],
                "generated_at": timeline["generated_at"],
            },
            status=status.HTTP_200_OK,
        )
