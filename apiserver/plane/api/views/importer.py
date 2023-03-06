# Third party imports
from rest_framework import status
from rest_framework.response import Response
from sentry_sdk import capture_exception

# Module imports
from plane.api.views import BaseViewSet, BaseAPIView
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
from plane.utils.integrations.github import get_github_repo_details


class ServiceIssueImportSummaryEndpoint(BaseAPIView):
    def get(self, request, slug, service):
        try:
            if service == "github":
                workspace_integration = WorkspaceIntegration.objects.get(
                    integration__provider="github", workspace__slug=slug
                )

                access_tokens_url = workspace_integration.metadata["access_tokens_url"]
                owner = request.GET.get("owner")
                repo = request.GET.get("repo")

                issue_count, labels, collaborators = get_github_repo_details(
                    access_tokens_url, owner, repo
                )
                return Response(
                    {
                        "issue_count": issue_count,
                        "labels": labels,
                        "collaborators": collaborators,
                    },
                    status=status.HTTP_200_OK,
                )

            return Response(
                {"error": "Service not supported yet"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except WorkspaceIntegration.DoesNotExist:
            return Response(
                {"error": "Requested integration was not installed in the workspace"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ImportServiceEndpoint(BaseAPIView):
    def post(self, request, slug):
        try:
            # save the owner and repo info
            # users: [] if no import else [{ below values }]
            # { "username": "pablohashescobar", "import": "map-existing", "email": "nikhilschacko@gmail.com" }
            # { "username": "aaryan610", "import": False, "" }
            # { "username": "john", "import": "invite", "email": "john@gmail.com"}
            
            
            pass
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
