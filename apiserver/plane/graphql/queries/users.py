# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Module Imports
from plane.db.models import Profile
from plane.graphql.types.users import UserType, ProfileType
from plane.graphql.permissions.workspace import IsAuthenticated


@strawberry.type
class UserQuery:

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def user(self, info: Info) -> UserType:
        return info.context.user


@strawberry.type
class ProfileQuery:

    @strawberry.field(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def profile(self, info: Info) -> ProfileType:
        profile = await sync_to_async(Profile.objects.get)(
            user=info.context.user
        )
        return profile
