# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Invitation updates (``PATCH /api/workspaces/<slug>/invitations/<pk>/``) may only
change ``role``, and members may only assign invitation roles up to their own
role, the same rule ``create()`` applies.
"""

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import WorkspaceMember, WorkspaceMemberInvite
from plane.tests.factories import UserFactory


def _url(slug, pk):
    return f"/api/workspaces/{slug}/invitations/{pk}/"


@pytest.fixture
def member_client(workspace):
    user = UserFactory(username="invite-member")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15, is_active=True)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def invite(workspace):
    return WorkspaceMemberInvite.objects.create(workspace=workspace, email="invitee@plane.so", token="t", role=15)


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceInvitationUpdate:
    def test_member_invite_role_capped_at_own_role(self, member_client, workspace, invite):
        response = member_client.patch(_url(workspace.slug, invite.id), {"role": 20}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        invite.refresh_from_db()
        assert invite.role == 15

    def test_member_can_set_role_up_to_own(self, member_client, workspace, invite):
        response = member_client.patch(_url(workspace.slug, invite.id), {"role": 5}, format="json")

        assert response.status_code == status.HTTP_200_OK
        invite.refresh_from_db()
        assert invite.role == 5

    def test_admin_can_raise_invite_to_admin(self, session_client, workspace, invite):
        response = session_client.patch(_url(workspace.slug, invite.id), {"role": 20}, format="json")

        assert response.status_code == status.HTTP_200_OK
        invite.refresh_from_db()
        assert invite.role == 20

    @pytest.mark.parametrize("body", [{"accepted": True}, {"role": 5, "accepted": True}, ["role"]])
    def test_fields_other_than_role_are_rejected(self, session_client, workspace, invite, body):
        response = session_client.patch(_url(workspace.slug, invite.id), body, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        invite.refresh_from_db()
        assert invite.role == 15
        assert invite.accepted is False
