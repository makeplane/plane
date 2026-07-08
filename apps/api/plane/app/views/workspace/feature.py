# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkspaceUserPermission
from plane.app.views.base import BaseAPIView
from plane.db.models import Workspace, WorkspaceFeature


class WorkspaceFeatureEndpoint(BaseAPIView):
    """Expose the per-workspace feature flags to workspace members.

    Flags are managed from the instance admin (god-mode); members only read
    them to decide which modules to render.
    """

    permission_classes = [WorkspaceUserPermission]

    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        enabled_keys = set(
            WorkspaceFeature.objects.filter(workspace=workspace, is_enabled=True).values_list("key", flat=True)
        )
        features = {key: (key in enabled_keys) for key, _ in WorkspaceFeature.FeatureKey.choices}
        return Response({"features": features}, status=status.HTTP_200_OK)
