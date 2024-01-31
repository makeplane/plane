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
    Q,
)
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from . import BaseViewSet
from plane.app.serializers import (
    ViewSerializer,
    IssueSerializer,
    ViewFavoriteSerializer,
)
from plane.app.permissions import (
    WorkspaceEntityPermission,
    ProjectEntityPermission,
)
from plane.db.models import (
    Workspace,
    View,
    Issue,
    ViewFavorite,
    IssueLink,
    IssueAttachment,
)
from plane.utils.issue_filters import issue_filters


class UserWorkspaceViewViewSet(BaseViewSet):
    serializer_class = ViewSerializer
    model = View
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def perform_create(self, serializer):
        workspace = Workspace.objects.get(slug=self.kwargs.get("slug"))
        serializer.save(
            workspace_id=workspace.id, access=0, owned_by=self.request.user
        )

    def get_queryset(self):
        subquery = ViewFavorite.objects.filter(
            user=self.request.user,
            view_id=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project__isnull=True)
            .filter(Q(owned_by=self.request.user) & Q(access=0))
            .select_related("workspace")
            .annotate(is_favorite=Exists(subquery))
            .order_by(self.request.GET.get("order_by", "-created_at"))
            .distinct()
        )

    def perform_update(self, serializer):
        view = View.objects.get(pk=self.kwargs.get("pk"))
        if view.is_locked:
            return Response(
                {"error": "You cannot update the view"},
                status=status.HTTP_403_FORBIDDEN,
            )
        if view.owned_by == self.request.user:
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(
            {"error": "You cannot update the view"},
            status=status.HTTP_403_FORBIDDEN,
        )

    def lock(self, request, slug, pk):
        view = View.objects.get(pk=pk, workspace__slug=slug)
        if view.owned_by != self.request.user:
            return Response(
                {"error": "You cannot lock the view"},
                status=status.HTTP_403_FORBIDDEN,
            )
        view.is_locked = True
        view.save()
        return Response(status=status.HTTP_200_OK)

    def unlock(self, request, slug, pk):
        view = View.objects.get(pk=pk, workspace__slug=slug)
        if view.owned_by != self.request.user:
            return Response(
                {"error": "You cannot un lock the view"},
                status=status.HTTP_403_FORBIDDEN,
            )
        view.is_locked = False
        view.save()
        return Response(status=status.HTTP_200_OK)

    def destroy(self, request, slug, pk):
        view = View.objects.get(workspace__slug=slug, pk=pk)
        if view.owned_by != self.request.user:
            return Response(
                {"error": "You cannot delete the view"},
                status=status.HTTP_403_FORBIDDEN,
            )
        view.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceViewViewSet(BaseViewSet):
    serializer_class = ViewSerializer
    model = View
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def perform_create(self, serializer):
        workspace = Workspace.objects.get(slug=self.kwargs.get("slug"))
        serializer.save(workspace_id=workspace.id, owned_by=self.request.user)

    def get_queryset(self):
        subquery = ViewFavorite.objects.filter(
            user=self.request.user,
            view_id=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project__isnull=True)
            .filter(Q(access=1))
            .select_related("workspace")
            .annotate(is_favorite=Exists(subquery))
            .order_by(self.request.GET.get("order_by", "-created_at"))
            .distinct()
        )

    def lock(self, request, slug, pk):
        view = View.objects.get(pk=pk, workspace__slug=slug)
        if view.owned_by != self.request.user:
            return Response(
                {"error": "You cannot lock the view"},
                status=status.HTTP_403_FORBIDDEN,
            )
        view.is_locked = True
        view.save()
        return Response(status=status.HTTP_200_OK)

    def unlock(self, request, slug, pk):
        view = View.objects.get(pk=pk, workspace__slug=slug)
        if view.owned_by != self.request.user:
            return Response(
                {"error": "You cannot un lock the view"},
                status=status.HTTP_403_FORBIDDEN,
            )
        view.is_locked = False
        view.save()
        return Response(status=status.HTTP_200_OK)


class UserProjectViewViewSet(BaseViewSet):
    serializer_class = ViewSerializer
    model = View
    permission_classes = [
        ProjectEntityPermission,
    ]

    def perform_create(self, serializer):
        workspace = Workspace.objects.get(slug=self.kwargs.get("slug"))
        serializer.save(
            workspace_id=workspace.id,
            project_id=self.kwargs.get("project_id"),
            access=0,
            owned_by=self.request.user,
        )

    def get_queryset(self):
        subquery = ViewFavorite.objects.filter(
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
            .filter(Q(owned_by=self.request.user) & Q(access=0))
            .select_related("workspace")
            .annotate(is_favorite=Exists(subquery))
            .order_by(self.request.GET.get("order_by", "-created_at"))
            .distinct()
        )

    def perform_update(self, serializer):
        view = View.objects.get(pk=self.kwargs.get("pk"))
        if view.owned_by == self.request.user:
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(
            {"error": "You cannot update the view"},
            status=status.HTTP_403_FORBIDDEN,
        )

    def destroy(self, request, slug, project_id, pk):
        view = View.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk
        )
        if view.owned_by != self.request.user:
            return Response(
                {"error": "You cannot delete the view"},
                status=status.HTTP_403_FORBIDDEN,
            )
        view.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def lock(self, request, slug, pk):
        view = View.objects.get(pk=pk, workspace__slug=slug)
        if view.owned_by != self.request.user:
            return Response(
                {"error": "You cannot lock the view"},
                status=status.HTTP_403_FORBIDDEN,
            )
        view.is_locked = True
        view.save()
        return Response(status=status.HTTP_200_OK)

    def unlock(self, request, slug, pk):
        view = View.objects.get(pk=pk, workspace__slug=slug)
        if view.owned_by != self.request.user:
            return Response(
                {"error": "You cannot un lock the view"},
                status=status.HTTP_403_FORBIDDEN,
            )
        view.is_locked = False
        view.save()
        return Response(status=status.HTTP_200_OK)


class ProjectViewViewSet(BaseViewSet):
    serializer_class = ViewSerializer
    model = View
    permission_classes = [
        ProjectEntityPermission,
    ]

    def perform_create(self, serializer):
        workspace = Workspace.objects.get(slug=self.kwargs.get("slug"))
        serializer.save(
            workspace_id=workspace.id,
            project_id=self.kwargs.get("project_id"),
            owned_by=self.request.user,
        )

    def get_queryset(self):
        subquery = ViewFavorite.objects.filter(
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
            .filter(Q(access=1))
            .select_related("workspace")
            .annotate(is_favorite=Exists(subquery))
            .order_by(self.request.GET.get("order_by", "-created_at"))
            .distinct()
        )

    def lock(self, request, slug, pk):
        view = View.objects.get(pk=pk, workspace__slug=slug)
        if view.owned_by != self.request.user:
            return Response(
                {"error": "You cannot lock the view"},
                status=status.HTTP_403_FORBIDDEN,
            )
        view.is_locked = True
        view.save()
        return Response(status=status.HTTP_200_OK)

    def unlock(self, request, slug, pk):
        view = View.objects.get(pk=pk, workspace__slug=slug)
        if view.owned_by != self.request.user:
            return Response(
                {"error": "You cannot un lock the view"},
                status=status.HTTP_403_FORBIDDEN,
            )
        view.is_locked = False
        view.save()
        return Response(status=status.HTTP_200_OK)


class WorkspaceViewIssuesViewSet(BaseViewSet):
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
            .filter(project__project_projectmember__member=self.request.user)
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
        )

    @method_decorator(gzip_page)
    def list(self, request, slug):
        filters = issue_filters(request.query_params, "GET")
        fields = [
            field
            for field in request.GET.get("fields", "").split(",")
            if field
        ]

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

        issue_queryset = (self.get_queryset().filter(**filters))

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

        serializer = IssueSerializer(
            issue_queryset, many=True, fields=fields if fields else None
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class ViewFavoriteViewSet(BaseViewSet):
    serializer_class = ViewFavoriteSerializer
    model = ViewFavorite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(user=self.request.user)
            .select_related("view")
        )

    def create(self, request, slug, project_id):
        serializer = ViewFavoriteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, project_id=project_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, slug, project_id, view_id):
        view_favorite = ViewFavorite.objects.get(
            project=project_id,
            user=request.user,
            workspace__slug=slug,
            view_id=view_id,
        )
        view_favorite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
