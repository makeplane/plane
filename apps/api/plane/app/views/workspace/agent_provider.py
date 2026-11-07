# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import transaction

# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkspaceViewerPermission
from plane.app.permissions.workspace import Admin
from plane.app.views.base import BaseAPIView
from plane.db.models import AgentProvider, AgentProviderCredential, Workspace, WorkspaceMember
from plane.db.models.agent_provider import validate_agent_api_key
from plane.license.utils.encryption import EncryptionError
from plane.utils.agent_credentials import provider_entries
from plane.utils.exception_logger import log_exception

SCOPE_PERSONAL = "personal"
SCOPE_WORKSPACE = "workspace"


def _is_workspace_admin(user, slug):
    return WorkspaceMember.objects.filter(workspace__slug=slug, member=user, role=Admin, is_active=True).exists()


class WorkspaceAgentProvidersEndpoint(BaseAPIView):
    """The AI-provider credentials the caller and the workspace have for the agent chat.

    Only metadata (method, last four characters, account label) is returned; secrets never are.
    """

    permission_classes = [WorkspaceViewerPermission]

    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        entries = provider_entries(workspace, request.user, _is_workspace_admin(request.user, slug))
        return Response(entries, status=status.HTTP_200_OK)


class WorkspaceAgentProviderCredentialEndpoint(BaseAPIView):
    """Set or remove the caller's personal API key, or (admins only) the workspace's shared one.

    ``scope`` is ``personal`` or ``workspace``, fixed by the URL.
    """

    permission_classes = [WorkspaceViewerPermission]

    def _check(self, request, slug, provider, scope):
        if provider not in AgentProvider.values:
            return Response({"error": "Unknown provider."}, status=status.HTTP_404_NOT_FOUND)
        if scope == SCOPE_WORKSPACE and not _is_workspace_admin(request.user, slug):
            return Response(
                {"error": "Only workspace admins can manage the workspace key."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def put(self, request, slug, provider, scope):
        denied = self._check(request, slug, provider, scope)
        if denied:
            return denied

        data = request.data if isinstance(request.data, dict) else {}
        api_key = data.get("api_key")
        workspace = Workspace.objects.get(slug=slug)
        user = request.user if scope == SCOPE_PERSONAL else None
        invalid = validate_agent_api_key(api_key)
        if invalid:
            return Response({"error": invalid}, status=status.HTTP_400_BAD_REQUEST)
        credential = AgentProviderCredential(workspace=workspace, user=user, provider=provider)
        try:
            credential.set_api_key(api_key)
        except EncryptionError as e:
            log_exception(e)
            return Response(
                {"error": "The API key could not be stored."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        with transaction.atomic():
            # One row per (workspace, user, provider): a personal API key replaces an account sign-in.
            AgentProviderCredential.objects.update_or_create(
                workspace=workspace,
                user=user,
                provider=provider,
                defaults={
                    "method": credential.method,
                    "secret": credential.secret,
                    "secret_hint": credential.secret_hint,
                    "account_label": credential.account_label,
                },
            )

        [entry] = provider_entries(
            workspace, request.user, _is_workspace_admin(request.user, slug), providers=(provider,)
        )
        return Response(entry, status=status.HTTP_200_OK)

    def delete(self, request, slug, provider, scope):
        denied = self._check(request, slug, provider, scope)
        if denied:
            return denied

        rows = AgentProviderCredential.objects.filter(workspace__slug=slug, provider=provider)
        if scope == SCOPE_PERSONAL:
            rows = rows.filter(user=request.user)
        else:
            rows = rows.filter(user__isnull=True)
        # Hard delete: a removed secret must not linger in a soft-deleted row.
        rows.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)
