# Python imports
import json

# Django import
from django.utils import timezone
from django.db.models import Q, Count, OuterRef, Func, F, Prefetch
from django.core.serializers.json import DjangoJSONEncoder
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import Value, UUIDField
from django.db.models.functions import Coalesce

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from ..base import BaseViewSet
from plane.app.permissions import ProjectBasePermission, ProjectLitePermission
from plane.db.models import (
    Inbox,
    InboxIssue,
    Issue,
    State,
    IssueLink,
    IssueAttachment,
    Project,
    ProjectMember,
)
from plane.app.serializers import (
    IssueCreateSerializer,
    IssueSerializer,
    InboxSerializer,
    InboxIssueSerializer,
    InboxIssueDetailSerializer,
)
from plane.utils.issue_filters import issue_filters
from plane.bgtasks.issue_activites_task import issue_activity


class InboxViewSet(BaseViewSet):
    permission_classes = [
        ProjectBasePermission,
    ]

    serializer_class = InboxSerializer
    model = Inbox

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
            )
            .annotate(
                pending_issue_count=Count(
                    "issue_inbox",
                    filter=Q(issue_inbox__status=-2),
                )
            )
            .select_related("workspace", "project")
        )

    def list(self, request, slug, project_id):
        inbox = self.get_queryset().first()
        return Response(
            InboxSerializer(inbox).data,
            status=status.HTTP_200_OK,
        )

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))

    def destroy(self, request, slug, project_id, pk):
        inbox = Inbox.objects.filter(
            workspace__slug=slug, project_id=project_id, pk=pk
        ).first()
        # Handle default inbox delete
        if inbox.is_default:
            return Response(
                {"error": "You cannot delete the default inbox"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        inbox.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InboxIssueViewSet(BaseViewSet):
    permission_classes = [
        ProjectLitePermission,
    ]

    serializer_class = InboxIssueSerializer
    model = InboxIssue

    filterset_fields = [
        "status",
    ]

    def get_queryset(self):
        return (
            Issue.objects.filter(
                project_id=self.kwargs.get("project_id"),
                workspace__slug=self.kwargs.get("slug"),
            )
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels", "issue_module__module")
            .prefetch_related(
                Prefetch(
                    "issue_inbox",
                    queryset=InboxIssue.objects.only(
                        "status", "duplicate_to", "snoozed_till", "source"
                    ),
                )
            )
            .annotate(cycle_id=F("issue_cycle__cycle_id"))
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
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=~Q(labels__id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "assignees__id",
                        distinct=True,
                        filter=~Q(assignees__id__isnull=True)
                        & Q(assignees__member_project__is_active=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                module_ids=Coalesce(
                    ArrayAgg(
                        "issue_module__module_id",
                        distinct=True,
                        filter=~Q(issue_module__module_id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
        ).distinct()

    def list(self, request, slug, project_id):
        inbox_id = Inbox.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).first()
        filters = issue_filters(request.GET, "GET", "issue__")
        inbox_issue = (
            InboxIssue.objects.filter(
                inbox_id=inbox_id.id, project_id=project_id, **filters
            )
            .select_related("issue")
            .prefetch_related(
                "issue__labels",
            )
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "issue__labels__id",
                        distinct=True,
                        filter=~Q(issue__labels__id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                )
            )
        ).order_by(request.GET.get("order_by", "-issue__created_at"))
        # inbox status filter
        inbox_status = [
            item
            for item in request.GET.get("status", "-2").split(",")
            if item != "null"
        ]
        if inbox_status:
            inbox_issue = inbox_issue.filter(status__in=inbox_status)

        return self.paginate(
            request=request,
            queryset=(inbox_issue),
            on_results=lambda inbox_issues: InboxIssueSerializer(
                inbox_issues,
                many=True,
            ).data,
        )

    def create(self, request, slug, project_id):
        if not request.data.get("issue", {}).get("name", False):
            return Response(
                {"error": "Name is required"},
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
                {"error": "Invalid priority"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create or get state
        state, _ = State.objects.get_or_create(
            name="Triage",
            group="triage",
            description="Default state for managing all Inbox Issues",
            project_id=project_id,
            color="#ff7700",
            is_triage=True,
        )

        # create an issue
        project = Project.objects.get(pk=project_id)
        serializer = IssueCreateSerializer(
            data=request.data.get("issue"),
            context={
                "project_id": project_id,
                "workspace_id": project.workspace_id,
                "default_assignee_id": project.default_assignee_id,
            },
        )
        if serializer.is_valid():
            serializer.save()
            inbox_id = Inbox.objects.filter(
                workspace__slug=slug, project_id=project_id
            ).first()
            # create an inbox issue
            inbox_issue = InboxIssue.objects.create(
                inbox_id=inbox_id.id,
                project_id=project_id,
                issue_id=serializer.data["id"],
                source=request.data.get("source", "in-app"),
            )
            # Create an Issue Activity
            issue_activity.delay(
                type="issue.activity.created",
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                issue_id=str(serializer.data["id"]),
                project_id=str(project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
                inbox=str(inbox_issue.id),
            )
            inbox_issue = (
                InboxIssue.objects.select_related("issue")
                .prefetch_related(
                    "issue__labels",
                    "issue__assignees",
                )
                .annotate(
                    label_ids=Coalesce(
                        ArrayAgg(
                            "issue__labels__id",
                            distinct=True,
                            filter=~Q(issue__labels__id__isnull=True),
                        ),
                        Value([], output_field=ArrayField(UUIDField())),
                    ),
                    assignee_ids=Coalesce(
                        ArrayAgg(
                            "issue__assignees__id",
                            distinct=True,
                            filter=~Q(issue__assignees__id__isnull=True),
                        ),
                        Value([], output_field=ArrayField(UUIDField())),
                    ),
                )
                .get(
                    inbox_id=inbox_id.id,
                    issue_id=serializer.data["id"],
                    project_id=project_id,
                )
            )
            serializer = InboxIssueDetailSerializer(inbox_issue)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

    def partial_update(self, request, slug, project_id, issue_id):
        inbox_id = Inbox.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).first()
        inbox_issue = InboxIssue.objects.get(
            issue_id=issue_id,
            workspace__slug=slug,
            project_id=project_id,
            inbox_id=inbox_id,
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
            issue = Issue.objects.annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=~Q(labels__id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "assignees__id",
                        distinct=True,
                        filter=~Q(assignees__id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            ).get(
                pk=inbox_issue.issue_id,
                workspace__slug=slug,
                project_id=project_id,
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
                        notification=True,
                        origin=request.META.get("HTTP_ORIGIN"),
                        inbox=str(inbox_issue.id),
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
            current_instance = json.dumps(
                InboxIssueSerializer(inbox_issue).data, cls=DjangoJSONEncoder
            )
            if serializer.is_valid():
                serializer.save()
                # Update the issue state if the issue is rejected or marked as duplicate
                if serializer.data["status"] in [-1, 2]:
                    issue = Issue.objects.get(
                        pk=inbox_issue.issue_id,
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
                        pk=inbox_issue.issue_id,
                        workspace__slug=slug,
                        project_id=project_id,
                    )

                    # Update the issue state only if it is in triage state
                    if issue.state.is_triage:
                        # Move to default state
                        state = State.objects.filter(
                            workspace__slug=slug,
                            project_id=project_id,
                            default=True,
                        ).first()
                        if state is not None:
                            issue.state = state
                            issue.save()
                # create a activity for status change
                issue_activity.delay(
                    type="inbox.activity.created",
                    requested_data=json.dumps(
                        request.data, cls=DjangoJSONEncoder
                    ),
                    actor_id=str(request.user.id),
                    issue_id=str(issue_id),
                    project_id=str(project_id),
                    current_instance=current_instance,
                    epoch=int(timezone.now().timestamp()),
                    notification=False,
                    origin=request.META.get("HTTP_ORIGIN"),
                    inbox=(inbox_issue.id),
                )

                inbox_issue = (
                    InboxIssue.objects.select_related("issue")
                    .prefetch_related(
                        "issue__labels",
                        "issue__assignees",
                    )
                    .annotate(
                        label_ids=Coalesce(
                            ArrayAgg(
                                "issue__labels__id",
                                distinct=True,
                                filter=~Q(issue__labels__id__isnull=True),
                            ),
                            Value([], output_field=ArrayField(UUIDField())),
                        ),
                        assignee_ids=Coalesce(
                            ArrayAgg(
                                "issue__assignees__id",
                                distinct=True,
                                filter=~Q(issue__assignees__id__isnull=True),
                            ),
                            Value([], output_field=ArrayField(UUIDField())),
                        ),
                    )
                    .get(
                        inbox_id=inbox_id.id,
                        issue_id=issue_id,
                        project_id=project_id,
                    )
                )
                serializer = InboxIssueDetailSerializer(inbox_issue).data
                return Response(serializer, status=status.HTTP_200_OK)
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )
        else:
            serializer = InboxIssueDetailSerializer(inbox_issue).data
            return Response(serializer, status=status.HTTP_200_OK)

    def retrieve(self, request, slug, project_id, issue_id):
        inbox_id = Inbox.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).first()
        inbox_issue = (
            InboxIssue.objects.select_related("issue")
            .prefetch_related(
                "issue__labels",
                "issue__assignees",
            )
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "issue__labels__id",
                        distinct=True,
                        filter=~Q(issue__labels__id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "issue__assignees__id",
                        distinct=True,
                        filter=~Q(issue__assignees__id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .get(
                inbox_id=inbox_id.id, issue_id=issue_id, project_id=project_id
            )
        )
        issue = InboxIssueDetailSerializer(inbox_issue).data
        return Response(
            issue,
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, slug, project_id, issue_id):
        inbox_id = Inbox.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).first()
        inbox_issue = InboxIssue.objects.get(
            issue_id=issue_id,
            workspace__slug=slug,
            project_id=project_id,
            inbox_id=inbox_id,
        )
        # Get the project member
        project_member = ProjectMember.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            member=request.user,
            is_active=True,
        )

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
