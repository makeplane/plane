# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

from plane.db.models import Profile, Workspace

PROFILE_URL = "/api/users/me/profile/"


@pytest.fixture
def profile(create_user):
    """Profiles are created at sign-up, so the bare test user needs one."""
    return Profile.objects.create(user=create_user)


@pytest.mark.contract
class TestProfileTimeFormat:
    """The 12/24-hour clock preference on the user profile."""

    @pytest.mark.django_db
    def test_time_format_defaults_to_null(self, session_client, profile):
        """A user who never picked a clock follows the workspace default."""
        response = session_client.get(PROFILE_URL)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["time_format"] is None

    @pytest.mark.django_db
    @pytest.mark.parametrize("time_format", ["12-hour", "24-hour"])
    def test_patch_sets_time_format(self, session_client, create_user, profile, time_format):
        response = session_client.patch(PROFILE_URL, {"time_format": time_format}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["time_format"] == time_format
        assert Profile.objects.get(user=create_user).time_format == time_format

    @pytest.mark.django_db
    def test_patch_rejects_unknown_time_format(self, session_client, create_user, profile):
        response = session_client.patch(PROFILE_URL, {"time_format": "36-hour"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Profile.objects.get(user=create_user).time_format is None

    @pytest.mark.django_db
    def test_patch_can_reset_to_workspace_default(self, session_client, create_user, profile):
        Profile.objects.filter(user=create_user).update(time_format="24-hour")

        response = session_client.patch(PROFILE_URL, {"time_format": None}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert Profile.objects.get(user=create_user).time_format is None


@pytest.mark.contract
class TestWorkspaceTimeFormat:
    """The workspace default clock for members without a profile choice."""

    @pytest.mark.django_db
    def test_workspace_defaults_to_12_hour(self, session_client, workspace):
        response = session_client.get(f"/api/workspaces/{workspace.slug}/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["time_format"] == "12-hour"

    @pytest.mark.django_db
    def test_admin_can_set_workspace_time_format(self, session_client, workspace):
        response = session_client.patch(f"/api/workspaces/{workspace.slug}/", {"time_format": "24-hour"}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert Workspace.objects.get(pk=workspace.pk).time_format == "24-hour"

    @pytest.mark.django_db
    def test_workspace_rejects_unknown_time_format(self, session_client, workspace):
        response = session_client.patch(f"/api/workspaces/{workspace.slug}/", {"time_format": "36-hour"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Workspace.objects.get(pk=workspace.pk).time_format == "12-hour"
