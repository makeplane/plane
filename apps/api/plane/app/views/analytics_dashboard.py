# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import logging
from datetime import datetime

from rest_framework import status
from rest_framework.response import Response
from django.db import transaction
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


class AnalyticsDashboardDuplicateEndpoint(BaseAPIView):
    """Duplicate an analytics dashboard with all its widgets."""

    permission_classes = [WorkSpaceAdminPermission]

    def post(self, request, slug, dashboard_id):
        """Clone dashboard and all its widgets atomically."""
        try:
            source = AnalyticsDashboard.objects.get(
                workspace__slug=slug, id=dashboard_id, deleted_at__isnull=True,
            )
        except AnalyticsDashboard.DoesNotExist:
            return Response(
                {"error": "Dashboard not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        with transaction.atomic():
            # Generate unique copy name
            base_name = f"{source.name} (Copy)"
            copy_name = base_name
            counter = 2
            while AnalyticsDashboard.objects.filter(
                workspace=source.workspace, name=copy_name, deleted_at__isnull=True,
            ).exists():
                copy_name = f"{source.name} (Copy {counter})"
                counter += 1

            # Create new dashboard
            new_dashboard = AnalyticsDashboard.objects.create(
                workspace=source.workspace,
                name=copy_name,
                description=source.description,
                logo_props=source.logo_props,
                config=source.config,
                owner=request.user,
            )

            # Clone all widgets
            source_widgets = AnalyticsDashboardWidget.objects.filter(
                dashboard=source, deleted_at__isnull=True,
            )
            new_widgets = []
            for w in source_widgets:
                new_widgets.append(AnalyticsDashboardWidget(
                    dashboard=new_dashboard,
                    widget_type=w.widget_type,
                    title=w.title,
                    chart_property=w.chart_property,
                    chart_metric=w.chart_metric,
                    config=w.config,
                    position=w.position,
                    sort_order=w.sort_order,
                ))
            if new_widgets:
                AnalyticsDashboardWidget.objects.bulk_create(new_widgets)

        serializer = AnalyticsDashboardDetailSerializer(new_dashboard)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AnalyticsDashboardWidgetBulkPositionEndpoint(BaseAPIView):
    """Bulk update widget positions after drag-and-drop or resize."""

    permission_classes = [WorkSpaceAdminPermission]

    def patch(self, request, slug, dashboard_id):
        """Bulk update widget positions. Expects: {"positions": [{"id": uuid, "position": {row, col, width, height}}]}"""
        positions = request.data.get("positions", [])
        if not positions or not isinstance(positions, list):
            return Response(
                {"error": "positions array is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate dashboard belongs to workspace
        if not AnalyticsDashboard.objects.filter(
            workspace__slug=slug, id=dashboard_id, deleted_at__isnull=True,
        ).exists():
            return Response(
                {"error": "Dashboard not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Bulk update each widget position
        widget_ids = [p["id"] for p in positions if "id" in p and "position" in p]
        widgets = AnalyticsDashboardWidget.objects.filter(
            dashboard_id=dashboard_id, id__in=widget_ids, deleted_at__isnull=True,
        )
        widget_map = {str(w.id): w for w in widgets}

        updated = []
        for item in positions:
            widget = widget_map.get(str(item.get("id")))
            if not widget:
                continue
            pos = item.get("position", {})
            widget.position = {
                "row": max(0, int(pos.get("row", 0))),
                "col": max(0, int(pos.get("col", 0))),
                "width": max(1, int(pos.get("width", 1))),
                "height": max(1, int(pos.get("height", 1))),
            }
            updated.append(widget)

        if updated:
            AnalyticsDashboardWidget.objects.bulk_update(updated, ["position"])

        return Response({"updated": len(updated)}, status=status.HTTP_200_OK)


class AnalyticsDashboardWidgetDataEndpoint(BaseAPIView):
    """Analytics Dashboard Widget Data Endpoint"""

    permission_classes = [WorkSpaceAdminPermission]

    MAX_FILTER_ARRAY_SIZE = 100

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

    # Date range filter keys mapped to Django ORM lookups
    DATE_RANGE_FILTER_KEYS = {
        "start_date": "start_date",
        "target_date": "target_date",
        "created_at": "created_at",
        "completed_at": "completed_at",
    }

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

    @staticmethod
    def _is_valid_date(date_str):
        """Validate ISO 8601 date string (YYYY-MM-DD)."""
        try:
            datetime.fromisoformat(date_str)
            return True
        except (ValueError, TypeError):
            return False

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
            if k in self.ALLOWED_FILTER_KEYS:
                if isinstance(v, list):
                    if len(v) > self.MAX_FILTER_ARRAY_SIZE:
                        continue
                    queryset = queryset.filter(**{f"{k}__in": [str(item) for item in v]})
                elif isinstance(v, str):
                    queryset = queryset.filter(**{k: v})
            elif k in self.DATE_RANGE_FILTER_KEYS and isinstance(v, dict):
                # Handle date range filters with __gte / __lte lookups
                field = self.DATE_RANGE_FILTER_KEYS[k]
                after_val = v.get("after")
                before_val = v.get("before")
                if after_val and self._is_valid_date(str(after_val)):
                    queryset = queryset.filter(**{f"{field}__gte": str(after_val)})
                if before_val and self._is_valid_date(str(before_val)):
                    queryset = queryset.filter(**{f"{field}__lte": str(before_val)})

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
