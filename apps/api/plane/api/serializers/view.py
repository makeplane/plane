# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Serializers for saved views in the public API.
"""

from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from .base import BaseSerializer
from plane.db.models import IssueView
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
        """Return False when a relative date filter cannot be evaluated safely."""
        date_query = value.split(";")
        if len(date_query) != 3:
            return True

        match = DATE_FILTER_PATTERN.fullmatch(date_query[0])
        if not match:
            return True

        try:
            duration = int(date_query[0].split("_", 1)[0])
            delta = (
                timedelta(weeks=duration)
                if match.group(1) == "weeks"
                else timedelta(days=duration * 30)
            )
            today = timezone.now().date()
            if date_query[2] == "fromnow":
                return today + delta >= today
            return today - delta <= today
        except (OverflowError, ValueError):
            return False

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
                        errors[field] = "contains a relative date duration outside the supported range."
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
        """Create an IssueView with computed query criteria from filters."""
        query_params = validated_data.get("filters", {})
        if bool(query_params):
            validated_data["query"] = issue_filters(query_params, "POST")
        else:
            validated_data["query"] = {}
        return IssueView.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """Update an IssueView and recompute query criteria when filters change."""
        query_params = validated_data.get("filters", {})
        if bool(query_params):
            validated_data["query"] = issue_filters(query_params, "PATCH")
        elif "filters" in validated_data:
            validated_data["query"] = {}
        return super().update(instance, validated_data)
