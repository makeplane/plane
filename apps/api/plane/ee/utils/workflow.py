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
import uuid

# Module imports
from plane.db.models import Issue, State
from plane.ee.models import (
    Workflow,
    WorkflowState,
    ProjectFeature,
    WorkflowStateType,
    WorkflowTransition,
    WorkflowWorkItemType,
    WorkflowTransitionApprover,
)
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag


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
                return Workflow.objects.get(
                    id=workflow_work_item_type.workflow_id,
                    project_id=self.project_id,
                    workspace__slug=self.slug,
                )

        # Fallback to the default workflow
        return Workflow.objects.get(
            project_id=self.project_id,
            workspace__slug=self.slug,
            is_default=True,
        )

    def validate_state_transition(self, issue: Issue, new_state_id: int, user_id: int) -> bool:
        """
        Validate if a state transition is allowed for the given issue and user.

        Args:
            issue: The issue being updated
            new_state_id: The target state ID
            user_id: The ID of the user attempting the transition

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

            # If no approvers are defined, allow all users
            if not allowed_approvers:
                return True

            if user_id not in allowed_approvers:
                return False

            # Transition is allowed
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

        if not workflow.is_active:
            return False

        # check if the issue creation is allowed
        workflow_state = WorkflowState.objects.filter(
            state_id=state_id, project_id=self.project_id, workflow_id=workflow.id
        ).first()

        if workflow_state and not workflow_state.allow_issue_creation:
            return True

        return False
