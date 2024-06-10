# Python imports
import json

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import (
    Exists,
    F,
    Func,
    OuterRef,
    Prefetch,
    Q,
    UUIDField,
    Value,
)
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import (
    ProjectEntityPermission,
    ProjectLitePermission,
)
from plane.app.serializers import (
    IssueCreateSerializer,
    IssueDetailSerializer,
    IssuePropertySerializer,
    IssueSerializer,
)
from plane.bgtasks.issue_activites_task import issue_activity
from plane.db.models import (
    Issue,
    IssueAttachment,
    IssueLink,
    IssueProperty,
    IssueReaction,
    IssueSubscriber,
    Project,
)
from plane.utils.grouper import (
    issue_group_values,
    issue_on_results,
    issue_queryset_grouper,
)
from plane.utils.issue_filters import issue_filters
from plane.utils.order_queryset import order_issue_queryset
from plane.utils.paginator import (
    GroupedOffsetPaginator,
    SubGroupedOffsetPaginator,
)
from .. import BaseAPIView, BaseViewSet
from plane.utils.user_timezone_converter import user_timezone_converter

# Module imports


class IssueListEndpoint(BaseAPIView):

    permission_classes = [
        ProjectEntityPermission,
    ]

    def get(self, request, slug, project_id):
        issue_ids = request.GET.get("issues", False)

        if not issue_ids:
            return Response(
                {"error": "Issues are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issue_ids = [
            issue_id for issue_id in issue_ids.split(",") if issue_id != ""
        ]

        queryset = (
            Issue.issue_objects.filter(
                workspace__slug=slug, project_id=project_id, pk__in=issue_ids
            )
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
        ).distinct()

        filters = issue_filters(request.query_params, "GET")

        order_by_param = request.GET.get("order_by", "-created_at")
        issue_queryset = queryset.filter(**filters)
        # Issue queryset
        issue_queryset, _ = order_issue_queryset(
            issue_queryset=issue_queryset,
            order_by_param=order_by_param,
        )

        # Group by
        group_by = request.GET.get("group_by", False)
        sub_group_by = request.GET.get("sub_group_by", False)

        # issue queryset
        issue_queryset = issue_queryset_grouper(
            queryset=issue_queryset,
            group_by=group_by,
            sub_group_by=sub_group_by,
        )

        if self.fields or self.expand:
            issues = IssueSerializer(
                queryset, many=True, fields=self.fields, expand=self.expand
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


class IssueViewSet(BaseViewSet):
    def get_serializer_class(self):
        return (
            IssueCreateSerializer
            if self.action in ["create", "update", "partial_update"]
            else IssueSerializer
        )

    model = Issue
    webhook_event = "issue"
    permission_classes = [
        ProjectEntityPermission,
    ]

    search_fields = [
        "name",
    ]

    filterset_fields = [
        "state__name",
        "assignees__id",
        "workspace__id",
    ]

    def get_queryset(self):
        return (
            Issue.issue_objects.filter(
                project_id=self.kwargs.get("project_id")
            )
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
        ).distinct()

    @method_decorator(gzip_page)
    def list(self, request, slug, project_id):
        filters = issue_filters(request.query_params, "GET")
        order_by_param = request.GET.get("order_by", "-created_at")

        issue_queryset = self.get_queryset().filter(**filters)
        # Custom ordering for priority and state

        # Issue queryset
        issue_queryset, order_by_param = order_issue_queryset(
            issue_queryset=issue_queryset,
            order_by_param=order_by_param,
        )

        # Group by
        group_by = request.GET.get("group_by", False)
        sub_group_by = request.GET.get("sub_group_by", False)

        # issue queryset
        issue_queryset = issue_queryset_grouper(
            queryset=issue_queryset,
            group_by=group_by,
            sub_group_by=sub_group_by,
        )

        if group_by:
            if sub_group_by:
                if group_by == sub_group_by:
                    return Response(
                        {
                            "error": "Group by and sub group by cannot have same parameters"
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                else:
                    return self.paginate(
                        request=request,
                        order_by=order_by_param,
                        queryset=issue_queryset,
                        on_results=lambda issues: issue_on_results(
                            group_by=group_by,
                            issues=issues,
                            sub_group_by=sub_group_by,
                        ),
                        paginator_cls=SubGroupedOffsetPaginator,
                        group_by_fields=issue_group_values(
                            field=group_by,
                            slug=slug,
                            project_id=project_id,
                            filters=filters,
                        ),
                        sub_group_by_fields=issue_group_values(
                            field=sub_group_by,
                            slug=slug,
                            project_id=project_id,
                            filters=filters,
                        ),
                        group_by_field_name=group_by,
                        sub_group_by_field_name=sub_group_by,
                        count_filter=Q(
                            Q(issue_inbox__status=1)
                            | Q(issue_inbox__status=-1)
                            | Q(issue_inbox__status=2)
                            | Q(issue_inbox__isnull=True),
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
            else:
                # Group paginate
                return self.paginate(
                    request=request,
                    order_by=order_by_param,
                    queryset=issue_queryset,
                    on_results=lambda issues: issue_on_results(
                        group_by=group_by,
                        issues=issues,
                        sub_group_by=sub_group_by,
                    ),
                    paginator_cls=GroupedOffsetPaginator,
                    group_by_fields=issue_group_values(
                        field=group_by,
                        slug=slug,
                        project_id=project_id,
                        filters=filters,
                    ),
                    group_by_field_name=group_by,
                    count_filter=Q(
                        Q(issue_inbox__status=1)
                        | Q(issue_inbox__status=-1)
                        | Q(issue_inbox__status=2)
                        | Q(issue_inbox__isnull=True),
                        archived_at__isnull=True,
                        is_draft=False,
                    ),
                )
        else:
            return self.paginate(
                order_by=order_by_param,
                request=request,
                queryset=issue_queryset,
                on_results=lambda issues: issue_on_results(
                    group_by=group_by, issues=issues, sub_group_by=sub_group_by
                ),
            )

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
            serializer.save()

            # Track the issue
            issue_activity.delay(
                type="issue.activity.created",
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
                issue_queryset_grouper(
                    queryset=self.get_queryset().filter(
                        pk=serializer.data["id"]
                    ),
                    group_by=None,
                    sub_group_by=None,
                )
                .values(
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
                .first()
            )
            datetime_fields = ["created_at", "updated_at"]
            issue = user_timezone_converter(
                issue, datetime_fields, request.user.user_timezone
            )
            return Response(issue, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, slug, project_id, pk=None):
        issue = (
            self.get_queryset()
            .filter(pk=pk)
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

    def partial_update(self, request, slug, project_id, pk=None):
        issue = self.get_queryset().filter(pk=pk).first()

        if not issue:
            return Response(
                {"error": "Issue not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        current_instance = json.dumps(
            IssueSerializer(issue).data, cls=DjangoJSONEncoder
        )

        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)
        serializer = IssueCreateSerializer(
            issue, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=requested_data,
                actor_id=str(request.user.id),
                issue_id=str(pk),
                project_id=str(project_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            issue = self.get_queryset().filter(pk=pk).first()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, slug, project_id, pk=None):
        issue = Issue.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk
        )
        issue.delete()
        issue_activity.delay(
            type="issue.activity.deleted",
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


class IssueUserDisplayPropertyEndpoint(BaseAPIView):
    permission_classes = [
        ProjectLitePermission,
    ]

    def patch(self, request, slug, project_id):
        issue_property = IssueProperty.objects.get(
            user=request.user,
            project_id=project_id,
        )

        issue_property.filters = request.data.get(
            "filters", issue_property.filters
        )
        issue_property.display_filters = request.data.get(
            "display_filters", issue_property.display_filters
        )
        issue_property.display_properties = request.data.get(
            "display_properties", issue_property.display_properties
        )
        issue_property.save()
        serializer = IssuePropertySerializer(issue_property)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request, slug, project_id):
        issue_property, _ = IssueProperty.objects.get_or_create(
            user=request.user, project_id=project_id
        )
        serializer = IssuePropertySerializer(issue_property)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BulkDeleteIssuesEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def delete(self, request, slug, project_id):
        issue_ids = request.data.get("issue_ids", [])

        if not len(issue_ids):
            return Response(
                {"error": "Issue IDs are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issues = Issue.issue_objects.filter(
            workspace__slug=slug, project_id=project_id, pk__in=issue_ids
        )

        total_issues = len(issues)

        issues.delete()

        return Response(
            {"message": f"{total_issues} issues were deleted"},
            status=status.HTTP_200_OK,
        )
