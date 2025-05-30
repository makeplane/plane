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
from django.db.models.functions import Cast, TruncDay, TruncWeek, TruncMonth, TruncYear

from plane.ee.models import Widget
from plane.db.models import Issue
from rest_framework.exceptions import ValidationError
from plane.ee.utils.nested_issue_children import get_all_related_issues_for_epics


def get_y_axis_filter(y_axis: str) -> Dict[str, Any]:
    today = timezone.now().date()
    filter_mapping = {
        Widget.YAxisMetricEnum.WORK_ITEM_COUNT: {"id": F("id")},
        Widget.YAxisMetricEnum.ESTIMATE_POINT_COUNT: {
            "estimate_point__value": F("estimate_point__value")
        },
        Widget.YAxisMetricEnum.IN_PROGRESS_WORK_ITEM_COUNT: {
            "state__group__in": ["unstarted", "started"]
        },
        Widget.YAxisMetricEnum.COMPLETED_WORK_ITEM_COUNT: {"state__group": "completed"},
        Widget.YAxisMetricEnum.PENDING_WORK_ITEM_COUNT: {
            "state__group__in": ["unstarted", "started", "backlog"]
        },
        Widget.YAxisMetricEnum.BLOCKED_WORK_ITEM_COUNT: {
            "issue_relation__relation_type": "blocked_by"
        },
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


def fill_missing_dates(
    response: List[Dict[str, Any]], start_date: date, end_date: date, date_grouping: str
) -> None:
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

    id_field, name_field, additional_filter = field_mapping.get(
        x_axis, (None, None, {})
    )
    group_field, group_name_field, group_additional_filter = field_mapping.get(
        group_by, (None, None, {})
    )

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

        combined_qs = (
            Issue.issue_objects.filter(id__in=all_ids)
            .annotate(
                epic_id=Case(*conditions_id, output_field=UUIDField()),
                epic_name=Case(*conditions_name, output_field=CharField()),
            )
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related(
                "assignees", "labels", "issue_module__module", "issue_cycle__cycle"
            )
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
            "data": build_number_chart_response(
                queryset, y_axis_filter, y_axis, aggregate_func
            ),
            "schema": {},
        }

    if x_axis_date_grouping and x_axis in [
        "START_DATE",
        "TARGET_DATE",
        "CREATED_AT",
        "COMPLETED_AT",
    ]:
        queryset, id_field, name_field = apply_date_grouping(
            queryset, x_axis, x_axis_date_grouping, id_field
        )

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
