# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import os
from functools import wraps

# Third party imports
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework import status
from rest_framework.response import Response

# Django imports
from django.http import HttpResponseRedirect

# Module imports
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.authentication.utils.host import base_host
from plane.utils.path_validator import get_safe_redirect_url


class AuthenticationThrottle(AnonRateThrottle):
    # Rate is configurable per-deployment via the AUTHENTICATION_RATE_LIMIT
    # env var (DRF format: "<num>/<period>" where period is second/minute/hour/day).
    rate = os.environ.get("AUTHENTICATION_RATE_LIMIT", "10/minute")
    scope = "authentication"

    def throttle_failure_view(self, request, *args, **kwargs):
        try:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["RATE_LIMIT_EXCEEDED"],
                error_message="RATE_LIMIT_EXCEEDED",
            )
        except AuthenticationException as e:
            return Response(e.get_error_dict(), status=status.HTTP_429_TOO_MANY_REQUESTS)


def authentication_throttle_allows(request):
    """
    Apply AuthenticationThrottle to a plain django.views.View request.

    DRF's throttle_classes only run inside APIView.initial(); the magic
    sign-in / sign-up endpoints extend django.views.View to return
    HttpResponseRedirect from a form POST flow, so they need a manual
    throttle check. Returns True if the request is allowed through,
    False if it should be rejected with a RATE_LIMIT_EXCEEDED error.
    """
    throttle = AuthenticationThrottle()
    # SimpleRateThrottle.allow_request only reads request.META and
    # request.user, both available on a plain Django HttpRequest.
    return throttle.allow_request(request, None)


def throttle_auth_redirect(*, is_app=False, is_space=False):
    """
    Decorator for redirect-flow ``django.views.View`` POST handlers.

    Applies AuthenticationThrottle before the wrapped handler runs; when the
    per-IP budget is exceeded it short-circuits with a RATE_LIMIT_EXCEEDED
    redirect to the auth error page (the same behaviour every throttled auth
    endpoint uses). The throttle runs before any DB access in the handler, so
    brute-force traffic is rejected without touching the database.

    Pass ``is_app=True`` for /app auth views and ``is_space=True`` for /spaces
    auth views so the redirect targets the correct base host.
    """

    def decorator(post_method):
        @wraps(post_method)
        def wrapper(self, request, *args, **kwargs):
            if not authentication_throttle_allows(request):
                exc = AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["RATE_LIMIT_EXCEEDED"],
                    error_message="RATE_LIMIT_EXCEEDED",
                )
                url = get_safe_redirect_url(
                    base_url=base_host(request=request, is_app=is_app, is_space=is_space),
                    next_path=request.POST.get("next_path"),
                    params=exc.get_error_dict(),
                )
                return HttpResponseRedirect(url)
            return post_method(self, request, *args, **kwargs)

        return wrapper

    return decorator


class EmailVerificationThrottle(UserRateThrottle):
    """
    Throttle for email verification code generation.
    Limits to 3 requests per hour per user to prevent abuse.
    """

    rate = "3/hour"
    scope = "email_verification"

    def throttle_failure_view(self, request, *args, **kwargs):
        try:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["RATE_LIMIT_EXCEEDED"],
                error_message="RATE_LIMIT_EXCEEDED",
            )
        except AuthenticationException as e:
            return Response(e.get_error_dict(), status=status.HTTP_429_TOO_MANY_REQUESTS)
