# Third party imports
from rest_framework import status

# Module imports
from plane.api.views import BaseViewSet
from plane.db.models import GithubIssueSync, GithubRepositorySync, GithubRepository
from plane.api.serializers import (
    GithubIssueSyncSerializer,
    GithubRepositorySyncSerializer,
    GithubRepositorySerializer,
)


class GithubRepoViewSet(BaseViewSet):
    serializer_class = GithubRepositorySerializer
    model = GithubRepository

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))


class GithubRepositorySyncViewSet(BaseViewSet):
    serializer_class = GithubRepositorySyncSerializer
    model = GithubRepositorySync

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))


class GithubIssueSyncViewSet(BaseViewSet):
    serializer_class = GithubIssueSyncSerializer
    model = GithubIssueSync

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))
