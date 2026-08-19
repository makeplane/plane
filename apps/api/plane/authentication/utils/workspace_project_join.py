# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import os

# Django imports
from django.utils import timezone

# Module imports
from plane.db.models import (
    ProjectMember,
    ProjectMemberInvite,
    Workspace,
    WorkspaceMember,
    WorkspaceMemberInvite,
)
from plane.utils.cache import invalidate_cache_directly
from plane.bgtasks.event_tracking_task import track_event
from plane.utils.analytics_events import USER_JOINED_WORKSPACE


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
            slug=workspace_member_invite.workspace.slug,
            event_properties={
                "user_id": user.id,
                "workspace_id": workspace_member_invite.workspace.id,
                "workspace_slug": workspace_member_invite.workspace.slug,
                "role": workspace_member_invite.role,
                "joined_at": str(timezone.now().isoformat()),
            },
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


def auto_join_default_workspaces(user):
    """
    If DEFAULT_WORKSPACE_SLUGS is configured and the user has no workspace memberships,
    automatically add them as a Member to all listed workspaces and mark onboarding
    complete so they land directly in the first workspace without the onboarding flow.

    DEFAULT_WORKSPACE_SLUGS accepts:
    - A comma-separated list of workspace slugs: "my-org,my-org-dev"
    - A wildcard "*" to auto-join all workspaces on the instance

    The first slug (or oldest workspace for "*") becomes the landing workspace.
    """
    from plane.license.utils.instance_value import get_configuration_value

    (slugs_raw,) = get_configuration_value(
        [{"key": "DEFAULT_WORKSPACE_SLUGS", "default": os.environ.get("DEFAULT_WORKSPACE_SLUGS", "")}]
    )
    if not slugs_raw:
        return

    slugs_raw = slugs_raw.strip()

    # Only auto-join users who have no workspace memberships yet
    if WorkspaceMember.objects.filter(member=user, is_active=True).exists():
        return

    if slugs_raw == "*":
        workspaces = list(Workspace.objects.order_by("created_at"))
        slug_order = {}  # not used for wildcard; primary = oldest workspace
    else:
        slugs = [s.strip() for s in slugs_raw.split(",") if s.strip()]
        if not slugs:
            return
        workspaces = list(Workspace.objects.filter(slug__in=slugs))
        slug_order = {s: i for i, s in enumerate(slugs)}

    if not workspaces:
        return

    WorkspaceMember.objects.bulk_create(
        [WorkspaceMember(workspace=w, member=user, role=15, is_active=True) for w in workspaces],
        ignore_conflicts=True,
    )

    # Primary (landing) workspace: first by slug order, or oldest for wildcard
    primary = workspaces[0] if slugs_raw == "*" else min(workspaces, key=lambda w: slug_order.get(w.slug, 999))

    # Mark onboarding complete so the user lands directly in the workspace
    from plane.db.models.user import Profile

    Profile.objects.filter(user=user).update(
        is_onboarded=True,
        last_workspace_id=primary.id,
        onboarding_step={
            "profile_complete": True,
            "workspace_create": True,
            "workspace_invite": True,
            "workspace_join": True,
        },
    )
