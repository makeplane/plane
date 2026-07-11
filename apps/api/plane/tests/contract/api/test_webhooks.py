# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for the public token-API workspace webhook endpoints.

Covers CRUD via ``/api/v1/workspaces/{slug}/webhooks/`` and proves the two
security-critical guarantees:

* create returns a usable, server-generated ``secret_key`` (and it is not
  leaked on subsequent reads), and
* a delivery built from that secret signs the payload correctly with
  ``X-Plane-Signature`` (HMAC-SHA256).
"""

import hashlib
import hmac
import json
from unittest import mock
from uuid import uuid4

import pytest
from django.db import IntegrityError
from rest_framework import serializers, status
from rest_framework.test import APIClient

from plane.db.models import Webhook, WorkspaceMember
from plane.db.models.api import APIToken


def _webhooks_url(slug):
    return f"/api/v1/workspaces/{slug}/webhooks/"


def _webhook_detail_url(slug, pk):
    return f"/api/v1/workspaces/{slug}/webhooks/{pk}/"


@pytest.fixture
def webhook_data():
    """A valid webhook payload targeting a public IP literal.

    Using a public IP literal keeps ``validate_url`` (which resolves the host)
    deterministic and offline — no DNS lookup happens for a numeric address —
    while still exercising the real SSRF guard.
    """
    return {
        "url": "https://8.8.8.8/webhook",
        "issue": True,
        "issue_comment": True,
        "cycle": True,
        "module": True,
        "project": True,
    }


@pytest.fixture
def create_webhook(db, workspace):
    """An existing active webhook for the workspace."""
    return Webhook.objects.create(
        workspace=workspace,
        url="https://8.8.8.8/existing",
        issue=True,
    )


@pytest.fixture
def member_api_key_client(db, workspace):
    """An API-key client whose user is a workspace *member* (role 15).

    Used to prove webhook management is admin-only, mirroring the app API.
    """
    from plane.db.models import User

    member = User.objects.create(
        email="member@plane.so",
        username="member@plane.so",
        first_name="Member",
    )
    member.set_password("member-password")
    member.save()
    WorkspaceMember.objects.create(workspace=workspace, member=member, role=15)
    token = APIToken.objects.create(user=member, label="Member Token")

    client = APIClient()
    client.credentials(HTTP_X_API_KEY=token.token)
    return client


@pytest.mark.contract
class TestWebhookCreateAPIEndpoint:
    @pytest.mark.django_db
    def test_create_returns_usable_secret(self, api_key_client, workspace, webhook_data):
        """Create generates a server-side secret and returns it once."""
        response = api_key_client.post(_webhooks_url(workspace.slug), webhook_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED

        secret = response.data["secret_key"]
        assert secret
        assert secret.startswith("plane_wh_")

        # The secret is not client-supplied — it matches the persisted value.
        webhook = Webhook.objects.get(id=response.data["id"])
        assert webhook.secret_key == secret
        assert webhook.workspace_id == workspace.id

        # Entity toggles round-trip.
        assert webhook.issue is True
        assert webhook.issue_comment is True
        assert webhook.cycle is True
        assert webhook.module is True
        assert webhook.project is True

    @pytest.mark.django_db
    def test_create_ignores_client_supplied_secret(self, api_key_client, workspace, webhook_data):
        """secret_key is read-only: a client-supplied value is discarded."""
        payload = {**webhook_data, "secret_key": "attacker-controlled"}
        response = api_key_client.post(_webhooks_url(workspace.slug), payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["secret_key"] != "attacker-controlled"
        assert response.data["secret_key"].startswith("plane_wh_")

    @pytest.mark.django_db
    def test_create_ignores_client_supplied_internal_and_version(self, api_key_client, workspace, webhook_data):
        """is_internal and version are server-controlled: client values are ignored."""
        payload = {**webhook_data, "is_internal": True, "version": "v99"}
        response = api_key_client.post(_webhooks_url(workspace.slug), payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED

        # Neither field is exposed on the public serializer, and the persisted
        # webhook keeps the server-controlled model defaults.
        webhook = Webhook.objects.get(id=response.data["id"])
        assert webhook.is_internal is False
        assert webhook.version == "v1"

    @pytest.mark.django_db
    def test_create_rejects_ssrf_target(self, api_key_client, workspace):
        """The SSRF guard blocks loopback/private targets (not weakened)."""
        response = api_key_client.post(
            _webhooks_url(workspace.slug),
            {"url": "http://127.0.0.1:9000/hook"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_rejects_non_http_scheme(self, api_key_client, workspace):
        """Only http(s) schemes are accepted."""
        response = api_key_client.post(
            _webhooks_url(workspace.slug),
            {"url": "ftp://8.8.8.8/hook"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_create_duplicate_url_conflict(self, api_key_client, workspace, create_webhook):
        """A duplicate URL for the workspace returns 409."""
        response = api_key_client.post(
            _webhooks_url(workspace.slug),
            {"url": create_webhook.url},
            format="json",
        )
        assert response.status_code == status.HTTP_409_CONFLICT

    @pytest.mark.django_db
    def test_create_non_unique_integrity_error_not_masked(self, api_key_client, workspace, webhook_data):
        """A non-unique IntegrityError must not be misreported as a 409 duplicate-URL conflict."""
        with mock.patch(
            "plane.api.views.webhook.WebhookSerializer.save",
            side_effect=IntegrityError("null value in column violates not-null constraint"),
        ):
            response = api_key_client.post(_webhooks_url(workspace.slug), webhook_data, format="json")

        assert response.status_code != status.HTTP_409_CONFLICT
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already exists" not in str(response.data)

    @pytest.mark.django_db
    def test_create_requires_workspace_admin(self, member_api_key_client, workspace, webhook_data):
        """Webhook management is workspace-admin only, mirroring the app API."""
        response = member_api_key_client.post(_webhooks_url(workspace.slug), webhook_data, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.contract
class TestWebhookReadUpdateDeleteAPIEndpoint:
    @pytest.mark.django_db
    def test_list_hides_secret(self, api_key_client, workspace, create_webhook):
        response = api_key_client.get(_webhooks_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert "secret_key" not in response.data[0]
        assert response.data[0]["url"] == create_webhook.url

    @pytest.mark.django_db
    def test_retrieve_hides_secret(self, api_key_client, workspace, create_webhook):
        response = api_key_client.get(_webhook_detail_url(workspace.slug, create_webhook.id))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == create_webhook.id
        assert "secret_key" not in response.data

    @pytest.mark.django_db
    def test_retrieve_not_found(self, api_key_client, workspace):
        response = api_key_client.get(_webhook_detail_url(workspace.slug, uuid4()))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_update_toggle_and_active(self, api_key_client, workspace, create_webhook):
        response = api_key_client.patch(
            _webhook_detail_url(workspace.slug, create_webhook.id),
            {"is_active": False, "cycle": True},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        create_webhook.refresh_from_db()
        assert create_webhook.is_active is False
        assert create_webhook.cycle is True

    @pytest.mark.django_db
    def test_update_rejects_ssrf_target(self, api_key_client, workspace, create_webhook):
        response = api_key_client.patch(
            _webhook_detail_url(workspace.slug, create_webhook.id),
            {"url": "http://169.254.169.254/latest/meta-data/"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_delete_webhook(self, api_key_client, workspace, create_webhook):
        response = api_key_client.delete(_webhook_detail_url(workspace.slug, create_webhook.id))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Webhook.objects.filter(id=create_webhook.id).exists()


@pytest.mark.contract
class TestWebhookDeliverySigning:
    @pytest.mark.django_db
    def test_delivery_signs_with_created_secret(self, api_key_client, workspace, webhook_data):
        """A delivery built from the API-issued secret signs the payload with
        an HMAC-SHA256 ``X-Plane-Signature`` the receiver can verify."""
        from plane.bgtasks.webhook_task import webhook_send_task

        # 1. Provision the webhook through the public API and capture its secret.
        create_response = api_key_client.post(_webhooks_url(workspace.slug), webhook_data, format="json")
        assert create_response.status_code == status.HTTP_201_CREATED
        secret = create_response.data["secret_key"]
        webhook_id = create_response.data["id"]

        captured = {}

        class _FakeResponse:
            status_code = 200
            headers = {}
            text = "ok"

        def _fake_pinned_fetch(method, url, **kwargs):
            captured["headers"] = kwargs["headers"]
            captured["json"] = kwargs["json"]
            return _FakeResponse()

        # 2. Run the real delivery task with the network pinned-fetch stubbed out.
        with mock.patch("plane.bgtasks.webhook_task.pinned_fetch", side_effect=_fake_pinned_fetch):
            webhook_send_task.apply(
                kwargs=dict(
                    webhook_id=str(webhook_id),
                    slug=workspace.slug,
                    event="issue",
                    event_data={"id": str(uuid4())},
                    action="POST",
                    current_site="http://example.com",
                    activity=None,
                )
            )

        # 3. The receiver recomputes the signature from the shared secret.
        headers = captured["headers"]
        payload = captured["json"]
        expected_signature = hmac.new(
            secret.encode("utf-8"),
            json.dumps(payload).encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        assert headers["X-Plane-Signature"] == expected_signature
        assert headers["X-Plane-Event"] == "issue"
        assert payload["event"] == "issue"
        assert payload["webhook_id"] == str(webhook_id)


@pytest.mark.contract
class TestWebhookLoopbackGuard:
    """The request-host loop-back guard must handle bracketed IPv6 hosts."""

    def test_ipv6_request_host_is_parsed_correctly(self):
        from plane.utils.webhook import validate_webhook_url

        request = mock.MagicMock()
        # Plane served on an IPv6 host with a port — get_host() returns it bracketed.
        request.get_host.return_value = "[2001:db8::5]:8000"

        # Bypass the SSRF resolver so the test targets only the request-host
        # loop-back guard (the piece that must parse "[::1]:8000"-style hosts).
        with mock.patch("plane.utils.webhook.validate_url"):
            # A webhook pointed at the instance's own IPv6 host is rejected —
            # a naive split(":")[0] would yield "[2001" and fail to match.
            with pytest.raises(serializers.ValidationError):
                validate_webhook_url("http://[2001:db8::5]/hook", request)

            # An unrelated public host still passes.
            validate_webhook_url("https://8.8.8.8/hook", request)
