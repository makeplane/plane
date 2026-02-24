# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from typing import Dict, Any, Tuple, Optional, List, Union
from datetime import date


# Django imports
from django.utils import timezone
from django.db.models import (
    Count,
    F,
    Sum,
    FloatField,
    Value,
    Case,
    When,
    UUIDField,
    CharField,
    QuerySet,
    Aggregate,
)
from django.db.models.functions import Cast, TruncDay, TruncWeek, TruncMonth, TruncYear, Coalesce
from django.db import models

from plane.ee.models import Widget
from plane.db.models import Issue
from rest_framework.exceptions import ValidationError
from plane.ee.utils.nested_issue_children import get_all_related_issues_for_epics


def get_y_axis_filter(y_axis: str) -> Dict[str, Any]:
    today = timezone.now().date()
    filter_mapping = {
        Widget.YAxisMetricEnum.WORK_ITEM_COUNT: {"id": F("id")},
        Widget.YAxisMetricEnum.ESTIMATE_POINT_COUNT: {"estimate_point__value": F("estimate_point__value")},
        Widget.YAxisMetricEnum.IN_PROGRESS_WORK_ITEM_COUNT: {"state__group__in": ["unstarted", "started"]},
        Widget.YAxisMetricEnum.COMPLETED_WORK_ITEM_COUNT: {"state__group": "completed"},
        Widget.YAxisMetricEnum.PENDING_WORK_ITEM_COUNT: {"state__group__in": ["unstarted", "started", "backlog"]},
        Widget.YAxisMetricEnum.BLOCKED_WORK_ITEM_COUNT: {"issue_relation__relation_type": "blocked_by"},
        Widget.YAxisMetricEnum.WORK_ITEM_DUE_TODAY_COUNT: {"target_date": today},
        Widget.YAxisMetricEnum.WORK_ITEM_DUE_THIS_WEEK_COUNT: {
            "target_date__gte": today - timezone.timedelta(days=today.weekday()),
            "target_date__lte": today + timezone.timedelta(days=(6 - today.weekday())),
        },
    }
    return filter_mapping.get(y_axis, {})


def get_x_axis_field() -> Dict[str, Tuple[str, str, Optional[Dict[str, Any]]]]:
    return {
        "STATES": ("state__id", "state__name", None),
        "STATE_GROUPS": ("state__group", "state__group", None),
        "LABELS": (
            "labels__id",
            "labels__name",
            {"label_issue__deleted_at__isnull": True},
        ),
        "ASSIGNEES": (
            "assignees__id",
            "assignees__display_name",
            {"issue_assignee__deleted_at__isnull": True},
        ),
        "ESTIMATE_POINTS": ("estimate_point__key", "estimate_point__value", None),
        "CYCLES": (
            "issue_cycle__cycle_id",
            "issue_cycle__cycle__name",
            {"issue_cycle__deleted_at__isnull": True},
        ),
        "MODULES": (
            "issue_module__module_id",
            "issue_module__module__name",
            {"issue_module__deleted_at__isnull": True},
        ),
        "PRIORITY": ("priority", "priority", None),
        "START_DATE": ("start_date", "start_date", None),
        "TARGET_DATE": ("target_date", "target_date", None),
        "CREATED_AT": ("created_at__date", "created_at__date", None),
        "COMPLETED_AT": ("completed_at__date", "completed_at__date", None),
        "WORK_ITEM_TYPES": ("type_id", "type__name", None),
        "PROJECTS": ("project_id", "project__name", None),
        "CREATED_BY": ("created_by_id", "created_by__display_name", None),
        "EPICS": ("id", "name", None),
    }


def process_grouped_data(
    data: List[Dict[str, Any]],
) -> Tuple[List[Dict[str, Any]], Dict[str, str]]:
    response = {}
    schema = {}

    for item in data:
        key = item["key"]
        project_id_for_ordering = item.get("project_id_for_ordering")
        response_key = (project_id_for_ordering, key) if project_id_for_ordering is not None else key

        estimate_type = item.get("estimate_type")
        display_name = item.get("display_name", key) if item.get("display_name", key) else "None"

        # Format display_name if estimate type is "time"
        if estimate_type == "time":
            display_name = format_time_estimate(display_name) if display_name else "None"

        if response_key not in response:
            response[response_key] = {
                "key": key if key else "None",
                "name": display_name,
                "count": 0,
            }
        group_key = str(item["group_key"]) if item["group_key"] is not None else "None"
        schema[group_key] = item.get("group_name", item["group_key"])
        schema[group_key] = schema[group_key] if schema[group_key] else "None"
        response[response_key][group_key] = response[response_key].get(group_key, 0) + item["count"]
        response[response_key]["count"] += item["count"]

    return list(response.values()), schema


def apply_date_grouping(
    queryset: QuerySet[Issue], x_axis: str, x_axis_date_grouping: str, id_field: str
) -> Tuple[QuerySet[Issue], str, str]:
    date_group_mapper = {
        "DAY": TruncDay,
        "WEEK": TruncWeek,
        "MONTH": TruncMonth,
        "YEAR": TruncYear,
    }
    name_field = id_field

    trunc_function = date_group_mapper.get(x_axis_date_grouping)
    if trunc_function:
        queryset = queryset.annotate(date_group=trunc_function(F(id_field)))
        id_field = "date_group"
        name_field = "date_group"

    return queryset, id_field, name_field


def fill_missing_dates(response: List[Dict[str, Any]], start_date: date, end_date: date, date_grouping: str) -> None:
    current_date = start_date
    delta = timezone.timedelta(days=1)

    if date_grouping == "WEEK":
        delta = timezone.timedelta(weeks=1)
    elif date_grouping == "MONTH":
        delta = timezone.timedelta(days=30)
    elif date_grouping == "YEAR":
        delta = timezone.timedelta(days=365)

    date_set = {item["key"] for item in response}

    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        if date_str not in date_set:
            response.append({"key": date_str, "name": date_str, "count": 0})
        current_date += delta

    response.sort(key=lambda x: x["key"])


def format_time_estimate(value: Union[str, int, float]) -> str:
    """
    Convert numeric minutes to "Xh Ym" format.
    Handles: numeric minutes (int/float), string numbers.
    Returns formatted string like "1h 2m" or "None" if invalid.

    Examples:
        - 62 -> "1h 2m"
        - 90 -> "1h 30m"
        - 30 -> "30m"
        - 120 -> "2h"
    """

    try:
        # Convert to float to handle both int and string inputs
        minutes = float(value)

        # Handle zero or negative values
        if minutes <= 0:
            return "0m"

        # Calculate hours and remaining minutes
        hours = int(minutes // 60)
        remaining_minutes = int(minutes % 60)

        # Build the formatted string
        parts = []
        if hours > 0:
            parts.append(f"{hours}h")
        if remaining_minutes > 0:
            parts.append(f"{remaining_minutes}m")

        # If both are zero (shouldn't happen due to check above, but just in case)
        if not parts:
            return "0m"

        return " ".join(parts)
    except (ValueError, TypeError):
        return "None"


def build_number_chart_response(
    queryset: QuerySet[Issue],
    y_axis_filter: Dict[str, Any],
    y_axis: str,
    aggregate_func: Aggregate,
) -> List[Dict[str, Any]]:
    count = queryset.filter(**y_axis_filter).aggregate(total=aggregate_func).get("total", 0)
    return [{"key": y_axis, "name": y_axis, "count": count}]


def build_grouped_chart_response(
    queryset: QuerySet[Issue],
    id_field: str,
    name_field: str,
    group_field: str,
    group_name_field: str,
    aggregate_func: Aggregate,
) -> Tuple[List[Dict[str, Any]], Dict[str, str]]:
    display_field = F(name_field) if name_field else F(id_field)

    # Check if id_field is estimate_point__key to handle estimate type
    if id_field == "estimate_point__key":
        queryset = queryset.annotate(
            key=Coalesce(Cast(F(id_field), CharField()), Value("None"), output_field=CharField()),
            group_key=Coalesce(Cast(F(group_field), CharField()), Value("None"), output_field=CharField()),
            group_name=Coalesce(Cast(F(group_name_field), CharField()), Value("None"), output_field=CharField()),
            display_name=Coalesce(Cast(display_field, CharField()), Value("None"), output_field=CharField()),
            estimate_type=F("estimate_point__estimate__type"),
        )
        # Set project_id to NULL for None values so they group together
        # regardless of project (only for estimate_point__key)
        queryset = queryset.annotate(
            project_id_for_ordering=Case(
                When(key="None", then=Value(None)),
                default=F("project_id"),
                output_field=models.UUIDField(null=True),
            ),
        )
        data = (
            queryset.values(
                "project_id_for_ordering", "key", "group_key", "group_name", "display_name", "estimate_type"
            )
            .annotate(count=aggregate_func)
            .order_by("project_id_for_ordering", "-count")
        )
    else:
        queryset = queryset.annotate(
            key=Coalesce(Cast(F(id_field), CharField()), Value("None"), output_field=CharField()),
            group_key=Coalesce(Cast(F(group_field), CharField()), Value("None"), output_field=CharField()),
            group_name=Coalesce(Cast(F(group_name_field), CharField()), Value("None"), output_field=CharField()),
            display_name=Coalesce(Cast(display_field, CharField()), Value("None"), output_field=CharField()),
        )
        # For non-estimate charts, don't include project_id_for_ordering to combine items across projects

        order_clause = "key" if id_field == "date_group" else "-count"
        data = (
            queryset.values("key", "group_key", "group_name", "display_name")
            .annotate(count=aggregate_func)
            .order_by(order_clause)
        )
    return process_grouped_data(data)


def build_simple_chart_response(
    queryset: QuerySet, id_field: str, name_field: str, aggregate_func: Aggregate
) -> List[Dict[str, Any]]:
    display_field = F(name_field) if name_field else F(id_field)

    # For intake work items

    if id_field == "created_by_id":
        display_field = Case(
            When(
                **{f"{id_field}__is_bot": True},
                then=F(f"{id_field}__bot_type"),
            ),
            default=display_field,
            output_field=models.CharField(),
        )

    # perform this only when the id_field is estimate_point__key
    if id_field == "estimate_point__key":
        # Cast integer field to string before coalescing with "None"
        queryset = queryset.annotate(
            key=Coalesce(Cast(F(id_field), CharField()), Value("None"), output_field=CharField()),
            display_name=Coalesce(Cast(display_field, CharField()), Value("None"), output_field=CharField()),
            estimate_type=F("estimate_point__estimate__type"),
        )
        # Set project_id to NULL for None values so they group together
        # (only for estimate_point__key)
        queryset = queryset.annotate(
            project_id_for_ordering=Case(
                When(key="None", then=Value(None)),
                default=F("project_id"),
                output_field=models.UUIDField(null=True),
            ),
        )
        data = (
            queryset.values("project_id_for_ordering", "key", "display_name", "estimate_type")
            .annotate(count=aggregate_func)
            .order_by("project_id_for_ordering", "-count")
        )
    else:
        queryset = queryset.annotate(
            key=Coalesce(Cast(F(id_field), CharField()), Value("None"), output_field=CharField()),
            display_name=Coalesce(Cast(display_field, CharField()), Value("None"), output_field=CharField()),
        )
        # For non-estimate charts, don't include project_id_for_ordering to combine items across projects
        data = queryset.values("key", "display_name").annotate(count=aggregate_func).order_by("key")

    result = []
    for item in data:
        estimate_type = item.get("estimate_type")

        # Check if estimate type is "time" and format accordingly
        if estimate_type == "time":
            result.append(
                {
                    "key": item["key"] if item["key"] else "None",
                    "name": format_time_estimate(item["display_name"]) if item["display_name"] else "None",
                    "count": item["count"],
                }
            )
            continue

        result.append(
            {
                "key": item["key"] if item["key"] else "None",
                "name": item["display_name"] if item["display_name"] else "None",
                "count": item["count"],
            }
        )

    return result


def build_widget_chart(
    queryset: QuerySet[Issue],
    y_axis: str,
    chart_type: str,
    x_axis: str,
    group_by: Optional[str] = None,
    x_axis_date_grouping: Optional[str] = None,
) -> Dict[str, Union[List[Dict[str, Any]], Dict[str, str]]]:
    # Validate x_axis
    if chart_type != "NUMBER" and x_axis not in Widget.PropertyEnum.values:
        raise ValidationError(f"Invalid x_axis field: {x_axis}")

    # Validate y_axis
    if y_axis not in Widget.YAxisMetricEnum.values:
        raise ValidationError(f"Invalid y_axis field: {y_axis}")

    # Validate group_by
    if group_by and group_by not in Widget.PropertyEnum.values:
        raise ValidationError(f"Invalid group_by field: {group_by}")

    field_mapping = get_x_axis_field()
    y_axis_filter = get_y_axis_filter(y_axis)

    id_field, name_field, additional_filter = field_mapping.get(x_axis, (None, None, {}))
    group_field, group_name_field, group_additional_filter = field_mapping.get(group_by, (None, None, {}))

    if x_axis == "EPICS" or group_by == "EPICS":
        # Get all epic IDs
        epic_ids = [epic.id for epic in queryset]

        # Get all related issues for all epics at once
        epic_to_issues = get_all_related_issues_for_epics(epic_ids)

        # Build conditions using the dictionary
        conditions_id = []
        conditions_name = []
        all_ids = []

        for epic_id, nested_ids in epic_to_issues.items():
            all_ids.extend(nested_ids)
            epic = next((e for e in queryset if e.id == epic_id), None)
            if epic:
                conditions_id.append(When(id__in=nested_ids, then=Value(epic_id)))
                conditions_name.append(When(id__in=nested_ids, then=Value(epic.name)))

        combined_qs = Issue.issue_objects.filter(id__in=all_ids).annotate(
            epic_id=Case(*conditions_id, output_field=UUIDField()),
            epic_name=Case(*conditions_name, output_field=CharField()),
        )

        queryset = combined_qs
        if x_axis == "EPICS":
            id_field = "epic_id"
            name_field = "epic_name"
        if group_by == "EPICS":
            group_field = "epic_id"
            group_name_field = "epic_name"

    # Apply additional filters if they exist
    if additional_filter or {}:
        queryset = queryset.filter(**additional_filter)

    if group_additional_filter or {}:
        queryset = queryset.filter(**group_additional_filter)

    aggregate_func = (
        Sum(Cast("estimate_point__value", FloatField()))
        if y_axis == Widget.YAxisMetricEnum.ESTIMATE_POINT_COUNT
        else Count("id", distinct=True)
    )

    if chart_type == "NUMBER":
        return {
            "data": build_number_chart_response(queryset, y_axis_filter, y_axis, aggregate_func),
            "schema": {},
        }

    if x_axis_date_grouping and x_axis in [
        "START_DATE",
        "TARGET_DATE",
        "CREATED_AT",
        "COMPLETED_AT",
    ]:
        queryset, id_field, name_field = apply_date_grouping(queryset, x_axis, x_axis_date_grouping, id_field)

    if group_field:
        response, schema = build_grouped_chart_response(
            queryset,
            id_field,
            name_field,
            group_field,
            group_name_field,
            aggregate_func,
        )
    else:
        response = build_simple_chart_response(queryset, id_field, name_field, aggregate_func)
        schema = {}

    return {"data": response, "schema": schema}
