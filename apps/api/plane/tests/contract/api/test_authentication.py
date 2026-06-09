# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Contract tests for external API key authentication.

End-to-end proof that an API key cannot be used to access the API once the
owning user account has been deactivated.
"""

import pytest
from rest_framework import status


@pytest.mark.contract
class TestAPIKeyAuthenticationContract:
    """Test API key authentication behaviour against a live endpoint."""

    USERS_ME_URL = "/api/v1/users/me/"

    @pytest.mark.django_db
    def test_active_user_can_access_with_api_key(self, api_key_client):
        response = api_key_client.get(self.USERS_ME_URL)

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_deactivated_user_cannot_access_with_api_key(
        self, api_key_client, create_user
    ):
        # The account is disabled after the API key was generated.
        create_user.is_active = False
        create_user.save()

        response = api_key_client.get(self.USERS_ME_URL)

        # Access is denied once the account is deactivated. APIKeyAuthentication
        # does not set a WWW-Authenticate header, so DRF surfaces the
        # AuthenticationFailed as 403 Forbidden rather than 401.
        assert response.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )
