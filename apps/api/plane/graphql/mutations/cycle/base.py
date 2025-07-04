# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.scalars import JSON
from strawberry.permission import PermissionExtension

# Third-party imports
from asgiref.sync import sync_to_async

# Module imports
from plane.graphql.permissions.project import ProjectBasePermission
from plane.db.models import UserFavorite, CycleUserProperties
from plane.graphql.types.cycle import CycleUserPropertyType


@strawberry.type
class CycleFavoriteMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def favoriteCycle(
        self, info: Info, slug: str, project: strawberry.ID, cycle: strawberry.ID
    ) -> bool:
        _ = await sync_to_async(UserFavorite.objects.create)(
            entity_identifier=cycle,
            entity_type="cycle",
            user=info.context.user,
            project_id=project,
        )
        return True

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def unFavoriteCycle(
        self, info: Info, slug: str, project: strawberry.ID, cycle: strawberry.ID
    ) -> bool:
        cycle_favorite = await sync_to_async(UserFavorite.objects.get)(
            entity_identifier=cycle,
            entity_type="cycle",
            user=info.context.user,
            workspace__slug=slug,
            project_id=project,
        )
        await sync_to_async(cycle_favorite.delete)()

        return True


@strawberry.type
class CycleIssueUserPropertyMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def updateCycleUserProperties(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        cycle: strawberry.ID,
        filters: JSON,
        display_filters: JSON,
        display_properties: JSON,
    ) -> CycleUserPropertyType:
        cycle_issue_properties = await sync_to_async(CycleUserProperties.objects.get)(
            workspace__slug=slug,
            project_id=project,
            cycle_id=cycle,
            user=info.context.user,
        )
        cycle_issue_properties.filters = filters
        cycle_issue_properties.display_filters = display_filters
        cycle_issue_properties.display_properties = display_properties

        await sync_to_async(cycle_issue_properties.save)()
        return cycle_issue_properties
