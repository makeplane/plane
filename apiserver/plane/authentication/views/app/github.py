import uuid
from urllib.parse import urlencode, urljoin

# Django import
from django.core.exceptions import ImproperlyConfigured
from django.http import HttpResponseRedirect
from django.views import View

# Module imports
from plane.authentication.provider.oauth.github import GitHubOAuthProvider
from plane.authentication.utils.login import user_login
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.workspace_project_join import (
    process_workspace_project_invitations,
)
from plane.license.models import Instance
from plane.authentication.utils.host import base_host


class GitHubOauthInitiateEndpoint(View):

    def get(self, request):
        # Get host and next path
        request.session["host"] = base_host(request=request)
        next_path = request.GET.get("next_path")
        if next_path:
            request.session["next_path"] = str(next_path)

        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            params = {
                "error_code": "INSTANCE_NOT_CONFIGURED",
                "error_message": "Instance is not configured",
            }
            url = urljoin(
                base_host(request=request),
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)
        try:
            state = uuid.uuid4().hex
            provider = GitHubOAuthProvider(request=request, state=state)
            request.session["state"] = state
            auth_url = provider.get_auth_url()
            return HttpResponseRedirect(auth_url)
        except ImproperlyConfigured as e:
            params = {
                "error_code": "IMPROPERLY_CONFIGURED",
                "error_message": str(e),
            }
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request),
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)


class GitHubCallbackEndpoint(View):

    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")
        base_host = request.session.get("host")
        next_path = request.session.get("next_path")

        if state != request.session.get("state", ""):
            params = {
                "error_code": "OAUTH_PROVIDER_ERROR",
                "error_message": "State does not match",
            }
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host,
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)

        if not code:
            params = {
                "error_code": "OAUTH_PROVIDER_ERROR",
                "error_message": "Something went wrong while fetching data from OAuth provider. Please try again after sometime.",
            }
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host,
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)

        try:
            provider = GitHubOAuthProvider(
                request=request,
                code=code,
            )
            user = provider.authenticate()
            # Login the user and record his device info
            user_login(request=request, user=user)
            # Process workspace and project invitations
            process_workspace_project_invitations(user=user)
            # Get the redirection path
            if next_path:
                path = next_path
            else:
                path = get_redirection_path(user=user)
            # redirect to referer path
            url = urljoin(base_host, path)
            return HttpResponseRedirect(url)
        except ImproperlyConfigured as e:
            params = {
                "error_code": "IMPROPERLY_CONFIGURED",
                "error_message": str(e),
            }
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host,
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)
