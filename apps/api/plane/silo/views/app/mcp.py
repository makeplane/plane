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
import json
import logging
import secrets
from urllib.parse import urlencode

# Django imports
from django.conf import settings
from django.http import HttpResponseRedirect

# Third party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkSpaceAdminPermission
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.app.views.base import BaseAPIView
from plane.db.models import Workspace
from plane.settings.redis import redis_instance
from plane.silo.models import (
    MCPApplication,
    MCPApplicationOwner,
    MCPAuthType,
    MCPConnectionCredentials,
)
from plane.silo.serializers.mcp import MCPApplicationSerializer, MCPHeaderSerializer
from plane.silo.services.mcp_connection import (
    build_auth_headers,
    decrypt_auth_config,
    discover_oauth_metadata,
    encrypt_auth_config,
    exchange_oauth_code,
    generate_pkce,
    register_oauth_client,
    test_mcp_connection,
)
from plane.silo.utils.mcp import (
    build_mcp_serializer_context,
    check_mcp_app_owner,
    generate_unique_slug,
    refresh_token_if_expired,
    save_credentials_and_activate,
)

logger = logging.getLogger("plane.silo.views.mcp")

# OAuth state TTL in Redis (seconds)
OAUTH_STATE_TTL = 600  # 10 minutes

# Limit for featured/active connectors
FEATURED_LIMIT = 3


class MCPApplicationAPIView(BaseAPIView):
    """CRUD + listing for MCP applications."""

    permission_classes = [WorkSpaceAdminPermission]

    @check_feature_flag(FeatureFlag.AI_CHAT)
    def post(self, request, slug):
        """Create a new MCP application with owner record."""
        workspace = Workspace.objects.get(slug=slug)
        app_slug = generate_unique_slug(request.data.get("name", ""))

        serializer = MCPApplicationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        mcp_app = serializer.save(slug=app_slug)
        MCPApplicationOwner.objects.create(
            mcp_application=mcp_app,
            workspace=workspace,
            user=request.user,
        )

        ctx = build_mcp_serializer_context(mcp_app, workspace.id, request.user.id)
        return Response(
            MCPApplicationSerializer(mcp_app, context=ctx).data,
            status=status.HTTP_201_CREATED,
        )

    @check_feature_flag(FeatureFlag.AI_CHAT)
    def get(self, request, slug, pk=None):
        """List or retrieve MCP applications."""
        workspace = Workspace.objects.get(slug=slug)

        if pk:
            mcp_app = MCPApplication.objects.get(pk=pk)

            is_owner = MCPApplicationOwner.objects.filter(
                mcp_application=mcp_app,
                workspace=workspace,
                user=request.user,
            ).exists()
            owned_app_ids = {mcp_app.id} if is_owner else set()

            ctx = build_mcp_serializer_context(
                mcp_app, workspace.id, request.user.id, owned_app_ids=owned_app_ids
            )
            return Response(
                MCPApplicationSerializer(mcp_app, context=ctx).data,
                status=status.HTTP_200_OK,
            )

        owned_app_ids = set(
            MCPApplicationOwner.objects.filter(
                workspace=workspace,
                user=request.user,
            ).values_list("mcp_application_id", flat=True)
        )

        qs = MCPApplication.objects.filter(id__in=owned_app_ids).order_by("-updated_at")

        # ?featured=true → only connected (active) apps, capped at FEATURED_LIMIT
        if request.query_params.get("featured", "").lower() == "true":
            qs = qs.filter(status=MCPApplication.Status.ACTIVE)[:FEATURED_LIMIT]

        credentialed_app_ids = set(
            MCPConnectionCredentials.objects.filter(
                mcp_application_id__in=owned_app_ids,
                workspace=workspace,
                user=request.user,
            ).values_list("mcp_application_id", flat=True)
        )

        serializer = MCPApplicationSerializer(
            qs,
            many=True,
            context={
                "credentialed_app_ids": credentialed_app_ids,
                "owned_app_ids": owned_app_ids,
                "workspace_id": workspace.id,
                "user_id": request.user.id,
            },
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.AI_CHAT)
    def patch(self, request, slug, pk):
        """Update an MCP application."""
        workspace = Workspace.objects.get(slug=slug)
        mcp_app = MCPApplication.objects.get(pk=pk)

        if not check_mcp_app_owner(mcp_app, workspace, request.user):
            return Response(
                {"error": "Only the owner of this MCP application can update it."},
                status=status.HTTP_403_FORBIDDEN,
            )

        allowed_fields = {"name", "url", "description", "logo_asset", "authorization_type"}
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

        serializer = MCPApplicationSerializer(mcp_app, data=update_data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        ctx = build_mcp_serializer_context(mcp_app, workspace.id, request.user.id)
        return Response(
            MCPApplicationSerializer(mcp_app, context=ctx).data,
            status=status.HTTP_200_OK,
        )

    @check_feature_flag(FeatureFlag.AI_CHAT)
    def delete(self, request, slug, pk):
        """Soft-delete an MCP application and all associated records."""
        mcp_app = MCPApplication.objects.get(pk=pk)
        mcp_app.status = MCPApplication.Status.ARCHIVED
        mcp_app.save(update_fields=["status"])
        mcp_app.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MCPApplicationDisconnectAPIView(BaseAPIView):
    """Disconnect an MCP application."""

    permission_classes = [WorkSpaceAdminPermission]

    @check_feature_flag(FeatureFlag.AI_CHAT)
    def post(self, request, slug, pk):
        workspace = Workspace.objects.get(slug=slug)
        mcp_app = MCPApplication.objects.get(pk=pk)

        MCPConnectionCredentials.objects.filter(
            mcp_application=mcp_app,
            workspace=workspace,
            user=request.user,
        ).delete()

        mcp_app.status = MCPApplication.Status.INACTIVE
        mcp_app.save(update_fields=["status"])

        return Response({"status": "disconnected"}, status=status.HTTP_200_OK)


class MCPApplicationCredentialsAPIView(BaseAPIView):
    """Manage credentials (headers) for an MCP application."""

    permission_classes = [WorkSpaceAdminPermission]

    @check_feature_flag(FeatureFlag.AI_CHAT)
    def patch(self, request, slug, pk):
        """Save or update header credentials for an MCP application."""
        workspace = Workspace.objects.get(slug=slug)
        mcp_app = MCPApplication.objects.get(pk=pk)

        if not check_mcp_app_owner(mcp_app, workspace, request.user):
            return Response(
                {"error": "Only the owner of this MCP application can update its credentials."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if mcp_app.authorization_type != MCPAuthType.HEADER:
            return Response(
                {"error": "Credentials endpoint is only for HEADER auth type."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        headers_list = request.data.get("headers", [])
        headers_serializer = MCPHeaderSerializer(data=headers_list, many=True)
        if not headers_serializer.is_valid():
            return Response(headers_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        credential, _ = MCPConnectionCredentials.objects.get_or_create(
            mcp_application=mcp_app,
            workspace=workspace,
            user=request.user,
        )
        credential.save(updated_headers=headers_list)

        mcp_app.refresh_from_db()
        ctx = build_mcp_serializer_context(mcp_app, workspace.id, request.user.id)
        return Response(
            MCPApplicationSerializer(mcp_app, context=ctx).data,
            status=status.HTTP_200_OK,
        )


class MCPApplicationConnectAPIView(BaseAPIView):
    """Connect an MCP application (none / header auth types only)."""

    permission_classes = [WorkSpaceAdminPermission]

    @check_feature_flag(FeatureFlag.AI_CHAT)
    def post(self, request, slug, pk):
        workspace = Workspace.objects.get(slug=slug)
        mcp_app = MCPApplication.objects.get(pk=pk)

        auth_type = mcp_app.authorization_type

        if auth_type == MCPAuthType.NONE:
            return self._connect_none(mcp_app, workspace.id, request.user.id)
        elif auth_type == MCPAuthType.HEADER:
            return self._connect_header(mcp_app, workspace.id, request.user.id)
        else:
            return Response(
                {"error": f"Unsupported auth type for this endpoint: {auth_type}. Use /connect/oauth/ for OAuth."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def _connect_none(self, mcp_app, workspace_id, user_id):
        """Connect with no authentication — just test the URL."""
        success, data = test_mcp_connection(mcp_app.url)
        if not success:
            return Response(
                {"error": data.get("error", "Could not connect to MCP server.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        save_credentials_and_activate(mcp_app, workspace_id, user_id, auth_config={})
        return Response({"status": "connected", "detail": data}, status=status.HTTP_200_OK)

    def _connect_header(self, mcp_app, workspace_id, user_id):
        """Connect with HEADER / API key headers fetched from stored credentials."""
        try:
            credentials = MCPConnectionCredentials.objects.get(
                mcp_application=mcp_app,
                workspace_id=workspace_id,
                user_id=user_id,
            )
        except MCPConnectionCredentials.DoesNotExist:
            return Response(
                {"error": "No credentials found. Please save headers before connecting."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        decrypted = decrypt_auth_config(credentials.auth_config)
        headers_list = decrypted.get("headers", [])
        headers_serializer = MCPHeaderSerializer(data=headers_list, many=True)
        if not headers_serializer.is_valid():
            return Response(headers_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        test_headers = {h["name"]: h["value"] for h in headers_list}
        success, data = test_mcp_connection(mcp_app.url, headers=test_headers)
        if not success:
            return Response(
                {"error": data.get("error", "Could not connect to MCP server.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        save_credentials_and_activate(mcp_app, workspace_id, user_id, credentials.auth_config)
        return Response({"status": "connected", "detail": data}, status=status.HTTP_200_OK)


class MCPApplicationOAuthConnectAPIView(BaseAPIView):
    """Initiate OAuth connection for an MCP application."""

    permission_classes = [WorkSpaceAdminPermission]

    @check_feature_flag(FeatureFlag.AI_CHAT)
    def get(self, request, slug, pk):
        workspace = Workspace.objects.get(slug=slug)
        mcp_app = MCPApplication.objects.get(pk=pk)

        if mcp_app.authorization_type != MCPAuthType.OAUTH:
            return Response(
                {"error": "This endpoint is only for OAuth authorization type."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            metadata = discover_oauth_metadata(mcp_app.url)
        except ValueError:
            logger.warning("OAuth metadata discovery failed for MCP app %s", pk, exc_info=True)
            return Response(
                {"error": "OAuth discovery failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        callback_url = f"{settings.API_URL}/silo/mcp-applications/oauth/callback/"

        if not metadata.get("registration_endpoint"):
            return Response(
                {"error": "Server does not support dynamic client registration."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            dcr_result = register_oauth_client(
                metadata["registration_endpoint"],
                redirect_uri=callback_url,
                client_name="Plane",
            )
        except ValueError:
            logger.warning("OAuth DCR failed for MCP app %s", pk, exc_info=True)
            return Response(
                {"error": "Dynamic client registration failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dcr_client_id = dcr_result["client_id"]
        dcr_client_secret = dcr_result.get("client_secret", "")
        token_endpoint_auth_method = dcr_result.get("token_endpoint_auth_method", "client_secret_post")

        # Generate PKCE
        code_verifier, code_challenge = generate_pkce()

        # Store OAuth state in Redis
        state_token = secrets.token_urlsafe(32)
        state_data = {
            "mcp_app_id": str(mcp_app.id),
            "workspace_id": str(workspace.id),
            "workspace_slug": slug,
            "user_id": str(request.user.id),
            "code_verifier": code_verifier,
            "client_id": dcr_client_id,
            "client_secret": dcr_client_secret,
            "token_endpoint": metadata["token_endpoint"],
            "token_endpoint_auth_method": token_endpoint_auth_method,
            "mcp_url": mcp_app.url,
            "resource": metadata.get("resource", mcp_app.url),
            "callback_url": callback_url,
        }

        ri = redis_instance()
        ri.setex(
            f"mcp_oauth_state:{state_token}",
            OAUTH_STATE_TTL,
            json.dumps(state_data),
        )

        # Build the authorization URL
        scopes = metadata.get("scopes_supported", [])
        auth_params = {
            "response_type": "code",
            "client_id": dcr_client_id,
            "redirect_uri": callback_url,
            "state": state_token,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
        }
        if scopes:
            auth_params["scope"] = " ".join(scopes)
        if metadata.get("resource"):
            auth_params["resource"] = metadata["resource"]

        authorization_url = f"{metadata['authorization_endpoint']}?{urlencode(auth_params)}"
        return HttpResponseRedirect(authorization_url)


class MCPApplicationOAuthCallbackAPIView(BaseAPIView):
    """
    OAuth callback endpoint.

    GET mcp-applications/oauth/callback/?code=<code>&state=<state>

    Hit by the browser redirect from the external authorization server.
    Uses AllowAny since the external server cannot produce session cookies.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get("code")
        state_token = request.query_params.get("state")

        app_url = settings.APP_BASE_URL or ""
        fallback_error_url = f"{app_url}?status=error&reason=missing_params"

        if not code or not state_token:
            return HttpResponseRedirect(fallback_error_url)

        # Retrieve and consume state from Redis
        ri = redis_instance()
        state_raw = ri.get(f"mcp_oauth_state:{state_token}")
        if not state_raw:
            return HttpResponseRedirect(
                f"{app_url}?status=error&reason=invalid_or_expired_state"
            )

        ri.delete(f"mcp_oauth_state:{state_token}")

        try:
            state_data = json.loads(state_raw)
        except (json.JSONDecodeError, TypeError):
            return HttpResponseRedirect(
                f"{app_url}?status=error&reason=corrupted_state"
            )

        mcp_app_id = state_data["mcp_app_id"]
        workspace_id = state_data["workspace_id"]
        workspace_slug = state_data.get("workspace_slug", "")
        user_id = state_data["user_id"]

        connectors_url = f"{app_url}/{workspace_slug}/settings/integrations?tab=connectors"

        # Exchange authorization code for tokens
        try:
            token_data = exchange_oauth_code(
                token_endpoint=state_data["token_endpoint"],
                code=code,
                client_id=state_data["client_id"],
                client_secret=state_data.get("client_secret", ""),
                redirect_uri=state_data["callback_url"],
                code_verifier=state_data["code_verifier"],
                resource=state_data.get("resource"),
                token_endpoint_auth_method=state_data.get(
                    "token_endpoint_auth_method", "client_secret_post"
                ),
            )
        except ValueError:
            logger.error("OAuth token exchange failed for MCP app %s", mcp_app_id, exc_info=True)
            return HttpResponseRedirect(
                f"{connectors_url}&status=error&reason=token_exchange_failed"
            )

        # Save credentials — encrypted
        auth_config = encrypt_auth_config({
            "client_id": state_data["client_id"],
            "client_secret": state_data.get("client_secret", ""),
            "access_token": token_data["access_token"],
            "refresh_token": token_data.get("refresh_token", ""),
            "token_endpoint": state_data["token_endpoint"],
            "token_endpoint_auth_method": state_data.get(
                "token_endpoint_auth_method", "client_secret_post"
            ),
            "expires_in": token_data.get("expires_in"),
            "token_issued_at": token_data.get("token_issued_at"),
        })

        try:
            mcp_app = MCPApplication.objects.get(pk=mcp_app_id)
        except MCPApplication.DoesNotExist:
            return HttpResponseRedirect(
                f"{connectors_url}&status=error&reason=app_not_found"
            )

        save_credentials_and_activate(mcp_app, workspace_id, user_id, auth_config)

        return HttpResponseRedirect(
            f"{connectors_url}&status=success&app_id={mcp_app_id}"
        )

class MCPApplicationsInternalAPIView(BaseAPIView):
    """Return all active MCP connectors for a user in a workspace.

    Internal endpoint consumed by Pi. Returns each active MCP application
    with its decrypted auth headers (OAuth tokens are auto-refreshed if
    expired).
    """

    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)

        # Fetch active MCP apps owned by this user in this workspace
        owned_app_ids = MCPApplicationOwner.objects.filter(
            workspace=workspace,
            user=request.user,
        ).values_list("mcp_application_id", flat=True)

        active_apps = list(
            MCPApplication.objects.filter(
                id__in=owned_app_ids,
                status=MCPApplication.Status.ACTIVE,
            ).order_by("sort_order", "name")
        )

        # Prefetch credentials in a single query
        active_app_ids = [app.id for app in active_apps]
        credentials_map = {
            cred.mcp_application_id: cred
            for cred in MCPConnectionCredentials.objects.filter(
                mcp_application_id__in=active_app_ids,
                workspace=workspace,
                user=request.user,
            )
        }

        connectors = []
        for app in active_apps:
            cred = credentials_map.get(app.id)
            auth_type = app.authorization_type or MCPAuthType.NONE
            headers = {}

            if cred and cred.auth_config:
                decrypted_config = decrypt_auth_config(cred.auth_config)

                # Auto-refresh expired OAuth tokens
                if auth_type == MCPAuthType.OAUTH:
                    decrypted_config = refresh_token_if_expired(
                        cred, decrypted_config, app.url, app_label=app.id
                    )

                headers = build_auth_headers(decrypted_config)

            connectors.append({
                "id": str(app.id),
                "name": app.name,
                "description": app.description_stripped or "",
                "slug": app.slug,
                "url": app.url,
                "auth_type": auth_type,
                "headers": headers,
            })

        return Response(connectors, status=status.HTTP_200_OK)