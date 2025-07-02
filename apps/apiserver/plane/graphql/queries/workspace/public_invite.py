# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.db.models import WorkspaceMemberInvite
from plane.graphql.types.workspace import WorkspaceInviteType


# Get workspace invite by invite id
@sync_to_async
def get_public_user_workspace_invite(
    invitation_id: str, email: str
) -> WorkspaceInviteType:
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
class PublicWorkspaceInviteQuery:
    # public workspace invite
    @strawberry.field()
    async def public_user_workspace_invite(
        self, info: Info, invitation_id: str, email: str
    ) -> WorkspaceInviteType:
        workspace_invite = await get_public_user_workspace_invite(
            invitation_id=invitation_id, email=email
        )
        return workspace_invite
