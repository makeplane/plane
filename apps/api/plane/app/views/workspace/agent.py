# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkspaceViewerPermission
from plane.app.views.base import BaseAPIView
from plane.db.models import Workspace
from plane.license.models import AgentDefinition
from plane.utils.agent_credentials import agent_credential_sources

# The only fields a workspace member may see. Never add ``env``.
WORKSPACE_AGENT_FIELDS = (
    "id",
    "name",
    "slug",
    "description",
    "adapter",
    "default_permission_level",
    "max_permission_level",
)


class WorkspaceAgentsEndpoint(BaseAPIView):
    """Enabled agents a workspace member can start a chat with."""

    permission_classes = [WorkspaceViewerPermission]

    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        agents = list(AgentDefinition.objects.filter(is_enabled=True))
        sources = agent_credential_sources(workspace, request.user, agents)
        return Response(
            [
                {
                    **{field: getattr(agent, field) for field in WORKSPACE_AGENT_FIELDS},
                    # Where a chat would get its credential; null means it would fail to sign in.
                    "credential_source": sources[agent.id],
                }
                for agent in agents
            ],
            status=status.HTTP_200_OK,
        )
