# Python imports
import uuid

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Django imports
from django.db.models import Max, Q

# Module imports
from plane.app.views import BaseAPIView
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
    IssueAssignee,
    Module,
    ModuleLink,
    ModuleIssue,
    Label,
)
from plane.app.serializers import (
    ImporterSerializer,
    IssueFlatSerializer,
    ModuleSerializer,
)
from plane.utils.integrations.github import get_github_repo_details
from plane.utils.importers.jira import (
    jira_project_issue_summary,
    is_allowed_hostname,
)
from plane.bgtasks.importer_task import service_importer
from plane.utils.html_processor import strip_tags
from plane.app.permissions import WorkSpaceAdminPermission


class ServiceIssueImportSummaryEndpoint(BaseAPIView):
    def get(self, request, slug, service):
        if service == "github":
            owner = request.GET.get("owner", False)
            repo = request.GET.get("repo", False)

            if not owner or not repo:
                return Response(
                    {"error": "Owner and repo are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            workspace_integration = WorkspaceIntegration.objects.get(
                integration__provider="github", workspace__slug=slug
            )

            access_tokens_url = workspace_integration.metadata.get(
                "access_tokens_url", False
            )

            if not access_tokens_url:
                return Response(
                    {
                        "error": "There was an error during the installation of the GitHub app. To resolve this issue, we recommend reinstalling the GitHub app."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

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

        if service == "jira":
            # Check for all the keys
            params = {
                "project_key": "Project key is required",
                "api_token": "API token is required",
                "email": "Email is required",
                "cloud_hostname": "Cloud hostname is required",
            }

            for key, error_message in params.items():
                if not request.GET.get(key, False):
                    return Response(
                        {"error": error_message},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            project_key = request.GET.get("project_key", "")
            api_token = request.GET.get("api_token", "")
            email = request.GET.get("email", "")
            cloud_hostname = request.GET.get("cloud_hostname", "")

            response = jira_project_issue_summary(
                email, api_token, project_key, cloud_hostname
            )
            if "error" in response:
                return Response(response, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response(
                    response,
                    status=status.HTTP_200_OK,
                )
        return Response(
            {"error": "Service not supported yet"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class ImportServiceEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def post(self, request, slug, service):
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
                user=request.user, workspace=workspace
            ).first()
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
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        if service == "jira":
            data = request.data.get("data", False)
            metadata = request.data.get("metadata", False)
            config = request.data.get("config", False)

            cloud_hostname = metadata.get("cloud_hostname", False)

            if not cloud_hostname:
                return Response(
                    {"error": "Cloud hostname is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not is_allowed_hostname(cloud_hostname):
                return Response(
                    {"error": "Hostname is not a valid hostname."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not data or not metadata:
                return Response(
                    {"error": "Data, config and metadata are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            api_token = APIToken.objects.filter(
                user=request.user, workspace=workspace
            ).first()
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
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(
            {"error": "Servivce not supported yet"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def get(self, request, slug):
        imports = (
            Importer.objects.filter(workspace__slug=slug)
            .order_by("-created_at")
            .select_related("initiated_by", "project", "workspace")
        )
        serializer = ImporterSerializer(imports, many=True)
        return Response(serializer.data)

    def delete(self, request, slug, service, pk):
        importer = Importer.objects.get(
            pk=pk, service=service, workspace__slug=slug
        )

        if importer.imported_data is not None:
            # Delete all imported Issues
            imported_issues = importer.imported_data.get("issues", [])
            Issue.issue_objects.filter(id__in=imported_issues).delete()

            # Delete all imported Labels
            imported_labels = importer.imported_data.get("labels", [])
            Label.objects.filter(id__in=imported_labels).delete()

            if importer.service == "jira":
                imported_modules = importer.imported_data.get("modules", [])
                Module.objects.filter(id__in=imported_modules).delete()
        importer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, slug, service, pk):
        importer = Importer.objects.get(
            pk=pk, service=service, workspace__slug=slug
        )
        serializer = ImporterSerializer(
            importer, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateServiceImportStatusEndpoint(BaseAPIView):
    def post(self, request, slug, project_id, service, importer_id):
        importer = Importer.objects.get(
            pk=importer_id,
            workspace__slug=slug,
            project_id=project_id,
            service=service,
        )
        importer.status = request.data.get("status", "processing")
        importer.save()
        return Response(status.HTTP_200_OK)


class BulkImportIssuesEndpoint(BaseAPIView):
    def post(self, request, slug, project_id, service):
        # Get the project
        project = Project.objects.get(pk=project_id, workspace__slug=slug)

        # Get the default state
        default_state = State.objects.filter(
            ~Q(name="Triage"), project_id=project_id, default=True
        ).first()
        # if there is no default state assign any random state
        if default_state is None:
            default_state = State.objects.filter(
                ~Q(name="Triage"), project_id=project_id
            ).first()

        # Get the maximum sequence_id
        last_id = IssueSequence.objects.filter(
            project_id=project_id
        ).aggregate(largest=Max("sequence"))["largest"]

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
                    state_id=issue_data.get("state")
                    if issue_data.get("state", False)
                    else default_state.id,
                    name=issue_data.get("name", "Issue Created through Bulk"),
                    description_html=issue_data.get(
                        "description_html", "<p></p>"
                    ),
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
                    priority=issue_data.get("priority", "none"),
                    created_by=request.user,
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
                )
                for label_id in labels_list
            ]

        _ = IssueLabel.objects.bulk_create(
            bulk_issue_labels, batch_size=100, ignore_conflicts=True
        )

        # Attach Assignees
        bulk_issue_assignees = []
        for issue, issue_data in zip(issues, issues_data):
            assignees_list = issue_data.get("assignees_list", [])
            bulk_issue_assignees = bulk_issue_assignees + [
                IssueAssignee(
                    issue=issue,
                    assignee_id=assignee_id,
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                    created_by=request.user,
                )
                for assignee_id in assignees_list
            ]

        _ = IssueAssignee.objects.bulk_create(
            bulk_issue_assignees, batch_size=100, ignore_conflicts=True
        )

        # Track the issue activities
        IssueActivity.objects.bulk_create(
            [
                IssueActivity(
                    issue=issue,
                    actor=request.user,
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                    comment=f"imported the issue from {service}",
                    verb="created",
                    created_by=request.user,
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
                )
                for comment in comments_list
            ]

        _ = IssueComment.objects.bulk_create(
            bulk_issue_comments, batch_size=100
        )

        # Attach Links
        _ = IssueLink.objects.bulk_create(
            [
                IssueLink(
                    issue=issue,
                    url=issue_data.get("link", {}).get(
                        "url", "https://github.com"
                    ),
                    title=issue_data.get("link", {}).get(
                        "title", "Original Issue"
                    ),
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                    created_by=request.user,
                )
                for issue, issue_data in zip(issues, issues_data)
            ]
        )

        return Response(
            {"issues": IssueFlatSerializer(issues, many=True).data},
            status=status.HTTP_201_CREATED,
        )


class BulkImportModulesEndpoint(BaseAPIView):
    def post(self, request, slug, project_id, service):
        modules_data = request.data.get("modules_data", [])
        project = Project.objects.get(pk=project_id, workspace__slug=slug)

        modules = Module.objects.bulk_create(
            [
                Module(
                    name=module.get("name", uuid.uuid4().hex),
                    description=module.get("description", ""),
                    start_date=module.get("start_date", None),
                    target_date=module.get("target_date", None),
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                    created_by=request.user,
                )
                for module in modules_data
            ],
            batch_size=100,
            ignore_conflicts=True,
        )

        modules = Module.objects.filter(
            id__in=[module.id for module in modules]
        )

        if len(modules) == len(modules_data):
            _ = ModuleLink.objects.bulk_create(
                [
                    ModuleLink(
                        module=module,
                        url=module_data.get("link", {}).get(
                            "url", "https://plane.so"
                        ),
                        title=module_data.get("link", {}).get(
                            "title", "Original Issue"
                        ),
                        project_id=project_id,
                        workspace_id=project.workspace_id,
                        created_by=request.user,
                    )
                    for module, module_data in zip(modules, modules_data)
                ],
                batch_size=100,
                ignore_conflicts=True,
            )

            bulk_module_issues = []
            for module, module_data in zip(modules, modules_data):
                module_issues_list = module_data.get("module_issues_list", [])
                bulk_module_issues = bulk_module_issues + [
                    ModuleIssue(
                        issue_id=issue,
                        module=module,
                        project_id=project_id,
                        workspace_id=project.workspace_id,
                        created_by=request.user,
                    )
                    for issue in module_issues_list
                ]

            _ = ModuleIssue.objects.bulk_create(
                bulk_module_issues, batch_size=100, ignore_conflicts=True
            )

            serializer = ModuleSerializer(modules, many=True)
            return Response(
                {"modules": serializer.data}, status=status.HTTP_201_CREATED
            )

        else:
            return Response(
                {
                    "message": "Modules created but issues could not be imported"
                },
                status=status.HTTP_200_OK,
            )
