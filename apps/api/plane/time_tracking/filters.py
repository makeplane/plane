# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""One filter definition for the list, summary, report, timesheet and export endpoints (plan 7.4)."""

# Python imports
import re

# Django imports
from django.db.models import Q
from django_filters import filters

# Module imports
from plane.db.models import CycleIssue, IssueAssignee, IssueLabel, ModuleIssue
from plane.utils.filters.filterset import BaseFilterSet, CharInFilter, UUIDInFilter

from .models import TimeEntry
from .services import TimeTrackingError

WORK_ITEM_KEY = re.compile(r"^\s*([A-Za-z0-9]+)-(\d+)\s*$")

# order_by values accepted by the list endpoint → ORM ordering
ORDER_BY = {
    "-spent_on": ("-spent_on",),
    "spent_on": ("spent_on",),
    "-duration_seconds": ("-duration_seconds",),
    "duration_seconds": ("duration_seconds",),
    "user": ("user__display_name", "-spent_on"),
    "project": ("project__name", "-spent_on"),
    "-created_at": ("-created_at",),
}
DEFAULT_ORDER_BY = "-spent_on"
TIE_BREAKERS = ("-started_at", "-created_at")


def _live_link_issue_ids(model, **lookup):
    """Work item ids linked through a many-to-many table, ignoring soft-deleted links."""
    return model.objects.filter(deleted_at__isnull=True, **lookup).values("issue_id")


class TimeEntryFilterSet(BaseFilterSet):
    date_from = filters.DateFilter(field_name="spent_on", lookup_expr="gte")
    date_to = filters.DateFilter(field_name="spent_on", lookup_expr="lte")
    user_ids = UUIDInFilter(field_name="user_id", lookup_expr="in")
    logged_by_ids = UUIDInFilter(field_name="created_by_id", lookup_expr="in")
    project_ids = UUIDInFilter(field_name="project_id", lookup_expr="in")
    issue_ids = UUIDInFilter(field_name="issue_id", lookup_expr="in")
    has_issue = filters.BooleanFilter(method="filter_has_issue")
    label_ids = UUIDInFilter(method="filter_label_ids")
    state_ids = UUIDInFilter(field_name="issue__state_id", lookup_expr="in")
    state_groups = CharInFilter(field_name="issue__state__group", lookup_expr="in")
    cycle_ids = UUIDInFilter(method="filter_cycle_ids")
    module_ids = UUIDInFilter(method="filter_module_ids")
    priorities = CharInFilter(field_name="issue__priority", lookup_expr="in")
    assignee_ids = UUIDInFilter(method="filter_assignee_ids")
    is_billable = filters.BooleanFilter(field_name="is_billable", lookup_expr="exact")
    source = filters.ChoiceFilter(field_name="source", lookup_expr="exact", choices=TimeEntry.Source.choices)
    needs_review = filters.BooleanFilter(method="filter_needs_review")
    min_duration = filters.NumberFilter(field_name="duration_seconds", lookup_expr="gte")
    max_duration = filters.NumberFilter(field_name="duration_seconds", lookup_expr="lte")
    search = filters.CharFilter(method="filter_search")

    class Meta:
        model = TimeEntry
        fields = []

    @classmethod
    def get_filters(cls):
        # BaseFilterSet adds "<name>__exact" aliases for exact lookups; time tracking has a fixed parameter list
        return super(BaseFilterSet, cls).get_filters()

    def filter_has_issue(self, queryset, name, value):
        if value is None:
            return Q()
        return Q(issue_id__isnull=not value)

    def filter_label_ids(self, queryset, name, value):
        return Q(issue_id__in=_live_link_issue_ids(IssueLabel, label_id__in=value))

    def filter_cycle_ids(self, queryset, name, value):
        return Q(issue_id__in=_live_link_issue_ids(CycleIssue, cycle_id__in=value))

    def filter_module_ids(self, queryset, name, value):
        return Q(issue_id__in=_live_link_issue_ids(ModuleIssue, module_id__in=value))

    def filter_assignee_ids(self, queryset, name, value):
        return Q(issue_id__in=_live_link_issue_ids(IssueAssignee, assignee_id__in=value))

    def filter_needs_review(self, queryset, name, value):
        return Q(auto_stopped=True) if value else Q()

    def filter_search(self, queryset, name, value):
        value = (value or "").strip()
        if not value:
            return Q()
        q = Q(description__icontains=value) | Q(issue__name__icontains=value)
        match = WORK_ITEM_KEY.match(value)
        if match:
            q |= Q(project__identifier__iexact=match.group(1), issue__sequence_id=int(match.group(2)))
        return q


def filter_entries(params, queryset):
    """Apply the shared filters, rejecting malformed values instead of silently ignoring them."""
    filterset = TimeEntryFilterSet(params, queryset=queryset)
    if not filterset.is_valid():
        field, messages = next(iter(filterset.errors.items()))
        raise TimeTrackingError("INVALID_FILTER", f"Invalid filter '{field}': {messages[0]}", field=field)
    return filterset.qs


def exclude_running(queryset):
    return queryset.exclude(started_at__isnull=False, ended_at__isnull=True)


def ordering_for(order_by):
    """The ORM ordering for an ``order_by`` parameter, with stable tie-breakers."""
    ordering = ORDER_BY.get(order_by or DEFAULT_ORDER_BY)
    if ordering is None:
        raise TimeTrackingError("INVALID_FILTER", f"Invalid order_by '{order_by}'.", field="order_by")
    return (*ordering, *TIE_BREAKERS, "id")
