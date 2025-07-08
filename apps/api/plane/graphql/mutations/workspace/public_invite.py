# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry imports
from strawberry.exceptions import GraphQLError
from strawberry.types import Info

# Module imports
from plane.db.models import WorkspaceMemberInvite


@sync_to_async
def get_invitation(invitation_id: str, email: str) -> WorkspaceMemberInvite:
    try:
        workspace_invitation = WorkspaceMemberInvite.objects.filter(
            id=invitation_id, email=email
        ).select_related("workspace")

        return workspace_invitation.first()
    except Exception:
        message = "Workspace invitation not found"
        error_extensions = {"code": "WORKSPACE_INVITATION_NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def validate_invitation_acceptance(workspace_invitation: WorkspaceMemberInvite) -> bool:
    is_workspace_invitation_responded = False
    is_workspace_invitation_accepted = False

    if workspace_invitation.responded_at:
        is_workspace_invitation_responded = True
    if workspace_invitation.accepted:
        is_workspace_invitation_accepted = True

    if is_workspace_invitation_responded:
        message = "You have already responded to this invitation"
        error_extensions = {
            "code": "WORKSPACE_INVITE_ALREADY_ACCEPTED",
            "statusCode": 400,
        }
        raise GraphQLError(message, extensions=error_extensions)

    if is_workspace_invitation_accepted:
        message = "You have already accepted this invitation"
        error_extensions = {
            "code": "WORKSPACE_INVITE_ALREADY_ACCEPTED",
            "statusCode": 400,
        }
        raise GraphQLError(message, extensions=error_extensions)

    return True


@sync_to_async
def update_workspace_invitations(
    workspace_invitation: WorkspaceMemberInvite,
) -> WorkspaceMemberInvite:
    workspace_invitation.accepted = True
    workspace_invitation.save()
    return workspace_invitation


@strawberry.type
class PublicWorkspaceInviteMutation:
    @strawberry.mutation()
    async def accept_public_workspace_invite(
        self, info: Info, invitation_id: str, email: str
    ) -> bool:
        # Get the workspace invitations
        workspace_invitation = await get_invitation(
            invitation_id=invitation_id, email=email
        )

        # Validate the invitation acceptance
        is_workspace_invitation_valid = await validate_invitation_acceptance(
            workspace_invitation=workspace_invitation
        )
        if not is_workspace_invitation_valid:
            return False

        # Update the workspace invitations
        await update_workspace_invitations(workspace_invitation=workspace_invitation)

        return True
