# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Helper functions for the HO Datasheet XLSX export Celery task."""

from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.db import connection
from django.db.models import Count, Prefetch, Q

from plane.db.models import Issue, Project


def build_ho_export_queryset(user, filters: dict):
    """Rebuild the HO issues queryset from stored filter params (no pagination)."""
    from plane.app.views.ho import get_accessible_workspace_ids, _get_user_scope_q  # noqa: PLC0415

    workspace_ids = get_accessible_workspace_ids(user)
    if not workspace_ids:
        return Issue.objects.none()

    workspace_id_param = filters.get("workspace_id")
    if workspace_id_param:
        allowed = {str(wid) for wid in workspace_ids}
        requested = [wid.strip() for wid in workspace_id_param.split(",") if wid.strip() in allowed]
        if requested:
            workspace_ids = requested

    project_ids = []
    project_id_param = filters.get("project_id")
    if project_id_param:
        raw_ids = [pid.strip() for pid in project_id_param.split(",") if pid.strip()]
        project_ids = list(
            Project.objects.filter(id__in=raw_ids, workspace_id__in=workspace_ids).values_list("id", flat=True)
        )

    include_archived = str(filters.get("include_archived", "true")).lower() == "true"
    include_sub_issues = str(filters.get("include_sub_issues", "false")).lower() == "true"

    scope_q = _get_user_scope_q(user, workspace_ids)
    base_filters = {"is_draft": False, "deleted_at__isnull": True}
    if not include_archived:
        base_filters["archived_at__isnull"] = True
        base_filters["project__archived_at__isnull"] = True
    if not include_sub_issues:
        base_filters["parent__isnull"] = True

    qs = (
        Issue.objects.filter(scope_q, **base_filters)
        .distinct()
        .select_related(
            "project",
            "project__workspace",
            "project__project_lead",
            "state",
            "main_task_category",
            "sub_task_category",
        )
        .prefetch_related(
            Prefetch(
                "assignees",
                queryset=get_user_model().objects.filter(issue_assignee__deleted_at__isnull=True).distinct(),
            ),
            "issue_module__module",
            "issue_cycle__cycle",
        )
        .annotate(
            sub_issues_count=Count("parent_issue", distinct=True),
            reference_link_count=Count("issue_link", distinct=True),
        )
    )

    if project_ids:
        qs = qs.filter(project_id__in=project_ids)

    for param, field in [("priority", "priority__in"), ("state", "state__group__in")]:
        val = filters.get(param)
        if val:
            qs = qs.filter(**{field: val.split(",")})

    assignees = filters.get("assignees")
    if assignees:
        qs = qs.filter(assignees__id__in=assignees.split(",")).distinct()

    leads = filters.get("leads")
    if leads:
        qs = qs.filter(project__project_lead_id__in=leads.split(","))

    for param, field in [
        ("main_task_category", "main_task_category__name__in"),
        ("sub_task_category", "sub_task_category__name__in"),
        ("cycle", "issue_cycle__cycle__name__in"),
        ("module", "issue_module__module__name__in"),
    ]:
        val = filters.get(param)
        if val:
            qs = qs.filter(**{field: val.split(",")})

    bank_wide = filters.get("bank_wide")
    if bank_wide:
        qs = qs.filter(project__is_bank_wide=bank_wide.lower() == "true")

    progress = filters.get("progress")
    if progress:
        today = date.today()
        tomorrow = today + timedelta(days=1)
        p_q = Q()
        for p in progress.split(","):
            if p == "off_track":
                p_q |= Q(target_date__lt=today)
            elif p == "due_today":
                p_q |= Q(target_date=today)
            elif p == "at_risk":
                p_q |= Q(target_date=tomorrow)
            elif p == "on_track":
                p_q |= Q(target_date__gt=tomorrow)
        if p_q:
            qs = qs.filter(p_q)

    from_date = filters.get("from_date")
    to_date = filters.get("to_date")
    if from_date and not progress:
        qs = qs.filter(Q(target_date__gte=from_date) | Q(target_date__isnull=True))
    if to_date:
        qs = qs.filter(Q(start_date__lte=to_date) | Q(start_date__isnull=True))

    return qs.order_by(
        "project__workspace__name",
        "project__name",
        "main_task_category__name",
        "sub_task_category__name",
        "name",
        "created_at",
    )


_HEADERS = [
    "Department",
    "Team/Project",
    "Main Task Category",
    "Sub Task Category",
    "Work Items",
    "Sub Items",
    "Team/Project Lead",
    "Assignee",
    "Bank-wide Project",
    "Priority",
    "Status",
    "Progress Tracking",
    "Modules",
    "Cycles",
    "Start Date",
    "Due Date",
    "Completed Date",
    "Total Log Time",
    "Reference Links",
]

# Parallel to _HEADERS — maps frontend displayProperties keys to column indices.
# "name" is always included (Work Items is never hidden in the UI).
_COLUMN_KEYS = [
    "department_name",
    "project_name",
    "main_task_category",
    "sub_task_category",
    "name",
    "sub_issue_count",
    "project_lead",
    "assignee",
    "bank_wide_project",
    "priority",
    "state",
    "progress_tracking",
    "modules",
    "cycle",
    "start_date",
    "due_date",
    "completed_date",
    "total_log_time",
    "reference_link",
]

_TOTAL_LOG_TIME_IDX = _COLUMN_KEYS.index("total_log_time")


def _bulk_subtree_worklog_totals(issue_ids: list) -> dict:
    """Return {str(issue_id): total_minutes} for each issue including all descendants.

    Uses a single recursive CTE to avoid N+1 queries. Matches the subtree logic
    in HoIssueWorklogBreakdownView so the export matches what the frontend displays.
    """
    if not issue_ids:
        return {}
    placeholders = ",".join(["%s"] * len(issue_ids))
    id_strs = [str(i) for i in issue_ids]
    with connection.cursor() as cursor:
        cursor.execute(
            f"""
            WITH RECURSIVE subtree AS (
                SELECT id AS root_id, id AS node_id, 1 AS depth
                FROM issues
                WHERE id IN ({placeholders}) AND deleted_at IS NULL
                UNION ALL
                SELECT s.root_id, i.id AS node_id, s.depth + 1
                FROM issues i
                INNER JOIN subtree s ON i.parent_id = s.node_id
                WHERE i.deleted_at IS NULL AND s.depth < 10
            )
            SELECT s.root_id, COALESCE(SUM(iw.duration_minutes), 0)
            FROM subtree s
            LEFT JOIN issue_worklogs iw ON iw.issue_id = s.node_id AND iw.deleted_at IS NULL
            GROUP BY s.root_id
            """,
            id_strs,
        )
        return {str(row[0]): row[1] for row in cursor.fetchall()}


def _progress_label(target_date) -> str:
    if target_date is None:
        return "-"
    today = date.today()
    diff = (target_date - today).days
    if diff < 0:
        return "Off Track"
    if diff == 0:
        return "Due Today"
    if diff == 1:
        return "At Risk"
    return "On Track"


def _format_minutes(minutes) -> str:
    if not minutes:
        return "-"
    h, m = divmod(int(minutes), 60)
    return f"{h}h {m:02d}m" if h else f"{m}m"


def write_ho_workbook(wb, issues, columns=None) -> int:
    """Write all issues to a single 'Datasheet' sheet. Returns row count.

    columns: comma-separated frontend displayProperties keys. When provided, only
    those columns are written. "name" (Work Items) is always included. When None,
    all columns are exported.
    """
    # Determine which column indices to include.
    if columns:
        requested = set(columns.split(",")) | {"name"}  # name/Work Items always present
        active_indices = [i for i, k in enumerate(_COLUMN_KEYS) if k in requested]
    else:
        active_indices = list(range(len(_COLUMN_KEYS)))

    ws = wb.create_sheet(title="Datasheet")
    ws.append([_HEADERS[i] for i in active_indices])

    # Materialize so prefetch_related (assignees, modules, cycles) is applied.
    issue_list = list(issues)

    # Skip the expensive recursive CTE when Total Log Time is not exported.
    if _TOTAL_LOG_TIME_IDX in active_indices:
        subtree_totals = _bulk_subtree_worklog_totals([issue.id for issue in issue_list])
    else:
        subtree_totals = {}

    row_count = 0
    for issue in issue_list:
        assignee_names = ", ".join(a.display_name for a in issue.assignees.all()) or "-"
        module_names = ", ".join(im.module.name for im in issue.issue_module.all() if im.module_id) or "-"
        cycles = [ic.cycle for ic in issue.issue_cycle.all() if ic.cycle_id]
        cycle_name = cycles[0].name if cycles else "-"

        full_row = [
            issue.project.workspace.name if issue.project_id else "-",
            issue.project.name if issue.project_id else "-",
            issue.main_task_category.name if issue.main_task_category_id else "-",
            issue.sub_task_category.name if issue.sub_task_category_id else "-",
            issue.name or "-",
            issue.sub_issues_count or 0,
            (
                issue.project.project_lead.display_name
                if issue.project_id and issue.project.project_lead_id
                else "-"
            ),
            assignee_names,
            "Y" if (issue.project_id and issue.project.is_bank_wide) else "N",
            issue.priority or "-",
            issue.state.name if issue.state_id else "-",
            _progress_label(issue.target_date),
            module_names,
            cycle_name,
            str(issue.start_date) if issue.start_date else "-",
            str(issue.target_date) if issue.target_date else "-",
            issue.completed_at.date().isoformat() if issue.completed_at else "-",
            _format_minutes(subtree_totals.get(str(issue.id), 0)),
            issue.reference_link_count or 0,
        ]
        ws.append([full_row[i] for i in active_indices])
        row_count += 1

    return row_count
