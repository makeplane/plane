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

# Django imports
from django.db.models import Q

# Third party imports
from django_filters import filters

# Module imports
from plane.utils.filters.filterset import UUIDInFilter, CharInFilter, BaseFilterSet
from plane.ee.models import Initiative
from plane.db.models import Project


class InitiativeFilterSet(BaseFilterSet):
    lead = filters.UUIDFilter(field_name="lead")
    lead__in = UUIDInFilter(field_name="lead", lookup_expr="in")
    lead__isnull = filters.BooleanFilter(method="filter_lead_isnull", lookup_expr="isnull")
    label_id = filters.UUIDFilter(method="filter_label_id")
    label_id__in = UUIDInFilter(method="filter_label_id_in", lookup_expr="in")
    label_id__isnull = filters.BooleanFilter(method="filter_label_id_isnull", lookup_expr="isnull")

    class Meta:
        model = Initiative
        fields = {
            "start_date": ["exact", "gte", "gt", "lte", "lt", "range", "isnull"],
            "end_date": ["exact", "gte", "gt", "lte", "lt", "range", "isnull"],
            "state": ["exact", "in"],
        }

    def filter_lead_isnull(self, queryset, name, value):
        """Filter by lead ID (is null), excluding soft deleted users"""
        if value in (True, "true", "True", 1, "1"):
            return Q(
                lead_id__isnull=True,
            )
        else:
            return Q(
                lead_id__isnull=False,
            )

    def filter_label_id(self, queryset, name, value):
        """Filter by label IDs (in), excluding soft deleted labels"""
        return Q(
            initiative_label_associations__label_id=value,
            initiative_label_associations__deleted_at__isnull=True,
        )

    def filter_label_id_in(self, queryset, name, value):
        """Filter by label IDs (in), excluding soft deleted labels"""
        return Q(
            initiative_label_associations__label_id__in=value,
            initiative_label_associations__deleted_at__isnull=True,
        )

    def filter_label_id_isnull(self, queryset, name, value):
        """Filter by label ID (is null), excluding soft deleted label associations"""
        has_non_deleted_label = Q(
            initiative_label_associations__isnull=False,
            initiative_label_associations__deleted_at__isnull=True,
        )
        if value in (True, "true", "True", 1, "1"):
            return ~has_non_deleted_label
        else:
            return has_non_deleted_label


class InitiativeProjectFilterSet(BaseFilterSet):
    lead = filters.UUIDFilter(method="filter_lead")
    lead__in = UUIDInFilter(method="filter_lead_in", lookup_expr="in")
    lead__isnull = filters.BooleanFilter(method="filter_lead_isnull", lookup_expr="isnull")
    start_date = filters.CharFilter(method="filter_start_date")
    start_date__gte = filters.CharFilter(method="filter_start_date_gte")
    start_date__lte = filters.CharFilter(method="filter_start_date_lte")
    target_date = filters.CharFilter(method="filter_target_date")
    target_date__gte = filters.CharFilter(method="filter_target_date_gte", lookup_expr="gte")
    target_date__lte = filters.CharFilter(method="filter_target_date_lte", lookup_expr="lte")

    # DateTimeField date-only comparison filters
    created_at__gt = filters.DateFilter(field_name="created_at", lookup_expr="gt", method="filter_datetime_date_gt")
    created_at__gte = filters.DateFilter(field_name="created_at", lookup_expr="gte", method="filter_datetime_date_gte")
    created_at__lt = filters.DateFilter(field_name="created_at", lookup_expr="lt", method="filter_datetime_date_lt")
    created_at__lte = filters.DateFilter(field_name="created_at", lookup_expr="lte", method="filter_datetime_date_lte")
    updated_at__gt = filters.DateFilter(
        field_name="updated_at", lookup_expr="gt", method="filter_datetime_date_gt"
    )
    updated_at__gte = filters.DateFilter(
        field_name="updated_at", lookup_expr="gte", method="filter_datetime_date_gte"
    )
    updated_at__lt = filters.DateFilter(
        field_name="updated_at", lookup_expr="lt", method="filter_datetime_date_lt"
    )
    updated_at__lte = filters.DateFilter(
        field_name="updated_at", lookup_expr="lte", method="filter_datetime_date_lte"
    )

    priority = filters.CharFilter(method="filter_priority")
    priority__in = CharInFilter(method="filter_priority_in", lookup_expr="in")
    state_id = filters.CharFilter(method="filter_state_id", lookup_expr="in")
    state_id__in = CharInFilter(method="filter_state_id_in", lookup_expr="in")

    class Meta:
        model = Project
        fields = {
            "created_at": ["exact", "range"],
            "updated_at": ["exact", "range"],
            "archived_at": ["exact", "isnull"],
            "network": ["exact", "in"],
        }

    def filter_lead(self, queryset, name, value):
        """Filter by project lead ID"""
        return Q(project_lead_id=value)

    def filter_lead_in(self, queryset, name, value):
        """Filter by project lead IDs (in)"""
        return Q(project_lead_id__in=value)

    def filter_lead_isnull(self, queryset, name, value):
        """Filter by project lead (is null), excluding soft deleted users"""
        if value in (True, "true", "True", 1, "1"):
            return Q(project_lead_id__isnull=True)
        else:
            return Q(project_lead_id__isnull=False)

    def filter_start_date(self, queryset, name, value):
        return Q(project_projectattribute__start_date__exact=value)

    def filter_start_date_gte(self, queryset, name, value):
        return Q(project_projectattribute__start_date__gte=value)

    def filter_start_date_lte(self, queryset, name, value):
        return Q(project_projectattribute__start_date__lte=value)

    def filter_target_date(self, queryset, name, value):
        return Q(project_projectattribute__target_date__exact=value)

    def filter_target_date_gte(self, queryset, name, value):
        return Q(project_projectattribute__target_date__gte=value)

    def filter_target_date_lte(self, queryset, name, value):
        return Q(project_projectattribute__target_date__lte=value)

    def filter_priority(self, queryset, name, value):
        return Q(project_projectattribute__priority=value)

    def filter_priority_in(self, queryset, name, value):
        return Q(project_projectattribute__priority__in=value)

    def filter_state_id(self, queryset, name, value):
        return Q(project_projectattribute__state_id=value, project_projectattribute__state__deleted_at__isnull=True)

    def filter_state_id_in(self, queryset, name, value):
        return Q(project_projectattribute__state_id__in=value, project_projectattribute__state__deleted_at__isnull=True)
