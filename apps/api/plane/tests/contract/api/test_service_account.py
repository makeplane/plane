# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for workspace service (machine) accounts.

Proves that a service account created without any invite/email/password flow is
a valid, distinct actor: it authenticates with its own API token and its writes
are attributed to it via ``created_by``.

Covered surfaces:
- the ``create_service_account`` management command, and
- the admin-scoped ``POST /api/v1/workspaces/{slug}/service-accounts/`` endpoint.
"""

from datetime import timedelta
from unittest.mock import patch

import pytest
from django.core.management import call_command
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import APIToken, BotTypeEnum, Project, ProjectMember, User, Workspace, WorkspaceMember
from plane.db.models.api import generate_token
from plane.utils.service_account import create_service_account

USERS_ME_URL = "/api/v1/users/me/"


def _client_for_token(token: str) -> APIClient:
    """Return an API client authenticated with the given API token"""
    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token)
    return client


@pytest.fixture(autouse=True)
def _reset_api_throttle():
    """Clear the shared API-key throttle cache before each test"""
    # ApiKeyRateThrottle stores per-token request counts in the shared cache and
    # is not reset between tests. This suite makes many API-key calls, so clear it
    # per test to avoid cross-test 429s (and to avoid inflating the bucket for
    # other tests that reuse the same api_key_client token).
    from django.core.cache import cache

    cache.clear()
    yield


@pytest.fixture
def service_account(db, workspace):
    """A provisioned service account (user + admin membership + one bot token)."""
    return create_service_account(workspace=workspace, name="Reconcile Bot", role="admin", username="reconcile-bot")


def _service_account_for(workspace: Workspace) -> WorkspaceMember:
    """Return the workspace's SERVICE bot membership"""
    return WorkspaceMember.objects.select_related("member").get(
        workspace=workspace,
        member__is_bot=True,
        member__bot_type=BotTypeEnum.SERVICE,
    )


@pytest.mark.contract
class TestServiceAccountCommand:
    """The management command provisions a valid, distinct, token-authing actor."""

    @pytest.mark.django_db
    def test_command_creates_active_verified_bot_member_with_token(self, workspace):
        """Test the command creates an active, email-verified bot member with a bot token"""
        call_command(
            "create_service_account",
            workspace=workspace.slug,
            name="CI Provisioner",
            role="admin",
        )

        member = _service_account_for(workspace)
        user = member.member

        # A valid actor: active + email verified, with no password round-trip.
        assert user.is_active is True
        assert user.is_email_verified is True
        assert user.is_email_valid is True
        assert user.is_bot is True
        assert user.bot_type == BotTypeEnum.SERVICE
        assert user.is_password_autoset is True
        assert user.display_name == "CI Provisioner"

        # Added as a workspace member with the requested role.
        assert member.role == 20
        assert member.is_active is True

        # A workspace-scoped bot API token was minted.
        token = APIToken.objects.get(user=user)
        assert token.user_type == 1  # Bot
        assert token.is_service is True
        assert token.workspace_id == workspace.id
        assert token.token.startswith("plane_api_")

    @pytest.mark.django_db
    def test_command_token_authenticates_as_distinct_actor(self, workspace):
        """Test the minted token authenticates as the service account itself"""
        call_command("create_service_account", workspace=workspace.slug, name="Robby", role="admin")

        user = _service_account_for(workspace).member
        token = APIToken.objects.get(user=user)

        response = _client_for_token(token.token).get(USERS_ME_URL)

        assert response.status_code == status.HTTP_200_OK
        # The token resolves to the service account itself — a distinct identity.
        assert str(response.data["id"]) == str(user.id)
        assert response.data["email"] == user.email
        assert response.data["display_name"] == "Robby"

    @pytest.mark.django_db
    def test_command_service_account_writes_are_attributed_to_it(self, workspace):
        """Test writes made with the token are attributed to the service account"""
        call_command("create_service_account", workspace=workspace.slug, name="Author Bot", role="admin")

        user = _service_account_for(workspace).member
        token = APIToken.objects.get(user=user)
        client = _client_for_token(token.token)

        response = client.post(
            f"/api/v1/workspaces/{workspace.slug}/projects/",
            {"name": "Provisioned Project", "identifier": "PROV"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        project = Project.objects.get(id=response.data["id"])
        # The write is attributed to the service account, not to any human.
        assert project.created_by_id == user.id

    @pytest.mark.django_db
    def test_command_supports_member_role(self, workspace):
        """Test the command honours the member role"""
        call_command("create_service_account", workspace=workspace.slug, name="Member Bot", role="member")

        member = _service_account_for(workspace)
        assert member.role == 15

    @pytest.mark.django_db
    def test_command_unknown_workspace_errors(self):
        """Test an unknown workspace slug raises CommandError"""
        from django.core.management.base import CommandError

        with pytest.raises(CommandError):
            call_command("create_service_account", workspace="does-not-exist", name="X", role="admin")

    @pytest.mark.django_db
    def test_command_duplicate_email_errors_cleanly(self, workspace):
        """Test a taken email raises CommandError, not a traceback"""
        User.objects.create(username="taken", email="taken@plane.so")

        from django.core.management.base import CommandError

        with pytest.raises(CommandError):
            call_command(
                "create_service_account",
                workspace=workspace.slug,
                name="Dup",
                role="admin",
                email="taken@plane.so",
            )

    @pytest.mark.django_db
    def test_command_integrity_error_becomes_command_error(self, workspace):
        """Test an IntegrityError from the helper is reported as CommandError"""
        # A uniqueness collision that slips past the pre-check (e.g. an email
        # race) surfaces as IntegrityError from the helper; the command must
        # translate it into a readable CommandError, not a raw traceback.
        from django.core.management.base import CommandError
        from django.db import IntegrityError

        with patch(
            "plane.db.management.commands.create_service_account.create_service_account",
            side_effect=IntegrityError("duplicate key value violates unique constraint"),
        ):
            with pytest.raises(CommandError):
                call_command("create_service_account", workspace=workspace.slug, name="Race", role="admin")

    @pytest.mark.django_db
    def test_command_username_and_display_name_round_trip(self, workspace):
        """Test --username and --display-name land on the created user"""
        call_command(
            "create_service_account",
            workspace=workspace.slug,
            name="CI",
            role="admin",
            username="ci-bot",
            display_name="CI Bot",
        )

        member = _service_account_for(workspace)
        assert member.member.username == "ci-bot"
        assert member.member.display_name == "CI Bot"

    @pytest.mark.django_db
    def test_command_omitted_identity_falls_back_to_synthetic(self, workspace):
        """Test the command falls back to a synthetic username and the given name"""
        call_command("create_service_account", workspace=workspace.slug, name="Fallback Bot", role="admin")

        user = _service_account_for(workspace).member
        assert user.username.startswith("svc_")
        assert user.display_name == "Fallback Bot"

    @pytest.mark.django_db
    def test_command_whitespace_identity_falls_back_to_synthetic(self, workspace):
        """Test whitespace-only identity options are normalized, not stored verbatim"""
        call_command(
            "create_service_account",
            workspace=workspace.slug,
            name="WS Bot",
            role="admin",
            username="   ",
            display_name="   ",
            email="   ",
        )

        user = _service_account_for(workspace).member
        # Whitespace-only values are treated as omitted → synthetic / name fallback.
        assert user.username.startswith("svc_")
        assert user.display_name == "WS Bot"
        assert user.email.endswith("@service.plane.local")

    @pytest.mark.django_db
    def test_command_rejects_too_long_username(self, workspace):
        """Test an over-long --username fails with CommandError, not a DB DataError"""
        from django.core.management.base import CommandError

        with pytest.raises(CommandError):
            call_command(
                "create_service_account",
                workspace=workspace.slug,
                name="Long",
                role="admin",
                username="a" * 129,  # User.username max_length is 128
            )

    @pytest.mark.django_db
    def test_command_duplicate_username_errors_cleanly(self, workspace):
        """Test a taken username raises CommandError and leaks nothing"""
        User.objects.create(username="ci-bot", email="someone@plane.so")

        from django.core.management.base import CommandError

        with pytest.raises(CommandError):
            call_command(
                "create_service_account",
                workspace=workspace.slug,
                name="Dup",
                role="admin",
                username="ci-bot",
            )

        # No partial service account leaked into the workspace.
        assert not WorkspaceMember.objects.filter(workspace=workspace, member__bot_type=BotTypeEnum.SERVICE).exists()

    @pytest.mark.django_db
    def test_command_blank_name_errors(self, workspace):
        """Test a blank --name raises CommandError"""
        from django.core.management.base import CommandError

        with pytest.raises(CommandError):
            call_command("create_service_account", workspace=workspace.slug, name="", role="admin")


@pytest.mark.contract
class TestServiceAccountEndpoint:
    """The admin-scoped HTTP endpoint mirrors the command."""

    def _url(self, slug: str) -> str:
        """Helper to get the service-accounts collection URL"""
        return f"/api/v1/workspaces/{slug}/service-accounts/"

    @pytest.mark.django_db
    def test_admin_creates_service_account_and_token_works(self, api_key_client, workspace, create_user):
        """Test an admin can create an account whose token authenticates and attributes"""
        response = api_key_client.post(
            self._url(workspace.slug),
            {"name": "HTTP Bot", "role": "admin"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["role"] == 20
        assert response.data["display_name"] == "HTTP Bot"
        token = response.data["token"]
        assert token.startswith("plane_api_")

        # Provisioning is attributed to the acting admin (via crum current-user).
        member = WorkspaceMember.objects.get(member_id=response.data["id"], workspace=workspace)
        assert member.created_by_id == create_user.id
        assert APIToken.objects.get(user_id=response.data["id"]).created_by_id == create_user.id

        # The returned token authenticates as the newly created distinct actor.
        me = _client_for_token(token).get(USERS_ME_URL)
        assert me.status_code == status.HTTP_200_OK
        assert str(me.data["id"]) == str(response.data["id"])

        # And its writes attribute to it.
        created = _client_for_token(token).post(
            f"/api/v1/workspaces/{workspace.slug}/projects/",
            {"name": "HTTP Provisioned", "identifier": "HTTPP"},
            format="json",
        )
        assert created.status_code == status.HTTP_201_CREATED, created.data
        project = Project.objects.get(id=created.data["id"])
        assert str(project.created_by_id) == str(response.data["id"])

    @pytest.mark.django_db
    def test_minted_token_is_not_persisted_in_request_log(self, api_key_client, workspace):
        """Test the created account's token is redacted from the API activity log"""
        # The admin calls this endpoint WITH their X-Api-Key, so APITokenLogMiddleware
        # runs and would otherwise persist the response body (which carries the
        # freshly minted token) into api_activity_logs in plaintext. The response is
        # flagged for body redaction; assert the logged body never contains the token.
        with patch("plane.middleware.logger.process_logs") as process_logs:
            response = api_key_client.post(
                self._url(workspace.slug),
                {"name": "Secret Bot", "role": "admin"},
                format="json",
            )
            assert response.status_code == status.HTTP_201_CREATED, response.data
            token = response.data["token"]
            assert process_logs.delay.called
            log_data = process_logs.delay.call_args.kwargs["log_data"]

        assert log_data["response_body"] == "[REDACTED]"
        assert token not in (log_data["response_body"] or "")

    @pytest.mark.django_db
    def test_non_admin_member_is_forbidden(self, api_client, workspace):
        """Test a non-admin member cannot create a service account"""
        # A guest member of the workspace is not a workspace admin.
        guest = User.objects.create(username="guest_user", email="guest@plane.so")
        guest.set_password("guest-pass")
        guest.save()
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5, is_active=True)
        guest_token = APIToken.objects.create(user=guest, label="guest-token", token=generate_token())

        response = _client_for_token(guest_token.token).post(
            self._url(workspace.slug),
            {"name": "Should Fail", "role": "admin"},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        # No service account leaked into the workspace.
        assert not WorkspaceMember.objects.filter(workspace=workspace, member__bot_type=BotTypeEnum.SERVICE).exists()

    @pytest.mark.django_db
    def test_unauthenticated_is_rejected(self, api_client, workspace):
        """Test an unauthenticated request is rejected"""
        response = api_client.post(
            self._url(workspace.slug),
            {"name": "Anon", "role": "admin"},
            format="json",
        )
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    @pytest.mark.django_db
    def test_custom_username_and_display_name(self, api_key_client, workspace):
        """Test a caller-chosen username and display name are applied"""
        response = api_key_client.post(
            self._url(workspace.slug),
            {"name": "CI", "role": "admin", "username": "ci-provisioner", "display_name": "CI Provisioner"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        # The response echoes the effective identity.
        assert response.data["username"] == "ci-provisioner"
        assert response.data["display_name"] == "CI Provisioner"
        # And it landed on the created user (so the members UI shows it).
        user = User.objects.get(id=response.data["id"])
        assert user.username == "ci-provisioner"
        assert user.display_name == "CI Provisioner"

    @pytest.mark.django_db
    def test_omitted_identity_falls_back_to_synthetic(self, api_key_client, workspace):
        """Test omitted identity falls back to a synthetic username and the given name"""
        response = api_key_client.post(
            self._url(workspace.slug),
            {"name": "Fallback Bot", "role": "admin"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["username"].startswith("svc_")
        assert response.data["display_name"] == "Fallback Bot"

    @pytest.mark.django_db
    def test_duplicate_username_is_rejected_with_code(self, api_key_client, workspace):
        """Test a duplicate username returns 409 with a machine-readable code"""
        User.objects.create(username="ci-provisioner", email="human@plane.so")

        response = api_key_client.post(
            self._url(workspace.slug),
            {"name": "CI", "role": "admin", "username": "ci-provisioner"},
            format="json",
        )

        # Collision → 409 with a machine-readable code; the name is never mutated.
        assert response.status_code == status.HTTP_409_CONFLICT, response.data
        assert response.data["code"] == "USERNAME_ALREADY_EXISTS"
        # No service account leaked into the workspace.
        assert not WorkspaceMember.objects.filter(workspace=workspace, member__bot_type=BotTypeEnum.SERVICE).exists()

    @pytest.mark.django_db
    def test_username_race_returns_409(self, api_key_client, workspace):
        """Test a username taken after the pre-check still returns 409"""
        # Simulate a race: the username is free at the pre-check, then another
        # actor creates it and our insert raises IntegrityError. The scoped
        # handler re-checks, sees it now exists, and returns the same 409.
        from django.db import IntegrityError

        def racing_create(**kwargs):
            """Take the username, then fail as the database would."""
            User.objects.create(username="raced", email="racer@plane.so")
            raise IntegrityError("duplicate key value violates unique constraint")

        with patch("plane.api.views.service_account.create_service_account", side_effect=racing_create):
            response = api_key_client.post(
                self._url(workspace.slug),
                {"name": "Race", "role": "admin", "username": "raced"},
                format="json",
            )

        assert response.status_code == status.HTTP_409_CONFLICT, response.data
        assert response.data["code"] == "USERNAME_ALREADY_EXISTS"

    @pytest.mark.django_db
    def test_non_username_integrity_error_is_not_mislabeled(self, api_key_client, workspace):
        """Test an unrelated IntegrityError is not reported as a username conflict"""
        # An IntegrityError unrelated to the username (the username is still free)
        # must not be reported as a username conflict — it falls through to the
        # base handler (HTTP 400) instead.
        from django.db import IntegrityError

        with patch(
            "plane.api.views.service_account.create_service_account",
            side_effect=IntegrityError("some other constraint"),
        ):
            response = api_key_client.post(
                self._url(workspace.slug),
                {"name": "Boom", "role": "admin", "username": "unique-name"},
                format="json",
            )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data.get("code") != "USERNAME_ALREADY_EXISTS"

    @pytest.mark.django_db
    def test_custom_username_with_omitted_display_name_falls_back_to_name(self, api_key_client, workspace):
        """Test a custom username with no display name falls back to the given name"""
        response = api_key_client.post(
            self._url(workspace.slug),
            {"name": "CI Provisioner", "role": "admin", "username": "ci-only"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["username"] == "ci-only"
        assert response.data["display_name"] == "CI Provisioner"

    @pytest.mark.django_db
    def test_blank_identity_normalizes_to_synthetic(self, api_key_client, workspace):
        """Test blank identity fields normalize to a synthetic username and the given name"""
        # A blank username/display_name is treated as omitted (identical to the
        # management command), not a 400.
        response = api_key_client.post(
            self._url(workspace.slug),
            {"name": "Blanky", "role": "admin", "username": "", "display_name": ""},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["username"].startswith("svc_")
        assert response.data["display_name"] == "Blanky"

    @pytest.mark.django_db
    def test_explicit_empty_description_is_preserved(self, api_key_client, workspace):
        """Test an explicit empty description is stored as-is, not defaulted"""
        response = api_key_client.post(
            self._url(workspace.slug),
            {"name": "Desc HTTP", "role": "admin", "description": ""},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert APIToken.objects.get(user_id=response.data["id"]).description == ""


@pytest.mark.contract
class TestServiceAccountHelper:
    """Direct tests of the shared create_service_account helper."""

    @pytest.mark.django_db
    def test_duplicate_username_rolls_back_atomically(self, workspace):
        """Test a duplicate username rolls the whole creation back"""
        # A genuine (non-mocked) unique violation: the helper is @transaction.atomic,
        # so the failed second creation must leave nothing behind.
        from django.db import IntegrityError

        from plane.utils.service_account import create_service_account

        create_service_account(workspace=workspace, name="First", username="dup")

        users_before = User.objects.count()
        members_before = WorkspaceMember.objects.count()
        tokens_before = APIToken.objects.count()

        with pytest.raises(IntegrityError):
            create_service_account(workspace=workspace, name="Second", username="dup")

        assert User.objects.count() == users_before
        assert WorkspaceMember.objects.count() == members_before
        assert APIToken.objects.count() == tokens_before

    @pytest.mark.django_db
    def test_omitted_description_uses_generated_default(self, workspace):
        """Test an omitted description falls back to the generated default"""
        sa = create_service_account(workspace=workspace, name="Desc Bot", username="desc-default")
        assert sa.api_token.description == "Service account token for Desc Bot"

    @pytest.mark.django_db
    def test_explicit_empty_description_is_preserved(self, workspace):
        """Test an explicit empty description is preserved, not replaced by the default"""
        sa = create_service_account(workspace=workspace, name="Desc Bot", username="desc-blank", description="")
        assert sa.api_token.description == ""


@pytest.mark.contract
class TestServiceAccountTokenLifecycle:
    """List, mint, rotate, and revoke a service account's API tokens."""

    def _tokens_url(self, slug, user_id):
        """Helper to get the tokens endpoint URL"""
        return f"/api/v1/workspaces/{slug}/service-accounts/{user_id}/tokens/"

    def _token_url(self, slug, user_id, token_id):
        """Helper to get a single token endpoint URL"""
        return f"/api/v1/workspaces/{slug}/service-accounts/{user_id}/tokens/{token_id}/"

    def _rotate_url(self, slug, user_id, token_id):
        """Helper to get the token rotate endpoint URL"""
        return f"/api/v1/workspaces/{slug}/service-accounts/{user_id}/tokens/{token_id}/rotate/"

    @pytest.mark.django_db
    def test_list_tokens_masks_value(self, api_key_client, workspace, service_account):
        """Test the token list returns metadata but never the secret value"""
        response = api_key_client.get(self._tokens_url(workspace.slug, service_account.user.id))

        assert response.status_code == status.HTTP_200_OK, response.data
        results = response.data["results"]
        assert len(results) == 1
        entry = results[0]
        # Metadata is present; the secret value is always withheld.
        assert entry["label"] == "Reconcile Bot"
        assert entry["is_active"] is True
        assert "token" not in entry
        # And the plaintext value appears nowhere in the serialized body.
        assert service_account.token not in str(response.data)

    @pytest.mark.django_db
    def test_mint_token_returns_value_once_and_authenticates(self, api_key_client, workspace, service_account):
        """Test a minted token is returned once and authenticates as the account"""
        response = api_key_client.post(
            self._tokens_url(workspace.slug, service_account.user.id),
            {"label": "second-key"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["label"] == "second-key"
        minted = response.data["token"]
        assert minted.startswith("plane_api_")
        # The new token authenticates as the same service account.
        me = _client_for_token(minted).get(USERS_ME_URL)
        assert me.status_code == status.HTTP_200_OK
        assert str(me.data["id"]) == str(service_account.user.id)
        # The account now has two tokens.
        assert APIToken.objects.filter(user=service_account.user).count() == 2

    @pytest.mark.django_db
    def test_mint_token_without_label_generates_one(self, api_key_client, workspace, service_account):
        """Test minting with no label generates one and still returns a usable token"""
        response = api_key_client.post(
            self._tokens_url(workspace.slug, service_account.user.id),
            {},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        # A label was generated (the model default), not left blank.
        assert response.data["label"]
        minted = response.data["token"]
        assert minted.startswith("plane_api_")
        assert _client_for_token(minted).get(USERS_ME_URL).status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_mint_token_not_persisted_in_request_log(self, api_key_client, workspace, service_account):
        """Test a minted token is redacted from the API activity log"""
        with patch("plane.middleware.logger.process_logs") as process_logs:
            response = api_key_client.post(
                self._tokens_url(workspace.slug, service_account.user.id),
                {"label": "secret-key"},
                format="json",
            )
            assert response.status_code == status.HTTP_201_CREATED, response.data
            minted = response.data["token"]
            log_data = process_logs.delay.call_args.kwargs["log_data"]

        assert log_data["response_body"] == "[REDACTED]"
        assert minted not in (log_data["response_body"] or "")

    @pytest.mark.django_db
    def test_mint_token_with_expiry(self, api_key_client, workspace, service_account):
        """Test a token can be minted with an expiry"""
        expires = (timezone.now() + timedelta(days=7)).isoformat()
        response = api_key_client.post(
            self._tokens_url(workspace.slug, service_account.user.id),
            {"label": "expiring", "expired_at": expires},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["expired_at"] is not None

    @pytest.mark.django_db
    def test_non_service_tokens_are_not_managed(self, api_key_client, workspace, service_account):
        """Test the token APIs only manage service tokens, not other tokens on the user"""
        # A non-service token is outside this API's scope: not listed, and not
        # revokable/rotatable through it.
        other = APIToken.objects.create(
            user=service_account.user, workspace=workspace, token=generate_token(), is_service=False
        )

        listing = api_key_client.get(self._tokens_url(workspace.slug, service_account.user.id))
        listed_ids = {str(row["id"]) for row in listing.data["results"]}
        assert str(other.id) not in listed_ids

        token_url = self._token_url(workspace.slug, service_account.user.id, other.id)
        rotate_url = self._rotate_url(workspace.slug, service_account.user.id, other.id)
        assert api_key_client.delete(token_url).status_code == status.HTTP_404_NOT_FOUND
        assert api_key_client.post(rotate_url).status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_rotate_invalidates_old_token(self, api_key_client, workspace, service_account, create_user):
        """Test rotation returns a new token and invalidates the old one"""
        old_value = service_account.token
        old_id = service_account.api_token.id

        # The original token works before rotation.
        assert _client_for_token(old_value).get(USERS_ME_URL).status_code == status.HTTP_200_OK

        response = api_key_client.post(self._rotate_url(workspace.slug, service_account.user.id, old_id))
        assert response.status_code == status.HTTP_201_CREATED, response.data
        new_value = response.data["token"]
        assert new_value != old_value

        # Old token no longer authenticates; the replacement does.
        assert _client_for_token(old_value).get(USERS_ME_URL).status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )
        assert _client_for_token(new_value).get(USERS_ME_URL).status_code == status.HTTP_200_OK

        # The old token row is retained but deactivated. Its deactivation goes
        # through QuerySet.update() (bypassing save()), so the audit fields are
        # set explicitly and attributed to the acting admin.
        service_account.api_token.refresh_from_db()
        assert service_account.api_token.is_active is False
        assert service_account.api_token.updated_at is not None
        assert service_account.api_token.updated_by_id == create_user.id

    @pytest.mark.django_db
    def test_rotate_not_persisted_in_request_log(self, api_key_client, workspace, service_account):
        """Test a rotated token value is redacted from the API activity log"""
        with patch("plane.middleware.logger.process_logs") as process_logs:
            response = api_key_client.post(
                self._rotate_url(workspace.slug, service_account.user.id, service_account.api_token.id)
            )
            assert response.status_code == status.HTTP_201_CREATED, response.data
            new_value = response.data["token"]
            log_data = process_logs.delay.call_args.kwargs["log_data"]

        assert log_data["response_body"] == "[REDACTED]"
        assert new_value not in (log_data["response_body"] or "")

    @pytest.mark.django_db
    def test_rotate_inherits_source_expiry_when_omitted(self, api_key_client, workspace, service_account):
        """Test rotation inherits the source token's expiry when none is supplied"""
        # Rotating a bounded-lifetime credential must not silently produce an
        # immortal one, so an omitted expired_at carries the source expiry over.
        expires = timezone.now() + timedelta(days=7)
        APIToken.objects.filter(pk=service_account.api_token.pk).update(expired_at=expires)

        response = api_key_client.post(
            self._rotate_url(workspace.slug, service_account.user.id, service_account.api_token.id)
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["expired_at"] is not None
        replacement = APIToken.objects.get(id=response.data["id"])
        assert replacement.expired_at == expires

    @pytest.mark.django_db
    def test_rotate_explicit_null_clears_expiry(self, api_key_client, workspace, service_account):
        """Test an explicit null expiry makes the replacement never expire"""
        expires = timezone.now() + timedelta(days=7)
        APIToken.objects.filter(pk=service_account.api_token.pk).update(expired_at=expires)

        response = api_key_client.post(
            self._rotate_url(workspace.slug, service_account.user.id, service_account.api_token.id),
            {"expired_at": None},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["expired_at"] is None
        assert APIToken.objects.get(id=response.data["id"]).expired_at is None

    @pytest.mark.django_db
    def test_rotate_explicit_expiry_is_applied(self, api_key_client, workspace, service_account):
        """Test an explicitly supplied expiry is applied to the replacement"""
        new_expiry = timezone.now() + timedelta(days=30)

        response = api_key_client.post(
            self._rotate_url(workspace.slug, service_account.user.id, service_account.api_token.id),
            {"expired_at": new_expiry.isoformat()},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        replacement = APIToken.objects.get(id=response.data["id"])
        assert replacement.expired_at is not None
        assert abs((replacement.expired_at - new_expiry).total_seconds()) < 1

    @pytest.mark.django_db
    def test_rotate_inactive_token_is_rejected(self, api_key_client, workspace, service_account):
        """Test rotating an inactive token returns 409 and mints nothing"""
        url = self._rotate_url(workspace.slug, service_account.user.id, service_account.api_token.id)
        first = api_key_client.post(url)
        assert first.status_code == status.HTTP_201_CREATED, first.data

        active_before = APIToken.objects.filter(user=service_account.user, is_active=True).count()

        # The source token is now deactivated — it cannot mint further replacements.
        second = api_key_client.post(url)
        assert second.status_code == status.HTTP_409_CONFLICT, second.data
        assert second.data["code"] == "TOKEN_NOT_ACTIVE"
        assert APIToken.objects.filter(user=service_account.user, is_active=True).count() == active_before

    @pytest.mark.django_db
    def test_rotate_elapsed_source_expiry_requires_explicit_intent(self, api_key_client, workspace, service_account):
        """Test rotating a token whose expiry elapsed requires an explicit expiry"""
        # An elapsed expiry is still is_active=True; inheriting it would mint a
        # replacement that can never authenticate, so the caller must say what it
        # wants instead.
        APIToken.objects.filter(pk=service_account.api_token.pk).update(expired_at=timezone.now() - timedelta(days=1))
        url = self._rotate_url(workspace.slug, service_account.user.id, service_account.api_token.id)

        rejected = api_key_client.post(url)
        assert rejected.status_code == status.HTTP_400_BAD_REQUEST, rejected.data
        assert rejected.data["code"] == "SOURCE_TOKEN_EXPIRY_ELAPSED"
        # Nothing was minted and the source token is untouched.
        assert APIToken.objects.filter(user=service_account.user).count() == 1
        assert APIToken.objects.get(pk=service_account.api_token.pk).is_active is True

        # Supplying the expiry explicitly is the documented way forward.
        accepted = api_key_client.post(url, {"expired_at": None}, format="json")
        assert accepted.status_code == status.HTTP_201_CREATED, accepted.data
        assert _client_for_token(accepted.data["token"]).get(USERS_ME_URL).status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_rotate_form_encoded_empty_expiry_inherits(self, api_key_client, workspace, service_account):
        """Test an empty form-encoded expiry is treated as omitted, not as null"""
        # A form/multipart client sending an empty expired_at must NOT clear the
        # expiry (that would silently mint an immortal token); it inherits like an
        # omitted field.
        expires = timezone.now() + timedelta(days=7)
        APIToken.objects.filter(pk=service_account.api_token.pk).update(expired_at=expires)

        # Default APIClient format is multipart (HTML input), not JSON.
        response = api_key_client.post(
            self._rotate_url(workspace.slug, service_account.user.id, service_account.api_token.id),
            {"expired_at": ""},
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["expired_at"] is not None
        assert APIToken.objects.get(id=response.data["id"]).expired_at == expires

    @pytest.mark.django_db
    def test_rotate_past_expiry_is_rejected(self, api_key_client, workspace, service_account):
        """Test an explicitly supplied past expiry is rejected with 400"""
        response = api_key_client.post(
            self._rotate_url(workspace.slug, service_account.user.id, service_account.api_token.id),
            {"expired_at": (timezone.now() - timedelta(days=1)).isoformat()},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.data
        # The source token is untouched — a rejected rotation mints nothing.
        assert APIToken.objects.get(pk=service_account.api_token.pk).is_active is True
        assert APIToken.objects.filter(user=service_account.user).count() == 1

    @pytest.mark.django_db
    def test_mint_past_expiry_is_rejected(self, api_key_client, workspace, service_account):
        """Test minting a token with a past expiry is rejected with 400"""
        response = api_key_client.post(
            self._tokens_url(workspace.slug, service_account.user.id),
            {"label": "dead", "expired_at": (timezone.now() - timedelta(days=1)).isoformat()},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST, response.data

    @pytest.mark.django_db
    def test_revoke_token_invalidates_it(self, api_key_client, workspace, service_account):
        """Test a revoked token stops authenticating and disappears from the list"""
        old_value = service_account.token
        response = api_key_client.delete(
            self._token_url(workspace.slug, service_account.user.id, service_account.api_token.id)
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Auth with the revoked token fails, and it no longer appears in the list.
        assert _client_for_token(old_value).get(USERS_ME_URL).status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )
        listing = api_key_client.get(self._tokens_url(workspace.slug, service_account.user.id))
        assert listing.data["results"] == []

    @pytest.mark.django_db
    def test_token_endpoints_404_for_non_service_user(self, api_key_client, workspace, create_user):
        """Test every token endpoint 404s for a non-service user"""
        import uuid

        # create_user is a human admin, not a service account — no token endpoint applies.
        base = self._tokens_url(workspace.slug, create_user.id)
        assert api_key_client.get(base).status_code == status.HTTP_404_NOT_FOUND
        assert api_key_client.post(base, {"label": "x"}, format="json").status_code == status.HTTP_404_NOT_FOUND
        tok = self._token_url(workspace.slug, create_user.id, uuid.uuid4())
        assert api_key_client.delete(tok).status_code == status.HTTP_404_NOT_FOUND
        rotate = self._rotate_url(workspace.slug, create_user.id, uuid.uuid4())
        assert api_key_client.post(rotate).status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_cross_workspace_isolation(self, api_key_client, workspace, service_account):
        """Test another workspace's account and tokens are unreachable"""
        # A service account in another workspace must be unreachable via THIS
        # workspace's slug, even by this workspace's admin (api_key_client).
        owner = User.objects.create(username="other_owner", email="oo@plane.so")
        other_ws = Workspace.objects.create(name="Other", owner=owner, slug="other-ws")
        other = create_service_account(workspace=other_ws, name="Other Bot", username="other-bot")

        uid = other.user.id
        assert api_key_client.get(self._tokens_url(workspace.slug, uid)).status_code == status.HTTP_404_NOT_FOUND
        rotate = self._rotate_url(workspace.slug, uid, other.api_token.id)
        assert api_key_client.post(rotate).status_code == status.HTTP_404_NOT_FOUND
        revoke = self._token_url(workspace.slug, uid, other.api_token.id)
        assert api_key_client.delete(revoke).status_code == status.HTTP_404_NOT_FOUND
        decommission = f"/api/v1/workspaces/{workspace.slug}/service-accounts/{uid}/"
        assert api_key_client.delete(decommission).status_code == status.HTTP_404_NOT_FOUND

        # The other workspace's token is untouched and still authenticates.
        assert _client_for_token(other.token).get(USERS_ME_URL).status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_non_admin_cannot_manage_tokens(self, api_client, workspace, service_account):
        """Test a non-admin cannot list, mint, or revoke tokens"""
        guest = User.objects.create(username="guest_tok", email="guesttok@plane.so")
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5, is_active=True)
        guest_token = APIToken.objects.create(user=guest, label="g", token=generate_token())
        client = _client_for_token(guest_token.token)

        url = self._tokens_url(workspace.slug, service_account.user.id)
        token_url = self._token_url(workspace.slug, service_account.user.id, service_account.api_token.id)
        assert client.get(url).status_code == status.HTTP_403_FORBIDDEN
        assert client.post(url, {"label": "x"}, format="json").status_code == status.HTTP_403_FORBIDDEN
        assert client.delete(token_url).status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestServiceAccountDecommission:
    """DELETE /service-accounts/{user_id}/ — decommission with cascade + guards."""

    def _url(self, slug, user_id):
        """Helper to get the decommission (detail) URL"""
        return f"/api/v1/workspaces/{slug}/service-accounts/{user_id}/"

    @pytest.mark.django_db
    def test_decommission_cascade(self, api_key_client, workspace, service_account, create_user):
        """Test decommissioning revokes access and removes memberships"""
        user = service_account.user
        # Give the account a project membership to prove the cascade removes it.
        # Attribute the project to the service account explicitly (created_by is
        # otherwise set from the request user via crum, which is absent here).
        project = Project(name="P", identifier="P1", workspace=workspace)
        project.save(created_by_id=user.id)
        ProjectMember.objects.create(project=project, member=user, role=20, is_active=True)
        old_token = service_account.token

        response = api_key_client.delete(self._url(workspace.slug, user.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Memberships removed (soft-deleted → excluded from the default manager).
        assert not WorkspaceMember.objects.filter(member=user, workspace=workspace).exists()
        assert not ProjectMember.objects.filter(member=user, workspace=workspace).exists()
        # Tokens deactivated and the account can no longer authenticate.
        assert not APIToken.objects.filter(user=user, is_active=True).exists()
        assert _client_for_token(old_token).get(USERS_ME_URL).status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )
        # Token deactivation goes through QuerySet.update() (bypassing save()), so
        # the audit fields are set explicitly: the deactivated token is stamped
        # updated_at and attributed to the acting admin, mirroring rotation.
        deactivated = APIToken.objects.get(pk=service_account.api_token.pk)
        assert deactivated.is_active is False
        assert deactivated.updated_at is not None
        assert deactivated.updated_by_id == create_user.id
        # The user row survives (deactivated) so historical attribution is intact.
        user.refresh_from_db()
        assert user.is_active is False
        assert Project.objects.get(id=project.id).created_by_id == user.id

    @pytest.mark.django_db
    def test_deactivated_membership_can_still_be_decommissioned(self, api_key_client, workspace, service_account):
        """Test a deactivated membership is still manageable and can be decommissioned"""
        # A merely-deactivated membership must not block management: the tokens
        # still authenticate (auth ignores membership), so the admin must still
        # be able to list and decommission the account.
        WorkspaceMember.objects.filter(member=service_account.user, workspace=workspace).update(is_active=False)
        assert _client_for_token(service_account.token).get(USERS_ME_URL).status_code == status.HTTP_200_OK

        tokens_url = f"/api/v1/workspaces/{workspace.slug}/service-accounts/{service_account.user.id}/tokens/"
        assert api_key_client.get(tokens_url).status_code == status.HTTP_200_OK

        response = api_key_client.delete(self._url(workspace.slug, service_account.user.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not APIToken.objects.filter(user=service_account.user, is_active=True).exists()

    @pytest.mark.django_db
    def test_decommission_rejects_human_user(self, api_key_client, workspace, create_user):
        """Test decommissioning a human user is rejected"""
        response = api_key_client.delete(self._url(workspace.slug, create_user.id))
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["code"] == "NOT_A_SERVICE_ACCOUNT"
        # The human admin remains an active member.
        assert WorkspaceMember.objects.filter(member=create_user, workspace=workspace, is_active=True).exists()

    @pytest.mark.django_db
    def test_decommission_rejects_other_bot_type(self, api_key_client, workspace):
        """Test decommissioning a non-service bot is rejected"""
        bot = User.objects.create(
            username="seed_bot", email="seed@plane.so", is_bot=True, bot_type=BotTypeEnum.WORKSPACE_SEED
        )
        WorkspaceMember.objects.create(workspace=workspace, member=bot, role=20, is_active=True)

        response = api_key_client.delete(self._url(workspace.slug, bot.id))
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["code"] == "NOT_A_SERVICE_ACCOUNT"

    @pytest.mark.django_db
    def test_decommission_unknown_user_is_404(self, api_key_client, workspace):
        """Test decommissioning an unknown user returns 404"""
        import uuid

        response = api_key_client.delete(self._url(workspace.slug, uuid.uuid4()))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_non_admin_cannot_decommission(self, api_client, workspace, service_account):
        """Test a non-admin cannot decommission a service account"""
        guest = User.objects.create(username="guest_dec", email="guestdec@plane.so")
        WorkspaceMember.objects.create(workspace=workspace, member=guest, role=5, is_active=True)
        guest_token = APIToken.objects.create(user=guest, label="g", token=generate_token())

        response = _client_for_token(guest_token.token).delete(self._url(workspace.slug, service_account.user.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_decommission_scopes_token_deactivation_to_workspace(self, workspace, service_account):
        """Test decommissioning does not deactivate the account's tokens in another workspace"""
        from plane.utils.service_account import decommission_service_account, mint_service_account_token

        owner = User.objects.create(username="dec_owner", email="decowner@plane.so")
        other_ws = Workspace.objects.create(name="Other Dec", owner=owner, slug="other-ws-dec")
        other_token = mint_service_account_token(user=service_account.user, workspace=other_ws)

        decommission_service_account(user=service_account.user, workspace=workspace)

        # This workspace's token is deactivated; the other workspace's is untouched.
        assert APIToken.objects.get(pk=service_account.api_token.pk).is_active is False
        assert APIToken.objects.get(pk=other_token.pk).is_active is True
