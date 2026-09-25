# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import Mock

import pytest

from plane.app.views.eraser import parse_eraser_url
from plane.db.models import EraserIntegration, WorkspaceMember


@pytest.mark.parametrize(
    "url,expected",
    [
        ("https://app.eraser.io/workspace/file123", ("file123", None)),
        ("https://APP.ERASER.IO/workspace/file123", ("file123", None)),
        ("https://app.eraser.io/workspace/file123?diagram=diag1", ("file123", [{"type": "diagram", "id": "diag1"}])),
        ("https://app.eraser.io/workspace/file123?figure=fig1", ("file123", [{"type": "figure", "id": "fig1"}])),
        ("https://app.eraser.io.evil.test/workspace/file123", None),
        ("http://app.eraser.io/workspace/file123", None),
        ("https://app.eraser.io/workspace/file123?diagram=one&figure=two", None),
        ("https://app.eraser.io/workspace/file123?diagram=", None),
        ("https://app.eraser.io/workspace/file123?diagram=one&diagram=two", None),
    ],
)
def test_parse_eraser_url(url, expected):
    assert parse_eraser_url(url) == expected


@pytest.mark.contract
@pytest.mark.django_db
def test_connection_keeps_token_server_side(session_client, workspace, monkeypatch):
    eraser_response = Mock(status_code=200, ok=True)
    monkeypatch.setattr("plane.app.views.eraser.eraser_request", lambda *args, **kwargs: eraser_response)
    path = f"/api/workspaces/{workspace.slug}/eraser/"

    response = session_client.put(path, {"api_token": "team-secret"}, format="json")

    assert response.status_code == 200
    assert response.json() == {"connected": True}
    integration = EraserIntegration.objects.get(workspace=workspace)
    assert "team-secret" not in integration.encrypted_api_token
    assert session_client.get(path).json() == {"connected": True}


@pytest.mark.contract
@pytest.mark.django_db
def test_members_cannot_manage_connection(session_client, workspace, create_user):
    WorkspaceMember.objects.filter(workspace=workspace, member=create_user).update(role=15)

    response = session_client.put(
        f"/api/workspaces/{workspace.slug}/eraser/", {"api_token": "team-secret"}, format="json"
    )

    assert response.status_code == 403


@pytest.mark.contract
@pytest.mark.django_db
def test_anonymous_user_cannot_create_embed(api_client, workspace):
    response = api_client.post(
        f"/api/workspaces/{workspace.slug}/eraser/embed/",
        {"url": "https://app.eraser.io/workspace/file123"},
        format="json",
    )

    assert response.status_code in (401, 403)


@pytest.mark.contract
@pytest.mark.django_db
def test_invalid_embed_url_is_rejected_before_network(session_client, workspace, monkeypatch):
    def unexpected_request(*args, **kwargs):
        raise AssertionError("Eraser should not be called for an invalid URL")

    monkeypatch.setattr("plane.app.views.eraser.eraser_request", unexpected_request)
    response = session_client.post(
        f"/api/workspaces/{workspace.slug}/eraser/embed/",
        {"url": "https://app.eraser.io.evil.test/workspace/file123"},
        format="json",
    )

    assert response.status_code == 400


@pytest.mark.contract
@pytest.mark.django_db
def test_embed_uses_server_token_and_returns_short_lived_url(session_client, workspace, monkeypatch):
    from django.conf import settings
    from cryptography.fernet import Fernet
    from plane.license.utils.encryption import derive_key

    encrypted = Fernet(derive_key(settings.SECRET_KEY)).encrypt(b"team-secret").decode()
    EraserIntegration.objects.create(workspace=workspace, encrypted_api_token=encrypted)
    calls = []

    def fake_request(method, path, token, **kwargs):
        calls.append((method, path, token, kwargs))
        return Mock(
            status_code=200,
            ok=True,
            json=lambda: {"embedUrl": "https://app.eraser.io/embed?token=temporary", "expiresAt": 123},
        )

    monkeypatch.setattr("plane.app.views.eraser.eraser_request", fake_request)
    response = session_client.post(
        f"/api/workspaces/{workspace.slug}/eraser/embed/",
        {"url": "https://app.eraser.io/workspace/file123?diagram=diag1"},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["embed_url"] == "https://app.eraser.io/embed?token=temporary"
    assert calls[0] == (
        "POST", "/embedTokens", "team-secret",
        {"json": {"fileId": "file123", "expiresIn": "15m", "content": [{"type": "diagram", "id": "diag1"}]}},
    )
