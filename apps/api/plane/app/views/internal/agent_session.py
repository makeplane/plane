# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import uuid
from datetime import timedelta

# Django imports
from django.conf import settings
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import AgentBridgeSecretPermission
from plane.app.views.base import BaseAPIView
from plane.db.models import APIToken, User, Workspace, WorkspaceMember
from plane.db.models.api import AGENT_SESSION_TOKEN_LABEL
from plane.license.models import AgentDefinition
from plane.license.utils.encryption import EncryptionError
from plane.utils.agent_credentials import build_agent_env, resolve_agent_credential
from plane.utils.exception_logger import log_exception


def _parse_uuid(value):
    try:
        return uuid.UUID(str(value))
    except (TypeError, ValueError, AttributeError):
        return None


class AgentSessionEndpoint(BaseAPIView):
    """Bridge-only: mint and revoke the API token an agent session acts with.

    Authenticated solely by ``AgentBridgeSecretPermission``; there is no user
    session. The minted token belongs to ``user_id``, is bound to the workspace
    (see ``APIKeyAuthentication``) and expires after
    ``AGENT_SESSION_TOKEN_TTL_MINUTES``.
    """

    authentication_classes = []
    permission_classes = [AgentBridgeSecretPermission]
    # Every bridge request comes from one service IP, so the anonymous per-IP
    # throttle would cap the whole instance. The shared secret gates access.
    throttle_classes = []

    def post(self, request):
        data = request.data if isinstance(request.data, dict) else {}
        user_id = _parse_uuid(data.get("user_id"))
        agent_id = _parse_uuid(data.get("agent_id"))
        workspace_slug = data.get("workspace_slug")
        if not user_id or not agent_id or not isinstance(workspace_slug, str) or not workspace_slug:
            return Response(
                {"error": "user_id, workspace_slug and agent_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(pk=user_id, is_active=True, is_bot=False).first()
        if user is None:
            return Response({"error": "User is not active."}, status=status.HTTP_403_FORBIDDEN)

        workspace = Workspace.objects.filter(slug=workspace_slug).first()
        if (
            workspace is None
            or not WorkspaceMember.objects.filter(workspace=workspace, member=user, is_active=True).exists()
        ):
            return Response(
                {"error": "User is not an active member of this workspace."},
                status=status.HTTP_403_FORBIDDEN,
            )

        agent = AgentDefinition.objects.filter(pk=agent_id, is_enabled=True).first()
        if agent is None:
            return Response({"error": "Agent not found or disabled."}, status=status.HTTP_404_NOT_FOUND)

        # Decrypt before minting so a broken config never leaves a live token behind.
        try:
            admin_env = agent.get_env()
        except EncryptionError as e:
            log_exception(e)
            return Response(
                {"error": "Agent configuration could not be decrypted."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # The member's own credential, else the workspace's, else the admin env as is.
        credential, credential_source = resolve_agent_credential(workspace, user, agent.adapter)
        try:
            env = build_agent_env(admin_env, credential)
        except EncryptionError as e:
            log_exception(e)
            return Response(
                {"error": "Agent provider credential could not be decrypted."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        api_token = APIToken.objects.create(
            user=user,
            workspace=workspace,
            label=AGENT_SESSION_TOKEN_LABEL,
            description=f"Agent session: {agent.slug}",
            user_type=0,
            expired_at=timezone.now() + timedelta(minutes=settings.AGENT_SESSION_TOKEN_TTL_MINUTES),
        )

        return Response(
            {
                "token_id": str(api_token.id),
                "token": api_token.token,
                "expires_at": api_token.expired_at.isoformat(),
                "workspace": {"id": str(workspace.id), "slug": workspace.slug},
                "user": {"id": str(user.id)},
                "agent": {
                    "id": str(agent.id),
                    "adapter": agent.adapter,
                    "env": env,
                    "default_permission_level": agent.default_permission_level,
                    "max_permission_level": agent.max_permission_level,
                    "attach_plane_mcp": agent.attach_plane_mcp,
                    "credential_source": credential_source,
                },
                "mcp": {"url": settings.PLANE_MCP_URL, "workspace_slug": workspace.slug},
            },
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, token_id):
        # Only agent-session tokens can be revoked here, never a user's own tokens.
        updated = APIToken.objects.filter(pk=token_id, label=AGENT_SESSION_TOKEN_LABEL).update(
            is_active=False, updated_at=timezone.now()
        )
        if not updated:
            return Response({"error": "Agent session token not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
