# Django import
from django.db import IntegrityError

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from sentry_sdk import capture_exception

# Module imports
from plane.app.views import BaseViewSet, BaseAPIView
from plane.db.models import (
    SlackProjectSync,
    WorkspaceIntegration,
    ProjectMember,
)
from plane.app.serializers import SlackProjectSyncSerializer
from plane.app.permissions import (
    ProjectBasePermission,
    ProjectEntityPermission,
)
from plane.utils.integrations.slack import slack_oauth


class SlackProjectSyncViewSet(BaseViewSet):
    permission_classes = [
        ProjectBasePermission,
    ]
    serializer_class = SlackProjectSyncSerializer
    model = SlackProjectSync

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
            )
            .filter(project__project_projectmember__member=self.request.user)
        )

    def create(self, request, slug, project_id, workspace_integration_id):
        try:
            code = request.data.get("code", False)

            if not code:
                return Response(
                    {"error": "Code is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            slack_response = slack_oauth(code=code)

            workspace_integration = WorkspaceIntegration.objects.get(
                workspace__slug=slug, pk=workspace_integration_id
            )

            workspace_integration = WorkspaceIntegration.objects.get(
                pk=workspace_integration_id, workspace__slug=slug
            )
            slack_project_sync = SlackProjectSync.objects.create(
                access_token=slack_response.get("access_token"),
                scopes=slack_response.get("scope"),
                bot_user_id=slack_response.get("bot_user_id"),
                webhook_url=slack_response.get("incoming_webhook", {}).get(
                    "url"
                ),
                data=slack_response,
                team_id=slack_response.get("team", {}).get("id"),
                team_name=slack_response.get("team", {}).get("name"),
                workspace_integration=workspace_integration,
                project_id=project_id,
            )
            _ = ProjectMember.objects.get_or_create(
                member=workspace_integration.actor,
                role=20,
                project_id=project_id,
            )
            serializer = SlackProjectSyncSerializer(slack_project_sync)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"error": "Slack is already installed for the project"},
                    status=status.HTTP_410_GONE,
                )
            capture_exception(e)
            return Response(
                {
                    "error": "Slack could not be installed. Please try again later"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
