import uuid

# Django imports
from django.db import models

# Module imports
from ..mixins import TimeAuditModel
from .base import BaseModel


class DeprecatedDashboard(BaseModel):
    DASHBOARD_CHOICES = (
        ("workspace", "Workspace"),
        ("project", "Project"),
        ("home", "Home"),
        ("team", "Team"),
        ("user", "User"),
    )
    name = models.CharField(max_length=255)
    description_html = models.TextField(blank=True, default="<p></p>")
    identifier = models.UUIDField(null=True)
    owned_by = models.ForeignKey(
        "db.User", on_delete=models.CASCADE, related_name="dashboards"
    )
    is_default = models.BooleanField(default=False)
    type_identifier = models.CharField(
        max_length=30,
        choices=DASHBOARD_CHOICES,
        verbose_name="Dashboard Type",
        default="home",
    )
    logo_props = models.JSONField(default=dict)

    def __str__(self):
        """Return name of the dashboard"""
        return f"{self.name}"

    class Meta:
        verbose_name = "DeprecatedDashboard"
        verbose_name_plural = "DeprecatedDashboards"
        db_table = "deprecated_dashboards"
        ordering = ("-created_at",)


class DeprecatedWidget(TimeAuditModel):
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True
    )
    key = models.CharField(max_length=255)
    filters = models.JSONField(default=dict)
    logo_props = models.JSONField(default=dict)

    def __str__(self):
        """Return name of the widget"""
        return f"{self.key}"

    class Meta:
        verbose_name = "DeprecatedWidget"
        verbose_name_plural = "DeprecatedWidgets"
        db_table = "deprecated_widgets"
        ordering = ("-created_at",)


class DeprecatedDashboardWidget(BaseModel):
    widget = models.ForeignKey(
        DeprecatedWidget, on_delete=models.CASCADE, related_name="dashboard_widgets"
    )
    dashboard = models.ForeignKey(
        DeprecatedDashboard, on_delete=models.CASCADE, related_name="dashboard_widgets"
    )
    is_visible = models.BooleanField(default=True)
    sort_order = models.FloatField(default=65535)
    filters = models.JSONField(default=dict)
    properties = models.JSONField(default=dict)

    def __str__(self):
        """Return name of the dashboard"""
        return f"{self.dashboard.name} {self.widget.key}"

    class Meta:
        unique_together = ("widget", "dashboard", "deleted_at")
        constraints = [
            models.UniqueConstraint(
                fields=["widget", "dashboard"],
                condition=models.Q(deleted_at__isnull=True),
                name="dashboard_widget_unique_widget_dashboard_when_deleted_at_null",
            )
        ]
        verbose_name = "Deprecated Dashboard Widget"
        verbose_name_plural = "Deprecated Dashboard Widgets"
        db_table = "deprecated_dashboard_widgets"
        ordering = ("-created_at",)
