# Third Party Imports
from asgiref.sync import sync_to_async
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.db.models import Workspace


def _get_workspace(workspace_slug: str):
    """
    Get the workspace for the given workspace slug
    """
    try:
        return Workspace.objects.get(slug=workspace_slug)
    except Workspace.DoesNotExist:
        message = "Workspace not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def get_workspace(workspace_slug: str):
    return _get_workspace(workspace_slug=workspace_slug)
