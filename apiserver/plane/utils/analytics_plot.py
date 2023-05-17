# Python imports
from itertools import groupby

# Django import
from django.db import models
from django.db.models import Count, F, Sum, Value, Case, When, CharField
from django.db.models.functions import Coalesce, ExtractMonth, ExtractYear, Concat


def build_graph_plot(queryset, x_axis, y_axis, segment=None):

    temp_axis = x_axis

    if x_axis in ["created_at", "start_date", "target_date", "completed_at"]:
        year = ExtractYear(x_axis)
        month = ExtractMonth(x_axis)
        dimension = Concat(year, Value("-"), month, output_field=CharField())
        queryset = queryset.annotate(dimension=dimension)
        x_axis = "dimension"
    else:
        queryset = queryset.annotate(dimension=F(x_axis))
        x_axis = "dimension"

    if x_axis in ["created_at", "start_date", "target_date", "completed_at"]:
        queryset = queryset.exclude(x_axis__is_null=True)

    if segment in ["created_at", "start_date", "target_date", "completed_at"]:
        year = ExtractYear(segment)
        month = ExtractMonth(segment)
        dimension = Concat(year, Value("-"), month, output_field=CharField())
        queryset = queryset.annotate(segmented=dimension)
        segment = "segmented"

    queryset = queryset.values(x_axis)

    # Group queryset by x_axis field

    if y_axis == "issue_count":
        queryset = queryset.annotate(
            is_null=Case(
                When(dimension__isnull=True, then=Value("None")),
                default=Value("not_null"),
                output_field=models.CharField(max_length=8),
            ),
            dimension_ex=Coalesce("dimension", Value("null")),
        ).values("dimension")
        if segment:
            queryset = queryset.annotate(segment=F(segment)).values(
                "dimension", "segment"
            )
        else:
            queryset = queryset.values("dimension")

        queryset = queryset.annotate(count=Count("*")).order_by("dimension")

    if y_axis == "estimate":
        queryset = queryset.annotate(estimate=Sum("estimate_point")).order_by(x_axis)
        if segment:
            queryset = queryset.annotate(segment=F(segment)).values(
                "dimension", "segment", "estimate"
            )
        else:
            queryset = queryset.values("dimension", "estimate")

    result_values = list(queryset)
    grouped_data = {}
    for key, items in groupby(result_values, key=lambda x: x[str("dimension")]):
        grouped_data[str(key)] = list(items)

    sorted_data = grouped_data
    if temp_axis == "priority":
        order = ["low", "medium", "high", "urgent", "None"]
        sorted_data = {key: grouped_data[key] for key in order if key in grouped_data}
    else:
        sorted_data = dict(sorted(grouped_data.items(), key=lambda x: (x[0] is "None", x[0])))
    return sorted_data
