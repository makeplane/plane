# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.scalars import JSON
from strawberry.permission import PermissionExtension

# Third-party imports
from asgiref.sync import sync_to_async
from typing import Optional

# Module imports
from plane.graphql.permissions.project import (
    ProjectBasePermission,
)
from plane.graphql.types.page import PageType
from plane.db.models import Page, ProjectPage, UserFavorite, Workspace, Project


@strawberry.type
class PageMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def createPage(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        name: str,
        description_html: Optional[str] = "",
        logo_props: Optional[JSON] = {},
        access: int = 2,
    ) -> PageType:
        workspace = await sync_to_async(Workspace.objects.get)(slug=slug)
        project_details = await sync_to_async(Project.objects.get)(id=project)
        page = await sync_to_async(Page.objects.create)(
            workspace=workspace,
            name=name,
            description_html=description_html,
            logo_props=logo_props,
            access=access,
            owned_by=info.context.user,
        )

        _ = await sync_to_async(ProjectPage.objects.create)(
            workspace=workspace,
            project=project_details,
            page=page,
            created_by=info.context.user,
            updated_by=info.context.user,
        )

        page_details = await sync_to_async(Page.objects.get)(id=page.id)

        return page_details

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def updatePage(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        id: strawberry.ID,
        name: Optional[str] = None,
        description_html: Optional[str] = None,
        logo_props: Optional[JSON] = None,
        access: Optional[int] = None,
    ) -> PageType:
        page = await sync_to_async(Page.objects.get)(id=id)
        if name is not None:
            page.name = name
        if description_html is not None:
            page.description_html = description_html
        if logo_props is not None:
            page.logo_props = logo_props
        if access is not None:
            page.access = access
        await sync_to_async(page.save)()
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
