# Python imports
from typing import Optional

# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry imports
from strawberry.permission import PermissionExtension
from strawberry.scalars import JSON
from strawberry.types import Info

# Module imports
from plane.db.models import Page, ProjectMember, WorkspaceMember
from plane.graphql.permissions.workspace import WorkspacePermission
from plane.graphql.types.pages import PageType
from plane.graphql.utils.roles import Roles


@sync_to_async
def get_workspace_member(slug: str, user_id: str):
    try:
        return WorkspaceMember.objects.get(
            workspace__slug=slug, member_id=user_id, is_active=True
        )
    except WorkspaceMember.DoesNotExist:
        return None


@sync_to_async
def get_project_member(slug: str, project: str, user_id: str):
    try:
        return ProjectMember.objects.get(
            workspace__slug=slug, project_id=project, member_id=user_id, is_active=True
        )
    except ProjectMember.DoesNotExist:
        return None


@strawberry.type
class WorkspacePageMutation:
    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[WorkspacePermission(roles=[Roles.ADMIN, Roles.MEMBER])]
            )
        ]
    )
    async def updateWorkspacePage(
        self,
        info: Info,
        slug: str,
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
