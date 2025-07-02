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
    DeployBoard,
)
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.issue_filters import issue_filters
from plane.utils.order_queryset import order_issue_queryset
from plane.bgtasks.recent_visited_task import recent_visited_task
from .. import BaseViewSet
from plane.db.models import UserFavorite
from plane.ee.utils.check_user_teamspace_member import (
    check_if_current_user_is_teamspace_member,
)
from plane.ee.models import CustomerRequestIssue


class WorkspaceViewViewSet(BaseViewSet):
    serializer_class = IssueViewSerializer
    model = IssueView

    def perform_create(self, serializer):
        workspace = Workspace.objects.get(slug=self.kwargs.get("slug"))
        serializer.save(workspace_id=workspace.id, owned_by=self.request.user)

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project__isnull=True)
            .filter(Q(owned_by=self.request.user) | Q(access=1))
            .exclude(team_spaces__isnull=False)
            .select_related("workspace")
            .order_by(self.request.GET.get("order_by", "-created_at"))
            .distinct()
        )

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE"
    )
    def list(self, request, slug):
        queryset = self.get_queryset()
        fields = [field for field in request.GET.get("fields", "").split(",") if field]
        if WorkspaceMember.objects.filter(
            workspace__slug=slug, member=request.user, role=5, is_active=True
        ).exists():
            queryset = queryset.filter(owned_by=request.user)
        views = IssueViewSerializer(
            queryset, many=True, fields=fields if fields else None
        ).data
        return Response(views, status=status.HTTP_200_OK)

    @allow_permission(
        allowed_roles=[], level="WORKSPACE", creator=True, model=IssueView
    )
    def partial_update(self, request, slug, pk):
        with transaction.atomic():
            workspace_view = IssueView.objects.select_for_update().get(
                pk=pk, workspace__slug=slug
            )

            if workspace_view.is_locked:
                return Response(
                    {"error": "view is locked"}, status=status.HTTP_400_BAD_REQUEST
                )

            # Only update the view if owner is updating
            if workspace_view.owned_by_id != request.user.id:
                return Response(
                    {"error": "Only the owner of the view can update the view"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = IssueViewSerializer(
                workspace_view, data=request.data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, slug, pk):
        issue_view = self.get_queryset().filter(pk=pk).first()
        serializer = IssueViewSerializer(issue_view)
        recent_visited_task.delay(
            slug=slug,
            project_id=None,
            entity_name="view",
            entity_identifier=pk,
            user_id=request.user.id,
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN], level="WORKSPACE", creator=True, model=IssueView
    )
    def destroy(self, request, slug, pk):
        workspace_view = IssueView.objects.get(pk=pk, workspace__slug=slug)

        workspace_member = WorkspaceMember.objects.filter(
            workspace__slug=slug, member=request.user, role=20, is_active=True
        )
        if workspace_member.exists() or workspace_view.owned_by == request.user:
            workspace_view.delete()
            # Delete the user favorite view
            UserFavorite.objects.filter(
                workspace__slug=slug,
                entity_identifier=pk,
                project__isnull=True,
                entity_type="view",
            ).delete()
        else:
            return Response(
                {"error": "Only admin or owner can delete the view"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceViewIssuesViewSet(BaseViewSet):
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

    def _validate_order_by_field(self, order_by_param):
        """
        Validate if the order_by parameter is a valid sortable field.
        Returns a tuple of (is_valid, sanitized_field)
        """
        # Remove the minus sign for validation
        field_name = order_by_param.lstrip("-")

        # Define valid sortable fields
        valid_fields = {
            # Direct fields
            "name",
            "priority",
            "sequence_id",
            "sort_order",
            "start_date",
            "target_date",
            "completed_at",
            "archived_at",
            "is_draft",
            "created_at",
            "updated_at",
            "point",
            # Related fields
            "state__name",
            "state__group",
            "type__name",
            "parent__name",
            "created_by__first_name",
            "updated_by__first_name",
            "estimate_point__name",
            # Many-to-many fields (handled specially in order_issue_queryset)
            "labels__name",
            "assignees__first_name",
            "issue_module__module__name",
            # Computed fields (annotated in get_queryset)
            "sub_issues_count",
            "attachment_count",
            "link_count",
            # Special fields handled by order_issue_queryset
            "priority",
            "state__group",
        }

        if field_name in valid_fields:
            return order_by_param
        else:
            return "-created_at"

    def get_queryset(self):
        return (
            Issue.issue_objects.annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("state")
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
            .accessible_to(self.request.user.id, self.kwargs.get("slug"))
        )

    @method_decorator(gzip_page)
    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE"
    )
    def list(self, request, slug):
        filters = issue_filters(request.query_params, "GET")
        order_by_param = request.GET.get("order_by", "-created_at")

        # Validate the order_by_param
        order_by_param = self._validate_order_by_field(order_by_param)

        issue_queryset = self.get_queryset().filter(**filters)

        # Get common project permission filters
        permission_filters = self._get_project_permission_filters()

        if check_workspace_feature_flag(
            feature_key=FeatureFlag.CUSTOMERS,
            slug=self.kwargs.get("slug"),
            user_id=str(self.request.user.id),
        ):
            issue_queryset = issue_queryset.prefetch_related(
                Prefetch(
                    "customer_request_issues",
                    queryset=CustomerRequestIssue.objects.all(),
                )
            )

        # Base query for the counts
        total_issue_count = (
            Issue.issue_objects.filter(**filters)
            .filter(workspace__slug=slug)
            .filter(permission_filters)
            .accessible_to(request.user.id, slug)
            .only("id")
        )

        # Apply project permission filters to the issue queryset
        issue_queryset = issue_queryset.filter(permission_filters)

        # Issue queryset
        issue_queryset, order_by_param = order_issue_queryset(
            issue_queryset=issue_queryset, order_by_param=order_by_param
        )

        # List Paginate
        return self.paginate(
            order_by=order_by_param,
            request=request,
            queryset=issue_queryset,
            on_results=lambda issues: ViewIssueListSerializer(
                issues, many=True, context={"slug": slug, "user_id": request.user.id}
            ).data,
            total_count_queryset=total_issue_count,
        )


class IssueViewViewSet(BaseViewSet):
    serializer_class = IssueViewSerializer
    model = IssueView

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"), owned_by=self.request.user
        )

    def get_queryset(self):
        subquery = UserFavorite.objects.filter(
            user=self.request.user,
            entity_identifier=OuterRef("pk"),
            entity_type="view",
            project_id=self.kwargs.get("project_id"),
            workspace__slug=self.kwargs.get("slug"),
        )
        queryset = self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__archived_at__isnull=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=1))
            .select_related("project")
            .select_related("workspace")
            .annotate(is_favorite=Exists(subquery))
            .annotate(
                anchor=DeployBoard.objects.filter(
                    entity_name="view",
                    entity_identifier=OuterRef("pk"),
                    project_id=self.kwargs.get("project_id"),
                    workspace__slug=self.kwargs.get("slug"),
                ).values("anchor")
            )
            .order_by("-is_favorite", "name")
            .distinct()
            .accessible_to(self.request.user.id, self.kwargs["slug"])
        )

        return queryset

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
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
            and not check_if_current_user_is_teamspace_member(
                request.user.id, slug, project_id
            )
        ):
            queryset = queryset.filter(owned_by=request.user)
        fields = [field for field in request.GET.get("fields", "").split(",") if field]
        views = IssueViewSerializer(
            queryset, many=True, fields=fields if fields else None
        ).data
        return Response(views, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def retrieve(self, request, slug, project_id, pk):
        issue_view = self.get_queryset().filter(pk=pk, project_id=project_id).first()
        project = Project.objects.get(id=project_id)
        """
        if the role is guest and guest_view_all_features is false and owned by is not 
        the requesting user then dont show the view
        """

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
            and not check_if_current_user_is_teamspace_member(
                request.user.id, slug, project_id
            )
        ):
            return Response(
                {"error": "You are not allowed to view this issue"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = IssueViewSerializer(issue_view)
        recent_visited_task.delay(
            slug=slug,
            project_id=project_id,
            entity_name="view",
            entity_identifier=pk,
            user_id=request.user.id,
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[], creator=True, model=IssueView)
    def partial_update(self, request, slug, project_id, pk):
        with transaction.atomic():
            issue_view = IssueView.objects.select_for_update().get(
                pk=pk, workspace__slug=slug, project_id=project_id
            )

            if issue_view.is_locked:
                return Response(
                    {"error": "view is locked"}, status=status.HTTP_400_BAD_REQUEST
                )

            # Only update the view if owner is updating
            if issue_view.owned_by_id != request.user.id:
                return Response(
                    {"error": "Only the owner of the view can update the view"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = IssueViewSerializer(
                issue_view, data=request.data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=IssueView)
    def destroy(self, request, slug, project_id, pk):
        project_view = IssueView.objects.get(
            pk=pk, project_id=project_id, workspace__slug=slug
        )
        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=20,
                is_active=True,
            ).exists()
            or project_view.owned_by_id == request.user.id
        ):
            project_view.delete()
            # Delete the user favorite view
            UserFavorite.objects.filter(
                project_id=project_id,
                workspace__slug=slug,
                entity_identifier=pk,
                entity_type="view",
            ).delete()
            # Delete the page from recent visit
            UserRecentVisit.objects.filter(
                project_id=project_id,
                workspace__slug=slug,
                entity_identifier=pk,
                entity_name="view",
            ).delete(soft=False)
            # Delete the view from the deploy board
            DeployBoard.objects.filter(
                entity_name="view",
                entity_identifier=pk,
                project_id=project_id,
                workspace__slug=slug,
            ).delete()
        else:
            return Response(
                {"error": "Only admin or owner can delete the view"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueViewFavoriteViewSet(BaseViewSet):
    model = UserFavorite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(user=self.request.user)
            .select_related("view")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        _ = UserFavorite.objects.create(
            user=request.user,
            entity_identifier=request.data.get("view"),
            entity_type="view",
            project_id=project_id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, view_id):
        view_favorite = UserFavorite.objects.get(
            project=project_id,
            user=request.user,
            workspace__slug=slug,
            entity_type="view",
            entity_identifier=view_id,
        )
        view_favorite.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)
