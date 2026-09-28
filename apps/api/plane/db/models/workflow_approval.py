# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Approval models — spec §7.8–§7.10.

This module layers the approval runtime on top of the workflow core
shipped in :mod:`plane.db.models.workflow`. Three tables participate:

- ``WorkflowApproval`` — one pending approval per Work Item (§7.8).
- ``WorkflowApprovalApprover`` — snapshotted eligible approvers (§7.9).
- ``WorkflowApprovalDecision`` — audit row per decision (§7.10).

The lifecycle, concurrency protection, and idempotency policy live in
the service layer (``plane.services.workflow.approvals``); the schema
here is intentionally minimal — soft-delete + UUID + base-model
conventions — and uses the §27 runtime-lookup indexes.

Decisions are pinned to a specific ``WorkflowApprovalApprover`` row
through ``WorkflowApprovalDecision.actor`` (§7.10). The decision's
``idempotency_key`` column is unique per approval so §11.5 retries
collapse into the original outcome rather than producing duplicate
audit rows.
"""

# Django imports
from django.conf import settings
from django.db import models
from django.db.models import Q

# Module imports
from .project import ProjectBaseModel
from .workflow import WorkflowFlowActorType


# ---------------------------------------------------------------------------
# Enum-like choice sets
# ---------------------------------------------------------------------------


class WorkflowApprovalStatus(models.TextChoices):
    """§7.8 — the lifecycle states a ``WorkflowApproval`` can be in.

    V1 only ever produces ``pending``, ``approved`` and ``rejected``;
    ``cancelled`` exists so the row can be soft-closed when its issue
    becomes ungoverned (workflows disabled, revision retired, etc.)
    without losing the audit trail.
    """

    PENDING = "pending", "Pending"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"
    CANCELLED = "cancelled", "Cancelled"


class WorkflowApprovalDecisionType(models.TextChoices):
    """§7.10 — the kind of decision a row records.

    The current policy is ``ANY`` (§7.10): the first committed valid
    decision wins. The schema keeps the enum closed to the two values
    that are wired in V1 — adding a ``DELEGATED`` or ``COMMENT_ONLY``
    value is a follow-up that needs a service-layer companion.
    """

    APPROVE = "approve", "Approve"
    REJECT = "reject", "Reject"


# ---------------------------------------------------------------------------
# §7.8 WorkflowApproval
# ---------------------------------------------------------------------------


class WorkflowApproval(ProjectBaseModel):
    """A runtime approval gate tied to a specific workflow revision.

    Constraints (§7.8 prose):

    - at most one **pending** approval per Work Item at a time;
    - the ``flow`` must belong to the bound revision;
    - the ``source_state`` must equal the Work Item's current state
      when the approval was opened.

    All three invariants are enforced in the service layer because the
    schema cannot reason about "currently pending" without the
    ``status`` column. The partial-unique index below covers the most
    load-bearing invariant (no two pending approvals per issue) at the
    database level so a concurrent opening transaction cannot
    double-insert.
    """

    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.CASCADE,
        related_name="workflow_approvals",
    )
    binding = models.ForeignKey(
        "db.IssueWorkflowBinding",
        on_delete=models.CASCADE,
        related_name="approvals",
    )
    flow = models.ForeignKey(
        "db.WorkflowFlow",
        on_delete=models.CASCADE,
        related_name="approvals",
    )
    source_state = models.ForeignKey(
        "db.State",
        on_delete=models.CASCADE,
        related_name="approval_source_states",
    )
    status = models.CharField(
        max_length=16,
        choices=WorkflowApprovalStatus.choices,
        default=WorkflowApprovalStatus.PENDING,
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="workflow_approvals_requested",
        null=True,
        blank=True,
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="workflow_approvals_resolved",
        null=True,
        blank=True,
    )
    resolution_comment = models.TextField(blank=True)

    class Meta:
        verbose_name = "Workflow Approval"
        verbose_name_plural = "Workflow Approvals"
        db_table = "workflow_approvals"
        ordering = ("-created_at",)
        indexes = [
            # §27 runtime lookup — "is there a pending approval for this
            # issue?"; covers the transition path's §10.2 guard.
            models.Index(
                fields=["issue", "status"],
                name="wf_approvals_issue_status_idx",
            ),
            # §27 — the binding lookup is exercised every time a
            # decision is taken (so we can re-load the approver
            # snapshot through the binding). Keep it cheap.
            models.Index(
                fields=["binding"],
                name="wf_approvals_binding_idx",
            ),
        ]
        constraints = [
            # At most one *pending* approval per Work Item. Non-pending
            # rows are not subject to this constraint — historical
            # approvals from prior workflow runs accumulate freely.
            models.UniqueConstraint(
                fields=["issue"],
                condition=Q(
                    deleted_at__isnull=True,
                    status=WorkflowApprovalStatus.PENDING,
                ),
                name="workflow_approvals_unique_pending_per_issue",
            ),
        ]

    def __str__(self) -> str:  # pragma: no cover - debug aid
        return f"approval<{self.status}> issue={self.issue_id} flow={self.flow_id}"


# ---------------------------------------------------------------------------
# §7.9 WorkflowApprovalApprover
# ---------------------------------------------------------------------------


class WorkflowApprovalApprover(ProjectBaseModel):
    """Snapshot of an eligible approver for a single approval.

    The snapshot is captured when the approval opens (§11.1); later
    membership or org-chart changes do NOT mutate this row (§7.9
    invariant). ``source_metadata`` is opaque JSON — the resolver that
    filled this row records enough structured context (manager id,
    snapshot timestamp, source entity) for an admin to trace why a
    particular user is on the approver list.
    """

    approval = models.ForeignKey(
        "db.WorkflowApproval",
        on_delete=models.CASCADE,
        related_name="approvers",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workflow_approval_snapshots",
    )
    source_type = models.CharField(
        max_length=64,
        choices=WorkflowFlowActorType.choices,
    )
    source_metadata = models.JSONField(default=dict, blank=True)
    delegated_from = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        related_name="delegations",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Workflow Approval Approver"
        verbose_name_plural = "Workflow Approval Approvers"
        db_table = "workflow_approval_approvers"
        ordering = ("created_at",)
        indexes = [
            # §27 runtime lookup — "is this user on the approver
            # snapshot?" is the hot path in the decide endpoints.
            models.Index(
                fields=["approval", "user"],
                name="wf_appr_appr_user_idx",
            ),
        ]
        constraints = [
            # A given user appears at most once per approval through
            # the snapshot table; delegation chains use a separate
            # ``delegated_from`` link so they do not collide.
            models.UniqueConstraint(
                fields=["approval", "user"],
                condition=Q(deleted_at__isnull=True),
                name="workflow_approval_approvers_unique_approval_user",
            ),
        ]

    def __str__(self) -> str:  # pragma: no cover - debug aid
        return f"approver<{self.source_type}> user={self.user_id} approval={self.approval_id}"


# ---------------------------------------------------------------------------
# §7.10 WorkflowApprovalDecision
# ---------------------------------------------------------------------------


class WorkflowApprovalDecision(ProjectBaseModel):
    """Audit row for one approval decision (§7.10, §20, §29.4).

    A unique partial constraint on ``(approval, idempotency_key)`` —
    restricted to non-null keys — implements the §11.5 replay rule at
    the database level: a duplicate POST with the same key collapses
    into the existing row rather than producing a second audit entry.

    ``actor`` is a snapshot of the user that took the decision (NOT a
    foreign key to ``WorkflowApprovalApprover``) so the audit row is
    stable even if the approver snapshot row is later soft-deleted.
    """

    approval = models.ForeignKey(
        "db.WorkflowApproval",
        on_delete=models.CASCADE,
        related_name="decisions",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="workflow_approval_decisions",
        null=True,
        blank=True,
    )
    decision = models.CharField(
        max_length=16,
        choices=WorkflowApprovalDecisionType.choices,
    )
    comment = models.TextField(blank=True)
    idempotency_key = models.CharField(
        max_length=128,
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Workflow Approval Decision"
        verbose_name_plural = "Workflow Approval Decisions"
        db_table = "workflow_approval_decisions"
        ordering = ("-created_at",)
        indexes = [
            # §29.4 audit lookups by approval id are common.
            models.Index(
                fields=["approval"],
                name="wf_appr_dec_approval_idx",
            ),
        ]
        constraints = [
            # §11.5 — same idempotency_key for the same approval
            # collapses into the original audit row.
            models.UniqueConstraint(
                fields=["approval", "idempotency_key"],
                condition=Q(idempotency_key__isnull=False),
                name="workflow_approval_decisions_unique_idempotency",
            ),
        ]

    def __str__(self) -> str:  # pragma: no cover - debug aid
        return f"decision<{self.decision}> approval={self.approval_id} actor={self.actor_id}"