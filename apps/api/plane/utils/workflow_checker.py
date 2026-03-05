# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Utility functions for enforcing workflow transition and creation rules."""

from plane.db.models import ProjectWorkflow, WorkflowStateConfig, WorkflowTransition, WorkflowTransitionApprover


def check_workflow_creation(project_id, state_id) -> tuple[bool, str]:
    """
    Check if a new issue can be created in the given state.

    Returns:
        (True, "") if allowed.
        (False, error_message) if blocked.
    """
    workflow = ProjectWorkflow.objects.filter(project_id=project_id, is_live=True).first()
    if not workflow:
        return True, ""

    config = WorkflowStateConfig.objects.filter(project_id=project_id, state_id=state_id).first()
    if config is None:
        # No config row means no restriction (defaults to allow)
        return True, ""

    if not config.allow_issue_creation:
        return False, "New work items cannot be created in this state due to workflow restrictions."

    return True, ""


def check_workflow_transition(project_id, from_state_id, to_state_id, user) -> tuple[bool, dict]:
    """
    Check if a user is permitted to transition an issue from from_state to to_state.

    Returns:
        (True, {}) if allowed.
        (False, error_detail) if blocked, where error_detail contains allowed_reviewers and state names.
    """
    workflow = ProjectWorkflow.objects.filter(project_id=project_id, is_live=True).first()
    if not workflow:
        return True, {}

    # Fetch the transition record
    transition = (
        WorkflowTransition.objects.filter(
            project_id=project_id,
            state_id=from_state_id,
            transition_state_id=to_state_id,
        )
        .prefetch_related("approvers__approver")
        .first()
    )

    if transition is None:
        # No permitted transition defined for this pair → block
        return False, {
            "from_state": str(from_state_id),
            "to_state": str(to_state_id),
            "allowed_reviewers": [],
        }

    # Fetch approvers for this transition
    approvers = list(
        WorkflowTransitionApprover.objects.filter(transition=transition).values_list("approver_id", flat=True)
    )

    if not approvers:
        # Transition exists, no approvers → anyone on the team can make this change
        return True, {}

    if user.id not in approvers:
        # User is not in the approver list → block
        return False, {
            "from_state": str(from_state_id),
            "to_state": str(to_state_id),
            "allowed_reviewers": [str(uid) for uid in approvers],
        }

    return True, {}
