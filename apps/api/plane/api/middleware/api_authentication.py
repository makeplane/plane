# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.utils import timezone
from django.db.models import Q
from django.urls import resolve, Resolver404

# Third party imports
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

# Module imports
from plane.db.models import APIToken, Workspace


class APIKeyAuthentication(authentication.BaseAuthentication):
    """
    Authentication with an API Key
    """

    www_authenticate_realm = "api"
    media_type = "application/json"
    auth_header_name = "X-Api-Key"

    def get_api_token(self, request):
        return request.headers.get(self.auth_header_name)

    def validate_api_token(self, token, workspace_slug):
        try:
            api_token = APIToken.objects.get(
                Q(Q(expired_at__gt=timezone.now()) | Q(expired_at__isnull=True)),
                token=token,
                is_active=True,
            )

            # If the api token has workspace_id, then check if it matches the workspace_slug
            if api_token.workspace_id and workspace_slug:
                workspace = Workspace.objects.get(slug=workspace_slug)

                if api_token.workspace_id != workspace.id:
                    raise AuthenticationFailed("Given API token is not valid")

        except APIToken.DoesNotExist:
            raise AuthenticationFailed("Given API token is not valid")

        # save api token last used
        api_token.last_used = timezone.now()
        api_token.save(update_fields=["last_used"])
        return (api_token.user, api_token.token)

    def authenticate(self, request):
        try:
            workspace_slug = resolve(request.path_info).kwargs.get("slug")
        except Resolver404:
            workspace_slug = None

        token = self.get_api_token(request=request)
        if not token:
            return None

        # Validate the API token
        user, token = self.validate_api_token(token, workspace_slug)
        return user, token
