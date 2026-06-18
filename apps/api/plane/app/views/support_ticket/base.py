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
    IssueActivity,
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
            .select_related(
                "issue", "issue__state", "project", "workspace",
                "reporter_user",
            )
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

        # Resolve reporter_user and reporter_email
        reporter_user_id = data.get("reporter_user_id")
        reporter_email = data.get("reporter_email")
        
        if reporter_email:
            from plane.utils.reporter_utils import normalize_reporter_email
            local_part, err = normalize_reporter_email(reporter_email)
            if err:
                return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)
            reporter_email = local_part
            reporter_user_id = None
        elif reporter_user_id:
            reporter_email = None
        elif reporter_user_id is None and "reporter_user_id" not in request.data and "reporter_email" not in request.data:
            # default to request.user if not provided
            reporter_user_id = request.user.id

        with transaction.atomic():
            # Create the Issue (with reporter auto-set)
            issue = Issue(
                name=data["title"],
                description_html=data.get("description_html", "<p></p>"),
                description_stripped=strip_tags(data.get("description_html", "<p></p>")),
                priority=data.get("priority", "none"),
                state_id=state_id,
                project_id=project_id,
                workspace_id=project.workspace_id,
                reporter_id=reporter_user_id,
                reporter_email=reporter_email,
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
                reporter_user_id=reporter_user_id,
                reporter_email=reporter_email,
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
        ticket = SupportTicket.objects.select_related("issue", "reporter_user").get(
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

        # Update reporter on issue and ticket if provided
        reporter_updated = False
        
        # Check if reporter_email is provided in payload
        if "reporter_email" in request.data:
            from plane.utils.reporter_utils import normalize_reporter_email
            local_part, err = normalize_reporter_email(request.data["reporter_email"])
            if err:
                return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)
                
            old_reporter = issue.reporter
            issue.reporter_id = None
            issue.reporter_email = local_part
            ticket.reporter_user_id = None
            ticket.reporter_email = local_part
            reporter_updated = True
            
        elif "reporter_user_id" in request.data:
            old_reporter = issue.reporter
            new_id = request.data["reporter_user_id"]
            issue.reporter_id = new_id
            issue.reporter_email = None
            ticket.reporter_user_id = new_id
            ticket.reporter_email = None
            reporter_updated = True

        if reporter_updated:
            # Log reporter activity
            _log_reporter_activity(
                issue=issue,
                old_reporter=old_reporter,
                new_reporter_id=issue.reporter_id,
                actor=request.user,
                project_id=project_id,
            )
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

        if reporter_updated:
            ticket.save()

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


def _get_reporter_display(ticket):
    """Helper to get reporter display name from a ticket."""
    if ticket.reporter_user:
        return ticket.reporter_user.display_name
    elif ticket.reporter_email:
        return ticket.reporter_email
    return None


def _log_reporter_activity(issue, old_reporter, new_reporter_id, actor, project_id):
    """Log an IssueActivity entry when the reporter changes."""
    from plane.db.models import User

    old_name = old_reporter.display_name if old_reporter else None
    new_name = None
    if new_reporter_id:
        try:
            new_user = User.objects.get(pk=new_reporter_id)
            new_name = new_user.display_name
        except User.DoesNotExist:
            new_name = str(new_reporter_id)

    IssueActivity.objects.create(
        issue=issue,
        project_id=project_id,
        workspace_id=issue.workspace_id,
        actor=actor,
        field="reporter",
        verb="updated",
        old_value=old_name,
        new_value=new_name,
        old_identifier=old_reporter.id if old_reporter else None,
        new_identifier=new_reporter_id,
    )
