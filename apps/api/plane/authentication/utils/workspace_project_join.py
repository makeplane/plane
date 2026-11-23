# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import os

# Module imports
from plane.db.models import (
    ProjectMember,
    ProjectMemberInvite,
    WorkspaceMember,
    WorkspaceMemberInvite,
)
from plane.license.utils.instance_value import get_configuration_value
from plane.utils.cache import invalidate_cache_directly


def can_claim_invites_by_email(user):
    """Whether the invites addressed to the user's email can be claimed without the emailed invite token.

    A verified email always can. An unverified one only can on an instance without SMTP:
    nothing can be mailed there, so no verification code reaches the account and no
    invite link reaches the invitee.
    """
    if user.is_email_verified:
        return True
    (email_host,) = get_configuration_value([{"key": "EMAIL_HOST", "default": os.environ.get("EMAIL_HOST", "")}])
    return not email_host


def process_workspace_project_invitations(user):
    """This function takes in User and adds him to all workspace and projects that the user has accepted invited of"""

    # Applied on sign-in without the emailed invite token
    if not can_claim_invites_by_email(user):
        return

    # Check if user has any accepted invites for workspace and add them to workspace
    workspace_member_invites = WorkspaceMemberInvite.objects.filter(email=user.email, accepted=True)

    WorkspaceMember.objects.bulk_create(
        [
            WorkspaceMember(
                workspace_id=workspace_member_invite.workspace_id,
                member=user,
                role=workspace_member_invite.role,
            )
            for workspace_member_invite in workspace_member_invites
        ],
        ignore_conflicts=True,
    )

    for workspace_member_invite in workspace_member_invites:
        invalidate_cache_directly(
            path=f"/api/workspaces/{str(workspace_member_invite.workspace.slug)}/members/",
            url_params=False,
            user=False,
            multiple=True,
        )

    # Check if user has any project invites
    project_member_invites = ProjectMemberInvite.objects.filter(email=user.email, accepted=True)

    # Add user to workspace
    WorkspaceMember.objects.bulk_create(
        [
            WorkspaceMember(
                workspace_id=project_member_invite.workspace_id,
                role=(project_member_invite.role if project_member_invite.role in [5, 15] else 15),
                member=user,
                created_by_id=project_member_invite.created_by_id,
            )
            for project_member_invite in project_member_invites
        ],
        ignore_conflicts=True,
    )

    # Now add the users to project
    ProjectMember.objects.bulk_create(
        [
            ProjectMember(
                workspace_id=project_member_invite.workspace_id,
                project_id=project_member_invite.project_id,
                role=(project_member_invite.role if project_member_invite.role in [5, 15] else 15),
                member=user,
                created_by_id=project_member_invite.created_by_id,
            )
            for project_member_invite in project_member_invites
        ],
        ignore_conflicts=True,
    )

    # Delete all the invites
    workspace_member_invites.delete()
    project_member_invites.delete()
