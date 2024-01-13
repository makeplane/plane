# Python imports
import json

# Django improts
from django.utils import timezone
from django.db.models import Q
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.app.permissions import ProjectLitePermission
from plane.api.serializers import InboxIssueSerializer, IssueSerializer
from plane.db.models import (
    InboxIssue,
    Issue,
    State,
    ProjectMember,
    Project,
    Inbox,
)
from plane.bgtasks.issue_activites_task import issue_activity


class InboxIssueAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions related to inbox issues.

    """

    permission_classes = [
        ProjectLitePermission,
    ]

    serializer_class = InboxIssueSerializer
    model = InboxIssue

    filterset_fields = [
        "status",
    ]

    def get_queryset(self):
        inbox = Inbox.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            project_id=self.kwargs.get("project_id"),
        ).first()

        project = Project.objects.get(
            workspace__slug=self.kwargs.get("slug"),
            pk=self.kwargs.get("project_id"),
        )

        if inbox is None and not project.inbox_view:
            return InboxIssue.objects.none()

        return (
            InboxIssue.objects.filter(
                Q(snoozed_till__gte=timezone.now())
                | Q(snoozed_till__isnull=True),
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
                inbox_id=inbox.id,
            )
            .select_related("issue", "workspace", "project")
            .order_by(self.kwargs.get("order_by", "-created_at"))
        )

    def get(self, request, slug, project_id, issue_id=None):
        if issue_id:
            inbox_issue_queryset = self.get_queryset().get(issue_id=issue_id)
            inbox_issue_data = InboxIssueSerializer(
                inbox_issue_queryset,
                fields=self.fields,
                expand=self.expand,
            ).data
            return Response(
                inbox_issue_data,
                status=status.HTTP_200_OK,
            )
        issue_queryset = self.get_queryset()
        return self.paginate(
            request=request,
            queryset=(issue_queryset),
            on_results=lambda inbox_issues: InboxIssueSerializer(
                inbox_issues,
                many=True,
                fields=self.fields,
                expand=self.expand,
            ).data,
        )

    def post(self, request, slug, project_id):
        if not request.data.get("issue", {}).get("name", False):
            return Response(
                {"error": "Name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        inbox = Inbox.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).first()

        project = Project.objects.get(
            workspace__slug=slug,
            pk=project_id,
        )

        # Inbox view
        if inbox is None and not project.inbox_view:
            return Response(
                {
                    "error": "Inbox is not enabled for this project enable it through the project's api"
                },
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
        inbox_issue = InboxIssue.objects.create(
            inbox_id=inbox.id,
            project_id=project_id,
            issue=issue,
            source=request.data.get("source", "in-app"),
        )

        serializer = InboxIssueSerializer(inbox_issue)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, slug, project_id, issue_id):
        inbox = Inbox.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).first()

        project = Project.objects.get(
            workspace__slug=slug,
            pk=project_id,
        )

        # Inbox view
        if inbox is None and not project.inbox_view:
            return Response(
                {
                    "error": "Inbox is not enabled for this project enable it through the project's api"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the inbox issue
        inbox_issue = InboxIssue.objects.get(
            issue_id=issue_id,
            workspace__slug=slug,
            project_id=project_id,
            inbox_id=inbox.id,
        )

        # Get the project member
        project_member = ProjectMember.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            member=request.user,
            is_active=True,
        )

        # Only project members admins and created_by users can access this endpoint
        if project_member.role <= 10 and str(inbox_issue.created_by_id) != str(
            request.user.id
        ):
            return Response(
                {"error": "You cannot edit inbox issues"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get issue data
        issue_data = request.data.pop("issue", False)

        if bool(issue_data):
            issue = Issue.objects.get(
                pk=issue_id, workspace__slug=slug, project_id=project_id
            )
            # Only allow guests and viewers to edit name and description
            if project_member.role <= 10:
                # viewers and guests since only viewers and guests
                issue_data = {
                    "name": issue_data.get("name", issue.name),
                    "description_html": issue_data.get(
                        "description_html", issue.description_html
                    ),
                    "description": issue_data.get(
                        "description", issue.description
                    ),
                }

            issue_serializer = IssueSerializer(
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
                        issue_id=str(issue_id),
                        project_id=str(project_id),
                        current_instance=json.dumps(
                            IssueSerializer(current_instance).data,
                            cls=DjangoJSONEncoder,
                        ),
                        epoch=int(timezone.now().timestamp()),
                    )
                issue_serializer.save()
            else:
                return Response(
                    issue_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                )

        # Only project admins and members can edit inbox issue attributes
        if project_member.role > 10:
            serializer = InboxIssueSerializer(
                inbox_issue, data=request.data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                # Update the issue state if the issue is rejected or marked as duplicate
                if serializer.data["status"] in [-1, 2]:
                    issue = Issue.objects.get(
                        pk=issue_id,
                        workspace__slug=slug,
                        project_id=project_id,
                    )
                    state = State.objects.filter(
                        group="cancelled",
                        workspace__slug=slug,
                        project_id=project_id,
                    ).first()
                    if state is not None:
                        issue.state = state
                        issue.save()

                # Update the issue state if it is accepted
                if serializer.data["status"] in [1]:
                    issue = Issue.objects.get(
                        pk=issue_id,
                        workspace__slug=slug,
                        project_id=project_id,
                    )

                    # Update the issue state only if it is in triage state
                    if issue.state.name == "Triage":
                        # Move to default state
                        state = State.objects.filter(
                            workspace__slug=slug,
                            project_id=project_id,
                            default=True,
                        ).first()
                        if state is not None:
                            issue.state = state
                            issue.save()

                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )
        else:
            return Response(
                InboxIssueSerializer(inbox_issue).data,
                status=status.HTTP_200_OK,
            )

    def delete(self, request, slug, project_id, issue_id):
        inbox = Inbox.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).first()

        project = Project.objects.get(
            workspace__slug=slug,
            pk=project_id,
        )

        # Inbox view
        if inbox is None and not project.inbox_view:
            return Response(
                {
                    "error": "Inbox is not enabled for this project enable it through the project's api"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the inbox issue
        inbox_issue = InboxIssue.objects.get(
            issue_id=issue_id,
            workspace__slug=slug,
            project_id=project_id,
            inbox_id=inbox.id,
        )

        # Get the project member
        project_member = ProjectMember.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            member=request.user,
            is_active=True,
        )

        # Check the inbox issue created
        if project_member.role <= 10 and str(inbox_issue.created_by_id) != str(
            request.user.id
        ):
            return Response(
                {"error": "You cannot delete inbox issue"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check the issue status
        if inbox_issue.status in [-2, -1, 0, 2]:
            # Delete the issue also
            Issue.objects.filter(
                workspace__slug=slug, project_id=project_id, pk=issue_id
            ).delete()

        inbox_issue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
