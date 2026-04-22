# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import copy
from types import SimpleNamespace

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Coalesce
from django.db.models import (
    Exists,
    F,
    Func,
    OuterRef,
    Q,
    Subquery,
    UUIDField,
    Value,
)
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page
from django.db import transaction

# Third party imports
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

# Module imports
from plane.permissions import (
    AuthorizedListingView,
    can,
    WorkspacePermissions,
    WorkitemPermissions,
    WorkitemViewPermissions,
    WorkspaceWorkitemViewPermissions,
    PermissionMixin,
    PermissionContext,
    permission_engine,
)
from plane.app.serializers import IssueViewSerializer
from plane.db.models import (
    Issue,
    FileAsset,
    IssueLink,
    IssueView,
    Workspace,
    CycleIssue,
    UserRecentVisit,
    IssueAssignee,
    IssueLabel,
    ModuleIssue,
    DeployBoard,
    ReleaseWorkItem,
)
from plane.ee.models import MilestoneIssue
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.exception_logger import log_exception
from plane.utils.issue_filters import issue_filters
from plane.utils.order_queryset import order_issue_queryset
from plane.bgtasks.recent_visited_task import recent_visited_task
from .. import BaseViewSet
from plane.db.models import UserFavorite
from plane.utils.filters import ComplexFilterBackend
from plane.utils.pql import PQLFilterBackend
from plane.utils.filters import IssueFilterSet
from plane.utils.grouper import issue_on_results, issue_group_values
from plane.utils.paginator import GroupedOffsetPaginator, SubGroupedOffsetPaginator


class WorkspaceViewViewSet(PermissionMixin, BaseViewSet):
    use_read_replica = True

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
            .filter(Q(owned_by=self.request.user) | Q(access=IssueView.PUBLIC_ACCESS))
            .exclude(team_spaces__isnull=False)
            .order_by(self.request.GET.get("order_by", "-created_at"))
            .distinct()
        )

    @can(WorkspaceWorkitemViewPermissions.VIEW, resource_param="workspace_id")
    def list(self, request, slug):
        queryset = self.get_queryset()
        fields = [field for field in request.GET.get("fields", "").split(",") if field]
        # Guest filter: users without create permission only see their own views
        if not self.has_permission(
            WorkspaceWorkitemViewPermissions.CREATE,
            PermissionContext.workspace(request.workspace_id),
        ):
            queryset = queryset.filter(owned_by=request.user)
        views = IssueViewSerializer(queryset, many=True, fields=fields if fields else None).data
        return Response(views, status=status.HTTP_200_OK)

    @can(WorkspaceWorkitemViewPermissions.EDIT, resource_param="pk")
    def partial_update(self, request, slug, pk):
        with transaction.atomic():
            workspace_view = IssueView.objects.select_for_update().get(pk=pk, workspace__slug=slug)

            # Only the creator can edit a private view
            if workspace_view.access == IssueView.PRIVATE_ACCESS and workspace_view.created_by_id != request.user.id:
                raise PermissionDenied("Only the creator can edit this view")

            if workspace_view.is_locked:
                return Response({"error": "view is locked"}, status=status.HTTP_400_BAD_REQUEST)

            serializer = IssueViewSerializer(workspace_view, data=request.data, partial=True)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(WorkspaceWorkitemViewPermissions.VIEW, resource_param="workspace_id")
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

    @can(WorkspaceWorkitemViewPermissions.DELETE, resource_param="pk")
    def destroy(self, request, slug, pk):
        workspace_view = IssueView.objects.get(pk=pk, workspace__slug=slug)

        # Only the creator can delete a private view
        if workspace_view.access == IssueView.PRIVATE_ACCESS and workspace_view.created_by_id != request.user.id:
            raise PermissionDenied("Only the creator can delete this view")

        workspace_view.delete()
        UserFavorite.objects.filter(
            workspace__slug=slug,
            entity_identifier=pk,
            project__isnull=True,
            entity_type="view",
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceViewIssuesViewSet(AuthorizedListingView, PermissionMixin, BaseViewSet):
    use_read_replica = True

    filter_backends = (
        ComplexFilterBackend,
        PQLFilterBackend,
    )
    filterset_class = IssueFilterSet

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

    def apply_annotations(self, issues):
        issues = (
            issues.select_related("state")  # For serializer's state.group access
            .annotate(
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
            .annotate(
                label_ids=Coalesce(
                    Subquery(
                        IssueLabel.objects.filter(issue_id=OuterRef("pk"))
                        .values("issue_id")
                        .annotate(arr=ArrayAgg("label_id", distinct=True))
                        .values("arr")
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    Subquery(
                        IssueAssignee.objects.filter(
                            issue_id=OuterRef("pk"),
                            assignee__member_project__is_active=True,
                        )
                        .values("issue_id")
                        .annotate(arr=ArrayAgg("assignee_id", distinct=True))
                        .values("arr")
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                module_ids=Coalesce(
                    Subquery(
                        ModuleIssue.objects.filter(
                            issue_id=OuterRef("pk"),
                            module__archived_at__isnull=True,
                        )
                        .values("issue_id")
                        .annotate(arr=ArrayAgg("module_id", distinct=True))
                        .values("arr")
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
        )

        if check_workspace_feature_flag(
            feature_key=FeatureFlag.CUSTOMERS,
            slug=self.kwargs.get("slug"),
            user_id=str(self.request.user.id),
        ):
            issues = issues.annotate(
                customer_ids=Coalesce(
                    ArrayAgg(
                        "customer_request_issues__customer_id",
                        filter=Q(
                            customer_request_issues__deleted_at__isnull=True,
                            customer_request_issues__customer_request__isnull=True,
                            customer_request_issues__issue_id__isnull=False,
                        ),
                        distinct=True,
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                )
            ).annotate(
                customer_request_ids=Coalesce(
                    ArrayAgg(
                        "customer_request_issues__customer_request_id",
                        filter=Q(
                            customer_request_issues__deleted_at__isnull=True,
                            customer_request_issues__customer_request__isnull=False,
                        ),
                        distinct=True,
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                )
            )

        if check_workspace_feature_flag(
            feature_key=FeatureFlag.MILESTONES,
            slug=self.kwargs.get("slug"),
            user_id=str(self.request.user.id),
        ):
            issues = issues.annotate(
                milestone_id=Subquery(
                    MilestoneIssue.objects.filter(issue=OuterRef("id"), deleted_at__isnull=True).values("milestone_id")[
                        :1
                    ]
                )
            )

        if check_workspace_feature_flag(
            feature_key=FeatureFlag.RELEASES,
            slug=self.kwargs.get("slug"),
            user_id=str(self.request.user.id),
        ):
            issues = issues.annotate(
                release_ids=Coalesce(
                    Subquery(
                        ReleaseWorkItem.objects.filter(work_item_id=OuterRef("pk"), release__deleted_at__isnull=True)
                        .values("work_item_id")
                        .annotate(arr=ArrayAgg("release_id", distinct=True))
                        .values("arr")
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
        return issues

    def get_queryset(self):
        # Base queryset — authorization is applied in list() via .authorized_for().
        return Issue.issue_objects.filter(workspace__slug=self.kwargs.get("slug"))

    @method_decorator(gzip_page)
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def list(self, request, slug):
        # Canonical variable order: authorize FIRST (before filters,
        # annotations, and the total_count_queryset snapshot) so the exposed
        # total_count / total_results reflects only rows the caller can see.
        issue_queryset = self.get_queryset().authorized_for(request, WorkitemPermissions.VIEW)

        query_params = request.query_params.copy()
        sub_issue = query_params.get("sub_issue", None)
        query_params.pop("sub_issue", None)

        # Apply filtering from filterset
        issue_queryset = self.filter_queryset(issue_queryset)

        order_by_param = request.GET.get("order_by", "-created_at")

        # Validate the order_by_param
        order_by_param = self._validate_order_by_field(order_by_param)

        # Apply legacy filters
        filters = issue_filters(query_params, "GET")
        issue_queryset = issue_queryset.filter(**filters)

        if sub_issue and sub_issue == "false":
            issue_queryset = issue_queryset.filter(Q(parent__isnull=True) | (Q(parent__type__is_epic=True)))

        # Base query for the counts — inherits the authorization filter.
        total_issue_count_queryset = copy.deepcopy(issue_queryset)
        total_issue_count_queryset = total_issue_count_queryset.only("id")

        # Apply annotations to the issue queryset
        issue_queryset = self.apply_annotations(issue_queryset)

        # Issue queryset
        issue_queryset, order_by_param = order_issue_queryset(
            issue_queryset=issue_queryset, order_by_param=order_by_param
        )

        # Group by
        group_by = request.GET.get("group_by", False)
        sub_group_by = request.GET.get("sub_group_by", False)

        if group_by:
            if sub_group_by:
                if group_by == sub_group_by:
                    return Response(
                        {"error": "Group by and sub group by cannot have same parameters"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                else:
                    return self.paginate(
                        request=request,
                        order_by=order_by_param,
                        queryset=issue_queryset,
                        total_count_queryset=total_issue_count_queryset,
                        on_results=lambda issues: issue_on_results(
                            group_by=group_by,
                            issues=issues,
                            sub_group_by=sub_group_by,
                            slug=slug,
                            user_id=request.user.id,
                        ),
                        paginator_cls=SubGroupedOffsetPaginator,
                        group_by_fields=issue_group_values(
                            field=group_by, slug=slug, filters=filters, queryset=total_issue_count_queryset
                        ),
                        sub_group_by_fields=issue_group_values(
                            field=sub_group_by, slug=slug, filters=filters, queryset=total_issue_count_queryset
                        ),
                        group_by_field_name=group_by,
                        sub_group_by_field_name=sub_group_by,
                        count_filter=Q(
                            Q(issue_intake__status=1)
                            | Q(issue_intake__status=-1)
                            | Q(issue_intake__status=2)
                            | Q(issue_intake__isnull=True),
                            archived_at__isnull=True,
                            is_draft=False,
                        ),
                    )
            else:
                # Grouped pagination
                return self.paginate(
                    request=request,
                    order_by=order_by_param,
                    queryset=issue_queryset,
                    total_count_queryset=total_issue_count_queryset,
                    on_results=lambda issues: issue_on_results(
                        group_by=group_by,
                        issues=issues,
                        sub_group_by=sub_group_by,
                        slug=slug,
                        user_id=request.user.id,
                    ),
                    paginator_cls=GroupedOffsetPaginator,
                    group_by_fields=issue_group_values(
                        field=group_by, slug=slug, filters=filters, queryset=total_issue_count_queryset
                    ),
                    group_by_field_name=group_by,
                    count_filter=Q(
                        Q(issue_intake__status=1)
                        | Q(issue_intake__status=-1)
                        | Q(issue_intake__status=2)
                        | Q(issue_intake__isnull=True),
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
                    group_by=group_by,
                    issues=issues,
                    sub_group_by=sub_group_by,
                    slug=slug,
                    user_id=request.user.id,
                ),
                total_count_queryset=total_issue_count_queryset,
            )


class IssueViewViewSet(BaseViewSet):
    use_read_replica = True

    serializer_class = IssueViewSerializer
    model = IssueView

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"), owned_by=self.request.user)

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
            .filter(Q(owned_by=self.request.user) | Q(access=IssueView.PUBLIC_ACCESS))
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

    @can(WorkitemViewPermissions.VIEW, resource_param="project_id")
    def list(self, request, slug, project_id):
        queryset = self.get_queryset()
        fields = [field for field in request.GET.get("fields", "").split(",") if field]
        views = IssueViewSerializer(queryset, many=True, fields=fields if fields else None).data
        return Response(views, status=status.HTTP_200_OK)

    @can(WorkitemViewPermissions.CREATE, resource_param="project_id")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @can(WorkitemViewPermissions.VIEW, resource_param="project_id")
    def retrieve(self, request, slug, project_id, pk):
        issue_view = self.get_queryset().filter(pk=pk, project_id=project_id).first()
        serializer = IssueViewSerializer(issue_view)
        data = serializer.data
        data["total_work_items"] = self._get_view_workitem_count(request, slug, project_id, issue_view)
        recent_visited_task.delay(
            slug=slug,
            project_id=project_id,
            entity_name="view",
            entity_identifier=pk,
            user_id=request.user.id,
        )
        return Response(data, status=status.HTTP_200_OK)

    def _get_view_workitem_count(self, request, slug, project_id, issue_view):
        """Count issues matching the view's saved filters.

        Returns the count or None if an error occurs (so the frontend can
        distinguish between "0 matching issues" and "count unavailable").
        """
        try:
            base_qs = Issue.issue_objects.filter(
                project_id=project_id,
                workspace__slug=slug,
                archived_at__isnull=True,
                is_draft=False,
            )

            # Role-agnostic access check: if the user's workitem:view is conditional on
            # being the creator (system guest role or any custom role with creator-only
            # grants), restrict to their own issues. Unconditional access (admin/
            # contributor/commenter, custom roles, teamspace link-relation traversal)
            # sees all issues.
            access = permission_engine.check(
                user=request.user,
                permission=WorkitemPermissions.VIEW,
                context=PermissionContext.project(project_id, workspace_id=request.workspace_id),
                defer_conditions=True,
            )
            if not access.allowed:
                return 0
            if "creator" in access.conditions:
                base_qs = base_qs.filter(created_by=request.user)

            # Mimics the DRF view interface expected by ComplexFilterBackend/PQLFilterBackend.
            # Required attrs: filterset_class, kwargs["slug"], complex_filter_max_depth.
            filter_ctx = SimpleNamespace(
                filterset_class=IssueFilterSet,
                kwargs={"slug": slug},
                complex_filter_max_depth=5,
            )

            last_used_filter = issue_view.last_used_filter

            if last_used_filter == "pql_filters":
                pql_filters = issue_view.pql_filters or {}
                pql_stripped = pql_filters.get("stripped", "")
                if pql_stripped:
                    backend = PQLFilterBackend()
                    base_qs = backend.filter_queryset(request, base_qs, filter_ctx, pql=pql_stripped)
            else:  # rich_filters and ai_filters both use the rich_filters field
                rich_filters = issue_view.rich_filters or {}
                if rich_filters:
                    backend = ComplexFilterBackend()
                    base_qs = backend.filter_queryset(request, base_qs, filter_ctx, filter_data=rich_filters)

            return base_qs.count()
        except Exception as e:
            log_exception(e)
            return None

    @can(WorkitemViewPermissions.EDIT, resource_param="pk")
    def partial_update(self, request, slug, project_id, pk):
        with transaction.atomic():
            issue_view = IssueView.objects.select_for_update().get(pk=pk, workspace__slug=slug, project_id=project_id)

            # Only the creator can edit a private view
            if issue_view.access == IssueView.PRIVATE_ACCESS and issue_view.created_by_id != request.user.id:
                raise PermissionDenied("Only the creator can edit this view")

            if issue_view.is_locked:
                return Response({"error": "View is locked"}, status=status.HTTP_400_BAD_REQUEST)

            serializer = IssueViewSerializer(issue_view, data=request.data, partial=True)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(WorkitemViewPermissions.DELETE, resource_param="pk")
    def destroy(self, request, slug, project_id, pk):
        project_view = IssueView.objects.get(pk=pk, project_id=project_id, workspace__slug=slug)

        # Only the creator can delete a private view
        if project_view.access == IssueView.PRIVATE_ACCESS and project_view.created_by_id != request.user.id:
            raise PermissionDenied("Only the creator can delete this view")

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
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueViewFavoriteViewSet(BaseViewSet):
    use_read_replica = True

    model = UserFavorite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(user=self.request.user)
            .select_related("view")
        )

    @can(WorkitemViewPermissions.VIEW, resource_param="project_id")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @can(WorkitemViewPermissions.CREATE, resource_param="project_id")
    def create(self, request, slug, project_id):
        _ = UserFavorite.objects.create(
            user=request.user,
            entity_identifier=request.data.get("view"),
            entity_type="view",
            project_id=project_id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @can(WorkitemViewPermissions.CREATE, resource_param="project_id")
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
