# Python improts
import uuid
import requests

# Django imports
from django.contrib.auth.hashers import make_password

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from plane.app.views import BaseViewSet
from plane.db.models import (
    Integration,
    WorkspaceIntegration,
    Workspace,
    User,
    WorkspaceMember,
    APIToken,
)
from plane.app.serializers import (
    IntegrationSerializer,
    WorkspaceIntegrationSerializer,
)
from plane.utils.integrations.github import (
    get_github_metadata,
    delete_github_installation,
)
from plane.app.permissions import WorkSpaceAdminPermission
from plane.utils.integrations.slack import slack_oauth


class IntegrationViewSet(BaseViewSet):
    serializer_class = IntegrationSerializer
    model = Integration

    def create(self, request):
        serializer = IntegrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, pk):
        integration = Integration.objects.get(pk=pk)
        if integration.verified:
            return Response(
                {"error": "Verified integrations cannot be updated"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = IntegrationSerializer(
            integration, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk):
        integration = Integration.objects.get(pk=pk)
        if integration.verified:
            return Response(
                {"error": "Verified integrations cannot be updated"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        integration.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceIntegrationViewSet(BaseViewSet):
    serializer_class = WorkspaceIntegrationSerializer
    model = WorkspaceIntegration

    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("integration")
        )

    def create(self, request, slug, provider):
        workspace = Workspace.objects.get(slug=slug)
        integration = Integration.objects.get(provider=provider)
        config = {}
        if provider == "github":
            installation_id = request.data.get("installation_id", None)
            if not installation_id:
                return Response(
                    {"error": "Installation ID is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            metadata = get_github_metadata(installation_id)
            config = {"installation_id": installation_id}

        if provider == "slack":
            code = request.data.get("code", False)

            if not code:
                return Response(
                    {"error": "Code is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            slack_response = slack_oauth(code=code)

            metadata = slack_response
            access_token = metadata.get("access_token", False)
            team_id = metadata.get("team", {}).get("id", False)
            if not metadata or not access_token or not team_id:
                return Response(
                    {
                        "error": "Slack could not be installed. Please try again later"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            config = {"team_id": team_id, "access_token": access_token}

        # Create a bot user
        bot_user = User.objects.create(
            email=f"{uuid.uuid4().hex}@plane.so",
            username=uuid.uuid4().hex,
            password=make_password(uuid.uuid4().hex),
            is_password_autoset=True,
            is_bot=True,
            first_name=integration.title,
            avatar=integration.avatar_url
            if integration.avatar_url is not None
            else "",
        )

        # Create an API Token for the bot user
        api_token = APIToken.objects.create(
            user=bot_user,
            user_type=1,  # bot user
            workspace=workspace,
        )

        workspace_integration = WorkspaceIntegration.objects.create(
            workspace=workspace,
            integration=integration,
            actor=bot_user,
            api_token=api_token,
            metadata=metadata,
            config=config,
        )

        # Add bot user as a member of workspace
        _ = WorkspaceMember.objects.create(
            workspace=workspace_integration.workspace,
            member=bot_user,
            role=20,
        )
        return Response(
            WorkspaceIntegrationSerializer(workspace_integration).data,
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, slug, pk):
        workspace_integration = WorkspaceIntegration.objects.get(
            pk=pk, workspace__slug=slug
        )

        if workspace_integration.integration.provider == "github":
            installation_id = workspace_integration.config.get(
                "installation_id", False
            )
            if installation_id:
                delete_github_installation(installation_id=installation_id)

        workspace_integration.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
