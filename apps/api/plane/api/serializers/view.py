# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Serializers for saved views in the public API.
"""

from datetime import timedelta

from django.db import transaction
from rest_framework import serializers

from .base import BaseSerializer
from plane.db.models import IssueView
from plane.utils.filters import LegacyToRichFiltersConverter
from plane.utils.issue_filters import issue_filters, pattern as DATE_FILTER_PATTERN


_LIST_FILTER_FIELDS = {
    "state",
    "state_group",
    "estimate_point",
    "priority",
    "parent",
    "labels",
    "assignees",
    "mentions",
    "created_by",
    "logged_by",
    "project",
    "cycle",
    "module",
    "intake_status",
    "inbox_status",
    "subscriber",
}
_DATE_FILTER_FIELDS = {"created_at", "updated_at", "completed_at"}
_STRING_FILTER_FIELDS = {"name", "start_date", "target_date", "type", "sub_issue", "start_target_date"}


class IssueViewSerializer(BaseSerializer):
    """
    Serializer for IssueView in the public API.

    Provides serialization and validation for named saved project and workspace views,
    including filter query generation and favorite status tracking.
    """

    is_favorite = serializers.BooleanField(read_only=True, required=False)

    class Meta:
        model = IssueView
        fields = [
            "id",
            "name",
            "description",
            "query",
            "filters",
            "display_filters",
            "display_properties",
            "rich_filters",
            "access",
            "sort_order",
            "logo_props",
            "owned_by",
            "is_locked",
            "is_favorite",
            "project",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "query",
            "owned_by",
            "is_favorite",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    @staticmethod
    def _is_valid_relative_date_filter(value):
        """Return False for malformed or unsupported relative date expressions."""
        date_query = value.split(";")
        match = DATE_FILTER_PATTERN.fullmatch(date_query[0])
        if not match:
            # A malformed relative token must not fall through as an absolute date.
            return "_" not in date_query[0]
        if len(date_query) != 3 or date_query[1] not in {"after", "before"} or date_query[2] != "fromnow":
            return False

        try:
            duration = int(date_query[0].split("_", 1)[0])
            if duration <= 0:
                return False
            if match.group(1) == "weeks":
                timedelta(weeks=duration)
            else:
                timedelta(days=duration * 30)
            return True
        except (OverflowError, ValueError):
            return False

    @staticmethod
    def _legacy_filters_to_rich_filters(filters):
        """Convert supported legacy filters using the same mapping as the data migration."""
        return LegacyToRichFiltersConverter().convert(filters, strict=False) if filters else {}

    def validate_filters(self, value):
        """Validate filter values before passing them to issue_filters()."""
        if not isinstance(value, dict):
            raise serializers.ValidationError("filters must be a JSON object.")

        errors = {}
        for field, field_value in value.items():
            if field in _LIST_FILTER_FIELDS or field in _DATE_FILTER_FIELDS:
                if field_value is not None and (
                    not isinstance(field_value, list)
                    or any(not isinstance(item, str) for item in field_value)
                ):
                    errors[field] = "must be a list of strings or null."
                elif field in _DATE_FILTER_FIELDS and field_value is not None:
                    if any(not self._is_valid_relative_date_filter(item) for item in field_value):
                        errors[field] = "contains an incomplete or unsupported relative date expression."
            elif field in _STRING_FILTER_FIELDS:
                if field == "name":
                    if not isinstance(field_value, str):
                        errors[field] = "must be a string."
                elif field_value is not None and not isinstance(field_value, str):
                    errors[field] = "must be a string or null."

        if errors:
            raise serializers.ValidationError(errors)

        return value

    def create(self, validated_data):
        """Create an IssueView with computed legacy and rich filter criteria."""
        query_params = validated_data.get("filters", {})
        validated_data["query"] = issue_filters(query_params, "POST") if query_params else {}

        if "rich_filters" not in self.initial_data:
            validated_data["rich_filters"] = self._legacy_filters_to_rich_filters(query_params)

        # IssueView.save() assigns an automatic order for later views. Preserve an
        # explicitly supplied API value without changing that model-wide behavior.
        sort_order = validated_data.pop("sort_order", serializers.empty)
        if "sort_order" not in self.initial_data:
            sort_order = serializers.empty

        # Keep the model's automatic ordering and any explicit override in one
        # transaction so concurrent creates never observe a temporary sort_order.
        with transaction.atomic():
            issue_view = IssueView.objects.create(**validated_data)
            if sort_order is not serializers.empty:
                IssueView.objects.filter(pk=issue_view.pk).update(sort_order=sort_order)
                issue_view.sort_order = sort_order
            return issue_view

    def update(self, instance, validated_data):
        """Update an IssueView and keep legacy and rich filters in sync when needed."""
        if "filters" in validated_data:
            query_params = validated_data["filters"]
            validated_data["query"] = issue_filters(query_params, "PATCH") if query_params else {}
            if "rich_filters" not in self.initial_data:
                validated_data["rich_filters"] = self._legacy_filters_to_rich_filters(query_params)
        return super().update(instance, validated_data)
