# Python imports
import uuid
from urllib.parse import urlencode, urljoin

# Django imports
from django.http import HttpResponseRedirect
from django.views import View
from django.contrib.auth import logout

# Module imports
from plane.authentication.provider.oauth.oidc import OIDCOAuthProvider
from plane.authentication.utils.workspace_project_join import (
    process_workspace_project_invitations,
)
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.login import user_login
from plane.license.models import Instance
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.authentication.utils.host import base_host


class OIDCAuthInitiateEndpoint(View):
    def get(self, request):
        request.session["host"] = base_host(request=request, is_app=True)
        next_path = request.GET.get("next_path")
        if next_path:
            request.session["next_path"] = str(next_path)
        try:
            # Check instance configuration
            instance = Instance.objects.first()
            if instance is None or not instance.is_setup_done:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                    error_message="INSTANCE_NOT_CONFIGURED",
                )

            state = uuid.uuid4().hex
            provider = OIDCOAuthProvider(request=request, state=state)
            request.session["state"] = state
            auth_url = provider.get_auth_url()
            return HttpResponseRedirect(auth_url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            if next_path:
                params["next_path"] = str(next_path)
            url = urljoin(
                base_host(request=request, is_app=True), "?" + urlencode(params)
            )
            return HttpResponseRedirect(url)


class OIDCallbackEndpoint(View):
    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")
        host = request.session.get("host")
        try:
            if state != request.session.get("state", ""):
                raise AuthenticationException(
                    error_code="OIDC_PROVIDER_ERROR",
                    error_message="OIDC_PROVIDER_ERROR",
                )

            if not code:
                raise AuthenticationException(
                    error_code="OIDC_PROVIDER_ERROR",
                    error_message="OIDC_PROVIDER_ERROR",
                )

            provider = OIDCOAuthProvider(request=request, code=code)
            user = provider.authenticate()
            # Login the user and record his device info
            user_login(request=request, user=user)
            # Process workspace and project invitations
            process_workspace_project_invitations(user=user)
            # Get the redirection path
            path = get_redirection_path(user=user)
            # redirect to referer path
            url = urljoin(host, path)
            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            url = urljoin(host, "?" + urlencode(e.get_error_dict()))
            return HttpResponseRedirect(url)


class OIDCLogoutEndpoint(View):
    def get(self, request):
        logout(request=request)
        return HttpResponseRedirect(base_host(request=request, is_app=True))
