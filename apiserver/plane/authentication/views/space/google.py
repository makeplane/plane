# Python imports
import uuid
from urllib.parse import urlencode, urljoin

# Django import
from django.core.exceptions import ImproperlyConfigured
from django.http import HttpResponseRedirect
from django.views import View

from plane.authentication.provider.oauth.google import GoogleOAuthProvider
from plane.authentication.utils.login import user_login


# Module imports
from plane.license.models import Instance
from plane.authentication.utils.host import base_host


class GoogleOauthInitiateSpaceEndpoint(View):
    def get(self, request):
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
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request),
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)

        try:
            state = uuid.uuid4().hex
            provider = GoogleOAuthProvider(request=request, state=state)
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


class GoogleCallbackSpaceEndpoint(View):
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
                params["next_path"] = next_path
            url = urljoin(
                base_host,
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)
        try:
            provider = GoogleOAuthProvider(
                request=request,
                code=code,
            )
            user = provider.authenticate()
            # Login the user and record his device info
            user_login(request=request, user=user)
            # redirect to referer path
            url = urljoin(
                base_host, str(next_path) if next_path else "/spaces"
            )
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
