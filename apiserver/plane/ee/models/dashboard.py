# Django imports
from django.db import models

from plane.db.models import BaseModel, ProjectBaseModel


class Dashboard(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="dashboard"
    )
    name = models.CharField(max_length=255)
    filters = models.JSONField(default=dict)
    logo_props = models.JSONField(default=dict)
    owned_by = models.ForeignKey(
        "db.User", on_delete=models.CASCADE, related_name="dashboard"
    )
    access = models.PositiveSmallIntegerField(
        default=1, choices=((0, "Private"), (1, "Public"))
    )

    class Meta:
        verbose_name = "Dashboard"
        verbose_name_plural = "Dashboards"
        db_table = "dashboards"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the dashboard"""
        return f"{self.name}"


class DashboardProject(ProjectBaseModel):
    dashboard = models.ForeignKey(
        Dashboard, on_delete=models.CASCADE, related_name="dashboard_projects"
    )

    class Meta:
        unique_together = ("dashboard", "project", "deleted_at")
        constraints = [
            models.UniqueConstraint(
                fields=["dashboard", "project"],
                condition=models.Q(deleted_at__isnull=True),
                name="dashboard_project_unique_dashboard_project_when_deleted_at_null",
            )
        ]
        verbose_name = "Dashboard Project"
        verbose_name_plural = "Dashboard Projects"
        db_table = "dashboard_projects"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the dashboard and project name"""
        return f"{self.dashboard.name} {self.project.name}"


class DashboardQuickFilter(BaseModel):
    name = models.CharField(max_length=255)
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="quick_filters"
    )
    dashboard = models.ForeignKey(
        Dashboard, on_delete=models.CASCADE, related_name="quick_filters"
    )
    filters = models.JSONField(default=dict)

    class Meta:
        unique_together = ("dashboard", "filters", "deleted_at")
        constraints = [
            models.UniqueConstraint(
                fields=["dashboard", "filters"],
                condition=models.Q(deleted_at__isnull=True),
                name="dashboard_quick_filter_unique_dashboard_quick_filter_when_deleted_at_null",
            )
        ]
        verbose_name = "Dashboard Quick Filter"
        verbose_name_plural = "Dashboard Quick Filters"
        db_table = "dashboard_quick_filters"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the dashboard quick filter"""
        return f"{self.dashboard.name} {self.name}"


class Widget(BaseModel):
    class ChartTypeEnum(models.TextChoices):
        BAR_CHART = "BAR_CHART", "Bar Chart"
        LINE_CHART = "LINE_CHART", "Line Chart"
        AREA_CHART = "AREA_CHART", "Area Chart"
        PIE_CHART = "PIE_CHART", "Pie Chart"
        DONUT_CHART = "DONUT_CHART", "Donut Chart"
        NUMBER = "NUMBER", "Number Chart"

    class ChartModelEnum(models.TextChoices):
        BASIC = "BASIC", "Basic"
        STACKED = "STACKED", "Stacked"
        GROUPED = "GROUPED", "Grouped"
        MULTI_LINE = "MULTI_LINE", "Multi Line"
        COMPARISON = "COMPARISON", "Comparison"
        PROGRESS = "PROGRESS", "Progress"

    class PropertyEnum(models.TextChoices):
        STATES = "STATES", "States"
        STATE_GROUPS = "STATE_GROUPS", "State Groups"
        LABELS = "LABELS", "Labels"
        ASSIGNEES = "ASSIGNEES", "Assignees"
        ESTIMATE_POINTS = "ESTIMATE_POINTS", "Estimate Points"
        CYCLES = "CYCLES", "Cycles"
        MODULES = "MODULES", "Modules"
        PRIORITY = "PRIORITY", "Priority"
        START_DATE = "START_DATE", "Start Date"
        TARGET_DATE = "TARGET_DATE", "Target Date"
        CREATED_AT = "CREATED_AT", "Created At"
        COMPLETED_AT = "COMPLETED_AT", "Completed At"
        WORK_ITEM_TYPES = "WORK_ITEM_TYPES", "Work Item Types"
        PROJECTS = "PROJECTS", "Projects"
        CREATED_BY = "CREATED_BY", "Created By"
        EPICS = "EPICS", "Epics"

    class XAxisDateGroupingEnum(models.TextChoices):
        DAY = "DAY", "Day"
        WEEK = "WEEK", "Week"
        MONTH = "MONTH", "Month"
        YEAR = "YEAR", "Year"

    class YAxisMetricEnum(models.TextChoices):
        WORK_ITEM_COUNT = "WORK_ITEM_COUNT", "Work Item Count"
        ESTIMATE_POINT_COUNT = "ESTIMATE_POINT_COUNT", "Estimate Point Count"

        PENDING_WORK_ITEM_COUNT = "PENDING_WORK_ITEM_COUNT", "Pending Work Item Count"
        COMPLETED_WORK_ITEM_COUNT = (
            "COMPLETED_WORK_ITEM_COUNT",
            "Completed Work Item Count",
        )
        IN_PROGRESS_WORK_ITEM_COUNT = (
            "IN_PROGRESS_WORK_ITEM_COUNT",
            "In Progress Work Item Count",
        )
        WORK_ITEM_DUE_THIS_WEEK_COUNT = (
            "WORK_ITEM_DUE_THIS_WEEK_COUNT",
            "Work Item Due This Week Count",
        )
        WORK_ITEM_DUE_TODAY_COUNT = (
            "WORK_ITEM_DUE_TODAY_COUNT",
            "Work Item Due Today Count",
        )
        BLOCKED_WORK_ITEM_COUNT = "BLOCKED_WORK_ITEM_COUNT", "Blocked Work Item Count"

    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="widgets"
    )
    name = models.CharField(max_length=255)
    chart_type = models.CharField(max_length=255)
    chart_model = models.CharField(max_length=255)
    config = models.JSONField(default=dict)

    x_axis_property = models.CharField(max_length=255, null=True, blank=True)
    x_axis_date_grouping = models.CharField(max_length=255, null=True, blank=True)
    y_axis_metric = models.CharField(max_length=255, null=True, blank=True)

    group_by = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        verbose_name = "Widget"
        verbose_name_plural = "Widgets"
        db_table = "widgets"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the widget"""
        return f"{self.name}"


class DashboardWidget(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="dashboard_widgets"
    )
    dashboard = models.ForeignKey(
        Dashboard, on_delete=models.CASCADE, related_name="dashboard_widgets"
    )
    widget = models.ForeignKey(
        Widget, on_delete=models.CASCADE, related_name="dashboard_widgets"
    )
    filters = models.JSONField(default=dict)
    # widget dimensions
    height = models.PositiveIntegerField(default=1)
    width = models.PositiveIntegerField(default=1)
    x_axis_coord = models.PositiveIntegerField(default=0)
    y_axis_coord = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("dashboard", "widget", "deleted_at")
        constraints = [
            models.UniqueConstraint(
                fields=["dashboard", "widget"],
                condition=models.Q(deleted_at__isnull=True),
                name="dashboard_widget_unique_dashboard_widget_when_deleted_at_null",
            )
        ]
        verbose_name = "Dashboard Widget"
        verbose_name_plural = "Dashboard Widgets"
        db_table = "dashboard_widgets"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the dashboard widget"""
        return f"{self.dashboard.name} {self.widget.name}"
