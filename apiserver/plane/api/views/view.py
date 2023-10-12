# Django imports
from django.db.models import (
    Prefetch,
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
from django.db import IntegrityError
from django.db.models import Prefetch, OuterRef, Exists

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from . import BaseViewSet, BaseAPIView
from plane.api.serializers import (
    GlobalViewSerializer,
    IssueViewSerializer,
    IssueLiteSerializer,
    IssueViewFavoriteSerializer,
)
from plane.api.permissions import WorkspaceEntityPermission, ProjectEntityPermission
from plane.db.models import (
    Workspace,
    GlobalView,
    IssueView,
    Issue,
    IssueViewFavorite,
    IssueReaction,
    IssueLink,
    IssueAttachment,
)
from plane.utils.issue_filters import issue_filters
from plane.utils.grouper import group_results


class GlobalViewViewSet(BaseViewSet):
    serializer_class = GlobalViewSerializer
    model = GlobalView
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
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("project")
            .select_related("workspace")
            .select_related("state")
            .select_related("parent")
            .prefetch_related("assignees")
            .prefetch_related("labels")
            .prefetch_related(
                Prefetch(
                    "issue_reactions",
                    queryset=IssueReaction.objects.select_related("actor"),
                )
            )
        )

        
    @method_decorator(gzip_page)
    def list(self, request, slug):
        try:
            filters = issue_filters(request.query_params, "GET")

            # Custom ordering for priority and state
            priority_order = ["urgent", "high", "medium", "low", "none"]
            state_order = ["backlog", "unstarted", "started", "completed", "cancelled"]

            order_by_param = request.GET.get("order_by", "-created_at")

            issue_queryset = (
                self.get_queryset()
                .filter(**filters)
                .filter(project__project_projectmember__member=self.request.user)
                .annotate(cycle_id=F("issue_cycle__cycle_id"))
                .annotate(module_id=F("issue_module__module_id"))
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
            )

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
                    "-max_values" if order_by_param.startswith("-") else "max_values"
                )
            else:
                issue_queryset = issue_queryset.order_by(order_by_param)

            issues = IssueLiteSerializer(issue_queryset, many=True).data

            ## Grouping the results
            group_by = request.GET.get("group_by", False)
            sub_group_by = request.GET.get("sub_group_by", False)
            if sub_group_by and sub_group_by == group_by:
                return Response(
                    {"error": "Group by and sub group by cannot be same"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            if group_by:
                return Response(
                    group_results(issues, group_by, sub_group_by), status=status.HTTP_200_OK
                )

            return Response(issues, status=status.HTTP_200_OK)

        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


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
        try:
            serializer = IssueViewFavoriteSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(user=request.user, project_id=project_id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"error": "The view is already added to favorites"},
                    status=status.HTTP_410_GONE,
                )
            else:
                capture_exception(e)
                return Response(
                    {"error": "Something went wrong please try again later"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def destroy(self, request, slug, project_id, view_id):
        try:
            view_favourite = IssueViewFavorite.objects.get(
                project=project_id,
                user=request.user,
                workspace__slug=slug,
                view_id=view_id,
            )
            view_favourite.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except IssueViewFavorite.DoesNotExist:
            return Response(
                {"error": "View is not in favorites"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
