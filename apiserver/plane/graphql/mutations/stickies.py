# Python imports
from dataclasses import asdict
from typing import List, Optional

# Strawberry Imports
import strawberry
from asgiref.sync import sync_to_async
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import Sticky, Workspace
from plane.graphql.permissions.workspace import WorkspacePermission
from plane.graphql.types.stickies import StickiesType, StickyCreateUpdateInputType


@sync_to_async
def get_workspace(slug: str, user_id: str) -> Optional[Workspace]:
    try:
        return Workspace.objects.get(slug=slug)
    except Workspace.DoesNotExist:
        message = "Workspace not found"
        error_extensions = {"code": "WORKSPACE_NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def get_sticky(slug: str, user_id: str, id: str) -> Optional[Sticky]:
    try:
        return Sticky.objects.get(
            workspace__slug=slug,
            workspace__workspace_member__member_id=user_id,
            workspace__workspace_member__is_active=True,
            owner_id=user_id,
            id=id,
        )
    except Sticky.DoesNotExist:
        message = "Sticky not found"
        error_extensions = {"code": "STICKY_NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@strawberry.type
class WorkspaceStickiesMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspacePermission()])]
    )
    async def create_sticky(
        self, info: Info, slug: str, sticky_data: StickyCreateUpdateInputType
    ) -> StickiesType:
        user = info.context.user
        user_id = user.id

        workspace = await get_workspace(slug=slug, user_id=user_id)
        workspace_id = workspace.id

        sticky = await sync_to_async(Sticky.objects.create)(
            workspace_id=workspace_id, owner=user, **asdict(sticky_data)
        )

        return sticky

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspacePermission()])]
    )
    async def update_sticky(
        self,
        info: Info,
        slug: str,
        sticky: strawberry.ID,
        sticky_data: StickyCreateUpdateInputType,
    ) -> StickiesType:
        user = info.context.user

        sticky_instance = await get_sticky(slug=slug, user_id=user.id, id=sticky)

        for key, value in asdict(sticky_data).items():
            setattr(sticky_instance, key, value)

        await sync_to_async(sticky_instance.save)()

        return sticky_instance

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspacePermission()])]
    )
    async def delete_stickies(
        self, info: Info, slug: str, stickies: List[strawberry.ID]
    ) -> bool:
        user = info.context.user

        for sticky in stickies:
            sticky_instance = await get_sticky(slug=slug, user_id=user.id, id=sticky)
            await sync_to_async(sticky_instance.delete)()

        return True
