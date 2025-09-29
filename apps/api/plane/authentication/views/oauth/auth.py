# Standard library imports
import json
from typing import Any, Dict, Tuple
from urllib.parse import urlencode

# Third-party imports
from django.core.cache import cache
from django.conf import settings
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect, JsonResponse
from django.template.response import TemplateResponse
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from oauth2_provider.views import AuthorizationView, TokenView
from oauth2_provider.oauth2_validators import OAuth2Validator
from rest_framework import exceptions, status

# Local application imports
from plane.authentication.adapter.error import AUTHENTICATION_ERROR_CODES
from plane.authentication.models import (
    AccessToken,
    WorkspaceAppInstallation,
    Grant,
    RefreshToken,
)
from plane.authentication.rate_limit import (
    add_ratelimit_headers,
    auth_ratelimit_key,
    token_ratelimit_key,
)

TOKEN_RATE_LIMIT = "5/m"
APP_INSTALLATION_ID_CACHE_TTL = 60  # 1 minute


class OAuthTokenEndpoint(TokenView):
    """OAuth token endpoint with rate limiting (5/minute)"""

    @method_decorator(
        ratelimit(
            key=token_ratelimit_key, rate=TOKEN_RATE_LIMIT, block=False, group="token"
        )
    )
    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        # Check if rate limited before proceeding
        if getattr(request, "limited", False):
            return JsonResponse(
                {
                    "error_code": AUTHENTICATION_ERROR_CODES["RATE_LIMIT_EXCEEDED"],
                    "error_message": "Too many requests, please try again later.",
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        response = super().dispatch(request, *args, **kwargs)
        return add_ratelimit_headers(
            request, response, TOKEN_RATE_LIMIT, token_ratelimit_key, group="token"
        )

    def create_token_response(
        self, request: HttpRequest
    ) -> Tuple[int, Dict[str, str], bytes, int]:
        token_response = super().create_token_response(request)
        _, headers, token_data, status_code = token_response
        token_data = json.loads(token_data)

        # Set the bot user on the token
        access_token = token_data.get("access_token")
        if access_token:
            # get the token
            token = AccessToken.objects.get(token=access_token)
            application_id = token.application_id
            app_installation_id = request.POST.get("app_installation_id")
            grant_type = request.POST.get("grant_type")

            # if grant type is client credentials, we need to set the bot user
            if grant_type == "client_credentials":
                # app installation id is required for client credentials
                if not app_installation_id:
                    token.delete()
                    raise exceptions.ValidationError("App installation ID is required")
                else:
                    # get the workspace app installation
                    workspace_app_installation = (
                        WorkspaceAppInstallation.objects.filter(
                            id=app_installation_id,
                            application_id=application_id,
                            status=WorkspaceAppInstallation.Status.INSTALLED,
                        ).first()
                    )
                    # if the workspace app installation is not found, delete the token
                    if not workspace_app_installation:
                        token.delete()
                        raise exceptions.ValidationError(
                            "Workspace application not found"
                        )

                    # set the bot user, workspace app installation and workspace on the token
                    token.user = workspace_app_installation.app_bot
                    token.workspace_app_installation = workspace_app_installation
                    token.workspace = workspace_app_installation.workspace

            # set the grant type on the token
            token.grant_type = grant_type
            token.save()

        return token_response


AUTHORIZE_RATE_LIMIT = "10/m"


class CustomAuthorizationView(AuthorizationView):
    """OAuth authorization view with rate limiting (10/minute)"""

    @method_decorator(
        ratelimit(
            key=auth_ratelimit_key, rate=AUTHORIZE_RATE_LIMIT, block=False, group="auth"
        )
    )
    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        # Check if rate limited before proceeding
        if getattr(request, "limited", False):
            return JsonResponse(
                {
                    "error_code": AUTHENTICATION_ERROR_CODES["RATE_LIMIT_EXCEEDED"],
                    "error_message": "Too many requests, please try again later.",
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        response = super().dispatch(request, *args, **kwargs)
        return add_ratelimit_headers(
            request, response, AUTHORIZE_RATE_LIMIT, auth_ratelimit_key, group="auth"
        )

    def handle_no_permission(self) -> HttpResponseRedirect:
        # Redirect to login with the current URL as the next path
        query_params = urlencode({"next_path": self.request.build_absolute_uri()})
        return HttpResponseRedirect(f"{settings.WEB_URL}/login?{query_params}")

    def get(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        query_params = urlencode(request.GET)
        response = super().get(request, *args, **kwargs)
        # Redirect to the frontend OAuth page if template response
        if isinstance(response, TemplateResponse):
            return HttpResponseRedirect(f"{settings.WEB_URL}/oauth?{query_params}")
        return response

    def redirect(self, redirect_to, application):
        additional_params = self.request.POST.get("additional_params")
        if additional_params:
            if "?" in redirect_to:
                redirect_to = f"{redirect_to}&{additional_params}"
            else:
                redirect_to = f"{redirect_to}?{additional_params}"
        return super().redirect(redirect_to, application)

    def form_valid(self, form):
        # store app installation id in cache to be used in save_authorization_code
        additional_params = self.request.POST.get("additional_params")
        if additional_params:
            from urllib.parse import parse_qs

            parsed = parse_qs(additional_params)
            app_installation_id = parsed.get("app_installation_id", [None])[0]
            client_id = form.cleaned_data.get("client_id")
            if app_installation_id and client_id:
                # store in cache with request user id as key
                cache.set(
                    f"app_installation_id_{client_id}_{self.request.user.id}",
                    app_installation_id,
                    APP_INSTALLATION_ID_CACHE_TTL,
                )

        return super().form_valid(form)


class CustomOAuth2Validator(OAuth2Validator):
    def validate_grant_type(
        self, client_id, grant_type, client, request, *args, **kwargs
    ):
        """
        Allow both authorization_code and client_credentials regardless of grant type
        """
        allowed_grant_types = [
            "authorization_code",
            "client_credentials",
            "refresh_token",
        ]
        return grant_type in allowed_grant_types

    def save_authorization_code(self, client_id, code, request, *args, **kwargs):
        """
        Save the authorization code
        """
        # Call parent method to save the authorization code
        super().save_authorization_code(client_id, code, request, *args, **kwargs)

        # Now retrieve the created grant object
        grant = None
        try:
            grant = Grant.objects.get(code=code["code"])
        except Grant.DoesNotExist:
            # Log this error or handle as needed
            print(f"Grant with code {code['code']} not found")
            return None

        # Get app_installation_id from cache
        app_installation_id = cache.get(
            f"app_installation_id_{client_id}_{request.user.id}"
        )
        if app_installation_id and grant:
            try:
                # Get the workspace app installation
                workspace_app_installation = WorkspaceAppInstallation.objects.filter(
                    id=app_installation_id,
                    status=WorkspaceAppInstallation.Status.INSTALLED,
                ).first()
                # if the workspace app installation is found,
                # set the workspace app installation and workspace on the grant
                if workspace_app_installation:
                    grant.workspace_app_installation = workspace_app_installation
                    grant.workspace = workspace_app_installation.workspace
                    grant.save()
            except Exception as e:
                # Log the error
                print(f"Error updating grant: {e}")

        # Delete app_installation_id from cache
        cache.delete(f"app_installation_id_{client_id}_{request.user.id}")
        return grant

    def _create_access_token(self, expires, request, token, source_refresh_token=None):
        """
        Create the access token
        """
        access_token = super()._create_access_token(
            expires, request, token, source_refresh_token
        )

        # get the grant and fetch grant
        code = getattr(request, "code", None)
        # workspace info is not set for client credentials grant type
        # and is set in create_token_response
        if not code and not source_refresh_token:
            return access_token

        # get the workspace app installation via grant or refresh token
        # based on the grant type
        workspace_app_installation = None
        if code:
            grant = Grant.objects.get(code=code)
            workspace_app_installation = grant.workspace_app_installation
        else:
            refresh_token = RefreshToken.objects.get(token=source_refresh_token)
            workspace_app_installation = refresh_token.workspace_app_installation

        # set the workspace and workspace app installation on the access token
        if workspace_app_installation:
            access_token.workspace = workspace_app_installation.workspace
            access_token.workspace_app_installation = workspace_app_installation
            access_token.save()
        return access_token

    def _create_refresh_token(
        self, request, refresh_token_code, access_token, previous_refresh_token
    ):
        """
        Create the refresh token
        """
        refresh_token = super()._create_refresh_token(
            request, refresh_token_code, access_token, previous_refresh_token
        )

        # Get workspace info from the access_token
        if access_token and hasattr(access_token, "workspace_app_installation"):
            workspace_app_installation = access_token.workspace_app_installation
            if workspace_app_installation:
                refresh_token.workspace = workspace_app_installation.workspace
                refresh_token.workspace_app_installation = workspace_app_installation
                refresh_token.save()

        return refresh_token
