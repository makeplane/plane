# Python Imports
from typing import Optional

# Third Party Imports
from asgiref.sync import sync_to_async
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.db.models import Project, ProjectMember


# Get project
def _get_project(workspace_slug: str, project_id: str):
    """
    Get the project for the given project id
    """
    try:
        return Project.objects.get(workspace__slug=workspace_slug, id=project_id)
    except Project.DoesNotExist:
        message = "Project not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def get_project(workspace_slug: str, project_id: str):
    """
    Get the project for the given project id
    """
    return _get_project(workspace_slug=workspace_slug, project_id=project_id)


@sync_to_async
def get_project_member(
    workspace_slug: str,
    project_id: str,
    user_id: str,
    raise_exception: Optional[bool] = True,
):
    """
    Get the project member for the given project id and user id
    """
    try:
        return ProjectMember.objects.get(
            workspace__slug=workspace_slug, project_id=project_id, member_id=user_id
        )
    except ProjectMember.DoesNotExist:
        if raise_exception:
            message = "Project member not found"
            error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)
        return None
