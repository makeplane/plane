import os
import jwt
from datetime import timedelta, datetime
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.backends import default_backend

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from sentry_sdk import capture_exception

# Module imports
from plane.api.views import BaseViewSet
from plane.db.models import (
    GithubIssueSync,
    GithubRepositorySync,
    GithubRepository,
    WorkspaceIntegration,
    ProjectMember,
    Label,
    GithubCommentSync,
)
from plane.api.serializers import (
    GithubIssueSyncSerializer,
    GithubRepositorySyncSerializer,
    GithubCommentSyncSerializer,
)


class GithubRepositorySyncViewSet(BaseViewSet):
    serializer_class = GithubRepositorySyncSerializer
    model = GithubRepositorySync

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))

    def create(self, request, slug, project_id, workspace_integration_id):
        try:
            name = request.data.get("name", False)
            url = request.data.get("url", False)
            config = request.data.get("config", {})
            repository_id = request.data.get("repository_id", False)
            owner = request.data.get("owner", False)
            installation_id = request.data.get("installation_id", False)

            if (
                not name
                or not url
                or not repository_id
                or not owner
                or not installation_id
            ):
                return Response(
                    {
                        "error": "Name, url, repository_id, owner and installation_id are required"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create repository
            repo = GithubRepository.objects.create(
                name=name,
                url=url,
                config=config,
                repository_id=repository_id,
                owner=owner,
                project_id=project_id,
            )

            # Get the workspace integration
            workspace_integration = WorkspaceIntegration.objects.get(
                pk=workspace_integration_id
            )

            # Create a Label for github
            label = Label.objects.filter(
                name="GitHub",
                project_id=project_id,
            ).first()

            if label is None:
                label = Label.objects.create(
                    name="GitHub",
                    project_id=project_id,
                    description="Label to sync Plane issues with GitHub issues",
                    color="#003773",
                )

            # Create repo sync
            repo_sync = GithubRepositorySync.objects.create(
                repository=repo,
                workspace_integration=workspace_integration,
                actor=workspace_integration.actor,
                credentials=request.data.get("credentials", {}),
                project_id=project_id,
                label=label,
                installation_id=installation_id,
            )

            # Add bot as a member in the project
            _ = ProjectMember.objects.create(
                member=workspace_integration.actor, role=20, project_id=project_id
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
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            repository_sync_id=self.kwargs.get("repo_sync_id"),
        )


class GithubCommentSyncViewSet(BaseViewSet):
    serializer_class = GithubCommentSyncSerializer
    model = GithubCommentSync

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            issue_sync_id=self.kwargs.get("issue_sync_id"),
        )
