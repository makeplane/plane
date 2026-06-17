# Django imports
from django.db import transaction
from django.db.models import Q
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import Value, UUIDField
from django.db.models.functions import Coalesce

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseViewSet
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import (
    SupportTicket,
    Issue,
    IssueAssignee,
    State,
    Project,
)
from plane.app.serializers import SupportTicketSerializer, SupportTicketCreateSerializer
from plane.utils.html_processor import strip_tags


class SupportTicketViewSet(BaseViewSet):
    serializer_class = SupportTicketSerializer
    model = SupportTicket

    def get_queryset(self):
        return (
            SupportTicket.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
            )
            .select_related("issue", "issue__state", "project", "workspace")
            .annotate(
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "issue__assignees__id",
                        distinct=True,
                        filter=Q(
                            ~Q(issue__assignees__id__isnull=True)
                            & Q(issue__issue_assignee__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .order_by("-created_at")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def list(self, request, slug, project_id):
        queryset = self.get_queryset()
        serializer = SupportTicketSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        create_serializer = SupportTicketCreateSerializer(data=request.data)
        if not create_serializer.is_valid():
            return Response(create_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = create_serializer.validated_data
        project = Project.objects.get(pk=project_id)

        # Get the default state if not provided
        state_id = data.get("state_id")
        if not state_id:
            default_state = State.objects.filter(
                ~Q(is_triage=True),
                project_id=project_id,
                default=True,
            ).first()
            if not default_state:
                default_state = State.objects.filter(
                    ~Q(is_triage=True),
                    project_id=project_id,
                ).first()
            state_id = default_state.id if default_state else None

        with transaction.atomic():
            # Create the Issue
            issue = Issue(
                name=data["title"],
                description_html=data.get("description_html", "<p></p>"),
                description_stripped=strip_tags(data.get("description_html", "<p></p>")),
                priority=data.get("priority", "none"),
                state_id=state_id,
                project_id=project_id,
                workspace_id=project.workspace_id,
            )
            issue.save()

            # Add assignees if provided
            assignee_ids = data.get("assignee_ids", [])
            for assignee_id in assignee_ids:
                IssueAssignee.objects.create(
                    issue=issue,
                    assignee_id=assignee_id,
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                )

            # Create the SupportTicket
            ticket = SupportTicket(
                issue=issue,
                source=data.get("source", "MANUAL"),
                source_email=data.get("source_email"),
                email_subject=data.get("email_subject"),
                email_body_html=data.get("email_body_html"),
                project_id=project_id,
                workspace_id=project.workspace_id,
                start_date=data.get("start_date"),
                due_date=data.get("due_date"),
            )
            ticket.save()

        # Re-fetch with annotations
        ticket = self.get_queryset().get(pk=ticket.id)
        serializer = SupportTicketSerializer(ticket)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def retrieve(self, request, slug, project_id, pk):
        ticket = self.get_queryset().get(pk=pk)
        serializer = SupportTicketSerializer(ticket)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def partial_update(self, request, slug, project_id, pk):
        ticket = SupportTicket.objects.select_related("issue").get(
            pk=pk,
            workspace__slug=slug,
            project_id=project_id,
        )
        issue = ticket.issue

        # Update issue fields if provided
        updated = False
        if "title" in request.data:
            issue.name = request.data["title"]
            updated = True
        if "description_html" in request.data:
            issue.description_html = request.data["description_html"]
            issue.description_stripped = strip_tags(request.data["description_html"])
            updated = True
        if "priority" in request.data:
            issue.priority = request.data["priority"]
            updated = True
        if "state_id" in request.data:
            issue.state_id = request.data["state_id"]
            updated = True

        if updated:
            issue.save()

        # Update assignees if provided
        if "assignee_ids" in request.data:
            assignee_ids = request.data["assignee_ids"]
            # Remove existing assignees
            IssueAssignee.objects.filter(issue=issue).delete()
            # Add new ones
            project = Project.objects.get(pk=project_id)
            for assignee_id in assignee_ids:
                IssueAssignee.objects.create(
                    issue=issue,
                    assignee_id=assignee_id,
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                )

        # Re-fetch with annotations
        ticket = self.get_queryset().get(pk=pk)
        serializer = SupportTicketSerializer(ticket)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, pk):
        ticket = SupportTicket.objects.select_related("issue").get(
            pk=pk,
            workspace__slug=slug,
            project_id=project_id,
        )
        issue = ticket.issue
        ticket.delete()
        issue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
