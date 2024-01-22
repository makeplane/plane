# Python imports
from itertools import groupby
from datetime import timedelta

# Django import
from django.db import models
from django.utils import timezone
from django.db.models.functions import TruncDate
from django.db.models import Count, F, Sum, Value, Case, When, CharField
from django.db.models.functions import (
    Coalesce,
    ExtractMonth,
    ExtractYear,
    Concat,
)

# Module imports
from plane.db.models import Issue


def annotate_with_monthly_dimension(queryset, field_name, attribute):
    # Get the year and the months
    year = ExtractYear(field_name)
    month = ExtractMonth(field_name)
    # Concat the year and month
    dimension = Concat(year, Value("-"), month, output_field=CharField())
    # Annotate the dimension
    return queryset.annotate(**{attribute: dimension})


def extract_axis(queryset, x_axis):
    # Format the dimension when the axis is in date
    if x_axis in ["created_at", "start_date", "target_date", "completed_at"]:
        queryset = annotate_with_monthly_dimension(
            queryset, x_axis, "dimension"
        )
        return queryset, "dimension"
    else:
        return queryset.annotate(dimension=F(x_axis)), "dimension"


def sort_data(data, temp_axis):
    # When the axis is in priority order by
    if temp_axis == "priority":
        order = ["low", "medium", "high", "urgent", "none"]
        return {key: data[key] for key in order if key in data}
    else:
        return dict(sorted(data.items(), key=lambda x: (x[0] == "none", x[0])))


def build_graph_plot(queryset, x_axis, y_axis, segment=None):
    # temp x_axis
    temp_axis = x_axis
    # Extract the x_axis and queryset
    queryset, x_axis = extract_axis(queryset, x_axis)
    if x_axis == "dimension":
        queryset = queryset.exclude(dimension__isnull=True)

    #
    if segment in ["created_at", "start_date", "target_date", "completed_at"]:
        queryset = annotate_with_monthly_dimension(
            queryset, segment, "segmented"
        )
        segment = "segmented"

    queryset = queryset.values(x_axis)

    # Issue count
    if y_axis == "issue_count":
        queryset = queryset.annotate(
            is_null=Case(
                When(dimension__isnull=True, then=Value("None")),
                default=Value("not_null"),
                output_field=models.CharField(max_length=8),
            ),
            dimension_ex=Coalesce("dimension", Value("null")),
        ).values("dimension")
        queryset = (
            queryset.annotate(segment=F(segment)) if segment else queryset
        )
        queryset = (
            queryset.values("dimension", "segment")
            if segment
            else queryset.values("dimension")
        )
        queryset = queryset.annotate(count=Count("*")).order_by("dimension")

    # Estimate
    else:
        queryset = queryset.annotate(estimate=Sum("estimate_point")).order_by(
            x_axis
        )
        queryset = (
            queryset.annotate(segment=F(segment)) if segment else queryset
        )
        queryset = (
            queryset.values("dimension", "segment", "estimate")
            if segment
            else queryset.values("dimension", "estimate")
        )

    result_values = list(queryset)
    grouped_data = {
        str(key): list(items)
        for key, items in groupby(
            result_values, key=lambda x: x[str("dimension")]
        )
    }

    return sort_data(grouped_data, temp_axis)


def burndown_plot(queryset, slug, project_id, cycle_id=None, module_id=None):
    # Total Issues in Cycle or Module
    total_issues = queryset.total_issues

    if cycle_id:
        # Get all dates between the two dates
        date_range = [
            queryset.start_date + timedelta(days=x)
            for x in range((queryset.end_date - queryset.start_date).days + 1)
        ]

        chart_data = {str(date): 0 for date in date_range}

        completed_issues_distribution = (
            Issue.issue_objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_cycle__cycle_id=cycle_id,
            )
            .annotate(date=TruncDate("completed_at"))
            .values("date")
            .annotate(total_completed=Count("id"))
            .values("date", "total_completed")
            .order_by("date")
        )

    if module_id:
        # Get all dates between the two dates
        date_range = [
            queryset.start_date + timedelta(days=x)
            for x in range(
                (queryset.target_date - queryset.start_date).days + 1
            )
        ]

        chart_data = {str(date): 0 for date in date_range}

        completed_issues_distribution = (
            Issue.issue_objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_module__module_id=module_id,
            )
            .annotate(date=TruncDate("completed_at"))
            .values("date")
            .annotate(total_completed=Count("id"))
            .values("date", "total_completed")
            .order_by("date")
        )

    for date in date_range:
        cumulative_pending_issues = total_issues
        total_completed = 0
        total_completed = sum(
            item["total_completed"]
            for item in completed_issues_distribution
            if item["date"] is not None and item["date"] <= date
        )
        cumulative_pending_issues -= total_completed
        if date > timezone.now().date():
            chart_data[str(date)] = None
        else:
            chart_data[str(date)] = cumulative_pending_issues

    return chart_data
