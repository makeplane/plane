# Django imports
from django.db.models import (
    Q,
    OuterRef,
    Func,
    F,
    Case,
    Value,
    CharField,
    When,
    Exists,
    Max,
)
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import Value, UUIDField
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import Value, UUIDField

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from . import BaseViewSet
from plane.app.serializers import (
    IssueViewSerializer,
    IssueSerializer,
    IssueViewFavoriteSerializer,
)
from plane.app.permissions import (
    WorkspaceEntityPermission,
    ProjectEntityPermission,
)
from plane.db.models import (
    Workspace,
    IssueView,
    Issue,
    IssueViewFavorite,
    IssueLink,
    IssueAttachment,
)
from plane.utils.issue_filters import issue_filters
from plane.utils.order_queryset import order_issue_queryset


class GlobalViewViewSet(BaseViewSet):
    serializer_class = IssueViewSerializer
    model = IssueView
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def perform_create(self, serializer):
        workspace = Workspace.objects.get(slug=self.kwargs.get("slug"))
        serializer.save(workspace_id=workspace.id)

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project__isnull=True)
            .select_related("workspace")
            .order_by(self.request.GET.get("order_by", "-created_at"))
            .distinct()
        )


class GlobalViewIssuesViewSet(BaseViewSet):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def get_queryset(self):
        return (
            Issue.issue_objects.annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
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
                        filter=~Q(assignees__id__isnull=True),
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
    def list(self, request, slug):
        filters = issue_filters(request.query_params, "GET")
        order_by_param = request.GET.get("order_by", "-created_at")

        issue_queryset = (
            self.get_queryset()
            .filter(**filters)
            .filter(project__project_projectmember__member=self.request.user)
            .annotate(cycle_id=F("issue_cycle__cycle_id"))
        )
        issue_queryset = order_issue_queryset(
            issue_queryset=issue_queryset, order_by_param=order_by_param
        )

        def on_results(issues):
            if self.expand or self.fields:
                return IssueSerializer(
                    issues, many=True, expand=self.expand, fields=self.fields
                ).data
            return issues.values(
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

        if request.GET.get("layout", "spreadsheet") in [
            "layout",
            "spreadsheet",
        ]:
            return self.paginate(
                request=request,
                queryset=issue_queryset,
                on_results=on_results
            )
        return on_results(issues=issue_queryset)


class IssueViewViewSet(BaseViewSet):
    serializer_class = IssueViewSerializer
    model = IssueView
    permission_classes = [
        ProjectEntityPermission,
    ]

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))

    def get_queryset(self):
        subquery = IssueViewFavorite.objects.filter(
            user=self.request.user,
            view_id=OuterRef("pk"),
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
            .annotate(is_favorite=Exists(subquery))
            .order_by("-is_favorite", "name")
            .distinct()
        )

    def list(self, request, slug, project_id):
        queryset = self.get_queryset()
        fields = [
            field
            for field in request.GET.get("fields", "").split(",")
            if field
        ]
        views = IssueViewSerializer(
            queryset, many=True, fields=fields if fields else None
        ).data
        return Response(views, status=status.HTTP_200_OK)


class IssueViewFavoriteViewSet(BaseViewSet):
    serializer_class = IssueViewFavoriteSerializer
    model = IssueViewFavorite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(user=self.request.user)
            .select_related("view")
        )

    def create(self, request, slug, project_id):
        serializer = IssueViewFavoriteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, project_id=project_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, slug, project_id, view_id):
        view_favourite = IssueViewFavorite.objects.get(
            project=project_id,
            user=request.user,
            workspace__slug=slug,
            view_id=view_id,
        )
        view_favourite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
