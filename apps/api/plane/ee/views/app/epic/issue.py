# Python imports
import json

# Django imports
from django.utils import timezone
from django.db.models import OuterRef, Func, F, Q, Value, UUIDField, Subquery
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Coalesce

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.app.serializers import IssueSerializer
from plane.db.models import Issue, IssueLink, FileAsset, CycleIssue
from plane.bgtasks.issue_activities_task import issue_activity
from plane.utils.timezone_converter import user_timezone_converter
from plane.app.permissions import allow_permission, ROLE
from collections import defaultdict
from plane.utils.order_queryset import order_issue_queryset


class EpicIssuesEndpoint(BaseAPIView):
    @method_decorator(gzip_page)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, epic_id):
        epic_issues = (
            Issue.issue_objects.filter(parent_id=epic_id, workspace__slug=slug)
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels", "issue_module__module")
            .annotate(
                cycle_id=Subquery(
                    CycleIssue.objects.filter(
                        issue=OuterRef("id"), deleted_at__isnull=True
                    ).values("cycle_id")[:1]
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
                        filter=Q(
                            ~Q(labels__id__isnull=True)
                            & Q(label_issue__deleted_at__isnull=True)
                        ),
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
            .annotate(state_group=F("state__group"))
            .order_by("-created_at")
        )

        # Ordering
        order_by_param = request.GET.get("order_by", "-created_at")
        group_by = request.GET.get("group_by", False)

        if order_by_param:
            epic_issues, order_by_param = order_issue_queryset(
                epic_issues, order_by_param
            )

        # create's a dict with state group name with their respective issue id's
        result = defaultdict(list)

        for sub_issue in epic_issues:
            result[sub_issue.state_group].append(str(sub_issue.id))

        epic_issues = epic_issues.values(
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
            "type_id",
        )
        datetime_fields = ["created_at", "updated_at"]
        epic_issues = user_timezone_converter(
            epic_issues, datetime_fields, request.user.user_timezone
        )
        if group_by:
            result_dict = defaultdict(list)

            for issue in epic_issues:
                if group_by == "assignees__id":
                    if issue["assignee_ids"]:
                        assignee_ids = issue["assignee_ids"]
                        for assignee_id in assignee_ids:
                            result_dict[str(assignee_id)].append(issue)
                    elif issue["assignee_ids"] == []:
                        result_dict["None"].append(issue)

                elif group_by:
                    result_dict[str(issue[group_by])].append(issue)

            return Response(
                {"sub_issues": result_dict, "state_distribution": result},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"sub_issues": epic_issues, "state_distribution": result},
            status=status.HTTP_200_OK,
        )

    # Add multiple issues under an epic
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, epic_id):
        parent_issue = Issue.objects.get(pk=epic_id)
        issue_ids = request.data.get("sub_issue_ids", [])

        if not len(issue_ids):
            return Response(
                {"error": "Issue IDs are required"}, status=status.HTTP_400_BAD_REQUEST
            )

        issue_ids = Issue.issue_objects.filter(id__in=issue_ids)

        for issue in issue_ids:
            issue.parent = parent_issue

        _ = Issue.objects.bulk_update(issue_ids, ["parent"], batch_size=10)

        updated_issue_ids = (
            Issue.issue_objects.filter(id__in=issue_ids)
            .annotate(state_group=F("state__group"))
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
        )

        # Track the issue
        _ = [
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=json.dumps({"parent_id": str(epic_id)}),
                actor_id=str(request.user.id),
                issue_id=str(issue.id),
                project_id=str(project_id),
                current_instance=json.dumps({"parent_id": str(issue.id)}),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            for issue in issue_ids
        ]

        # create's a dict with state group name with their respective issue id's
        result = defaultdict(list)
        for sub_issue in updated_issue_ids:
            result[sub_issue.state_group].append(str(sub_issue.id))

        serializer = IssueSerializer(updated_issue_ids, many=True)
        return Response(
            {"sub_issues": serializer.data, "state_distribution": result},
            status=status.HTTP_200_OK,
        )
