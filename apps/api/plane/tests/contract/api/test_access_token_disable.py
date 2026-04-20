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
from rest_framework import status

from plane.db.models import APIToken, Workspace, WorkspaceMember


@pytest.fixture
def disable_access_tokens(monkeypatch):
    monkeypatch.setattr(
        "plane.api.middleware.api_authentication.are_access_tokens_disabled",
        lambda: True,
    )


@pytest.mark.contract
@pytest.mark.django_db
class TestPublicApiAccessTokenDisable:
    def _workspace(self, user):
        workspace = Workspace.objects.create(name="Acme", slug="acme", owner=user)
        WorkspaceMember.objects.create(workspace=workspace, member=user, role=20)
        return workspace

    def test_user_token_rejected(self, api_client, create_user, disable_access_tokens):
        workspace = self._workspace(create_user)
        token = APIToken.objects.create(
            label="user token",
            user=create_user,
            user_type=0,
            workspace=workspace,
        )

        response = api_client.get(
            f"/api/v1/workspaces/{workspace.slug}/projects/",
            HTTP_X_API_KEY=token.token,
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_service_token_accepted(self, api_client, create_user, disable_access_tokens):
        workspace = self._workspace(create_user)
        token = APIToken.objects.create(
            label="service token",
            user=create_user,
            user_type=0,
            is_service=True,
            workspace=workspace,
        )

        response = api_client.get(
            f"/api/v1/workspaces/{workspace.slug}/projects/",
            HTTP_X_API_KEY=token.token,
        )

        # 200 (empty list) confirms the auth layer accepted the service token.
        assert response.status_code == status.HTTP_200_OK
