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

# Python imports
from collections import defaultdict

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import (
    Count,
    F,
    Func,
    OuterRef,
    Prefetch,
    Q,
    Subquery,
    UUIDField,
    Value,
)
from django.db.models.functions import Coalesce
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page

# Plane imports
from plane.app.views import BaseAPIView
from plane.db.models import CycleIssue, FileAsset, Issue, IssueAssignee, IssueLabel, IssueLink, ModuleIssue
from plane.permissions import (
    can,
    get_permission_conditions,
    WorkitemPermissions,
    WorkspacePermissions,
)
from plane.ee.models import (
    IssueProperty,
    IssuePropertyValue,
    MilestoneIssue,
)
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.utils.filters import ComplexFilterBackend, IssueFilterSet
from plane.utils.issue_filters import issue_filters
from plane.utils.order_queryset import order_issue_queryset
from plane.utils.paginator import OffsetPaginator
from plane.utils.pql import PQLFilterBackend
from plane.app.serializers import WorkItemListSerializer


class WorkItemListProjectEndpoint(BaseAPIView):
    """Paginated work-item list with inline custom property values.

    Returns up to 100 issues per page. Each issue includes all base
    fields plus a `property_values` dict keyed by property ID.

    Query strategy (optimized to ~3 DB queries per request):
      1. Issues — filtered, annotated, ordered, paginated
      2. Property values — prefetched with joined property definitions
         and option names via Prefetch + select_related
      3. Property definitions — lightweight values_list query to build
         the type→properties map for default-filling
    """

    filter_backends = (
        ComplexFilterBackend,
        PQLFilterBackend,
    )
    filterset_class = IssueFilterSet

    # ── Annotations ──────────────────────────────────────────────────────

    def _annotate_base_counts(self, queryset):
        """Add cycle_id, link_count, attachment_count, sub_issues_count."""
        return queryset.annotate(
            cycle_id=Subquery(
                CycleIssue.objects.filter(
                    issue=OuterRef("id"),
                    deleted_at__isnull=True,
                ).values("cycle_id")[:1]
            ),
            link_count=Subquery(
                IssueLink.objects.filter(issue=OuterRef("id"))
                .values("issue")
                .annotate(count=Count("id"))
                .values("count")
            ),
            attachment_count=Subquery(
                FileAsset.objects.filter(
                    issue_id=OuterRef("id"),
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                )
                .values("issue_id")
                .annotate(count=Count("id"))
                .values("count")
            ),
            sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count"),
        )

    def _annotate_feature_flags(self, queryset, slug, user_id):
        """Conditionally add customer and milestone annotations based on feature flags."""
        if check_workspace_feature_flag(feature_key=FeatureFlag.CUSTOMERS, slug=slug, user_id=user_id):
            queryset = queryset.annotate(
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
                ),
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
                ),
            )

        if check_workspace_feature_flag(feature_key=FeatureFlag.MILESTONES, slug=slug, user_id=user_id):
            queryset = queryset.annotate(
                milestone_id=Subquery(
                    MilestoneIssue.objects.filter(
                        issue=OuterRef("id"),
                        deleted_at__isnull=True,
                    ).values("milestone_id")[:1]
                )
            )

        return queryset

    # ── Helpers ──────────────────────────────────────────────────────────

    def _build_type_properties_map(self, slug, project_id=None):
        """Build a map of issue-type → [(property_id, property_type), ...].

        Single lightweight query using values_list. Used by the serializer
        to fill default values for properties with no saved value.
        """
        type_properties_map = defaultdict(list)
        issue_property_qs = IssueProperty.objects.filter(
            workspace__slug=slug,
            is_active=True,
        )
        if project_id:
            issue_property_qs = issue_property_qs.filter(project_id=project_id)
        for type_id, prop_id, prop_type in issue_property_qs.values_list("issue_type_id", "id", "property_type"):
            if type_id:
                type_properties_map[str(type_id)].append((str(prop_id), prop_type))
        return type_properties_map

    # ── GET handler ──────────────────────────────────────────────────────

    @method_decorator(gzip_page)
    @can(WorkitemPermissions.VIEW, resource_param="project_id", defer_conditions=True)
    def get(self, request, slug, project_id):
        # 1. Base queryset with eager-loaded property values
        #    - Prefetch with to_attr: loads all property values in a single
        #      query, joining property definitions and option names via
        #      select_related("property", "value_option")
        issue_queryset = Issue.issue_objects.filter(
            project_id=project_id,
            workspace__slug=slug,
        )

        # Data-level filter: deferred conditional grants (e.g., guest sees only own items)
        conditions = get_permission_conditions(request)
        if "creator" in conditions:
            issue_queryset = issue_queryset.filter(created_by=request.user)

        spreadsheet_custom_property_flag = check_workspace_feature_flag(
            feature_key=FeatureFlag.SPREADSHEET_CUSTOM_PROPERTIES,
            slug=slug,
            user_id=str(request.user.id),
        )
        if spreadsheet_custom_property_flag:
            issue_queryset = issue_queryset.prefetch_related(
                Prefetch(
                    "properties",
                    queryset=IssuePropertyValue.objects.filter(
                        deleted_at__isnull=True,
                        property__is_active=True,
                    ).select_related("property", "value_option"),
                    to_attr="prefetched_property_values",
                )
            )

        # 2. Apply filters (DRF filter backends + legacy query-param filters)
        issue_queryset = self.filter_queryset(issue_queryset)
        filters = issue_filters(request.query_params, "GET")
        issue_queryset = issue_queryset.filter(**filters)

        # Snapshot the filtered queryset before annotations for total count
        # (annotations add overhead that the COUNT query doesn't need).
        # QuerySet operations return new instances, so a simple assignment
        # is sufficient — subsequent .annotate() calls won't mutate this.
        total_count_queryset = issue_queryset

        # 3. Annotate with computed fields (counts, cycle, feature-flag data)
        issue_queryset = self._annotate_base_counts(issue_queryset)
        issue_queryset = self._annotate_feature_flags(
            issue_queryset,
            slug=slug,
            user_id=str(request.user.id),
        )

        # Prefetch M2M reverse relations used by the serializer
        issue_queryset = issue_queryset.prefetch_related(
            Prefetch(
                "issue_assignee",
                queryset=IssueAssignee.objects.all(),
                to_attr="prefetched_issue_assignees",
            ),
            Prefetch(
                "label_issue",
                queryset=IssueLabel.objects.all(),
                to_attr="prefetched_label_issues",
            ),
            Prefetch(
                "issue_module",
                queryset=ModuleIssue.objects.all(),
                to_attr="prefetched_issue_modules",
            ),
        )

        # 4. Apply ordering
        order_by_param = request.GET.get("order_by", "-created_at")
        issue_queryset, order_by_param = order_issue_queryset(
            issue_queryset=issue_queryset,
            order_by_param=order_by_param,
        )

        if spreadsheet_custom_property_flag:
            # 5. Build type→properties map for default-filling in serializer
            type_properties_map = self._build_type_properties_map(slug, project_id)
        else:
            type_properties_map = {}

        # 6. Paginate and serialize
        return self.paginate(
            request=request,
            queryset=issue_queryset,
            on_results=lambda issues: WorkItemListSerializer(
                issues,
                many=True,
                context={"type_properties_map": type_properties_map},
            ).data,
            paginator_cls=OffsetPaginator,
            total_count_queryset=total_count_queryset,
            default_per_page=100,
            max_per_page=100,
        )


class WorkItemListWorkspaceEndpoint(WorkItemListProjectEndpoint):
    """Paginated work-item list with inline custom property values.

    Returns up to 100 issues per page. Each issue includes all base
    fields plus a `property_values` dict keyed by property ID.

    Query strategy (optimized to ~3 DB queries per request):
      1. Issues — filtered, annotated, ordered, paginated
      2. Property values — prefetched with joined property definitions
         and option names via Prefetch + select_related
      3. Property definitions — lightweight values_list query to build
         the type→properties map for default-filling
    """

    filter_backends = (
        ComplexFilterBackend,
        PQLFilterBackend,
    )
    filterset_class = IssueFilterSet

    # ── Annotations ──────────────────────────────────────────────────────

    def _annotate_base_counts(self, queryset):
        """Add cycle_id, link_count, attachment_count, sub_issues_count."""
        return queryset.annotate(
            cycle_id=Subquery(
                CycleIssue.objects.filter(
                    issue=OuterRef("id"),
                    deleted_at__isnull=True,
                ).values("cycle_id")[:1]
            ),
            link_count=Subquery(
                IssueLink.objects.filter(issue=OuterRef("id"))
                .values("issue")
                .annotate(count=Count("id"))
                .values("count")
            ),
            attachment_count=Subquery(
                FileAsset.objects.filter(
                    issue_id=OuterRef("id"),
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                )
                .values("issue_id")
                .annotate(count=Count("id"))
                .values("count")
            ),
            sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count"),
        )

    def _annotate_feature_flags(self, queryset, slug, user_id):
        """Conditionally add customer and milestone annotations based on feature flags."""
        if check_workspace_feature_flag(feature_key=FeatureFlag.CUSTOMERS, slug=slug, user_id=user_id):
            queryset = queryset.annotate(
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
                ),
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
                ),
            )

        if check_workspace_feature_flag(feature_key=FeatureFlag.MILESTONES, slug=slug, user_id=user_id):
            queryset = queryset.annotate(
                milestone_id=Subquery(
                    MilestoneIssue.objects.filter(
                        issue=OuterRef("id"),
                        deleted_at__isnull=True,
                    ).values("milestone_id")[:1]
                )
            )

        return queryset

    # ── GET handler ──────────────────────────────────────────────────────

    @method_decorator(gzip_page)
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug):
        # 1. Base queryset with eager-loaded property values
        #    - Prefetch with to_attr: loads all property values in a single
        #      query, joining property definitions and option names via
        #      select_related("property", "value_option")
        issue_queryset = Issue.issue_objects.filter(
            workspace__slug=slug,
        )

        spreadsheet_custom_property_flag = check_workspace_feature_flag(
            feature_key=FeatureFlag.SPREADSHEET_CUSTOM_PROPERTIES,
            slug=slug,
            user_id=str(request.user.id),
        )

        if spreadsheet_custom_property_flag:
            issue_queryset = issue_queryset.prefetch_related(
                Prefetch(
                    "properties",
                    queryset=IssuePropertyValue.objects.filter(
                        deleted_at__isnull=True,
                        property__is_active=True,
                    ).select_related("property", "value_option"),
                    to_attr="prefetched_property_values",
                )
            )
        # 2. Apply filters (DRF filter backends + legacy query-param filters)
        issue_queryset = self.filter_queryset(issue_queryset)
        filters = issue_filters(request.query_params, "GET")
        issue_queryset = issue_queryset.filter(**filters)

        # Snapshot the filtered queryset before annotations for total count
        # (annotations add overhead that the COUNT query doesn't need).
        # QuerySet operations return new instances, so a simple assignment
        # is sufficient — subsequent .annotate() calls won't mutate this.
        total_count_queryset = issue_queryset

        # 3. Annotate with computed fields (counts, cycle, feature-flag data)
        issue_queryset = self._annotate_base_counts(issue_queryset)
        issue_queryset = self._annotate_feature_flags(
            issue_queryset,
            slug=slug,
            user_id=str(request.user.id),
        )

        # Prefetch M2M reverse relations used by the serializer
        issue_queryset = issue_queryset.prefetch_related(
            Prefetch(
                "issue_assignee",
                queryset=IssueAssignee.objects.all(),
                to_attr="prefetched_issue_assignees",
            ),
            Prefetch(
                "label_issue",
                queryset=IssueLabel.objects.all(),
                to_attr="prefetched_label_issues",
            ),
            Prefetch(
                "issue_module",
                queryset=ModuleIssue.objects.all(),
                to_attr="prefetched_issue_modules",
            ),
        )

        # 4. Apply ordering
        order_by_param = request.GET.get("order_by", "-created_at")
        issue_queryset, order_by_param = order_issue_queryset(
            issue_queryset=issue_queryset,
            order_by_param=order_by_param,
        )

        # 5. Build type→properties map for default-filling in serializer
        if spreadsheet_custom_property_flag:
            type_properties_map = self._build_type_properties_map(slug)
        else:
            type_properties_map = {}

        # 6. Paginate and serialize
        return self.paginate(
            request=request,
            queryset=issue_queryset,
            on_results=lambda issues: WorkItemListSerializer(
                issues,
                many=True,
                context={"type_properties_map": type_properties_map},
            ).data,
            paginator_cls=OffsetPaginator,
            total_count_queryset=total_count_queryset,
            default_per_page=100,
            max_per_page=100,
        )
