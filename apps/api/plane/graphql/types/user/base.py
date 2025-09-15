# Python imports
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

# Strawberry imports
import strawberry
import strawberry_django

# Django Imports
from asgiref.sync import sync_to_async
from strawberry.scalars import JSON
from strawberry.types import Info

# Module imports
from plane.db.models import (
    Profile,
    User,
    Workspace,
)


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
    avatar_url: Optional[str]
    cover_image_url: Optional[str]


@strawberry_django.type(User)
class UserLiteType:
    id: Optional[strawberry.ID] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar: Optional[str] = None
    avatar_url: Optional[str] = None
    is_bot: bool = False
    display_name: Optional[str] = None


@strawberry.input
@dataclass
class ProfileUpdateInputType:
    mobile_timezone_auto_set: Optional[bool] = field(default_factory=lambda: None)
    is_mobile_onboarded: Optional[bool] = field(default_factory=lambda: None)
    mobile_onboarding_step: Optional[JSON] = field(default_factory=lambda: None)


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
    mobile_timezone_auto_set: bool
    is_mobile_onboarded: bool
    mobile_onboarding_step = Optional[JSON]

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
