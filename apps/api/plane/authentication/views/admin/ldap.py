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
from urllib.parse import urljoin

# Django imports
from django.http import HttpResponseRedirect
from django.views import View

# Module imports
from plane.authentication.provider.credentials.ldap import LDAPProvider
from plane.authentication.utils.login import user_login
from plane.license.models import Instance, InstanceAdmin
from plane.authentication.utils.host import base_host
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.utils.path_validator import get_safe_redirect_url


class LDAPSignInAuthAdminEndpoint(View):
    def post(self, request):
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

        # Get credentials from request
        username = request.POST.get("username", False)
        password = request.POST.get("password", False)

        # Raise exception if any of the above are missing
        if not username or not password:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["REQUIRED_USERNAME_PASSWORD_SIGN_IN"],
                error_message="REQUIRED_USERNAME_PASSWORD_SIGN_IN",
                payload={"username": str(username)},
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_admin=True),
                next_path=None,
                params=params,
            )
            return HttpResponseRedirect(url)

        # Validate username
        username = username.strip()

        try:
            provider = LDAPProvider(
                request=request,
                key=username,
                code=password,
                is_signup=False,
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
