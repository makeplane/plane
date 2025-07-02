# Third-Party Imports
from typing import Optional

# Strawberry Imports
import strawberry
from asgiref.sync import sync_to_async
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import Sticky
from plane.graphql.permissions.workspace import WorkspacePermission
from plane.graphql.types.stickies import StickiesType
from plane.graphql.utils.paginator import paginate
from plane.graphql.types.paginator import PaginatorResponse


@sync_to_async
def get_sticky(slug: str, user_id: str, id: str) -> Optional[Sticky]:
    try:
        return Sticky.objects.get(
            workspace__slug=slug,
            workspace__workspace_member__member_id=user_id,
            workspace__workspace_member__is_active=True,
            owner_id=user_id,
            id=id,
            deleted_at__isnull=True,
        )
    except Sticky.DoesNotExist:
        message = "Sticky not found"
        error_extensions = {"code": "STICKY_NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@strawberry.type
class WorkspaceStickiesQuery:
    # Return a list of stickies
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspacePermission()])]
    )
    async def stickies(
        self, info: Info, slug: str, cursor: Optional[str] = None
    ) -> PaginatorResponse[StickiesType]:
        user = info.context.user

        stickies = await sync_to_async(list)(
            Sticky.objects.filter(workspace__slug=slug, owner=user).filter(
                workspace__workspace_member__member=user,
                workspace__workspace_member__is_active=True,
            )
        )

        return paginate(results_object=stickies, cursor=cursor)

    # Return a single sticky
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspacePermission()])]
    )
    async def sticky(
        self, info: Info, slug: str, sticky: strawberry.ID
    ) -> StickiesType:
        user = info.context.user
        user_id = user.id

        sticky_detail = await get_sticky(slug=slug, user_id=user_id, id=sticky)

        return sticky_detail
