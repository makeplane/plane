# Python imports
import json

# Django imports
from django.db.models import (
    Func,
    F,
    Q,
    OuterRef,
    Value,
    UUIDField,
)
from django.core import serializers
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Coalesce

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseViewSet
from plane.app.serializers import (
    IssueSerializer,
    CycleIssueSerializer,
)
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import (
    Cycle,
    CycleIssue,
    Issue,
    IssueLink,
    IssueAttachment,
)
from plane.bgtasks.issue_activites_task import issue_activity
from plane.utils.issue_filters import issue_filters
from plane.utils.user_timezone_converter import user_timezone_converter

class CycleIssueViewSet(BaseViewSet):
    serializer_class = CycleIssueSerializer
    model = CycleIssue

    webhook_event = "cycle_issue"
    bulk = True

    permission_classes = [
        ProjectEntityPermission,
    ]

    filterset_fields = [
        "issue__labels__id",
        "issue__assignees__id",
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("issue_id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .filter(cycle_id=self.kwargs.get("cycle_id"))
            .select_related("project")
            .select_related("workspace")
            .select_related("cycle")
            .select_related("issue", "issue__state", "issue__project")
            .prefetch_related("issue__assignees", "issue__labels")
            .distinct()
        )

    @method_decorator(gzip_page)
    def list(self, request, slug, project_id, cycle_id):
        fields = [
            field
            for field in request.GET.get("fields", "").split(",")
            if field
        ]
        order_by = request.GET.get("order_by", "created_at")
        filters = issue_filters(request.query_params, "GET")
        queryset = (
            Issue.issue_objects.filter(issue_cycle__cycle_id=cycle_id)
            .filter(project_id=project_id)
            .filter(workspace__slug=slug)
            .filter(**filters)
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related(
                "assignees",
                "labels",
                "issue_module__module",
                "issue_cycle__cycle",
            )
            .order_by(order_by)
            .filter(**filters)
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
            .order_by(order_by)
        )
        if self.fields:
            issues = IssueSerializer(
                queryset, many=True, fields=fields if fields else None
            ).data
        else:
            issues = queryset.values(
                "id",
                "name",
                "state_id",
                "sort_order",
                "completed_at",
                "estimate_point",
                "priority",
                "start_date",
                "target_date",
                "sequence_id",
                "project_id",
                "parent_id",
                "cycle_id",
                "module_ids",
                "label_ids",
                "assignee_ids",
                "sub_issues_count",
                "created_at",
                "updated_at",
                "created_by",
                "updated_by",
                "attachment_count",
                "link_count",
                "is_draft",
                "archived_at",
            )
            datetime_fields = ["created_at", "updated_at"]
            issues = user_timezone_converter(
                issues, datetime_fields, request.user.user_timezone
            )

        return Response(issues, status=status.HTTP_200_OK)

    def create(self, request, slug, project_id, cycle_id):
        issues = request.data.get("issues", [])

        if not issues:
            return Response(
                {"error": "Issues are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cycle = Cycle.objects.get(
            workspace__slug=slug, project_id=project_id, pk=cycle_id
        )

        if (
            cycle.end_date is not None
            and cycle.end_date < timezone.now().date()
        ):
            return Response(
                {
                    "error": "The Cycle has already been completed so no new issues can be added"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get all CycleIssues already created
        cycle_issues = list(
            CycleIssue.objects.filter(
                ~Q(cycle_id=cycle_id), issue_id__in=issues
            )
        )
        existing_issues = [
            str(cycle_issue.issue_id) for cycle_issue in cycle_issues
        ]
        new_issues = list(set(issues) - set(existing_issues))

        # New issues to create
        created_records = CycleIssue.objects.bulk_create(
            [
                CycleIssue(
                    project_id=project_id,
                    workspace_id=cycle.workspace_id,
                    created_by_id=request.user.id,
                    updated_by_id=request.user.id,
                    cycle_id=cycle_id,
                    issue_id=issue,
                )
                for issue in new_issues
            ],
            batch_size=10,
        )

        # Updated Issues
        updated_records = []
        update_cycle_issue_activity = []
        # Iterate over each cycle_issue in cycle_issues
        for cycle_issue in cycle_issues:
            old_cycle_id = cycle_issue.cycle_id
            # Update the cycle_issue's cycle_id
            cycle_issue.cycle_id = cycle_id
            # Add the modified cycle_issue to the records_to_update list
            updated_records.append(cycle_issue)
            # Record the update activity
            update_cycle_issue_activity.append(
                {
                    "old_cycle_id": str(old_cycle_id),
                    "new_cycle_id": str(cycle_id),
                    "issue_id": str(cycle_issue.issue_id),
                }
            )

        # Update the cycle issues
        CycleIssue.objects.bulk_update(
            updated_records, ["cycle_id"], batch_size=100
        )
        # Capture Issue Activity
        issue_activity.delay(
            type="cycle.activity.created",
            requested_data=json.dumps({"cycles_list": issues}),
            actor_id=str(self.request.user.id),
            issue_id=None,
            project_id=str(self.kwargs.get("project_id", None)),
            current_instance=json.dumps(
                {
                    "updated_cycle_issues": update_cycle_issue_activity,
                    "created_cycle_issues": serializers.serialize(
                        "json", created_records
                    ),
                }
            ),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        return Response({"message": "success"}, status=status.HTTP_201_CREATED)

    def destroy(self, request, slug, project_id, cycle_id, issue_id):
        cycle_issue = CycleIssue.objects.get(
            issue_id=issue_id,
            workspace__slug=slug,
            project_id=project_id,
            cycle_id=cycle_id,
        )
        issue_activity.delay(
            type="cycle.activity.deleted",
            requested_data=json.dumps(
                {
                    "cycle_id": str(self.kwargs.get("cycle_id")),
                    "issues": [str(issue_id)],
                }
            ),
            actor_id=str(self.request.user.id),
            issue_id=str(issue_id),
            project_id=str(self.kwargs.get("project_id", None)),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        cycle_issue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
