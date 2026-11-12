# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from rest_framework import status

URL = "/api/users/me/"


@pytest.fixture
def cookie_client(api_client, create_user):
    """A client authenticated through the real session cookie, so the session auth class runs."""
    api_client.force_login(create_user)
    return api_client


@pytest.mark.contract
class TestSessionWriteOriginCheck:
    @pytest.mark.django_db
    def test_write_from_foreign_origin_is_refused(self, cookie_client, create_user):
        response = cookie_client.patch(
            URL, {"first_name": "Changed"}, format="json", HTTP_ORIGIN="https://evil.example.com"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        create_user.refresh_from_db()
        assert create_user.first_name == "Test"

    @pytest.mark.django_db
    @pytest.mark.parametrize("headers", [{"HTTP_ORIGIN": "http://testserver"}, {}], ids=["own-origin", "no-origin"])
    def test_write_from_own_origin_or_without_origin_succeeds(self, cookie_client, create_user, headers):
        response = cookie_client.patch(URL, {"first_name": "Changed"}, format="json", **headers)

        assert response.status_code == status.HTTP_200_OK
        create_user.refresh_from_db()
        assert create_user.first_name == "Changed"
