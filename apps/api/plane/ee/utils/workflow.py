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

# Python imports
import logging
import uuid

# Django imports
from django.db import transaction

# Module imports
from plane.db.models import Issue, State
from plane.ee.bgtasks.workflow_post_actions_task import run_workflow_post_actions
from plane.ee.models import (
    Workflow,
    WorkflowApprovalType,
    WorkflowState,
    ProjectFeature,
    WorkflowStateType,
    WorkflowTransition,
    WorkflowWorkItemType,
    WorkflowTransitionApprover,
)
from plane.ee.services import WorkflowTransitionExecutor
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag

logger = logging.getLogger(__name__)


class WorkflowStateManager:
    def __init__(self, project_id: str, slug: str):
        self.project_id = project_id
        self.slug = slug

    def _get_allowed_transitions(self, workflow_id: str, workflow_state_id: str) -> list[int]:
        """Get all allowed transition state IDs for a workflow."""
        return list(
            WorkflowTransition.objects.filter(
                workflow_state__workflow_id=workflow_id, workflow_state_id=workflow_state_id, project_id=self.project_id
            ).values_list("transition_state_id", flat=True)
        )

    def _get_allowed_approvers(
        self,
        workflow_id: str,
        workflow_state_id: str,
        transition_state_id: int,
    ) -> list[int]:
        """Get all allowed approvers for the transition state of a workflow."""
        return list(
            WorkflowTransitionApprover.objects.filter(
                workflow_state_id=workflow_state_id,
                workflow_state__workflow_id=workflow_id,
                workflow_transition__transition_state_id=transition_state_id,
                project_id=self.project_id,
                workspace__slug=self.slug,
            ).values_list("approver_id", flat=True)
        )

    def _get_workflow(self, type_id: int) -> Workflow:
        """Get the workflow for the given issue based on its type, falling back to the default workflow."""
        # Build the filter for the work item type
        if type_id:
            workflow_work_item_type = WorkflowWorkItemType.objects.filter(
                workspace__slug=self.slug, project_id=self.project_id, work_item_type_id=type_id
            ).first()
            if workflow_work_item_type:
                return Workflow.objects.filter(
                    id=workflow_work_item_type.workflow_id,
                    project_id=self.project_id,
                    workspace__slug=self.slug,
                ).first()

        # Fallback to the default workflow
        return Workflow.objects.filter(
            project_id=self.project_id,
            workspace__slug=self.slug,
            is_default=True,
        ).first()

    def run_transition_hooks(
        self,
        issue: Issue,
        new_state_id,
        workflow_state_id: str,
        workflow_type: WorkflowStateType,
        approval_type: WorkflowApprovalType = None,
    ) -> bool:
        """
        Run pre-validation hooks synchronously and schedule post-action hooks.

        Returns False if a pre-validation hook blocks the transition.
        Fails open (returns True) on any unexpected error so a runner outage
        never blocks a state change.

        Callers MUST be inside @transaction.atomic — on_commit fires after
        the outermost transaction commits, ensuring post-hooks run only after
        serializer.save() has succeeded.
        """
        try:
            executor = WorkflowTransitionExecutor()
            transition = executor.get_transition(
                project_id=self.project_id,
                to_state_id=new_state_id,
                workflow_state_id=workflow_state_id,
                workflow_type=workflow_type,
                approval_type=approval_type,
            )
            if not transition:
                return True

            # PRE: nested atomic so any DB error inside the hook rolls back
            # the savepoint cleanly without poisoning the outer transaction.
            try:
                with transaction.atomic():
                    result = executor.run_pre_validation(issue, transition)
            except Exception as exc:
                logger.exception(
                    "Pre-validation hook error — failing open | issue_id=%s error=%s",
                    issue.id,
                    exc,
                )
                return True

            if not result.allowed:
                return False

            # POST: schedule to run after the outer transaction commits.
            _issue_id = str(issue.id)
            _transition_id = str(transition.id)
            _project_id = str(self.project_id)
            transaction.on_commit(
                lambda: run_workflow_post_actions.delay(
                    issue_id=_issue_id,
                    transition_id=_transition_id,
                    project_id=_project_id,
                )
            )
            return True

        except Exception as exc:
            logger.exception(
                "Workflow hook error — allowing transition | issue_id=%s error=%s",
                issue.id,
                exc,
            )
            return True

    def validate_state_transition(self, issue: Issue, new_state_id: int, user_id: int, run_hooks: bool = True) -> bool:
        """
        Validate if a state transition is allowed for the given issue and user.

        Args:
            issue:       The issue being updated
            new_state_id: The target state ID
            user_id:     The ID of the user attempting the transition
            run_hooks:   Whether to run pre-validation hooks and schedule post-action
                         hooks via on_commit. Pass False for bulk operations, intake
                         issues (pending acceptance), and draft issues where hooks
                         should not fire. Callers that pass True MUST be wrapped in
                         @transaction.atomic so that on_commit fires after the save,
                         not immediately.

        Returns:
            bool: True if the transition is allowed, False otherwise
        """
        workflow = self._get_workflow(type_id=issue.type_id)

        if not workflow:
            return True

        if issue.state_id == new_state_id:
            return True

        # Convert to UUID
        new_state_id = uuid.UUID(new_state_id)

        # Check if the feature is available for the workspace
        if not check_workspace_feature_flag(slug=self.slug, feature_key=FeatureFlag.WORKFLOWS, user_id=user_id):
            return True

        # Check if the feature is enabled if not return true
        if not ProjectFeature.objects.filter(is_workflow_enabled=True, project_id=self.project_id).exists():
            return True

        # check if the workflow state is active or not
        if not workflow.is_active:
            return True

        # If the issue doesn't have a current state, any state is valid
        if not issue.state_id:
            return True

        # get the workflow state
        workflow_state = WorkflowState.objects.filter(state_id=issue.state_id, workflow_id=workflow.id).first()

        # if no workflow state is found, allow transition
        if not workflow_state:
            return True

        if workflow_state.type == WorkflowStateType.TRANSITION:
            # Get allowed transitions
            allowed_states = self._get_allowed_transitions(workflow_id=workflow.id, workflow_state_id=workflow_state.id)

            # If no transitions are defined, allow all transitions
            if not allowed_states:
                return True

            if new_state_id not in allowed_states:
                return False

            # Get approvers for the transition
            allowed_approvers = self._get_allowed_approvers(
                transition_state_id=new_state_id,
                workflow_id=workflow.id,
                workflow_state_id=workflow_state.id,
            )

            if allowed_approvers and user_id not in allowed_approvers:
                return False

            if (
                check_workspace_feature_flag(
                    slug=self.slug, feature_key=FeatureFlag.WORKFLOW_CONDITIONS, user_id=user_id
                )
                and run_hooks
            ):
                return self.run_transition_hooks(
                    issue,
                    new_state_id,
                    workflow_state_id=workflow_state.id,
                    workflow_type=WorkflowStateType.TRANSITION,
                    approval_type=None,
                )

            return True

        else:
            # check if the multiple workflows feature flag is enabled
            if not check_workspace_feature_flag(
                slug=self.slug, feature_key=FeatureFlag.MULTIPLE_WORKFLOWS, user_id=user_id
            ):
                return True

            # approval state is not allowed
            return False

    def validate_issue_creation(self, state_id: int, user_id: str, type_id: int) -> bool:
        """
        False if the creation is allowed, True otherwise
        """

        if not state_id:
            # get the default state for the project
            state_id = State.objects.get(project_id=self.project_id, default=True).id

        # Check if the feature is available for the workspace
        if not check_workspace_feature_flag(slug=self.slug, feature_key=FeatureFlag.WORKFLOWS, user_id=user_id):
            return False

        # Check if the feature is enabled
        if not ProjectFeature.objects.filter(is_workflow_enabled=True, project_id=self.project_id).exists():
            return False

        # get the workflow attached with work item type
        workflow = self._get_workflow(type_id=type_id)

        if not workflow or not workflow.is_active:
            return False

        # check if the issue creation is allowed
        workflow_state = WorkflowState.objects.filter(
            state_id=state_id, project_id=self.project_id, workflow_id=workflow.id
        ).first()

        if workflow_state and not workflow_state.allow_issue_creation:
            return True

        return False
