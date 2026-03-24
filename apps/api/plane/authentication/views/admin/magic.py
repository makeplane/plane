# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Django imports
from urllib.parse import urljoin

from django.core.validators import validate_email
from django.http import HttpResponseRedirect

# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

# Module imports
from plane.authentication.provider.credentials.magic_code import MagicCodeProvider
from plane.authentication.utils.login import user_login
from plane.bgtasks.magic_link_code_task import magic_link
from plane.license.models import Instance, InstanceAdmin
from plane.authentication.utils.host import base_host
from plane.db.models import User
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.authentication.rate_limit import AuthenticationLimitedThrottle
from plane.utils.path_validator import get_safe_redirect_url
from plane.authentication.rate_limit import RateLimitedView


class MagicGenerateAdminEndpoint(APIView):
    permission_classes = [AllowAny]

    throttle_classes = [
        AuthenticationLimitedThrottle,
    ]

    def post(self, request):
        # Check if instance is configured
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            return Response(exc.get_error_dict(), status=status.HTTP_400_BAD_REQUEST)

        email = request.data.get("email", "").strip().lower()
        try:
            validate_email(email)
            adapter = MagicCodeProvider(request=request, key=email)
            key, token = adapter.initiate()
            # Send magic link email
            magic_link.delay(email, key, token)
            return Response({"key": str(key)}, status=status.HTTP_200_OK)
        except AuthenticationException as e:
            params = e.get_error_dict()
            return Response(params, status=status.HTTP_400_BAD_REQUEST)


class MagicSignInAdminEndpoint(RateLimitedView):
    def post(self, request):
        code = request.POST.get("code", "").strip()
        email = request.POST.get("email", "").strip().lower()

        if code == "" or email == "":
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED"],
                error_message="MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_admin=True),
                next_path=None,
                params=params,
            )
            return HttpResponseRedirect(url)

        # Check user exists
        existing_user = User.objects.filter(email=email).first()
        if not existing_user:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["USER_DOES_NOT_EXIST"],
                error_message="USER_DOES_NOT_EXIST",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_admin=True),
                next_path=None,
                params=params,
            )
            return HttpResponseRedirect(url)

        try:
            request.is_admin_auth = True
            provider = MagicCodeProvider(
                request=request,
                key=f"magic_{email}",
                code=code,
            )
            user = provider.authenticate()
            # Verify user is an instance admin
            if not InstanceAdmin.is_instance_admin(user):
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["ADMIN_NOT_INSTANCE_ADMIN"],
                    error_message="ADMIN_NOT_INSTANCE_ADMIN",
                )
            # Login the user as admin
            user_login(request=request, user=user, is_admin=True)
            host = base_host(request=request, is_admin=True)
            url = urljoin(host, "general/")
            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_admin=True),
                next_path=None,
                params=params,
            )
            return HttpResponseRedirect(url)
