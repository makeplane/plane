# Python imports
from itertools import groupby

# Django import
from django.db.models import Count, DateField, F, Sum
from django.db.models.functions import Cast


def build_graph_plot(queryset, x_axis, y_axis, segment=None):
    if x_axis in ["created_at", "completed_at"]:
        queryset = queryset.annotate(dimension=Cast(x_axis, DateField()))
        x_axis = "dimension"
    else:
        queryset = queryset.annotate(dimension=F(x_axis))
        x_axis = "dimension"
    if x_axis in ["created_at", "start_date", "target_date", "completed_at"]:
        queryset = queryset.exclude(x_axis__is_null=True)

    queryset = queryset.values(x_axis)

    # Group queryset by x_axis field

    if segment:
        queryset = queryset.annotate(segment=F(segment))

    if y_axis == "issue_count":
        queryset = queryset.annotate(count=Count("dimension")).order_by("dimension")
    if y_axis == "effort":
        queryset = queryset.annotate(effort=Sum("estimate_point")).order_by(x_axis)

    result_values = list(queryset)
    grouped_data = {}
    for date, items in groupby(result_values, key=lambda x: x[str(x_axis)]):
        grouped_data[str(date)] = list(items)

    return grouped_data
