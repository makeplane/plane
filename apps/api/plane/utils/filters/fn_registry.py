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

"""
Function registry for the ``fn`` operator in rich filters.

Each entry maps a snake_case function name to a callable with the signature
``(ctx, *args) -> Q``.  The ``evaluate_fn`` helper dispatches a rich-filter
``fn`` node (e.g. ``{"is_overdue": true}``) to the matching callable.
"""

from __future__ import annotations

from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError as DRFValidationError

from plane.utils.pql.constants import (
    _cf_property_id,
    _is_cf_field,
    _q_activity,
    _q_cf_activity,
    _q_parent_of,
    _q_relation,
    _q_relation_reverse,
)

# ---------------------------------------------------------------------------
# Dispatch helper: routes to IssuePropertyActivity or IssueActivity
# ---------------------------------------------------------------------------


def _dispatch_activity(
    ctx,
    field,
    *,
    action=None,
    old_value=None,
    new_value=None,
    actor_id=None,
    created_at__gte=None,
    created_at__lte=None,
):
    """Route to IssuePropertyActivity or IssueActivity based on cf: prefix."""
    if _is_cf_field(field):
        return _q_cf_activity(
            ctx,
            property_id=_cf_property_id(field),
            action=action,
            old_value=old_value,
            new_value=new_value,
            actor_id=actor_id,
            created_at__gte=created_at__gte,
            created_at__lte=created_at__lte,
        )
    return _q_activity(
        ctx,
        field=field,
        verb=action,
        old_value=old_value,
        new_value=new_value,
        actor_id=actor_id,
        created_at__gte=created_at__gte,
        created_at__lte=created_at__lte,
    )


# ---------------------------------------------------------------------------
# Work item identifier helper
# ---------------------------------------------------------------------------


def _parse_identifier(identifier: str) -> tuple[str, int]:
    """Parse a work item identifier like 'WEB-11' into (project_identifier, sequence_id)."""
    parts = str(identifier).rsplit("-", 1)
    if len(parts) != 2:
        raise DRFValidationError(
            {
                "message": f"Invalid work item identifier: '{identifier}'. Expected format: 'PREFIX-NUMBER'",
                "code": "invalid_identifier",
            }
        )
    project_identifier, seq_str = parts
    try:
        sequence_id = int(seq_str)
    except ValueError:
        raise DRFValidationError(
            {
                "message": f"Invalid sequence number in identifier: '{identifier}'",
                "code": "invalid_identifier",
            }
        )
    return project_identifier, sequence_id


def _build_work_item_identifier_q(ctx, op, value) -> Q:
    """Build a Q object for work item identifier(s) like 'WEB-11'.

    Args:
        ctx: Context dict.
        op: The PQL operator ('eq', 'neq', 'in_op', 'not_in', 'contains').
        value: A single identifier string or a list of identifiers.
    """
    from django.db.models import CharField, Value
    from django.db.models.functions import Cast, Concat

    from plane.db.models import Issue

    # Handle contains (~) — partial match on the full identifier
    if op == "contains":
        return Q(
            pk__in=Issue.objects.annotate(
                full_identifier=Concat(
                    "project__identifier",
                    Value("-"),
                    Cast("sequence_id", output_field=CharField()),
                )
            )
            .filter(full_identifier__icontains=str(value), workspace__slug=ctx["workspace_slug"])
            .values_list("pk", flat=True)
        )

    # Exact / IN matching
    identifiers = value if isinstance(value, list) else [value]

    # Group by project identifier for efficient querying
    # e.g., {"WEB": [11, 12], "APP": [5]} → fewer Q objects
    grouped: dict[str, list[int]] = {}
    for ident in identifiers:
        project_identifier, sequence_id = _parse_identifier(ident)
        grouped.setdefault(project_identifier, []).append(sequence_id)

    # Build combined Q: OR across projects
    combined = Q()
    for proj_ident, seq_ids in grouped.items():
        if len(seq_ids) == 1:
            combined |= Q(project__identifier=proj_ident, sequence_id=seq_ids[0])
        else:
            combined |= Q(project__identifier=proj_ident, sequence_id__in=seq_ids)

    return combined


# ---------------------------------------------------------------------------
# Registry: snake_case name → callable(ctx, *args) -> Q
# ---------------------------------------------------------------------------

FN_REGISTRY: dict[str, callable] = {
    # -- Predicates (11) ---------------------------------------------------
    "is_overdue": lambda ctx: Q(
        target_date__lt=timezone.now().date(),
        state__group__in=["backlog", "unstarted", "started"],
    ),
    "has_no_assignee": lambda ctx: ~Q(
        issue_assignee__deleted_at__isnull=True,
        issue_assignee__isnull=False,
    ),
    "has_no_label": lambda ctx: ~Q(
        label_issue__deleted_at__isnull=True,
        label_issue__isnull=False,
    ),
    "is_top_level": lambda ctx: Q(parent__isnull=True),
    "is_sub_workitem": lambda ctx: Q(parent__isnull=False),
    # ======= these don't work with base issue queryset because they already filter these out =======
    "is_epic": lambda ctx: Q(type__is_epic=True),
    "is_intake": lambda ctx: Q(issue_intake__isnull=False),
    "is_draft": lambda ctx: Q(is_draft=True),
    "is_archived": lambda ctx: Q(archived_at__isnull=False),
    # ==================================================================================================
    "has_children": lambda ctx: Q(parent_issue__isnull=False),
    "has_start_and_due_dates": lambda ctx: Q(
        start_date__isnull=False,
        target_date__isnull=False,
    ),
    # -- Relations (6) -----------------------------------------------------
    "linked_to": lambda ctx, issue_id: _q_relation(issue_id, "relates_to", "issue_id"),
    "blocked_by": lambda ctx, issue_id: _q_relation(issue_id, "blocked_by", "issue_id"),
    "blocks": lambda ctx, issue_id: _q_relation_reverse(issue_id, "blocked_by"),
    "child_of": lambda ctx, issue_id: Q(parent_id=issue_id),
    "parent_of": lambda ctx, issue_id: _q_parent_of(issue_id),
    "duplicate_of": lambda ctx, issue_id: _q_relation(issue_id, "duplicate", "issue_id"),
    # -- History (5) -------------------------------------------------------
    # These accept both regular field names and cf:uuid references.
    "was_ever": lambda ctx, field, value: (
        _dispatch_activity(ctx, field, old_value=value) | _dispatch_activity(ctx, field, new_value=value)
    ),
    "was": lambda ctx, field, value: (
        _dispatch_activity(ctx, field, old_value=value) | _dispatch_activity(ctx, field, new_value=value)
    ),
    "changed_from": lambda ctx, field, value: _dispatch_activity(ctx, field, old_value=value, action="updated"),
    "changed_to": lambda ctx, field, value: _dispatch_activity(ctx, field, new_value=value, action="updated"),
    "changed": lambda ctx, field: _dispatch_activity(ctx, field, action="updated"),
    # -- History actor (4) -------------------------------------------------
    "updated_by": lambda ctx, user_id: _q_activity(ctx, actor_id=user_id, verb="updated"),
    "commented_by": lambda ctx, user_id: _q_activity(ctx, actor_id=user_id, field_raw="comment", verb="created"),
    "field_changed_by": lambda ctx, field, user_id: _dispatch_activity(ctx, field, actor_id=user_id, action="updated"),
    "was_assigned_to": lambda ctx, user_id: _q_activity(
        ctx, field_raw="assignees", new_identifier=user_id, verb="updated"
    ),
    # -- History time (7) --------------------------------------------------
    "changed_after": lambda ctx, date_str: _q_activity(ctx, created_at__gte=date_str, verb="updated"),
    "changed_before": lambda ctx, date_str: _q_activity(ctx, created_at__lte=date_str, verb="updated"),
    "field_changed_after": lambda ctx, field, date_str: _dispatch_activity(
        ctx, field, created_at__gte=date_str, action="updated"
    ),
    "field_changed_before": lambda ctx, field, date_str: _dispatch_activity(
        ctx, field, created_at__lte=date_str, action="updated"
    ),
    "changed_to_after": lambda ctx, field, value, date_str: _dispatch_activity(
        ctx, field, new_value=value, created_at__gte=date_str, action="updated"
    ),
    "changed_to_before": lambda ctx, field, value, date_str: _dispatch_activity(
        ctx, field, new_value=value, created_at__lte=date_str, action="updated"
    ),
    "field_changed_between": lambda ctx, field, date_from, date_to: _dispatch_activity(
        ctx, field, created_at__gte=date_from, created_at__lte=date_to, action="updated"
    ),
    # -- Work item identifier ------------------------------------------------
    "work_item_identifier": _build_work_item_identifier_q,
}


def evaluate_fn(fn_node: dict, ctx: dict) -> Q:
    """Dispatch a ``{"fn_name": args}`` node to the registry and return a Q.

    Args:
        fn_node: A dict with exactly one key — the function name — and a
            value that is either ``True`` (no args), a scalar (single arg),
            or a list (multiple args).
        ctx: Context dict with ``request`` and ``workspace_slug``.

    Returns:
        A Django ``Q`` object produced by the registered function.

    Raises:
        DRFValidationError: If the function name is unknown.
    """
    if not isinstance(fn_node, dict) or len(fn_node) != 1:
        raise DRFValidationError(
            {
                "message": "'fn' value must be a dict with exactly one key",
                "code": "invalid_fn_node",
            }
        )

    fn_name, fn_args = next(iter(fn_node.items()))

    func = FN_REGISTRY.get(fn_name)
    if func is None:
        raise DRFValidationError(
            {
                "message": f"Unknown filter function: '{fn_name}'",
                "code": "unknown_fn",
            }
        )

    # Normalize args: True/None → no args, list → *args, scalar → single arg
    if fn_args is True or fn_args is None:
        return func(ctx)
    if isinstance(fn_args, list):
        return func(ctx, *fn_args)
    return func(ctx, fn_args)
