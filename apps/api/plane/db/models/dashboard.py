# Django imports
from django.db import models

# Module imports
from .base import BaseModel


class Dashboard(BaseModel):
    """
    Dashboard model for customizable analytics at the workspace level.
    """
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_dashboards"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    projects = models.ManyToManyField(
        "db.Project",
        blank=True,
        related_name="project_dashboards"
    )
    filters = models.JSONField(default=dict, blank=True)
    logo_props = models.JSONField(default=dict, blank=True)
    # 0 = Private, 1 = Public
    access = models.PositiveSmallIntegerField(default=0)
    archived_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Dashboard"
        verbose_name_plural = "Dashboards"
        db_table = "dashboards"

    def __str__(self):
        return self.name


class DashboardWidget(BaseModel):
    """
    DashboardWidget model for individual charts/widgets on a dashboard.
    """
    CHART_TYPE_CHOICES = (
        ("BAR_CHART", "Bar Chart"),
        ("LINE_CHART", "Line Chart"),
        ("AREA_CHART", "Area Chart"),
        ("DONUT_CHART", "Donut Chart"),
        ("PIE_CHART", "Pie Chart"),
        ("NUMBER", "Number"),
    )

    CHART_MODEL_CHOICES = (
        ("BASIC", "Basic"),
        ("GROUPED", "Grouped"),
    )

    dashboard = models.ForeignKey(
        "db.Dashboard",
        on_delete=models.CASCADE,
        related_name="widgets"
    )
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_dashboard_widgets"
    )
    name = models.CharField(max_length=255)
    chart_type = models.CharField(max_length=50, choices=CHART_TYPE_CHOICES)
    chart_model = models.CharField(max_length=50, choices=CHART_MODEL_CHOICES, default="BASIC")
    x_axis_property = models.CharField(max_length=100)
    y_axis_metric = models.CharField(max_length=100)
    group_by = models.CharField(max_length=100, null=True, blank=True)
    config = models.JSONField(default=dict, blank=True)
    filters = models.JSONField(default=dict, blank=True)
    
    # Grid positioning
    x_axis_coord = models.IntegerField(default=0)
    y_axis_coord = models.IntegerField(default=0)
    width = models.IntegerField(default=2)
    height = models.IntegerField(default=2)

    class Meta:
        verbose_name = "Dashboard Widget"
        verbose_name_plural = "Dashboard Widgets"
        db_table = "dashboard_widgets"
        ordering = ("created_at",)

    def __str__(self):
        return f"{self.name} - {self.dashboard.name}"

