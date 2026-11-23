# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Invitations addressed to an account's email can be listed and accepted without
the emailed invite token only once that email is verified. The emailed token
still admits the matching account into the workspace it was issued for.

An instance without SMTP can neither verify an email nor deliver the invite
link, so there the email match alone still claims the invitation.
"""

import pytest
from django.test import Client
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from plane.authentication.utils.workspace_project_join import process_workspace_project_invitations
from plane.authentication.views.app.password_management import generate_password_token
from plane.db.models import Project, ProjectMember, ProjectMemberInvite, WorkspaceMember, WorkspaceMemberInvite
from plane.tests.factories import UserFactory

INVITEE_EMAIL = "invitee@plane.so"


@pytest.fixture
def invite(workspace):
    return WorkspaceMemberInvite.objects.create(workspace=workspace, email=INVITEE_EMAIL, token="invite-token", role=15)


@pytest.fixture
def smtp(monkeypatch):
    """Set whether the instance has SMTP configured, which is read from EMAIL_HOST."""

    def _set(configured):
        if configured:
            monkeypatch.setenv("EMAIL_HOST", "smtp.plane.so")
        else:
            monkeypatch.delenv("EMAIL_HOST", raising=False)

    return _set


def _invitee(is_email_verified):
    user = UserFactory(email=INVITEE_EMAIL, is_email_verified=is_email_verified)
    client = APIClient()
    client.force_authenticate(user=user)
    return user, client


def _is_member(workspace, user):
    return WorkspaceMember.objects.filter(workspace=workspace, member=user, is_active=True).exists()


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceInvitationVerifiedEmail:
    def test_unverified_account_cannot_list_or_accept(self, workspace, invite, smtp):
        smtp(True)
        user, client = _invitee(is_email_verified=False)
        url = reverse("user-workspace-invitations")

        list_response = client.get(url)
        accept_response = client.post(url, {"invitations": [str(invite.id)]}, format="json")

        assert list_response.status_code == status.HTTP_200_OK
        assert list_response.data == []
        assert accept_response.status_code == status.HTTP_403_FORBIDDEN
        assert not _is_member(workspace, user)
        assert WorkspaceMemberInvite.objects.filter(pk=invite.pk).exists()

    def test_unverified_account_can_list_and_accept_without_smtp(self, workspace, invite, smtp):
        smtp(False)
        user, client = _invitee(is_email_verified=False)
        url = reverse("user-workspace-invitations")

        list_response = client.get(url)
        accept_response = client.post(url, {"invitations": [str(invite.id)]}, format="json")

        assert [str(item["id"]) for item in list_response.data] == [str(invite.id)]
        assert accept_response.status_code == status.HTTP_204_NO_CONTENT
        assert _is_member(workspace, user)

    @pytest.mark.parametrize("smtp_configured", [True, False])
    def test_verified_account_can_list_and_accept(self, workspace, invite, smtp, smtp_configured):
        smtp(smtp_configured)
        user, client = _invitee(is_email_verified=True)
        url = reverse("user-workspace-invitations")

        list_response = client.get(url)
        accept_response = client.post(url, {"invitations": [str(invite.id)]}, format="json")

        assert [str(item["id"]) for item in list_response.data] == [str(invite.id)]
        assert accept_response.status_code == status.HTTP_204_NO_CONTENT
        assert _is_member(workspace, user)

    @pytest.mark.parametrize("smtp_configured", [True, False])
    def test_emailed_token_admits_unverified_account_and_leaves_it_unverified(
        self, workspace, invite, smtp, smtp_configured
    ):
        smtp(smtp_configured)
        user, client = _invitee(is_email_verified=False)
        url = reverse("workspace-join", kwargs={"slug": workspace.slug, "pk": invite.id})

        response = client.post(url, {"accepted": True, "token": invite.token}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert _is_member(workspace, user)
        user.refresh_from_db()
        assert user.is_email_verified is False

    def test_accepted_invites_are_applied_on_sign_in_only_for_a_verified_email(self, workspace, invite, smtp):
        smtp(True)
        WorkspaceMemberInvite.objects.filter(pk=invite.pk).update(accepted=True)
        user, _ = _invitee(is_email_verified=False)

        process_workspace_project_invitations(user=user)
        assert not _is_member(workspace, user)

        user.is_email_verified = True
        process_workspace_project_invitations(user=user)
        assert _is_member(workspace, user)

    def test_accepted_invites_are_applied_on_sign_in_for_an_unverified_email_without_smtp(
        self, workspace, invite, smtp
    ):
        smtp(False)
        WorkspaceMemberInvite.objects.filter(pk=invite.pk).update(accepted=True)
        user, _ = _invitee(is_email_verified=False)

        process_workspace_project_invitations(user=user)

        assert _is_member(workspace, user)

    def test_accepted_project_invite_is_applied_on_sign_in(self, workspace):
        # ProjectJoinEndpoint keeps the invite row after it is accepted, so the next sign-in meets it
        project = Project.objects.create(name="Invited", identifier="INV", workspace=workspace)
        ProjectMemberInvite.objects.create(
            project=project, email=INVITEE_EMAIL, token="project-token", role=15, accepted=True
        )
        user, _ = _invitee(is_email_verified=True)

        process_workspace_project_invitations(user=user)

        assert ProjectMember.objects.filter(project=project, member=user, role=15).exists()
        assert not ProjectMemberInvite.objects.filter(email=INVITEE_EMAIL).exists()

    @pytest.mark.parametrize("url_name", ["forgot-password", "space-forgot-password"])
    def test_completed_password_reset_marks_email_verified(self, url_name):
        user, _ = _invitee(is_email_verified=False)
        uidb64, token = generate_password_token(user=user)
        url = reverse(url_name, kwargs={"uidb64": uidb64, "token": token})

        response = Client().post(url, {"password": "a-Much-Stronger-Pass-2024!"})

        assert response.status_code == 302
        assert "error_code" not in response.url
        user.refresh_from_db()
        assert user.is_email_verified is True
