# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import re

# Django imports
from django.core.cache import cache
from django.http import HttpResponseRedirect
from django.views import View

# Module imports
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.authentication.provider.credentials.ldap import LDAPProvider
from plane.authentication.utils.host import base_host
from plane.authentication.utils.login import user_login
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.license.models import Instance
from plane.utils.path_validator import get_safe_redirect_url

# Staff ID pattern: exactly 8 digits
STAFF_ID_PATTERN = re.compile(r"^\d{8}$")


class LDAPSignInEndpoint(View):
    """POST endpoint for LDAP authentication via Staff ID + password."""

    def post(self, request):
        next_path = request.POST.get("next_path")

        # Check instance is configured
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True),
                next_path=next_path,
                params=params,
            )
            return HttpResponseRedirect(url)

        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")

        # Validate required fields
        if not username or not password:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_AUTHENTICATION_FAILED"],
                error_message="LDAP_AUTHENTICATION_FAILED",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True),
                next_path=next_path,
                params=params,
            )
            return HttpResponseRedirect(url)

        # Validate staff ID format: exactly 8 digits
        if not STAFF_ID_PATTERN.match(username):
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_AUTHENTICATION_FAILED"],
                error_message="LDAP_AUTHENTICATION_FAILED",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True),
                next_path=next_path,
                params=params,
            )
            return HttpResponseRedirect(url)

        # Rate limiting: 5 attempts per IP per 5 minutes
        client_ip = request.META.get("REMOTE_ADDR", "unknown")
        rate_key = f"ldap_auth:{client_ip}"
        attempts = cache.get(rate_key, 0)
        if attempts >= 5:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["RATE_LIMIT_EXCEEDED"],
                error_message="RATE_LIMIT_EXCEEDED",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True),
                next_path=next_path,
                params=params,
            )
            return HttpResponseRedirect(url)

        try:
            provider = LDAPProvider(
                request=request,
                username=username,
                password=password,
                callback=post_user_auth_workflow,
            )
            user = provider.authenticate()
            # Clear rate limit on success
            cache.delete(rate_key)
            # Login user and record device info
            user_login(request=request, user=user, is_app=True)
            # Redirect to next_path or workspace
            path = next_path if next_path else get_redirection_path(user=user)
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True),
                next_path=path,
                params={},
            )
            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            # Increment rate limit counter on failure (5 min window)
            cache.set(rate_key, attempts + 1, 300)
            params = e.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True),
                next_path=next_path,
                params=params,
            )
            return HttpResponseRedirect(url)
