# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The workspace user-profile endpoint gives workspace guests no email address of
another member, matching the workspace member list. The rest of the profile is
unchanged."""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import User, WorkspaceMember

PROFILE_URL = "/api/workspaces/{slug}/user-profile/{user_id}/"


def _workspace_user(workspace, role):
    unique_id = uuid4().hex[:8]
    user = User.objects.create(email=f"user-{unique_id}@plane.so", username=f"user_{unique_id}")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role)
    return user


def _profile(caller, workspace, user):
    client = APIClient()
    client.force_authenticate(user=caller)
    response = client.get(PROFILE_URL.format(slug=workspace.slug, user_id=user.id))
    assert response.status_code == status.HTTP_200_OK, response.data
    return response.data["user_data"]


@pytest.mark.contract
@pytest.mark.django_db
class TestUserProfileEmailGuestScope:
    def test_guest_gets_no_email_of_another_member(self, workspace, create_user):
        user_data = _profile(_workspace_user(workspace, role=5), workspace, create_user)

        assert "email" not in user_data
        assert user_data["first_name"] == create_user.first_name

    def test_member_still_gets_email(self, workspace, create_user):
        user_data = _profile(_workspace_user(workspace, role=15), workspace, create_user)

        assert user_data["email"] == create_user.email

    def test_guest_still_gets_own_email(self, workspace):
        guest = _workspace_user(workspace, role=5)

        assert _profile(guest, workspace, guest)["email"] == guest.email
