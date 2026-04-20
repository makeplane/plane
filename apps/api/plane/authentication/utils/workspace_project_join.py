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

# Django imports
from django.utils import timezone

# Module imports
from plane.db.models import (
    ProjectMember,
    ProjectMemberInvite,
    WorkspaceMember,
    WorkspaceMemberInvite,
)
from plane.permissions.system_roles import (
    resolve_project_role_for_ws_member,
    get_project_roles_for_workspace,
    project_role_from_member_role,
    member_role_from_role_ref,
)
from plane.utils.cache import invalidate_cache_directly
from plane.bgtasks.event_tracking_task import track_event
from plane.utils.analytics_events import USER_JOINED_WORKSPACE
from plane.payment.bgtasks.member_sync_task import member_sync_task


def process_workspace_project_invitations(user):
    """This function takes in User and adds him to all workspace and projects that the user has accepted invited of"""

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
        track_event.delay(
            user_id=user.id,
            event_name=USER_JOINED_WORKSPACE,
            workspace_slug=workspace_member_invite.workspace.slug,
            event_properties={
                "user_id": user.id,
                "workspace_id": workspace_member_invite.workspace.id,
                "workspace_slug": workspace_member_invite.workspace.slug,
                "role": workspace_member_invite.role,
                "joined_at": str(timezone.now().isoformat()),
            },
        )

    # Sync workspace members
    for workspace_member_invite in workspace_member_invites:
        member_sync_task.delay(workspace_member_invite.workspace.slug)

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

    # Resolve project roles using auto-join mapping with ceiling enforcement.
    # The workspace members were just created above (via bulk_create, so role_ref may be NULL).
    # Fall back to numeric role mapping when role_ref is unavailable.
    user_ws_members = {
        wm.workspace_id: wm
        for wm in WorkspaceMember.objects.filter(
            member=user, is_active=True, deleted_at__isnull=True
        ).select_related("role_ref")
    }
    role_caches = {}
    for pmi in project_member_invites:
        if pmi.workspace_id not in role_caches:
            role_caches[pmi.workspace_id] = get_project_roles_for_workspace(pmi.workspace_id)

    bulk_project_members = []
    for pmi in project_member_invites:
        ws_member = user_ws_members.get(pmi.workspace_id)
        cache = role_caches.get(pmi.workspace_id, {})
        if ws_member:
            proj_role = resolve_project_role_for_ws_member(ws_member, pmi.workspace_id, cache)
        else:
            # No workspace membership found — use invite role with fallback
            slug = project_role_from_member_role(pmi.role if pmi.role in [5, 15] else 15)
            proj_role = cache.get(slug)
        bulk_project_members.append(
            ProjectMember(
                project_id=pmi.project_id,
                workspace_id=pmi.workspace_id,
                role=member_role_from_role_ref(proj_role, default=(pmi.role if pmi.role in [5, 15] else 15)),
                role_ref=proj_role,
                member=user,
                created_by_id=pmi.created_by_id,
            )
        )
    ProjectMember.objects.bulk_create(bulk_project_members, ignore_conflicts=True)

    # Sync workspace members
    for project_member_invite in project_member_invites:
        member_sync_task.delay(project_member_invite.workspace.slug)

    # Delete all the invites
    workspace_member_invites.delete()
    project_member_invites.delete()
