# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import transaction
from django.utils import timezone

# Module imports
from plane.db.models import (
    ProjectMember,
    ProjectMemberInvite,
    WorkspaceMember,
    WorkspaceMemberInvite,
)
from plane.utils.cache import invalidate_cache_directly
from plane.bgtasks.event_tracking_task import track_event
from plane.utils.analytics_events import USER_JOINED_WORKSPACE
from plane.utils.exception_logger import log_exception


def _safe_invalidate_workspace_members(workspace_slug):
    try:
        invalidate_cache_directly(
            path=f"/api/workspaces/{workspace_slug}/members/",
            url_params=False,
            user=False,
            multiple=True,
        )
    except Exception as exc:
        log_exception(exc)


def _safe_track_workspace_join(user, workspace, role):
    try:
        track_event.delay(
            user_id=str(user.id),
            event_name=USER_JOINED_WORKSPACE,
            slug=workspace.slug,
            event_properties={
                "user_id": str(user.id),
                "workspace_id": str(workspace.id),
                "workspace_slug": workspace.slug,
                "role": role,
                "joined_at": str(timezone.now().isoformat()),
            },
        )
    except Exception as exc:
        log_exception(exc)


def process_workspace_project_invitations(user):
    """Provision membership for invitations this email has already accepted.

    Database writes (members + invitation lifecycle) commit first. Cache
    invalidation and analytics enqueue are non-critical: they must not turn a
    completed signup into HTTP 500.
    """

    workspace_member_invites = list(
        WorkspaceMemberInvite.objects.filter(email__iexact=user.email, accepted=True).select_related("workspace")
    )
    project_member_invites = list(
        ProjectMemberInvite.objects.filter(email__iexact=user.email, accepted=True).select_related(
            "workspace", "project"
        )
    )

    with transaction.atomic():
        if workspace_member_invites:
            WorkspaceMember.objects.bulk_create(
                [
                    WorkspaceMember(
                        workspace_id=invite.workspace_id,
                        member=user,
                        role=invite.role,
                    )
                    for invite in workspace_member_invites
                ],
                ignore_conflicts=True,
            )

        if project_member_invites:
            WorkspaceMember.objects.bulk_create(
                [
                    WorkspaceMember(
                        workspace_id=invite.workspace_id,
                        role=(invite.role if invite.role in [5, 15] else 15),
                        member=user,
                        created_by_id=invite.created_by_id,
                    )
                    for invite in project_member_invites
                ],
                ignore_conflicts=True,
            )
            ProjectMember.objects.bulk_create(
                [
                    ProjectMember(
                        project_id=invite.project_id,
                        workspace_id=invite.workspace_id,
                        role=(invite.role if invite.role in [5, 15] else 15),
                        member=user,
                        created_by_id=invite.created_by_id,
                    )
                    for invite in project_member_invites
                ],
                ignore_conflicts=True,
            )

        if workspace_member_invites:
            WorkspaceMemberInvite.objects.filter(id__in=[invite.id for invite in workspace_member_invites]).delete()
        if project_member_invites:
            ProjectMemberInvite.objects.filter(id__in=[invite.id for invite in project_member_invites]).delete()

    for invite in workspace_member_invites:
        _safe_invalidate_workspace_members(invite.workspace.slug)
        _safe_track_workspace_join(user, invite.workspace, invite.role)
