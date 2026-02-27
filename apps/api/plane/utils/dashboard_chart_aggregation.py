"""
Utility for aggregating Issue data for dashboard widget charts.
Extracts complex aggregation logic from the DashboardWidgetChartEndpoint view.
"""

from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone

from plane.db.models import Issue


# Y-axis metric aggregation definitions
METRICS_MAP = {
    "count": {"count": Count("id")},
    "WORK_ITEM_COUNT": {"count": Count("id")},
    "estimate_points": {"count": Coalesce(Sum("estimate_point"), 0)},
    "ESTIMATE_POINTS": {"count": Coalesce(Sum("estimate_point"), 0)},
    "PENDING_WORK_ITEMS": {"count": Count("id", filter=Q(state__group__in=["unstarted", "backlog"]))},
    "COMPLETED_WORK_ITEMS": {"count": Count("id", filter=Q(state__group="completed"))},
    "IN_PROGRESS_WORK_ITEMS": {"count": Count("id", filter=Q(state__group="started"))},
    "BLOCKED_WORK_ITEMS": {
        "count": Count("issue_relation__id", filter=Q(issue_relation__relation_type="blocked_by"), distinct=True)
    },
}

# X-axis / group-by property field mappings
X_AXIS_MAP = {
    "state": ("state_id", "state__name"),
    "STATES": ("state_id", "state__name"),
    "state_group": ("state__group",),
    "STATE_GROUPS": ("state__group",),
    "assignee": ("assignees__id", "assignees__display_name"),
    "ASSIGNEES": ("assignees__id", "assignees__display_name"),
    "project": ("project_id", "project__name"),
    "PROJECTS": ("project_id", "project__name"),
    "priority": ("priority",),
    "PRIORITIES": ("priority",),
    "labels": ("labels__id", "labels__name"),
    "LABELS": ("labels__id", "labels__name"),
}

# Whitelist for safe filter injection (prevents ORM injection)
FILTER_MAPPING = {
    "priority": "priority__in",
    "assignees": "assignees__id__in",
    "labels": "labels__id__in",
    "state": "state_id__in",
    "state_group": "state__group__in",
    "created_by": "created_by_id__in",
}


def build_base_queryset(slug, project_ids, widget_filters):
    """Build the base Issue queryset with workspace, project, and widget filter scoping."""
    base_qs = Issue.issue_objects.filter(
        workspace__slug=slug,
        project_id__in=project_ids,
    )

    query_kwargs = {}
    for rule_key, rules in (widget_filters or {}).items():
        if rule_key in FILTER_MAPPING and rules:
            query_kwargs[FILTER_MAPPING[rule_key]] = rules

    return base_qs.filter(**query_kwargs).distinct()


def resolve_aggregation(y_axis_metric, base_qs):
    """Resolve the aggregation dict and apply date-based queryset filters if needed."""
    now_date = timezone.now().date()

    if y_axis_metric == "WORK_ITEMS_DUE_TODAY":
        base_qs = base_qs.filter(target_date=now_date).exclude(state__group="completed")
        return base_qs, {"count": Count("id")}

    if y_axis_metric == "WORK_ITEMS_DUE_THIS_WEEK":
        start_of_week = now_date - timezone.timedelta(days=now_date.weekday())
        end_of_week = start_of_week + timezone.timedelta(days=6)
        base_qs = base_qs.filter(target_date__range=(start_of_week, end_of_week)).exclude(state__group="completed")
        return base_qs, {"count": Count("id")}

    return base_qs, METRICS_MAP.get(y_axis_metric, {"count": Count("id")})


def aggregate_chart_data(widget, slug):
    """
    Main aggregation entry point. Returns formatted chart data list
    ready for frontend Recharts consumption.
    """
    dashboard = widget.dashboard
    project_ids = dashboard.projects.all()

    base_qs = build_base_queryset(slug, project_ids, widget.filters)
    base_qs, aggregation = resolve_aggregation(widget.y_axis_metric, base_qs)

    # Number widget: simple aggregate, no grouping
    if widget.chart_type == "NUMBER":
        result = base_qs.aggregate(**aggregation)
        return [result]

    group_fields = X_AXIS_MAP.get(widget.x_axis_property, ("state_id",))

    # Secondary group-by for stacked/multi-line charts
    is_grouped = widget.chart_model == "GROUPED" and widget.group_by
    if is_grouped:
        secondary_group = X_AXIS_MAP.get(widget.group_by, ("priority",))
        group_fields = group_fields + secondary_group

    qs_results = base_qs.values(*group_fields).annotate(**aggregation)

    if not is_grouped:
        return [
            {"name": item.get(group_fields[-1]) or "None", "count": item.get("count", 0)}
            for item in qs_results
        ]

    # Flatten 2D grouped results into pivoted dict format for Recharts
    group_dict = {}
    x_axis_fields = X_AXIS_MAP.get(widget.x_axis_property, ())
    primary_key = group_fields[1] if len(x_axis_fields) > 1 else group_fields[0]
    secondary_key = group_fields[-1]

    for item in qs_results:
        p_val = item.get(primary_key) or "None"
        s_val = item.get(secondary_key) or "None"
        if p_val not in group_dict:
            group_dict[p_val] = {"name": p_val}
        group_dict[p_val][str(s_val)] = item.get("count", 0)

    return list(group_dict.values())
