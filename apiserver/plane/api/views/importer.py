# Third party imports
from rest_framework import status
from rest_framework.response import Response
from sentry_sdk import capture_exception

# Django imports
from django.db.models import Max

# Module imports
from plane.api.views import BaseAPIView
from plane.db.models import (
    WorkspaceIntegration,
    Importer,
    APIToken,
    Project,
    State,
    IssueSequence,
    Issue,
    IssueActivity,
    IssueComment,
    IssueLink,
    IssueLabel,
    Workspace,
)
from plane.api.serializers import ImporterSerializer, IssueFlatSerializer
from plane.utils.integrations.github import get_github_repo_details
from plane.bgtasks.importer_task import service_importer
from plane.utils.html_processor import strip_tags


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


class BulkImportIssuesEndpoint(BaseAPIView):
    def post(self, request, slug, project_id, service):
        try:
            # Get the project
            project = Project.objects.get(pk=project_id, workspace__slug=slug)

            # Get the default state
            default_state = State.objects.filter(
                project_id=project_id, default=True
            ).first()
            # if there is no default state assign any random state
            if default_state is None:
                default_state = State.objects.filter(project_id=project_id).first()

            # Get the maximum sequence_id
            last_id = IssueSequence.objects.filter(project_id=project_id).aggregate(
                largest=Max("sequence")
            )["largest"]

            last_id = 1 if last_id is None else last_id + 1

            # Get the maximum sort order
            largest_sort_order = Issue.objects.filter(
                project_id=project_id, state=default_state
            ).aggregate(largest=Max("sort_order"))["largest"]

            largest_sort_order = (
                65535 if largest_sort_order is None else largest_sort_order + 10000
            )

            # Get the issues_data
            issues_data = request.data.get("issues_data", [])

            if not len(issues_data):
                return Response(
                    {"error": "Issue data is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Issues
            bulk_issues = []
            for issue_data in issues_data:
                bulk_issues.append(
                    Issue(
                        project_id=project_id,
                        workspace_id=project.workspace_id,
                        state=default_state,
                        name=issue_data.get("name", "Issue Created through Bulk"),
                        description_html=issue_data.get("description_html", "<p></p>"),
                        description_stripped=(
                            None
                            if (
                                issue_data.get("description_html") == ""
                                or issue_data.get("description_html") is None
                            )
                            else strip_tags(issue_data.get("description_html"))
                        ),
                        sequence_id=last_id,
                        sort_order=largest_sort_order,
                        start_date=issue_data.get("start_date", None),
                        target_date=issue_data.get("target_date", None),
                    )
                )

                largest_sort_order = largest_sort_order + 10000
                last_id = last_id + 1

            issues = Issue.objects.bulk_create(
                bulk_issues,
                batch_size=100,
                ignore_conflicts=True,
            )

            # Sequences
            _ = IssueSequence.objects.bulk_create(
                [
                    IssueSequence(
                        issue=issue,
                        sequence=issue.sequence_id,
                        project_id=project_id,
                        workspace_id=project.workspace_id,
                    )
                    for issue in issues
                ],
                batch_size=100,
            )

            # Attach Labels
            bulk_issue_labels = []
            for issue, issue_data in zip(issues, issues_data):
                labels_list = issue_data.get("labels_list", [])
                bulk_issue_labels = bulk_issue_labels + [
                    IssueLabel(
                        issue=issue,
                        label_id=label_id,
                        project_id=project_id,
                        workspace_id=project.workspace_id,
                        created_by=request.user,
                        updated_by=request.user,
                    )
                    for label_id in labels_list
                ]

            _ = IssueLabel.objects.bulk_create(bulk_issue_labels, batch_size=100)

            # Track the issue activities
            IssueActivity.objects.bulk_create(
                [
                    IssueActivity(
                        issue=issue,
                        actor=request.user,
                        project_id=project_id,
                        workspace_id=project.workspace_id,
                        comment=f"{request.user.email} importer the issue from {service}",
                        verb="created",
                    )
                    for issue in issues
                ],
                batch_size=100,
            )

            # Create Comments
            bulk_issue_comments = []
            for issue, issue_data in zip(issues, issues_data):
                comments_list = issue_data.get("comments_list", [])
                bulk_issue_comments = bulk_issue_comments + [
                    IssueComment(
                        issue=issue,
                        comment_html=comment.get("comment_html", "<p></p>"),
                        actor=request.user,
                        project_id=project_id,
                        workspace_id=project.workspace_id,
                        created_by=request.user,
                        updated_by=request.user,
                    )
                    for comment in comments_list
                ]

            _ = IssueComment.objects.bulk_create(bulk_issue_comments, batch_size=100)

            # Attach Links
            _ = IssueLink.objects.bulk_create(
                [
                    IssueLink(
                        issue=issue,
                        url=issue_data.get("link", {}).get("url", "https://github.com"),
                        title=issue_data.get("link", {}).get("title", "Original Issue"),
                        project_id=project_id,
                        workspace_id=project.workspace_id,
                        created_by=request.user,
                        updated_by=request.user,
                    )
                    for issue, issue_data in zip(issues, issues_data)
                ]
            )

            return Response(
                {"issues": IssueFlatSerializer(issues, many=True).data},
                status=status.HTTP_201_CREATED,
            )
        except Project.DoesNotExist:
            return Response(
                {"error": "Project Does not exist"}, status=status.HTTP_404_NOT_FOUND
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

                api_token = APIToken.objects.filter(user=request.user).first()
                if api_token is None:
                    api_token = APIToken.objects.create(
                        user=request.user,
                        label="Importer",
                        workspace=workspace,
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
        except (Workspace.DoesNotExist, WorkspaceIntegration.DoesNotExist) as e:
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
