# Python imports
import random

# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Django imports
from django.utils import timezone

# Strawberry imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.db.models import User, WorkspaceMember, WorkspaceMemberInvite
from plane.graphql.permissions.workspace import IsAuthenticated


@sync_to_async
def get_invitations(
    invitation_ids: list[str], email: str
) -> list[WorkspaceMemberInvite]:
    try:
        workspace_invitations = WorkspaceMemberInvite.objects.filter(
            id__in=invitation_ids, email=email
        ).select_related("workspace")

        return list(workspace_invitations)
    except Exception:
        message = "Workspace invitations not found"
        error_extensions = {
            "code": "WORKSPACE_INVITATIONS_NOT_FOUND",
            "statusCode": 404,
        }
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def validate_invitation_acceptance(
    workspace_invitations: list[WorkspaceMemberInvite],
) -> bool:
    is_workspace_invitation_responded = False
    is_workspace_invitation_accepted = False

    for invitation in workspace_invitations:
        if invitation.responded_at:
            is_workspace_invitation_responded = True
        if invitation.accepted:
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
    workspace_invitations: list[WorkspaceMemberInvite],
) -> list[WorkspaceMember]:
    for invitation in workspace_invitations:
        invitation.accepted = True
        invitation.responded_at = timezone.now()
        invitation.save()
    return list(workspace_invitations)


@sync_to_async
def get_random_workspace_id(workspace_invitations: list[WorkspaceMemberInvite]) -> str:
    return random.choice(workspace_invitations).workspace.id


@sync_to_async
def get_or_create_workspace_members(
    workspace_invitations: list[WorkspaceMemberInvite], user_id: str
) -> list[WorkspaceMember]:
    workspace_members = []
    for invitation in workspace_invitations:
        workspace_member, _ = WorkspaceMember.objects.get_or_create(
            workspace_id=invitation.workspace.id, member_id=user_id
        )
        workspace_member.role = invitation.role
        workspace_member.save()
        workspace_members.append(workspace_member)
    return list(workspace_members)


@sync_to_async
def update_user_last_workspace(user_id: str, workspace_id: str) -> None:
    user = User.objects.get(id=user_id)
    user.last_workspace_id = workspace_id
    user.save()


@sync_to_async
def delete_workspace_invitations(
    workspace_invitations: list[WorkspaceMemberInvite],
) -> None:
    for invitation in workspace_invitations:
        invitation.delete()


@strawberry.type
class WorkspaceInviteMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def join_user_workspace_invites(
        self, info: Info, invitation_ids: list[str]
    ) -> bool:
        user = info.context.user
        user_id = user.id
        user_email = user.email

        # Get the workspace invitations
        workspace_invitations = await get_invitations(
            invitation_ids=invitation_ids, email=user_email
        )

        # Validate the invitation acceptance
        is_workspace_invitation_valid = await validate_invitation_acceptance(
            workspace_invitations=workspace_invitations
        )
        if not is_workspace_invitation_valid:
            return False

        # Update the workspace invitations
        workspace_invitations = await update_workspace_invitations(
            workspace_invitations=workspace_invitations
        )

        # Get or create the workspace members
        await get_or_create_workspace_members(
            workspace_invitations=workspace_invitations, user_id=user_id
        )

        # Get a random workspace id
        random_workspace_id = await get_random_workspace_id(
            workspace_invitations=workspace_invitations
        )

        # # Update the user last workspace
        await update_user_last_workspace(
            user_id=user_id, workspace_id=random_workspace_id
        )

        # # Delete the workspace invitations
        await delete_workspace_invitations(workspace_invitations=workspace_invitations)

        return True
