# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import copy

# Django imports
from django.db.models import (
    Exists,
    F,
    Func,
    OuterRef,
    Q,
    Subquery,
    Prefetch,
)
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page
from django.db import transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import IssueViewSerializer, ViewIssueListSerializer
from plane.app.serializers.favorite import get_favorite_entities
from plane.db.models import (
    Issue,
    FileAsset,
    IssueLink,
    IssueView,
    Workspace,
    WorkspaceMember,
    ProjectMember,
    Project,
    CycleIssue,
    UserRecentVisit,
    IssueAssignee,
    IssueLabel,
    ModuleIssue,
)
from plane.utils.issue_filters import issue_filters
from plane.utils.order_queryset import VIEW_ORDER_BY_ALLOWLIST, order_issue_queryset, sanitize_order_by
from plane.bgtasks.recent_visited_task import recent_visited_task
from plane.utils.exception_logger import log_exception
from .. import BaseViewSet
from plane.db.models import UserFavorite
from plane.utils.filters import ComplexFilterBackend
from plane.utils.filters import IssueFilterSet


def _is_owner_unlock_request(issue_view, request):
    """Allow only the owner to submit a standalone boolean unlock."""
    return (
        issue_view.owned_by_id == request.user.id
        and set(request.data.keys()) == {"is_locked"}
        and request.data.get("is_locked") is False
    )


class WorkspaceViewViewSet(BaseViewSet):
    """Manage workspace-level saved views."""

    serializer_class = IssueViewSerializer
    model = IssueView

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def create(self, request, slug):
        """Create a workspace-level saved view."""
        # Creating a workspace view requires active workspace membership, with
        # the same roles as list(). perform_create is a save hook, not a check.
        return super().create(request, slug=slug)

    def perform_create(self, serializer):
        """Assign the workspace and owner to a new saved view."""
        workspace = Workspace.objects.get(slug=self.kwargs.get("slug"))
        serializer.save(workspace_id=workspace.id, owned_by=self.request.user)

    def get_queryset(self):
        """Return the current user's saved-view records in this workspace."""
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project__isnull=True)
            .filter(Q(owned_by=self.request.user) | Q(access=1))
            .order_by(
                sanitize_order_by(
                    self.request.GET.get("order_by", "-created_at"),
                    VIEW_ORDER_BY_ALLOWLIST,
                    "-created_at",
                )
            )
            .distinct()
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug):
        """List the saved views visible to the requesting workspace member."""
        queryset = self.get_queryset()
        fields = [field for field in request.GET.get("fields", "").split(",") if field]
        if WorkspaceMember.objects.filter(workspace__slug=slug, member=request.user, role=5, is_active=True).exists():
            queryset = queryset.filter(owned_by=request.user)
        views = IssueViewSerializer(queryset, many=True, fields=fields if fields else None).data
        return Response(views, status=status.HTTP_200_OK)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST],
        level="WORKSPACE",
        creator=True,
        model=IssueView,
    )
    def partial_update(self, request, slug, pk):
        """Update a workspace view owned by the requester."""
        with transaction.atomic():
            workspace_view = IssueView.objects.select_for_update(of=("self",)).filter(
                pk=pk, workspace__slug=slug, project__isnull=True
            ).first()
            if workspace_view is None:
                return Response(
                    {"error": "The required object does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if workspace_view.is_locked:
                if not _is_owner_unlock_request(workspace_view, request):
                    return Response({"error": "view is locked"}, status=status.HTTP_400_BAD_REQUEST)
                workspace_view.is_locked = False
                workspace_view.save(update_fields=["is_locked", "updated_at"])
                return Response(IssueViewSerializer(workspace_view).data, status=status.HTTP_200_OK)

            # Only update the view if owner is updating
            if workspace_view.owned_by_id != request.user.id:
                return Response(
                    {"error": "Only the owner of the view can update the view"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = IssueViewSerializer(workspace_view, data=request.data, partial=True)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def retrieve(self, request, slug, pk):
        """Retrieve a workspace view and record the recent visit."""
        # Requires workspace membership, matching list() above.
        issue_view = self.get_queryset().filter(pk=pk).first()

        # get_queryset() is scoped to the URL workspace: a view outside it, or
        # no view at all, is a 404, as the other retrieve endpoints do.
        if issue_view is None:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # As in list(), a workspace GUEST sees only views they own. 404 rather
        # than 403, matching the missing-view branch above.
        if (
            WorkspaceMember.objects.filter(workspace__slug=slug, member=request.user, role=5, is_active=True).exists()
            and issue_view.owned_by_id != request.user.id
        ):
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = IssueViewSerializer(issue_view)
        try:
            recent_visited_task.delay(
                slug=slug,
                project_id=None,
                entity_name="view",
                entity_identifier=pk,
                user_id=request.user.id,
            )
        except Exception as exc:
            log_exception(exc)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE", creator=True, model=IssueView)
    def destroy(self, request, slug, pk):
        """Delete a workspace view and its metadata atomically."""
        with transaction.atomic():
            workspace_view = IssueView.objects.select_for_update(of=("self",)).get(
                pk=pk, workspace__slug=slug, project__isnull=True
            )

            workspace_member = WorkspaceMember.objects.filter(
                workspace__slug=slug, member=request.user, role=20, is_active=True
            )
            if not (workspace_member.exists() or workspace_view.owned_by_id == request.user.id):
                return Response(
                    {"error": "Only admin or owner can delete the view"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Keep deletion and metadata cleanup in the same transaction and use
            # the lock shared with recent_visited_task.
            UserFavorite.objects.filter(
                workspace__slug=slug,
                entity_identifier=pk,
                project__isnull=True,
                entity_type="view",
            ).delete()
            UserRecentVisit.objects.filter(
                workspace__slug=slug,
                entity_identifier=pk,
                project__isnull=True,
                entity_name="view",
            ).delete(soft=False)
            workspace_view.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceViewIssuesViewSet(BaseViewSet):
    """List issues using a workspace saved view's filter configuration."""

    filter_backends = (ComplexFilterBackend,)
    filterset_class = IssueFilterSet

    def _get_project_permission_filters(self):
        """
        Get common project permission filters for guest users and role-based access control.
        Returns Q object for filtering issues based on user role and project settings.
        """
        return Q(
            Q(
                project__project_projectmember__role=5,
                project__guest_view_all_features=True,
            )
            | Q(
                project__project_projectmember__role=5,
                project__guest_view_all_features=False,
                created_by=self.request.user,
            )
            |
            # For other roles (role > 5), show all issues
            Q(project__project_projectmember__role__gt=5),
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
        )

    def apply_annotations(self, issues):
        """Add issue counts and prefetched relations to the queryset."""
        return (
            issues.annotate(
                cycle_id=Subquery(
                    CycleIssue.objects.filter(issue=OuterRef("id"), deleted_at__isnull=True).values("cycle_id")[:1]
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
            .prefetch_related(
                Prefetch(
                    "issue_assignee",
                    queryset=IssueAssignee.objects.all(),
                )
            )
            .prefetch_related(
                Prefetch(
                    "label_issue",
                    queryset=IssueLabel.objects.all(),
                )
            )
            .prefetch_related(
                Prefetch(
                    "issue_module",
                    queryset=ModuleIssue.objects.all(),
                )
            )
        )

    def get_queryset(self):
        """Return issues scoped to the requested workspace."""
        return Issue.issue_objects.filter(workspace__slug=self.kwargs.get("slug"))

    @method_decorator(gzip_page)
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug):
        """List issues visible through the saved workspace view."""
        issue_queryset = self.get_queryset()

        # Apply filtering from filterset
        issue_queryset = self.filter_queryset(issue_queryset)

        order_by_param = request.GET.get("order_by", "-created_at")

        # Apply legacy filters
        filters = issue_filters(request.query_params, "GET")
        issue_queryset = issue_queryset.filter(**filters)

        # Get common project permission filters
        permission_filters = self._get_project_permission_filters()
        # Apply project permission filters to the issue queryset
        issue_queryset = issue_queryset.filter(permission_filters)

        # Base query for the counts
        total_issue_count_queryset = copy.deepcopy(issue_queryset)
        total_issue_count_queryset = total_issue_count_queryset.only("id")

        # Apply annotations to the issue queryset
        issue_queryset = self.apply_annotations(issue_queryset)

        # Issue queryset
        issue_queryset, order_by_param = order_issue_queryset(
            issue_queryset=issue_queryset, order_by_param=order_by_param
        )

        # List Paginate
        return self.paginate(
            order_by=order_by_param,
            request=request,
            queryset=issue_queryset,
            on_results=lambda issues: ViewIssueListSerializer(issues, many=True).data,
            total_count_queryset=total_issue_count_queryset,
        )


class IssueViewViewSet(BaseViewSet):
    """Manage project-level saved views."""

    serializer_class = IssueViewSerializer
    model = IssueView

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def create(self, request, slug, project_id):
        """Create a project-level saved view only while the parent project is active."""
        with transaction.atomic():
            project = Project.objects.select_for_update(no_key=True, of=("self",)).filter(
                pk=project_id, workspace__slug=slug
            ).first()
            if project is None or project.archived_at is not None:
                return Response(
                    {"error": "The required object does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return super().create(request, slug=slug, project_id=project_id)

    def perform_create(self, serializer):
        """Assign the project and owner to a new saved view."""
        serializer.save(project_id=self.kwargs.get("project_id"), owned_by=self.request.user)

    def get_queryset(self):
        """Return saved views accessible in the requested project."""
        subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_identifier=OuterRef("pk"),
            entity_type="view",
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=1))
            .select_related("project")
            .select_related("workspace")
            .annotate(is_favorite=Exists(subquery))
            .order_by("-is_favorite", "name")
            .distinct()
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        """List the saved views available in the project."""
        queryset = self.get_queryset()
        project = Project.objects.get(id=project_id)
        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=5,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
        ):
            queryset = queryset.filter(owned_by=request.user)
        fields = [field for field in request.GET.get("fields", "").split(",") if field]
        views = IssueViewSerializer(queryset, many=True, fields=fields if fields else None).data
        return Response(views, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def retrieve(self, request, slug, project_id, pk):
        """Retrieve a project view and record the recent visit."""
        issue_view = self.get_queryset().filter(pk=pk, project_id=project_id).first()
        if issue_view is None:
            return Response(
                {"error": "The required object does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )
        project = Project.objects.get(id=project_id)

        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=5,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
            and not issue_view.owned_by == request.user
        ):
            return Response(
                {"error": "You are not allowed to view this issue"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = IssueViewSerializer(issue_view)
        try:
            recent_visited_task.delay(
                slug=slug,
                project_id=project_id,
                entity_name="view",
                entity_identifier=pk,
                user_id=request.user.id,
            )
        except Exception as exc:
            log_exception(exc)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST],
        creator=True,
        model=IssueView,
    )
    def partial_update(self, request, slug, project_id, pk):
        """Update an active-project view owned by the requester."""
        with transaction.atomic():
            project = Project.objects.select_for_update(no_key=True, of=("self",)).filter(
                pk=project_id, workspace__slug=slug
            ).first()
            if project is None or project.archived_at is not None:
                return Response(
                    {"error": "The required object does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            issue_view = IssueView.objects.select_for_update(of=("self",)).filter(
                pk=pk,
                workspace__slug=slug,
                project_id=project_id,
                project__archived_at__isnull=True,
            ).first()
            if issue_view is None:
                return Response(
                    {"error": "The required object does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if issue_view.is_locked:
                if not _is_owner_unlock_request(issue_view, request):
                    return Response({"error": "view is locked"}, status=status.HTTP_400_BAD_REQUEST)
                issue_view.is_locked = False
                issue_view.save(update_fields=["is_locked", "updated_at"])
                return Response(IssueViewSerializer(issue_view).data, status=status.HTTP_200_OK)

            if issue_view.owned_by_id != request.user.id:
                return Response(
                    {"error": "Only the owner of the view can update the view"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = IssueViewSerializer(issue_view, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=IssueView)
    def destroy(self, request, slug, project_id, pk):
        """Delete a project view only while its parent project is active."""
        with transaction.atomic():
            project = Project.objects.select_for_update(no_key=True, of=("self",)).filter(
                pk=project_id, workspace__slug=slug
            ).first()
            if project is None or project.archived_at is not None:
                return Response(
                    {"error": "The required object does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            project_view = IssueView.objects.select_for_update(of=("self",)).filter(
                pk=pk,
                project_id=project_id,
                workspace__slug=slug,
                project__archived_at__isnull=True,
            ).first()
            if project_view is None:
                return Response(
                    {"error": "The required object does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            is_admin = ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=ROLE.ADMIN.value,
                is_active=True,
            ).exists()
            if not (is_admin or project_view.owned_by_id == request.user.id):
                return Response(
                    {"error": "Only admin or owner can delete the view"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            UserFavorite.objects.filter(
                project_id=project_id,
                workspace__slug=slug,
                entity_identifier=pk,
                entity_type="view",
            ).delete()
            UserRecentVisit.objects.filter(
                project_id=project_id,
                workspace__slug=slug,
                entity_identifier=pk,
                entity_name="view",
            ).delete(soft=False)
            project_view.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueViewFavoriteViewSet(BaseViewSet):
    """Create and remove favorites for project saved views."""

    model = UserFavorite

    def get_queryset(self):
        """Return the current user's saved-view records in this workspace."""
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(user=self.request.user)
            .select_related("view")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        """Create a saved-view favorite while synchronizing with view deletion."""
        # Serialize favorite creation with view deletion, which locks the same row.
        with transaction.atomic():
            get_favorite_entities("view", request.user.id, project_id).select_for_update().get(
                pk=request.data.get("view"), workspace__slug=slug
            )
            UserFavorite.objects.create(
                user=request.user,
                entity_identifier=request.data.get("view"),
                entity_type="view",
                project_id=project_id,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, view_id):
        """Remove the current user's favorite for a project saved view."""
        view_favorite = UserFavorite.objects.get(
            project=project_id,
            user=request.user,
            workspace__slug=slug,
            entity_type="view",
            entity_identifier=view_id,
        )
        view_favorite.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)
