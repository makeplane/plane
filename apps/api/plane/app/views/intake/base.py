# Python imports
import json

# Django import
from django.utils import timezone
from django.db.models import Q, Count, OuterRef, Func, F, Prefetch, Subquery
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
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import (
    Intake,
    IntakeIssue,
    Issue,
    State,
    StateGroup,
    IssueLink,
    FileAsset,
    Project,
    ProjectMember,
    CycleIssue,
    IssueDescriptionVersion,
    WorkspaceMember,
)
from plane.app.serializers import (
    IssueCreateSerializer,
    IssueDetailSerializer,
    IntakeSerializer,
    IntakeIssueSerializer,
    IntakeIssueDetailSerializer,
    IssueDescriptionVersionDetailSerializer,
)
from plane.utils.issue_filters import issue_filters
from plane.bgtasks.issue_activities_task import issue_activity
from plane.bgtasks.issue_description_version_task import issue_description_version_task
from plane.app.views.base import BaseAPIView
from plane.utils.timezone_converter import user_timezone_converter
from plane.utils.global_paginator import paginate
from plane.utils.host import base_host
from plane.db.models.intake import SourceType


class IntakeViewSet(BaseViewSet):
    serializer_class = IntakeSerializer
    model = Intake

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
            )
            .annotate(pending_issue_count=Count("issue_intake", filter=Q(issue_intake__status=-2)))
            .select_related("workspace", "project")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def list(self, request, slug, project_id):
        intake = self.get_queryset().first()
        return Response(IntakeSerializer(intake).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, pk):
        intake = Intake.objects.filter(workspace__slug=slug, project_id=project_id, pk=pk).first()
        # Handle default intake delete
        if intake.is_default:
            return Response(
                {"error": "You cannot delete the default intake"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        intake.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IntakeIssueViewSet(BaseViewSet):
    serializer_class = IntakeIssueSerializer
    model = IntakeIssue

    filterset_fields = ["status"]

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
                    "issue_intake",
                    queryset=IntakeIssue.objects.only("status", "duplicate_to", "snoozed_till", "source"),
                )
            )
            .annotate(
                cycle_id=Subquery(
                    CycleIssue.objects.filter(issue=OuterRef("id"), deleted_at__isnull=True).values("cycle_id")[:1]
                )
            )
            .annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=FileAsset.objects.filter(
                    issue_id=OuterRef("id"),
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=Q(~Q(labels__id__isnull=True) & Q(label_issue__deleted_at__isnull=True)),
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
                module_ids=Coalesce(
                    ArrayAgg(
                        "issue_module__module_id",
                        distinct=True,
                        filter=Q(
                            ~Q(issue_module__module_id__isnull=True)
                            & Q(issue_module__module__archived_at__isnull=True)
                            & Q(issue_module__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
        ).distinct()

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        intake = Intake.objects.filter(workspace__slug=slug, project_id=project_id).first()
        if not intake:
            return Response({"error": "Intake not found"}, status=status.HTTP_404_NOT_FOUND)

        project = Project.objects.get(pk=project_id)
        filters = issue_filters(request.GET, "GET", "issue__")
        intake_issue = (
            IntakeIssue.objects.filter(intake_id=intake.id, project_id=project_id, **filters)
            .select_related("issue")
            .prefetch_related("issue__labels")
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "issue__labels__id",
                        distinct=True,
                        filter=Q(~Q(issue__labels__id__isnull=True) & Q(issue__label_issue__deleted_at__isnull=True)),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                )
            )
        ).order_by(request.GET.get("order_by", "-issue__created_at"))
        # Intake status filter
        intake_status = [item for item in request.GET.get("status", "-2").split(",") if item != "null"]
        if intake_status:
            intake_issue = intake_issue.filter(status__in=intake_status)

        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=ROLE.GUEST.value,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
        ):
            intake_issue = intake_issue.filter(created_by=request.user)
        return self.paginate(
            request=request,
            queryset=(intake_issue),
            on_results=lambda intake_issues: IntakeIssueSerializer(intake_issues, many=True).data,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def create(self, request, slug, project_id):
        if not request.data.get("issue", {}).get("name", False):
            return Response({"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Check for valid priority
        if request.data.get("issue", {}).get("priority", "none") not in [
            "low",
            "medium",
            "high",
            "urgent",
            "none",
        ]:
            return Response({"error": "Invalid priority"}, status=status.HTTP_400_BAD_REQUEST)

        project = Project.objects.get(pk=project_id)

        # get the triage state
        triage_state = State.triage_objects.filter(project_id=project_id, workspace__slug=slug).first()
        if not triage_state:
            triage_state = State.objects.create(
                name="Triage",
                group=StateGroup.TRIAGE.value,
                project_id=project_id,
                workspace_id=project.workspace_id,
                color="#4E5355",
                sequence=65000,
                default=False,
            )
        request.data["issue"]["state_id"] = triage_state.id

        # create an issue
        serializer = IssueCreateSerializer(
            data=request.data.get("issue"),
            context={
                "project_id": project_id,
                "workspace_id": project.workspace_id,
                "default_assignee_id": project.default_assignee_id,
                "allow_triage_state": True,
            },
        )
        if serializer.is_valid():
            serializer.save()
            intake_id = Intake.objects.filter(workspace__slug=slug, project_id=project_id).first()
            # create an intake issue
            intake_issue = IntakeIssue.objects.create(
                intake_id=intake_id.id,
                project_id=project_id,
                issue_id=serializer.data["id"],
                source=SourceType.IN_APP,
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
                origin=base_host(request=request, is_app=True),
                intake=str(intake_issue.id),
            )
            # updated issue description version
            issue_description_version_task.delay(
                updated_issue=json.dumps(request.data, cls=DjangoJSONEncoder),
                issue_id=str(serializer.data["id"]),
                user_id=request.user.id,
                is_creating=True,
            )
            intake_issue = (
                IntakeIssue.objects.select_related("issue")
                .prefetch_related("issue__labels", "issue__assignees")
                .annotate(
                    label_ids=Coalesce(
                        ArrayAgg(
                            "issue__labels__id",
                            distinct=True,
                            filter=Q(
                                ~Q(issue__labels__id__isnull=True) & Q(issue__label_issue__deleted_at__isnull=True)
                            ),
                        ),
                        Value([], output_field=ArrayField(UUIDField())),
                    ),
                    assignee_ids=Coalesce(
                        ArrayAgg(
                            "issue__assignees__id",
                            distinct=True,
                            filter=~Q(issue__assignees__id__isnull=True)
                            & Q(issue__assignees__member_project__is_active=True),
                        ),
                        Value([], output_field=ArrayField(UUIDField())),
                    ),
                )
                .get(
                    intake_id=intake_id.id,
                    issue_id=serializer.data["id"],
                    project_id=project_id,
                )
            )
            serializer = IntakeIssueDetailSerializer(intake_issue)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=Issue)
    def partial_update(self, request, slug, project_id, pk):
        skip_activity = request.data.pop("skip_activity", False)
        is_description_update = request.data.get("description_html") is not None

        intake_id = Intake.objects.filter(workspace__slug=slug, project_id=project_id).first()
        intake_issue = IntakeIssue.objects.get(
            issue_id=pk,
            workspace__slug=slug,
            project_id=project_id,
            intake_id=intake_id,
        )

        project_member = ProjectMember.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            member=request.user,
            is_active=True,
        ).first()

        is_workspace_admin = WorkspaceMember.objects.filter(
            workspace__slug=slug,
            is_active=True,
            member=request.user,
            role=ROLE.ADMIN.value,
        ).exists()

        if not project_member and not is_workspace_admin:
            return Response(
                {"error": "Only admin or creator can update the intake work items"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Only project members admins and created_by users can access this endpoint
        if ((project_member and project_member.role <= ROLE.GUEST.value) and not is_workspace_admin) and str(
            intake_issue.created_by_id
        ) != str(request.user.id):
            return Response(
                {"error": "You cannot edit intake issues"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get issue data
        issue_data = request.data.pop("issue", False)
        issue_serializer = None
        issue = None
        issue_current_instance = None
        issue_requested_data = None

        # Validate issue data if provided
        if bool(issue_data):
            issue = Issue.objects.annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=Q(~Q(labels__id__isnull=True) & Q(label_issue__deleted_at__isnull=True)),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "assignees__id",
                        distinct=True,
                        filter=Q(~Q(assignees__id__isnull=True) & Q(issue_assignee__deleted_at__isnull=True)),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            ).get(pk=intake_issue.issue_id, workspace__slug=slug, project_id=project_id)

            if project_member and project_member.role <= ROLE.GUEST.value:
                issue_data = {
                    "name": issue_data.get("name", issue.name),
                    "description_html": issue_data.get("description_html", issue.description_html),
                    "description_json": issue_data.get("description_json", issue.description_json),
                }

            issue_current_instance = json.dumps(IssueDetailSerializer(issue).data, cls=DjangoJSONEncoder)
            issue_requested_data = json.dumps(issue_data, cls=DjangoJSONEncoder)

            issue_serializer = IssueCreateSerializer(
                issue, data=issue_data, partial=True, context={"project_id": project_id, "allow_triage_state": True}
            )

            if not issue_serializer.is_valid():
                return Response(issue_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Validate intake issue data if user has permission
        intake_serializer = None
        intake_current_instance = None

        if (project_member and project_member.role > ROLE.MEMBER.value) or is_workspace_admin:
            intake_current_instance = json.dumps(IntakeIssueSerializer(intake_issue).data, cls=DjangoJSONEncoder)
            intake_serializer = IntakeIssueSerializer(intake_issue, data=request.data, partial=True)

            if not intake_serializer.is_valid():
                return Response(intake_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Both serializers are valid, now save them
        if issue_serializer:
            issue_serializer.save()

            # Check if the update is a migration description update
            is_migration_description_update = skip_activity and is_description_update
            # Log all the updates
            if not is_migration_description_update:
                if issue is not None:
                    issue_activity.delay(
                        type="issue.activity.updated",
                        requested_data=issue_requested_data,
                        actor_id=str(request.user.id),
                        issue_id=str(issue.id),
                        project_id=str(project_id),
                        current_instance=issue_current_instance,
                        epoch=int(timezone.now().timestamp()),
                        notification=True,
                        origin=base_host(request=request, is_app=True),
                        intake=str(intake_issue.id),
                    )
                    # updated issue description version
                    issue_description_version_task.delay(
                        updated_issue=issue_current_instance,
                        issue_id=str(pk),
                        user_id=request.user.id,
                    )

        if intake_serializer:
            intake_serializer.save()
            # create a activity for status change
            issue_activity.delay(
                type="intake.activity.created",
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                issue_id=str(pk),
                project_id=str(project_id),
                current_instance=intake_current_instance,
                epoch=int(timezone.now().timestamp()),
                notification=False,
                origin=base_host(request=request, is_app=True),
                intake=str(intake_issue.id),
            )

        # Fetch and return the updated intake issue
        intake_issue = (
            IntakeIssue.objects.select_related("issue")
            .prefetch_related("issue__labels", "issue__assignees")
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "issue__labels__id",
                        distinct=True,
                        filter=Q(~Q(issue__labels__id__isnull=True) & Q(issue__label_issue__deleted_at__isnull=True)),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "issue__assignees__id",
                        distinct=True,
                        filter=Q(
                            ~Q(issue__assignees__id__isnull=True) & Q(issue__issue_assignee__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .get(intake_id=intake_id.id, issue_id=pk, project_id=project_id)
        )
        serializer = IntakeIssueDetailSerializer(intake_issue).data
        return Response(serializer, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], creator=True, model=Issue)
    def retrieve(self, request, slug, project_id, pk):
        intake_id = Intake.objects.filter(workspace__slug=slug, project_id=project_id).first()
        project = Project.objects.get(pk=project_id)
        intake_issue = (
            IntakeIssue.objects.select_related("issue")
            .prefetch_related("issue__labels", "issue__assignees")
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "issue__labels__id",
                        distinct=True,
                        filter=Q(~Q(issue__labels__id__isnull=True) & Q(issue__label_issue__deleted_at__isnull=True)),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "issue__assignees__id",
                        distinct=True,
                        filter=Q(
                            ~Q(issue__assignees__id__isnull=True) & Q(issue__issue_assignee__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .get(intake_id=intake_id.id, issue_id=pk, project_id=project_id)
        )
        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=ROLE.GUEST.value,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
            and not intake_issue.created_by == request.user
        ):
            return Response(
                {"error": "You are not allowed to view this issue"},
                status=status.HTTP_403_FORBIDDEN,
            )
        issue = IntakeIssueDetailSerializer(intake_issue).data
        return Response(issue, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=Issue)
    def destroy(self, request, slug, project_id, pk):
        intake_id = Intake.objects.filter(workspace__slug=slug, project_id=project_id).first()
        intake_issue = IntakeIssue.objects.get(
            issue_id=pk,
            workspace__slug=slug,
            project_id=project_id,
            intake_id=intake_id,
        )

        # Check the issue status
        if intake_issue.status in [-2, -1, 0, 2]:
            # Delete the issue also
            issue = Issue.objects.filter(workspace__slug=slug, project_id=project_id, pk=pk).first()
            issue.delete()

        intake_issue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IntakeWorkItemDescriptionVersionEndpoint(BaseAPIView):
    def process_paginated_result(self, fields, results, timezone):
        paginated_data = results.values(*fields)

        datetime_fields = ["created_at", "updated_at"]
        paginated_data = user_timezone_converter(paginated_data, datetime_fields, timezone)

        return paginated_data

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, work_item_id, pk=None):
        project = Project.objects.get(pk=project_id)
        issue = Issue.objects.get(workspace__slug=slug, project_id=project_id, pk=work_item_id)

        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=ROLE.GUEST.value,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
            and not issue.created_by == request.user
        ):
            return Response(
                {"error": "You are not allowed to view this issue"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if pk:
            issue_description_version = IssueDescriptionVersion.objects.get(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=work_item_id,
                pk=pk,
            )

            serializer = IssueDescriptionVersionDetailSerializer(issue_description_version)
            return Response(serializer.data, status=status.HTTP_200_OK)

        cursor = request.GET.get("cursor", None)

        required_fields = [
            "id",
            "workspace",
            "project",
            "issue",
            "last_saved_at",
            "owned_by",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

        issue_description_versions_queryset = IssueDescriptionVersion.objects.filter(
            workspace__slug=slug, project_id=project_id, issue_id=work_item_id
        )

        paginated_data = paginate(
            base_queryset=issue_description_versions_queryset,
            queryset=issue_description_versions_queryset,
            cursor=cursor,
            on_result=lambda results: self.process_paginated_result(
                required_fields, results, request.user.user_timezone
            ),
        )
        return Response(paginated_data, status=status.HTTP_200_OK)
