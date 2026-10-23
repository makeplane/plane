# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Regression tests for SECUR-234.

``ProjectJoinEndpoint.post`` looked up the accepting user's existing
``ProjectMember`` row by ``(workspace_id, member)`` and omitted ``project_id``.
Accepting an invitation to project Y therefore reactivated whatever membership
row the user already had in the workspace -- typically a project they had been
removed from -- while project Y itself never received a membership row at all.
A companion no-op, ``project_member.role = project_member.role``, left the
stale row at its original role, so a removed ADMIN returned as ADMIN even
though the new invite was for a GUEST.
"""

import uuid

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Project,
    ProjectMember,
    ProjectMemberInvite,
)

ADMIN = 20
GUEST = 5


def _join_url(slug: str, project_id: uuid.UUID, pk: uuid.UUID) -> str:
    return f"/api/workspaces/{slug}/projects/{project_id}/join/{pk}/"


def _make_project(workspace, name: str, identifier: str) -> Project:
    return Project.objects.create(name=name, identifier=identifier, workspace=workspace)


def _make_invite(project: Project, email: str, role: int) -> ProjectMemberInvite:
    return ProjectMemberInvite.objects.create(project=project, email=email, token=uuid.uuid4().hex, role=role)


def _accept(user, invite: ProjectMemberInvite):
    client = APIClient()
    client.force_authenticate(user=user)
    return client.post(
        _join_url(invite.workspace.slug, invite.project_id, invite.id),
        {"token": invite.token, "accepted": True},
        format="json",
    )


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectJoinCrossProjectActivation:
    def test_accepting_invite_creates_membership_on_the_invited_project(self, workspace, create_user):
        """The invited project gets the membership, even when another one already exists."""
        old_project = _make_project(workspace, "Sensitive Project", "SNS")
        invited_project = _make_project(workspace, "New Project", "NEW")
        ProjectMember.objects.create(project=old_project, member=create_user, role=ADMIN, is_active=False)
        invite = _make_invite(invited_project, create_user.email, GUEST)

        response = _accept(create_user, invite)

        assert response.status_code == status.HTTP_200_OK
        membership = ProjectMember.objects.get(project=invited_project, member=create_user)
        assert membership.is_active is True
        assert membership.role == GUEST

    def test_accepting_invite_does_not_reactivate_membership_on_another_project(self, workspace, create_user):
        """A membership the user was removed from stays inactive and keeps its role."""
        old_project = _make_project(workspace, "Sensitive Project", "SNS")
        invited_project = _make_project(workspace, "New Project", "NEW")
        removed = ProjectMember.objects.create(project=old_project, member=create_user, role=ADMIN, is_active=False)
        invite = _make_invite(invited_project, create_user.email, GUEST)

        response = _accept(create_user, invite)

        assert response.status_code == status.HTTP_200_OK
        removed.refresh_from_db()
        assert removed.is_active is False
        assert removed.role == ADMIN

    def test_reactivating_membership_on_the_invited_project_applies_the_invite_role(self, workspace, create_user):
        """Re-joining a project the user was removed from grants the invite's role, not the old one."""
        invited_project = _make_project(workspace, "New Project", "NEW")
        removed = ProjectMember.objects.create(project=invited_project, member=create_user, role=ADMIN, is_active=False)
        invite = _make_invite(invited_project, create_user.email, GUEST)

        response = _accept(create_user, invite)

        assert response.status_code == status.HTTP_200_OK
        removed.refresh_from_db()
        assert removed.is_active is True
        assert removed.role == GUEST
