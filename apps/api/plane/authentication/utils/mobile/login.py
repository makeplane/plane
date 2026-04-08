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

import json
import random
import string

# Django imports
from django.contrib.auth import login
from django.conf import settings

# Module imports
from plane.db.models import Profile
from plane.settings.redis import redis_instance
from plane.authentication.utils.host import base_host
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)


def generate_random_string(length=64):
    return "".join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=length))


class ValidateAuthToken:
    ri = None
    expiry = 6000
    token = None

    def __init__(self, token=None):
        self.ri = redis_instance()
        if token:
            self.token = token
        else:
            self.token = generate_random_string()

    def set_expiry(self, expiry_seconds):
        """Set the token expiry time in seconds."""
        self.expiry = expiry_seconds

    def token_exists(self):
        if self.token and self.ri:
            token_details = self.ri.get(self.token)
            if token_details:
                return True
        return False

    def set_value(self, session_key, code_challenge=None, challenge_method=None):
        if self.token and self.ri:
            data = {"session_id": session_key}
            if code_challenge:
                data["code_challenge"] = code_challenge
                data["challenge_method"] = challenge_method or "S256"
            self.ri.set(self.token, json.dumps(data), ex=self.expiry)
        else:
            raise ValueError("Token or Redis instance not set")

    def get_value(self):
        if self.token and self.ri:
            token_details = self.ri.get(self.token)
            if token_details:
                return json.loads(token_details) or None
        return None

    def remove_token(self):
        if self.token and self.ri:
            self.ri.delete(self.token)
        else:
            raise ValueError("Token or Redis instance not set")


def mobile_validate_user_onboarding(user):
    profile, _ = Profile.objects.get_or_create(user=user)

    if profile.is_onboarded:
        return True
    else:
        if all(
            [
                profile.onboarding_step.get("profile_complete"),
                profile.onboarding_step.get("workspace_create"),
                profile.onboarding_step.get("workspace_invite"),
                profile.onboarding_step.get("workspace_join"),
            ]
        ):
            return True
    return False


def mobile_user_login(request, user, is_app=False, is_admin=False, is_space=False):
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
        "ip_address": request.META.get("REMOTE_ADDR", ""),
        "domain": base_host(request=request, is_app=is_app, is_admin=is_admin, is_space=is_space),
        "session_type": "mobile",
    }
    request.session["device_info"] = device_info
    request.session.save()
    return request.session
