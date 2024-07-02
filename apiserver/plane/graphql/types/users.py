# Python imports
from typing import Optional
from datetime import datetime

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.scalars import JSON

# Module imports
from plane.db.models import User, Profile


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
    last_workspace_id: strawberry.ID
    billing_address_country: JSON
    billing_address: Optional[str]
    has_billing_address: bool
    company_name: str

    @strawberry.field
    def user(self) -> int:
        return self.user_id
