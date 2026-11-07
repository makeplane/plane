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

WORKSPACE_SCOPE_DENIED_MESSAGE = "This API token is scoped to a different workspace."
WORKSPACE_SCOPE_ENDPOINT_DENIED_MESSAGE = "This API token is scoped to a workspace and cannot access this endpoint."


class APIKeyAuthentication(authentication.BaseAuthentication):
    """
    Authentication with an API Key

    Workspace scoping. A token with ``workspace`` set (for example an agent
    session token) is only accepted on:

    - routes with a ``slug`` kwarg equal to that workspace's slug; or
    - routes without a ``slug`` kwarg whose view sets
      ``allow_workspace_scoped_token = True`` (``/users/me/``).

    Every other route rejects it with 403. Opting in is deliberately explicit, so a
    future non-slug endpoint that lists across workspaces is closed to scoped
    tokens until someone decides otherwise. Tokens without a workspace (all
    personal access tokens) behave exactly as before.
    """

    www_authenticate_realm = "api"
    media_type = "application/json"
    auth_header_name = "X-Api-Key"

    def get_api_token(self, request):
        return request.headers.get(self.auth_header_name)

    def get_api_token_object(self, token):
        try:
            return APIToken.objects.select_related("user", "workspace").get(
                Q(Q(expired_at__gt=timezone.now()) | Q(expired_at__isnull=True)),
                token=token,
                is_active=True,
                user__is_active=True,
            )
        except APIToken.DoesNotExist:
            raise AuthenticationFailed("Given API token is not valid")

    def validate_api_token(self, token):
        api_token = self.get_api_token_object(token)
        self.mark_used(api_token)
        return (api_token.user, api_token.token)

    def mark_used(self, api_token):
        api_token.last_used = timezone.now()
        api_token.save(update_fields=["last_used"])

    def enforce_workspace_scope(self, request, api_token):
        if api_token.workspace_id is None:
            return

        workspace = api_token.workspace
        if workspace.deleted_at is not None:
            raise AuthenticationFailed("Given API token is not valid")

        # DRF builds parser_context in APIView.initialize_request(), after it has
        # stored the resolved URL kwargs, and authentication runs lazily after
        # that. Missing context means we cannot tell where we are: fail closed.
        parser_context = getattr(request, "parser_context", None) or {}
        kwargs = parser_context.get("kwargs") or {}
        view = parser_context.get("view")

        slug = kwargs.get("slug")
        if slug is None:
            if getattr(view, "allow_workspace_scoped_token", False):
                return
            raise PermissionDenied(WORKSPACE_SCOPE_ENDPOINT_DENIED_MESSAGE)

        if slug != workspace.slug:
            raise PermissionDenied(WORKSPACE_SCOPE_DENIED_MESSAGE)

    def authenticate(self, request):
        token = self.get_api_token(request=request)
        if not token:
            return None

        # Validate the API token, then check it may be used on this route
        api_token = self.get_api_token_object(token)
        self.enforce_workspace_scope(request, api_token)
        self.mark_used(api_token)
        return api_token.user, api_token.token
