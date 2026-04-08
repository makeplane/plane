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
from django.contrib.auth import login
from django.conf import settings

# Module imports
from plane.utils.host import base_host
from plane.utils.ip_address import get_client_ip
from plane.authentication.utils.session_limit import enforce_session_limit
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)


def user_login(request, user, is_app=False, is_admin=False, is_space=False):
    # Block bot users from logging in
    if user.is_bot:
        raise AuthenticationException(
            error_code=AUTHENTICATION_ERROR_CODES["BOT_LOGIN_NOT_ALLOWED"],
            error_message="BOT_LOGIN_NOT_ALLOWED",
        )

    login(request=request, user=user)

    # If is admin cookie set the custom age
    if is_admin:
        request.session.set_expiry(settings.ADMIN_SESSION_COOKIE_AGE)

    device_info = {
        "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        "ip_address": get_client_ip(request=request),
        "domain": base_host(request=request, is_app=is_app, is_admin=is_admin, is_space=is_space),
        "session_type": "web",
    }
    request.session["device_info"] = device_info
    request.session.save()

    # Enforce concurrent session limit - remove oldest sessions if limit exceeded
    enforce_session_limit(user, current_session_key=request.session.session_key)

    return
