# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import logging

from rest_framework import status
from rest_framework.response import Response
from django.db.models import Sum, Prefetch, Exists, OuterRef

from plane.app.views.base import BaseAPIView
from plane.app.permissions import WorkSpaceAdminPermission
from plane.db.models import (
    AnalyticsDashboard,
    AnalyticsDashboardWidget,
    UserFavorite,
    Workspace,
    Issue,
)
from plane.api.serializers.analytics_dashboard import (
    AnalyticsDashboardSerializer,
    AnalyticsDashboardDetailSerializer,
    AnalyticsDashboardWidgetSerializer,
)
from plane.utils.build_chart import build_analytics_chart

logger = logging.getLogger(__name__)


class AnalyticsDashboardEndpoint(BaseAPIView):
    """Analytics Dashboard List and Create Endpoint"""

    permission_classes = [WorkSpaceAdminPermission]

    def get(self, request, slug):
        """List all analytics dashboards for a workspace."""
        favorite_subquery = UserFavorite.objects.filter(
            user=request.user,
            entity_identifier=OuterRef("pk"),
            entity_type="analytics_dashboard",
            workspace__slug=slug,
        )
        dashboards = (
            AnalyticsDashboard.objects.filter(
                workspace__slug=slug,
                deleted_at__isnull=True,
            )
            .select_related("workspace", "owner")
            .annotate(is_favorite=Exists(favorite_subquery))
            .order_by("-is_favorite", "sort_order", "-created_at")
        )

        serializer = AnalyticsDashboardSerializer(dashboards, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug):
        """Create a new analytics dashboard."""
        try:
            workspace = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AnalyticsDashboardSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace=workspace, owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AnalyticsDashboardDetailEndpoint(BaseAPIView):
    """Analytics Dashboard Detail, Update, and Delete Endpoint"""

    permission_classes = [WorkSpaceAdminPermission]

    def get(self, request, slug, dashboard_id):
        """Get analytics dashboard detail with widgets."""
        dashboard = AnalyticsDashboard.objects.filter(
            workspace__slug=slug,
            id=dashboard_id,
            deleted_at__isnull=True,
        ).select_related("workspace", "owner").prefetch_related(
            Prefetch(
                "widgets",
                queryset=AnalyticsDashboardWidget.objects.filter(
                    deleted_at__isnull=True
                ),
            )
        ).first()

        if not dashboard:
            return Response(
                {"error": "Dashboard not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AnalyticsDashboardDetailSerializer(dashboard)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, slug, dashboard_id):
        """Update analytics dashboard."""
        try:
            dashboard = AnalyticsDashboard.objects.get(
                workspace__slug=slug,
                id=dashboard_id,
                deleted_at__isnull=True,
            )
        except AnalyticsDashboard.DoesNotExist:
            return Response(
                {"error": "Dashboard not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AnalyticsDashboardSerializer(
            dashboard, data=request.data, partial=True,
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, dashboard_id):
        """Soft delete analytics dashboard."""
        try:
            dashboard = AnalyticsDashboard.objects.get(
                workspace__slug=slug,
                id=dashboard_id,
                deleted_at__isnull=True,
            )
        except AnalyticsDashboard.DoesNotExist:
            return Response(
                {"error": "Dashboard not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Clean up favorites referencing this dashboard
        UserFavorite.objects.filter(
            entity_identifier=dashboard_id,
            entity_type="analytics_dashboard",
            workspace__slug=slug,
        ).delete()
        dashboard.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AnalyticsDashboardWidgetEndpoint(BaseAPIView):
    """Analytics Dashboard Widget List and Create Endpoint"""

    permission_classes = [WorkSpaceAdminPermission]

    def get(self, request, slug, dashboard_id):
        """List all widgets for a dashboard."""
        widgets = AnalyticsDashboardWidget.objects.filter(
            dashboard__workspace__slug=slug,
            dashboard_id=dashboard_id,
            deleted_at__isnull=True,
        ).select_related("dashboard")

        serializer = AnalyticsDashboardWidgetSerializer(widgets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug, dashboard_id):
        """Create a new widget for a dashboard."""
        try:
            dashboard = AnalyticsDashboard.objects.get(
                workspace__slug=slug,
                id=dashboard_id,
                deleted_at__isnull=True,
            )
        except AnalyticsDashboard.DoesNotExist:
            return Response(
                {"error": "Dashboard not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AnalyticsDashboardWidgetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(dashboard=dashboard)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AnalyticsDashboardWidgetDetailEndpoint(BaseAPIView):
    """Analytics Dashboard Widget Detail, Update, and Delete Endpoint"""

    permission_classes = [WorkSpaceAdminPermission]

    def get(self, request, slug, dashboard_id, widget_id):
        """Get widget detail."""
        try:
            widget = AnalyticsDashboardWidget.objects.get(
                dashboard__workspace__slug=slug,
                dashboard_id=dashboard_id,
                id=widget_id,
                deleted_at__isnull=True,
            )
        except AnalyticsDashboardWidget.DoesNotExist:
            return Response(
                {"error": "Widget not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AnalyticsDashboardWidgetSerializer(widget)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, slug, dashboard_id, widget_id):
        """Update widget."""
        try:
            widget = AnalyticsDashboardWidget.objects.get(
                dashboard__workspace__slug=slug,
                dashboard_id=dashboard_id,
                id=widget_id,
                deleted_at__isnull=True,
            )
        except AnalyticsDashboardWidget.DoesNotExist:
            return Response(
                {"error": "Widget not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AnalyticsDashboardWidgetSerializer(
            widget, data=request.data, partial=True,
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, dashboard_id, widget_id):
        """Delete widget."""
        try:
            widget = AnalyticsDashboardWidget.objects.get(
                dashboard__workspace__slug=slug,
                dashboard_id=dashboard_id,
                id=widget_id,
                deleted_at__isnull=True,
            )
        except AnalyticsDashboardWidget.DoesNotExist:
            return Response(
                {"error": "Widget not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        widget.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AnalyticsDashboardWidgetDataEndpoint(BaseAPIView):
    """Analytics Dashboard Widget Data Endpoint"""

    permission_classes = [WorkSpaceAdminPermission]

    # Whitelist of allowed filter keys for security
    ALLOWED_FILTER_KEYS = [
        "state",
        "priority",
        "labels",
        "assignee",
        "cycle",
        "module",
        "state_group",
    ]

    # Map frontend chart_property keys (lowercase) to backend x_axis keys (uppercase)
    CHART_PROPERTY_TO_X_AXIS = {
        "priority": "PRIORITY",
        "state": "STATES",
        "state_group": "STATE_GROUPS",
        "assignee": "ASSIGNEES",
        "labels": "LABELS",
        "cycle": "CYCLES",
        "module": "MODULES",
        "estimate_point": "ESTIMATE_POINTS",
        "start_date": "START_DATE",
        "target_date": "TARGET_DATE",
        "created_at": "CREATED_AT",
        "completed_at": "COMPLETED_AT",
    }

    def get(self, request, slug, dashboard_id, widget_id):
        """Get widget data based on configuration."""
        try:
            widget = AnalyticsDashboardWidget.objects.select_related(
                "dashboard"
            ).get(
                dashboard__workspace__slug=slug,
                dashboard_id=dashboard_id,
                id=widget_id,
                deleted_at__isnull=True,
            )
        except AnalyticsDashboardWidget.DoesNotExist:
            return Response(
                {"error": "Widget not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get project IDs from dashboard config
        dashboard_config = widget.dashboard.config or {}
        project_ids = dashboard_config.get("project_ids", [])

        # Build base queryset
        queryset = Issue.objects.filter(
            workspace__slug=slug,
            deleted_at__isnull=True,
        )

        # Apply project filter if configured
        if project_ids:
            queryset = queryset.filter(project_id__in=project_ids)

        # Apply widget-specific filters from config (with whitelist + value validation)
        widget_filters = widget.config.get("filters", {})
        for k, v in widget_filters.items():
            if k not in self.ALLOWED_FILTER_KEYS:
                continue
            if isinstance(v, list):
                queryset = queryset.filter(**{f"{k}__in": [str(item) for item in v]})
            elif isinstance(v, str):
                queryset = queryset.filter(**{k: v})

        # Generate data based on widget type
        if widget.widget_type == AnalyticsDashboardWidget.WidgetType.NUMBER:
            if widget.chart_metric == "count":
                count = queryset.count()
                return Response(
                    {"value": count, "metric": widget.chart_metric},
                    status=status.HTTP_200_OK,
                )
            elif widget.chart_metric == "estimate_points":
                total = queryset.aggregate(
                    total=Sum("estimate_point__value")
                )["total"] or 0
                return Response(
                    {"value": total, "metric": widget.chart_metric},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": "Invalid chart metric for number widget."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            # For chart widgets, use build_analytics_chart
            try:
                x_axis_key = self.CHART_PROPERTY_TO_X_AXIS.get(
                    widget.chart_property
                )
                if not x_axis_key:
                    return Response(
                        {"error": f"Invalid chart property: {widget.chart_property}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                chart_data = build_analytics_chart(
                    queryset=queryset,
                    x_axis=x_axis_key,
                )
                return Response(chart_data, status=status.HTTP_200_OK)
            except Exception as e:
                logger.exception("Failed to build chart for widget %s", widget_id)
                return Response(
                    {"error": "Failed to build chart data."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
