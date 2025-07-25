# Standard library imports
import json
from typing import Any, Dict, Tuple
from urllib.parse import urlencode

# Third-party imports
from django.conf import settings
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect, JsonResponse
from django.template.response import TemplateResponse
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from oauth2_provider.views import AuthorizationView, TokenView
from oauth2_provider.oauth2_validators import OAuth2Validator
from rest_framework import exceptions, status

# Local application imports
from plane.db.models.webhook import Webhook
from plane.authentication.adapter.error import AUTHENTICATION_ERROR_CODES
from plane.authentication.models import AccessToken, WorkspaceAppInstallation
from plane.authentication.rate_limit import (
    add_ratelimit_headers,
    auth_ratelimit_key,
    token_ratelimit_key,
)
from plane.utils.exception_logger import log_exception

TOKEN_RATE_LIMIT = "5/m"


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
                    workspace_app_installation = WorkspaceAppInstallation.objects.filter(
                        id=app_installation_id,
                        application_id=application_id,
                        status=WorkspaceAppInstallation.Status.INSTALLED,
                    ).first()
                    # if the workspace app installation is not found, delete the token
                    if not workspace_app_installation:
                        token.delete()
                        raise exceptions.ValidationError("Workspace application not found")

                    # set the bot user on the token
                    token.user = workspace_app_installation.app_bot

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
