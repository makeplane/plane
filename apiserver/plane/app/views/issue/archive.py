# Python imports
import json

# Django imports
from django.utils import timezone
from django.db.models import (
    Prefetch,
    OuterRef,
    Func,
    F,
    Q,
    Case,
    Value,
    CharField,
    When,
    Exists,
    Max,
    UUIDField,
)
from django.core.serializers.json import DjangoJSONEncoder
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Coalesce

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .. import BaseViewSet
from plane.app.serializers import (
    IssueSerializer,
    IssueFlatSerializer,
    IssueDetailSerializer,
)
from plane.app.permissions import (
    ProjectEntityPermission,
)
from plane.db.models import (
    Issue,
    IssueLink,
    IssueAttachment,
    IssueSubscriber,
    IssueReaction,
)
from plane.bgtasks.issue_activites_task import issue_activity
from plane.utils.issue_filters import issue_filters
from plane.utils.user_timezone_converter import user_timezone_converter

class IssueArchiveViewSet(BaseViewSet):
    permission_classes = [
        ProjectEntityPermission,
    ]
    serializer_class = IssueFlatSerializer
    model = Issue

    def get_queryset(self):
        return (
            Issue.objects.annotate(
                sub_issues_count=Issue.objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .filter(archived_at__isnull=False)
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(workspace__slug=self.kwargs.get("slug"))
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
        )

    @method_decorator(gzip_page)
    def list(self, request, slug, project_id):
        filters = issue_filters(request.query_params, "GET")
        show_sub_issues = request.GET.get("show_sub_issues", "true")

        # Custom ordering for priority and state
        priority_order = ["urgent", "high", "medium", "low", "none"]
        state_order = [
            "backlog",
            "unstarted",
            "started",
            "completed",
            "cancelled",
        ]

        order_by_param = request.GET.get("order_by", "-created_at")

        issue_queryset = self.get_queryset().filter(**filters)

        # Priority Ordering
        if order_by_param == "priority" or order_by_param == "-priority":
            priority_order = (
                priority_order
                if order_by_param == "priority"
                else priority_order[::-1]
            )
            issue_queryset = issue_queryset.annotate(
                priority_order=Case(
                    *[
                        When(priority=p, then=Value(i))
                        for i, p in enumerate(priority_order)
                    ],
                    output_field=CharField(),
                )
            ).order_by("priority_order")

        # State Ordering
        elif order_by_param in [
            "state__name",
            "state__group",
            "-state__name",
            "-state__group",
        ]:
            state_order = (
                state_order
                if order_by_param in ["state__name", "state__group"]
                else state_order[::-1]
            )
            issue_queryset = issue_queryset.annotate(
                state_order=Case(
                    *[
                        When(state__group=state_group, then=Value(i))
                        for i, state_group in enumerate(state_order)
                    ],
                    default=Value(len(state_order)),
                    output_field=CharField(),
                )
            ).order_by("state_order")
        # assignee and label ordering
        elif order_by_param in [
            "labels__name",
            "-labels__name",
            "assignees__first_name",
            "-assignees__first_name",
        ]:
            issue_queryset = issue_queryset.annotate(
                max_values=Max(
                    order_by_param[1::]
                    if order_by_param.startswith("-")
                    else order_by_param
                )
            ).order_by(
                "-max_values"
                if order_by_param.startswith("-")
                else "max_values"
            )
        else:
            issue_queryset = issue_queryset.order_by(order_by_param)

        issue_queryset = (
            issue_queryset
            if show_sub_issues == "true"
            else issue_queryset.filter(parent__isnull=True)
        )
        if self.expand or self.fields:
            issues = IssueSerializer(
                issue_queryset,
                many=True,
                fields=self.fields,
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

    def retrieve(self, request, slug, project_id, pk=None):
        issue = (
            self.get_queryset()
            .filter(pk=pk)
            .prefetch_related(
                Prefetch(
                    "issue_reactions",
                    queryset=IssueReaction.objects.select_related(
                        "issue", "actor"
                    ),
                )
            )
            .prefetch_related(
                Prefetch(
                    "issue_attachment",
                    queryset=IssueAttachment.objects.select_related("issue"),
                )
            )
            .prefetch_related(
                Prefetch(
                    "issue_link",
                    queryset=IssueLink.objects.select_related("created_by"),
                )
            )
            .annotate(
                is_subscribed=Exists(
                    IssueSubscriber.objects.filter(
                        workspace__slug=slug,
                        project_id=project_id,
                        issue_id=OuterRef("pk"),
                        subscriber=request.user,
                    )
                )
            )
        ).first()
        if not issue:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = IssueDetailSerializer(issue, expand=self.expand)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def archive(self, request, slug, project_id, pk=None):
        issue = Issue.issue_objects.get(
            workspace__slug=slug,
            project_id=project_id,
            pk=pk,
        )
        if issue.state.group not in ["completed", "cancelled"]:
            return Response(
                {
                    "error": "Can only archive completed or cancelled state group issue"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        issue_activity.delay(
            type="issue.activity.updated",
            requested_data=json.dumps(
                {
                    "archived_at": str(timezone.now().date()),
                    "automation": False,
                }
            ),
            actor_id=str(request.user.id),
            issue_id=str(issue.id),
            project_id=str(project_id),
            current_instance=json.dumps(
                IssueSerializer(issue).data, cls=DjangoJSONEncoder
            ),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        issue.archived_at = timezone.now().date()
        issue.save()

        return Response(
            {"archived_at": str(issue.archived_at)}, status=status.HTTP_200_OK
        )

    def unarchive(self, request, slug, project_id, pk=None):
        issue = Issue.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            archived_at__isnull=False,
            pk=pk,
        )
        issue_activity.delay(
            type="issue.activity.updated",
            requested_data=json.dumps({"archived_at": None}),
            actor_id=str(request.user.id),
            issue_id=str(issue.id),
            project_id=str(project_id),
            current_instance=json.dumps(
                IssueSerializer(issue).data, cls=DjangoJSONEncoder
            ),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        issue.archived_at = None
        issue.save()

        return Response(status=status.HTTP_204_NO_CONTENT)
