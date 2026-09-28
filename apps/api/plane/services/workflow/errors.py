# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Structured workflow errors — spec §6, §10, §17.4, §26.

Every public workflow service raises a subclass of ``WorkflowError``.
Callers (views, serializers, runtime endpoints) translate the error to
an HTTP response with the matching ``code`` field — the
``status_code`` defaults map to standard REST semantics (400 for
invalid input, 403 for authorization, 404 for missing workflow, 409 for
state/transition conflicts, 422 for precondition failures, 500 for
configuration bugs).

The codes mirror §10, §9, §11.4, §12.8 and §24 verbatim where possible.
"""

# Python imports
from dataclasses import dataclass
from typing import Optional


# ---------------------------------------------------------------------------
# Structured error codes — keep in sync with §10, §9, §11.4, §12.8, §24.
# ---------------------------------------------------------------------------

WORKFLOW_DISABLED = "WORKFLOW_DISABLED"
WORKFLOW_NO_EFFECTIVE = "WORKFLOW_NO_EFFECTIVE_WORKFLOW"
WORKFLOW_NO_CREATION_STATE = "WORKFLOW_NO_CREATION_STATE"
WORKFLOW_STATE_NOT_INCLUDED = "WORKFLOW_STATE_NOT_INCLUDED"
WORKFLOW_TRANSITION_NOT_ALLOWED = "WORKFLOW_TRANSITION_NOT_ALLOWED"
WORKFLOW_APPROVAL_BLOCKS_TRANSITION = "WORKFLOW_APPROVAL_BLOCKS_TRANSITION"
WORKFLOW_ACTOR_NOT_AUTHORIZED = "WORKFLOW_ACTOR_NOT_AUTHORIZED"
WORKFLOW_APPROVER_NOT_RESOLVED = "WORKFLOW_APPROVER_NOT_RESOLVED"
WORKFLOW_APPROVAL_ALREADY_RESOLVED = "WORKFLOW_APPROVAL_ALREADY_RESOLVED"
WORKFLOW_PRECONDITION_FAILED = "WORKFLOW_PRECONDITION_FAILED"
WORKFLOW_BYPASS_REASON_REQUIRED = "WORKFLOW_BYPASS_REASON_REQUIRED"
WORKFLOW_REVISION_NOT_DRAFT = "WORKFLOW_REVISION_NOT_DRAFT"
WORKFLOW_REVISION_PUBLISH_INVALID = "WORKFLOW_REVISION_PUBLISH_INVALID"
WORKFLOW_FLOW_VALIDATION = "WORKFLOW_FLOW_VALIDATION"
WORKFLOW_NOT_FOUND = "WORKFLOW_NOT_FOUND"
WORKFLOW_DEFAULT_IMMUTABLE = "WORKFLOW_DEFAULT_IMMUTABLE"


# ---------------------------------------------------------------------------
# Error base
# ---------------------------------------------------------------------------


@dataclass
class WorkflowError(Exception):
    """Base class for every workflow service error.

    Attributes
    ----------
    code:
        Machine-readable error code (one of the ``WORKFLOW_*``
        constants above). Stable across versions — never rename in
        place.
    detail:
        Human-readable detail string safe to surface to API clients.
    status_code:
        Recommended HTTP status. Views should map this to a Response.
    extra:
        Optional structured payload (target state id, allowed flows,
        etc.) for clients that want to render actionable errors
        (§23.5). Must be JSON-serializable.
    """

    code: str
    detail: str
    status_code: int = 400
    extra: Optional[dict] = None

    def __str__(self) -> str:  # pragma: no cover - debug aid
        return f"[{self.code}] {self.detail}"

    def to_payload(self) -> dict:
        """Return the API payload (§17.3, §23.5) for this error."""
        body = {"code": self.code, "detail": self.detail}
        if self.extra:
            body.update(self.extra)
        return body


# ---------------------------------------------------------------------------
# Concrete subclasses
# ---------------------------------------------------------------------------


class WorkflowDisabled(WorkflowError):
    """Workflows are disabled at instance or project level."""

    def __init__(self, detail: str = "Workflows are disabled for this project."):
        super().__init__(
            code=WORKFLOW_DISABLED,
            detail=detail,
            status_code=400,
        )


class WorkflowNoEffectiveWorkflow(WorkflowError):
    """Resolver could not find a published workflow for the issue."""

    def __init__(self, detail: str = "No published workflow governs this work item."):
        super().__init__(
            code=WORKFLOW_NO_EFFECTIVE,
            detail=detail,
            status_code=409,
        )


class WorkflowNoCreationState(WorkflowError):
    """§9 — no state allows new work items."""

    def __init__(self, detail: str = "This workflow has no state that allows new work items."):
        super().__init__(
            code=WORKFLOW_NO_CREATION_STATE,
            detail=detail,
            status_code=422,
        )


class WorkflowStateNotIncluded(WorkflowError):
    """The requested state is not part of the bound workflow revision."""

    def __init__(self, state_id: str, detail: Optional[str] = None):
        super().__init__(
            code=WORKFLOW_STATE_NOT_INCLUDED,
            detail=detail
            or f"State {state_id} is not included in the bound workflow revision.",
            status_code=422,
            extra={"state_id": str(state_id)},
        )


class WorkflowTransitionNotAllowed(WorkflowError):
    """§10 — no flow from the current state to the target."""

    def __init__(
        self,
        source_state_id: str,
        target_state_id: str,
        allowed_target_ids: Optional[list] = None,
    ):
        super().__init__(
            code=WORKFLOW_TRANSITION_NOT_ALLOWED,
            detail=(
                f"No workflow transition is configured from {source_state_id} "
                f"to {target_state_id}."
            ),
            status_code=422,
            extra={
                "source_state_id": str(source_state_id),
                "target_state_id": str(target_state_id),
                "allowed_target_ids": [str(s) for s in (allowed_target_ids or [])],
            },
        )


class WorkflowApprovalBlocksTransition(WorkflowError):
    """§10.2 — approval is pending; ordinary transitions are blocked."""

    def __init__(self, source_state_id: str, approval_id: Optional[str] = None):
        super().__init__(
            code=WORKFLOW_APPROVAL_BLOCKS_TRANSITION,
            detail=(
                "A pending approval blocks ordinary transitions from this state. "
                "Resolve the approval before transitioning."
            ),
            status_code=409,
            extra={
                "source_state_id": str(source_state_id),
                "approval_id": str(approval_id) if approval_id else None,
            },
        )


class WorkflowActorNotAuthorized(WorkflowError):
    """§18.2 — base ACL or flow actor rule rejected the actor."""

    def __init__(self, detail: str = "You are not authorized to perform this workflow action."):
        super().__init__(
            code=WORKFLOW_ACTOR_NOT_AUTHORIZED,
            detail=detail,
            status_code=403,
        )


class WorkflowApproverNotResolved(WorkflowError):
    """§12.8 — required resolver returned zero approvers."""

    def __init__(self, detail: str = "No eligible approvers could be resolved for this flow."):
        super().__init__(
            code=WORKFLOW_APPROVER_NOT_RESOLVED,
            detail=detail,
            status_code=422,
        )


class WorkflowApprovalAlreadyResolved(WorkflowError):
    """§11.4 — second concurrent decision lost the race."""

    def __init__(self, approval_id: str):
        super().__init__(
            code=WORKFLOW_APPROVAL_ALREADY_RESOLVED,
            detail="This approval has already been resolved.",
            status_code=409,
            extra={"approval_id": str(approval_id)},
        )


class WorkflowPreconditionFailed(WorkflowError):
    """§26.1 — a workflow precondition rejected the action."""

    def __init__(self, detail: str = "Workflow preconditions were not satisfied."):
        super().__init__(
            code=WORKFLOW_PRECONDITION_FAILED,
            detail=detail,
            status_code=422,
        )


class WorkflowBypassReasonRequired(WorkflowError):
    """§19 — system_bypass=True must carry a bypass_reason."""

    def __init__(self, detail: str = "system_bypass requires a non-empty bypass_reason."):
        super().__init__(
            code=WORKFLOW_BYPASS_REASON_REQUIRED,
            detail=detail,
            status_code=400,
        )


class WorkflowRevisionNotDraft(WorkflowError):
    """§17.2, §28.11 — only draft revisions are mutable."""

    def __init__(self, detail: str = "Only draft workflow revisions can be edited."):
        super().__init__(
            code=WORKFLOW_REVISION_NOT_DRAFT,
            detail=detail,
            status_code=409,
        )


class WorkflowRevisionPublishInvalid(WorkflowError):
    """§24 — publish-time validation failed."""

    def __init__(self, detail: str, issues: Optional[list] = None):
        super().__init__(
            code=WORKFLOW_REVISION_PUBLISH_INVALID,
            detail=detail,
            status_code=422,
            extra={"issues": issues or []},
        )


class WorkflowFlowValidation(WorkflowError):
    """§7.5 — flow violates the per-source-state invariants."""

    def __init__(self, detail: str, issues: Optional[list] = None):
        super().__init__(
            code=WORKFLOW_FLOW_VALIDATION,
            detail=detail,
            status_code=422,
            extra={"issues": issues or []},
        )


class WorkflowNotFound(WorkflowError):
    """Workflow / revision / state / flow / actor lookup miss."""

    def __init__(self, detail: str = "Workflow resource not found."):
        super().__init__(
            code=WORKFLOW_NOT_FOUND,
            detail=detail,
            status_code=404,
        )


class WorkflowDefaultImmutable(WorkflowError):
    """§7.1 — the default workflow cannot be deleted."""

    def __init__(self, detail: str = "The default workflow cannot be deleted."):
        super().__init__(
            code=WORKFLOW_DEFAULT_IMMUTABLE,
            detail=detail,
            status_code=409,
        )
