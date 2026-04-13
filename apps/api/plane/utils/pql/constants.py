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

import calendar
from datetime import date, timedelta

from django.db.models import Q
from django.utils import timezone

# ---------------------------------------------------------------------------
# Field Aliases: PQL field name → rich filter key
# ---------------------------------------------------------------------------
FIELD_ALIASES = {
    # Direct fields
    "priority": "priority",
    "isDraft": "is_draft",
    "isArchived": "is_archived",
    # UUID relation fields
    "state": "state_id",
    "assignee": "assignee_id",
    "label": "label_id",
    "cycle": "cycle_id",
    "module": "module_id",
    "mention": "mention_id",
    "subscriber": "subscriber_id",
    "project": "project_id",
    "createdBy": "created_by_id",
    "type": "type_id",
    "milestone": "milestone_id",
    "workflow": "workflow_id",
    "teamspaceProject": "team_project_id",
    # State group
    "stateGroup": "state_group",
    # Date fields
    "startDate": "start_date",
    # "dueDate" is a common alias for "target_date"
    "dueDate": "target_date",
    # timestamps
    "createdAt": "created_at",
    "updatedAt": "updated_at",
    # Text search fields
    "title": "name",
    # for searching both name and description stripped
    "text": "text",
}

# ---------------------------------------------------------------------------
# ORDER BY: PQL field name → Django ORM ordering expression
# These map to the same strings _validate_order_by_field() accepts.
# ---------------------------------------------------------------------------
ORDER_BY_ALIASES = {
    "priority": "priority",
    "state": "state__group",
    "stateGroup": "state__group",
    "createdAt": "created_at",
    "updatedAt": "updated_at",
    "startDate": "start_date",
    "dueDate": "target_date",
    "title": "name",
    "assignee": "assignees__first_name",
    "label": "labels__name",
    "module": "issue_module__module__name",
    "createdBy": "created_by__first_name",
    "sequenceId": "sequence_id",
    "sortOrder": "sort_order",
    "completedAt": "completed_at",
    "archivedAt": "archived_at",
    "isDraft": "is_draft",
    "type": "type__name",
}

# Maximum allowed LIMIT value
PQL_MAX_LIMIT = 1000

# ---------------------------------------------------------------------------
# Operator → lookup suffix mapping
# ---------------------------------------------------------------------------
OPERATOR_LOOKUP = {
    "eq": "",
    "neq": "",  # wrapped in {"not": ...}
    "gt": "__gt",
    "gte": "__gte",
    "lt": "__lt",
    "lte": "__lte",
    "in_op": "__in",
    "not_in": "__in",  # wrapped in {"not": ...}
    "contains": "__icontains",
    "is_null": "__isnull",
    "is_not_null": "__isnull",
    "is_empty": "__isnull",
    "is_not_empty": "__isnull",
    "between": "__range",
}

# Operators that produce a NOT wrapper
NEGATED_OPERATORS = {"neq", "not_in"}

# Operators that set a fixed boolean value
ISNULL_TRUE_OPERATORS = {"is_null", "is_empty"}
ISNULL_FALSE_OPERATORS = {"is_not_null", "is_not_empty"}

# ---------------------------------------------------------------------------
# Value Functions: resolve to simple values (strings, lists of UUIDs, etc.)
# ---------------------------------------------------------------------------
FUNCTIONS = {
    # Date functions
    "now": lambda ctx: str(timezone.now()),
    "today": lambda ctx: str(timezone.now().date()),
    "startOfDay": lambda ctx: str(date.today()),
    "endOfDay": lambda ctx: str(date.today()),
    "startOfWeek": lambda ctx: str(date.today() - timedelta(days=date.today().weekday())),
    "endOfWeek": lambda ctx: str(date.today() - timedelta(days=date.today().weekday()) + timedelta(days=6)),
    "startOfMonth": lambda ctx: str(date.today().replace(day=1)),
    "endOfMonth": lambda ctx: str(
        date.today().replace(day=calendar.monthrange(date.today().year, date.today().month)[1])
    ),
    "startOfYear": lambda ctx: str(date.today().replace(month=1, day=1)),
    "endOfYear": lambda ctx: str(date.today().replace(month=12, day=31)),
    "daysAgo": lambda ctx, n: str(date.today() - timedelta(days=int(n))),
    "daysFromNow": lambda ctx, n: str(date.today() + timedelta(days=int(n))),
    "weeksAgo": lambda ctx, n: str(date.today() - timedelta(weeks=int(n))),
    "weeksFromNow": lambda ctx, n: str(date.today() + timedelta(weeks=int(n))),
    "monthsAgo": lambda ctx, n: str(date.today() - timedelta(days=int(n) * 30)),
    "monthsFromNow": lambda ctx, n: str(date.today() + timedelta(days=int(n) * 30)),
    # User functions — resolved lazily via ctx
    "currentUser": lambda ctx: str(ctx["request"].user.id),
    "membersOf": lambda ctx, resource_ref: _resolve_members_of(ctx, resource_ref),
    "workspaceMembers": lambda ctx: _resolve_workspace_members(ctx),
    # Cycle functions — resolved lazily via ctx
    "activeCycle": lambda ctx: _resolve_active_cycles(ctx),
    "completedCycles": lambda ctx: _resolve_completed_cycles(ctx),
    "upcomingCycles": lambda ctx: _resolve_upcoming_cycles(ctx),
    # State group functions
    "openStates": lambda ctx: ["backlog", "unstarted", "started"],
    "closedStates": lambda ctx: ["completed", "cancelled"],
    "activeStates": lambda ctx: ["unstarted", "started"],
}

# ---------------------------------------------------------------------------
# Predicate Functions: resolve to Django Q objects (standalone conditions)
# ---------------------------------------------------------------------------
PREDICATE_FUNCTIONS = {
    "isOverdue": lambda ctx: Q(
        target_date__lt=timezone.now().date(),
        state__group__in=["backlog", "unstarted", "started"],
    ),
    "hasNoAssignee": lambda ctx: ~Q(
        issue_assignee__deleted_at__isnull=True,
        issue_assignee__isnull=False,
    ),
    "hasNoLabel": lambda ctx: ~Q(
        label_issue__deleted_at__isnull=True,
        label_issue__isnull=False,
    ),
    "isTopLevel": lambda ctx: Q(parent__isnull=True),
    "isSubIssue": lambda ctx: Q(parent__isnull=False),
    "isEpic": lambda ctx: Q(type__is_epic=True),
    "isIntake": lambda ctx: Q(issue_intake__isnull=False),
    "isDraft": lambda ctx: Q(is_draft=True),
    "isArchived": lambda ctx: Q(archived_at__isnull=False),
    "hasChildren": lambda ctx: Q(parent_issue__isnull=False),
    "hasStartAndDueDates": lambda ctx: Q(
        start_date__isnull=False,
        target_date__isnull=False,
    ),
}

# ---------------------------------------------------------------------------
# Relation Functions: resolve to Q objects with subqueries
# ---------------------------------------------------------------------------
RELATION_FUNCTIONS = {
    "linkedTo": lambda ctx, issue_id: _q_relation(issue_id, "relates_to", "issue_id"),
    "blockedBy": lambda ctx, issue_id: _q_relation(issue_id, "blocked_by", "issue_id"),
    "blocks": lambda ctx, issue_id: _q_relation_reverse(issue_id, "blocked_by"),
    "childOf": lambda ctx, issue_id: Q(parent_id=issue_id),
    "parentOf": lambda ctx, issue_id: _q_parent_of(issue_id),
    "duplicateOf": lambda ctx, issue_id: _q_relation(issue_id, "duplicate", "issue_id"),
}

# ---------------------------------------------------------------------------
# History Functions: resolve to Q objects via IssueActivity subqueries
# ---------------------------------------------------------------------------

# PQL field → IssueActivity.field value
FIELD_TO_ACTIVITY_FIELD = {
    "state": "state",
    "stateGroup": "state",
    "priority": "priority",
    "assignee": "assignees",
    "label": "labels",
    "name": "name",
    "description": "description",
    "parent": "parent",
    "startDate": "start_date",
    "targetDate": "target_date",
    "cycle": "cycles",
    "module": "modules",
    "milestone": "milestones",
    "estimate": "estimate_point",
    "type": "type",
}

HISTORY_FUNCTIONS = {
    "wasEver": lambda ctx, field, value: (
        _q_activity(ctx, field=field, old_value=value) | _q_activity(ctx, field=field, new_value=value)
    ),
    "was": lambda ctx, field, value: (
        _q_activity(ctx, field=field, old_value=value) | _q_activity(ctx, field=field, new_value=value)
    ),
    "changedFrom": lambda ctx, field, value: _q_activity(ctx, field=field, old_value=value, verb="updated"),
    "changedTo": lambda ctx, field, value: _q_activity(ctx, field=field, new_value=value, verb="updated"),
    "changed": lambda ctx, field: _q_activity(ctx, field=field, verb="updated"),
}

HISTORY_ACTOR_FUNCTIONS = {
    "updatedBy": lambda ctx, user_id: _q_activity(ctx, actor_id=user_id, verb="updated"),
    "commentedBy": lambda ctx, user_id: _q_activity(ctx, actor_id=user_id, field_raw="comment", verb="created"),
    "fieldChangedBy": lambda ctx, field, user_id: _q_activity(ctx, field=field, actor_id=user_id, verb="updated"),
    "wasAssignedTo": lambda ctx, user_id: _q_activity(
        ctx, field_raw="assignees", new_identifier=user_id, verb="updated"
    ),
}

HISTORY_TIME_FUNCTIONS = {
    "changedAfter": lambda ctx, date_str: _q_activity(ctx, created_at__gte=date_str, verb="updated"),
    "changedBefore": lambda ctx, date_str: _q_activity(ctx, created_at__lte=date_str, verb="updated"),
    "fieldChangedAfter": lambda ctx, field, date_str: _q_activity(
        ctx, field=field, created_at__gte=date_str, verb="updated"
    ),
    "fieldChangedBefore": lambda ctx, field, date_str: _q_activity(
        ctx, field=field, created_at__lte=date_str, verb="updated"
    ),
    "changedToAfter": lambda ctx, field, value, date_str: _q_activity(
        ctx,
        field=field,
        new_value=value,
        created_at__gte=date_str,
        verb="updated",
    ),
    "changedToBefore": lambda ctx, field, value, date_str: _q_activity(
        ctx,
        field=field,
        new_value=value,
        created_at__lte=date_str,
        verb="updated",
    ),
    "fieldChangedBetween": lambda ctx, field, date_from, date_to: _q_activity(
        ctx,
        field=field,
        created_at__gte=date_from,
        created_at__lte=date_to,
        verb="updated",
    ),
}

# ---------------------------------------------------------------------------
# Combined lookup: all function registries that produce Q objects
# ---------------------------------------------------------------------------
ALL_Q_FUNCTIONS = {
    **RELATION_FUNCTIONS,
    **HISTORY_FUNCTIONS,
    **HISTORY_ACTOR_FUNCTIONS,
    **HISTORY_TIME_FUNCTIONS,
}

# ---------------------------------------------------------------------------
# camelCase PQL name → snake_case fn registry name
# ---------------------------------------------------------------------------
CAMEL_TO_SNAKE_FN = {
    # Predicates
    "isOverdue": "is_overdue",
    "hasNoAssignee": "has_no_assignee",
    "hasNoLabel": "has_no_label",
    "isTopLevel": "is_top_level",
    "isSubWorkItem": "is_sub_workitem",
    "isEpic": "is_epic",
    "isIntake": "is_intake",
    "isDraft": "is_draft",
    "isArchived": "is_archived",
    "hasChildren": "has_children",
    "hasStartAndDueDates": "has_start_and_due_dates",
    # Relations
    "linkedTo": "linked_to",
    "blockedBy": "blocked_by",
    "blocks": "blocks",
    "childOf": "child_of",
    "parentOf": "parent_of",
    "duplicateOf": "duplicate_of",
    # History
    "wasEver": "was_ever",
    "was": "was",
    "changedFrom": "changed_from",
    "changedTo": "changed_to",
    "changed": "changed",
    # History actor
    "updatedBy": "updated_by",
    "commentedBy": "commented_by",
    "fieldChangedBy": "field_changed_by",
    "wasAssignedTo": "was_assigned_to",
    # History time
    "changedAfter": "changed_after",
    "changedBefore": "changed_before",
    "fieldChangedAfter": "field_changed_after",
    "fieldChangedBefore": "field_changed_before",
    "changedToAfter": "changed_to_after",
    "changedToBefore": "changed_to_before",
    "fieldChangedBetween": "field_changed_between",
    "isSubIssue": "is_sub_issue",
}

# ---------------------------------------------------------------------------
# Internal helpers (deferred imports to avoid circular deps)
# ---------------------------------------------------------------------------


def _resolve_members_of(ctx, resource_ref):
    """Resolve membersOf("project:<id>") or membersOf("teamspace:<id>")."""
    from plane.db.models import ProjectMember
    from plane.ee.models import TeamspaceMember

    resource = ""
    if ":" in str(resource_ref):
        resource, resource_id = str(resource_ref).split(":", 1)
    else:
        resource_id = str(resource_ref)

    if resource and resource == "project":
        return [
            str(uid)
            for uid in ProjectMember.objects.filter(
                project_id=resource_id,
                is_active=True,
                member__is_active=True,
            ).values_list("member_id", flat=True)
        ]

    if resource and resource == "teamspace":
        return [
            str(uid)
            for uid in TeamspaceMember.objects.filter(
                team_space_id=resource_id,
                member__is_active=True,
            ).values_list("member_id", flat=True)
        ]

    # By default resolve to project members
    return [
        str(uid)
        for uid in ProjectMember.objects.filter(
            project_id=resource_id,
            is_active=True,
            member__is_active=True,
        ).values_list("member_id", flat=True)
    ]


def _resolve_workspace_members(ctx):
    from plane.db.models import WorkspaceMember

    return [
        str(uid)
        for uid in WorkspaceMember.objects.filter(
            workspace__slug=ctx["workspace_slug"],
            is_active=True,
            member__is_active=True,
        ).values_list("member_id", flat=True)
    ]


def _resolve_active_cycles(ctx):
    from plane.db.models import Cycle

    now = timezone.now().date()
    return [
        str(uid)
        for uid in Cycle.objects.filter(
            workspace__slug=ctx["workspace_slug"],
            start_date__lte=now,
            end_date__gte=now,
            project__archived_at__isnull=True,
        ).values_list("id", flat=True)
    ]


def _resolve_completed_cycles(ctx):
    from plane.db.models import Cycle

    now = timezone.now().date()
    return [
        str(uid)
        for uid in Cycle.objects.filter(
            workspace__slug=ctx["workspace_slug"],
            end_date__lt=now,
        ).values_list("id", flat=True)
    ]


def _resolve_upcoming_cycles(ctx):
    from plane.db.models import Cycle

    now = timezone.now().date()
    return [
        str(uid)
        for uid in Cycle.objects.filter(
            workspace__slug=ctx["workspace_slug"],
            start_date__gt=now,
        ).values_list("id", flat=True)
    ]


def _q_relation(issue_id, relation_type, return_field):
    """Build Q(pk__in=...) from IssueRelation for a given relation type."""
    from plane.db.models import IssueRelation

    return Q(
        pk__in=IssueRelation.objects.filter(
            related_issue_id=issue_id,
            relation_type=relation_type,
        ).values_list("issue_id", flat=True)
    )


def _q_relation_reverse(issue_id, relation_type):
    """Build Q(pk__in=...) for the reverse direction of a relation."""
    from plane.db.models import IssueRelation

    return Q(
        pk__in=IssueRelation.objects.filter(
            issue_id=issue_id,
            relation_type=relation_type,
        ).values_list("related_issue_id", flat=True)
    )


def _q_parent_of(issue_id):
    from plane.db.models import Issue

    return Q(pk__in=Issue.objects.filter(parent_issue__id=issue_id).values_list("id", flat=True))


def _q_activity(
    ctx,
    field=None,
    field_raw=None,
    verb=None,
    old_value=None,
    new_value=None,
    old_identifier=None,
    new_identifier=None,
    actor_id=None,
    created_at__gte=None,
    created_at__lte=None,
):
    """Build Q(pk__in=...) from IssueActivity with the given filters."""
    from plane.db.models import IssueActivity

    # Fields where IssueActivity stores UUIDs in old_identifier/new_identifier
    # instead of old_value/new_value.
    IDENTIFIER_FIELDS = {"assignees", "labels", "cycles", "created_by", "type", "milestones", "state"}

    resolved_field = None
    if field is not None:
        resolved_field = FIELD_TO_ACTIVITY_FIELD.get(field, field)
    if field_raw is not None:
        resolved_field = field_raw

    # For identifier-based fields, route old_value/new_value to
    # old_identifier/new_identifier instead.
    if resolved_field in IDENTIFIER_FIELDS:
        if old_value is not None and old_identifier is None:
            old_identifier = old_value
            old_value = None
        if new_value is not None and new_identifier is None:
            new_identifier = new_value
            new_value = None

    filters = {"workspace__slug": ctx["workspace_slug"]}

    if resolved_field is not None:
        filters["field"] = resolved_field
    if verb is not None:
        filters["verb"] = verb
    if old_value is not None:
        filters["old_value"] = old_value
    if new_value is not None:
        filters["new_value"] = new_value
    if old_identifier is not None:
        filters["old_identifier"] = old_identifier
    if new_identifier is not None:
        filters["new_identifier"] = new_identifier
    if actor_id is not None:
        filters["actor_id"] = actor_id
    if created_at__gte is not None:
        filters["created_at__gte"] = created_at__gte
    if created_at__lte is not None:
        filters["created_at__lte"] = created_at__lte

    return Q(pk__in=IssueActivity.objects.filter(**filters).values_list("issue_id", flat=True))


# ---------------------------------------------------------------------------
# Custom property activity helpers
# ---------------------------------------------------------------------------

_CF_PREFIX = "cf:"


def _is_cf_field(field):
    """Check if a field string is a custom property reference (cf:uuid)."""
    return isinstance(field, str) and field.startswith(_CF_PREFIX)


def _cf_property_id(field):
    """Extract the property UUID from a cf:uuid marker string."""
    return field[len(_CF_PREFIX) :]


def _q_cf_activity(
    ctx,
    property_id=None,
    action=None,
    old_value=None,
    new_value=None,
    old_identifier=None,
    new_identifier=None,
    actor_id=None,
    created_at__gte=None,
    created_at__lte=None,
):
    """Build Q(pk__in=...) from IssuePropertyActivity with the given filters."""
    from plane.ee.models import IssuePropertyActivity

    filters = {"workspace__slug": ctx["workspace_slug"]}

    if property_id is not None:
        filters["property_id"] = property_id
    if action is not None:
        filters["action"] = action
    if old_value is not None:
        filters["old_value"] = old_value
    if new_value is not None:
        filters["new_value"] = new_value
    if old_identifier is not None:
        filters["old_identifier"] = old_identifier
    if new_identifier is not None:
        filters["new_identifier"] = new_identifier
    if actor_id is not None:
        filters["actor_id"] = actor_id
    if created_at__gte is not None:
        filters["created_at__gte"] = created_at__gte
    if created_at__lte is not None:
        filters["created_at__lte"] = created_at__lte

    return Q(pk__in=IssuePropertyActivity.objects.filter(**filters).values_list("issue_id", flat=True))
