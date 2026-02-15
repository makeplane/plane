# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import AnalyticsDashboard, AnalyticsDashboardWidget
from .base import BaseSerializer


class AnalyticsDashboardSerializer(BaseSerializer):
    """Serializer for Analytics Dashboard list/create/update operations."""

    widget_count = serializers.SerializerMethodField()

    class Meta:
        model = AnalyticsDashboard
        fields = [
            "id",
            "workspace",
            "name",
            "description",
            "logo_props",
            "owner",
            "is_default",
            "sort_order",
            "config",
            "widget_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "owner",
            "created_at",
            "updated_at",
        ]

    def get_widget_count(self, obj):
        """Return count of widgets for this dashboard."""
        return obj.widgets.filter(deleted_at__isnull=True).count()


class AnalyticsDashboardWidgetSerializer(BaseSerializer):
    """Serializer for Analytics Dashboard Widget CRUD operations."""

    class Meta:
        model = AnalyticsDashboardWidget
        fields = [
            "id",
            "dashboard",
            "widget_type",
            "title",
            "chart_property",
            "chart_metric",
            "config",
            "position",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "dashboard",
            "created_at",
            "updated_at",
        ]


class AnalyticsDashboardDetailSerializer(AnalyticsDashboardSerializer):
    """Serializer for Analytics Dashboard detail view with nested widgets."""

    widgets = AnalyticsDashboardWidgetSerializer(many=True, read_only=True)

    class Meta(AnalyticsDashboardSerializer.Meta):
        fields = AnalyticsDashboardSerializer.Meta.fields + ["widgets"]
