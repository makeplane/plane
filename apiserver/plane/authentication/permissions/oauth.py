from rest_framework.permissions import BasePermission
from oauth2_provider.contrib.rest_framework import (
    OAuth2Authentication,
)
from plane.authentication.models.oauth import WorkspaceAppInstallation


class OauthApplicationWorkspacePermission(BasePermission):
    """
    Checks if the OAuth application is installed in the workspace.
    """

    def has_permission(self, request, view):
        is_authenticated = bool(request.user and request.user.is_authenticated)

        oauth2authenticated = False
        if is_authenticated:
            oauth2authenticated = isinstance(
                request.successful_authenticator, OAuth2Authentication
            )

        application_has_workspace_access = False
        if oauth2authenticated:
            application = request.client
            workspace_slug = view.kwargs.get("workspace_slug")
            if application and workspace_slug:
                application_installation = WorkspaceAppInstallation.objects.filter(
                    application=application,
                    workspace__slug=workspace_slug,
                    deleted_at__isnull=True
                ).first()

                application_has_workspace_access = bool(application_installation)

        return (is_authenticated and not oauth2authenticated) \
                or application_has_workspace_access
