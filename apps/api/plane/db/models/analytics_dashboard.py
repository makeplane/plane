# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.conf import settings
from django.db import models

from .base import BaseModel
from .workspace import WorkspaceBaseModel


class AnalyticsDashboard(WorkspaceBaseModel):
    """Workspace-scoped analytics dashboard for Pro feature.

    Stores dashboard metadata and project scoping.
    Supports multiple dashboards per workspace with shared editing.
    """

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    logo_props = models.JSONField(default=dict)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_analytics_dashboards",
    )
    is_default = models.BooleanField(default=False)
    sort_order = models.FloatField(default=65535)
    # Project scoping and layout config stored as JSON
    config = models.JSONField(
        default=dict,
        help_text="Dashboard config: {project_ids: [], layout: {}, filters: {}}",
    )

    class Meta:
        db_table = "analytics_dashboards"
        verbose_name = "Analytics Dashboard"
        verbose_name_plural = "Analytics Dashboards"
        ordering = ("sort_order", "-created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="analytics_dashboard_unique_workspace_name_when_not_deleted",
            )
        ]
        indexes = [
            models.Index(fields=["workspace", "deleted_at"]),
            models.Index(fields=["owner", "deleted_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.name}"


class AnalyticsDashboardWidget(BaseModel):
    """Widget configuration for analytics dashboard.

    Stores widget type, chart configuration, positioning, and styling.
    Each widget fetches data independently via analytics infrastructure.
    """

    class WidgetType(models.TextChoices):
        BAR = "bar", "Bar Chart"
        LINE = "line", "Line Chart"
        AREA = "area", "Area Chart"
        DONUT = "donut", "Donut Chart"
        PIE = "pie", "Pie Chart"
        NUMBER = "number", "Number Widget"

    dashboard = models.ForeignKey(
        "db.AnalyticsDashboard",
        on_delete=models.CASCADE,
        related_name="widgets",
    )
    widget_type = models.CharField(
        max_length=50,
        choices=WidgetType.choices,
        default=WidgetType.BAR,
    )
    title = models.CharField(max_length=255, blank=True)
    # Chart configuration
    chart_property = models.CharField(
        max_length=100,
        help_text="X-axis property: priority, state, assignee, labels, etc.",
    )
    chart_metric = models.CharField(
        max_length=100,
        default="count",
        help_text="Y-axis metric: count, estimate_points",
    )
    # Widget config: colors, style, display options, filters
    config = models.JSONField(
        default=dict,
        help_text="Widget config: {color_preset, fill_opacity, show_border, smoothing, show_legend, show_tooltip, center_value, show_markers, filters}",
    )
    # Grid positioning
    position = models.JSONField(
        default=dict,
        help_text="Grid position: {row, col, width, height}",
    )
    sort_order = models.FloatField(default=65535)

    class Meta:
        db_table = "analytics_dashboard_widgets"
        verbose_name = "Analytics Dashboard Widget"
        verbose_name_plural = "Analytics Dashboard Widgets"
        ordering = ("sort_order", "-created_at")
        indexes = [
            models.Index(fields=["dashboard", "deleted_at"]),
            models.Index(fields=["widget_type"]),
        ]

    def __str__(self) -> str:
        return f"{self.title or self.get_widget_type_display()}"
