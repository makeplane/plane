# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Service-layer helpers for applying a saved Project Template to a Project.

This module is the Phase 02-02 sibling of ``project_creation``. The
shared ``create_project_with_optional_template`` service owns the
``transaction.atomic`` boundary that wraps Project creation (Phase 02-01).
When a valid ``template_id`` resolves to a ``ProjectTemplate`` row, this
module's :func:`apply_project_template` function is called inside that
same transaction. The apply function re-validates the payload (D-04),
creates ``State``, ``Label``, ``Module``, ``Cycle``, and starter ``Issue``
rows from the payload, and bulk-inserts ``IssueLabel``,
``ModuleIssue``, and ``CycleIssue`` join rows pointing at the newly
generated objects (D-11/D-12/D-13).

Generated rows never call ``save`` on the underlying models in a way that
would let ``State.save`` (sequence auto-assignment), ``Label.save``
(sort_order auto-assignment), or ``Module.save``/``Cycle.save``
(smallest-sort-order auto-assignment) override the explicit payload
values. ``bulk_create`` is used wherever possible so the model save hooks
do not run on the generated rows.

The apply function is intentionally split into smaller private helpers
(``_create_template_states``, ``_create_template_labels``,
``_create_template_modules``, ``_create_template_cycles``,
``_create_template_starter_issues``) so each generated section can be
reused or mocked independently in tests, and so each row-creation path
can be reasoned about in isolation.

The relative-date resolution helper :func:`resolve_relative_template_dates`
is exposed so it can be unit-tested without touching the database; it
implements D-14/D-15 — offsets are anchored to the Project creation date,
and ``target_offset_days`` wins over ``duration_days`` when both are
present.
"""

from datetime import date, datetime, time, timedelta
from typing import Optional

# Django imports
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

# Third party imports
from rest_framework import serializers

# Module imports
from plane.app.serializers.project_template import validate_project_template_payload
from plane.db.models import (
    Cycle,
    CycleIssue,
    Issue,
    IssueLabel,
    Label,
    Module,
    ModuleIssue,
    Project,
    ProjectTemplate,
    State,
)


class ProjectTemplateApplicationError(serializers.ValidationError):
    """Raised when a template cannot be applied to a Project.

    Subclasses ``serializers.ValidationError`` so callers that already
    handle DRF validation errors propagate this failure through the same
    response path (400 with the underlying message). The exception covers
    two scenarios: (1) the payload fails re-validation per D-04, and
    (2) a payload reference key resolves to no generated object per D-13.
    Both are pre-write, hard-failure paths that must roll back the
    surrounding transaction.
    """


# ---------------------------------------------------------------------------
# Template availability resolver
# ---------------------------------------------------------------------------
def resolve_available_project_template(*, template_id, workspace):
    """Return the active ``ProjectTemplate`` available to this workspace.

    Implements CREATE-03 (D-01): a template is available when it is one of
    the three active global built-ins (``is_system=True``,
    ``is_active=True``, ``workspace__isnull=True``) or an active custom
    template owned by the current workspace (``is_system=False``,
    ``is_active=True``, ``workspace=workspace``). The function returns
    ``None`` for any other case (missing template, inactive template,
    foreign-workspace template) so callers can surface a generic 404 per
    D-02 without distinguishing the failure modes.

    The ``Q(...) | Q(...)`` OR is the canonical availability query and
    matches the same shape used by ``WorkspaceProjectTemplateViewSet``.
    """
    if template_id is None:
        return None

    return ProjectTemplate.objects.filter(
        Q(
            id=template_id,
            is_system=True,
            is_active=True,
            workspace__isnull=True,
        )
        | Q(
            id=template_id,
            is_system=False,
            is_active=True,
            workspace_id=workspace.id,
        )
    ).first()


# ---------------------------------------------------------------------------
# Relative date resolution (D-14/D-15)
# ---------------------------------------------------------------------------
def resolve_relative_template_dates(payload_obj, creation_date):
    """Return ``{"start_date": date|None, "end_date": date|None}`` for one
    module/cycle payload entry.

    Anchors offsets to ``creation_date`` per D-14. When
    ``target_offset_days`` is present it wins over ``duration_days``
    (D-15). When neither is present the dates resolve to ``None`` so
    callers can leave the model fields unset.
    """
    start_offset = payload_obj.get("start_offset_days")
    target_offset = payload_obj.get("target_offset_days")
    duration = payload_obj.get("duration_days")

    resolved_start = None
    if isinstance(start_offset, int) and not isinstance(start_offset, bool):
        resolved_start = creation_date + timedelta(days=start_offset)

    if isinstance(target_offset, int) and not isinstance(target_offset, bool):
        resolved_end = creation_date + timedelta(days=target_offset)
    elif (
        resolved_start is not None
        and isinstance(duration, int)
        and not isinstance(duration, bool)
    ):
        resolved_end = resolved_start + timedelta(days=duration)
    else:
        resolved_end = None

    return {"start_date": resolved_start, "end_date": resolved_end}


def _combine_date_with_default_time(d):
    """Combine a ``date`` with a midnight ``time`` in the project timezone.

    The ``Cycle`` model stores ``start_date``/``end_date`` as
    ``DateTimeField`` so a pure ``date`` would be silently coerced to a
    ``datetime`` at midnight UTC. ``timezone.make_aware`` keeps the value
    naive-free for the project's configured timezone — the default UTC
    fallback matches the historical Cycle behavior.
    """
    if d is None:
        return None
    if isinstance(d, datetime):
        return timezone.make_aware(d) if timezone.is_naive(d) else d
    return timezone.make_aware(datetime.combine(d, time.min))


# ---------------------------------------------------------------------------
# Apply service
# ---------------------------------------------------------------------------
def apply_project_template(
    *,
    project: Project,
    workspace,
    template: ProjectTemplate,
    actor,
    creation_date: Optional[date] = None,
):
    """Apply a saved template to a freshly created Project.

    Must run inside the surrounding ``transaction.atomic()`` opened by
    :func:`plane.app.services.project_creation.create_project_with_optional_template`
    so any failure here rolls back the entire Project creation (D-05).
    The function takes ``creation_date`` so callers can anchor relative
    date offsets to a deterministic date (tests use ``date(2026, 6, 30)``).

    Steps:

    1. Re-validate the template payload per D-04.
    2. Bulk-create States preserving payload sequence values (D-09).
    3. Bulk-create Labels preserving payload order / sort_order (D-10).
    4. Create Modules from the payload section with sort_order derived
       from the payload array index (D-10 fallback).
    5. Create Cycles from the payload section with relative dates
       resolved against ``creation_date`` (D-14/D-15) and ``owned_by``
       stamped to ``actor`` (D-16).
    6. Build ``state_by_key``/``label_by_key``/``module_by_key``/
       ``cycle_by_key`` maps for issue-link resolution.
    7. Create starter Issues one-by-one so the ``Issue.save`` advisory-
       lock + ``IssueSequence`` write path can run; pass explicit
       ``state`` to avoid ``_ensure_default_state`` fallback (D-11).
    8. Bulk-create ``IssueLabel``/``ModuleIssue``/``CycleIssue`` rows
       from the generated objects (D-12). Raise ``ProjectTemplateApplicationError``
       if any payload reference key is missing (D-13).
    """
    if creation_date is None:
        creation_date = timezone.now().date()

    payload = template.payload
    if not isinstance(payload, dict):
        raise ProjectTemplateApplicationError(
            {"payload": "Payload must be a JSON object"}
        )

    # D-04: re-validate the payload before any writes. ``validate_project_template_payload``
    # raises ``serializers.ValidationError`` on failure; we re-raise as the
    # apply-specific subclass so callers can catch both with one handler.
    try:
        validate_project_template_payload(payload)
    except serializers.ValidationError as exc:
        raise ProjectTemplateApplicationError(detail=exc.detail) from exc

    state_by_key = _create_template_states(
        project=project, payload=payload, actor=actor
    )
    label_by_key = _create_template_labels(
        project=project,
        workspace=workspace,
        payload=payload,
        actor=actor,
    )
    module_by_key = _create_template_modules(
        project=project,
        workspace=workspace,
        payload=payload,
        actor=actor,
        creation_date=creation_date,
    )
    cycle_by_key = _create_template_cycles(
        project=project,
        workspace=workspace,
        payload=payload,
        actor=actor,
        creation_date=creation_date,
    )

    _create_template_starter_issues(
        project=project,
        workspace=workspace,
        payload=payload,
        actor=actor,
        state_by_key=state_by_key,
        label_by_key=label_by_key,
        module_by_key=module_by_key,
        cycle_by_key=cycle_by_key,
    )


# ---------------------------------------------------------------------------
# Per-section helpers
# ---------------------------------------------------------------------------
def _create_template_states(*, project, payload, actor):
    """Bulk-create ``State`` rows preserving payload sequence/default values.

    ``bulk_create`` is used (rather than ``State.objects.create``) so the
    ``State.save`` auto-sequence assignment hook does not run and clobber
    the payload sequence with ``last_id + 15000``. Without this, every
    generated state would land on a single sequence and downstream
    ordering consumers (board views, etc.) would see stacked states.
    """
    state_payloads = payload.get("states", []) or []
    state_instances = []
    for entry in state_payloads:
        state_instances.append(
            State(
                name=entry["name"],
                color=entry["color"],
                group=entry["group"],
                sequence=float(entry.get("sequence", 65535)),
                default=bool(entry.get("default", False)),
                project=project,
                workspace_id=project.workspace_id,
                created_by=actor,
                updated_by=actor,
            )
        )
    if state_instances:
        State.objects.bulk_create(state_instances)

    # Build the state_key -> State map AFTER bulk_create so the saved
    # PKs are available. We materialize the map from a fresh query because
    # ``bulk_create`` returns objects without PKs on some DB backends.
    saved_states = list(
        State.objects.filter(
            project=project, name__in=[s.name for s in state_instances]
        )
    )
    name_to_state = {s.name: s for s in saved_states}
    state_by_key = {}
    for entry in state_payloads:
        state_by_key[entry["state_key"]] = name_to_state[entry["name"]]
    return state_by_key


def _create_template_labels(*, project, workspace, payload, actor):
    """Bulk-create ``Label`` rows preserving payload order (D-10)."""
    label_payloads = payload.get("labels", []) or []
    label_instances = []
    for index, entry in enumerate(label_payloads):
        sort_order = entry.get("order")
        if sort_order is None:
            # D-10 fallback: explicit payload ``order`` wins; otherwise
            # use a stable, deterministic sort_order derived from the
            # payload array index so the same template always produces
            # the same ordering without relying on save-hook assignment.
            sort_order = 10000 + index * 10000
        label_instances.append(
            Label(
                name=entry["name"],
                color=entry.get("color", ""),
                sort_order=float(sort_order),
                project=project,
                workspace_id=workspace.id,
                created_by=actor,
                updated_by=actor,
            )
        )
    if label_instances:
        Label.objects.bulk_create(label_instances)

    saved_labels = list(
        Label.objects.filter(
            project=project, name__in=[label.name for label in label_instances]
        )
    )
    name_to_label = {label.name: label for label in saved_labels}
    label_by_key = {}
    for entry in label_payloads:
        label_by_key[entry["label_key"]] = name_to_label[entry["name"]]
    return label_by_key


def _create_template_modules(
    *, project, workspace, payload, actor, creation_date
):
    """Create ``Module`` rows preserving payload status and stable sort_order."""
    module_payloads = payload.get("modules", []) or []
    module_instances = []
    for index, entry in enumerate(module_payloads):
        sort_order = 10000 + index * 10000
        dates = resolve_relative_template_dates(entry, creation_date)
        module_instances.append(
            Module(
                name=entry["name"],
                status=entry.get("status", "planned"),
                start_date=dates["start_date"],
                target_date=dates["end_date"],
                sort_order=float(sort_order),
                project=project,
                workspace_id=workspace.id,
                created_by=actor,
                updated_by=actor,
            )
        )
    if module_instances:
        # ``bulk_create`` avoids the ``Module.save`` smallest-sort-order
        # auto-assignment hook so explicit sort_order wins (D-10).
        Module.objects.bulk_create(module_instances)

    saved_modules = list(
        Module.objects.filter(
            project=project,
            name__in=[module.name for module in module_instances],
        )
    )
    name_to_module = {module.name: module for module in saved_modules}
    module_by_key = {}
    for entry in module_payloads:
        module_by_key[entry["module_key"]] = name_to_module[entry["name"]]
    return module_by_key


def _create_template_cycles(
    *, project, workspace, payload, actor, creation_date
):
    """Create ``Cycle`` rows with resolved dates and ``owned_by`` set to actor."""
    cycle_payloads = payload.get("cycles", []) or []
    cycle_instances = []
    for index, entry in enumerate(cycle_payloads):
        sort_order = 10000 + index * 10000
        dates = resolve_relative_template_dates(entry, creation_date)
        cycle_instances.append(
            Cycle(
                name=entry["name"],
                start_date=_combine_date_with_default_time(dates["start_date"]),
                end_date=_combine_date_with_default_time(dates["end_date"]),
                owned_by=actor,
                sort_order=float(sort_order),
                project=project,
                workspace_id=workspace.id,
                created_by=actor,
                updated_by=actor,
            )
        )
    if cycle_instances:
        # ``bulk_create`` avoids the ``Cycle.save`` smallest-sort-order
        # auto-assignment hook (D-10).
        Cycle.objects.bulk_create(cycle_instances)

    saved_cycles = list(
        Cycle.objects.filter(
            project=project,
            name__in=[cycle.name for cycle in cycle_instances],
        )
    )
    name_to_cycle = {cycle.name: cycle for cycle in saved_cycles}
    cycle_by_key = {}
    for entry in cycle_payloads:
        cycle_by_key[entry["cycle_key"]] = name_to_cycle[entry["name"]]
    return cycle_by_key


def _create_template_starter_issues(
    *,
    project,
    workspace,
    payload,
    actor,
    state_by_key,
    label_by_key,
    module_by_key,
    cycle_by_key,
):
    """Create starter ``Issue`` rows with explicit state and bulk-create
    join rows.

    Issues are created one-by-one (rather than via ``bulk_create``) so the
    model ``save`` hook — which takes a per-project advisory lock,
    increments ``IssueSequence``, and updates the description stripping —
    runs for each row. Explicit ``state`` is passed to bypass
    ``_ensure_default_state`` (D-11). D-17 leaves assignees/subscribers
    empty.
    """
    issue_payloads = payload.get("starter_issues", []) or []
    issues = []
    issue_label_rows = []
    module_issue_rows = []
    cycle_issue_rows = []

    for entry in issue_payloads:
        # D-11: explicit state reference, not the default-state fallback.
        state = state_by_key.get(entry.get("state_key"))
        if state is None:
            raise ProjectTemplateApplicationError(
                {
                    "starter_issues": (
                        f"Unknown state_key {entry.get('state_key')!r}"
                    )
                }
            )

        # Issue.save() runs the project advisory-lock + IssueSequence write
        # path and ultimately invokes BaseModel.save(), which re-derives
        # ``created_by`` from the request-user thread-local context (and
        # resets it to None when no context is bound — e.g. in service
        # helpers invoked outside a view). Setting
        # ``created_by``/``updated_by`` on the instance before ``save``
        # AND passing ``disable_auto_set_user=True`` short-circuits that
        # auto-derivation so D-16 (creator = request.user) is honored
        # even when ``get_current_user()`` is unavailable. The kwargs
        # propagate through Issue.save() -> ProjectBaseModel.save() ->
        # BaseModel.save() because the latter is the canonical consumer
        # of ``disable_auto_set_user``.
        issue = Issue(
            project=project,
            workspace_id=workspace.id,
            state=state,
            name=entry["name"],
            priority=entry.get("priority") or "none",
            created_by=actor,
            updated_by=actor,
        )
        issue.save(disable_auto_set_user=True)
        issues.append(issue)

        # Resolve label_keys → IssueLabel rows (D-12).
        for label_key in entry.get("label_keys", []) or []:
            label = label_by_key.get(label_key)
            if label is None:
                raise ProjectTemplateApplicationError(
                    {
                        "starter_issues": (
                            f"Unknown label_key {label_key!r}"
                        )
                    }
                )
            issue_label_rows.append(
                IssueLabel(
                    issue=issue,
                    label=label,
                    project=project,
                    workspace_id=workspace.id,
                    created_by=actor,
                    updated_by=actor,
                )
            )

        # Resolve module_key → ModuleIssue row (D-12).
        module_key = entry.get("module_key")
        if module_key is not None:
            module = module_by_key.get(module_key)
            if module is None:
                raise ProjectTemplateApplicationError(
                    {
                        "starter_issues": (
                            f"Unknown module_key {module_key!r}"
                        )
                    }
                )
            module_issue_rows.append(
                ModuleIssue(
                    issue=issue,
                    module=module,
                    project=project,
                    workspace_id=workspace.id,
                    created_by=actor,
                    updated_by=actor,
                )
            )

        # Resolve cycle_key → CycleIssue row (D-12).
        cycle_key = entry.get("cycle_key")
        if cycle_key is not None:
            cycle = cycle_by_key.get(cycle_key)
            if cycle is None:
                raise ProjectTemplateApplicationError(
                    {
                        "starter_issues": (
                            f"Unknown cycle_key {cycle_key!r}"
                        )
                    }
                )
            cycle_issue_rows.append(
                CycleIssue(
                    issue=issue,
                    cycle=cycle,
                    project=project,
                    workspace_id=workspace.id,
                    created_by=actor,
                    updated_by=actor,
                )
            )

    if issue_label_rows:
        IssueLabel.objects.bulk_create(issue_label_rows)
    if module_issue_rows:
        ModuleIssue.objects.bulk_create(module_issue_rows)
    if cycle_issue_rows:
        CycleIssue.objects.bulk_create(cycle_issue_rows)

    return issues