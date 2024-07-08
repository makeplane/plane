# Python imports
from typing import Optional
from datetime import datetime
from asgiref.sync import sync_to_async

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.types import Info
from strawberry.scalars import JSON

# Module imports
from plane.db.models import User, Profile, Workspace


@strawberry_django.type(User)
class UserType:
    id: strawberry.ID
    avatar: Optional[str]
    cover_image: Optional[str]
    date_joined: datetime
    display_name: str
    email: str
    first_name: str
    last_name: str
    is_active: bool
    is_bot: bool
    is_email_verified: bool
    user_timezone: str
    username: str
    is_password_autoset: bool
    last_login_medium: str


@strawberry_django.type(Profile)
class ProfileType:
    id: strawberry.ID
    user: strawberry.ID
    theme: JSON
    is_tour_completed: bool
    onboarding_step: JSON
    use_case: Optional[str]
    role: Optional[str]
    is_onboarded: bool
    last_workspace_id: Optional[strawberry.ID]
    billing_address_country: JSON
    billing_address: Optional[str]
    has_billing_address: bool
    company_name: str

    @strawberry.field
    def user(self) -> int:
        return self.user_id

    @strawberry.field
    async def last_workspace_id(self, info: Info) -> Optional[strawberry.ID]:
        if (
            self.last_workspace_id is not None
            and await sync_to_async(
                Workspace.objects.filter(
                    pk=self.last_workspace_id,
                    workspace_member__member_id=info.context.user.id,
                    workspace_member__is_active=True,
                ).exists
            )()
        ):
            return self.last_workspace_id

        # Query the fallback workspace for the current user if last_workspace_id is null
        fallback_workspace = await sync_to_async(
            Workspace.objects.filter(
                workspace_member__member_id=info.context.user.id,
                workspace_member__is_active=True,
            )
            .order_by("created_at")
            .first
        )()

        if fallback_workspace:
            profile = await sync_to_async(Profile.objects.get)(id=self.id)
            profile.last_workspace_id = fallback_workspace.id
            await sync_to_async(profile.save)()
            return fallback_workspace.id

        return None
