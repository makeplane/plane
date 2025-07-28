# Python imports
import json

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone
from django.db.models import Q, Value, UUIDField
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, OpenApiRequest

# Module imports
from plane.api.serializers import (
    IntakeIssueSerializer,
    IssueSerializer,
    IntakeIssueCreateSerializer,
    IntakeIssueUpdateSerializer,
)
from plane.app.permissions import ProjectLitePermission
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import Intake, IntakeIssue, Issue, Project, ProjectMember, State
from plane.utils.host import base_host
from .base import BaseAPIView
from plane.db.models.intake import SourceType
from plane.utils.openapi import (
    intake_docs,
    WORKSPACE_SLUG_PARAMETER,
    PROJECT_ID_PARAMETER,
    ISSUE_ID_PARAMETER,
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
    FIELDS_PARAMETER,
    EXPAND_PARAMETER,
    create_paginated_response,
    # Request Examples
    INTAKE_ISSUE_CREATE_EXAMPLE,
    INTAKE_ISSUE_UPDATE_EXAMPLE,
    # Response Examples
    INTAKE_ISSUE_EXAMPLE,
    INVALID_REQUEST_RESPONSE,
    DELETED_RESPONSE,
)


class IntakeIssueListCreateAPIEndpoint(BaseAPIView):
    """Intake Work Item List and Create Endpoint"""

    serializer_class = IntakeIssueSerializer

    model = Intake
    permission_classes = [ProjectLitePermission]
    use_read_replica = True

    def get_queryset(self):
        intake = Intake.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
        ).first()

        project = Project.objects.get(
            workspace__slug=self.kwargs.get("slug"), pk=self.kwargs.get("project_id")
        )

        if intake is None and not project.intake_view:
            return IntakeIssue.objects.none()

        return (
            IntakeIssue.objects.filter(
                Q(snoozed_till__gte=timezone.now()) | Q(snoozed_till__isnull=True),
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
                intake_id=intake.id,
            )
            .select_related("issue", "workspace", "project")
            .order_by(self.kwargs.get("order_by", "-created_at"))
        )

    @intake_docs(
        operation_id="get_intake_work_items_list",
        summary="List intake work items",
        description="Retrieve all work items in the project's intake queue. Returns paginated results when listing all intake work items.",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                IntakeIssueSerializer,
                "PaginatedIntakeIssueResponse",
                "Paginated list of intake work items",
                "Paginated Intake Work Items",
            ),
        },
    )
    def get(self, request, slug, project_id):
        """List intake work items

        Retrieve all work items in the project's intake queue.
        Returns paginated results when listing all intake work items.
        """
        issue_queryset = self.get_queryset()
        return self.paginate(
            request=request,
            queryset=(issue_queryset),
            on_results=lambda intake_issues: IntakeIssueSerializer(
                intake_issues, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    @intake_docs(
        operation_id="create_intake_work_item",
        summary="Create intake work item",
        description="Submit a new work item to the project's intake queue for review and triage. Automatically creates the work item with default triage state and tracks activity.",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request=IntakeIssueCreateSerializer,
            examples=[INTAKE_ISSUE_CREATE_EXAMPLE],
        ),
        responses={
            201: OpenApiResponse(
                description="Intake work item created",
                response=IntakeIssueSerializer,
                examples=[INTAKE_ISSUE_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
        },
    )
    def post(self, request, slug, project_id):
        """Create intake work item

        Submit a new work item to the project's intake queue for review and triage.
        Automatically creates the work item with default triage state and tracks activity.
        """
        if not request.data.get("issue", {}).get("name", False):
            return Response(
                {"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        intake = Intake.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).first()

        project = Project.objects.get(workspace__slug=slug, pk=project_id)

        # Intake view
        if intake is None and not project.intake_view:
            return Response(
                {
                    "error": "Intake is not enabled for this project enable it through the project's api"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for valid priority
        if request.data.get("issue", {}).get("priority", "none") not in [
            "low",
            "medium",
            "high",
            "urgent",
            "none",
        ]:
            return Response(
                {"error": "Invalid priority"}, status=status.HTTP_400_BAD_REQUEST
            )

        # create an issue
        issue = Issue.objects.create(
            name=request.data.get("issue", {}).get("name"),
            description=request.data.get("issue", {}).get("description", {}),
            description_html=request.data.get("issue", {}).get(
                "description_html", "<p></p>"
            ),
            priority=request.data.get("issue", {}).get("priority", "none"),
            project_id=project_id,
        )

        # create an intake issue
        intake_issue = IntakeIssue.objects.create(
            intake_id=intake.id,
            project_id=project_id,
            issue=issue,
            source=SourceType.IN_APP,
        )
        # Create an Issue Activity
        issue_activity.delay(
            type="issue.activity.created",
            requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            issue_id=str(issue.id),
            project_id=str(project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            intake=str(intake_issue.id),
        )

        serializer = IntakeIssueSerializer(intake_issue)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class IntakeIssueDetailAPIEndpoint(BaseAPIView):
    """Intake Issue API Endpoint"""

    permission_classes = [ProjectLitePermission]

    serializer_class = IntakeIssueSerializer
    model = IntakeIssue
    use_read_replica = True

    filterset_fields = ["status"]

    def get_queryset(self):
        intake = Intake.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
        ).first()

        project = Project.objects.get(
            workspace__slug=self.kwargs.get("slug"), pk=self.kwargs.get("project_id")
        )

        if intake is None and not project.intake_view:
            return IntakeIssue.objects.none()

        return (
            IntakeIssue.objects.filter(
                Q(snoozed_till__gte=timezone.now()) | Q(snoozed_till__isnull=True),
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
                intake_id=intake.id,
            )
            .select_related("issue", "workspace", "project")
            .order_by(self.kwargs.get("order_by", "-created_at"))
        )

    @intake_docs(
        operation_id="retrieve_intake_work_item",
        summary="Retrieve intake work item",
        description="Retrieve details of a specific intake work item.",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
            ISSUE_ID_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Intake work item",
                response=IntakeIssueSerializer,
                examples=[INTAKE_ISSUE_EXAMPLE],
            ),
        },
    )
    def get(self, request, slug, project_id, issue_id):
        """Retrieve intake work item

        Retrieve details of a specific intake work item.
        """
        intake_issue_queryset = self.get_queryset().get(issue_id=issue_id)
        intake_issue_data = IntakeIssueSerializer(
            intake_issue_queryset, fields=self.fields, expand=self.expand
        ).data
        return Response(intake_issue_data, status=status.HTTP_200_OK)

    @intake_docs(
        operation_id="update_intake_work_item",
        summary="Update intake work item",
        description="Modify an existing intake work item's properties or status for triage processing. Supports status changes like accept, reject, or mark as duplicate.",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
            ISSUE_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request=IntakeIssueUpdateSerializer,
            examples=[INTAKE_ISSUE_UPDATE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Intake work item updated",
                response=IntakeIssueSerializer,
                examples=[INTAKE_ISSUE_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
        },
    )
    def patch(self, request, slug, project_id, issue_id):
        """Update intake work item

        Modify an existing intake work item's properties or status for triage processing.
        Supports status changes like accept, reject, or mark as duplicate.
        """
        intake = Intake.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).first()

        project = Project.objects.get(workspace__slug=slug, pk=project_id)

        # Intake view
        if intake is None and not project.intake_view:
            return Response(
                {
                    "error": "Intake is not enabled for this project enable it through the project's api"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the intake issue
        intake_issue = IntakeIssue.objects.get(
            issue_id=issue_id,
            workspace__slug=slug,
            project_id=project_id,
            intake_id=intake.id,
        )

        # Get the project member
        project_member = ProjectMember.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            member=request.user,
            is_active=True,
        )

        # Only project members admins and created_by users can access this endpoint
        if project_member.role <= 5 and str(intake_issue.created_by_id) != str(
            request.user.id
        ):
            return Response(
                {"error": "You cannot edit intake work items"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get issue data
        issue_data = request.data.pop("issue", False)

        if bool(issue_data):
            issue = Issue.objects.annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=Q(
                            ~Q(labels__id__isnull=True)
                            & Q(label_issue__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "assignees__id",
                        distinct=True,
                        filter=Q(
                            ~Q(assignees__id__isnull=True)
                            & Q(assignees__member_project__is_active=True)
                            & Q(issue_assignee__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            ).get(pk=issue_id, workspace__slug=slug, project_id=project_id)
            # Only allow guests to edit name and description
            if project_member.role <= 5:
                issue_data = {
                    "name": issue_data.get("name", issue.name),
                    "description_html": issue_data.get(
                        "description_html", issue.description_html
                    ),
                    "description": issue_data.get("description", issue.description),
                }

            issue_serializer = IssueSerializer(issue, data=issue_data, partial=True)

            if issue_serializer.is_valid():
                current_instance = issue
                # Log all the updates
                requested_data = json.dumps(issue_data, cls=DjangoJSONEncoder)
                if issue is not None:
                    issue_activity.delay(
                        type="issue.activity.updated",
                        requested_data=requested_data,
                        actor_id=str(request.user.id),
                        issue_id=str(issue_id),
                        project_id=str(project_id),
                        current_instance=json.dumps(
                            IssueSerializer(current_instance).data,
                            cls=DjangoJSONEncoder,
                        ),
                        epoch=int(timezone.now().timestamp()),
                        intake=(intake_issue.id),
                    )
                issue_serializer.save()
            else:
                return Response(
                    issue_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                )

        # Only project admins and members can edit intake issue attributes
        if project_member.role > 15:
            serializer = IntakeIssueUpdateSerializer(
                intake_issue, data=request.data, partial=True
            )
            current_instance = json.dumps(
                IntakeIssueSerializer(intake_issue).data, cls=DjangoJSONEncoder
            )

            if serializer.is_valid():
                serializer.save()
                # Update the issue state if the issue is rejected or marked as duplicate
                if serializer.data["status"] in [-1, 2]:
                    issue = Issue.objects.get(
                        pk=issue_id, workspace__slug=slug, project_id=project_id
                    )
                    state = State.objects.filter(
                        group="cancelled", workspace__slug=slug, project_id=project_id
                    ).first()
                    if state is not None:
                        issue.state = state
                        issue.save()

                # Update the issue state if it is accepted
                if serializer.data["status"] in [1]:
                    issue = Issue.objects.get(
                        pk=issue_id, workspace__slug=slug, project_id=project_id
                    )

                    # Update the issue state only if it is in triage state
                    if issue.state.is_triage:
                        # Move to default state
                        state = State.objects.filter(
                            workspace__slug=slug, project_id=project_id, default=True
                        ).first()
                        if state is not None:
                            issue.state = state
                            issue.save()

                # create a activity for status change
                issue_activity.delay(
                    type="intake.activity.created",
                    requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                    actor_id=str(request.user.id),
                    issue_id=str(issue_id),
                    project_id=str(project_id),
                    current_instance=current_instance,
                    epoch=int(timezone.now().timestamp()),
                    notification=False,
                    origin=base_host(request=request, is_app=True),
                    intake=str(intake_issue.id),
                )
                serializer = IntakeIssueSerializer(intake_issue)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(
                IntakeIssueSerializer(intake_issue).data, status=status.HTTP_200_OK
            )

    @intake_docs(
        operation_id="delete_intake_work_item",
        summary="Delete intake work item",
        description="Permanently remove an intake work item from the triage queue. Also deletes the underlying work item if it hasn't been accepted yet.",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
            ISSUE_ID_PARAMETER,
        ],
        responses={
            204: DELETED_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, issue_id):
        """Delete intake work item

        Permanently remove an intake work item from the triage queue.
        Also deletes the underlying work item if it hasn't been accepted yet.
        """
        intake = Intake.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).first()

        project = Project.objects.get(workspace__slug=slug, pk=project_id)

        # Intake view
        if intake is None and not project.intake_view:
            return Response(
                {
                    "error": "Intake is not enabled for this project enable it through the project's api"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the intake issue
        intake_issue = IntakeIssue.objects.get(
            issue_id=issue_id,
            workspace__slug=slug,
            project_id=project_id,
            intake_id=intake.id,
        )

        # Check the issue status
        if intake_issue.status in [-2, -1, 0, 2]:
            # Delete the issue also
            issue = Issue.objects.filter(
                workspace__slug=slug, project_id=project_id, pk=issue_id
            ).first()
            if issue.created_by_id != request.user.id and (
                not ProjectMember.objects.filter(
                    workspace__slug=slug,
                    member=request.user,
                    role=20,
                    project_id=project_id,
                    is_active=True,
                ).exists()
            ):
                return Response(
                    {"error": "Only admin or creator can delete the work item"},
                    status=status.HTTP_403_FORBIDDEN,
                )
            issue.delete()

        intake_issue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
