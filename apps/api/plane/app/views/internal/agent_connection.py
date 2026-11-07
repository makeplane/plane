# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import AgentBridgeSecretPermission
from plane.app.views.base import BaseAPIView
from plane.app.views.internal.agent_session import _parse_uuid
from plane.db.models import AgentProviderCredential, User, Workspace, WorkspaceMember
from plane.db.models.agent_provider import AGENT_ACCOUNT_LABEL_MAX_LENGTH, AGENT_PROVIDER_ACCOUNT_METHOD


def _resolve_member(data):
    """Return ``(user, workspace, error_response)`` for a bridge request body."""
    user_id = _parse_uuid(data.get("user_id"))
    workspace_slug = data.get("workspace_slug")
    if not user_id or not isinstance(workspace_slug, str) or not workspace_slug:
        return (
            None,
            None,
            Response(
                {"error": "user_id and workspace_slug are required."},
                status=status.HTTP_400_BAD_REQUEST,
            ),
        )

    user = User.objects.filter(pk=user_id, is_active=True, is_bot=False).first()
    if user is None:
        return None, None, Response({"error": "User is not active."}, status=status.HTTP_403_FORBIDDEN)

    workspace = Workspace.objects.filter(slug=workspace_slug).first()
    if (
        workspace is None
        or not WorkspaceMember.objects.filter(workspace=workspace, member=user, is_active=True).exists()
    ):
        return (
            None,
            None,
            Response(
                {"error": "User is not an active member of this workspace."},
                status=status.HTTP_403_FORBIDDEN,
            ),
        )
    return user, workspace, None


def _body(request):
    return request.data if isinstance(request.data, dict) else {}


class _BridgeEndpoint(BaseAPIView):
    # Same setup as ``AgentSessionEndpoint``: the shared secret is the only auth,
    # and every bridge request comes from one service IP, so no per-IP throttle.
    authentication_classes = []
    permission_classes = [AgentBridgeSecretPermission]
    throttle_classes = []


class AgentConnectionAuthorizeEndpoint(_BridgeEndpoint):
    """Bridge-only: confirm a user may manage their account sign-ins in a workspace."""

    def post(self, request):
        user, workspace, error = _resolve_member(_body(request))
        if error:
            return error
        return Response(
            {"user": {"id": str(user.id)}, "workspace": {"id": str(workspace.id), "slug": workspace.slug}},
            status=status.HTTP_200_OK,
        )


class AgentConnectionEndpoint(_BridgeEndpoint):
    """Bridge-only: record or forget a member's account sign-in (ChatGPT, Google).

    The sign-in's tokens live in the agent runner; only the method and the account
    label are stored here, as the member's personal credential for the provider.
    """

    def put(self, request):
        data = _body(request)
        user, workspace, error = _resolve_member(data)
        if error:
            return error

        provider = data.get("provider")
        method = data.get("method")
        if not isinstance(provider, str) or method is None or AGENT_PROVIDER_ACCOUNT_METHOD.get(provider) != method:
            return Response(
                {"error": "Unsupported provider/method: only openai/chatgpt and google/google_account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        account_label = data.get("account_label") or ""
        if not isinstance(account_label, str) or len(account_label) > AGENT_ACCOUNT_LABEL_MAX_LENGTH:
            return Response(
                {"error": f"account_label must be a string of at most {AGENT_ACCOUNT_LABEL_MAX_LENGTH} characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # Replaces a personal API key for the provider, if any.
            credential, _ = AgentProviderCredential.objects.update_or_create(
                workspace=workspace,
                user=user,
                provider=provider,
                defaults={"method": method, "secret": "", "secret_hint": "", "account_label": account_label},
            )
        return Response(
            {
                "provider": credential.provider,
                "method": credential.method,
                "account_label": credential.account_label,
                "updated_at": credential.updated_at,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request):
        data = _body(request)
        user, workspace, error = _resolve_member(data)
        if error:
            return error

        provider = data.get("provider")
        method = AGENT_PROVIDER_ACCOUNT_METHOD.get(provider) if isinstance(provider, str) else None
        if method is None:
            return Response(
                {"error": "Unsupported provider: only openai and google have account sign-ins."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Only an account sign-in is removed; a personal API key is left alone.
        AgentProviderCredential.objects.filter(workspace=workspace, user=user, provider=provider, method=method).delete(
            soft=False
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
