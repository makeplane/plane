# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

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
from rest_framework.exceptions import PermissionDenied


# Module imports
from ..base import BaseViewSet
from plane.app.permissions import allow_permission, ROLE
from plane.permissions import (
    can,
    IntakePermissions,
    WorkitemPermissions,
    PermissionMixin,
    get_permission_conditions,
)
from plane.db.models import (
    Intake,
    IntakeIssue,
    Issue,
    State,
    IssueLink,
    FileAsset,
    Project,
    CycleIssue,
    IssueDescriptionVersion,
)
from plane.app.serializers import (
    IssueCreateSerializer,
    IssueDetailSerializer,
    IntakeSerializer,
    IntakeIssueSerializer,
    IntakeIssueUpdateSerializer,
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
from plane.ee.models import IntakeSetting


# TODO: Unused endpoint — not called by FE. Migrate to @can before re-enabling.
# Note: retrieve and partial_update are inherited from BaseViewSet without permission
# decorators — add @can when migrating. list/perform_create/destroy have @allow_permission.
class IntakeViewSet(BaseViewSet):
    use_read_replica = True

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


class IntakeIssueViewSet(PermissionMixin, BaseViewSet):
    use_read_replica = True

    serializer_class = IntakeIssueSerializer
    model = IntakeIssue

    filterset_fields = ["status"]

    def get_queryset(self):
        return (
            Issue.objects.filter(
                project_id=self.kwargs.get("project_id"),
                workspace__slug=self.kwargs.get("slug"),
            )
            .filter(Q(type__isnull=True) | Q(type__is_epic=False))
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

    @can(IntakePermissions.VIEW, resource_param="project_id", defer_conditions=True)
    def list(self, request, slug, project_id):
        intake = Intake.objects.filter(workspace__slug=slug, project_id=project_id).first()
        if not intake:
            return Response({"error": "Intake not found"}, status=status.HTTP_404_NOT_FOUND)

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

        # Data-level filter: deferred conditions (e.g., guest sees only own items)
        conditions = get_permission_conditions(request)
        if 'creator' in conditions:
            intake_issue = intake_issue.filter(created_by=request.user)
        return self.paginate(
            request=request,
            queryset=(intake_issue),
            on_results=lambda intake_issues: IntakeIssueSerializer(intake_issues, many=True).data,
        )

    @can(IntakePermissions.SUBMIT, resource_param="project_id")
    def create(self, request, slug, project_id):
        if not request.data.get("issue", {}).get("name", False):
            return Response({"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST)

        intake = Intake.objects.filter(workspace__slug=slug, project_id=project_id).first()

        intake_settings = IntakeSetting.objects.filter(
            workspace__slug=slug, project_id=project_id, intake=intake
        ).first()

        if intake_settings is not None and not intake_settings.is_in_app_enabled:
            return Response(
                {"error": "Creating intake issues is disabled"},
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
            return Response({"error": "Invalid priority"}, status=status.HTTP_400_BAD_REQUEST)

        project = Project.objects.get(pk=project_id)

        # get the triage state
        triage_state = State.triage_objects.filter(project_id=project_id, workspace__slug=slug).first()
        if not triage_state:
            triage_state = State.create_triage_state(workspace_id=project.workspace_id, project_id=project_id)
        request.data["issue"]["state_id"] = triage_state.id

        # create an issue
        serializer = IssueCreateSerializer(
            data=request.data.get("issue"),
            context={
                "project_id": project_id,
                "workspace_id": project.workspace_id,
                "default_assignee_id": project.default_assignee_id,
                "allow_triage_state": True,
                "user_id": request.user.id,
                "slug": slug,
                "intake_id": str(intake.id),
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
                requested_data=json.dumps(request.data["issue"], cls=DjangoJSONEncoder),
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
                            filter=Q(
                                ~Q(issue__assignees__id__isnull=True)
                                & Q(issue__assignees__member_project__is_active=True)
                                & Q(issue__issue_assignee__deleted_at__isnull=True)
                            ),
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

    @can(IntakePermissions.EDIT, resource_param="project_id", defer_conditions=True)
    def partial_update(self, request, slug, project_id, pk):
        is_description_update = request.data.get("description_html") is not None
        forbidden_triage_fields = {"status", "duplicate_to", "snoozed_till"}
        if any(field in request.data for field in forbidden_triage_fields):
            return Response(
                {"error": "Use the intake status endpoint to update status, duplicate_to, or snoozed_till"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        intake_id = Intake.objects.filter(workspace__slug=slug, project_id=project_id).first()
        if not intake_id:
            return Response({"error": "Intake not found"}, status=status.HTTP_404_NOT_FOUND)
        intake_issue = IntakeIssue.objects.get(
            issue_id=pk,
            workspace__slug=slug,
            project_id=project_id,
            intake_id=intake_id,
        )

        # Deferred conditions: creator-only roles must own the issue
        conditions = get_permission_conditions(request)
        if 'creator' in conditions:
            if intake_issue.created_by_id != request.user.id:
                raise PermissionDenied("Only admin or creator can update intake work items")

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

            # Creator-only roles can only update a subset of fields
            if 'creator' in conditions:
                allowed_keys = {
                    "name", "description_html", "description_json",
                    "priority", "target_date", "start_date",
                    "label_ids", "assignee_ids",
                }
                issue_data = {k: issue_data[k] for k in allowed_keys if k in issue_data}

            issue_current_instance = json.dumps(IssueDetailSerializer(issue).data, cls=DjangoJSONEncoder)
            issue_requested_data = json.dumps(issue_data, cls=DjangoJSONEncoder)

            issue_serializer = IntakeIssueUpdateSerializer(
                issue,
                data=issue_data,
                partial=True,
                context={
                    "project_id": project_id,
                    "allow_triage_state": True,
                    "user_id": request.user.id,
                    "slug": slug,
                },
            )

            if not issue_serializer.is_valid():
                return Response(issue_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Both serializers are valid, now save them
        if issue_serializer:
            issue_serializer.save()
            skip_activity = request.data.pop("skip_activity", False)

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
                            ~Q(issue__assignees__id__isnull=True)
                            & Q(issue__assignees__member_project__is_active=True)
                            & Q(issue__issue_assignee__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .get(intake_id=intake_id.id, issue_id=pk, project_id=project_id)
        )
        response_data = IntakeIssueDetailSerializer(intake_issue).data
        return Response(response_data, status=status.HTTP_200_OK)

    @can(IntakePermissions.MANAGE, resource_param="project_id")
    def update_status(self, request, slug, project_id, pk):
        intake_id = Intake.objects.filter(workspace__slug=slug, project_id=project_id).first()
        if not intake_id:
            return Response({"error": "Intake not found"}, status=status.HTTP_404_NOT_FOUND)
        intake_issue = IntakeIssue.objects.get(
            issue_id=pk,
            workspace__slug=slug,
            project_id=project_id,
            intake_id=intake_id,
        )

        intake_current_instance = json.dumps(IntakeIssueSerializer(intake_issue).data, cls=DjangoJSONEncoder)
        intake_serializer = IntakeIssueSerializer(intake_issue, data=request.data, partial=True)

        if not intake_serializer.is_valid():
            return Response(intake_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        intake_serializer.save()

        # Log activity for status change
        issue_activity.delay(
            type="intake.activity.created",
            requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
            actor_id=str(request.user.id),
            issue_id=str(pk),
            project_id=str(project_id),
            current_instance=intake_current_instance,
            epoch=int(timezone.now().timestamp()),
            notification=True,
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
                            ~Q(issue__assignees__id__isnull=True)
                            & Q(issue__assignees__member_project__is_active=True)
                            & Q(issue__issue_assignee__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .get(intake_id=intake_id.id, issue_id=pk, project_id=project_id)
        )
        response_data = IntakeIssueDetailSerializer(intake_issue).data
        return Response(response_data, status=status.HTTP_200_OK)

    @can(IntakePermissions.VIEW, resource_param="project_id", defer_conditions=True)
    def retrieve(self, request, slug, project_id, pk):
        intake_id = Intake.objects.filter(workspace__slug=slug, project_id=project_id).first()
        if not intake_id:
            return Response({"error": "Intake not found"}, status=status.HTTP_404_NOT_FOUND)
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
                            ~Q(issue__assignees__id__isnull=True)
                            & Q(issue__assignees__member_project__is_active=True)
                            & Q(issue__issue_assignee__deleted_at__isnull=True)
                        ),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .get(intake_id=intake_id.id, issue_id=pk, project_id=project_id)
        )
        # Deferred conditions: creator-only roles can only view own items
        conditions = get_permission_conditions(request)
        if 'creator' in conditions:
            if intake_issue.created_by_id != request.user.id:
                raise PermissionDenied("You don't have permission to view this intake issue")
        issue = IntakeIssueDetailSerializer(intake_issue).data
        return Response(issue, status=status.HTTP_200_OK)

    @can(IntakePermissions.DELETE, resource_param="project_id", defer_conditions=True)
    def destroy(self, request, slug, project_id, pk):
        intake_id = Intake.objects.filter(workspace__slug=slug, project_id=project_id).first()
        if not intake_id:
            return Response({"error": "Intake not found"}, status=status.HTTP_404_NOT_FOUND)
        intake_issue = IntakeIssue.objects.get(
            issue_id=pk,
            workspace__slug=slug,
            project_id=project_id,
            intake_id=intake_id,
        )

        # Deferred conditions: creator-only roles must own the issue
        conditions = get_permission_conditions(request)
        if 'creator' in conditions:
            if intake_issue.created_by_id != request.user.id:
                raise PermissionDenied("Only admin or creator can delete intake issues")

        # Check the issue status
        if intake_issue.status in [-2, -1, 0, 2]:
            # Delete the issue also
            issue = Issue.objects.filter(workspace__slug=slug, project_id=project_id, pk=pk).first()
            issue.delete()

        intake_issue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IntakeWorkItemDescriptionVersionEndpoint(BaseAPIView):
    use_read_replica = True

    def process_paginated_result(self, fields, results, timezone):
        paginated_data = results.values(*fields)

        datetime_fields = ["created_at", "updated_at"]
        paginated_data = user_timezone_converter(paginated_data, datetime_fields, timezone)

        return paginated_data

    @can(WorkitemPermissions.VIEW, resource_param="work_item_id")
    def get(self, request, slug, project_id, work_item_id, pk=None):
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
