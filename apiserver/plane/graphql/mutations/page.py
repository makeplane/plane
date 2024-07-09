# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Third-party imports
from asgiref.sync import sync_to_async
from typing import Optional

# Module imports
from plane.graphql.permissions.project import (
    ProjectBasePermission,
)
from plane.graphql.types.project import ProjectType
from plane.db.models import Page, UserFavorite


@strawberry.type
class PageMutation:

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def createPage(
        self,
        info: Info,
        slug: str,
        name: str,
        description: Optional[str] = "",
    ) -> ProjectType:
        page = await sync_to_async(Page.objects.create)(
            name=name,
            # identifier=identifier,
            # network=network,
            # description=description,
            # project_lead=project_lead,
            # logo_props=logo_props,
            # project=workspace,
        )

        return page


@strawberry.type
class PageFavoriteMutation:

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def favoritePage(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        page: strawberry.ID,
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
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        page: strawberry.ID,
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
