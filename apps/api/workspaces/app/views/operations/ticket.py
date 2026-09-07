# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Operations tickets: requests that have not yet earned a Workspaces issue.

PROJECT.md's rule is that not every request should immediately become
development work. A ticket carries the request through PM review and, if it
survives, is converted -- once -- into a real issue. Operations keeps tracking
the request; engineering tracks the implementation; ``converted_issue`` is the
only link between them.
"""

# Python imports
import json

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from workspaces.app.permissions import ROLE, allow_permission
from workspaces.app.serializers import (
    OperationsTicketActivitySerializer,
    OperationsTicketCommentSerializer,
    OperationsTicketSerializer,
)
from workspaces.app.views.base import BaseAPIView, BaseViewSet
from workspaces.bgtasks.issue_activities_task import issue_activity
from workspaces.db.models import (
    Issue,
    IssueLabel,
    Label,
    Module,
    ModuleIssue,
    OperationsTicket,
    OperationsTicketActivity,
    OperationsTicketComment,
    OperationsTicketStatus,
    Project,
    ProjectMember,
    State,
    Workspace,
)
from workspaces.utils.host import base_host

# The lifecycle from PROJECT.md, as a graph. Anything not listed is refused --
# a request cannot jump from New to Converted without somebody reviewing it,
# and a converted ticket is finished as far as engineering is concerned.
ALLOWED_TRANSITIONS = {
    OperationsTicketStatus.NEW: [
        OperationsTicketStatus.PM_REVIEW,
        OperationsTicketStatus.NEED_INFO,
        OperationsTicketStatus.REJECTED,
    ],
    OperationsTicketStatus.PM_REVIEW: [
        OperationsTicketStatus.NEED_INFO,
        OperationsTicketStatus.APPROVED,
        OperationsTicketStatus.REJECTED,
    ],
    OperationsTicketStatus.NEED_INFO: [
        OperationsTicketStatus.PM_REVIEW,
        OperationsTicketStatus.APPROVED,
        OperationsTicketStatus.REJECTED,
    ],
    # Approved tickets leave through /convert/, not through here.
    OperationsTicketStatus.APPROVED: [
        OperationsTicketStatus.NEED_INFO,
        OperationsTicketStatus.REJECTED,
    ],
    OperationsTicketStatus.CONVERTED: [OperationsTicketStatus.CLOSED],
    OperationsTicketStatus.REJECTED: [OperationsTicketStatus.CLOSED],
    OperationsTicketStatus.CLOSED: [],
}


def record_activity(ticket, actor_id, verb, field=None, old_value=None, new_value=None, comment=""):
    """Append one row to the ticket's audit trail."""
    return OperationsTicketActivity.objects.create(
        workspace_id=ticket.workspace_id,
        ticket=ticket,
        actor_id=actor_id,
        verb=verb,
        field=field,
        old_value=None if old_value is None else str(old_value),
        new_value=None if new_value is None else str(new_value),
        comment=comment,
    )


class OperationsTicketViewSet(BaseViewSet):
    """CRUD for operations tickets. Status moves through the transition route."""

    serializer_class = OperationsTicketSerializer
    model = OperationsTicket
    search_fields = ["name", "description_stripped"]

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "project", "module", "requested_by", "assignee", "converted_issue")
        )

    def apply_filters(self, request, queryset):
        for param, field in (
            ("status", "status__in"),
            ("source", "source__in"),
            ("priority", "priority__in"),
        ):
            raw = request.query_params.get(param)
            if raw:
                queryset = queryset.filter(**{field: [v for v in raw.split(",") if v]})

        for param, field in (("assignee_id", "assignee_id"), ("project_id", "project_id")):
            value = request.query_params.get(param)
            if value:
                queryset = queryset.filter(**{field: value})

        query = request.query_params.get("query")
        if query:
            queryset = queryset.filter(Q(name__icontains=query) | Q(description_stripped__icontains=query))

        # The default view is work still on somebody's plate: a list that opens
        # on six months of closed requests is a list nobody scrolls.
        if request.query_params.get("open") == "true":
            queryset = queryset.exclude(
                status__in=[
                    OperationsTicketStatus.CONVERTED,
                    OperationsTicketStatus.REJECTED,
                    OperationsTicketStatus.CLOSED,
                ]
            )
        return queryset

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug):
        queryset = self.apply_filters(request, self.get_queryset())
        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda tickets: OperationsTicketSerializer(tickets, many=True).data,
            default_per_page=30,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = OperationsTicketSerializer(data=request.data, context={"workspace_id": workspace.id})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # `requested_by` defaults to whoever filed it. An explicit value is
        # honoured so Operations can file on a customer's behalf.
        requested_by_id = request.data.get("requested_by") or request.user.id
        ticket = serializer.save(workspace_id=workspace.id, requested_by_id=requested_by_id)
        record_activity(ticket, request.user.id, "created")
        return Response(OperationsTicketSerializer(ticket).data, status=status.HTTP_201_CREATED)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def retrieve(self, request, slug, pk):
        return Response(OperationsTicketSerializer(self.get_queryset().get(pk=pk)).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        ticket = self.get_queryset().get(pk=pk)
        # Once a ticket has become an issue the issue is the live record.
        # Editing the request's title afterwards makes the audit trail lie.
        if ticket.status == OperationsTicketStatus.CONVERTED:
            return Response(
                {"error": "A converted ticket can no longer be edited.", "code": "already_converted"},
                status=status.HTTP_409_CONFLICT,
            )

        tracked = {field: getattr(ticket, field) for field in ("name", "priority", "source", "assignee_id")}
        serializer = OperationsTicketSerializer(
            ticket, data=request.data, partial=True, context={"workspace_id": ticket.workspace_id}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        ticket = serializer.save()

        for field, old in tracked.items():
            new = getattr(ticket, field)
            if old != new:
                record_activity(ticket, request.user.id, "updated", field=field, old_value=old, new_value=new)

        return Response(OperationsTicketSerializer(ticket).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        ticket = self.get_queryset().get(pk=pk)
        ticket.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OperationsTicketTransitionEndpoint(BaseAPIView):
    """Move a ticket through its lifecycle, leaving an audit row behind."""

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, pk):
        ticket = OperationsTicket.objects.filter(workspace__slug=slug, pk=pk).first()
        if not ticket:
            return Response({"error": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND)

        target = request.data.get("status")
        if target not in OperationsTicketStatus.values:
            return Response({"error": "Unknown status."}, status=status.HTTP_400_BAD_REQUEST)

        if target not in ALLOWED_TRANSITIONS.get(ticket.status, []):
            return Response(
                {
                    "error": f"A ticket cannot move from {ticket.get_status_display()} to that status.",
                    "code": "invalid_transition",
                    "allowed": ALLOWED_TRANSITIONS.get(ticket.status, []),
                },
                status=status.HTTP_409_CONFLICT,
            )

        previous = ticket.status
        ticket.status = target
        now = timezone.now()
        if target == OperationsTicketStatus.PM_REVIEW and not ticket.reviewed_at:
            ticket.reviewed_at = now
        if target in (OperationsTicketStatus.CLOSED, OperationsTicketStatus.REJECTED):
            ticket.closed_at = now
        ticket.save()

        record_activity(
            ticket,
            request.user.id,
            "transitioned",
            field="status",
            old_value=previous,
            new_value=target,
            comment=str(request.data.get("comment") or ""),
        )
        return Response(OperationsTicketSerializer(ticket).data, status=status.HTTP_200_OK)


class OperationsTicketConvertEndpoint(BaseAPIView):
    """
    Turn an approved ticket into a Workspaces issue.

    Copies across what PROJECT.md asks for -- description, priority, reporter --
    labels the issue with its source, optionally files it under a module, and
    links the two records. Runs in one transaction: a ticket marked converted
    with no issue behind it would be unrecoverable through the UI.
    """

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, pk):
        ticket = OperationsTicket.objects.filter(workspace__slug=slug, pk=pk).first()
        if not ticket:
            return Response({"error": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND)

        if ticket.converted_issue_id:
            return Response(
                {"error": "This ticket has already been converted.", "code": "already_converted"},
                status=status.HTTP_409_CONFLICT,
            )

        if ticket.status != OperationsTicketStatus.APPROVED:
            return Response(
                {"error": "Only an approved ticket can be converted.", "code": "not_approved"},
                status=status.HTTP_409_CONFLICT,
            )

        project_id = request.data.get("project_id") or ticket.project_id
        if not project_id:
            return Response(
                {"error": "Choose a project to convert into.", "code": "project_required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        project = Project.objects.filter(workspace__slug=slug, pk=project_id).first()
        if not project:
            return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

        # The converter has to be able to file in the target project; workspace
        # membership alone is not enough to create work in somebody's project.
        if not ProjectMember.objects.filter(project=project, member=request.user, is_active=True).exists():
            return Response(
                {"error": "You are not a member of that project."},
                status=status.HTTP_403_FORBIDDEN,
            )

        default_state = (
            State.objects.filter(project=project, default=True).first() or State.objects.filter(project=project).first()
        )

        with transaction.atomic():
            issue = Issue.objects.create(
                project=project,
                name=ticket.name[:255],
                description_json=ticket.description_json or {},
                description_html=ticket.description_html or "<p></p>",
                priority=ticket.priority,
                state=default_state,
                type_id=request.data.get("issue_type_id") or None,
                target_date=ticket.target_date,
                # The reporter travels with the request. Only when they are a
                # member of the project -- the Workspaces activity feed resolves
                # created_by against project membership.
                created_by_id=(
                    ticket.requested_by_id
                    if ticket.requested_by_id
                    and ProjectMember.objects.filter(
                        project=project, member_id=ticket.requested_by_id, is_active=True
                    ).exists()
                    else request.user.id
                ),
            )

            module_id = request.data.get("module_id") or ticket.module_id
            if module_id and Module.objects.filter(pk=module_id, project=project).exists():
                ModuleIssue.objects.create(project=project, module_id=module_id, issue=issue)

            # Carry the request's origin onto the issue so module-based
            # reporting can still tell where the work came from.
            source_label = Label.objects.filter(project=project, name__iexact=ticket.get_source_display()).first()
            if source_label:
                IssueLabel.objects.create(project=project, issue=issue, label=source_label)

            ticket.converted_issue = issue
            ticket.converted_at = timezone.now()
            ticket.status = OperationsTicketStatus.CONVERTED
            ticket.project = project
            if module_id:
                ticket.module_id = module_id
            ticket.save()

            record_activity(
                ticket,
                request.user.id,
                "converted",
                field="converted_issue",
                new_value=str(issue.id),
                comment=f"Converted to {project.identifier}-{issue.sequence_id}",
            )

        issue_activity.delay(
            type="issue.activity.created",
            requested_data=json.dumps({"name": issue.name}, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            issue_id=str(issue.id),
            project_id=str(project.id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=base_host(request=request, is_app=True),
        )

        return Response(
            {
                "ticket": OperationsTicketSerializer(ticket).data,
                "issue": {
                    "id": str(issue.id),
                    "name": issue.name,
                    "sequence_id": issue.sequence_id,
                    "project_id": str(project.id),
                    "project_identifier": project.identifier,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class OperationsTicketCommentViewSet(BaseViewSet):
    """The conversation on a ticket."""

    serializer_class = OperationsTicketCommentSerializer
    model = OperationsTicketComment

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"), ticket_id=self.kwargs.get("ticket_id"))
            .select_related("actor")
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug, ticket_id):
        return Response(
            OperationsTicketCommentSerializer(self.get_queryset(), many=True).data, status=status.HTTP_200_OK
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def create(self, request, slug, ticket_id):
        ticket = OperationsTicket.objects.filter(workspace__slug=slug, pk=ticket_id).first()
        if not ticket:
            return Response({"error": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = OperationsTicketCommentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        comment = serializer.save(workspace_id=ticket.workspace_id, ticket=ticket, actor=request.user)
        record_activity(ticket, request.user.id, "commented", comment=comment.comment_stripped or "")
        return Response(OperationsTicketCommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @allow_permission(allowed_roles=[], creator=True, model=OperationsTicketComment, level="WORKSPACE")
    def destroy(self, request, slug, ticket_id, pk):
        self.get_queryset().get(pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OperationsTicketActivityEndpoint(BaseAPIView):
    """The audit trail for one ticket."""

    use_read_replica = True

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, ticket_id):
        activities = (
            OperationsTicketActivity.objects.filter(workspace__slug=slug, ticket_id=ticket_id)
            .select_related("actor")
            .order_by("created_at")
        )
        return Response(OperationsTicketActivitySerializer(activities, many=True).data, status=status.HTTP_200_OK)
