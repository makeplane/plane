# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import pytest
from django.urls import reverse
from rest_framework import status

from plane.db.models import APIToken, Workspace, WorkspaceMember


@pytest.fixture
def disable_access_tokens(monkeypatch):
    """Patch are_access_tokens_disabled() to True wherever it is imported."""
    monkeypatch.setattr(
        "plane.app.middleware.api_authentication.are_access_tokens_disabled",
        lambda: True,
    )
    monkeypatch.setattr(
        "plane.app.views.api.base.are_access_tokens_disabled",
        lambda: True,
    )
    monkeypatch.setattr(
        "plane.app.views.api.workspace.are_access_tokens_disabled",
        lambda: True,
    )


@pytest.mark.contract
class TestAccessTokenDisableCreation:
    """POST returns 403 when instance-level toggle is on."""

    @pytest.mark.django_db
    def test_personal_token_creation_rejected(self, session_client, create_user, disable_access_tokens):
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens")

        response = session_client.post(url, {"label": "blocked"}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "disabled" in response.data["error"].lower()
        assert not APIToken.objects.filter(user=create_user, label="blocked").exists()

    @pytest.mark.django_db
    def test_workspace_token_creation_rejected(self, session_client, create_user, disable_access_tokens):
        workspace = Workspace.objects.create(
            name="Acme",
            slug="acme",
            owner=create_user,
        )
        WorkspaceMember.objects.create(workspace=workspace, member=create_user, role=20)
        session_client.force_authenticate(user=create_user)
        url = reverse("workspace-api-tokens", kwargs={"slug": workspace.slug})

        response = session_client.post(url, {"label": "blocked"}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "disabled" in response.data["error"].lower()
        assert not APIToken.objects.filter(workspace=workspace, label="blocked").exists()

    @pytest.mark.django_db
    def test_personal_token_creation_allowed_when_flag_off(self, session_client, create_user):
        """Sanity check: without the disable fixture, creation still works."""
        session_client.force_authenticate(user=create_user)
        url = reverse("api-tokens")

        response = session_client.post(url, {"label": "allowed"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.contract
class TestAccessTokenDisableAuth:
    """Auth middleware rejects non-service tokens when flag is on; allows service tokens."""

    @pytest.mark.django_db
    def test_user_token_rejected_when_disabled(self, api_client, create_user, disable_access_tokens):
        token = APIToken.objects.create(label="user token", user=create_user, user_type=0)
        url = reverse("api-tokens")

        response = api_client.get(url, HTTP_X_API_KEY=token.token)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "disabled" in str(response.data).lower()

    @pytest.mark.django_db
    def test_service_token_accepted_when_disabled(self, api_client, create_user, disable_access_tokens):
        token = APIToken.objects.create(
            label="service token",
            user=create_user,
            user_type=0,
            is_service=True,
        )
        url = reverse("api-tokens")

        response = api_client.get(url, HTTP_X_API_KEY=token.token)

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_user_token_accepted_when_flag_off(self, api_client, create_user):
        """Sanity check: without the disable fixture, auth still works."""
        token = APIToken.objects.create(label="user token", user=create_user, user_type=0)
        url = reverse("api-tokens")

        response = api_client.get(url, HTTP_X_API_KEY=token.token)

        assert response.status_code == status.HTTP_200_OK
