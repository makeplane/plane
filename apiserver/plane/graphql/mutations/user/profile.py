# python imports
from typing import Optional

# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Third-party imports
from asgiref.sync import sync_to_async

# Module imports
from plane.graphql.types.users import ProfileType
from plane.db.models import Profile, WorkspaceMember
from plane.graphql.permissions.workspace import IsAuthenticated


@strawberry.type
class ProfileMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def update_last_workspace(self, info: Info, workspace: strawberry.ID) -> bool:
        profile = await sync_to_async(Profile.objects.get)(user=info.context.user)

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

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def update_profile(
        self, info: Info, mobile_timezone_auto_set: Optional[bool] = False
    ) -> ProfileType:
        profile = await sync_to_async(Profile.objects.get)(user=info.context.user)

        profile.mobile_timezone_auto_set = mobile_timezone_auto_set

        await sync_to_async(profile.save)()
        return profile
