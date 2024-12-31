import uuid
from urllib.parse import urlencode, urljoin

# Django import
from django.http import HttpResponseRedirect
from django.views import View
from django.conf import settings

# Module imports
from plane.authentication.provider.oauth.github import GitHubOAuthProvider
from plane.authentication.utils.mobile.login import (
    ValidateAuthToken,
    mobile_validate_user_onboarding,
)
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.license.models import Instance
from plane.authentication.utils.host import base_host
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)


class MobileGitHubOauthInitiateEndpoint(View):
    def get(self, request):
        # Get host and next path
        request.session["host"] = base_host(request=request, is_app=True)

        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            params = exc.get_error_dict()
            url = urljoin(
                base_host(request=request, is_app=True), "m/auth/?" + urlencode(params)
            )
            return HttpResponseRedirect(url)
        try:
            scheme = (
                "https"
                if settings.IS_HEROKU
                else "https"
                if request.is_secure()
                else "http"
            )
            redirect_uri = (
                f"""{scheme}://{request.get_host()}/auth/mobile/github/callback/"""
            )

            state = uuid.uuid4().hex
            provider = GitHubOAuthProvider(
                request=request, state=state, redirect_uri=redirect_uri
            )
            request.session["state"] = state
            auth_url = provider.get_auth_url()
            return HttpResponseRedirect(auth_url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = urljoin(
                base_host(request=request, is_app=True), "m/auth/?" + urlencode(params)
            )
            return HttpResponseRedirect(url)


class MobileGitHubCallbackEndpoint(View):
    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")
        base_host = request.session.get("host")

        if state != request.session.get("state", ""):
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["GITHUB_OAUTH_PROVIDER_ERROR"],
                error_message="GITHUB_OAUTH_PROVIDER_ERROR",
            )
            params = exc.get_error_dict()
            url = urljoin(base_host, "m/auth/?" + urlencode(params))
            return HttpResponseRedirect(url)

        if not code:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["GITHUB_OAUTH_PROVIDER_ERROR"],
                error_message="GITHUB_OAUTH_PROVIDER_ERROR",
            )
            params = exc.get_error_dict()
            url = urljoin(base_host, "m/auth/?" + urlencode(params))
            return HttpResponseRedirect(url)

        try:
            scheme = (
                "https"
                if settings.IS_HEROKU
                else "https"
                if request.is_secure()
                else "http"
            )
            redirect_uri = (
                f"""{scheme}://{request.get_host()}/auth/mobile/github/callback/"""
            )
            provider = GitHubOAuthProvider(
                request=request,
                code=code,
                callback=post_user_auth_workflow,
                is_mobile=True,
                redirect_uri=redirect_uri,
            )
            # getting the user from the google provider
            user = provider.authenticate()

            # validating if the user is onboarded or not
            is_onboarded = mobile_validate_user_onboarding(user=user)
            if not is_onboarded:
                exc = AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["USER_NOT_ONBOARDED"],
                    error_message="USER_NOT_ONBOARDED",
                )
                params = exc.get_error_dict()
                url = urljoin(base_host, "m/auth/?" + urlencode(params))
                return HttpResponseRedirect(url)

            # Login the user and record his device info
            session_token = ValidateAuthToken()
            session_token.set_value(str(user.id))

            # redirect to referrer path
            url = urljoin(
                base_host, "m/auth/?" + urlencode({"token": session_token.token})
            )

            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = urljoin(base_host, "m/auth/?" + urlencode(params))
            return HttpResponseRedirect(url)
