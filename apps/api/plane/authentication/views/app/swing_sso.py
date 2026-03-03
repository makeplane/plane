# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import re
import time

# Django imports
from django.core.cache import cache
from django.http import HttpResponseRedirect
from django.views import View

# Third party imports
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# Module imports
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.authentication.provider.credentials.swing_sso import SwingSSOProvider
from plane.authentication.utils.host import base_host
from plane.authentication.utils.login import user_login
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.db.models import User
from plane.license.api.permissions import InstanceAdminPermission
from plane.license.api.views.base import BaseAPIView
from plane.license.models import Instance
from plane.utils.path_validator import get_safe_redirect_url

# Staff ID pattern: exactly 8 digits
STAFF_ID_PATTERN = re.compile(r"^\d{8}$")
RATE_LIMIT = 5
RATE_WINDOW = 300  # 5 minutes


class SwingSSOSignInEndpoint(View):
    """POST endpoint for Swing SSO authentication via Staff ID + password."""

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
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_AUTHENTICATION_FAILED"],
                error_message="SWING_SSO_AUTHENTICATION_FAILED",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True),
                next_path=next_path,
                params=params,
            )
            return HttpResponseRedirect(url)

        # Validate staff ID format
        if not STAFF_ID_PATTERN.match(username):
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_AUTHENTICATION_FAILED"],
                error_message="SWING_SSO_AUTHENTICATION_FAILED",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True),
                next_path=next_path,
                params=params,
            )
            return HttpResponseRedirect(url)

        # Rate limiting
        client_ip = request.META.get("REMOTE_ADDR", "unknown")
        rate_key = f"swing_sso_auth:{client_ip}"
        attempts = cache.get(rate_key, 0)
        if attempts >= RATE_LIMIT:
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
            provider = SwingSSOProvider(
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
            # Increment rate limit counter on failure
            cache.set(rate_key, attempts + 1, RATE_WINDOW)
            params = e.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True),
                next_path=next_path,
                params=params,
            )
            return HttpResponseRedirect(url)


class SwingSSOTestEndpoint(BaseAPIView):
    """Test Swing SSO config — admin only, returns JSON with timing info."""

    permission_classes = [IsAuthenticated, InstanceAdminPermission]

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")

        if not username or not password:
            return Response(
                {"error": "username and password required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not STAFF_ID_PATTERN.match(username):
            return Response(
                {"error": "Staff ID must be exactly 8 digits"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        start_time = time.time()

        try:
            provider = SwingSSOProvider(
                request=request,
                username=username,
                password=password,
            )
            result = provider._authenticate_swing()
            elapsed = round((time.time() - start_time) * 1000)

            result_code = result.get("common", {}).get("resultCode", "")
            auth_result = result.get("data", {}).get("authResult", "")
            success = result_code == "200" and auth_result == "SUCCESS"

            # Check if Plane user exists
            email = f"sh{username}@swing.shinhan.com"
            plane_user = User.objects.filter(email=email).first()

            return Response({
                "success": success,
                "result_code": result_code,
                "auth_result": auth_result,
                "employee_no": username,
                "company_code": provider.company_code,
                "api_url": provider.swing_url,
                "response_time_ms": elapsed,
                "plane_user_found": plane_user is not None,
                "plane_user_email": email,
                "raw_response": result,
            })

        except AuthenticationException as e:
            elapsed = round((time.time() - start_time) * 1000)
            return Response({
                "success": False,
                "error_code": e.error_code,
                "error_message": e.error_message,
                "response_time_ms": elapsed,
            })
