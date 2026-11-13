# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Regression tests for ``ProjectInvitationsViewset.create``.

The endpoint crashed with a 500 on every non-empty request:

* the workspace-role check read ``.role`` off a ``QuerySet`` (``AttributeError``)
* the email dispatch called ``.delay`` on the list returned by ``bulk_create``
  instead of the ``project_invitation`` Celery task, which was never imported

so no project invitation email could ever be sent.
"""

from unittest import mock

import pytest
from rest_framework import status

from plane.db.models import Project, ProjectMember, ProjectMemberInvite, User, WorkspaceMember

ADMIN = 20
MEMBER = 15
GUEST = 5


def _invitations_url(slug, project_id):
    return f"/api/workspaces/{slug}/projects/{project_id}/invitations/"


@pytest.fixture
def project(workspace, create_user):
    project = Project.objects.create(name="Invite Project", identifier="INV", workspace=workspace)
    ProjectMember.objects.create(project=project, member=create_user, role=ADMIN, is_active=True)
    return project


@pytest.fixture
def mock_project_invitation():
    """Stub the Celery task (broker) and base_host (needs APP_BASE_URL / WEB_URL,
    unset in the test env)."""
    with (
        mock.patch("plane.app.views.project.invite.project_invitation") as task,
        mock.patch("plane.app.views.project.invite.base_host", return_value="http://testserver"),
    ):
        yield task


def _add_workspace_member(workspace, email, role):
    user = User.objects.create(email=email, username=email.split("@")[0])
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role, is_active=True)
    return user


@pytest.mark.contract
@pytest.mark.django_db
class TestProjectInvitationCreate:
    def test_invite_saves_invitation_and_queues_email(
        self, session_client, workspace, project, create_user, mock_project_invitation
    ):
        response = session_client.post(
            _invitations_url(workspace.slug, project.id),
            {"emails": [{"email": "New.Person@Example.com", "role": MEMBER}]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        invite = ProjectMemberInvite.objects.get(project=project)
        assert invite.email == "new.person@example.com"
        assert invite.role == MEMBER

        mock_project_invitation.delay.assert_called_once()
        email, project_id, token, current_site, invitor = mock_project_invitation.delay.call_args.args
        assert email == invite.email
        assert str(project_id) == str(project.id)
        assert token == invite.token
        assert current_site == "http://testserver"
        assert invitor == create_user.email

    def test_invite_queues_one_email_per_invitation(self, session_client, workspace, project, mock_project_invitation):
        emails = [{"email": f"person{i}@example.com", "role": MEMBER} for i in range(3)]

        response = session_client.post(_invitations_url(workspace.slug, project.id), {"emails": emails}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert ProjectMemberInvite.objects.filter(project=project).count() == 3
        queued = sorted(call.args[0] for call in mock_project_invitation.delay.call_args_list)
        assert queued == [f"person{i}@example.com" for i in range(3)]

    def test_workspace_guest_can_be_invited_with_the_same_role(
        self, session_client, workspace, project, mock_project_invitation
    ):
        _add_workspace_member(workspace, "guest@example.com", GUEST)

        response = session_client.post(
            _invitations_url(workspace.slug, project.id),
            # role sent as a string, as JSON clients commonly do
            {"emails": [{"email": "guest@example.com", "role": str(GUEST)}]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert ProjectMemberInvite.objects.filter(project=project, email="guest@example.com").exists()
        mock_project_invitation.delay.assert_called_once()

    def test_workspace_guest_cannot_be_invited_with_a_different_role(
        self, session_client, workspace, project, mock_project_invitation
    ):
        _add_workspace_member(workspace, "guest@example.com", GUEST)

        response = session_client.post(
            _invitations_url(workspace.slug, project.id),
            {"emails": [{"email": "guest@example.com", "role": MEMBER}]},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not ProjectMemberInvite.objects.filter(project=project).exists()
        mock_project_invitation.delay.assert_not_called()

    def test_role_check_matches_workspace_member_regardless_of_email_case(
        self, session_client, workspace, project, mock_project_invitation
    ):
        _add_workspace_member(workspace, "guest@example.com", GUEST)

        response = session_client.post(
            _invitations_url(workspace.slug, project.id),
            {"emails": [{"email": "Guest@Example.COM", "role": ADMIN}]},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["error"] == "You cannot invite a user with different role than workspace role"
        assert not ProjectMemberInvite.objects.filter(project=project).exists()
        mock_project_invitation.delay.assert_not_called()

    def test_invite_requires_emails(self, session_client, workspace, project, mock_project_invitation):
        response = session_client.post(_invitations_url(workspace.slug, project.id), {"emails": []}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        mock_project_invitation.delay.assert_not_called()
