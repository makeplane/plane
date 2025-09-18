# Python imports
import base64
from typing import Optional

# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry imports
from strawberry.permission import PermissionExtension
from strawberry.scalars import JSON
from strawberry.types import Info

# Module imports
from plane.db.models import Page, Project, ProjectPage, Workspace
from plane.graphql.permissions.project import ProjectBasePermission, ProjectPermission
from plane.graphql.types.pages import PageType
from plane.graphql.utils.roles import Roles


@strawberry.input
class PageInput:
    name: str
    description_html: Optional[str] = strawberry.field(default="<p></p>")
    logo_props: Optional[JSON] = strawberry.field(default_factory=dict)
    access: int = strawberry.field(default=2)
    description_binary: Optional[str] = strawberry.field(default=None)


@strawberry.type
class PageMutation:
    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[ProjectPermission([Roles.ADMIN, Roles.MEMBER])]
            )
        ]
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
        description_binary: Optional[str] = None,
    ) -> PageType:
        workspace = await sync_to_async(Workspace.objects.get)(slug=slug)
        project_details = await sync_to_async(Project.objects.get)(id=project)

        if description_binary is not None:
            description_binary = base64.b64decode(description_binary)

        page = await sync_to_async(Page.objects.create)(
            workspace=workspace,
            name=name,
            description_html=description_html,
            description_binary=description_binary,
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
        extensions=[
            PermissionExtension(
                permissions=[ProjectPermission([Roles.ADMIN, Roles.MEMBER])]
            )
        ]
    )
    async def batchCreatePages(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        pages: list[PageInput],
    ) -> None:
        workspace = await sync_to_async(Workspace.objects.get)(slug=slug)
        project_details = await sync_to_async(Project.objects.get)(id=project)

        # Prepare pages for bulk creation
        pages_to_create = [
            Page(
                workspace=workspace,
                name=page_data.name,
                description_html=page_data.description_html,
                description_binary=base64.b64decode(page_data.description_binary)
                if page_data.description_binary
                else None,
                logo_props=page_data.logo_props,
                access=page_data.access,
                owned_by=info.context.user,
            )
            for page_data in pages
        ]

        # Bulk create pages
        created_pages = await sync_to_async(Page.objects.bulk_create)(pages_to_create)

        # Prepare project pages for bulk creation
        project_pages_to_create = [
            ProjectPage(
                workspace=workspace,
                project=project_details,
                page=created_page,
                created_by=info.context.user,
                updated_by=info.context.user,
            )
            for created_page in created_pages
        ]

        # Bulk create project pages
        await sync_to_async(ProjectPage.objects.bulk_create)(project_pages_to_create)
        return None

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
