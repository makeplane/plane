# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for APIKeyAuthentication.

Covers the access-control guarantees of the external API key authentication:
- a valid token belonging to an active user authenticates successfully
- a valid token is rejected once the underlying user account is deactivated
  (prevents an authentication bypass via a disabled account that still holds
  a previously generated API key)
"""

from types import SimpleNamespace

import pytest
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied

from plane.api.middleware.api_authentication import APIKeyAuthentication
from plane.db.models import APIToken


@pytest.mark.unit
class TestAPIKeyAuthentication:
    @pytest.mark.django_db
    def test_validate_api_token_authenticates_active_user(self, create_user):
        token = APIToken.objects.create(user=create_user, label="Active Token", token="active-user-token")

        user, returned_token = APIKeyAuthentication().validate_api_token(token.token)

        assert user == create_user
        # The token object is returned (as request.auth) so its scopes can be checked
        assert returned_token == token

    @pytest.mark.django_db
    def test_validate_api_token_rejects_deactivated_user(self, create_user):
        token = APIToken.objects.create(user=create_user, label="Stale Token", token="deactivated-user-token")

        # Account is deactivated by an administrator after the token was issued.
        create_user.is_active = False
        create_user.save()

        with pytest.raises(AuthenticationFailed):
            APIKeyAuthentication().validate_api_token(token.token)


@pytest.mark.unit
class TestAPIKeyAuthenticationScopes:
    @staticmethod
    def enforce(method, scopes):
        APIKeyAuthentication().enforce_scope(SimpleNamespace(method=method), APIToken(scopes=scopes))

    @pytest.mark.parametrize(
        "method, scope",
        [
            ("GET", "read"),
            ("HEAD", "read"),
            ("OPTIONS", "read"),
            ("POST", "write"),
            ("PUT", "write"),
            ("PATCH", "write"),
            ("DELETE", "delete"),
        ],
    )
    def test_method_is_allowed_with_its_scope(self, method, scope):
        self.enforce(method, [scope])

    @pytest.mark.parametrize(
        "method, scopes",
        [
            ("GET", ["write", "delete"]),
            ("POST", ["read"]),
            ("PATCH", ["read", "delete"]),
            ("DELETE", ["read", "write"]),
        ],
    )
    def test_method_is_refused_without_its_scope(self, method, scopes):
        with pytest.raises(PermissionDenied):
            self.enforce(method, scopes)

    def test_unknown_method_is_refused(self):
        with pytest.raises(PermissionDenied):
            self.enforce("TRACE", ["read", "write", "delete"])

    def test_token_without_scopes_is_refused(self):
        with pytest.raises(PermissionDenied):
            self.enforce("GET", [])
