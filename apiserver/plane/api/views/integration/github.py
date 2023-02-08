# Third party imports
from rest_framework import status
from rest_framework.response import Response
from sentry_sdk import capture_exception

# Module imports
from plane.api.views import BaseViewSet
from plane.db.models import (
    GithubIssueSync,
    GithubRepositorySync,
    GithubRepository,
    WorkspaceIntegration,
)
from plane.api.serializers import (
    GithubRepositorySerializer,
    GithubIssueSyncSerializer,
    GithubRepositorySyncSerializer,
)


class GithubRepositorySyncViewSet(BaseViewSet):
    serializer_class = GithubRepositorySyncSerializer
    model = GithubRepositorySync

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))

    def create(self, request, workspace_integration_id):
        try:
            name = (request.data.get("name", False),)
            url = (request.data.get("url", False),)
            config = (request.data.get("config", {}),)
            repository_id = request.data.get("repository_id", False)

            if not name or not url or not repository_id:
                return Response(
                    {"error": "Name, url, and repository_id are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create repository
            repo = GithubRepository.objects.create(
                name=name, url=url, config=config, repository_id=repository_id
            )

            # Get the workspace integration
            workspace_integration = WorkspaceIntegration.objects.get(
                pk=workspace_integration_id
            )

            # Create repo sync
            repo_sync = GithubRepositorySync.objects.create(
                repository=repo,
                workspace_integration=workspace_integration,
                actor=workspace_integration.actor,
                credetials=request.data.get("credentials", {}),
            )

            # Return Response
            return Response(
                GithubRepositorySyncSerializer(repo_sync).data,
                status=status.HTTP_201_CREATED,
            )

        except WorkspaceIntegration.DoesNotExist:
            return Response(
                {"error": "Workspace Integration does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class GithubIssueSyncViewSet(BaseViewSet):
    serializer_class = GithubIssueSyncSerializer
    model = GithubIssueSync

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))
