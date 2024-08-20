# Python imports
import json

# Django imports
from django.utils import timezone
from django.db.models import (
    OuterRef,
    Func,
    F,
    Q,
    Value,
    UUIDField,
)
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Coalesce

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseAPIView
from plane.app.serializers import IssueSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import (
    Issue,
    IssueLink,
    IssueAttachment,
)
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.user_timezone_converter import user_timezone_converter
from collections import defaultdict


class SubIssuesEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    @method_decorator(gzip_page)
    def get(self, request, slug, project_id, issue_id):
        sub_issues = (
            Issue.issue_objects.filter(
                parent_id=issue_id, workspace__slug=slug
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
            .annotate(state_group=F("state__group"))
            .order_by("-created_at")
        )

        # create's a dict with state group name with their respective issue id's
        result = defaultdict(list)
        for sub_issue in sub_issues:
            result[sub_issue.state_group].append(str(sub_issue.id))

        sub_issues = sub_issues.values(
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
        sub_issues = user_timezone_converter(
            sub_issues, datetime_fields, request.user.user_timezone
        )
        return Response(
            {
                "sub_issues": sub_issues,
                "state_distribution": result,
            },
            status=status.HTTP_200_OK,
        )

    # Assign multiple sub issues
    def post(self, request, slug, project_id, issue_id):
        parent_issue = Issue.issue_objects.get(pk=issue_id)
        sub_issue_ids = request.data.get("sub_issue_ids", [])

        if not len(sub_issue_ids):
            return Response(
                {"error": "Sub Issue IDs are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sub_issues = Issue.issue_objects.filter(id__in=sub_issue_ids)

        for sub_issue in sub_issues:
            sub_issue.parent = parent_issue

        _ = Issue.objects.bulk_update(sub_issues, ["parent"], batch_size=10)

        updated_sub_issues = Issue.issue_objects.filter(
            id__in=sub_issue_ids
        ).annotate(state_group=F("state__group"))

        # Track the issue
        _ = [
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=json.dumps({"parent": str(issue_id)}),
                actor_id=str(request.user.id),
                issue_id=str(sub_issue_id),
                project_id=str(project_id),
                current_instance=json.dumps({"parent": str(sub_issue_id)}),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            for sub_issue_id in sub_issue_ids
        ]

        # create's a dict with state group name with their respective issue id's
        result = defaultdict(list)
        for sub_issue in updated_sub_issues:
            result[sub_issue.state_group].append(str(sub_issue.id))

        serializer = IssueSerializer(
            updated_sub_issues,
            many=True,
        )
        return Response(
            {
                "sub_issues": serializer.data,
                "state_distribution": result,
            },
            status=status.HTTP_200_OK,
        )
