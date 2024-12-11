# Python imports
import uuid

# Module imports
from plane.ee.models import WorkflowTransition, WorkflowTransitionActor, ProjectFeature
from plane.db.models import Issue
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag


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

    def _can_user_transition(
        self, current_state_id: int, transition_state_id: int, user_id: int
    ) -> bool:
        """Check if a user has permission to transition to the target state."""

        # Check if there are any actors defined for this transition
        workflow_actors = list(
            WorkflowTransitionActor.objects.filter(
                workflow_transition__workflow__state_id=current_state_id,
                workflow_transition__transition_state_id=transition_state_id,
            ).values_list("actor_id", flat=True)
        )

        # Get actors
        if not workflow_actors:
            return False

        if user_id not in workflow_actors:
            return False

        # Check if the user is an allowed actor
        return True

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

        if not allowed_states:
            return True  # If no transitions are defined, allow all transitions

        if new_state_id not in allowed_states:
            return False

        # Check user permission
        if not self._can_user_transition(
            current_state_id=issue.state_id,
            transition_state_id=new_state_id,
            user_id=user_id,
        ):
            return False

        # Transition is allowed
        return True
