# Third-Party Imports
from typing import Optional

# Python Standard Library Imports
import strawberry

# Strawberry Imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.scalars import JSON
from strawberry.types import Info

# Module Imports
from plane.graphql.helpers import (
    get_intake_work_item_async,
    get_intake_work_items_async,
    get_project,
    get_project_member,
    get_workspace,
    is_project_intakes_enabled_async,
)
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.project import ProjectPermission
from plane.graphql.types.intake.base import (
    IntakeCountType,
    IntakeWorkItemType,
    IntakeWorkItemStatusType,
)
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.intake import intake_filters
from plane.graphql.utils.paginator import paginate
from plane.graphql.utils.roles import Roles


@strawberry.type
class IntakeCountQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectPermission()])]
    )
    async def intake_count(
        self,
        info: Info,
        slug: str,
        project: str,
        filters: Optional[JSON] = {},
    ) -> IntakeCountType:
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

        filters = intake_filters(filters)

        intake_status_filter = filters.get("status__in") or []
        intake_status = "closed-intakes"
        is_snoozed_work_items_required = False
        if (
            IntakeWorkItemStatusType.SNOOZED.value in intake_status_filter
            or IntakeWorkItemStatusType.PENDING.value in intake_status_filter
        ):
            intake_status = "open-intakes"

        if (
            intake_status == "open-intakes"
            and IntakeWorkItemStatusType.SNOOZED.value not in intake_status_filter
        ):
            is_snoozed_work_items_required = True

        intake_work_items = await get_intake_work_items_async(
            user_id=user_id if current_user_role == Roles.GUEST.value else None,
            workspace_slug=workspace_slug,
            project_id=project_id,
            filters=filters,
            is_snoozed_work_items_required=is_snoozed_work_items_required,
        )

        total_intake_work_items = len(intake_work_items)
        return IntakeCountType(total_intake_work_items=total_intake_work_items)


@strawberry.type
class IntakeWorkItemQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectPermission()])]
    )
    async def intake_work_items(
        self,
        info: Info,
        slug: str,
        project: str,
        filters: Optional[JSON] = {},
        orderBy: Optional[str] = "-created_at",
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

        filters = intake_filters(filters)

        intake_status_filter = filters.get("status__in") or []
        intake_status = "closed-intakes"
        is_snoozed_work_items_required = False
        if (
            IntakeWorkItemStatusType.SNOOZED.value in intake_status_filter
            or IntakeWorkItemStatusType.PENDING.value in intake_status_filter
        ):
            intake_status = "open-intakes"

        if (
            intake_status == "open-intakes"
            and IntakeWorkItemStatusType.SNOOZED.value not in intake_status_filter
        ):
            is_snoozed_work_items_required = True

        intake_work_items = await get_intake_work_items_async(
            user_id=user_id if current_user_role == Roles.GUEST.value else None,
            workspace_slug=workspace_slug,
            project_id=project_id,
            filters=filters,
            orderBy=orderBy,
            is_snoozed_work_items_required=is_snoozed_work_items_required,
        )

        return paginate(results_object=intake_work_items, cursor=cursor)

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectPermission()])]
    )
    async def intake_work_item(
        self, info: Info, slug: str, project: str, intake_work_item: str
    ) -> IntakeWorkItemType:
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

        intake_work_item = await get_intake_work_item_async(
            workspace_slug=workspace_slug,
            project_id=project_id,
            intake_work_item_id=intake_work_item,
        )

        work_item_creator_id = str(intake_work_item.created_by_id)
        if current_user_role == Roles.GUEST.value:
            if work_item_creator_id != user_id:
                message = "You are not allowed to access this intake work item"
                error_extensions = {"code": "FORBIDDEN", "statusCode": 403}
                raise GraphQLError(message, extensions=error_extensions)

        return intake_work_item
