# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid
from django.http import HttpResponseRedirect
from django.views import View

from plane.authentication.provider.oauth.microsoft import MicrosoftOAuthProvider
from plane.authentication.utils.login import user_login
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.license.models import Instance
from plane.authentication.utils.host import base_host
from plane.authentication.adapter.error import AuthenticationException, AUTHENTICATION_ERROR_CODES
from plane.utils.path_validator import get_safe_redirect_url


class MicrosoftOauthInitiateEndpoint(View):
    def get(self, request):
        request.session["host"] = base_host(request=request, is_app=True)
        next_path = request.GET.get("next_path")
        if next_path:
            request.session["next_path"] = str(next_path)
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            return HttpResponseRedirect(get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path,
                params=exc.get_error_dict()))
        try:
            state = uuid.uuid4().hex
            provider = MicrosoftOAuthProvider(request=request, state=state)
            request.session["state"] = state
            return HttpResponseRedirect(provider.get_auth_url())
        except AuthenticationException as e:
            return HttpResponseRedirect(get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path,
                params=e.get_error_dict()))


class MicrosoftCallbackEndpoint(View):
    def get(self, request):
        next_path = request.GET.get("next_path")
        code = request.GET.get("code")
        state = request.GET.get("state")
        if not code or not state:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["MICROSOFT_OAUTH_PROVIDER_ERROR"],
                error_message="MICROSOFT_OAUTH_PROVIDER_ERROR",
            )
            return HttpResponseRedirect(get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path,
                params=exc.get_error_dict()))
        try:
            provider = MicrosoftOAuthProvider(request=request, code=code, callback=post_user_auth_workflow)
            user = provider.authenticate()
            user_login(request=request, user=user, is_app=True)
            path = next_path or get_redirection_path(user=user)
            return HttpResponseRedirect(get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=path, params={}))
        except AuthenticationException as e:
            return HttpResponseRedirect(get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path,
                params=e.get_error_dict()))
