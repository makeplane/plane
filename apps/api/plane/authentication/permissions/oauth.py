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

from typing import Optional

from django.views import View
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from oauth2_provider.contrib.rest_framework import OAuth2Authentication, TokenMatchesOASRequirements

from plane.authentication.models.oauth import WorkspaceAppInstallation


class TokenHasScopeIfOAuth(BasePermission):
    """
    If OAuth token: checks scopes via TokenMatchesOASRequirements.
    If not OAuth (API key, session): allows access.
    """

    def has_permission(self, request: Request, view: View) -> bool:
        is_authenticated = bool(request.user and request.user.is_authenticated)
        if not is_authenticated:
            return False

        # Check if OAuth2 authenticated
        oauth2authenticated = isinstance(request.successful_authenticator, OAuth2Authentication)

        # If not OAuth2, allow (other permission classes handle auth)
        if not oauth2authenticated:
            return True

        # If OAuth2, delegate to TokenMatchesOASRequirements
        return TokenMatchesOASRequirements().has_permission(request, view)


class OauthApplicationWorkspacePermission(BasePermission):
    """
    Checks if the OAuth application is installed in the workspace.
    If workspace_slug is not provided, OAuth2 authentication is sufficient.
    """

    def has_permission(self, request: Request, view: View) -> bool:
        is_authenticated = bool(request.user and request.user.is_authenticated)

        oauth2authenticated = False
        if is_authenticated:
            oauth2authenticated = isinstance(request.successful_authenticator, OAuth2Authentication)

        # If not OAuth2 authenticated, allow only if user is authenticated
        if not oauth2authenticated:
            return is_authenticated

        # If OAuth2 authenticated but no workspace slug, allow access.
        # Accept both "slug" (current external + internal convention) and
        # "workspace_slug" (legacy kwarg name still in use by some endpoints).
        workspace_slug: Optional[str] = view.kwargs.get("slug") or view.kwargs.get("workspace_slug")
        if not workspace_slug:
            return True

        # Check if application has access to the specific workspace
        application = request.auth.application
        if application:
            application_installation = WorkspaceAppInstallation.objects.filter(
                application=application,
                workspace__slug=workspace_slug,
                deleted_at__isnull=True,
            ).first()

            return bool(application_installation)

        return False
