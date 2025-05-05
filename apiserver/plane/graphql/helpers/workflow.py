# Third Party Imports
from asgiref.sync import sync_to_async
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.graphql.utils.feature_flag import _validate_feature_flag
from plane.ee.models import ProjectFeature
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum
from plane.graphql.utils.workflow import WorkflowStateManager


@sync_to_async
def is_workflow_feature_flagged(user_id: str, workspace_slug: str):
    return _validate_feature_flag(
        user_id=user_id,
        workspace_slug=workspace_slug,
        feature_key=FeatureFlagsTypesEnum.WORKFLOWS.value,
        default_value=False,
    )


@sync_to_async
def is_project_workflow_enabled(workspace_slug: str, project_id: str):
    """
    Check if the workflow is enabled for the project
    """

    project_feature = ProjectFeature.objects.filter(
        workspace__slug=workspace_slug, project_id=project_id
    ).first()

    if not project_feature:
        return False

    return project_feature.is_workflow_enabled or False


@sync_to_async
def is_workflow_create_allowed(
    workspace_slug: str, project_id: str, user_id: str, state_id: str
):
    """
    Check if the workflow epic create is allowed for the project
    """
    workflow_manager = WorkflowStateManager(
        slug=workspace_slug, project_id=project_id, user_id=user_id
    )
    is_issue_creation_allowed = workflow_manager._validate_issue_creation(
        state_id=state_id
    )

    if is_issue_creation_allowed is False:
        message = "You cannot create an epic in this state"
        error_extensions = {"code": "FORBIDDEN", "statusCode": 403}
        raise GraphQLError(message, extensions=error_extensions)

    return is_issue_creation_allowed


@sync_to_async
def is_workflow_update_allowed(
    workspace_slug: str,
    project_id: str,
    user_id: str,
    current_state_id: str,
    new_state_id: str,
):
    """
    Check if the workflow epic update is allowed for the project
    """
    workflow_state_manager = WorkflowStateManager(
        slug=workspace_slug, project_id=project_id, user_id=user_id
    )
    can_state_update = workflow_state_manager._validate_state_transition(
        current_state_id=current_state_id, new_state_id=new_state_id
    )

    if can_state_update is False:
        message = "You cannot update an epic in this state"
        error_extensions = {"code": "FORBIDDEN", "statusCode": 403}
        raise GraphQLError(message, extensions=error_extensions)

    return can_state_update
