# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import (
    Exists,
    F,
    Func,
    OuterRef,
    Q,
    UUIDField,
    Value,
)
from django.db.models.functions import Coalesce
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page
from django.db import transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import (
    allow_permission,
    ROLE,
)
from plane.app.serializers import (
    IssueViewSerializer,
)
from plane.db.models import (
    Issue,
    IssueAttachment,
    IssueLink,
    IssueView,
    Workspace,
    WorkspaceMember,
    ProjectMember,
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
from plane.bgtasks.recent_visited_task import recent_visited_task
from .. import BaseViewSet
from plane.db.models import (
    UserFavorite,
)


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
            .select_related("workspace")
            .order_by(self.request.GET.get("order_by", "-created_at"))
            .distinct()
        )

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST],
        level="WORKSPACE",
    )
    def list(self, request, slug):
        queryset = self.get_queryset()
        fields = [
            field
            for field in request.GET.get("fields", "").split(",")
            if field
        ]
        if WorkspaceMember.objects.filter(
            workspace__slug=slug,
            member=request.user,
            role=5,
            is_active=True,
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
                pk=pk,
                workspace__slug=slug,
            )

            if workspace_view.is_locked:
                return Response(
                    {"error": "view is locked"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Only update the view if owner is updating
            if workspace_view.owned_by_id != request.user.id:
                return Response(
                    {
                        "error": "Only the owner of the view can update the view"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = IssueViewSerializer(
                workspace_view, data=request.data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

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
        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @allow_permission(
        allowed_roles=[],
        level="WORKSPACE",
        creator=True,
        model=IssueView,
    )
    def destroy(self, request, slug, pk):
        workspace_view = IssueView.objects.get(
            pk=pk,
            workspace__slug=slug,
        )

        workspace_member = WorkspaceMember.objects.filter(
            workspace__slug=slug,
            member=request.user,
            role=20,
            is_active=True,
        )
        if (
            workspace_member.exists()
            or workspace_view.owned_by == request.user
        ):
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
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
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
                        filter=~Q(issue_module__module_id__isnull=True)
                        & Q(issue_module__module__archived_at__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
        )

    @method_decorator(gzip_page)
    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST],
        level="WORKSPACE",
    )
    def list(self, request, slug):
        filters = issue_filters(request.query_params, "GET")
        order_by_param = request.GET.get("order_by", "-created_at")

        issue_queryset = (
            self.get_queryset()
            .filter(**filters)
            .annotate(cycle_id=F("issue_cycle__cycle_id"))
        )

        # check for the project member role, if the role is 5 then check for the guest_view_all_features if it is true then show all the issues else show only the issues created by the user

        issue_queryset = issue_queryset.filter(
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
            # For other roles (role < 5), show all issues
            Q(project__project_projectmember__role__gt=5),
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
        )

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
            # Check group and sub group value paginate
            if sub_group_by:
                if group_by == sub_group_by:
                    return Response(
                        {
                            "error": "Group by and sub group by cannot have same parameters"
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                else:
                    # group and sub group pagination
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
                            project_id=None,
                            filters=filters,
                        ),
                        sub_group_by_fields=issue_group_values(
                            field=sub_group_by,
                            slug=slug,
                            project_id=None,
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
            # Group Paginate
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
                        project_id=None,
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
            # List Paginate
            return self.paginate(
                order_by=order_by_param,
                request=request,
                queryset=issue_queryset,
                on_results=lambda issues: issue_on_results(
                    group_by=group_by, issues=issues, sub_group_by=sub_group_by
                ),
            )


class IssueViewViewSet(BaseViewSet):
    serializer_class = IssueViewSerializer
    model = IssueView

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            owned_by=self.request.user,
        )

    def get_queryset(self):
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

    allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])

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
        ):
            queryset = queryset.filter(owned_by=request.user)
        fields = [
            field
            for field in request.GET.get("fields", "").split(",")
            if field
        ]
        views = IssueViewSerializer(
            queryset, many=True, fields=fields if fields else None
        ).data
        return Response(views, status=status.HTTP_200_OK)

    allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])

    def retrieve(self, request, slug, project_id, pk):
        issue_view = (
            self.get_queryset().filter(pk=pk, project_id=project_id).first()
        )
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
        ):
            return Response(
                {"error": "You are not allowed to view this issue"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = IssueViewSerializer(issue_view)
        recent_visited_task.delay(
            slug=slug,
            project_id=project_id,
            entity_name="view",
            entity_identifier=pk,
            user_id=request.user.id,
        )
        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    allow_permission(allowed_roles=[], creator=True, model=IssueView)

    def partial_update(self, request, slug, project_id, pk):
        with transaction.atomic():
            issue_view = IssueView.objects.select_for_update().get(
                pk=pk, workspace__slug=slug, project_id=project_id
            )

            if issue_view.is_locked:
                return Response(
                    {"error": "view is locked"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Only update the view if owner is updating
            if issue_view.owned_by_id != request.user.id:
                return Response(
                    {
                        "error": "Only the owner of the view can update the view"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = IssueViewSerializer(
                issue_view, data=request.data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

    allow_permission(allowed_roles=[ROLE.ADMIN], creator=True, model=IssueView)

    def destroy(self, request, slug, project_id, pk):
        project_view = IssueView.objects.get(
            pk=pk,
            project_id=project_id,
            workspace__slug=slug,
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

    allow_permission([ROLE.ADMIN, ROLE.MEMBER])

    def create(self, request, slug, project_id):
        _ = UserFavorite.objects.create(
            user=request.user,
            entity_identifier=request.data.get("view"),
            entity_type="view",
            project_id=project_id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    allow_permission([ROLE.ADMIN, ROLE.MEMBER])

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
