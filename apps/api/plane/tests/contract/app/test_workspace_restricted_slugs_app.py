# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workspace slugs that collide with root paths the gateway routes elsewhere.

The hybrid deployment sends /agents/* to the agent bridge, /mcp to the Plane MCP
server, /uploads/* to MinIO and /static/* and /auth/* to Django
(deployments/hybrid/vps/Caddyfile), so a workspace with one of those slugs could
never be opened at /<slug>/. Creating one, or reporting the slug as available,
must fail.
"""

from unittest.mock import patch

import pytest
from django.urls import reverse
from rest_framework import status

from plane.db.models import Workspace
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS

GATEWAY_ROUTED_SLUGS = ["agents", "mcp", "uploads", "static", "auth", "api", "live", "spaces", "god-mode"]


@pytest.mark.unit
@pytest.mark.parametrize("slug", GATEWAY_ROUTED_SLUGS)
def test_gateway_routed_slugs_are_restricted(slug):
    assert slug in RESTRICTED_WORKSPACE_SLUGS


@pytest.mark.contract
class TestRestrictedWorkspaceSlugs:
    @pytest.mark.django_db
    @pytest.mark.parametrize("slug", ["agents", "mcp", "uploads", "static", "auth"])
    @patch("plane.bgtasks.workspace_seed_task.workspace_seed.delay")
    def test_create_workspace_with_routed_slug_is_rejected(self, _mock_seed, session_client, slug):
        response = session_client.post(reverse("workspace"), {"name": "Routed", "slug": slug}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "slug" in response.data
        assert not Workspace.objects.filter(slug=slug).exists()

    @pytest.mark.django_db
    @pytest.mark.parametrize("slug", ["agents", "mcp", "uploads", "static", "auth"])
    def test_slug_check_reports_routed_slug_unavailable(self, session_client, slug):
        response = session_client.get(reverse("workspace-availability"), {"slug": slug})

        assert response.status_code == status.HTTP_200_OK
        assert response.data == {"status": False}

    @pytest.mark.django_db
    def test_slug_check_still_reports_free_slug_available(self, session_client):
        response = session_client.get(reverse("workspace-availability"), {"slug": "agents-team"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data == {"status": True}
