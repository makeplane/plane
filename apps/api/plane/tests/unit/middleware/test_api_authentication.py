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

import pytest
from rest_framework.exceptions import AuthenticationFailed

from plane.api.middleware.api_authentication import APIKeyAuthentication
from plane.db.models import APIToken


@pytest.mark.unit
class TestAPIKeyAuthentication:
    @pytest.mark.django_db
    def test_validate_api_token_authenticates_active_user(self, create_user):
        token = APIToken.objects.create(
            user=create_user, label="Active Token", token="active-user-token"
        )

        user, returned_token = APIKeyAuthentication().validate_api_token(token.token)

        assert user == create_user
        assert returned_token == token.token

    @pytest.mark.django_db
    def test_validate_api_token_rejects_deactivated_user(self, create_user):
        token = APIToken.objects.create(
            user=create_user, label="Stale Token", token="deactivated-user-token"
        )

        # Account is deactivated by an administrator after the token was issued.
        create_user.is_active = False
        create_user.save()

        with pytest.raises(AuthenticationFailed):
            APIKeyAuthentication().validate_api_token(token.token)


@pytest.mark.unit
class TestAPIKeyWorkspaceScope:
    """Workspace-bound tokens are checked against the route's ``slug`` kwarg."""

    @staticmethod
    def _request(token, kwargs, view=None):
        from types import SimpleNamespace

        return SimpleNamespace(
            headers={"X-Api-Key": token},
            parser_context={"kwargs": kwargs, "view": view or SimpleNamespace()},
        )

    @pytest.fixture
    def scoped_token(self, create_user, workspace):
        return APIToken.objects.create(user=create_user, workspace=workspace, token="scoped-token")

    @pytest.mark.django_db
    def test_matching_slug_authenticates(self, scoped_token, workspace):
        user, token = APIKeyAuthentication().authenticate(self._request(scoped_token.token, {"slug": workspace.slug}))
        assert user == scoped_token.user
        assert token == scoped_token.token

    @pytest.mark.django_db
    def test_other_slug_is_denied(self, scoped_token):
        from rest_framework.exceptions import PermissionDenied

        with pytest.raises(PermissionDenied):
            APIKeyAuthentication().authenticate(self._request(scoped_token.token, {"slug": "another-workspace"}))
        scoped_token.refresh_from_db()
        assert scoped_token.last_used is None

    @pytest.mark.django_db
    def test_no_slug_requires_view_opt_in(self, scoped_token):
        from types import SimpleNamespace
        from rest_framework.exceptions import PermissionDenied

        with pytest.raises(PermissionDenied):
            APIKeyAuthentication().authenticate(self._request(scoped_token.token, {}))

        opted_in = SimpleNamespace(allow_workspace_scoped_token=True)
        user, _ = APIKeyAuthentication().authenticate(self._request(scoped_token.token, {}, view=opted_in))
        assert user == scoped_token.user

    @pytest.mark.django_db
    def test_missing_parser_context_fails_closed(self, scoped_token):
        from types import SimpleNamespace
        from rest_framework.exceptions import PermissionDenied

        request = SimpleNamespace(headers={"X-Api-Key": scoped_token.token}, parser_context=None)
        with pytest.raises(PermissionDenied):
            APIKeyAuthentication().authenticate(request)

    @pytest.mark.django_db
    def test_unscoped_token_ignores_route(self, create_user):
        token = APIToken.objects.create(user=create_user, token="unscoped-token")
        user, _ = APIKeyAuthentication().authenticate(self._request(token.token, {"slug": "any-workspace"}))
        assert user == create_user
        user, _ = APIKeyAuthentication().authenticate(self._request(token.token, {}))
        assert user == create_user

    def test_app_copy_is_the_same_class(self):
        from plane.app.middleware.api_authentication import APIKeyAuthentication as AppAPIKeyAuthentication

        assert AppAPIKeyAuthentication is APIKeyAuthentication
