# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

import pytest
from django.test import Client
from django.urls import reverse
from django.utils import timezone

from plane.authentication.adapter.error import AUTHENTICATION_ERROR_CODES, AuthenticationException
from plane.license.models import Instance

EXTERNAL_NEXT_PATH = "https://example.com/board"


@pytest.mark.contract
@pytest.mark.django_db
class TestGiteaErrorRedirectNextPath:
    """Gitea error redirects carry next_path only after it has been validated."""

    def test_callback_state_mismatch(self):
        client = Client()
        session = client.session
        session["host"] = "http://localhost"
        session["state"] = "expected-state"
        session["next_path"] = EXTERNAL_NEXT_PATH
        session.save()

        response = client.get(reverse("gitea-callback"), {"code": "oauth-code", "state": "other-state"})

        assert response.status_code == 302
        assert parse_qs(urlparse(response.url).query)["next_path"] == ["/board"]

    def test_space_initiate_provider_error(self):
        Instance.objects.create(
            instance_name="Test Instance",
            instance_id=str(uuid.uuid4()),
            current_version="1.0.0",
            domain="http://localhost:8000",
            last_checked_at=timezone.now(),
            is_setup_done=True,
        )
        not_configured = AuthenticationException(
            error_code=AUTHENTICATION_ERROR_CODES["GITEA_NOT_CONFIGURED"],
            error_message="GITEA_NOT_CONFIGURED",
        )

        with patch("plane.authentication.views.space.gitea.GiteaOAuthProvider", side_effect=not_configured):
            response = Client().get(reverse("space-gitea-initiate"), {"next_path": EXTERNAL_NEXT_PATH})

        assert response.status_code == 302
        assert parse_qs(urlparse(response.url).query)["next_path"] == ["/board"]
