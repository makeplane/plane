from typing import Dict, Any, Tuple, Optional, List, Union


# Django imports
from django.db.models import (
    Count,
    F,
    QuerySet,
    Aggregate,
)

from plane.db.models import Issue
from rest_framework.exceptions import ValidationError


x_axis_mapper = {
    "STATES": "STATES",
    "STATE_GROUPS": "STATE_GROUPS",
    "LABELS": "LABELS",
    "ASSIGNEES": "ASSIGNEES",
    "ESTIMATE_POINTS": "ESTIMATE_POINTS",
    "CYCLES": "CYCLES",
    "MODULES": "MODULES",
    "PRIORITY": "PRIORITY",
    "START_DATE": "START_DATE",
    "TARGET_DATE": "TARGET_DATE",
    "CREATED_AT": "CREATED_AT",
    "COMPLETED_AT": "COMPLETED_AT",
    "CREATED_BY": "CREATED_BY",
}


def get_y_axis_filter(y_axis: str) -> Dict[str, Any]:
    filter_mapping = {
        "WORK_ITEM_COUNT": {"id": F("id")},
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
        "ESTIMATE_POINTS": ("estimate_point__value", "estimate_point__key", None),
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
        "CREATED_BY": ("created_by_id", "created_by__display_name", None),
    }


def process_grouped_data(
    data: List[Dict[str, Any]],
) -> Tuple[List[Dict[str, Any]], Dict[str, str]]:
    response = {}
    schema = {}

    for item in data:
        key = item["key"]
        if key not in response:
            response[key] = {
                "key": key if key else "none",
                "name": (
                    item.get("display_name", key)
                    if item.get("display_name", key)
                    else "None"
                ),
                "count": 0,
            }
        group_key = str(item["group_key"]) if item["group_key"] else "none"
        schema[group_key] = item.get("group_name", item["group_key"])
        schema[group_key] = schema[group_key] if schema[group_key] else "None"
        response[key][group_key] = response[key].get(group_key, 0) + item["count"]
        response[key]["count"] += item["count"]

    return list(response.values()), schema


def build_number_chart_response(
    queryset: QuerySet[Issue],
    y_axis_filter: Dict[str, Any],
    y_axis: str,
    aggregate_func: Aggregate,
) -> List[Dict[str, Any]]:
    count = (
        queryset.filter(**y_axis_filter).aggregate(total=aggregate_func).get("total", 0)
    )
    return [{"key": y_axis, "name": y_axis, "count": count}]


def build_grouped_chart_response(
    queryset: QuerySet[Issue],
    id_field: str,
    name_field: str,
    group_field: str,
    group_name_field: str,
    aggregate_func: Aggregate,
) -> Tuple[List[Dict[str, Any]], Dict[str, str]]:
    data = (
        queryset.annotate(
            key=F(id_field),
            group_key=F(group_field),
            group_name=F(group_name_field),
            display_name=F(name_field) if name_field else F(id_field),
        )
        .values("key", "group_key", "group_name", "display_name")
        .annotate(count=aggregate_func)
        .order_by("-count")
    )
    return process_grouped_data(data)


def build_simple_chart_response(
    queryset: QuerySet, id_field: str, name_field: str, aggregate_func: Aggregate
) -> List[Dict[str, Any]]:
    data = (
        queryset.annotate(
            key=F(id_field), display_name=F(name_field) if name_field else F(id_field)
        )
        .values("key", "display_name")
        .annotate(count=aggregate_func)
        .order_by("key")
    )

    return [
        {
            "key": item["key"] if item["key"] else "None",
            "name": item["display_name"] if item["display_name"] else "None",
            "count": item["count"],
        }
        for item in data
    ]


def build_analytics_chart(
    queryset: QuerySet[Issue],
    x_axis: str,
    group_by: Optional[str] = None,
    date_filter: Optional[str] = None,
) -> Dict[str, Union[List[Dict[str, Any]], Dict[str, str]]]:
    # Validate x_axis
    if x_axis not in x_axis_mapper:
        raise ValidationError(f"Invalid x_axis field: {x_axis}")

    # Validate group_by
    if group_by and group_by not in x_axis_mapper:
        raise ValidationError(f"Invalid group_by field: {group_by}")

    field_mapping = get_x_axis_field()

    id_field, name_field, additional_filter = field_mapping.get(
        x_axis, (None, None, {})
    )
    group_field, group_name_field, group_additional_filter = field_mapping.get(
        group_by, (None, None, {})
    )

    # Apply additional filters if they exist
    if additional_filter or {}:
        queryset = queryset.filter(**additional_filter)

    if group_additional_filter or {}:
        queryset = queryset.filter(**group_additional_filter)

    aggregate_func = Count("id", distinct=True)

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
        response = build_simple_chart_response(
            queryset, id_field, name_field, aggregate_func
        )
        schema = {}

    return {"data": response, "schema": schema}
