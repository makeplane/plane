# Third party imports
from rest_framework import status
from rest_framework.response import Response
from sentry_sdk import capture_exception

# Module imports
from plane.app.views import BaseViewSet, BaseAPIView
from plane.db.models import (
    GithubIssueSync,
    GithubRepositorySync,
    GithubRepository,
    WorkspaceIntegration,
    ProjectMember,
    Label,
    GithubCommentSync,
    Project,
)
from plane.app.serializers import (
    GithubIssueSyncSerializer,
    GithubRepositorySyncSerializer,
    GithubCommentSyncSerializer,
)
from plane.utils.integrations.github import get_github_repos
from plane.app.permissions import (
    ProjectBasePermission,
    ProjectEntityPermission,
)


class GithubRepositoriesEndpoint(BaseAPIView):
    permission_classes = [
        ProjectBasePermission,
    ]

    def get(self, request, slug, workspace_integration_id):
        page = request.GET.get("page", 1)
        workspace_integration = WorkspaceIntegration.objects.get(
            workspace__slug=slug, pk=workspace_integration_id
        )

        if workspace_integration.integration.provider != "github":
            return Response(
                {"error": "Not a github integration"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        access_tokens_url = workspace_integration.metadata["access_tokens_url"]
        repositories_url = (
            workspace_integration.metadata["repositories_url"]
            + f"?per_page=100&page={page}"
        )
        repositories = get_github_repos(access_tokens_url, repositories_url)
        return Response(repositories, status=status.HTTP_200_OK)


class GithubRepositorySyncViewSet(BaseViewSet):
    permission_classes = [
        ProjectBasePermission,
    ]

    serializer_class = GithubRepositorySyncSerializer
    model = GithubRepositorySync

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
        )

    def create(self, request, slug, project_id, workspace_integration_id):
        name = request.data.get("name", False)
        url = request.data.get("url", False)
        config = request.data.get("config", {})
        repository_id = request.data.get("repository_id", False)
        owner = request.data.get("owner", False)

        if not name or not url or not repository_id or not owner:
            return Response(
                {"error": "Name, url, repository_id and owner are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace integration
        workspace_integration = WorkspaceIntegration.objects.get(
            pk=workspace_integration_id
        )

        # Delete the old repository object
        GithubRepositorySync.objects.filter(
            project_id=project_id, workspace__slug=slug
        ).delete()
        GithubRepository.objects.filter(
            project_id=project_id, workspace__slug=slug
        ).delete()

        # Create repository
        repo = GithubRepository.objects.create(
            name=name,
            url=url,
            config=config,
            repository_id=repository_id,
            owner=owner,
            project_id=project_id,
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
        )

        # Add bot as a member in the project
        _ = ProjectMember.objects.get_or_create(
            member=workspace_integration.actor, role=20, project_id=project_id
        )

        # Return Response
        return Response(
            GithubRepositorySyncSerializer(repo_sync).data,
            status=status.HTTP_201_CREATED,
        )


class GithubIssueSyncViewSet(BaseViewSet):
    permission_classes = [
        ProjectEntityPermission,
    ]

    serializer_class = GithubIssueSyncSerializer
    model = GithubIssueSync

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            repository_sync_id=self.kwargs.get("repo_sync_id"),
        )


class BulkCreateGithubIssueSyncEndpoint(BaseAPIView):
    def post(self, request, slug, project_id, repo_sync_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)

        github_issue_syncs = request.data.get("github_issue_syncs", [])
        github_issue_syncs = GithubIssueSync.objects.bulk_create(
            [
                GithubIssueSync(
                    issue_id=github_issue_sync.get("issue"),
                    repo_issue_id=github_issue_sync.get("repo_issue_id"),
                    issue_url=github_issue_sync.get("issue_url"),
                    github_issue_id=github_issue_sync.get("github_issue_id"),
                    repository_sync_id=repo_sync_id,
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                    created_by=request.user,
                    updated_by=request.user,
                )
                for github_issue_sync in github_issue_syncs
            ],
            batch_size=100,
            ignore_conflicts=True,
        )

        serializer = GithubIssueSyncSerializer(github_issue_syncs, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class GithubCommentSyncViewSet(BaseViewSet):
    permission_classes = [
        ProjectEntityPermission,
    ]

    serializer_class = GithubCommentSyncSerializer
    model = GithubCommentSync

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            issue_sync_id=self.kwargs.get("issue_sync_id"),
        )
