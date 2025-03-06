# Django imports
from django.utils import timezone
from django.db.models import Count, F, Sum, FloatField
from django.db.models.functions import Cast, TruncDay, TruncWeek, TruncMonth, TruncYear

from plane.ee.models import Widget
from rest_framework.exceptions import ValidationError


def get_y_axis_filter(y_axis):
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


def get_x_axis_field():
    return {
        "STATES": ("state__id", "state__name"),
        "STATE_GROUPS": ("state__group", "state__group"),
        "LABELS": ("labels__id", "labels__name"),
        "ASSIGNEES": ("assignees__id", "assignees__display_name"),
        "ESTIMATE_POINTS": ("estimate_point__value", "estimate_point__key"),
        "CYCLES": ("issue_cycle__cycle_id", "issue_cycle__cycle__name"),
        "MODULES": ("issue_module__module_id", "issue_module__module__name"),
        "PRIORITY": ("priority", "priority"),
        "START_DATE": ("start_date", "start_date"),
        "TARGET_DATE": ("target_date", "target_date"),
        "CREATED_AT": ("created_at", "created_at"),
        "COMPLETED_AT": ("completed_at", "completed_at"),
    }


def process_grouped_data(data):
    response = {}
    schema = {}

    for item in data:
        key = item["key"]
        if key not in response:
            response[key] = {
                "key": key,
                "name": item.get("display_name", key),
                "count": 0,
            }
        group_key = str(item["group_key"]) if item["group_key"] else "None"
        schema[group_key] = item.get("group_name", item["group_key"])
        response[key][group_key] = response[key].get(group_key, 0) + item["count"]
        response[key]["count"] += item["count"]

    return list(response.values()), schema


def apply_date_grouping(queryset, x_axis, x_axis_date_grouping, id_field):
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


def fill_missing_dates(response, start_date, end_date, date_grouping):
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


def build_text_chart_response(queryset, y_axis_filter, y_axis, aggregate_func):
    count = (
        queryset.filter(**y_axis_filter).aggregate(total=aggregate_func).get("total", 0)
    )
    return [{"key": y_axis, "name": y_axis, "count": count}]


def build_grouped_chart_response(
    queryset, id_field, name_field, group_field, group_name_field, aggregate_func
):
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


def build_simple_chart_response(queryset, id_field, name_field, aggregate_func):
    data = (
        queryset.annotate(
            key=F(id_field),
            display_name=F(name_field) if name_field else F(id_field),
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
    queryset, y_axis, chart_type, x_axis, group_by=None, x_axis_date_grouping=None
):
    # Validate x_axis
    if chart_type != "TEXT" and x_axis not in Widget.PropertyEnum.values:
        raise ValidationError(f"Invalid x_axis field: {x_axis}")

    # Validate y_axis
    if y_axis not in Widget.YAxisMetricEnum.values:
        raise ValidationError(f"Invalid y_axis field: {y_axis}")

    # Validate group_by
    if group_by and group_by not in Widget.PropertyEnum.values:
        raise ValidationError(f"Invalid group_by field: {group_by}")

    field_mapping = get_x_axis_field()
    y_axis_filter = get_y_axis_filter(y_axis)

    id_field, name_field = field_mapping.get(x_axis, (None, None))
    group_field, group_name_field = field_mapping.get(group_by, (None, None))

    aggregate_func = (
        Sum(Cast("estimate_point__value", FloatField()))
        if y_axis == Widget.YAxisMetricEnum.ESTIMATE_POINT_COUNT
        else Count("id", distinct=True)
    )

    if chart_type == "TEXT":
        return {
            "data": build_text_chart_response(
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
