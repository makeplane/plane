# Third-Party Imports
from typing import Optional

# Python Standard Library Imports
import strawberry

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.scalars import JSON
from strawberry.types import Info

# Module Imports
from plane.graphql.bgtasks.recent_visited_task import recent_visited_task
from plane.graphql.helpers import (
    get_epic,
    get_epic_stats_count_async,
    get_project_epics,
    is_epic_feature_flagged,
    is_project_epics_enabled,
)
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.types.epics.base import EpicCountType, EpicStatsType, EpicType
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.paginator import paginate
from plane.graphql.utils.work_item_filters import work_item_filters


@strawberry.type
class EpicCountQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def epic_count(self, info: Info, slug: str, project: str) -> EpicCountType:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        epics = await get_project_epics(
            workspace_slug=slug, project_id=project, user_id=user_id
        )

        total_epics = len(epics)

        return EpicCountType(total_epics=total_epics)


@strawberry.type
class EpicStatsQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def epic_stats(
        self, info: Info, slug: str, project: str, epic: str
    ) -> EpicStatsType:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        stats = await get_epic_stats_count_async(
            workspace_slug=slug, project_id=project, epic=epic
        )
        return stats


@strawberry.type
class EpicQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def epics(
        self,
        info: Info,
        slug: str,
        project: str,
        filters: Optional[JSON] = {},
        orderBy: Optional[str] = "-created_at",
        cursor: Optional[str] = None,
    ) -> PaginatorResponse[EpicType]:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        filters = work_item_filters(filters)

        epics = await get_project_epics(
            workspace_slug=slug,
            project_id=project,
            user_id=user_id,
            filters=filters,
            orderBy=orderBy,
        )

        return paginate(results_object=epics, cursor=cursor)

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def epic(self, info: Info, slug: str, project: str, epic: str) -> EpicType:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        epic = await get_epic(workspace_slug=slug, project_id=project, epic_id=epic)
        epic_id = str(epic.id)

        recent_visited_task.delay(
            slug=slug,
            project_id=project,
            user_id=user_id,
            entity_name="issue",
            entity_identifier=epic_id,
        )

        return epic
