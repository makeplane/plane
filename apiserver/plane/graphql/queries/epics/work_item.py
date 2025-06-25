# Third-Party Imports
from typing import Optional

# Python Standard Library Imports
import strawberry
from asgiref.sync import sync_to_async
from strawberry.permission import PermissionExtension

# Strawberry Imports
from strawberry.types import Info

# Module Imports
from plane.db.models import Issue
from plane.graphql.helpers import (
    get_epic,
    get_project,
    get_workspace,
    is_epic_feature_flagged,
    is_project_epics_enabled,
    project_member_filter_via_teamspaces_async,
)
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.issues.base import IssuesType
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.paginator import paginate


@strawberry.type
class EpicWorkItemsQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def epic_work_items(
        self,
        info: Info,
        slug: str,
        project: str,
        epic: str,
        cursor: Optional[str] = None,
    ) -> PaginatorResponse[IssuesType]:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_slug = str(workspace.slug)
        workspace_id = str(workspace.id)

        # get the project
        project = await get_project(workspace_slug=workspace_slug, project_id=project)
        project_id = str(project.id)

        # get the epic work items
        await get_epic(
            workspace_slug=workspace_slug, project_id=project_id, epic_id=epic
        )

        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=workspace_slug,
        )
        work_items = await sync_to_async(list)(
            Issue.issue_objects.filter(workspace_id=workspace_id, parent_id=epic)
            .filter(project_teamspace_filter.query)
            .distinct()
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels")
            .order_by("-created_at")
        )

        return paginate(results_object=work_items, cursor=cursor)
