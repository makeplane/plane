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
def get_public_user_workspace_invite(invitation_id: str, email: str) -> WorkspaceInviteType:
    try:
        workspace_invite = WorkspaceMemberInvite.objects.get(id=invitation_id, email=email)
        return workspace_invite
    except WorkspaceMemberInvite.DoesNotExist:
        message = "Workspace invitation not found"
        error_extensions = {"code": "WORKSPACE_INVITATION_NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@strawberry.type
class PublicWorkspaceInviteQuery:
    # public workspace invite
    @strawberry.field()
    async def public_user_workspace_invite(self, info: Info, invitation_id: str, email: str) -> WorkspaceInviteType:
        workspace_invite = await get_public_user_workspace_invite(invitation_id=invitation_id, email=email)
        return workspace_invite
