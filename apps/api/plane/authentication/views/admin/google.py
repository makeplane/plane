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

# Python imports
import uuid
import logging

# Django import
from django.http import HttpResponseRedirect
from django.views import View

# Module imports
from plane.authentication.provider.oauth.google import GoogleOAuthProvider
from plane.authentication.utils.login import user_login
from plane.license.models import Instance, InstanceAdmin
from plane.authentication.utils.host import base_host
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.utils.path_validator import get_safe_redirect_url

logger = logging.getLogger("plane.authentication")


class GoogleOauthInitiateAdminEndpoint(View):
    def get(self, request):
        request.session["host"] = base_host(request=request, is_admin=True)

        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_admin=True),
                next_path=None,
                params=params,
            )
            return HttpResponseRedirect(url)

        try:
            state = uuid.uuid4().hex
            provider = GoogleOAuthProvider(
                request=request,
                state=state,
                redirect_uri=f"""{request.scheme}://{request.get_host()}/api/instances/admin/google/callback/""",
            )
            request.session["state"] = state
            auth_url = provider.get_auth_url()
            return HttpResponseRedirect(auth_url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_admin=True),
                next_path=None,
                params=params,
            )
            return HttpResponseRedirect(url)


class GoogleCallbackAdminEndpoint(View):
    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")

        if state != request.session.get("state", ""):
            logger.warning(
                "State mismatch in Google admin callback",
                extra={
                    "error_code": AUTHENTICATION_ERROR_CODES["GOOGLE_OAUTH_PROVIDER_ERROR"],
                    "error_message": "GOOGLE_OAUTH_PROVIDER_ERROR",
                },
            )
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["GOOGLE_OAUTH_PROVIDER_ERROR"],
                error_message="GOOGLE_OAUTH_PROVIDER_ERROR",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_admin=True),
                next_path=None,
                params=params,
            )
            return HttpResponseRedirect(url)

        if not code:
            logger.warning(
                "Code not found in Google admin callback",
                extra={
                    "error_code": AUTHENTICATION_ERROR_CODES["GOOGLE_OAUTH_PROVIDER_ERROR"],
                    "error_message": "GOOGLE_OAUTH_PROVIDER_ERROR",
                },
            )
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["GOOGLE_OAUTH_PROVIDER_ERROR"],
                error_message="GOOGLE_OAUTH_PROVIDER_ERROR",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_admin=True),
                next_path=None,
                params=params,
            )
            return HttpResponseRedirect(url)

        try:
            provider = GoogleOAuthProvider(
                request=request,
                code=code,
                redirect_uri=f"{request.scheme}://{request.get_host()}/api/instances/admin/google/callback/",
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
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_admin=True),
                next_path="general/",
                params={},
            )
            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_admin=True),
                next_path=None,
                params=params,
            )
            return HttpResponseRedirect(url)
