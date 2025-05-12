# Python imports
import uuid

# Module imports
from plane.db.models import State
from plane.ee.models import (
    Workflow,
    ProjectFeature,
    WorkflowTransition,
    WorkflowTransitionApprover,
)


class WorkflowStateManager:
    def __init__(self, slug: str, project_id: str, user_id: str):
        self.project_id = project_id
        self.slug = slug
        self.user_id = user_id

    def is_project_feature_enabled(self) -> bool:
        """Check if the project feature is enabled."""

        return ProjectFeature.objects.filter(
            project_id=self.project_id, is_workflow_enabled=True
        ).exists()

    def _get_allowed_transitions(self, current_state_id: str) -> list[int]:
        """Get all allowed transition state IDs for a workflow."""

        return list(
            WorkflowTransition.objects.filter(
                workflow__state_id=current_state_id, project_id=self.project_id
            ).values_list("transition_state_id", flat=True)
        )

    def _get_allowed_approvers(
        self, current_state_id: str, transition_state_id: str
    ) -> list[int]:
        """Get all allowed approvers for the transition state of a workflow."""

        return list(
            WorkflowTransitionApprover.objects.filter(
                workflow__state_id=current_state_id,
                workflow_transition__transition_state_id=transition_state_id,
                project_id=self.project_id,
            ).values_list("approver_id", flat=True)
        )

    def _validate_state_transition(
        self, current_state_id: str, new_state_id: str
    ) -> bool:
        """
        Validate if a state transition is allowed for the given issue and user.

        Args:
            current_state_id: the current state ID of the updating issue
            new_state_id: The target state ID
            user_id: The ID of the user attempting the transition

        Returns:
            bool: True if the transition is allowed, False otherwise
        """

        if current_state_id == new_state_id:
            return True

        # Check if the feature is enabled
        is_project_feature_enabled = self.is_project_feature_enabled()
        if is_project_feature_enabled is False:
            return True

        # Convert to UUID
        new_state_id = uuid.UUID(new_state_id)

        # If the issue doesn't have a current state, any state is valid
        if not current_state_id:
            return True

        # Get allowed transitions
        allowed_states = self._get_allowed_transitions(
            current_state_id=current_state_id
        )

        # If no transitions are defined, allow all transitions
        if not allowed_states or len(allowed_states) == 0:
            return True

        if new_state_id not in allowed_states:
            return False

        # Get approvers for the transition
        allowed_approvers = self._get_allowed_approvers(
            current_state_id=current_state_id, transition_state_id=new_state_id
        )

        # If no approvers are defined, allow all users
        if not allowed_approvers or len(allowed_approvers) == 0:
            return True

        if self.user_id not in allowed_approvers:
            return False

        # Transition is allowed
        return True

    def _validate_issue_creation(self, state_id: str) -> bool:
        """
        False if the creation is allowed, True otherwise
        """

        # Check if the feature is enabled
        is_project_feature_enabled = self.is_project_feature_enabled()
        if is_project_feature_enabled is False:
            return True

        # get the default state for the project if the state is not passed in the query
        if not state_id:
            state_id = State.objects.get(project_id=self.project_id, default=True).id

        # check if the issue creation is allowed or not for the state
        is_issue_creation_allowed = Workflow.objects.filter(
            state_id=state_id, project_id=self.project_id, allow_issue_creation=True
        ).exists()

        return is_issue_creation_allowed
