# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Progress and deadline indicator of products (section 8 of the specification)."""

# Python imports
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

# Django imports
from django.db.models import Count, OuterRef, Q, Subquery
from django.db.models.functions import Coalesce

# Module imports
from plane.db.models import Issue, Project, WorkItemKind

RISK_DAYS = 7
RISK_PROGRESS = 80

OPEN_GROUPS = ("backlog", "unstarted", "started")


def project_today(timezone_name):
    try:
        zone = ZoneInfo(timezone_name or "UTC")
    except (ZoneInfoNotFoundError, ValueError):
        zone = ZoneInfo("UTC")
    return datetime.now(zone).date()


def counted_tasks():
    """Direct tasks of products: archived ones count, meetings, drafts, triage and cancelled do not."""
    return (
        Issue.objects.filter(is_draft=False)
        .filter(Q(type__isnull=True) | Q(type__kind__isnull=True))
        .exclude(state__group__in=["cancelled", "triage"])
    )


def percent(completed, total):
    """None when the product has no tasks to count."""
    return completed * 100 // total if total else None


def progress_of(issue_id):
    """Task counts of one product."""
    timezone_name = Project.all_objects.filter(project_issue__id=issue_id).values_list("timezone", flat=True).first()
    today = project_today(timezone_name)
    counts = counted_tasks().filter(parent_id=issue_id).aggregate(
        total=Count("id"),
        completed=Count("id", filter=Q(state__group="completed")),
        overdue=Count("id", filter=_overdue(today)),
    )
    return {**counts, "percent": percent(counts["completed"], counts["total"]), "today": today}


def _overdue(today):
    return Q(state__group__in=OPEN_GROUPS, target_date__lt=today, archived_at__isnull=True)


def annotate_task_counts(products):
    """
    Add total_tasks, completed_tasks and earliest_open_target to a queryset of products.

    The earliest open deadline instead of an overdue count: "today" differs between projects, so
    the comparison is left to the caller.
    """
    tasks = counted_tasks().filter(parent_id=OuterRef("pk")).order_by().values("parent_id")

    def count(condition=None):
        rows = tasks.filter(condition) if condition is not None else tasks
        return Coalesce(Subquery(rows.annotate(count=Count("id")).values("count")), 0)

    earliest = (
        counted_tasks()
        .filter(
            parent_id=OuterRef("pk"),
            state__group__in=OPEN_GROUPS,
            target_date__isnull=False,
            archived_at__isnull=True,
        )
        .order_by("target_date")
        .values("target_date")[:1]
    )
    return products.annotate(
        total_tasks=count(),
        completed_tasks=count(Q(state__group="completed")),
        earliest_open_target=Subquery(earliest),
    )


def indicator(state_group, start_date, target_date, progress, has_overdue_tasks, today):
    """The first matching condition wins."""
    if state_group in ("completed", "cancelled"):
        return state_group
    if target_date is not None and target_date < today:
        return "overdue"
    near_deadline = target_date is not None and target_date - today <= timedelta(days=RISK_DAYS)
    if has_overdue_tasks or (near_deadline and (progress or 0) < RISK_PROGRESS):
        return "at_risk"
    if start_date is not None and start_date > today:
        return "not_started"
    return "on_track"


def list_products(products):
    """Rows for lists and summaries. The queryset is expected to hold readable products only."""
    rows = annotate_task_counts(
        products.filter(type__kind=WorkItemKind.PRODUCT, product_detail__deleted_at__isnull=True)
    ).values(
        "id",
        "name",
        "sequence_id",
        "project_id",
        "project__identifier",
        "project__portfolio_id",
        "project__timezone",
        "state_id",
        "state__name",
        "state__group",
        "start_date",
        "target_date",
        "product_detail__product_type_id",
        "product_detail__owner_id",
        "product_detail__manual_progress",
        "product_detail__status_comment",
        "total_tasks",
        "completed_tasks",
        "earliest_open_target",
    )
    result = []
    for row in rows:
        today = project_today(row["project__timezone"])
        calculated = percent(row["completed_tasks"], row["total_tasks"])
        manual = row["product_detail__manual_progress"]
        progress = manual if manual is not None else calculated
        earliest = row["earliest_open_target"]
        result.append(
            {
                "id": row["id"],
                "name": row["name"],
                "sequence_id": row["sequence_id"],
                "project_id": row["project_id"],
                "project_identifier": row["project__identifier"],
                "portfolio_id": row["project__portfolio_id"],
                "state_id": row["state_id"],
                "state_name": row["state__name"],
                "state_group": row["state__group"],
                "start_date": row["start_date"],
                "target_date": row["target_date"],
                "product_type_id": row["product_detail__product_type_id"],
                "owner_id": row["product_detail__owner_id"],
                "manual_progress": manual,
                "status_comment": row["product_detail__status_comment"],
                "total_tasks": row["total_tasks"],
                "completed_tasks": row["completed_tasks"],
                "calculated_progress": calculated,
                "progress": progress,
                "indicator": indicator(
                    state_group=row["state__group"],
                    start_date=row["start_date"],
                    target_date=row["target_date"],
                    progress=progress,
                    has_overdue_tasks=earliest is not None and earliest < today,
                    today=today,
                ),
            }
        )
    return result
