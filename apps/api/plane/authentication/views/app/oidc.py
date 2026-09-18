# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""AI4MS OIDC sign-in endpoints.

Local sign-in is untouched: when OIDC is unconfigured or unavailable the
initiate endpoint redirects back with an error and administrators can still
use the local entry point (P0-ID-06).
"""

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
from plane.authentication.provider.oauth.oidc import (
    OIDCOauthProvider,
    generate_pkce_pair,
)
from plane.authentication.utils.host import base_host
from plane.authentication.utils.login import user_login
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.license.models import Instance
from plane.utils.path_validator import validate_next_path

STATE_SESSION_KEY = "oidc_state"
NONCE_SESSION_KEY = "oidc_nonce"
VERIFIER_SESSION_KEY = "oidc_code_verifier"


def _error_redirect(request, exception, next_path=None):
    params = exception.get_error_dict()
    if next_path:
        params["next_path"] = str(validate_next_path(next_path))
    url = urljoin(base_host(request=request, is_app=True), "?" + urlencode(params))
    return HttpResponseRedirect(url)


class OIDCOauthInitiateEndpoint(View):
    def get(self, request):
        request.session["host"] = base_host(request=request, is_app=True)
        next_path = request.GET.get("next_path")
        if next_path:
            request.session["next_path"] = str(validate_next_path(next_path))

        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            return _error_redirect(request, exc, next_path)

        try:
            state = uuid.uuid4().hex
            nonce = uuid.uuid4().hex
            code_verifier, _ = generate_pkce_pair()
            provider = OIDCOauthProvider(
                request=request,
                state=state,
                nonce=nonce,
                code_verifier=code_verifier,
            )
            request.session[STATE_SESSION_KEY] = state
            request.session[NONCE_SESSION_KEY] = nonce
            request.session[VERIFIER_SESSION_KEY] = code_verifier
            request.session.save()
            return HttpResponseRedirect(provider.get_auth_url())
        except AuthenticationException as e:
            return _error_redirect(request, e, next_path)


class OIDCOauthCallbackEndpoint(View):
    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")
        base = request.session.get("host")
        next_path = request.session.get("next_path")

        expected_state = request.session.pop(STATE_SESSION_KEY, "")
        nonce = request.session.pop(NONCE_SESSION_KEY, None)
        code_verifier = request.session.pop(VERIFIER_SESSION_KEY, None)

        if not state or state != expected_state:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_PROVIDER_ERROR"],
                error_message="OIDC_PROVIDER_ERROR",
            )
            return _error_redirect(request, exc, next_path)

        if not code:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["OIDC_PROVIDER_ERROR"],
                error_message="OIDC_PROVIDER_ERROR",
            )
            return _error_redirect(request, exc, next_path)

        try:
            provider = OIDCOauthProvider(
                request=request,
                code=code,
                nonce=nonce,
                code_verifier=code_verifier,
                callback=post_user_auth_workflow,
            )
            user = provider.authenticate()
            user_login(request=request, user=user, is_app=True)
            path = str(validate_next_path(next_path)) if next_path else get_redirection_path(user=user)
            return HttpResponseRedirect(urljoin(base or base_host(request=request, is_app=True), path))
        except AuthenticationException as e:
            return _error_redirect(request, e, next_path)
