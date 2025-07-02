# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Third-party imports
from asgiref.sync import sync_to_async

# Django imports
from typing import Optional

# Module imports
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.db.models import Workspace, UserFavorite


@strawberry.type
class UserFavoriteMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def createUserFavorite(
        self,
        info: Info,
        slug: str,
        entity_identifier: strawberry.ID,
        entity_type: str,
        project: Optional[strawberry.ID] = None,
    ) -> bool:
        workspace = await sync_to_async(Workspace.objects.get)(slug=slug)
        _ = await sync_to_async(UserFavorite.objects.create)(
            entity_identifier=entity_identifier,
            entity_type=entity_type,
            user=info.context.user,
            project_id=project,
            workspace_id=workspace.id,
        )
        return True

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def deleteUserFavorite(
        self, info: Info, slug: str, favorite: strawberry.ID
    ) -> bool:
        user_favorite = await sync_to_async(UserFavorite.objects.get)(
            pk=favorite, user=info.context.user, workspace__slug=slug
        )
        await sync_to_async(user_favorite.delete)()

        return True
