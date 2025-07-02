# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.db.models import UserFavorite
from plane.graphql.permissions.project import ProjectBasePermission


@strawberry.type
class PageFavoriteMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def favoritePage(
        self, info: Info, slug: str, project: strawberry.ID, page: strawberry.ID
    ) -> bool:
        _ = await sync_to_async(UserFavorite.objects.create)(
            entity_identifier=page,
            entity_type="page",
            user=info.context.user,
            project_id=project,
        )
        return True

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def unFavoritePage(
        self, info: Info, slug: str, project: strawberry.ID, page: strawberry.ID
    ) -> bool:
        page_favorite = await sync_to_async(UserFavorite.objects.get)(
            entity_identifier=page,
            entity_type="page",
            user=info.context.user,
            workspace__slug=slug,
            project_id=project,
        )
        await sync_to_async(page_favorite.delete)()

        return True
