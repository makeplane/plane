# Python imports
from typing import Optional

# Django Imports
from django.db.models import Q

# Module Imports
from plane.db.models import Issue


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
        work_item_base_query = work_item_base_query.filter(
            project__project_projectmember__member_id=user_id,
            project__project_projectmember__is_active=True,
        )

    return work_item_base_query
