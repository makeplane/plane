# Strawberry imports
import strawberry

# Third-party imports
from asgiref.sync import sync_to_async

# strawberry imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# third party imports
from zxcvbn import zxcvbn

# Module imports
from plane.db.models import User
from plane.graphql.permissions.workspace import IsAuthenticated
from plane.graphql.types.auth.set_password import PasswordInputType


@sync_to_async
def get_user(user_id: str) -> User:
    try:
        return User.objects.get(pk=user_id)
    except User.DoesNotExist:
        message = "User not found"
        error_extensions = {"code": "USER_NOT_FOUND", "statusCode": 400}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def set_password(user: User, password: str) -> bool:
    user.set_password(password)
    user.is_password_autoset = False
    user.save()
    return True


@strawberry.type
class SetPasswordMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def set_password(self, info: Info, passwordInput: PasswordInputType) -> bool:
        user = info.context.user
        user_id = user.id

        current_user = await get_user(user_id)
        if not current_user.is_password_autoset:
            message = "Password is already set"
            error_extensions = {"code": "PASSWORD_ALREADY_SET", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        password = passwordInput.password
        if not password:
            message = "Password is required"
            error_extensions = {"code": "PASSWORD_REQUIRED", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        results = zxcvbn(password)
        if results["score"] < 3:
            message = "Password is not strong enough"
            error_extensions = {"code": "PASSWORD_NOT_STRONG", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        await set_password(user=user, password=password)

        return True
