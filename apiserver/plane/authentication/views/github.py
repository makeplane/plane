# Python imports
import uuid
from urllib.parse import urlencode

# Django import
from django.core.exceptions import ImproperlyConfigured
from django.http import HttpResponseRedirect
from django.views import View

# Module imports
from plane.authentication.provider.oauth.github import GitHubOAuthProvider
from plane.authentication.utils.login import user_login
from plane.authentication.utils.workspace_project_join import (
    process_workspace_project_invitations,
)
from plane.license.models import Instance


class GitHubOauthInitiateEndpoint(View):

    def get(self, request):
        referer = request.META.get("HTTP_REFERER", "/")
        request.session["referer"] = referer

        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            url = (
                referer
                + "?"
                + urlencode({"error": "Instance is not configured"})
            )
            return HttpResponseRedirect(url)

        try:
            state = uuid.uuid4().hex
            provider = GitHubOAuthProvider(request=request, state=state)
            request.session["state"] = state
            auth_url = provider.get_auth_url()
            return HttpResponseRedirect(auth_url)
        except ImproperlyConfigured as e:
            url = referer + "?" + urlencode({"error": str(e)})
            return HttpResponseRedirect(url)


class GitHubCallbackEndpoint(View):

    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")
        referer = request.session.get("referer")

        if state != request.session.get("state", ""):
            url = referer + "?" + urlencode({"error": "State does not match"})
            return HttpResponseRedirect(url)

        if not code:
            url = (
                referer
                + "?"
                + urlencode(
                    {
                        "error": "Something went wrong while fetching data from OAuth provider. Please try again after sometime."
                    }
                )
            )
            return HttpResponseRedirect(url)

        try:
            provider = GitHubOAuthProvider(
                request=request,
                code=code,
            )
            user = provider.authenticate()
            process_workspace_project_invitations(user=user)
            user_login(request=request, user=user)
            url = referer + "?" + urlencode({"success": "true"})
            return HttpResponseRedirect(url)
        except ImproperlyConfigured as e:
            url = referer + "?" + urlencode({"error": str(e)})
            return HttpResponseRedirect(url)
