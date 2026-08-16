# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""P10B: invited-user password signup must not 500 after account provisioning."""

import uuid
from unittest.mock import patch

import pytest
from django.core.cache import cache
from django.test import Client
from django.urls import reverse
from django.utils import timezone
from kombu.exceptions import OperationalError
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Profile, User, Workspace, WorkspaceMember, WorkspaceMemberInvite
from plane.license.models import Instance


SIGNUP_PASSWORD = "Str0ng-Pass!42"


def _clear_auth_throttle():
    cache.delete_pattern("throttle_authentication_*")


@pytest.fixture(autouse=True)
def _reset_auth_throttle():
    _clear_auth_throttle()
    yield
    _clear_auth_throttle()


@pytest.fixture
def setup_instance(db):
    instance_id = uuid.uuid4() if not Instance.objects.exists() else Instance.objects.first().id
    instance, _ = Instance.objects.update_or_create(
        id=instance_id,
        defaults={
            "instance_name": "Test Instance",
            "instance_id": str(uuid.uuid4()),
            "current_version": "1.0.0",
            "last_checked_at": timezone.now(),
            "is_setup_done": True,
        },
    )
    return instance


@pytest.fixture
def django_client():
    return Client(
        HTTP_USER_AGENT="Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1"
    )


def _create_user(email, first_name="Owner"):
    user = User.objects.create(email=email, username=email.split("@")[0], first_name=first_name)
    user.set_password(SIGNUP_PASSWORD)
    user.save()
    return user


def _create_workspace(owner, slug="invite-signup"):
    workspace = Workspace.objects.create(name=slug, owner=owner, slug=slug)
    WorkspaceMember.objects.create(workspace=workspace, member=owner, role=20)
    return workspace


def _create_invite(workspace, email, token="invite-token", role=15, accepted=True, created_by=None):
    return WorkspaceMemberInvite.objects.create(
        workspace=workspace,
        email=email,
        token=token,
        role=role,
        accepted=accepted,
        created_by=created_by or workspace.owner,
    )


def _post_signup(client, email, next_path=None):
    payload = {"email": email, "password": SIGNUP_PASSWORD}
    if next_path:
        payload["next_path"] = next_path
    return client.post(reverse("sign-up"), payload, follow=False)


@pytest.mark.contract
class TestInvitedUserSignup:
    @pytest.mark.django_db
    def test_invited_signup_redirects_and_provisions_membership(self, django_client, setup_instance, db):
        """Accepted workspace invite + new password signup must redirect, not 500."""
        owner = _create_user("owner-signup@plane.so")
        workspace = _create_workspace(owner)
        invite_email = "new-invitee@plane.so"
        _create_invite(workspace, invite_email, role=15, accepted=True)

        response = _post_signup(django_client, invite_email)

        assert response.status_code == 302, response.content[:500]
        assert "/auth/sign-up/" not in (response.url or "")
        user = User.objects.get(email=invite_email)
        assert user.username
        assert user.username != invite_email
        assert Profile.objects.filter(user=user).exists()
        member = WorkspaceMember.objects.get(workspace=workspace, member=user)
        assert member.role == 15
        assert not WorkspaceMemberInvite.objects.filter(email=invite_email, workspace=workspace).exists()

    @pytest.mark.django_db
    def test_signup_without_invitation_still_creates_user(self, django_client, setup_instance, db):
        email = "plain-signup@plane.so"
        response = _post_signup(django_client, email)

        assert response.status_code == 302, response.content[:500]
        assert User.objects.filter(email=email).exists()
        assert Profile.objects.filter(user__email=email).exists()
        assert WorkspaceMember.objects.filter(member__email=email).count() == 0

    @pytest.mark.django_db
    def test_pending_invite_is_not_auto_joined_without_accept(self, django_client, setup_instance, db):
        """Unaccepted invites must not grant membership during signup (token/auth still required)."""
        owner = _create_user("owner-pending@plane.so")
        workspace = _create_workspace(owner, slug="pending-invite")
        email = "pending-invitee@plane.so"
        _create_invite(workspace, email, accepted=False, token="pending-token")

        response = _post_signup(django_client, email)

        assert response.status_code == 302
        user = User.objects.get(email=email)
        assert not WorkspaceMember.objects.filter(workspace=workspace, member=user).exists()
        assert WorkspaceMemberInvite.objects.filter(email=email, accepted=False).exists()

    @pytest.mark.django_db
    def test_retry_does_not_duplicate_membership(self, django_client, setup_instance, db):
        owner = _create_user("owner-retry@plane.so")
        workspace = _create_workspace(owner, slug="retry-invite")
        email = "retry-invitee@plane.so"
        _create_invite(workspace, email, accepted=True)

        first = _post_signup(django_client, email)
        assert first.status_code == 302
        second = _post_signup(django_client, email)

        assert second.status_code == 302
        assert "USER_ALREADY_EXIST" in (second.url or "")
        user = User.objects.get(email=email)
        assert WorkspaceMember.objects.filter(workspace=workspace, member=user).count() == 1

    @pytest.mark.django_db
    def test_multiple_accepted_invites_create_one_member_per_workspace(self, django_client, setup_instance, db):
        owner = _create_user("owner-multi@plane.so")
        workspace_a = _create_workspace(owner, slug="multi-a")
        workspace_b = _create_workspace(owner, slug="multi-b")
        email = "multi-invitee@plane.so"
        _create_invite(workspace_a, email, token="tok-a", accepted=True)
        _create_invite(workspace_b, email, token="tok-b", accepted=True)

        response = _post_signup(django_client, email)

        assert response.status_code == 302
        user = User.objects.get(email=email)
        assert WorkspaceMember.objects.filter(member=user, workspace=workspace_a).count() == 1
        assert WorkspaceMember.objects.filter(member=user, workspace=workspace_b).count() == 1

    @pytest.mark.django_db
    def test_wrong_email_cannot_claim_invite_on_signup(self, django_client, setup_instance, db):
        owner = _create_user("owner-claim@plane.so")
        workspace = _create_workspace(owner, slug="claim-invite")
        _create_invite(workspace, "real-invitee@plane.so", accepted=True)

        response = _post_signup(django_client, "squatter@plane.so")

        assert response.status_code == 302
        squatter = User.objects.get(email="squatter@plane.so")
        assert not WorkspaceMember.objects.filter(workspace=workspace, member=squatter).exists()
        assert WorkspaceMemberInvite.objects.filter(email="real-invitee@plane.so").exists()

    @pytest.mark.django_db
    def test_existing_user_signup_is_rejected(self, django_client, setup_instance, db):
        existing = _create_user("already@plane.so")
        response = _post_signup(django_client, existing.email)
        assert response.status_code == 302
        assert "USER_ALREADY_EXIST" in (response.url or "")


@pytest.mark.contract
class TestInvitationAcceptGuards:
    @pytest.mark.django_db
    def test_invalid_token_rejected(self, setup_instance, db):
        owner = _create_user("owner-token@plane.so")
        workspace = _create_workspace(owner, slug="token-invite")
        invitee = _create_user("token-invitee@plane.so")
        invite = _create_invite(workspace, invitee.email, token="good-token", accepted=False)

        client = APIClient()
        client.force_authenticate(user=invitee)
        url = reverse("workspace-join", args=[workspace.slug, invite.id])
        response = client.post(url, {"token": "bad-token", "accepted": True}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not WorkspaceMember.objects.filter(workspace=workspace, member=invitee).exists()

    @pytest.mark.django_db
    def test_cross_workspace_accept_rejected(self, setup_instance, db):
        owner = _create_user("owner-cross@plane.so")
        workspace_a = _create_workspace(owner, slug="cross-a")
        workspace_b = _create_workspace(owner, slug="cross-b")
        invitee = _create_user("cross-invitee@plane.so")
        invite = _create_invite(workspace_a, invitee.email, token="cross-token", accepted=False)

        client = APIClient()
        client.force_authenticate(user=invitee)
        url = reverse("workspace-join", args=[workspace_b.slug, invite.id])
        response = client.post(url, {"token": "cross-token", "accepted": True}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert not WorkspaceMember.objects.filter(workspace=workspace_a, member=invitee).exists()

    @pytest.mark.django_db
    def test_wrong_email_cannot_accept_join_endpoint(self, setup_instance, db):
        owner = _create_user("owner-join-claim@plane.so")
        workspace = _create_workspace(owner, slug="join-claim")
        invite = _create_invite(workspace, "bound@plane.so", token="bound-token", accepted=False)
        squatter = _create_user("join-squatter@plane.so")

        client = APIClient()
        client.force_authenticate(user=squatter)
        url = reverse("workspace-join", args=[workspace.slug, invite.id])
        response = client.post(url, {"token": "bound-token", "accepted": True}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not WorkspaceMember.objects.filter(workspace=workspace, member=squatter).exists()


@pytest.mark.contract
class TestSignupSideEffectIsolation:
    @pytest.mark.django_db
    @patch("plane.authentication.utils.workspace_project_join.track_event.delay")
    def test_broker_outage_does_not_500_invited_signup(self, mock_delay, django_client, setup_instance, db):
        mock_delay.side_effect = OperationalError("broker unavailable")
        owner = _create_user("owner-broker@plane.so")
        workspace = _create_workspace(owner, slug="broker-invite")
        email = "broker-invitee@plane.so"
        _create_invite(workspace, email, accepted=True)

        with patch("plane.authentication.utils.workspace_project_join.log_exception") as mock_log:
            response = _post_signup(django_client, email)

        assert response.status_code == 302, response.content[:500]
        assert "/auth/sign-up/" not in (response.url or "")
        user = User.objects.get(email=email)
        assert WorkspaceMember.objects.filter(workspace=workspace, member=user).exists()
        mock_delay.assert_called()
        mock_log.assert_called()

    @pytest.mark.django_db
    @patch("plane.utils.cache.cache.keys", side_effect=RuntimeError("redis keys disabled"))
    def test_cache_invalidation_failure_does_not_500(self, _mock_keys, django_client, setup_instance, db):
        owner = _create_user("owner-cache@plane.so")
        workspace = _create_workspace(owner, slug="cache-invite")
        email = "cache-invitee@plane.so"
        _create_invite(workspace, email, accepted=True)

        response = _post_signup(django_client, email)

        assert response.status_code == 302, response.content[:500]
        user = User.objects.get(email=email)
        assert WorkspaceMember.objects.filter(workspace=workspace, member=user).exists()
        assert not WorkspaceMemberInvite.objects.filter(email=email).exists()
