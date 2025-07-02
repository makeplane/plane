# Python imports
import uuid

# Module imports
from plane.db.models import Issue, State
from plane.ee.models import (
    Workflow,
    ProjectFeature,
    WorkflowTransition,
    WorkflowTransitionApprover,
)
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag


class WorkflowStateManager:
    def __init__(self, project_id: str, slug: str):
        self.project_id = project_id
        self.slug = slug

    def _get_allowed_transitions(self, current_state_id: int) -> list[int]:
        """Get all allowed transition state IDs for a workflow."""
        return list(
            WorkflowTransition.objects.filter(
                workflow__state_id=current_state_id, project_id=self.project_id
            ).values_list("transition_state_id", flat=True)
        )

    def _get_allowed_approvers(
        self,
        current_state_id: int,
        transition_state_id: int,
    ) -> list[int]:
        """Get all allowed approvers for the transition state of a workflow."""
        return list(
            WorkflowTransitionApprover.objects.filter(
                workflow__state_id=current_state_id,
                workflow_transition__transition_state_id=transition_state_id,
                project_id=self.project_id,
            ).values_list("approver_id", flat=True)
        )

    def validate_state_transition(
        self, issue: Issue, new_state_id: int, user_id: int
    ) -> bool:
        """
        Validate if a state transition is allowed for the given issue and user.

        Args:
            issue: The issue being updated
            new_state_id: The target state ID
            user_id: The ID of the user attempting the transition

        Returns:
            bool: True if the transition is allowed, False otherwise
        """
        if issue.state_id == new_state_id:
            return True

        # Convert to UUID
        new_state_id = uuid.UUID(new_state_id)

        # Check if the feature is available for the workspace
        if not check_workspace_feature_flag(
            slug=self.slug, feature_key=FeatureFlag.WORKFLOWS, user_id=user_id
        ):
            return True

        # Check if the feature is enabled if not return true
        if not ProjectFeature.objects.filter(
            is_workflow_enabled=True, project_id=self.project_id
        ).exists():
            return True

        # If the issue doesn't have a current state, any state is valid
        if not issue.state_id:
            return True

        # Get allowed transitions
        allowed_states = self._get_allowed_transitions(current_state_id=issue.state_id)

        # If no transitions are defined, allow all transitions
        if not allowed_states:
            return True

        if new_state_id not in allowed_states:
            return False

        # Get approvers for the transition
        allowed_approvers = self._get_allowed_approvers(
            current_state_id=issue.state_id,
            transition_state_id=new_state_id,
        )

        # If no approvers are defined, allow all users
        if not allowed_approvers:
            return True

        if user_id not in allowed_approvers:
            return False

        # Transition is allowed
        return True

    def validate_issue_creation(self, state_id: int, user_id: str) -> bool:
        """
        False if the creation is allowed, True otherwise
        """

        if not state_id:
            # get the default state for the project
            state_id = State.objects.get(project_id=self.project_id, default=True).id

        # Check if the feature is available for the workspace
        if not check_workspace_feature_flag(
            slug=self.slug, feature_key=FeatureFlag.WORKFLOWS, user_id=user_id
        ):
            return False

        # Check if the feature is enabled
        if not ProjectFeature.objects.filter(
            is_workflow_enabled=True, project_id=self.project_id
        ).exists():
            return False

        # check if the issue creation is allowed
        if Workflow.objects.filter(
            state_id=state_id, project_id=self.project_id, allow_issue_creation=False
        ).exists():
            return True

        return False
