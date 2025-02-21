# Strawberry imports
import strawberry
from strawberry.scalars import JSON
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Third-party imports
from asgiref.sync import sync_to_async

# Module imports
from plane.graphql.permissions.project import ProjectBasePermission
from plane.db.models import UserFavorite, ModuleUserProperties
from plane.graphql.types.module import ModuleUserPropertyType


@strawberry.type
class ModuleFavoriteMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def favoriteModule(
        self, info: Info, slug: str, project: strawberry.ID, module: strawberry.ID
    ) -> bool:
        _ = await sync_to_async(UserFavorite.objects.create)(
            entity_identifier=module,
            entity_type="module",
            user=info.context.user,
            project_id=project,
        )
        return True

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def unFavoriteModule(
        self, info: Info, slug: str, project: strawberry.ID, module: strawberry.ID
    ) -> bool:
        module_favorite = await sync_to_async(UserFavorite.objects.get)(
            entity_identifier=module,
            entity_type="module",
            user=info.context.user,
            workspace__slug=slug,
            project_id=project,
        )
        await sync_to_async(module_favorite.delete)()

        return True


@strawberry.type
class ModuleIssueUserPropertyMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def updateModuleUserProperties(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        module: strawberry.ID,
        filters: JSON,
        display_filters: JSON,
        display_properties: JSON,
    ) -> ModuleUserPropertyType:
        module_issue_properties = await sync_to_async(ModuleUserProperties.objects.get)(
            workspace__slug=slug,
            project_id=project,
            module_id=module,
            user=info.context.user,
        )
        module_issue_properties.filters = filters
        module_issue_properties.display_filters = display_filters
        module_issue_properties.display_properties = display_properties

        await sync_to_async(module_issue_properties.save)()
        return module_issue_properties
