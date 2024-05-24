# Python imports
import json

# Django Imports
from django.utils import timezone
from django.db.models import F, OuterRef, Func, Q
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import Value, UUIDField
from django.db.models.functions import Coalesce

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseViewSet
from plane.app.serializers import (
    ModuleIssueSerializer,
    IssueSerializer,
)
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import (
    ModuleIssue,
    Project,
    Issue,
    IssueLink,
    IssueAttachment,
)
from plane.bgtasks.issue_activites_task import issue_activity
from plane.utils.issue_filters import issue_filters
from plane.utils.user_timezone_converter import user_timezone_converter

class ModuleIssueViewSet(BaseViewSet):
    serializer_class = ModuleIssueSerializer
    model = ModuleIssue
    webhook_event = "module_issue"
    bulk = True

    filterset_fields = [
        "issue__labels__id",
        "issue__assignees__id",
    ]

    permission_classes = [
        ProjectEntityPermission,
    ]

    def get_queryset(self):
        return (
            Issue.issue_objects.filter(
                project_id=self.kwargs.get("project_id"),
                workspace__slug=self.kwargs.get("slug"),
                issue_module__module_id=self.kwargs.get("module_id"),
            )
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels", "issue_module__module")
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

    @method_decorator(gzip_page)
    def list(self, request, slug, project_id, module_id):
        fields = [
            field
            for field in request.GET.get("fields", "").split(",")
            if field
        ]
        filters = issue_filters(request.query_params, "GET")
        issue_queryset = self.get_queryset().filter(**filters)
        if self.fields or self.expand:
            issues = IssueSerializer(
                issue_queryset, many=True, fields=fields if fields else None
            ).data
        else:
            issues = issue_queryset.values(
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

    # create multiple issues inside a module
    def create_module_issues(self, request, slug, project_id, module_id):
        issues = request.data.get("issues", [])
        if not issues:
            return Response(
                {"error": "Issues are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        project = Project.objects.get(pk=project_id)
        _ = ModuleIssue.objects.bulk_create(
            [
                ModuleIssue(
                    issue_id=str(issue),
                    module_id=module_id,
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                    created_by=request.user,
                    updated_by=request.user,
                )
                for issue in issues
            ],
            batch_size=10,
            ignore_conflicts=True,
        )
        # Bulk Update the activity
        _ = [
            issue_activity.delay(
                type="module.activity.created",
                requested_data=json.dumps({"module_id": str(module_id)}),
                actor_id=str(request.user.id),
                issue_id=str(issue),
                project_id=project_id,
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            for issue in issues
        ]
        return Response({"message": "success"}, status=status.HTTP_201_CREATED)

    # add multiple module inside an issue and remove multiple modules from an issue
    def create_issue_modules(self, request, slug, project_id, issue_id):
        modules = request.data.get("modules", [])
        removed_modules = request.data.get("removed_modules", [])
        project = Project.objects.get(pk=project_id)


        if modules:
            _ = ModuleIssue.objects.bulk_create(
                [
                    ModuleIssue(
                        issue_id=issue_id,
                        module_id=module,
                        project_id=project_id,
                        workspace_id=project.workspace_id,
                        created_by=request.user,
                        updated_by=request.user,
                    )
                    for module in modules
                ],
                batch_size=10,
                ignore_conflicts=True,
            )
            # Bulk Update the activity
            _ = [
                issue_activity.delay(
                    type="module.activity.created",
                    requested_data=json.dumps({"module_id": module}),
                    actor_id=str(request.user.id),
                    issue_id=issue_id,
                    project_id=project_id,
                    current_instance=None,
                    epoch=int(timezone.now().timestamp()),
                    notification=True,
                    origin=request.META.get("HTTP_ORIGIN"),
                )
                for module in modules
            ]

        for module_id in removed_modules:
            module_issue = ModuleIssue.objects.get(
                workspace__slug=slug,
                project_id=project_id,
                module_id=module_id,
                issue_id=issue_id,
            )
            issue_activity.delay(
                type="module.activity.deleted",
                requested_data=json.dumps({"module_id": str(module_id)}),
                actor_id=str(request.user.id),
                issue_id=str(issue_id),
                project_id=str(project_id),
                current_instance=json.dumps(
                    {"module_name": module_issue.module.name}
                ),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            module_issue.delete()

        return Response({"message": "success"}, status=status.HTTP_201_CREATED)

    def destroy(self, request, slug, project_id, module_id, issue_id):
        module_issue = ModuleIssue.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            module_id=module_id,
            issue_id=issue_id,
        )
        issue_activity.delay(
            type="module.activity.deleted",
            requested_data=json.dumps({"module_id": str(module_id)}),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=json.dumps(
                {"module_name": module_issue.module.name}
            ),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        module_issue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
