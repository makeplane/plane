# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
An invitee who opens the emailed invite link while signed out is sent to the
sign-in screen with that link as ``next_path``. Every way of signing in or
signing up hands the link back whole (invitation id, workspace slug and
token), so the invite page can accept the invitation with the token once the
visitor has a session, verified email or not.
"""

import json
import uuid
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

import jwt
import pytest
from django.conf import settings
from django.core.cache import cache
from django.test import Client
from django.urls import reverse
from django.utils import timezone

from plane.db.models import Profile, User, WorkspaceMember, WorkspaceMemberInvite
from plane.license.models import Instance
from plane.settings.redis import redis_instance
from plane.tests.factories import UserFactory

INVITEE_EMAIL = "invitee@plane.so"
PASSWORD = "a-Much-Stronger-Pass-2024!"

OAUTH_PROVIDERS = {
    "google": "GoogleOAuthProvider",
    "github": "GitHubOAuthProvider",
    "gitlab": "GitLabOAuthProvider",
    "gitea": "GiteaOAuthProvider",
}


@pytest.fixture(autouse=True)
def _reset_auth_throttle_cache():
    # The per-IP auth throttle keeps its history in the cache shared by the whole session
    cache.delete_pattern("throttle_authentication_*")
    yield
    cache.delete_pattern("throttle_authentication_*")


@pytest.fixture(autouse=True)
def instance(db):
    return Instance.objects.create(
        instance_name="Test Instance",
        instance_id=str(uuid.uuid4()),
        current_version="1.0.0",
        domain="http://localhost:8000",
        last_checked_at=timezone.now(),
        is_setup_done=True,
    )


@pytest.fixture
def invite(workspace):
    # The token is built the way WorkspaceInvitationsViewset.create builds it
    token = jwt.encode(
        {"email": {"email": INVITEE_EMAIL, "role": 15}, "timestamp": timezone.now().timestamp()},
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    return WorkspaceMemberInvite.objects.create(workspace=workspace, email=INVITEE_EMAIL, token=token, role=15)


@pytest.fixture
def invite_link(invite):
    # Same shape as the link in the invitation email (workspace_invitation_task)
    return f"/workspace-invitations/?invitation_id={invite.id}&slug={invite.workspace.slug}&token={invite.token}"


@pytest.fixture
def client():
    return Client(HTTP_USER_AGENT="Mozilla/5.0")


def _landing(response):
    """The path and query the visitor ends up on after a successful sign-in.

    Gitea redirects to it directly. Every other method redirects to the web
    app's entry page with it as the only query parameter, ``next_path``, which
    the entry page then navigates to.
    """
    assert response.status_code == 302
    target = urlparse(response.url)
    if target.path not in ("", "/"):
        return f"{target.path}?{target.query}"
    query = parse_qs(target.query)
    assert list(query) == ["next_path"]
    return query["next_path"][0]


def _magic_code(email):
    ri = redis_instance()
    # Redis outlives the test database: start from no code and no issue count
    ri.delete(f"magic_{email}", f"magic_{email}:issued")
    with patch("plane.bgtasks.magic_link_code_task.magic_link.delay"):
        response = Client().post(reverse("magic-generate"), {"email": email}, content_type="application/json")
    assert response.status_code == 200
    return json.loads(ri.get(f"magic_{email}"))["token"]


@pytest.mark.contract
@pytest.mark.django_db
class TestInviteLinkSurvivesAuthentication:
    def test_password_sign_up_returns_the_link_and_its_token_is_accepted(self, client, invite, invite_link):
        response = client.post(
            reverse("sign-up"), {"email": INVITEE_EMAIL, "password": PASSWORD, "next_path": invite_link}
        )

        assert _landing(response) == invite_link
        user = User.objects.get(email=INVITEE_EMAIL)
        assert user.is_email_verified is False

        # The new session accepts the invitation with the token from the link
        join_url = reverse("workspace-join", kwargs={"slug": invite.workspace.slug, "pk": invite.id})
        accept_response = client.post(
            join_url, {"accepted": True, "token": invite.token}, content_type="application/json"
        )

        assert accept_response.status_code == 200
        assert WorkspaceMember.objects.filter(workspace=invite.workspace, member=user, is_active=True).exists()

    def test_password_sign_in_returns_the_link(self, client, invite_link):
        UserFactory(email=INVITEE_EMAIL, password=PASSWORD)

        response = client.post(
            reverse("sign-in"), {"email": INVITEE_EMAIL, "password": PASSWORD, "next_path": invite_link}
        )

        assert _landing(response) == invite_link

    def test_failed_password_sign_in_returns_to_the_form_with_the_link(self, client, invite_link):
        UserFactory(email=INVITEE_EMAIL, password=PASSWORD)

        response = client.post(
            reverse("sign-in"), {"email": INVITEE_EMAIL, "password": "wrong-password", "next_path": invite_link}
        )

        query = parse_qs(urlparse(response.url).query)
        assert "error_code" in query
        assert query["next_path"] == [invite_link]

    def test_magic_code_sign_up_returns_the_link(self, client, invite_link):
        code = _magic_code(INVITEE_EMAIL)

        response = client.post(
            reverse("magic-sign-up"), {"email": INVITEE_EMAIL, "code": code, "next_path": invite_link}
        )

        assert _landing(response) == invite_link

    @pytest.mark.parametrize("is_onboarded", [False, True])
    def test_magic_code_sign_in_returns_the_link(self, client, invite_link, is_onboarded):
        # An account that only ever signed in with codes keeps an auto-set password
        user = UserFactory(email=INVITEE_EMAIL, is_password_autoset=True)
        Profile.objects.create(user=user, is_onboarded=is_onboarded)
        code = _magic_code(INVITEE_EMAIL)

        response = client.post(
            reverse("magic-sign-in"), {"email": INVITEE_EMAIL, "code": code, "next_path": invite_link}
        )

        assert _landing(response) == invite_link

    @pytest.mark.parametrize("provider", OAUTH_PROVIDERS)
    def test_oauth_sign_in_returns_the_link(self, client, invite_link, provider):
        user = UserFactory(email=INVITEE_EMAIL)

        with patch(f"plane.authentication.views.app.{provider}.{OAUTH_PROVIDERS[provider]}") as provider_class:
            provider_class.return_value.get_auth_url.return_value = "https://idp.example.com/authorize"
            provider_class.return_value.authenticate.return_value = user

            # The web app sends next_path percent-encoded; the test client encodes it the same way
            client.get(reverse(f"{provider}-initiate"), {"next_path": invite_link})
            response = client.get(
                reverse(f"{provider}-callback"), {"code": "oauth-code", "state": client.session["state"]}
            )

        assert _landing(response) == invite_link
