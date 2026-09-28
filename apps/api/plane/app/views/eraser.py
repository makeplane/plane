# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import re
from urllib.parse import parse_qs, urlparse

import requests
from cryptography.fernet import Fernet
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import WorkspaceOwnerPermission, WorkspaceViewerPermission
from plane.app.views.base import BaseAPIView
from plane.db.models import EraserIntegration, Workspace
from plane.license.utils.encryption import derive_key


ERASER_API = "https://app.eraser.io/api"


def parse_eraser_url(value):
    """Accept only canonical Eraser file links, never a caller supplied API host."""
    if not isinstance(value, str):
        return None
    parsed = urlparse(value)
    if parsed.scheme != "https" or parsed.netloc.lower() != "app.eraser.io":
        return None
    segments = parsed.path.strip("/").split("/")
    if len(segments) != 2 or segments[0] != "workspace" or not re.fullmatch(r"[A-Za-z0-9_-]+", segments[1]):
        return None
    query = parse_qs(parsed.query, keep_blank_values=True)
    if any(key not in {"diagram", "figure", "layout"} for key in query):
        return None
    if "diagram" in query and "figure" in query:
        return None
    content = None
    for kind in ("diagram", "figure"):
        if kind in query:
            if len(query[kind]) != 1 or not re.fullmatch(r"[A-Za-z0-9_-]+", query[kind][0]):
                return None
            content = [{"type": kind, "id": query[kind][0]}]
    return segments[1], content


def eraser_request(method, path, token, **kwargs):
    return requests.request(
        method,
        f"{ERASER_API}{path}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=8,
        **kwargs,
    )


def get_token(integration):
    return Fernet(derive_key(settings.SECRET_KEY)).decrypt(integration.encrypted_api_token.encode()).decode()


class EraserConnectionEndpoint(BaseAPIView):
    permission_classes = [WorkspaceOwnerPermission]

    def get(self, request, slug):
        return Response({"connected": EraserIntegration.objects.filter(workspace__slug=slug).exists()})

    def put(self, request, slug):
        token = request.data.get("api_token")
        if not isinstance(token, str) or not token.strip() or len(token) > 4096 or not token.isprintable():
            return Response({"detail": "An Eraser team API token is required."}, status=status.HTTP_400_BAD_REQUEST)
        token = token.strip()
        try:
            response = eraser_request("GET", "/files", token, params={"limit": 1})
        except requests.RequestException:
            return Response({"detail": "Eraser is unavailable. Try again later."}, status=status.HTTP_502_BAD_GATEWAY)
        if response.status_code in (401, 403):
            return Response({"detail": "Eraser rejected this team API token."}, status=status.HTTP_400_BAD_REQUEST)
        if not response.ok:
            return Response({"detail": "Could not validate the Eraser token."}, status=status.HTTP_502_BAD_GATEWAY)
        workspace = Workspace.objects.get(slug=slug)
        encrypted = Fernet(derive_key(settings.SECRET_KEY)).encrypt(token.encode()).decode()
        EraserIntegration.objects.update_or_create(
            workspace=workspace, defaults={"encrypted_api_token": encrypted}
        )
        return Response({"connected": True})

    def delete(self, request, slug):
        integration = EraserIntegration.objects.filter(workspace__slug=slug).first()
        if integration:
            integration.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class EraserEmbedEndpoint(BaseAPIView):
    permission_classes = [WorkspaceViewerPermission]

    def post(self, request, slug):
        parsed = parse_eraser_url(request.data.get("url"))
        if parsed is None:
            return Response({"detail": "Enter a valid Eraser file or diagram URL."}, status=status.HTTP_400_BAD_REQUEST)
        integration = EraserIntegration.objects.filter(workspace__slug=slug).first()
        if integration is None:
            return Response({"detail": "Eraser is not connected to this workspace."}, status=status.HTTP_404_NOT_FOUND)
        file_id, content = parsed
        body = {"fileId": file_id, "expiresIn": "15m"}
        if content:
            body["content"] = content
        try:
            response = eraser_request("POST", "/embedTokens", get_token(integration), json=body)
        except requests.RequestException:
            return Response({"detail": "Eraser is unavailable. Try again later."}, status=status.HTTP_502_BAD_GATEWAY)
        if response.status_code in (400, 404):
            return Response({"detail": "This Eraser file cannot be embedded."}, status=status.HTTP_400_BAD_REQUEST)
        if response.status_code in (401, 403):
            return Response(
                {"detail": "The Eraser connection needs to be renewed."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        if not response.ok:
            return Response({"detail": "Could not create an Eraser embed."}, status=status.HTTP_502_BAD_GATEWAY)
        try:
            data = response.json()
        except ValueError:
            return Response({"detail": "Eraser returned an invalid response."}, status=status.HTTP_502_BAD_GATEWAY)
        if not isinstance(data, dict):
            return Response({"detail": "Eraser returned an invalid response."}, status=status.HTTP_502_BAD_GATEWAY)
        embed_url = data.get("embedUrl", "")
        if not isinstance(embed_url, str):
            return Response({"detail": "Eraser returned an invalid embed URL."}, status=status.HTTP_502_BAD_GATEWAY)
        parsed_embed = urlparse(embed_url)
        if (
            parsed_embed.scheme != "https"
            or parsed_embed.netloc.lower() != "app.eraser.io"
            or parsed_embed.path != "/embed"
        ):
            return Response({"detail": "Eraser returned an invalid embed URL."}, status=status.HTTP_502_BAD_GATEWAY)
        result = Response({"embed_url": embed_url, "expires_at": data.get("expiresAt")})
        result["Cache-Control"] = "no-store"
        return result


class EraserMetadataEndpoint(BaseAPIView):
    permission_classes = [WorkspaceViewerPermission]

    def get(self, request, slug):
        parsed = parse_eraser_url(request.query_params.get("url"))
        if parsed is None:
            return Response({"detail": "Enter a valid Eraser URL."}, status=status.HTTP_400_BAD_REQUEST)
        integration = EraserIntegration.objects.filter(workspace__slug=slug).first()
        if integration is None:
            return Response({"detail": "Eraser is not connected to this workspace."}, status=status.HTTP_404_NOT_FOUND)
        file_id, _ = parsed
        try:
            response = eraser_request("GET", f"/files/{file_id}", get_token(integration))
        except requests.RequestException:
            return Response({"detail": "Eraser is unavailable. Try again later."}, status=status.HTTP_502_BAD_GATEWAY)
        if not response.ok:
            return Response({"detail": "Could not read this Eraser file."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            data = response.json()
        except ValueError:
            return Response({"detail": "Eraser returned an invalid response."}, status=status.HTTP_502_BAD_GATEWAY)
        if not isinstance(data, dict):
            return Response({"detail": "Eraser returned an invalid response."}, status=status.HTTP_502_BAD_GATEWAY)
        title = data.get("title")
        return Response(
            {"title": title if isinstance(title, str) else "Untitled diagram", "url": request.query_params["url"]}
        )
