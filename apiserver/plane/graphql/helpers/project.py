# Third Party Imports
from asgiref.sync import sync_to_async
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.db.models import Project


@sync_to_async
def get_project(workspace_slug: str, project_id: str):
    """
    Get the project for the given project id
    """
    try:
        return Project.objects.get(workspace__slug=workspace_slug, id=project_id)
    except Project.DoesNotExist:
        message = "Project not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)
