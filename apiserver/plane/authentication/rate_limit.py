# Third party imports
from typing import Optional, Any, Callable
from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request
from django.http import HttpRequest, HttpResponse
from oauth2_provider.contrib.rest_framework import OAuth2Authentication
from django_ratelimit.core import get_usage

# Module imports
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.utils.ip_address import get_client_ip


class AuthenticationThrottle(AnonRateThrottle):
    rate = "30/minute"
    scope = "authentication"

    def throttle_failure_view(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        try:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["RATE_LIMIT_EXCEEDED"],
                error_message="RATE_LIMIT_EXCEEDED",
            )
        except AuthenticationException as e:
            return Response(
                e.get_error_dict(), status=status.HTTP_429_TOO_MANY_REQUESTS
            )


class OAuthTokenRateThrottle(SimpleRateThrottle):
    """
    Throttle for API endpoints using OAuth tokens
    """
    rate = "5000/hour"
    scope = "oauth_api_token"

    def get_cache_key(self, request: Request, view: Optional[Any] = None) -> Optional[str]:
        # Check if the request is authenticated via OAuth
        oauth2authenticated = isinstance(
            request.successful_authenticator, OAuth2Authentication
        )

        if not oauth2authenticated:
            return None  # Allow the request if it's not OauthAuthenticated

        # Get the access token
        access_token = request.auth
        ident = access_token.id

        return f"oauth_api_throttle_{ident}"

    def allow_request(self, request: Request, view: Optional[Any] = None) -> bool:
        """
        Override to add monitoring
        """
        allowed = super().allow_request(request, view)

        if allowed and self.key is not None:
            now = self.timer()
            # Calculate the remaining limit and reset time
            history = self.cache.get(self.key, [])

            # Remove old histories
            while history and history[-1] <= now - self.duration:
                history.pop()

            # Calculate the requests
            num_requests = len(history)

            # Check available requests
            available = self.num_requests - num_requests

            # Unix timestamp for when the rate limit will reset
            reset_time = int(now + self.duration)

            # Add headers
            request.META["X-RateLimit-Remaining"] = max(0, available)
            request.META["X-RateLimit-Reset"] = reset_time

        return allowed


"""
Django Ratelimit based throttling for OAuth endpoints which use Django's native class based views instead of DRF.
This implementation uses django-ratelimit with custom key functions.
"""

def token_ratelimit_key(group: Optional[str], request: HttpRequest) -> str:
    """Generate cache key for token endpoint rate limiting"""
    if request.user.is_authenticated:
        ident = f"user_{request.user.pk}"
    else:
        client_id = request.POST.get("client_id")
        if client_id:
            ident = f"client_{client_id}"
        else:
            ident = get_client_ip(request)

    return f"oauth_token_ratelimit_{ident}"


def auth_ratelimit_key(group: Optional[str], request: HttpRequest) -> str:
    """Generate cache key for authorization endpoint rate limiting"""
    if request.user.is_authenticated:
        ident = f"user_{request.user.pk}"
    else:
        client_id = request.GET.get("client_id")
        if client_id:
            ident = f"client_{client_id}"
        else:
            ident = get_client_ip(request)

    return f"oauth_authorize_ratelimit_{ident}"


def add_ratelimit_headers(
    request: HttpRequest,
    response: HttpResponse,
    rate: str,
    key_func: Callable[[Optional[str], HttpRequest], str],
    group: Optional[str] = None
) -> HttpResponse:
    """Add rate limit headers using django-ratelimit's usage data"""
    rate_parts = rate.split('/')
    rate_num = int(rate_parts[0])

    # Get current count and reset time from django-ratelimit
    usage = get_usage(request, group=group, key=key_func, rate=rate)

    if usage is None:
        return response

    count = usage['count']
    reset = usage.get('time_left')

    remaining = max(0, rate_num - count)

    # Add standard rate limit headers
    response['X-RateLimit-Limit'] = str(rate_num)
    response['X-RateLimit-Remaining'] = str(remaining)
    if reset is not None:
        response['X-RateLimit-Reset'] = str(int(reset))

    return response
