# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkspaceViewerPermission
from plane.app.views.base import BaseAPIView
from plane.license.models import AgentDefinition

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
        agents = AgentDefinition.objects.filter(is_enabled=True).values(*WORKSPACE_AGENT_FIELDS)
        return Response(list(agents), status=status.HTTP_200_OK)
