# Third party imports
from rest_framework import status
from rest_framework.response import Response
from sentry_sdk import capture_exception

# Module imports
from plane.api.views import BaseAPIView
from plane.db.models import (
    WorkspaceIntegration,
    Importer,
    APIToken,
    Workspace,
)
from plane.api.serializers import ImporterSerializer
from plane.utils.integrations.github import get_github_repo_details
from plane.bgtasks.importer_task import service_importer


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
    def post(self, request, slug, service):
        try:
            project_id = request.data.get("project_id", False)

            if not project_id:
                return Response(
                    {"error": "Project ID is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            workspace = Workspace.objects.get(slug=slug)

            if service == "github":
                data = request.data.get("data", False)
                metadata = request.data.get("metadata", False)
                config = request.data.get("config", False)
                if not data or not metadata or not config:
                    return Response(
                        {"error": "Data, config and metadata are required"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                api_token = APIToken.objects.filter(
                    user=request.user, workspace__slug=slug
                ).first()

                if api_token is None:
                    api_token = APIToken.objects.create(
                        label="Github Importer", user=request.user, workspace=workspace
                    )

                importer = Importer.objects.create(
                    service=service,
                    project_id=project_id,
                    status="queued",
                    initiated_by=request.user,
                    data=data,
                    metadata=metadata,
                    token=api_token,
                    config=config,
                    created_by=request.user,
                    updated_by=request.user,
                )

                service_importer.delay(service, importer.id)
                serializer = ImporterSerializer(importer)
                return Response(serializer.data, status=status.HTTP_200_OK)

            return Response(
                {"error": "Servivce not supported yet"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace does not exist"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def get(self, request, slug):
        try:
            imports = Importer.objects.filter(workspace__slug=slug)
            serializer = ImporterSerializer(imports, many=True)
            return Response(serializer.data)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UpdateServiceImportStatusEndpoint(BaseAPIView):
    def post(self, request, slug, project_id, service, importer_id):
        try:
            importer = Importer.objects.get(
                pk=importer_id,
                workspace__slug=slug,
                project_id=project_id,
                service=service,
            )
            importer.status = request.data.get("status", "processing")
            importer.save()
            return Response(status.HTTP_200_OK)
        except Importer.DoesNotExist:
            return Response(
                {"error": "Importer does not exist"}, status=status.HTTP_404_NOT_FOUND
            )
