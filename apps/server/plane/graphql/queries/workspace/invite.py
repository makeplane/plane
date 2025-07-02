# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.db.models import WorkspaceMemberInvite
from plane.graphql.permissions.workspace import IsAuthenticated
from plane.graphql.types.workspace import WorkspaceInviteType


# Get workspace invites by user email
@sync_to_async
def get_invites_by_user_email(email: str) -> list[WorkspaceInviteType]:
    try:
        return list(
            WorkspaceMemberInvite.objects.filter(email=email).select_related(
                "workspace"
            )
        )
    except Exception:
        message = "Workspace invites not found"
        error_extensions = {"code": "WORKSPACE_INVITES_NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


# Get workspace invite by invite id
@sync_to_async
def get_user_workspace_invite(invitation_id: str, email: str) -> WorkspaceInviteType:
    try:
        workspace_invite = WorkspaceMemberInvite.objects.get(
            id=invitation_id, email=email
        )
        return workspace_invite
    except WorkspaceMemberInvite.DoesNotExist:
        message = "Workspace invitation not found"
        error_extensions = {"code": "WORKSPACE_INVITATION_NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@strawberry.type
class WorkspaceInviteQuery:
    # User workspace invites
    @strawberry.field(extensions=[PermissionExtension(permissions=[IsAuthenticated()])])
    async def user_workspace_invites(self, info: Info) -> list[WorkspaceInviteType]:
        user = info.context.user
        user_email = user.email

        workspace_invites = await get_invites_by_user_email(email=user_email)
        return workspace_invites

    # Workspace invite
    @strawberry.field(extensions=[PermissionExtension(permissions=[IsAuthenticated()])])
    async def user_workspace_invite(
        self, info: Info, invitation_id: str
    ) -> WorkspaceInviteType:
        user = info.context.user
        user_email = user.email

        workspace_invite = await get_user_workspace_invite(
            invitation_id=invitation_id, email=user_email
        )
        return workspace_invite
