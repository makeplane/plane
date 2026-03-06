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
from urllib.parse import urlencode

# Django import
from django.http import HttpResponseRedirect
from django.views import View

# Module imports
from plane.authentication.provider.oauth.gitea import GiteaOAuthProvider
from plane.authentication.utils.login import user_login
from plane.license.models import Instance
from plane.authentication.utils.host import base_host
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.utils.path_validator import validate_next_path


class GiteaOauthInitiateSpaceEndpoint(View):
    def get(self, request):
        # Get host and next path
        request.session["host"] = base_host(request=request, is_space=True)
        next_path = request.GET.get("next_path")
        if next_path:
            request.session["next_path"] = str(validate_next_path(next_path))

        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(validate_next_path(next_path))
            url = f"{base_host(request=request, is_space=True)}?{urlencode(params)}"
            return HttpResponseRedirect(url)

        try:
            state = uuid.uuid4().hex
            provider = GiteaOAuthProvider(
                request=request,
                state=state,
                redirect_uri=f"{request.scheme}://{request.get_host()}/auth/spaces/gitea/callback/",
            )
            request.session["state"] = state
            auth_url = provider.get_auth_url()
            return HttpResponseRedirect(auth_url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            if next_path:
                params["next_path"] = str(next_path)
            url = f"{base_host(request=request, is_space=True)}?{urlencode(params)}"
            return HttpResponseRedirect(url)


class GiteaCallbackSpaceEndpoint(View):
    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")
        next_path = request.session.get("next_path")

        if state != request.session.get("state", ""):
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["GITEA_OAUTH_PROVIDER_ERROR"],
                error_message="GITEA_OAUTH_PROVIDER_ERROR",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(validate_next_path(next_path))
            url = f"{base_host(request=request, is_space=True)}?{urlencode(params)}"
            return HttpResponseRedirect(url)

        if not code:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["GITEA_OAUTH_PROVIDER_ERROR"],
                error_message="GITEA_OAUTH_PROVIDER_ERROR",
            )
            params = exc.get_error_dict()
            if next_path:
                params["next_path"] = str(validate_next_path(next_path))
            url = f"{base_host(request=request, is_space=True)}?{urlencode(params)}"
            return HttpResponseRedirect(url)

        try:
            provider = GiteaOAuthProvider(
                request=request,
                code=code,
                redirect_uri=f"{request.scheme}://{request.get_host()}/auth/spaces/gitea/callback/",
            )
            user = provider.authenticate()
            # Login the user and record his device info
            user_login(request=request, user=user, is_space=True)
            # Process workspace and project invitations
            # redirect to referer path
            url = (
                f"{base_host(request=request, is_space=True)}{str(validate_next_path(next_path)) if next_path else ''}"
            )
            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            if next_path:
                params["next_path"] = str(validate_next_path(next_path))
            url = f"{base_host(request=request, is_space=True)}?{urlencode(params)}"
            return HttpResponseRedirect(url)
