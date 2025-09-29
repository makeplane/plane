# Standard library imports
from typing import Any

# Third-party imports
from oauth2_provider.contrib.rest_framework import (
    OAuth2Authentication,
    TokenHasReadWriteScope,
)
from oauth2_provider.models import Application
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response

# Local application imports
from plane.api.views.base import BaseAPIView
from plane.authentication.models import WorkspaceAppInstallation, AccessToken
from plane.authentication.serializers import WorkspaceAppInstallationSerializer


class OAuthApplicationInstalledWorkspacesEndpoint(BaseAPIView):
    authentication_classes = [OAuth2Authentication]
    permission_classes = [TokenHasReadWriteScope]

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        application: Application = request.auth.application

        filters = {}
        if request.query_params.get("id"):
            filters["id"] = request.query_params.get("id")

        workspace_applications = WorkspaceAppInstallation.objects.filter(
            application=application, **filters
        )

        # Always filter those workspaces where user is a member
        if request.auth.grant_type == "authorization_code":
            workspace_applications = workspace_applications.filter(
                workspace__workspace_member__member=request.auth.user,
            )
            token = AccessToken.objects.get(token=request.auth.token)
            if token.workspace:
                workspace_applications = workspace_applications.filter(
                    workspace=token.workspace,
                )

        workspace_applications_serializer = WorkspaceAppInstallationSerializer(
            workspace_applications, many=True
        )
        return Response(
            workspace_applications_serializer.data, status=status.HTTP_200_OK
        )
