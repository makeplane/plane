# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.urls import reverse
from rest_framework import status
from unittest.mock import patch

from plane.api.serializers.invite import WorkspaceInviteSerializer
from plane.db.models import WorkspaceMemberInvite


@pytest.mark.contract
class TestWorkspaceInvitationsExistingMember:
    """Inviting someone who is already an active member must be rejected"""

    @pytest.mark.django_db
    @pytest.mark.parametrize("variant", ["{email}", "{EMAIL}", "  {email}  ", "{Email}"])
    @patch("plane.app.views.workspace.invite.track_event.delay")
    @patch("plane.app.views.workspace.invite.workspace_invitation.delay")
    def test_existing_member_is_rejected_regardless_of_case_or_whitespace(
        self, mock_send, mock_track, variant, session_client, create_user, workspace
    ):
        email = create_user.email
        typed = variant.format(email=email, EMAIL=email.upper(), Email=email.capitalize())
        url = reverse("workspace-invitations", kwargs={"slug": workspace.slug})

        response = session_client.post(url, {"emails": [{"email": typed, "role": 15}]}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already member" in response.data["error"]
        assert WorkspaceMemberInvite.objects.count() == 0
        mock_send.assert_not_called()

    @pytest.mark.django_db
    @patch("plane.app.views.workspace.invite.track_event.delay")
    @patch("plane.app.views.workspace.invite.workspace_invitation.delay")
    def test_new_email_is_stored_normalised(self, mock_send, mock_track, session_client, workspace):
        url = reverse("workspace-invitations", kwargs={"slug": workspace.slug})

        response = session_client.post(url, {"emails": [{"email": "  New.Person@Example.com ", "role": 15}]}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert WorkspaceMemberInvite.objects.get().email == "new.person@example.com"


@pytest.mark.contract
class TestWorkspaceInviteSerializer:
    """Public API serializer"""

    @pytest.mark.django_db
    @pytest.mark.parametrize("typed", ["TEST@PLANE.SO", " test@plane.so "])
    def test_existing_member_is_rejected(self, typed, create_user, workspace):
        serializer = WorkspaceInviteSerializer(data={"email": typed, "role": 15}, context={"slug": workspace.slug})

        assert not serializer.is_valid()
        assert serializer.errors["non_field_errors"][0].code == "USER_ALREADY_MEMBER"

    @pytest.mark.django_db
    def test_email_is_normalised_and_duplicate_invite_is_case_insensitive(self, workspace, create_user):
        WorkspaceMemberInvite.objects.create(workspace=workspace, email="a@example.com", token="t", role=15)

        serializer = WorkspaceInviteSerializer(data={"email": "A@Example.com", "role": 15}, context={"slug": workspace.slug})

        assert not serializer.is_valid()
        assert serializer.errors["non_field_errors"][0].code == "EMAIL_ALREADY_INVITED"
