# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import patch
import pytest
from rest_framework import status

from plane.db.models import (
    Project,
    ProjectMember,
    ProjectMemberInvite,
    WorkspaceMember,
)


@pytest.mark.contract
class TestProjectInvitationsAPI:

    @pytest.mark.django_db
    @patch("plane.app.views.project.invite.project_invitation.delay")
    def test_create_project_invitation_success(self, mock_delay, session_client, workspace, create_user):
        """Test inviting a user to a project creates ProjectMemberInvite and triggers task."""
        project = Project.objects.create(name="Invite Test Project", identifier="ITP", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/invitations/"
        data = {
            "emails": [
                {"email": "newuser@example.com", "role": 15}
            ]
        }

        response = session_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["message"] == "Email sent successfully"

        # Verify ProjectMemberInvite DB record
        invites = ProjectMemberInvite.objects.filter(project=project, email="newuser@example.com")
        assert invites.count() == 1
        invite = invites.first()
        assert invite.role == 15

        # Verify Celery delay was called
        mock_delay.assert_called_once()
        args, _ = mock_delay.call_args
        assert args[0] == "newuser@example.com"
        assert str(args[1]) == str(project.id)

    @pytest.mark.django_db
    def test_create_project_invitation_empty_emails(self, session_client, workspace, create_user):
        """Test sending empty emails array returns 400 Bad Request."""
        project = Project.objects.create(name="Invite Test Project 2", identifier="ITP2", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/invitations/"
        response = session_client.post(url, {"emails": []}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["error"] == "Emails are required"

    @pytest.mark.django_db
    def test_create_project_invitation_mixed_case_role_validation(self, session_client, workspace, create_user):
        """Test that mixed-case email lookup matches existing member and enforces role check."""
        from plane.db.models import User
        existing_member_user = User.objects.create_user(email="guest@example.com", username="guestmember")
        # Add user as guest (role=5) in workspace
        WorkspaceMember.objects.create(workspace=workspace, member=existing_member_user, role=5, is_active=True)

        project = Project.objects.create(name="Invite Test Project 3", identifier="ITP3", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        url = f"/api/workspaces/{workspace.slug}/projects/{project.id}/invitations/"
        # Attempting to invite ' Guest@Example.com ' with role 15 when workspace role is 5
        data = {
            "emails": [
                {"email": " Guest@Example.com ", "role": 15}
            ]
        }

        response = session_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["error"] == "You cannot invite a user with different role than workspace role"

