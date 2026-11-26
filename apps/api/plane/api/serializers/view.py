# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Serializers for saved views in the public API.
"""

from rest_framework import serializers

from .base import BaseSerializer
from plane.db.models import IssueView
from plane.utils.issue_filters import issue_filters


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
