# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
``POST /api/workspaces/<slug>/invitations/`` takes ``emails`` as a list of
objects, each with an ``email`` and an optional integer ``role``. Any other
shape is refused with a 400.
"""

from unittest.mock import patch

import pytest
from rest_framework import status

from plane.db.models import WorkspaceMemberInvite


def _url(slug):
    return f"/api/workspaces/{slug}/invitations/"


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceInvitationCreatePayload:
    @pytest.mark.parametrize(
        "emails",
        [
            ["invitee@plane.so"],
            "invitee@plane.so",
            {"email": "invitee@plane.so", "role": 5},
            [{"email": "invitee@plane.so", "role": "admin"}],
            [{"email": 5, "role": 5}],
            [{"role": 5}],
        ],
    )
    def test_malformed_emails_are_refused(self, session_client, workspace, emails):
        response = session_client.post(_url(workspace.slug), {"emails": emails, "role": 5}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not WorkspaceMemberInvite.objects.filter(workspace=workspace).exists()

    def test_list_of_objects_is_accepted(self, session_client, workspace):
        with patch("plane.app.views.workspace.invite.workspace_invitation.delay") as send:
            response = session_client.post(
                _url(workspace.slug), {"emails": [{"email": "Invitee@plane.so", "role": 15}]}, format="json"
            )

        assert response.status_code == status.HTTP_200_OK
        assert WorkspaceMemberInvite.objects.filter(workspace=workspace, email="invitee@plane.so", role=15).exists()
        send.assert_called_once()
