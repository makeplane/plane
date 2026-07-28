# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import os

# Third party imports
from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle, UserRateThrottle
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)


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


class AuthenticationAccountThrottle(SimpleRateThrottle):
    """Per-account (submitted email) authentication throttle.

    AuthenticationThrottle keys on DRF get_ident, which honors X-Forwarded-For when
    NUM_PROXIES is unset — an attacker can rotate that header to get a fresh bucket per
    request and brute-force credentials unthrottled. Bucketing a second limiter by the
    normalized email caps guesses against any single account regardless of source IP.
    Email is normalized (strip + lower) to match the login lookup so casing tricks cannot
    multiply the allowance; requests without an email fall back to the client identity.
    """

    scope = "authentication_account"
    rate = os.environ.get("AUTHENTICATION_ACCOUNT_RATE_LIMIT", "5/minute")

    def get_cache_key(self, request, view=None):
        email = (request.POST.get("email") or "").strip().lower()
        ident = f"email:{email}" if email else f"ip:{self.get_ident(request)}"
        return self.cache_format % {"scope": self.scope, "ident": ident}


def authentication_account_throttle_allows(request):
    """Per-account counterpart to authentication_throttle_allows (see above)."""
    return AuthenticationAccountThrottle().allow_request(request, None)


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
