# Python imports
import json

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import (
    Case,
    CharField,
    Exists,
    F,
    Func,
    Max,
    OuterRef,
    Prefetch,
    Q,
    UUIDField,
    Value,
    When,
)
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ProjectEntityPermission
from plane.app.serializers import (
    IssueCreateSerializer,
    IssueDetailSerializer,
    IssueFlatSerializer,
    IssueSerializer,
)
from plane.bgtasks.issue_activites_task import issue_activity
from plane.db.models import (
    Issue,
    IssueAttachment,
    IssueLink,
    IssueReaction,
    IssueSubscriber,
    Project,
)
from plane.utils.issue_filters import issue_filters
from plane.utils.user_timezone_converter import user_timezone_converter

# Module imports
from .. import BaseViewSet


class IssueDraftViewSet(BaseViewSet):
    permission_classes = [
        ProjectEntityPermission,
    ]
    serializer_class = IssueFlatSerializer
    model = Issue

    def get_queryset(self):
        return (
            Issue.objects.filter(project_id=self.kwargs.get("project_id"))
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(is_draft=True)
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
    def list(self, request, slug, project_id):
        filters = issue_filters(request.query_params, "GET")
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

        # Only use serializer when expand else return by values
        if self.expand or self.fields:
            issues = IssueSerializer(
                issue_queryset,
                many=True,
                fields=self.fields,
                expand=self.expand,
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

    def create(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id)

        serializer = IssueCreateSerializer(
            data=request.data,
            context={
                "project_id": project_id,
                "workspace_id": project.workspace_id,
                "default_assignee_id": project.default_assignee_id,
            },
        )

        if serializer.is_valid():
            serializer.save(is_draft=True)

            # Track the issue
            issue_activity.delay(
                type="issue_draft.activity.created",
                requested_data=json.dumps(
                    self.request.data, cls=DjangoJSONEncoder
                ),
                actor_id=str(request.user.id),
                issue_id=str(serializer.data.get("id", None)),
                project_id=str(project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            issue = (
                self.get_queryset().filter(pk=serializer.data["id"]).first()
            )
            return Response(
                IssueSerializer(issue).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, slug, project_id, pk):
        issue = self.get_queryset().filter(pk=pk).first()

        if not issue:
            return Response(
                {"error": "Issue does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = IssueCreateSerializer(
            issue, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            issue_activity.delay(
                type="issue_draft.activity.updated",
                requested_data=json.dumps(request.data, cls=DjangoJSONEncoder),
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("pk", None)),
                project_id=str(self.kwargs.get("project_id", None)),
                current_instance=json.dumps(
                    IssueSerializer(issue).data,
                    cls=DjangoJSONEncoder,
                ),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

    def destroy(self, request, slug, project_id, pk=None):
        issue = Issue.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk
        )
        issue.delete()
        issue_activity.delay(
            type="issue_draft.activity.deleted",
            requested_data=json.dumps({"issue_id": str(pk)}),
            actor_id=str(request.user.id),
            issue_id=str(pk),
            project_id=str(project_id),
            current_instance={},
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
