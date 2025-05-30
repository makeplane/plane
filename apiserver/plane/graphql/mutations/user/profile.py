# python imports
from typing import Optional

# Strawberry imports
import strawberry

# Third-party imports
from asgiref.sync import sync_to_async
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.db.models import Profile, WorkspaceMember
from plane.graphql.permissions.workspace import IsAuthenticated
from plane.graphql.types.users import ProfileType, ProfileUpdateInputType


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

    # Deprecated
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

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def update_profile_v2(
        self, info: Info, profile_input: ProfileUpdateInputType
    ) -> ProfileType:
        user = info.context.user
        user_id = str(user.id)

        profile = await sync_to_async(Profile.objects.get)(user=user_id)

        provided_fields = {
            k: v
            for k, v in info.variable_values.get("profileInput", {}).items()
            if k in info.variable_values.get("profileInput", {})
        }

        for key in provided_fields.keys():
            if "mobileTimezoneAutoSet" == key:
                profile.mobile_timezone_auto_set = (
                    profile_input.mobile_timezone_auto_set
                )
            elif "isMobileOnboarded" == key:
                profile.is_mobile_onboarded = profile_input.is_mobile_onboarded
            elif "mobileOnboardingStep" == key:
                profile.mobile_onboarding_step = profile_input.mobile_onboarding_step

        await sync_to_async(profile.save)()

        return profile
