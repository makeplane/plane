# python imports
from typing import Optional

# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Third-party imports
from asgiref.sync import sync_to_async

# Module imports
from plane.db.models import User, Profile, WorkspaceMember
from plane.graphql.permissions.workspace import IsAuthenticated
from plane.graphql.types.users import UserType


@strawberry.type
class UserMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def update_user(
        self,
        info: Info,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        display_name: Optional[str] = None,
        user_timezone: Optional[str] = None,
        cover_image: Optional[str] = None,
    ) -> UserType:
        current_user = await sync_to_async(User.objects.get)(
            id=info.context.user.id
        )

        if first_name is not None:
            current_user.first_name = first_name
        if last_name is not None:
            current_user.last_name = last_name
        if display_name is not None:
            current_user.display_name = display_name
        if user_timezone is not None:
            current_user.user_timezone = user_timezone
        if cover_image is not None:
            current_user.cover_image = cover_image
            current_user.cover_image_asset = None

        await sync_to_async(current_user.save)()

        user = await sync_to_async(User.objects.get)(id=info.context.user.id)

        return user


@strawberry.type
class ProfileMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def update_last_workspace(
        self, info: Info, workspace: strawberry.ID
    ) -> bool:
        profile = await sync_to_async(Profile.objects.get)(
            user=info.context.user
        )

        # Wrap the synchronous call to `exists()` with `sync_to_async`
        workspace_member_exists = await sync_to_async(
            WorkspaceMember.objects.filter(
                workspace=workspace, member=info.context.user
            ).exists
        )()

        if not workspace_member_exists:
            return False

        profile.last_workspace_id = workspace
        await sync_to_async(profile.save)()
        return True
