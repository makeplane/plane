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
from typing import Optional

# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Django imports
from django.utils import timezone

# Strawberry imports
from strawberry.exceptions import GraphQLError
from strawberry.types import Info

# Module imports
from plane.bgtasks.event_tracking_task import track_event
from plane.db.models import User, WorkspaceMember, WorkspaceMemberInvite
from plane.graphql.helpers.workspace import get_workspace
from plane.payment.bgtasks.member_sync_task import member_sync_task
from plane.utils.analytics_events import USER_JOINED_WORKSPACE
from plane.graphql.utils.logger import log_graphql_error


@sync_to_async
def _validate_invitation_acceptance(invitation_id: str, slug: str, token: Optional[str] = None) -> bool:
    try:
        try:
            # extracting the workspace invitation
            workspace_invitation = WorkspaceMemberInvite.objects.get(id=invitation_id, workspace__slug=slug)
        except WorkspaceMemberInvite.DoesNotExist:
            message = "Workspace invitation not found"
            error_extensions = {"code": "WORKSPACE_INVITATION_NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)

        invitation_token = workspace_invitation.token
        invitation_email = workspace_invitation.email
        invitation_workspace_id = workspace_invitation.workspace.id
        invitation_workspace_slug = workspace_invitation.workspace.slug
        invitation_role = workspace_invitation.role
        current_time = timezone.now()

        # validate invitation token
        if token and (invitation_token is None or invitation_token != token):
            message = "You do not have permission to join the workspace"
            error_extensions = {"code": "INVALID_TOKEN", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        # validate if workspace invitation has been responded
        if workspace_invitation.responded_at:
            message = "You have already responded to this invitation"
            error_extensions = {"code": "WORKSPACE_INVITE_ALREADY_ACCEPTED", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)

        # validate workspace
        get_workspace(id=invitation_workspace_id, slug=invitation_workspace_slug)

        # update the acceptance status
        workspace_invitation.accepted = True
        workspace_invitation.responded_at = current_time
        workspace_invitation.save()

        # validate invitation user email
        user = User.objects.filter(email=invitation_email).first()
        if not user:
            # sync workspace members
            member_sync_task.delay(slug=invitation_workspace_slug)
            return True

        user_id = user.id

        # validate if user is already a member of the workspace
        workspace_member = WorkspaceMember.objects.filter(
            workspace_id=invitation_workspace_id, member_id=user_id
        ).first()
        if not workspace_member:
            WorkspaceMember.objects.create(
                workspace_id=invitation_workspace_id,
                member_id=user_id,
                role=invitation_role,
            )
        else:
            workspace_member.is_active = True
            workspace_member.role = invitation_role
            workspace_member.save()

        # update the user last workspace id
        user.last_workspace_id = invitation_workspace_id
        user.save()

        # track event
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

        # delete the workspace invitation
        workspace_invitation.delete()

        # sync workspace members
        member_sync_task.delay(slug=invitation_workspace_slug)

        return True

    except Exception as e:
        log_graphql_error(message="Failed to validate invitation acceptance", error=e)
        message = "Failed to validate invitation acceptance"
        error_extensions = {"code": "FAILED_TO_VALIDATE_INVITATION_ACCEPTANCE", "statusCode": 500}
        raise GraphQLError(message, extensions=error_extensions)


@strawberry.type
class PublicWorkspaceInviteV2Mutation:
    @strawberry.mutation()
    async def accept_public_workspace_invite_v2(
        self, info: Info, invitation_id: str, slug: str, token: Optional[str] = None
    ) -> bool:
        return await _validate_invitation_acceptance(invitation_id=invitation_id, slug=slug, token=token)
