# Third Party Imports
from asgiref.sync import sync_to_async
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.db.models import State


@sync_to_async
def get_project_default_state(workspace_slug: str, project_id: str):
    """
    Get the default state for the given project
    """
    try:
        return State.objects.get(
            workspace__slug=workspace_slug, project_id=project_id, default=True
        )
    except State.DoesNotExist:
        message = "Default state not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def get_project_states(workspace_slug: str, project_id: str):
    """
    Get all states for the given project
    """
    project_states = State.objects.filter(
        workspace__slug=workspace_slug, project_id=project_id
    )

    return list(project_states)


@sync_to_async
def get_state(workspace_slug: str, project_id: str, state_id: str):
    """
    Get the state for the given project and state id
    """
    return State.objects.get(
        workspace__slug=workspace_slug, project_id=project_id, id=state_id
    )
