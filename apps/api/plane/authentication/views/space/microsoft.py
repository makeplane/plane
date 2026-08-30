# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid
from django.http import HttpResponseRedirect
from django.views import View
from django.utils.http import url_has_allowed_host_and_scheme

from plane.authentication.provider.oauth.microsoft import MicrosoftOAuthProvider
from plane.authentication.utils.login import user_login
from plane.license.models import Instance
from plane.authentication.utils.host import base_host
from plane.authentication.adapter.error import AuthenticationException, AUTHENTICATION_ERROR_CODES
from plane.utils.path_validator import get_safe_redirect_url, validate_next_path, get_allowed_hosts


class MicrosoftOauthInitiateSpaceEndpoint(View):
    def get(self, request):
        request.session["host"] = base_host(request=request, is_space=True)
        next_path = request.GET.get("next_path")
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            return HttpResponseRedirect(get_safe_redirect_url(
                base_url=base_host(request=request, is_space=True), next_path=next_path,
                params=exc.get_error_dict()))
        try:
            state = uuid.uuid4().hex
            provider = MicrosoftOAuthProvider(request=request, state=state)
            request.session["state"] = state
            auth_url = provider.get_auth_url()
            return HttpResponseRedirect(get_safe_redirect_url(
                base_url=auth_url, next_path=None, params={}))
        except AuthenticationException as e:
            return HttpResponseRedirect(get_safe_redirect_url(
                base_url=base_host(request=request, is_space=True), next_path=next_path,
                params=e.get_error_dict()))


class MicrosoftCallbackSpaceEndpoint(View):
    def get(self, request):
        next_path = request.GET.get("next_path")
        code = request.GET.get("code")
        state = request.GET.get("state")
        stored_state = request.session.get("state")
        if state != stored_state or not code:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["MICROSOFT_OAUTH_PROVIDER_ERROR"],
                error_message="MICROSOFT_OAUTH_PROVIDER_ERROR",
            )
            return HttpResponseRedirect(get_safe_redirect_url(
                base_url=base_host(request=request, is_space=True), next_path=next_path,
                params=exc.get_error_dict()))
        try:
            provider = MicrosoftOAuthProvider(request=request, code=code)
            user = provider.authenticate()
            user_login(request=request, user=user, is_space=True)
            next_path = validate_next_path(next_path=next_path)
            url = f"{base_host(request=request, is_space=True).rstrip('/')}{next_path}"
            if url_has_allowed_host_and_scheme(url, allowed_hosts=get_allowed_hosts()):
                return HttpResponseRedirect(url)
            return HttpResponseRedirect(base_host(request=request, is_space=True))
        except AuthenticationException as e:
            return HttpResponseRedirect(get_safe_redirect_url(
                base_url=base_host(request=request, is_space=True), next_path=next_path,
                params=e.get_error_dict()))
