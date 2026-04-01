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
from plane.utils.filters.filterset import IssueFilterSet, UUIDInFilter, CharInFilter, BaseFilterSet
from plane.utils.exception_logger import log_exception
from plane.ee.models import Initiative
from plane.db.models import Project
from plane.utils.uuid import is_valid_uuid


class ExtendedIssueFilterSet(IssueFilterSet):
    assignee_id__isnull = filters.BooleanFilter(method="filter_assignee_id_isnull", lookup_expr="isnull")
    mention_id__isnull = filters.BooleanFilter(method="filter_mention_id_isnull", lookup_expr="isnull")
    subscriber_id__isnull = filters.BooleanFilter(method="filter_subscriber_id_isnull", lookup_expr="isnull")
    cycle_id__isnull = filters.BooleanFilter(method="filter_cycle_id_isnull", lookup_expr="isnull")
    module_id__isnull = filters.BooleanFilter(method="filter_module_id_isnull", lookup_expr="isnull")
    label_id__isnull = filters.BooleanFilter(method="filter_label_id_isnull", lookup_expr="isnull")

    team_project_id = filters.UUIDFilter(field_name="project_id")
    team_project_id__in = UUIDInFilter(field_name="project_id", lookup_expr="in")

    type_id = filters.UUIDFilter(field_name="type_id")
    type_id__in = UUIDInFilter(field_name="type_id", lookup_expr="in")

    milestone_id = filters.UUIDFilter(method="filter_milestone_id")
    milestone_id__in = UUIDInFilter(method="filter_milestone_id_in", lookup_expr="in")
    milestone_id__isnull = filters.BooleanFilter(method="filter_milestone_id_isnull", lookup_expr="isnull")

    epic_id = filters.UUIDFilter(method="filter_epic_id")
    epic_id__in = UUIDInFilter(method="filter_epic_id_in", lookup_expr="in")
    epic_id__isnull = filters.BooleanFilter(method="filter_epic_id_isnull", lookup_expr="isnull")

    parent_id = filters.UUIDFilter(method="filter_parent_id")
    parent_id__in = UUIDInFilter(method="filter_parent_id_in", lookup_expr="in")
    parent_id__isnull = filters.BooleanFilter(method="filter_parent_id_isnull", lookup_expr="isnull")

    # DateTimeField date-only comparison filters
    created_at__gt = filters.DateFilter(field_name="created_at", lookup_expr="gt", method="filter_datetime_date_gt")
    created_at__gte = filters.DateFilter(field_name="created_at", lookup_expr="gte", method="filter_datetime_date_gte")
    created_at__lt = filters.DateFilter(field_name="created_at", lookup_expr="lt", method="filter_datetime_date_lt")
    created_at__lte = filters.DateFilter(field_name="created_at", lookup_expr="lte", method="filter_datetime_date_lte")
    created_at__exact = filters.DateFilter(
        field_name="created_at", lookup_expr="exact", method="filter_datetime_date_exact"
    )

    updated_at__gt = filters.DateFilter(
        field_name="last_activity_at", lookup_expr="gt", method="filter_datetime_date_gt"
    )
    updated_at__gte = filters.DateFilter(
        field_name="last_activity_at", lookup_expr="gte", method="filter_datetime_date_gte"
    )
    updated_at__lt = filters.DateFilter(
        field_name="last_activity_at", lookup_expr="lt", method="filter_datetime_date_lt"
    )
    updated_at__lte = filters.DateFilter(
        field_name="last_activity_at", lookup_expr="lte", method="filter_datetime_date_lte"
    )
    updated_at__exact = filters.DateFilter(
        field_name="last_activity_at", lookup_expr="exact", method="filter_datetime_date_exact"
    )
    updated_at__range = filters.CharFilter(
        field_name="last_activity_at", method="filter_datetime_date_range"
    )
    updated_at__isnull = filters.BooleanFilter(
        field_name="last_activity_at", method="filter_datetime_date_isnull", lookup_expr="isnull"
    )

    customproperty_value = filters.CharFilter(method="filter_custom_property_value")
    customproperty_value__exact = filters.CharFilter(method="filter_custom_property_value_exact")
    customproperty_value__in = CharInFilter(method="filter_custom_property_value_in", lookup_expr="in")
    customproperty_value__gte = filters.CharFilter(method="filter_custom_property_value_gte")
    customproperty_value__gt = filters.CharFilter(method="filter_custom_property_value_gt")
    customproperty_value__lte = filters.CharFilter(method="filter_custom_property_value_lte")
    customproperty_value__lt = filters.CharFilter(method="filter_custom_property_value_lt")
    customproperty_value__icontains = filters.CharFilter(method="filter_custom_property_value_icontains")
    customproperty_value__contains = filters.CharFilter(method="filter_custom_property_value_contains")
    customproperty_value__startswith = filters.CharFilter(method="filter_custom_property_value_startswith")
    customproperty_value__endswith = filters.CharFilter(method="filter_custom_property_value_endswith")
    customproperty_value__range = filters.CharFilter(method="filter_custom_property_value_range")
    customproperty_value__isnull = filters.CharFilter(method="filter_custom_property_value_isnull")

    release_id = filters.UUIDFilter(method="filter_release_id")
    release_id__in = UUIDInFilter(method="filter_release_id_in", lookup_expr="in")
    release_id__isnull = filters.BooleanFilter(method="filter_release_id_isnull", lookup_expr="isnull")

    class Meta(IssueFilterSet.Meta):
        fields = IssueFilterSet.Meta.fields
        fields.update(
            {
                "name": ["exact", "icontains", "contains", "startswith", "endswith"],
                "start_date": ["exact", "gte", "gt", "lte", "lt", "range", "isnull"],
                "target_date": ["exact", "gte", "gt", "lte", "lt", "range", "isnull"],
                "created_at": ["exact", "range", "isnull"],
            }
        )

    def _extract_field_names(self, filter_data):
        """Extract all field names from a nested filter structure"""
        if isinstance(filter_data, dict):
            fields = []
            for key, value in filter_data.items():
                if key.lower() in ("or", "and", "not"):
                    # This is a logical operator, process its children
                    if key.lower() == "not":
                        # 'not' has a dict as its value, not a list
                        if isinstance(value, dict):
                            fields.extend(self._extract_field_names(value))
                    else:
                        # 'or' and 'and' have lists as their values
                        for item in value:
                            fields.extend(self._extract_field_names(item))
                else:
                    # This is a field name
                    fields.append(key)
            return fields
        return []

    def filter_assignee_id_isnull(self, queryset, name, value):
        """Filter by assignee ID (is null), excluding soft deleted users"""
        # Check for at least one non-deleted assignee (requires both existence AND non-deleted)
        has_non_deleted_assignee = Q(issue_assignee__isnull=False, issue_assignee__deleted_at__isnull=True)
        if value in (True, "true", "True", 1, "1"):
            # No non-deleted assignees: no assignees at all OR all assignees are soft-deleted
            return ~has_non_deleted_assignee
        else:
            # Has at least one non-deleted assignee
            return has_non_deleted_assignee

    def filter_mention_id_isnull(self, queryset, name, value):
        """Filter by mention ID (is null), excluding soft deleted mentions"""
        has_non_deleted_mention = Q(issue_mention__isnull=False, issue_mention__deleted_at__isnull=True)
        if value in (True, "true", "True", 1, "1"):
            return ~has_non_deleted_mention
        else:
            return has_non_deleted_mention

    def filter_subscriber_id_isnull(self, queryset, name, value):
        """Filter by subscriber ID (is null), excluding soft deleted subscribers"""
        has_non_deleted_subscriber = Q(issue_subscribers__isnull=False, issue_subscribers__deleted_at__isnull=True)
        if value in (True, "true", "True", 1, "1"):
            return ~has_non_deleted_subscriber
        else:
            return has_non_deleted_subscriber

    def filter_cycle_id_isnull(self, queryset, name, value):
        """Filter by cycle ID (is null), excluding soft deleted cycle associations"""
        has_non_deleted_cycle = Q(issue_cycle__isnull=False, issue_cycle__deleted_at__isnull=True)
        if value in (True, "true", "True", 1, "1"):
            return ~has_non_deleted_cycle
        else:
            return has_non_deleted_cycle

    def filter_module_id_isnull(self, queryset, name, value):
        """Filter by module ID (is null), excluding soft deleted module associations"""
        has_non_deleted_module = Q(issue_module__isnull=False, issue_module__deleted_at__isnull=True)
        if value in (True, "true", "True", 1, "1"):
            return ~has_non_deleted_module
        else:
            return has_non_deleted_module

    def filter_label_id_isnull(self, queryset, name, value):
        """Filter by label ID (is null), excluding soft deleted label associations"""
        has_non_deleted_label = Q(label_issue__isnull=False, label_issue__deleted_at__isnull=True)
        if value in (True, "true", "True", 1, "1"):
            return ~has_non_deleted_label
        else:
            return has_non_deleted_label

    def filter_custom_property_value(self, queryset, name, value):
        """Filter by custom property value (exact match)"""
        return self._filter_custom_property_value_with_lookup(queryset, "exact", value)

    def filter_custom_property_value_exact(self, queryset, name, value):
        """Filter by custom property value (exact match)"""
        return self._filter_custom_property_value_with_lookup(queryset, "exact", value)

    def filter_custom_property_value_in(self, queryset, name, value):
        """Filter by custom property value (in list)"""
        return self._filter_custom_property_value_with_lookup(queryset, "in", value)

    def filter_custom_property_value_gte(self, queryset, name, value):
        """Filter by custom property value (greater than or equal)"""
        return self._filter_custom_property_value_with_lookup(queryset, "gte", value)

    def filter_custom_property_value_gt(self, queryset, name, value):
        """Filter by custom property value (greater than)"""
        return self._filter_custom_property_value_with_lookup(queryset, "gt", value)

    def filter_custom_property_value_lte(self, queryset, name, value):
        """Filter by custom property value (less than or equal)"""
        return self._filter_custom_property_value_with_lookup(queryset, "lte", value)

    def filter_custom_property_value_lt(self, queryset, name, value):
        """Filter by custom property value (less than)"""
        return self._filter_custom_property_value_with_lookup(queryset, "lt", value)

    def filter_custom_property_value_icontains(self, queryset, name, value):
        """Filter by custom property value (case-insensitive contains)"""
        return self._filter_custom_property_value_with_lookup(queryset, "icontains", value)

    def filter_custom_property_value_contains(self, queryset, name, value):
        """Filter by custom property value (contains)"""
        return self._filter_custom_property_value_with_lookup(queryset, "contains", value)

    def filter_custom_property_value_startswith(self, queryset, name, value):
        """Filter by custom property value (starts with)"""
        return self._filter_custom_property_value_with_lookup(queryset, "startswith", value)

    def filter_custom_property_value_endswith(self, queryset, name, value):
        """Filter by custom property value (ends with)"""
        return self._filter_custom_property_value_with_lookup(queryset, "endswith", value)

    def filter_custom_property_value_range(self, queryset, name, value):
        """Filter by custom property value (range)"""
        return self._filter_custom_property_value_with_lookup(queryset, "range", value)

    def filter_custom_property_value_isnull(self, queryset, name, value):
        """Filter by custom property value (is null)"""
        from plane.utils.exception_logger import log_exception

        try:
            # Split the value into property_id and isnull_value
            # Format: custompropertyvalue__isnull=<property_id>;<true/false>
            property_id, isnull_value = value.split(";")

            # If the property_id or value is not valid, return an empty Q object
            if not property_id or not isnull_value:
                return Q()

            if not is_valid_uuid(property_id):
                return Q()

            # Check for at least one non-deleted property value for this property
            has_non_deleted_property_value = Q(
                properties__isnull=False,
                properties__property_id=property_id,
                properties__property__deleted_at__isnull=True,
                properties__deleted_at__isnull=True,
            )
            if isnull_value in (True, "true", "True", 1, "1"):
                # No non-deleted property values for this property
                return ~has_non_deleted_property_value
            else:
                # Has at least one non-deleted property value for this property
                return has_non_deleted_property_value

        except Exception as e:
            log_exception(e)
            return Q()

    def _filter_custom_property_value_with_lookup(self, queryset, lookup, value):
        """Helper method to filter by custom property value with a specific lookup.

        This method handles the actual filtering logic for custom properties by:
        1. Getting the property_id from the request context (set by the filter backend)
        2. Using a subquery to avoid JOIN conflicts when multiple custom properties are filtered
        3. Applying the appropriate lookup based on the property type
        """

        # Get the property_id from the request context
        # This is set by the filter backend
        # Build the filter based on the property type and lookup
        from plane.ee.models.issue_properties import IssueProperty, IssuePropertyValue, PropertyTypeEnum

        try:
            # Split the value into property_id and value
            # Format: custompropertyvalue__<lookup>=<property_id>;<value>
            if isinstance(value, list):
                # If the value is a list, check if it is empty
                if not value:
                    return Q()
                # If the value is a list, split the first element into property_id and value
                property_id, _ = value[0].split(";")
                # For each value in the list, split it into property_id and value
                values = []
                for val in value:
                    _, v = val.split(";")
                    values.append(v)
                value = values
            else:
                property_id, value = value.split(";")

            # If the property_id or value is not valid, return an empty Q object
            if not property_id or not value:
                return Q()

            if not is_valid_uuid(property_id):
                return Q()

            # Get the property to determine its type
            property_obj = IssueProperty.objects.get(id=property_id)

            # Build the filter based on the property type and lookup
            if property_obj.property_type in [
                PropertyTypeEnum.TEXT.value,
                PropertyTypeEnum.URL.value,
            ]:
                field_name = "value_text"
            elif property_obj.property_type == PropertyTypeEnum.DECIMAL:
                field_name = "value_decimal"
            elif property_obj.property_type == PropertyTypeEnum.BOOLEAN:
                field_name = "value_boolean"
            elif property_obj.property_type == PropertyTypeEnum.DATETIME:
                field_name = "value_datetime"
            elif property_obj.property_type == PropertyTypeEnum.RELATION:
                field_name = "value_uuid"
            elif property_obj.property_type == PropertyTypeEnum.OPTION:
                field_name = "value_option"
            else:
                return Q()

            # Build base filters for the subquery
            base_filters = {
                "property_id": property_id,
                "property__deleted_at__isnull": True,
                "deleted_at__isnull": True,
            }

            property_filter = {}

            # For datetime fields, we need to use the __date suffix for date-only comparisons
            date_suffix = "__date" if property_obj.property_type == PropertyTypeEnum.DATETIME.value else ""

            matching_issue_queryset = IssuePropertyValue.objects.filter(**base_filters)
            # Special handling for boolean: when value is false, no record may
            # exist in IssuePropertyValue (false is the default). So instead of
            # looking for explicit false records, find issues of the correct
            # type that do NOT have an explicit true record.
            if lookup == "exact" and property_obj.property_type == PropertyTypeEnum.BOOLEAN.value:
                is_true = value in (True, "true", "True", 1, "1")
                issues_with_true = matching_issue_queryset.filter(value_boolean=True).values_list("issue_id", flat=True)
                if is_true:
                    return Q(pk__in=issues_with_true)
                else:
                    return Q(type_id=property_obj.issue_type_id) & ~Q(pk__in=issues_with_true)
            # Add the lookup-specific filter
            elif lookup == "exact" and property_obj.property_type in [
                PropertyTypeEnum.TEXT.value,
                PropertyTypeEnum.URL.value,
                PropertyTypeEnum.OPTION.value,
                PropertyTypeEnum.RELATION.value,
                PropertyTypeEnum.DATETIME.value,
                PropertyTypeEnum.DECIMAL.value,
            ]:
                property_filter[field_name] = value
            elif lookup == "in" and property_obj.property_type in [
                PropertyTypeEnum.OPTION.value,
                PropertyTypeEnum.RELATION.value,
            ]:
                property_filter[f"{field_name}__in"] = value
            elif lookup == "gte" and property_obj.property_type in [
                PropertyTypeEnum.DECIMAL.value,
                PropertyTypeEnum.DATETIME.value,
            ]:
                property_filter[f"{field_name}{date_suffix}__gte"] = value
            elif lookup == "gt" and property_obj.property_type in [
                PropertyTypeEnum.DECIMAL.value,
                PropertyTypeEnum.DATETIME.value,
            ]:
                property_filter[f"{field_name}{date_suffix}__gt"] = value
            elif lookup == "lte" and property_obj.property_type in [
                PropertyTypeEnum.DECIMAL.value,
                PropertyTypeEnum.DATETIME.value,
            ]:
                property_filter[f"{field_name}{date_suffix}__lte"] = value
            elif lookup == "lt" and property_obj.property_type in [
                PropertyTypeEnum.DECIMAL.value,
                PropertyTypeEnum.DATETIME.value,
            ]:
                property_filter[f"{field_name}{date_suffix}__lt"] = value
            elif lookup == "icontains" and property_obj.property_type in [
                PropertyTypeEnum.TEXT.value,
                PropertyTypeEnum.URL.value,
            ]:
                property_filter[f"{field_name}__icontains"] = value
            elif lookup == "contains" and property_obj.property_type in [
                PropertyTypeEnum.TEXT.value,
                PropertyTypeEnum.URL.value,
            ]:
                property_filter[f"{field_name}__contains"] = value
            elif lookup == "startswith" and property_obj.property_type in [
                PropertyTypeEnum.TEXT.value,
                PropertyTypeEnum.URL.value,
            ]:
                property_filter[f"{field_name}__startswith"] = value
            elif lookup == "endswith" and property_obj.property_type in [
                PropertyTypeEnum.TEXT.value,
                PropertyTypeEnum.URL.value,
            ]:
                property_filter[f"{field_name}__endswith"] = value
            elif lookup == "range" and property_obj.property_type in [
                PropertyTypeEnum.DECIMAL.value,
                PropertyTypeEnum.DATETIME.value,
            ]:
                value = value.split(",")
                if isinstance(value, list) and len(value) == 2:
                    property_filter[f"{field_name}__range"] = value
                else:
                    return Q()
            else:
                return Q()

            # Use a subquery to find matching issue IDs
            # This ensures each custom property filter is independent
            matching_issue_ids = matching_issue_queryset.filter(**property_filter).values_list("issue_id", flat=True)

            # Return Q object with pk__in subquery
            return Q(pk__in=matching_issue_ids)

        except Exception as e:
            log_exception(e)
            return Q()

    def filter_milestone_id(self, queryset, name, value):
        """Filter by milestone ID, excluding soft deleted milestones"""
        return Q(
            issue_milestone__milestone_id=value,
            issue_milestone__deleted_at__isnull=True,
        )

    def filter_milestone_id_in(self, queryset, name, value):
        """Filter by milestone IDs (in), excluding soft deleted milestones"""
        return Q(
            issue_milestone__milestone_id__in=value,
            issue_milestone__deleted_at__isnull=True,
        )

    def filter_milestone_id_isnull(self, queryset, name, value):
        """Filter by milestone ID (is null), excluding soft deleted milestone associations"""
        has_non_deleted_milestone = Q(issue_milestone__isnull=False, issue_milestone__deleted_at__isnull=True)
        if value in (True, "true", "True", 1, "1"):
            return ~has_non_deleted_milestone
        else:
            return has_non_deleted_milestone

    def filter_epic_id(self, queryset, name, value):
        """Filter by epic ID, excluding soft deleted epics"""
        return Q(
            parent_id=value,
            parent__deleted_at__isnull=True,
            parent__type__is_epic=True,
        )

    def filter_epic_id_in(self, queryset, name, value):
        """Filter by epic IDs (in), excluding soft deleted epics"""
        return Q(
            parent_id__in=value,
            parent__deleted_at__isnull=True,
            parent__type__is_epic=True,
        )

    def filter_epic_id_isnull(self, queryset, name, value):
        """Filter by epic ID (is null), excluding soft deleted epics"""
        has_non_deleted_epic = Q(
            parent__type__is_epic=True,
            parent__isnull=False,
            parent__deleted_at__isnull=True,
        )
        if value in (True, "true", "True", 1, "1"):
            return ~has_non_deleted_epic
        else:
            return has_non_deleted_epic

    def filter_parent_id(self, queryset, name, value):
        """Filter by parent ID, excluding soft deleted parents"""
        return Q(
            Q(parent__type__is_epic=False) | Q(parent__type__isnull=True),
            parent_id=value,
            parent__deleted_at__isnull=True,
        )

    def filter_parent_id_in(self, queryset, name, value):
        """Filter by parent IDs (in), excluding soft deleted parents"""
        return Q(
            Q(parent__type__is_epic=False) | Q(parent__type__isnull=True),
            parent_id__in=value,
            parent__deleted_at__isnull=True,
        )

    def filter_parent_id_isnull(self, queryset, name, value):
        """Filter by parent ID (is null), excluding soft deleted parents"""
        has_non_deleted_parent = Q(
            Q(parent__type__is_epic=False) | Q(parent__type__isnull=True),
            parent__isnull=False,
            parent__deleted_at__isnull=True,
        )
        if value in (True, "true", "True", 1, "1"):
            return ~has_non_deleted_parent
        else:
            return has_non_deleted_parent

    def filter_release_id(self, queryset, name, value):
        """Filter by release ID, excluding soft deleted releases"""

        return Q(
            release_work_items__release_id=value,
            release_work_items__deleted_at__isnull=True,
            release_work_items__release__deleted_at__isnull=True,
        )

    def filter_release_id_in(self, queryset, name, value):
        """Filter by release IDs (in), excluding soft deleted releases"""

        return Q(
            release_work_items__release_id__in=value,
            release_work_items__deleted_at__isnull=True,
            release_work_items__release__deleted_at__isnull=True,
        )

    def filter_release_id_isnull(self, queryset, name, value):
        """Filter by release ID (is null), excluding soft deleted releases"""

        has_non_deleted_release = Q(
            release_work_items__isnull=False,
            release_work_items__deleted_at__isnull=True,
            release_work_items__release__deleted_at__isnull=True,
        )

        if value in (True, "true", "True", 1, "1"):
            return ~has_non_deleted_release
        else:
            return has_non_deleted_release


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
