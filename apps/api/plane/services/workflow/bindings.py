# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workflow binding service — spec §7.7, §25 Phase 3.

A running Work Item is pinned to a specific ``WorkflowRevision`` via
``IssueWorkflowBinding`` (§7.7, §28.12 invariant). Bindings are
immutable after creation in V1; republishing a workflow does not
silently change the process for already-running items.

The service exposes two operations:

- ``bind_on_creation`` — called from the issue creation path (§9.2)
  to attach a new issue to the current published revision.
- ``ensure_binding`` — called from the transition path (§25 Phase 3)
  to lazy-bind legacy Work Items that existed before workflow support
  was enabled. The first workflow-aware state action is what triggers
  this.

Both helpers short-circuit cleanly when enforcement is disabled
(``workflows_active(...) is False``) so the call sites in
``IssueCreateSerializer`` / ``TransitionService`` don't need their
own guard.
"""

# Python imports
from typing import Optional

# Django imports
from django.db import IntegrityError, transaction
from django.utils import timezone

# Module imports
from plane.db.models import Issue, IssueWorkflowBinding

from .errors import WorkflowError
from .flags import workflows_active
from .resolver import EffectiveWorkflow, WorkflowResolver


def bind_on_creation(
    *,
    issue: Issue,
    actor_id: Optional[str],
) -> Optional[IssueWorkflowBinding]:
    """Bind a freshly-created issue to the current published revision.

    Returns the new binding, or ``None`` when enforcement is off and
    no binding is needed. When enforcement is on but no effective
    workflow exists, the issue is left unbound and the caller is
    expected to handle the no-workflow case (creation rules in §9
    require a creation-eligible state, so reaching this code path
    with no workflow is a configuration bug — we do not raise here to
    keep the boundary small).
    """
    if not workflows_active(project=issue.project):
        return None

    existing = IssueWorkflowBinding.objects.filter(issue_id=issue.id).first()
    if existing is not None:
        return existing

    effective = WorkflowResolver.resolve(issue)
    if effective is None:
        return None

    return _create_binding(
        issue=issue,
        effective=effective,
        actor_id=actor_id,
    )


def ensure_binding(
    *,
    issue: Issue,
    actor_id: Optional[str],
) -> Optional[IssueWorkflowBinding]:
    """Lazy-bind a legacy issue on first workflow-aware action (§25 Phase 3).

    No-op if the issue already has a binding or enforcement is off.
    """
    if not workflows_active(project=issue.project):
        return None

    existing = IssueWorkflowBinding.objects.filter(issue_id=issue.id).first()
    if existing is not None:
        return existing

    effective = WorkflowResolver.resolve(issue)
    if effective is None:
        return None

    return _create_binding(
        issue=issue,
        effective=effective,
        actor_id=actor_id,
    )


def get_binding(issue_id) -> Optional[IssueWorkflowBinding]:
    """Return the current binding for an issue, or ``None``."""
    return (
        IssueWorkflowBinding.objects.filter(issue_id=issue_id)
        .select_related("workflow", "workflow_revision")
        .first()
    )


# ---------------------------------------------------------------------------
# Internals
# ---------------------------------------------------------------------------


@transaction.atomic
def _create_binding(
    *,
    issue: Issue,
    effective: EffectiveWorkflow,
    actor_id: Optional[str],
) -> IssueWorkflowBinding:
    """Create an ``IssueWorkflowBinding`` inside a transaction.

    The schema enforces a ``OneToOneField(issue)`` so a concurrent
    bind is rejected by the database; we map the ``IntegrityError``
    to a clean read of the existing row.

    ``IssueWorkflowBinding`` is a ``ProjectBaseModel`` so we must
    populate ``project`` (and the derived ``workspace`` via the
    ``ProjectBaseModel.save`` hook) before insert. The
    ``Project.project`` is sourced from ``issue.project``.
    """
    try:
        return IssueWorkflowBinding.objects.create(
            issue=issue,
            project=issue.project,
            workflow=effective.workflow,
            workflow_revision=effective.revision,
            bound_at=timezone.now(),
            bound_by_id=actor_id,
        )
    except IntegrityError:
        # A concurrent bind won the race; return that row.
        existing = IssueWorkflowBinding.objects.filter(issue_id=issue.id).first()
        if existing is None:  # pragma: no cover - defensive
            raise WorkflowError(
                "Failed to create workflow binding and could not recover existing row.",
            )
        return existing
