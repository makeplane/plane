# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

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
from plane.bgtasks.event_tracking_task import track_event
from plane.db.models import User, WorkspaceMember, WorkspaceMemberInvite
from plane.graphql.permissions.workspace import IsAuthenticated
from plane.payment.bgtasks.member_sync_task import member_sync_task
from plane.utils.analytics_events import USER_JOINED_WORKSPACE


@sync_to_async
def get_invitations(invitation_ids: list[str], email: str) -> list[WorkspaceMemberInvite]:
    try:
        workspace_invitations = WorkspaceMemberInvite.objects.filter(id__in=invitation_ids, email=email).select_related(
            "workspace"
        )

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
        workspace_member.is_active = True
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


@sync_to_async
def workspace_track_event(user_id: str, workspace_invitations: list[WorkspaceMemberInvite]) -> None:
    for invitation in workspace_invitations:
        invitation_workspace_slug = invitation.workspace.slug
        invitation_workspace_id = invitation.workspace.id
        invitation_role = invitation.role
        current_time = timezone.now()

        track_event.delay(
            user_id=user_id,
            event_name=USER_JOINED_WORKSPACE,
            workspace_slug=invitation_workspace_slug,
            event_properties={
                "user_id": user_id,
                "workspace_id": invitation_workspace_id,
                "workspace_slug": invitation_workspace_slug,
                "role": invitation_role,
                "joined_at": str(current_time),
            },
        )


@sync_to_async
def sync_workspace_members(workspace_invitations: list[WorkspaceMemberInvite]) -> None:
    workspace_slugs = set([invitation.workspace.slug for invitation in workspace_invitations])
    for slug in workspace_slugs:
        member_sync_task.delay(slug=slug)


@strawberry.type
class WorkspaceInviteMutation:
    @strawberry.mutation(extensions=[PermissionExtension(permissions=[IsAuthenticated()])])
    async def join_user_workspace_invites(self, info: Info, invitation_ids: list[str]) -> bool:
        user = info.context.user
        user_id = user.id
        user_email = user.email

        # Get the workspace invitations
        workspace_invitations = await get_invitations(invitation_ids=invitation_ids, email=user_email)

        # Validate the invitation acceptance
        is_workspace_invitation_valid = await validate_invitation_acceptance(
            workspace_invitations=workspace_invitations
        )
        if not is_workspace_invitation_valid:
            return False

        # Update the workspace invitations
        workspace_invitations = await update_workspace_invitations(workspace_invitations=workspace_invitations)

        # Get or create the workspace members
        await get_or_create_workspace_members(workspace_invitations=workspace_invitations, user_id=user_id)

        # Get a random workspace id
        random_workspace_id = await get_random_workspace_id(workspace_invitations=workspace_invitations)

        # Update the user last workspace
        await update_user_last_workspace(user_id=user_id, workspace_id=random_workspace_id)

        # Delete the workspace invitations
        await delete_workspace_invitations(workspace_invitations=workspace_invitations)

        # track event
        await workspace_track_event(user_id=user_id, workspace_invitations=workspace_invitations)

        # sync workspace members
        await sync_workspace_members(workspace_invitations=workspace_invitations)

        return True
