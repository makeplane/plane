from .base import IntegrationSerializer, WorkspaceIntegrationSerializer
from .github import (
    GithubRepositorySerializer,
    GithubRepositorySyncSerializer,
    GithubIssueSyncSerializer,
    GithubCommentSyncSerializer,
)
from .slack import SlackProjectSyncSerializer
