# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging
import os
import uuid

# Django import
from django.http import HttpResponseRedirect
from django.views import View


# Module imports
from plane.authentication.provider.oauth.lark import LarkOAuthProvider
from plane.authentication.utils.login import user_login
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.user_auth_workflow import post_user_auth_workflow
from plane.db.models import Workspace, WorkspaceMember
from plane.license.models import Instance
from plane.authentication.utils.host import base_host
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.utils.path_validator import get_safe_redirect_url

logger = logging.getLogger("plane.authentication.views.app.lark")


def _ensure_default_workspace_membership(user):
    """Auto-join Lark-authenticated users into a designated workspace so new
    employees land on the team's workspace instead of the "create your first
    workspace" onboarding screen.

    Controlled by env vars:
      LARK_DEFAULT_WORKSPACE_SLUG  — workspace slug to attach users to
      LARK_DEFAULT_WORKSPACE_ROLE  — int role (default 15 = Member)

    Unset slug → no-op (preserves upstream onboarding behaviour). Missing
    workspace → warn + no-op so a typo in env can't lock anyone out.
    """
    slug = (os.environ.get("LARK_DEFAULT_WORKSPACE_SLUG") or "").strip()
    if not slug:
        return

    try:
        role = int(os.environ.get("LARK_DEFAULT_WORKSPACE_ROLE", "15"))
    except ValueError:
        role = 15

    workspace = Workspace.objects.filter(slug=slug).first()
    if workspace is None:
        logger.warning("LARK_DEFAULT_WORKSPACE_SLUG=%s not found — skipping auto-join", slug)
        return

    existing = WorkspaceMember.objects.filter(workspace=workspace, member=user).first()
    if existing:
        # Re-activate previously-removed members but don't downgrade an admin
        # back to Member just because they signed in via Lark again.
        if not existing.is_active:
            existing.is_active = True
            existing.save(update_fields=["is_active"])
        return

    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role, is_active=True)
    logger.info("Lark SSO auto-joined %s to workspace %s as role=%s", user.id, slug, role)


class LarkOauthInitiateEndpoint(View):
    def get(self, request):
        request.session["host"] = base_host(request=request, is_app=True)
        next_path = request.GET.get("next_path")
        if next_path:
            request.session["next_path"] = str(next_path)

        # Check instance configuration
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                error_message="INSTANCE_NOT_CONFIGURED",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)

        try:
            state = uuid.uuid4().hex
            provider = LarkOAuthProvider(request=request, state=state)
            request.session["state"] = state
            auth_url = provider.get_auth_url()
            return HttpResponseRedirect(auth_url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)


class LarkCallbackEndpoint(View):
    def get(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")
        next_path = request.session.get("next_path")

        if state != request.session.get("state", ""):
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LARK_OAUTH_PROVIDER_ERROR"],
                error_message="LARK_OAUTH_PROVIDER_ERROR",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)
        if not code:
            exc = AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LARK_OAUTH_PROVIDER_ERROR"],
                error_message="LARK_OAUTH_PROVIDER_ERROR",
            )
            params = exc.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)
        try:
            provider = LarkOAuthProvider(request=request, code=code, callback=post_user_auth_workflow)
            user = provider.authenticate()
            # Auto-join the designated org workspace before computing the
            # redirect, so first-time SSO users skip the "create your first
            # workspace" onboarding and land directly on the team's workspace.
            _ensure_default_workspace_membership(user)
            # Login the user and record his device info
            user_login(request=request, user=user, is_app=True)
            # Get the redirection path
            if next_path:
                path = next_path
            else:
                path = get_redirection_path(user=user)
            url = get_safe_redirect_url(base_url=base_host(request=request, is_app=True), next_path=path, params={})
            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = get_safe_redirect_url(
                base_url=base_host(request=request, is_app=True), next_path=next_path, params=params
            )
            return HttpResponseRedirect(url)
