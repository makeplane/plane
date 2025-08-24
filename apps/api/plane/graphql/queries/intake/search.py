# Python imports
from typing import Optional

# Third-Party Imports
import strawberry

# Strawberry Imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.graphql.helpers import (
    get_intake_work_items_async,
    get_project,
    get_project_member,
    get_workspace,
    is_project_intakes_enabled_async,
)
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.types.intake.base import IntakeWorkItemType
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.paginator import paginate
from plane.graphql.utils.roles import Roles


@strawberry.type
class IntakeSearchQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )

    # getting issue relation issues
    async def intake_search(
        self,
        info: Info,
        slug: str,
        project: str,
        search: Optional[str] = None,
        cursor: Optional[str] = None,
    ) -> PaginatorResponse[IntakeWorkItemType]:
        user = info.context.user
        user_id = str(user.id)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_slug = workspace.slug

        # get the project
        project_details = await get_project(
            workspace_slug=workspace_slug, project_id=project
        )
        project_id = str(project_details.id)

        await is_project_intakes_enabled_async(
            workspace_slug=workspace_slug, project_id=project_id
        )

        current_user_role = None
        project_member = await get_project_member(
            workspace_slug=workspace_slug,
            project_id=project_id,
            user_id=user_id,
            raise_exception=False,
        )
        if not project_member:
            project_teamspace_filter = await project_member_filter_via_teamspaces_async(
                user_id=user_id,
                workspace_slug=workspace_slug,
            )
            teamspace_project_ids = project_teamspace_filter.teamspace_project_ids
            if project_id not in teamspace_project_ids:
                message = "You are not allowed to access this project"
                error_extensions = {"code": "FORBIDDEN", "statusCode": 403}
                raise GraphQLError(message, extensions=error_extensions)
            current_user_role = Roles.MEMBER.value
        else:
            current_user_role = project_member.role

        # get the intake work items
        intake_work_items = await get_intake_work_items_async(
            user_id=user_id if current_user_role == Roles.GUEST.value else None,
            workspace_slug=workspace_slug,
            project_id=project_id,
            is_snoozed_work_items_required=False,
            search=search,
        )

        return paginate(results_object=intake_work_items, cursor=cursor)
