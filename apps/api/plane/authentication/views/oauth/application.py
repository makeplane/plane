# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Standard library imports
from typing import Any

# Third-party imports
from oauth2_provider.models import Application
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response

# Local application imports
from plane.api.views.base import BaseAPIView
from plane.authentication.models import WorkspaceAppInstallation, AccessToken
from plane.authentication.serializers import WorkspaceAppInstallationSerializer


class OAuthApplicationInstalledWorkspacesEndpoint(BaseAPIView):
    required_scopes = []

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        application: Application = request.auth.application

        filters = {}
        if request.query_params.get("id"):
            filters["id"] = request.query_params.get("id")

        workspace_applications = WorkspaceAppInstallation.objects.filter(application=application, **filters)

        # Always filter those workspaces where user is a member
        workspace_applications = workspace_applications.filter(
            workspace__workspace_member__member=request.auth.user,
        )
        token = AccessToken.objects.get(token=request.auth.token)
        if token.workspace:
            workspace_applications = workspace_applications.filter(
                workspace=token.workspace,
            )

        workspace_applications_serializer = WorkspaceAppInstallationSerializer(workspace_applications, many=True)
        return Response(workspace_applications_serializer.data, status=status.HTTP_200_OK)
