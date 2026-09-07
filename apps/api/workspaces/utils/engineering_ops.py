# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
The vocabulary the Engineering Operations layer is defined in terms of.

PROJECT.md fixes a workflow -- Backlog, Todo, In Progress, Ready for Test
Deployment, QA Testing, Ready for Release, Deployed, plus Halt and Cancelled --
and every dashboard and metric downstream is phrased in it. But Workspaces states
are per project and freely renamed, so nothing here may hard-code a name at the
point of use: ``bootstrap_engineering_ops`` creates these names, and
:class:`OperationsSetting` lets a workspace that already had its own states say
which of theirs mean what. This module owns both halves -- the defaults and the
resolution -- so that "which states count as QA?" has exactly one answer.
"""

# Python imports
from datetime import timedelta

# Django imports
from django.db.models import Case, CharField, F, Q, Value, When
from django.db.models.functions import Cast, Concat
from django.utils import timezone


def avatar_url(relation=None):
    """
    The SQL equivalent of ``User.avatar_url``, for use inside ``.values()``.

    ``avatar_url`` is a Python property, not a column, so naming it in a
    queryset raises ``FieldError: Cannot resolve keyword 'avatar_url' into
    field``. That is a 500 rather than a missing avatar, and it takes the whole
    endpoint with it -- which is why this exists rather than each dashboard
    reaching for the property name.

    Reproduces both branches of the property in SQL: an uploaded avatar becomes
    its static asset route, a plain URL in ``avatar`` is returned as it is, and
    anything else is NULL.

    ``relation`` is the path from the queryset's model to the user -- ``member``
    on a WorkspaceMember queryset, ``assignee`` on an IssueAssignee one, or
    ``None`` when querying User itself.
    """
    prefix = f"{relation}__" if relation else ""
    return Case(
        When(
            **{f"{prefix}avatar_asset__isnull": False},
            then=Concat(
                Value("/api/assets/v2/static/"),
                Cast(f"{prefix}avatar_asset_id", output_field=CharField()),
                Value("/"),
                output_field=CharField(),
            ),
        ),
        # `avatar` is a TextField(blank=True), so "unset" is the empty string.
        When(~Q(**{f"{prefix}avatar": ""}), then=F(f"{prefix}avatar")),
        default=Value(None),
        output_field=CharField(),
    )


# --------------------------------------------------------------------------
# The workflow from PROJECT.md
# --------------------------------------------------------------------------

# `group` maps each state onto one of the Workspaces state groups, which is what
# the rest of Workspaces (board columns, cycle progress, "completed" counts) reads.
# Getting these wrong would break burndown, not just our dashboards.
ENGINEERING_WORKFLOW_STATES = [
    {
        "name": "Backlog",
        "group": "backlog",
        "color": "#60646C",
        "sequence": 15000,
        "default": True,
        "owner": "project_manager",
    },
    {"name": "Todo", "group": "unstarted", "color": "#60646C", "sequence": 25000, "owner": "project_manager"},
    {"name": "In Progress", "group": "started", "color": "#F59E0B", "sequence": 35000, "owner": "developer"},
    {
        "name": "Ready for Test Deployment",
        "group": "started",
        "color": "#3B82F6",
        "sequence": 45000,
        "owner": "developer",
    },
    {"name": "QA Testing", "group": "started", "color": "#8B5CF6", "sequence": 55000, "owner": "qa"},
    {"name": "Ready for Release", "group": "started", "color": "#14B8A6", "sequence": 65000, "owner": "qa"},
    {"name": "Deployed", "group": "completed", "color": "#46A758", "sequence": 75000, "owner": "devops"},
    {"name": "Halt", "group": "backlog", "color": "#EF4444", "sequence": 85000, "owner": "project_manager"},
    {"name": "Cancelled", "group": "cancelled", "color": "#9AA4BC", "sequence": 95000, "owner": "project_manager"},
]

# Who is allowed to make each move. Advisory rather than enforced: PROJECT.md
# describes ownership so that productivity can be attributed correctly, not so
# that a developer is locked out of moving their own card at 2am.
ENGINEERING_TRANSITION_OWNERS = [
    {"from": "Backlog", "to": "Todo", "owner": "project_manager"},
    {"from": "Todo", "to": "In Progress", "owner": "developer"},
    {"from": "In Progress", "to": "Ready for Test Deployment", "owner": "developer"},
    {"from": "Ready for Test Deployment", "to": "QA Testing", "owner": "qa"},
    {"from": "QA Testing", "to": "In Progress", "owner": "developer"},
    {"from": "QA Testing", "to": "Ready for Release", "owner": "qa"},
    {"from": "Ready for Release", "to": "Deployed", "owner": "devops"},
]

ENGINEERING_LABELS = [
    # Technical area
    {"name": "Frontend", "color": "#3B82F6", "category": "technical_area"},
    {"name": "Backend", "color": "#8B5CF6", "category": "technical_area"},
    {"name": "API", "color": "#06B6D4", "category": "technical_area"},
    {"name": "Database", "color": "#0EA5E9", "category": "technical_area"},
    {"name": "Infrastructure", "color": "#64748B", "category": "technical_area"},
    {"name": "DevOps", "color": "#475569", "category": "technical_area"},
    {"name": "Security", "color": "#DC2626", "category": "technical_area"},
    {"name": "Mobile", "color": "#EC4899", "category": "technical_area"},
    # Priority. Kept as labels because PROJECT.md lists them there; the Workspaces
    # `priority` field stays the one delivery metrics read.
    {"name": "Critical", "color": "#B91C1C", "category": "priority"},
    {"name": "High", "color": "#EA580C", "category": "priority"},
    {"name": "Medium", "color": "#CA8A04", "category": "priority"},
    {"name": "Low", "color": "#65A30D", "category": "priority"},
    # Release
    {"name": "Sprint", "color": "#2563EB", "category": "release"},
    {"name": "Hotfix", "color": "#DC2626", "category": "release"},
    {"name": "Maintenance", "color": "#0891B2", "category": "release"},
    {"name": "Emergency", "color": "#7F1D1D", "category": "release"},
    # Source
    {"name": "Sales", "color": "#16A34A", "category": "source"},
    {"name": "Operations", "color": "#0D9488", "category": "source"},
    {"name": "QA", "color": "#9333EA", "category": "source"},
    {"name": "Management", "color": "#1D4ED8", "category": "source"},
    {"name": "Customer", "color": "#DB2777", "category": "source"},
    {"name": "Internal", "color": "#525252", "category": "source"},
]

# `velocity` decides whether a completed item counts toward sprint velocity --
# research explicitly does not, per PROJECT.md. `quality` marks the types that
# feed the bug rate.
ENGINEERING_ISSUE_TYPES = [
    {"name": "Feature", "icon": "sparkles", "color": "#3B82F6", "velocity": True, "quality": False},
    {"name": "Task", "icon": "square-check", "color": "#64748B", "velocity": True, "quality": False},
    {"name": "Bug", "icon": "bug", "color": "#DC2626", "velocity": True, "quality": True},
    {"name": "Hotfix", "icon": "flame", "color": "#EA580C", "velocity": True, "quality": True},
    {"name": "Research", "icon": "microscope", "color": "#8B5CF6", "velocity": False, "quality": False},
    {"name": "Documentation", "icon": "book-open", "color": "#0891B2", "velocity": False, "quality": False},
    {"name": "Technical Debt", "icon": "wrench", "color": "#A16207", "velocity": True, "quality": False},
    {"name": "Spike", "icon": "zap", "color": "#7C3AED", "velocity": False, "quality": False},
    {"name": "Operations", "icon": "settings", "color": "#0D9488", "velocity": True, "quality": False},
]

ENGINEERING_MODULE_SUGGESTIONS = [
    "Authentication",
    "Booking",
    "Insurance",
    "Dashboard",
    "Reporting",
    "Pricing",
    "Payments",
    "Notifications",
    "Attendance",
    "Analytics",
    "Operations",
    "Administration",
]


# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

# Semantic buckets -> the state names that fill them out of the box. Every
# dashboard and metric asks for a bucket; only this table knows the names.
DEFAULT_STATE_MAPPING = {
    "planning": ["Backlog", "Todo"],
    "in_progress": ["In Progress"],
    "ready_for_test": ["Ready for Test Deployment"],
    "qa": ["QA Testing"],
    "ready_for_release": ["Ready for Release"],
    "deployed": ["Deployed"],
    "blocked": ["Halt"],
    "cancelled": ["Cancelled"],
    # PROJECT.md: "Developer productivity should only be measured while issues
    # are in developer-owned states."
    "developer_owned": ["In Progress", "Ready for Test Deployment"],
}

DEFAULT_OPERATIONS_CONFIG = {
    "state_mapping": DEFAULT_STATE_MAPPING,
    "work_log": {
        # ISO weekday numbers, Monday = 1. Nobody is chased for a Saturday.
        "required_weekdays": [1, 2, 3, 4, 5],
        # Local hour after which a missing log is worth a nudge.
        "reminder_hour": 17,
        "enabled": True,
    },
    "attendance": {
        "enabled": True,
        # Local hours after which a missing punch is worth a nudge.
        "check_in_reminder_hour": 10,
        "check_out_reminder_hour": 19,
    },
    "notifications": {
        "missing_attendance": True,
        "missing_work_log": True,
        "blocked_issues": True,
        "overdue_issues": True,
        "qa_waiting": True,
        "ready_for_release": True,
    },
    # Issue types whose completion counts toward velocity. Empty means "all".
    "velocity_issue_types": [t["name"] for t in ENGINEERING_ISSUE_TYPES if t["velocity"]],
    "quality_issue_types": [t["name"] for t in ENGINEERING_ISSUE_TYPES if t["quality"]],
}


def deep_merge(base, override):
    """Merge ``override`` onto ``base``, one level of dicts at a time."""
    merged = dict(base)
    for key, value in (override or {}).items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


def get_operations_config(workspace_id):
    """
    The effective configuration for one workspace.

    Always returns a complete config: a workspace that has never opened the
    settings page still gets every default, and a workspace that overrode one
    key does not lose the rest.
    """
    # Imported here rather than at module scope: this module is imported by
    # model-adjacent code and a top-level model import would be circular.
    from workspaces.db.models import OperationsSetting

    setting = OperationsSetting.objects.filter(workspace_id=workspace_id).first()
    return deep_merge(DEFAULT_OPERATIONS_CONFIG, setting.config if setting else {})


def state_names(config, bucket):
    """The state names configured for one semantic bucket."""
    mapping = config.get("state_mapping") or {}
    return mapping.get(bucket) or DEFAULT_STATE_MAPPING.get(bucket, [])


# --------------------------------------------------------------------------
# Date helpers
# --------------------------------------------------------------------------


def resolve_period(request, default_days=30):
    """
    Read ``?start_date=&end_date=`` or ``?days=`` off a request.

    Returns a ``(start, end)`` pair of dates, inclusive of both ends. Callers
    filter on ``created_at__date`` / ``completed_at__date`` so an inclusive end
    is what they actually want.
    """
    today = timezone.now().date()

    start_raw = request.query_params.get("start_date")
    end_raw = request.query_params.get("end_date")

    end = _parse_date(end_raw) or today
    start = _parse_date(start_raw)

    if start is None:
        try:
            days = int(request.query_params.get("days", default_days))
        except (TypeError, ValueError):
            days = default_days
        # Clamped: an unbounded window is a table scan of every issue activity
        # in the workspace, and no dashboard needs five years at once.
        days = max(1, min(days, 365))
        start = end - timedelta(days=days - 1)

    if start > end:
        start, end = end, start

    return start, end


def _parse_date(value):
    if not value:
        return None
    from django.utils.dateparse import parse_date

    try:
        return parse_date(value)
    except (TypeError, ValueError):
        return None


def average(values):
    """Mean of a list, or ``None`` when there is nothing to average."""
    cleaned = [v for v in values if v is not None]
    if not cleaned:
        return None
    return round(sum(cleaned) / len(cleaned), 2)


def hours_between(start, end):
    """Whole hours between two datetimes, to two decimals."""
    if not start or not end:
        return None
    return round((end - start).total_seconds() / 3600, 2)


def days_between(start, end):
    """Days between two datetimes, to two decimals."""
    if not start or not end:
        return None
    return round((end - start).total_seconds() / 86400, 2)
