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
import logging
import uuid
from urllib.parse import urlencode, urljoin

# Django imports
from django.http import HttpResponseRedirect
from django.views import View

# Module imports
from plane.authentication.provider.oauth.oidc import OIDCOAuthProvider
from plane.authentication.utils.login import user_login
from plane.license.models import Instance, InstanceAdmin
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.authentication.utils.host import base_host

logger = logging.getLogger("plane.authentication")


class OIDCAuthInitiateAdminEndpoint(View):
    def get(self, request):
        request.session["host"] = base_host(request=request, is_admin=True)
        try:
            # Check instance configuration
            instance = Instance.objects.first()
            if instance is None or not instance.is_setup_done:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                    error_message="INSTANCE_NOT_CONFIGURED",
                )

            state = uuid.uuid4().hex
            provider = OIDCOAuthProvider(request=request, state=state, redirect_uri=f"{request.scheme}://{request.get_host()}/api/instances/admin/oidc/callback/")
            request.session["state"] = state
            auth_url = provider.get_auth_url()
            return HttpResponseRedirect(auth_url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = urljoin(
                base_host(request=request, is_admin=True),
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)


class OIDCCallbackAdminEndpoint(View):
    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")
        host = request.session.get("host", base_host(request=request, is_admin=True))
        try:
            if state != request.session.get("state", ""):
                logger.warning(
                    "State mismatch in OIDC admin authentication",
                    extra={
                        "error_code": AUTHENTICATION_ERROR_CODES["OIDC_PROVIDER_ERROR"],
                        "error_message": AUTHENTICATION_ERROR_CODES["OIDC_PROVIDER_ERROR"],
                    },
                )
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["OIDC_PROVIDER_ERROR"],
                    error_message=AUTHENTICATION_ERROR_CODES["OIDC_PROVIDER_ERROR"],
                )

            if not code:
                logger.warning(
                    "Code not found in OIDC admin authentication",
                    extra={
                        "error_code": AUTHENTICATION_ERROR_CODES["OIDC_PROVIDER_ERROR"],
                        "error_message": AUTHENTICATION_ERROR_CODES["OIDC_PROVIDER_ERROR"],
                    },
                )
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["OIDC_PROVIDER_ERROR"],
                    error_message=AUTHENTICATION_ERROR_CODES["OIDC_PROVIDER_ERROR"],
                )

            provider = OIDCOAuthProvider(request=request, code=code, redirect_uri=f"{request.scheme}://{request.get_host()}/api/instances/admin/oidc/callback/")
            user = provider.authenticate()
            # Verify user is an instance admin
            if not InstanceAdmin.is_instance_admin(user):
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["ADMIN_NOT_INSTANCE_ADMIN"],
                    error_message="ADMIN_NOT_INSTANCE_ADMIN",
                )
            # Login the user as admin
            user_login(request=request, user=user, is_admin=True)
            url = urljoin(host, "general/")
            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            url = urljoin(host, "?" + urlencode(e.get_error_dict()))
            return HttpResponseRedirect(url)
