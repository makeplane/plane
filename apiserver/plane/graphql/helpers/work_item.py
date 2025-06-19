# Python imports
from typing import Optional

# Third Party Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Q

# Strawberry Imports
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.db.models import Issue
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces


def work_item_base_query(
    workspace_slug: Optional[str] = None,
    project_id: Optional[str] = None,
    user_id: Optional[str] = None,
):
    """
    Get the work item base query for objects and all objects the given workspace slug
    and project id
    """
    work_item_base_query = (
        Issue.objects
        # issue intake filters
        .filter(
            Q(issue_intake__status=1)
            | Q(issue_intake__status=-1)
            | Q(issue_intake__status=2)
            | Q(issue_intake__isnull=True)
        )
        # old intake filters
        .filter(state__is_triage=False)
        # archived filters
        .filter(archived_at__isnull=True)
        # draft filters
        .filter(is_draft=False)
    )

    # workspace filters
    if workspace_slug:
        work_item_base_query = work_item_base_query.filter(
            workspace__slug=workspace_slug
        )

    # project filters
    if project_id:
        work_item_base_query = work_item_base_query.filter(
            project_id=project_id
        ).filter(project__archived_at__isnull=True)

    # project member filters
    if user_id:
        project_teamspace_filter = project_member_filter_via_teamspaces(
            user_id=user_id,
            workspace_slug=workspace_slug,
        )
        work_item_base_query = work_item_base_query.filter(
            project_teamspace_filter.query
        ).distinct()

    return work_item_base_query


@sync_to_async
def get_work_item(
    workspace_slug: str,
    work_item_id: str,
    project_id: Optional[str] = None,
    user_id: Optional[str] = None,
):
    """
    Get the work item for the given project and work item id
    """
    base_query = work_item_base_query(
        workspace_slug=workspace_slug, project_id=project_id, user_id=user_id
    )

    try:
        return base_query.get(id=work_item_id)
    except Issue.DoesNotExist:
        message = "Work item not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)
