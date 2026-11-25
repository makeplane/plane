# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.utils import timezone
from django.db.models import Q

# Third party imports
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied

# Module imports
from plane.db.models import APIToken
from plane.db.models.api import (
    API_TOKEN_SCOPE_DELETE,
    API_TOKEN_SCOPE_READ,
    API_TOKEN_SCOPE_WRITE,
)

# The scope a token needs for each HTTP method. Methods not listed here are refused.
METHOD_SCOPES = {
    "GET": API_TOKEN_SCOPE_READ,
    "HEAD": API_TOKEN_SCOPE_READ,
    "OPTIONS": API_TOKEN_SCOPE_READ,
    "POST": API_TOKEN_SCOPE_WRITE,
    "PUT": API_TOKEN_SCOPE_WRITE,
    "PATCH": API_TOKEN_SCOPE_WRITE,
    "DELETE": API_TOKEN_SCOPE_DELETE,
}


def required_scope(method):
    """Return the scope an API token needs for an HTTP method, or None if the method is not allowed."""
    return METHOD_SCOPES.get(method.upper())


class APIKeyAuthentication(authentication.BaseAuthentication):
    """
    Authentication with an API Key
    """

    www_authenticate_realm = "api"
    media_type = "application/json"
    auth_header_name = "X-Api-Key"

    def get_api_token(self, request):
        return request.headers.get(self.auth_header_name)

    def validate_api_token(self, token):
        try:
            api_token = APIToken.objects.get(
                Q(Q(expired_at__gt=timezone.now()) | Q(expired_at__isnull=True)),
                token=token,
                is_active=True,
                user__is_active=True,
            )
        except APIToken.DoesNotExist:
            raise AuthenticationFailed("Given API token is not valid")

        # save api token last used
        api_token.last_used = timezone.now()
        api_token.save(update_fields=["last_used"])
        return (api_token.user, api_token)

    def enforce_scope(self, request, api_token):
        """
        Refuse the request unless the token holds the scope its HTTP method needs.

        Enforced here rather than in a permission class because every view that
        accepts API keys authenticates through this class, while views override
        permission_classes.
        """
        scope = required_scope(request.method)
        if scope is None:
            raise PermissionDenied(f"API tokens cannot be used for {request.method} requests.")
        if scope not in (api_token.scopes or []):
            raise PermissionDenied(f"This API token does not have the '{scope}' scope.")

    def authenticate(self, request):
        token = self.get_api_token(request=request)
        if not token:
            return None

        # Validate the API token
        user, api_token = self.validate_api_token(token)

        # Mark the underlying Django request, which is the one APITokenLogMiddleware sees.
        # Set before the scope check so refused requests still reach the activity log.
        getattr(request, "_request", request).api_key_authenticated = True

        self.enforce_scope(request, api_token)
        return user, api_token
