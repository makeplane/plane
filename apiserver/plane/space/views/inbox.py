# Python imports
import json

# Django import
from django.utils import timezone
from django.db.models import Q, OuterRef, Func, F, Prefetch
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseViewSet
from plane.db.models import (
    InboxIssue,
    Issue,
    State,
    IssueLink,
    IssueAttachment,
    ProjectDeployBoard,
)
from plane.app.serializers import (
    IssueSerializer,
    InboxIssueSerializer,
    IssueCreateSerializer,
    IssueStateInboxSerializer,
)
from plane.utils.issue_filters import issue_filters
from plane.bgtasks.issue_activites_task import issue_activity


class InboxIssuePublicViewSet(BaseViewSet):
    serializer_class = InboxIssueSerializer
    model = InboxIssue

    filterset_fields = [
        "status",
    ]

    def get_queryset(self):
        project_deploy_board = ProjectDeployBoard.objects.get(
            workspace__slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
        )
        if project_deploy_board is not None:
            return self.filter_queryset(
                super()
                .get_queryset()
                .filter(
                    Q(snoozed_till__gte=timezone.now())
                    | Q(snoozed_till__isnull=True),
                    project_id=self.kwargs.get("project_id"),
                    workspace__slug=self.kwargs.get("slug"),
                    inbox_id=self.kwargs.get("inbox_id"),
                )
                .select_related("issue", "workspace", "project")
            )
        return InboxIssue.objects.none()

    def list(self, request, slug, project_id, inbox_id):
        project_deploy_board = ProjectDeployBoard.objects.get(
            workspace__slug=slug, project_id=project_id
        )
        if project_deploy_board.inbox is None:
            return Response(
                {"error": "Inbox is not enabled for this Project Board"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        filters = issue_filters(request.query_params, "GET")
        issues = (
            Issue.objects.filter(
                issue_inbox__inbox_id=inbox_id,
                workspace__slug=slug,
                project_id=project_id,
            )
            .filter(**filters)
            .annotate(bridge_id=F("issue_inbox__id"))
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels")
            .order_by("issue_inbox__snoozed_till", "issue_inbox__status")
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=IssueAttachment.objects.filter(
                    issue=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .prefetch_related(
                Prefetch(
                    "issue_inbox",
                    queryset=InboxIssue.objects.only(
                        "status", "duplicate_to", "snoozed_till", "source"
                    ),
                )
            )
        )
        issues_data = IssueStateInboxSerializer(issues, many=True).data
        return Response(
            issues_data,
            status=status.HTTP_200_OK,
        )

    def create(self, request, slug, project_id, inbox_id):
        project_deploy_board = ProjectDeployBoard.objects.get(
            workspace__slug=slug, project_id=project_id
        )
        if project_deploy_board.inbox is None:
            return Response(
                {"error": "Inbox is not enabled for this Project Board"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not request.data.get("issue", {}).get("name", False):
            return Response(
                {"error": "Name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for valid priority
        if not request.data.get("issue", {}).get("priority", "none") in [
            "low",
            "medium",
            "high",
            "urgent",
            "none",
        ]:
            return Response(
                {"error": "Invalid priority"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create or get state
        state, _ = State.objects.get_or_create(
            name="Triage",
            group="backlog",
            description="Default state for managing all Inbox Issues",
            project_id=project_id,
            color="#ff7700",
        )

        # create an issue
        issue = Issue.objects.create(
            name=request.data.get("issue", {}).get("name"),
            description=request.data.get("issue", {}).get("description", {}),
            description_html=request.data.get("issue", {}).get(
                "description_html", "<p></p>"
            ),
            priority=request.data.get("issue", {}).get("priority", "low"),
            project_id=project_id,
            state=state,
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
        )
        # create an inbox issue
        InboxIssue.objects.create(
            inbox_id=inbox_id,
            project_id=project_id,
            issue=issue,
            source=request.data.get("source", "in-app"),
        )

        serializer = IssueStateInboxSerializer(issue)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def partial_update(self, request, slug, project_id, inbox_id, pk):
        project_deploy_board = ProjectDeployBoard.objects.get(
            workspace__slug=slug, project_id=project_id
        )
        if project_deploy_board.inbox is None:
            return Response(
                {"error": "Inbox is not enabled for this Project Board"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        inbox_issue = InboxIssue.objects.get(
            pk=pk,
            workspace__slug=slug,
            project_id=project_id,
            inbox_id=inbox_id,
        )
        # Get the project member
        if str(inbox_issue.created_by_id) != str(request.user.id):
            return Response(
                {"error": "You cannot edit inbox issues"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get issue data
        issue_data = request.data.pop("issue", False)

        issue = Issue.objects.get(
            pk=inbox_issue.issue_id,
            workspace__slug=slug,
            project_id=project_id,
        )
        # viewers and guests since only viewers and guests
        issue_data = {
            "name": issue_data.get("name", issue.name),
            "description_html": issue_data.get(
                "description_html", issue.description_html
            ),
            "description": issue_data.get("description", issue.description),
        }

        issue_serializer = IssueCreateSerializer(
            issue, data=issue_data, partial=True
        )

        if issue_serializer.is_valid():
            current_instance = issue
            # Log all the updates
            requested_data = json.dumps(issue_data, cls=DjangoJSONEncoder)
            if issue is not None:
                issue_activity.delay(
                    type="issue.activity.updated",
                    requested_data=requested_data,
                    actor_id=str(request.user.id),
                    issue_id=str(issue.id),
                    project_id=str(project_id),
                    current_instance=json.dumps(
                        IssueSerializer(current_instance).data,
                        cls=DjangoJSONEncoder,
                    ),
                    epoch=int(timezone.now().timestamp()),
                )
            issue_serializer.save()
            return Response(issue_serializer.data, status=status.HTTP_200_OK)
        return Response(
            issue_serializer.errors, status=status.HTTP_400_BAD_REQUEST
        )

    def retrieve(self, request, slug, project_id, inbox_id, pk):
        project_deploy_board = ProjectDeployBoard.objects.get(
            workspace__slug=slug, project_id=project_id
        )
        if project_deploy_board.inbox is None:
            return Response(
                {"error": "Inbox is not enabled for this Project Board"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        inbox_issue = InboxIssue.objects.get(
            pk=pk,
            workspace__slug=slug,
            project_id=project_id,
            inbox_id=inbox_id,
        )
        issue = Issue.objects.get(
            pk=inbox_issue.issue_id,
            workspace__slug=slug,
            project_id=project_id,
        )
        serializer = IssueStateInboxSerializer(issue)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, slug, project_id, inbox_id, pk):
        project_deploy_board = ProjectDeployBoard.objects.get(
            workspace__slug=slug, project_id=project_id
        )
        if project_deploy_board.inbox is None:
            return Response(
                {"error": "Inbox is not enabled for this Project Board"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        inbox_issue = InboxIssue.objects.get(
            pk=pk,
            workspace__slug=slug,
            project_id=project_id,
            inbox_id=inbox_id,
        )

        if str(inbox_issue.created_by_id) != str(request.user.id):
            return Response(
                {"error": "You cannot delete inbox issue"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        inbox_issue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
