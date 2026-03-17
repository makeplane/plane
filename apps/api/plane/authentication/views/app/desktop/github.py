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
from urllib.parse import urlencode, urljoin

# Django import
from django.http import HttpResponseRedirect
from django.views import View

# Module imports
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.authentication.provider.oauth.github import GitHubOAuthProvider
from plane.authentication.utils.pkce import store_pkce_challenge
from plane.authentication.utils.host import base_host
from plane.authentication.utils.mobile.login import ValidateAuthToken
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.license.models import Instance


class DesktopGitHubOauthInitiateEndpoint(View):
    def get(self, request):
        request.session["host"] = base_host(request=request, is_app=True)

        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            params = exc.get_error_dict()
            url = urljoin(base_host(request=request, is_app=True), "d/auth/?" + urlencode(params))
            return HttpResponseRedirect(url)

        try:
            scheme = "https" if request.is_secure() else "http"
            redirect_uri = f"{scheme}://{request.get_host()}/auth/desktop/github/callback/"

            state = uuid.uuid4().hex
            provider = GitHubOAuthProvider(request=request, state=state, redirect_uri=redirect_uri)
            request.session["state"] = state
            store_pkce_challenge(request)
            auth_url = provider.get_auth_url()
            return HttpResponseRedirect(auth_url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = urljoin(base_host(request=request, is_app=True), "d/auth/?" + urlencode(params))
            return HttpResponseRedirect(url)


class DesktopGitHubCallbackEndpoint(View):
    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")
        host = request.session.get("host") or base_host(request=request, is_app=True)

        # Validate state
        if state != request.session.get("state", ""):
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["GITHUB_OAUTH_PROVIDER_ERROR"],
                error_message="GITHUB_OAUTH_PROVIDER_ERROR",
            )
            params = exc.get_error_dict()
            url = urljoin(host, "d/auth/?" + urlencode(params))
            return HttpResponseRedirect(url)

        # Validate code
        if not code:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["GITHUB_OAUTH_PROVIDER_ERROR"],
                error_message="GITHUB_OAUTH_PROVIDER_ERROR",
            )
            params = exc.get_error_dict()
            url = urljoin(host, "d/auth/?" + urlencode(params))
            return HttpResponseRedirect(url)

        try:
            scheme = "https" if request.is_secure() else "http"
            redirect_uri = f"{scheme}://{request.get_host()}/auth/desktop/github/callback/"
            provider = GitHubOAuthProvider(
                request=request,
                code=code,
                callback=post_user_auth_workflow,
                redirect_uri=redirect_uri,
            )

            # Authenticate the user
            user = provider.authenticate()
            user_id = str(user.id)

            # Create a token for the desktop app to exchange (5 min TTL)
            session_token = ValidateAuthToken()
            session_token.set_expiry(300)
            session_token.set_value(
                user_id,
                code_challenge=request.session.get("code_challenge"),
                challenge_method=request.session.get("challenge_method", "S256"),
            )

            # Redirect to desktop app with token
            url = urljoin(host, "d/auth/?" + urlencode({"token": session_token.token}))
            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = urljoin(host, "d/auth/?" + urlencode(params))
            return HttpResponseRedirect(url)
