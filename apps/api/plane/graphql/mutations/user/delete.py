# Python Standard Library Imports
import uuid
from typing import Optional

# Third-Party Imports
import strawberry

# Django Imports
from asgiref.sync import sync_to_async
from django.utils import timezone

# Strawberry Imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import User, Workspace
from plane.graphql.permissions.workspace import IsAuthenticated
from plane.graphql.types.user import UserDeleteInputType
from plane.graphql.utils.roles import Roles
from plane.graphql.utils.slack import trigger_slack_message


@sync_to_async
def get_workspaces(user_id: int) -> Optional[list[Workspace]]:
    try:
        role = Roles.ADMIN.value
        workspaces = Workspace.objects.filter(
            workspace_member__role=role,
            workspace_member__member_id=user_id,
        )
        return list(workspaces)
    except Exception:
        return []


@sync_to_async
def delete_user(info: Info, user_id: int, reason: Optional[str] = None) -> bool:
    try:
        current_time = timezone.now()

        user = User.objects.get(id=user_id)
        user.masked_time = current_time

        # Send a message to the Slack channel
        trigger_slack_message(
            channel="#trackers",
            message=f"""User {user.email} has been deleted at {current_time}.
            Reason: {reason}""",
        )

        user.email = f"{uuid.uuid4().hex}@plane.so"
        user.username = f"user_{uuid.uuid4().hex}"
        user.first_name = f"{uuid.uuid4().hex}"
        user.last_name = f"{uuid.uuid4().hex}"
        user.display_name = f"{uuid.uuid4().hex}"
        user.mobile_number = ""
        user.avatar = ""
        user.avatar_asset = None
        user.cover_image = ""
        user.cover_image_asset = None
        user.date_joined = current_time
        user.last_location = ""
        user.created_location = ""
        user.user_timezone = "UTC"
        user.last_login_ip = ""
        user.last_logout_ip = ""
        user.last_login_medium = ""
        user.last_login_uagent = ""
        user.token = ""
        user.is_active = False  # Deactivate the user
        user.save()

        return True
    except User.DoesNotExist:
        message = "User does not exist"
        error_extensions = {
            "code": "USER_DOES_NOT_EXIST",
            "statusCode": 400,
        }
        raise GraphQLError(message, extensions=error_extensions)


@strawberry.type
class UserDeleteMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def user_delete(self, info: Info, delete_input: UserDeleteInputType) -> bool:
        user = info.context.user
        user_id = user.id
        reason = hasattr(delete_input, "reason") and delete_input.reason or None

        workspaces = await get_workspaces(user_id=user_id)
        if workspaces is not None and len(workspaces) > 0:
            message = "User has workspaces. Please delete them first."
            error_extensions = {
                "code": "USER_HAS_WORKSPACES",
                "statusCode": 400,
            }
            raise GraphQLError(message, extensions=error_extensions)

        await delete_user(info=info, user_id=user_id, reason=reason)

        return True
