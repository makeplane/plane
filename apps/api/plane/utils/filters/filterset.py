# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import copy

from django.db import models
from django.db.models import Q
from django_filters import FilterSet, filters

from plane.db.models import Issue, IssueAssignee

# Special value for filtering unassigned items
UNASSIGNED_FILTER_VALUE = "none"
# Special value for empty filter (returns 0 results)
EMPTY_FILTER_VALUE = "__empty__"


class UUIDInFilter(filters.BaseInFilter, filters.UUIDFilter):
    pass


class CharInFilter(filters.BaseInFilter, filters.CharFilter):
    pass


class UUIDOrNoneFilter(filters.CharFilter):
    """
    Filter that accepts either a valid UUID or the special 'none' value.
    Used for fields that support filtering by "unassigned" (no relation).
    When using method= parameter, the custom method handles all filtering logic.
    """

    pass


class UUIDOrNoneInFilter(filters.BaseInFilter, filters.CharFilter):
    """
    Filter that accepts a list of UUIDs and/or the special 'none' value.
    Used for __in lookups that support filtering by "unassigned" (no relation).
    When using method= parameter, the custom method handles all filtering logic.
    """

    pass


class BaseFilterSet(FilterSet):
    @classmethod
    def get_filters(cls):
        """
        Get all filters for the filterset, including dynamically created __exact filters.
        """
        # Get the standard filters first
        filters = super().get_filters()

        # Add __exact versions for filters that have 'exact' lookup
        exact_filters = {}
        for filter_name, filter_obj in filters.items():
            if hasattr(filter_obj, "lookup_expr") and filter_obj.lookup_expr == "exact":
                exact_field_name = f"{filter_name}__exact"
                if exact_field_name not in filters:
                    # Copy the filter object as-is and assign it to the new name
                    exact_filters[exact_field_name] = copy.deepcopy(filter_obj)

        # Add the exact filters to the main filters dict
        filters.update(exact_filters)
        return filters

    def build_combined_q(self):
        """
        Build a combined Q object from all bound filters.

        For filters with custom methods, we call them and expect Q objects (or wrap
        QuerySets as subqueries for backward compatibility).
        For standard field filters, we build Q objects directly from field lookups.

        Returns:
            Q object representing all filter conditions combined.
        """
        # Ensure form validation has occurred
        self.errors

        combined_q = Q()

        # Handle case where cleaned_data might be None or empty
        if not self.form.cleaned_data:
            return combined_q

        # Only process filters that were actually provided in the request data
        # This avoids processing all declared filters with None/empty default values
        provided_filters = set(self.data.keys()) if self.data else set()

        for name, value in self.form.cleaned_data.items():
            # Skip filters that weren't provided in the request
            if name not in provided_filters:
                continue

            f = self.filters[name]

            # Build the Q object for this filter
            if f.method is not None:
                # Custom filter method - call it to get Q object
                res = f.filter(self.queryset, value)
                if isinstance(res, Q):
                    q_piece = res
                elif isinstance(res, models.QuerySet):
                    # Backward compatibility: wrap QuerySet as subquery
                    q_piece = Q(pk__in=res.values("pk"))
                else:
                    raise TypeError(
                        f"Filter method '{name}' must return Q object or QuerySet, got {type(res).__name__}"
                    )
            else:
                # Standard field filter - build Q object directly
                lookup = f"{f.field_name}__{f.lookup_expr}"
                q_piece = Q(**{lookup: value})

            # Apply exclude/include logic
            if getattr(f, "exclude", False):
                combined_q &= ~q_piece
            else:
                combined_q &= q_piece

        return combined_q

    def filter_queryset(self, queryset):
        """
        Override to use Q-based filtering for compatibility with DjangoFilterBackend.

        This allows the same filterset to work with both ComplexFilterBackend
        (which calls build_combined_q directly) and DjangoFilterBackend
        (which calls this method).
        """
        # Ensure form validation
        self.errors

        # Build combined Q and apply to queryset
        combined_q = self.build_combined_q()
        qs = queryset.filter(combined_q)

        # Apply distinct if any filter requires it (typically for many-to-many relations)
        for f in self.filters.values():
            if getattr(f, "distinct", False):
                return qs.distinct()

        return qs


class IssueFilterSet(BaseFilterSet):
    # Custom filter methods to handle soft delete exclusion for relations

    # Use UUIDOrNone filters to support "none" value for unassigned issues
    assignee_id = UUIDOrNoneFilter(method="filter_assignee_id")
    assignee_id__in = UUIDOrNoneInFilter(method="filter_assignee_id_in", lookup_expr="in")

    cycle_id = filters.UUIDFilter(method="filter_cycle_id")
    cycle_id__in = UUIDInFilter(method="filter_cycle_id_in", lookup_expr="in")

    module_id = filters.UUIDFilter(method="filter_module_id")
    module_id__in = UUIDInFilter(method="filter_module_id_in", lookup_expr="in")

    mention_id = filters.UUIDFilter(method="filter_mention_id")
    mention_id__in = UUIDInFilter(method="filter_mention_id_in", lookup_expr="in")

    label_id = filters.UUIDFilter(method="filter_label_id")
    label_id__in = UUIDInFilter(method="filter_label_id_in", lookup_expr="in")

    # Direct field lookups remain the same
    created_by_id = filters.UUIDFilter(field_name="created_by_id")
    created_by_id__in = UUIDInFilter(field_name="created_by_id", lookup_expr="in")

    is_archived = filters.BooleanFilter(method="filter_is_archived")

    state_group = filters.CharFilter(field_name="state__group")
    state_group__in = CharInFilter(field_name="state__group", lookup_expr="in")

    state_id = filters.UUIDFilter(field_name="state_id")
    state_id__in = UUIDInFilter(field_name="state_id", lookup_expr="in")

    project_id = filters.UUIDFilter(field_name="project_id")
    project_id__in = UUIDInFilter(field_name="project_id", lookup_expr="in")

    subscriber_id = filters.UUIDFilter(method="filter_subscriber_id")
    subscriber_id__in = UUIDInFilter(method="filter_subscriber_id_in", lookup_expr="in")

    class Meta:
        model = Issue
        fields = {
            "start_date": ["exact", "range"],
            "target_date": ["exact", "range"],
            "created_at": ["exact", "range"],
            "updated_at": ["exact", "range"],
            "is_draft": ["exact"],
            "priority": ["exact", "in"],
        }

    def filter_is_archived(self, queryset, name, value):
        """
        Convenience filter: archived=true -> archived_at is not null,
        archived=false -> archived_at is null
        """
        if value in (True, "true", "True", 1, "1"):
            return Q(archived_at__isnull=False)
        if value in (False, "false", "False", 0, "0"):
            return Q(archived_at__isnull=True)
        return Q()  # No filter

    # Filter methods with soft delete exclusion for relations

    def _get_unassigned_filter(self):
        """Returns a Q filter for issues without active assignees.
        Uses a subquery to correctly handle issues with no assignee records."""
        # Get IDs of issues that have at least one active assignee
        assigned_issue_ids = IssueAssignee.objects.filter(
            deleted_at__isnull=True
        ).values_list("issue_id", flat=True)
        # Return filter for issues NOT in that list (unassigned issues)
        return ~Q(pk__in=assigned_issue_ids)

    def _get_empty_filter(self):
        """Returns a Q filter that matches no issues (always false condition).
        Used when __empty__ value is passed to return 0 results."""
        # pk is never NULL, so this always returns empty queryset
        return Q(pk__isnull=True)

    def filter_assignee_id(self, queryset, name, value):
        """Filter by assignee ID, excluding soft deleted users.
        Supports special values:
        - 'none' for unassigned issues
        - '__empty__' for returning 0 results"""
        if isinstance(value, str):
            if value.lower() == EMPTY_FILTER_VALUE:
                return self._get_empty_filter()
            if value.lower() == UNASSIGNED_FILTER_VALUE:
                return self._get_unassigned_filter()

        return Q(
            issue_assignee__assignee_id=value,
            issue_assignee__deleted_at__isnull=True,
        )

    def filter_assignee_id_in(self, queryset, name, value):
        """Filter by assignee IDs (in), excluding soft deleted users.
        Supports special values:
        - 'none' for unassigned issues
        - '__empty__' for returning 0 results"""
        has_none = False
        has_empty = False
        uuid_values = []

        for v in value:
            if isinstance(v, str):
                if v.lower() == EMPTY_FILTER_VALUE:
                    has_empty = True
                elif v.lower() == UNASSIGNED_FILTER_VALUE:
                    has_none = True
                else:
                    uuid_values.append(v)
            else:
                uuid_values.append(v)

        # If __empty__ is the only value, return 0 results
        if has_empty and not has_none and not uuid_values:
            return self._get_empty_filter()

        q_filter = Q()

        # Filter for unassigned issues (no active assignees)
        if has_none:
            q_filter |= self._get_unassigned_filter()

        # Filter for specific assignees
        if uuid_values:
            q_filter |= Q(
                issue_assignee__assignee_id__in=uuid_values,
                issue_assignee__deleted_at__isnull=True,
            )

        return q_filter

    def filter_cycle_id(self, queryset, name, value):
        """Filter by cycle ID, excluding soft deleted cycles"""
        return Q(
            issue_cycle__cycle_id=value,
            issue_cycle__deleted_at__isnull=True,
        )

    def filter_cycle_id_in(self, queryset, name, value):
        """Filter by cycle IDs (in), excluding soft deleted cycles"""
        return Q(
            issue_cycle__cycle_id__in=value,
            issue_cycle__deleted_at__isnull=True,
        )

    def filter_module_id(self, queryset, name, value):
        """Filter by module ID, excluding soft deleted modules"""
        return Q(
            issue_module__module_id=value,
            issue_module__deleted_at__isnull=True,
        )

    def filter_module_id_in(self, queryset, name, value):
        """Filter by module IDs (in), excluding soft deleted modules"""
        return Q(
            issue_module__module_id__in=value,
            issue_module__deleted_at__isnull=True,
        )

    def filter_mention_id(self, queryset, name, value):
        """Filter by mention ID, excluding soft deleted users"""
        return Q(
            issue_mention__mention_id=value,
            issue_mention__deleted_at__isnull=True,
        )

    def filter_mention_id_in(self, queryset, name, value):
        """Filter by mention IDs (in), excluding soft deleted users"""
        return Q(
            issue_mention__mention_id__in=value,
            issue_mention__deleted_at__isnull=True,
        )

    def filter_label_id(self, queryset, name, value):
        """Filter by label ID, excluding soft deleted labels"""
        return Q(
            label_issue__label_id=value,
            label_issue__deleted_at__isnull=True,
        )

    def filter_label_id_in(self, queryset, name, value):
        """Filter by label IDs (in), excluding soft deleted labels"""
        return Q(
            label_issue__label_id__in=value,
            label_issue__deleted_at__isnull=True,
        )

    def filter_subscriber_id(self, queryset, name, value):
        """Filter by subscriber ID, excluding soft deleted users"""
        return Q(
            issue_subscribers__subscriber_id=value,
            issue_subscribers__deleted_at__isnull=True,
        )

    def filter_subscriber_id_in(self, queryset, name, value):
        """Filter by subscriber IDs (in), excluding soft deleted users"""
        return Q(
            issue_subscribers__subscriber_id__in=value,
            issue_subscribers__deleted_at__isnull=True,
        )
