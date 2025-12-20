# Python imports
import uuid

# Django imports
from django.http import HttpResponseRedirect
from django.views import View

# Module imports
from plane.authentication.provider.oauth.oidc import OIDCOAuthProvider
from plane.authentication.utils.login import user_login
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.license.models import Instance
from plane.authentication.utils.host import base_host
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.utils.path_validator import get_safe_redirect_url


class OIDCOauthInitiateEndpoint(View):
    """
    Initiate OIDC authentication flow.

    Generates PKCE challenge, stores state in session, and redirects to IdP.
    """

    def get(self, request):
        request.session["host"] = base_host(request=request, is_app=True)
        next_path = request.GET.get("next_path")
        if next_path:
            request.session["next_path"] = str(next_path)

        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)

        try:
            state = uuid.uuid4().hex
            provider = OIDCOAuthProvider(request=request, state=state)

            # Store state and PKCE code_verifier in session for validation
            request.session["state"] = state
            if provider.code_verifier:
                request.session["oidc_code_verifier"] = provider.code_verifier

            auth_url = provider.get_auth_url()
            return HttpResponseRedirect(auth_url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)


class OIDCCallbackEndpoint(View):
    """
    Handle OIDC callback after user authenticates at IdP.

    Validates state, exchanges authorization code for tokens, and logs user in.
    """

    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")
        next_path = request.session.get("next_path")

        # Validate state parameter (CSRF protection)
        if state != request.session.get("state", ""):
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_OAUTH_PROVIDER_ERROR"],
                error_message="OIDC_OAUTH_PROVIDER_ERROR",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)

        # Check for authorization code
        if not code:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_OAUTH_PROVIDER_ERROR"],
                error_message="OIDC_OAUTH_PROVIDER_ERROR",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)

        try:
            provider = OIDCOAuthProvider(request=request, code=code, callback=post_user_auth_workflow)

            # Pass PKCE code_verifier from session for token exchange
            code_verifier = request.session.get("oidc_code_verifier")
            if code_verifier:
                provider.set_code_verifier(code_verifier)
                # Clean up session
                del request.session["oidc_code_verifier"]

            user = provider.authenticate()

            # Login the user and record device info
            user_login(request=request, user=user, is_app=True)

            # Get the redirection path
            if next_path:
                path = next_path
            else:
                path = get_redirection_path(user=user)

            url = get_safe_redirect_url(base_url=base_host(request=request, is_app=True), next_path=path, params={})
            return HttpResponseRedirect(url)

        except AuthenticationException as e:
            params = e.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)
