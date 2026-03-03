# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import re

# Django imports
from django.http import HttpResponseRedirect
from django.views import View

# Module imports
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.authentication.provider.credentials.swing_sso_token import SwingSSOTokenProvider
from plane.authentication.utils.host import base_host
from plane.authentication.utils.login import user_login
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.license.models import Instance
from plane.utils.path_validator import get_safe_redirect_url

STAFF_ID_PATTERN = re.compile(r"^\d{8}$")


class SwingSSOTokenCallbackEndpoint(View):
    """Handle redirect from Swing portal with pre-authenticated token.

    GET /auth/swing-sso/callback/?token=<token>&employee_no=<id>
    Validates token via Swing XML API → lookups Plane user → creates session → redirects.
    """

    def get(self, request):
        token = request.GET.get("token", "").strip()
        employee_no = request.GET.get("employee_no", "").strip()

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
                next_path=None,
                params=params,
            )
            return HttpResponseRedirect(url)

        # Validate required params
        if not token or not employee_no:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_INVALID_TOKEN"],
                error_message="SWING_SSO_INVALID_TOKEN",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True),
                next_path=None,
                params=params,
            )
            return HttpResponseRedirect(url)

        # Validate employee_no is 8-digit staff ID
        if not STAFF_ID_PATTERN.match(employee_no):
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_INVALID_TOKEN"],
                error_message="SWING_SSO_INVALID_TOKEN",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True),
                next_path=None,
                params=params,
            )
            return HttpResponseRedirect(url)

        try:
            provider = SwingSSOTokenProvider(
                request=request,
                token=token,
                employee_no=employee_no,
                callback=post_user_auth_workflow,
            )
            user = provider.authenticate()
            user_login(request=request, user=user, is_app=True)
            path = get_redirection_path(user=user)
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True),
                next_path=path,
                params={},
            )
            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True),
                next_path=None,
                params=params,
            )
            return HttpResponseRedirect(url)
