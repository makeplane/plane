from typing import Optional

from django.views import View
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from oauth2_provider.contrib.rest_framework import OAuth2Authentication

from plane.authentication.models.oauth import WorkspaceAppInstallation


class OauthApplicationWorkspacePermission(BasePermission):
    """
    Checks if the OAuth application is installed in the workspace.
    If workspace_slug is not provided, OAuth2 authentication is sufficient.
    """

    def has_permission(self, request: Request, view: View) -> bool:
        is_authenticated = bool(request.user and request.user.is_authenticated)

        oauth2authenticated = False
        if is_authenticated:
            oauth2authenticated = isinstance(
                request.successful_authenticator, OAuth2Authentication
            )

        # If not OAuth2 authenticated, allow only if user is authenticated
        if not oauth2authenticated:
            return is_authenticated

        # If OAuth2 authenticated but no workspace_slug, allow access
        workspace_slug: Optional[str] = view.kwargs.get("workspace_slug")
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
