# Python imports
import uuid
from urllib.parse import urlencode, urljoin

# Django import
from django.core.exceptions import ImproperlyConfigured
from django.http import HttpResponseRedirect
from django.views import View

from plane.authentication.provider.oauth.google import GoogleOAuthProvider
from plane.authentication.utils.login import user_login
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.workspace_project_join import (
    process_workspace_project_invitations,
)

# Module imports
from plane.license.models import Instance
from plane.authentication.utils.host import base_host


class GoogleOauthInitiateEndpoint(View):
    def get(self, request):
        request.session["host"] = base_host(request=request)

        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            url = urljoin(
                base_host(request=request),
                "?"
                + urlencode(
                    {
                        "error_code": "INSTANCE_NOT_CONFIGURED",
                        "error_message": "Instance is not configured",
                    }
                ),
            )
            return HttpResponseRedirect(url)

        try:
            state = uuid.uuid4().hex
            provider = GoogleOAuthProvider(request=request, state=state)
            request.session["state"] = state
            auth_url = provider.get_auth_url()
            return HttpResponseRedirect(auth_url)
        except ImproperlyConfigured as e:
            url = urljoin(
                base_host(request=request),
                "?"
                + urlencode(
                    {
                        "error_code": "IMPROPERLY_CONFIGURED",
                        "error_message": str(e),
                    }
                ),
            )
            return HttpResponseRedirect(url)


class GoogleCallbackEndpoint(View):
    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")
        base_host = request.session.get("host")

        if state != request.session.get("state", ""):
            url = urljoin(
                base_host,
                "?"
                + urlencode(
                    {
                        "error_code": "OAUTH_PROVIDER_ERROR",
                        "error_message": "State does not match",
                    }
                ),
            )
            return HttpResponseRedirect(url)

        if not code:
            url = urljoin(
                base_host,
                "?"
                + urlencode(
                    {
                        "error_code": "OAUTH_PROVIDER_ERROR",
                        "error_message": "Something went wrong while fetching data from OAuth provider. Please try again after sometime.",
                    }
                ),
            )
            return HttpResponseRedirect(url)

        try:
            provider = GoogleOAuthProvider(
                request=request,
                code=code,
            )
            user, is_created = provider.authenticate()
            # Login the user and record his device info
            user_login(request=request, user=user)
            # Process workspace and project invitations
            process_workspace_project_invitations(user=user)
            # Get the redirection path
            path = get_redirection_path(user=user, is_created=is_created)
            # redirect to referer path
            url = urljoin(base_host, path)
            return HttpResponseRedirect(url)
        except ImproperlyConfigured as e:
            url = urljoin(
                base_host,
                "?"
                + urlencode(
                    {
                        "error_code": "IMPROPERLY_CONFIGURED",
                        "error_message": str(e),
                    }
                ),
            )
            return HttpResponseRedirect(url)
