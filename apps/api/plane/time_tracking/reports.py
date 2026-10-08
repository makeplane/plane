# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Aggregations for the summary and report endpoints (plan 7.3 #12-13, 7.5)."""

# Python imports
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Callable

# Django imports
from django.db.models import Count, DateField, F, FilteredRelation, Func, IntegerField, Q, Sum, Value
from django.db.models.functions import TruncMonth

# Module imports
from plane.db.models import Cycle, Issue, Label, Module, Project, State, User

from .constants import REPORT_MAX_GROUPS
from .services import TimeTrackingError


class WeekStart(Func):
    """The first day of the week containing a date, for ``week_start`` 0 (Sunday) .. 6 (Saturday).

    ``spent_on - MOD(EXTRACT(DOW FROM spent_on)::int - week_start + 7, 7)``; Postgres DOW uses 0 = Sunday,
    the same numbering as ``Profile.start_of_the_week``.
    """

    output_field = DateField()
    arity = 2

    def as_sql(self, compiler, connection, **extra_context):
        date_sql, date_params = compiler.compile(self.source_expressions[0])
        start_sql, start_params = compiler.compile(self.source_expressions[1])
        sql = f"({date_sql} - MOD(CAST(EXTRACT(DOW FROM {date_sql}) AS integer) - {start_sql} + 7, 7))"
        return sql, [*date_params, *date_params, *start_params]


def week_start_of(day: date, week_start: int) -> date:
    """Python twin of WeekStart. Python's weekday() is 0 = Monday, so shift to 0 = Sunday first."""
    dow = (day.weekday() + 1) % 7
    return day - timedelta(days=(dow - week_start + 7) % 7)


def _add_months(day: date, months: int) -> date:
    month = day.month - 1 + months
    return date(day.year + month // 12, month % 12 + 1, 1)


# Dimensions


@dataclass(frozen=True)
class Dimension:
    key: str
    # the related path whose live link rows a FilteredRelation joins (many-to-many dimensions)
    link: str | None = None
    # the value to group by, relative to TimeEntry (or to the FilteredRelation alias)
    field: str | None = None
    multi_valued: bool = False
    empty_label: str = ""
    labels: Callable | None = None


def _user_labels(keys):
    return {u["id"]: u["display_name"] for u in User.objects.filter(id__in=keys).values("id", "display_name")}


def _project_labels(keys):
    return {p.id: p.name for p in Project.all_objects.filter(id__in=keys).only("id", "name")}


def _issue_labels(keys):
    rows = Issue.all_objects.filter(id__in=keys).values("id", "name", "sequence_id", "project__identifier")
    return {r["id"]: f"{r['project__identifier']}-{r['sequence_id']} {r['name']}" for r in rows}


def _named(model):
    def resolve(keys):
        return dict(model.all_objects.filter(id__in=keys).values_list("id", "name"))

    return resolve


def _title(keys):
    return {k: str(k).replace("_", " ").capitalize() for k in keys}


DIMENSIONS = {
    d.key: d
    for d in [
        Dimension("user", field="user_id", labels=_user_labels),
        Dimension("project", field="project_id", labels=_project_labels),
        Dimension("issue", field="issue_id", empty_label="No work item", labels=_issue_labels),
        Dimension(
            "label",
            link="issue__label_issue",
            field="label_id",
            multi_valued=True,
            empty_label="No label",
            labels=_named(Label),
        ),
        Dimension("state", field="issue__state_id", empty_label="No work item", labels=_named(State)),
        Dimension("state_group", field="issue__state__group", empty_label="No work item", labels=_title),
        # a work item belongs to at most one live cycle
        Dimension("cycle", link="issue__issue_cycle", field="cycle_id", empty_label="No cycle", labels=_named(Cycle)),
        Dimension(
            "module",
            link="issue__issue_module",
            field="module_id",
            multi_valued=True,
            empty_label="No module",
            labels=_named(Module),
        ),
        Dimension("priority", field="issue__priority", empty_label="No work item", labels=_title),
        Dimension(
            "assignee",
            link="issue__issue_assignee",
            field="assignee_id",
            multi_valued=True,
            empty_label="Unassigned",
            labels=_user_labels,
        ),
        Dimension(
            "billable",
            field="is_billable",
            labels=lambda keys: {k: "Billable" if k else "Non-billable" for k in keys},
        ),
        Dimension("source", field="source", labels=lambda keys: {k: str(k).capitalize() for k in keys}),
        Dimension("date"),
    ]
}
INTERVALS = ("day", "week", "month")


def _annotate_dimension(queryset, dimension: Dimension, alias: str, interval=None, week_start=0):
    """Annotate ``alias`` with the group key of ``dimension``."""
    if dimension.key == "date":
        if interval == "month":
            expression = TruncMonth("spent_on", output_field=DateField())
        elif interval == "week":
            expression = WeekStart(F("spent_on"), Value(week_start, output_field=IntegerField()))
        else:
            expression = F("spent_on")
        return queryset.annotate(**{alias: expression})
    if dimension.link:
        # LEFT JOIN only the live link rows, so entries without one land in the "No …" bucket
        relation = f"_{alias}_link"
        queryset = queryset.annotate(
            **{
                relation: FilteredRelation(
                    dimension.link, condition=Q(**{f"{dimension.link}__deleted_at__isnull": True})
                )
            }
        )
        return queryset.annotate(**{alias: F(f"{relation}__{dimension.field}")})
    return queryset.annotate(**{alias: F(dimension.field)})


def _serialize_key(value):
    if value is None:
        return None
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, date):
        return value.isoformat()
    return str(value)


def _label_map(dimension: Dimension, keys):
    keys = [k for k in keys if k is not None]
    if dimension.key == "date":
        return {k: k.isoformat() for k in keys}
    return dimension.labels(keys) if keys else {}


def _sort(groups, dimension: Dimension):
    if dimension.key == "date":
        return sorted(groups, key=lambda g: g["key"] or "")
    return sorted(groups, key=lambda g: (-g["total_seconds"], g["label"] or ""))


def _date_buckets(date_from: date, date_to: date, interval: str, week_start: int):
    if interval == "month":
        current, step = date(date_from.year, date_from.month, 1), None
    elif interval == "week":
        current, step = week_start_of(date_from, week_start), timedelta(days=7)
    else:
        current, step = date_from, timedelta(days=1)
    buckets = []
    while current <= date_to and len(buckets) <= REPORT_MAX_GROUPS:
        buckets.append(current)
        current = _add_months(current, 1) if step is None else current + step
    return buckets


def _totals(queryset):
    return queryset.aggregate(
        total_seconds=Sum("duration_seconds"),
        billable_seconds=Sum("duration_seconds", filter=Q(is_billable=True)),
    )


def build_report(queryset, group_by, sub_group_by=None, interval=None, week_start=0, date_from=None, date_to=None):
    """Grouped aggregates. ``queryset`` must already be filtered and exclude running entries."""
    if group_by not in DIMENSIONS:
        raise TimeTrackingError("INVALID_FILTER", f"Invalid group_by '{group_by}'.", "group_by")
    if sub_group_by and (sub_group_by not in DIMENSIONS or sub_group_by == group_by):
        raise TimeTrackingError("INVALID_FILTER", f"Invalid sub_group_by '{sub_group_by}'.", "sub_group_by")
    uses_date = "date" in (group_by, sub_group_by)
    if uses_date:
        interval = interval or "day"
        if interval not in INTERVALS:
            raise TimeTrackingError("INVALID_FILTER", f"Invalid interval '{interval}'.", "interval")
    else:
        interval = None
    if week_start not in range(7):
        raise TimeTrackingError("INVALID_FILTER", "week_start must be between 0 and 6.", "week_start")

    group_dim, sub_dim = DIMENSIONS[group_by], DIMENSIONS.get(sub_group_by) if sub_group_by else None
    totals = _totals(queryset)

    def aggregate(qs, *aliases):
        return (
            qs.values(*aliases)
            .annotate(
                total_seconds=Sum("duration_seconds"),
                billable_seconds=Sum("duration_seconds", filter=Q(is_billable=True)),
                entry_count=Count("id", distinct=True),
            )
            .order_by()
        )

    grouped = _annotate_dimension(queryset, group_dim, "g", interval, week_start)
    group_rows = list(aggregate(grouped, "g"))

    sub_rows = []
    if sub_dim:
        both = _annotate_dimension(grouped, sub_dim, "s", interval, week_start)
        sub_rows = list(aggregate(both, "g", "s"))

    group_labels = _label_map(group_dim, [r["g"] for r in group_rows])
    sub_labels = _label_map(sub_dim, [r["s"] for r in sub_rows]) if sub_dim else {}

    def node(key, label_map, dimension, row):
        return {
            "key": _serialize_key(key),
            "label": label_map.get(key, dimension.empty_label) if key is not None else dimension.empty_label,
            "total_seconds": row["total_seconds"] or 0,
            "billable_seconds": row["billable_seconds"] or 0,
            "entry_count": row["entry_count"],
        }

    groups = {}
    for row in group_rows:
        groups[row["g"]] = node(row["g"], group_labels, group_dim, row)
        if sub_dim:
            groups[row["g"]]["sub_groups"] = []
    for row in sub_rows:
        groups[row["g"]]["sub_groups"].append(node(row["s"], sub_labels, sub_dim, row))

    # fill empty date buckets so charts get a continuous axis
    if group_dim.key == "date" and date_from and date_to:
        for bucket in _date_buckets(date_from, date_to, interval, week_start):
            if bucket not in groups:
                groups[bucket] = {
                    "key": bucket.isoformat(),
                    "label": bucket.isoformat(),
                    "total_seconds": 0,
                    "billable_seconds": 0,
                    "entry_count": 0,
                    **({"sub_groups": []} if sub_dim else {}),
                }

    result = _sort(groups.values(), group_dim)
    if sub_dim:
        for group in result:
            group["sub_groups"] = _sort(group["sub_groups"], sub_dim)[:REPORT_MAX_GROUPS]
    truncated = len(result) > REPORT_MAX_GROUPS

    return {
        "group_by": group_by,
        "sub_group_by": sub_group_by or None,
        "interval": interval,
        "week_start": week_start if interval == "week" else None,
        "multi_valued": group_dim.multi_valued or bool(sub_dim and sub_dim.multi_valued),
        "total_seconds": totals["total_seconds"] or 0,
        "billable_seconds": totals["billable_seconds"] or 0,
        "truncated": truncated,
        "groups": result[:REPORT_MAX_GROUPS],
    }


def build_summary(completed, all_matching, previous=None):
    """Headline numbers.

    ``completed`` excludes running entries; ``all_matching`` includes them (for ``running_count``).
    ``previous`` is ``(date_from, date_to, completed_queryset)`` for the previous period, or None.
    """
    agg = completed.aggregate(
        total_seconds=Sum("duration_seconds"),
        billable_seconds=Sum("duration_seconds", filter=Q(is_billable=True)),
        no_issue_seconds=Sum("duration_seconds", filter=Q(issue_id__isnull=True)),
        entry_count=Count("id", distinct=True),
        user_count=Count("user_id", distinct=True),
        project_count=Count("project_id", distinct=True),
        issue_count=Count("issue_id", distinct=True),
        active_days=Count("spent_on", distinct=True),
    )
    total = agg["total_seconds"] or 0
    billable = agg["billable_seconds"] or 0
    user_days = completed.order_by().values("user_id", "spent_on").distinct().count()
    status_counts = all_matching.aggregate(
        running_count=Count("id", filter=Q(started_at__isnull=False, ended_at__isnull=True)),
        auto_stopped_count=Count("id", filter=Q(auto_stopped=True)),
    )
    summary = {
        "total_seconds": total,
        "billable_seconds": billable,
        "non_billable_seconds": total - billable,
        "entry_count": agg["entry_count"],
        "user_count": agg["user_count"],
        "project_count": agg["project_count"],
        "issue_count": agg["issue_count"],
        "no_issue_seconds": agg["no_issue_seconds"] or 0,
        "active_days": agg["active_days"],
        "avg_seconds_per_user_day": total // user_days if user_days else 0,
        "running_count": status_counts["running_count"],
        "auto_stopped_count": status_counts["auto_stopped_count"],
        "previous": None,
    }
    if previous is not None:
        prev_from, prev_to, prev_qs = previous
        prev = _totals(prev_qs)
        summary["previous"] = {
            "date_from": prev_from.isoformat(),
            "date_to": prev_to.isoformat(),
            "total_seconds": prev["total_seconds"] or 0,
            "billable_seconds": prev["billable_seconds"] or 0,
        }
    return summary


def previous_period(date_from: date, date_to: date):
    """An equally long window ending the day before ``date_from``."""
    length = (date_to - date_from).days + 1
    prev_to = date_from - timedelta(days=1)
    return prev_to - timedelta(days=length - 1), prev_to
