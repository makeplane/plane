# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Notifications of Team Ops. They live in their own table so the core inbox is never touched."""

# Module imports
from plane.db.models import WorkspaceMember
from plane.team_ops.models import OpsNotification, OpsTeamMember

ADMIN_ROLE = 20


def notify(workspace, users, kind, title, body="", link="", actor=None):
    """One notification for each person in `users` (ids or users), never for the actor."""
    ids = {getattr(user, "id", user) for user in users}
    if actor is not None:
        ids.discard(actor.id)
    OpsNotification.objects.bulk_create(
        [
            OpsNotification(
                workspace=workspace,
                user_id=user_id,
                actor=actor,
                kind=kind,
                title=title[:200],
                body=body,
                link=link[:300],
            )
            for user_id in ids
        ]
    )
    return len(ids)


def managers_of(workspace, user):
    """The people who are told when something is wrong with `user`'s work: admins and the leads of their teams."""
    admins = set(
        WorkspaceMember.objects.filter(workspace=workspace, role=ADMIN_ROLE, is_active=True).values_list(
            "member_id", flat=True
        )
    )
    team_ids = OpsTeamMember.objects.filter(user=user, team__workspace=workspace).values("team_id")
    leads = set(
        OpsTeamMember.objects.filter(team_id__in=team_ids, role=OpsTeamMember.Role.LEAD).values_list(
            "user_id", flat=True
        )
    )
    return (admins | leads) - {user.id}
