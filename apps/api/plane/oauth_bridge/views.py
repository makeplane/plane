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
import logging

# Third party imports
from jwt import PyJWKClient
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.app.permissions.workspace import WorkSpaceAdminPermission
from plane.db.models import Workspace
from plane.oauth_bridge.cache import invalidate_jwks_cache
from plane.oauth_bridge.models import ExternalTokenProvider
from plane.oauth_bridge.serializers import ExternalTokenProviderSerializer

logger = logging.getLogger("plane.oauth_bridge")


class ExternalTokenProviderAPIEndpoint(BaseAPIView):
    """
    API endpoint to manage external token providers.
    - GET (list): List all providers for a workspace
    - GET (detail): Get details of a specific provider
    - POST: Create a new provider
    - PATCH: Update an existing provider and remove cached JWKS
    - DELETE: Remove a provider and evict cached JWKS
    """

    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get(self, request, slug, pk=None):
        if pk:
            provider = ExternalTokenProvider.objects.get(pk=pk, workspace__slug=slug)
            serializer = ExternalTokenProviderSerializer(provider)
            return Response(serializer.data, status=status.HTTP_200_OK)
        providers = ExternalTokenProvider.objects.filter(workspace__slug=slug)
        serializer = ExternalTokenProviderSerializer(providers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = ExternalTokenProviderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(workspace=workspace)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def patch(self, request, slug, pk):
        provider = ExternalTokenProvider.objects.get(pk=pk, workspace__slug=slug)
        serializer = ExternalTokenProviderSerializer(provider, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        invalidate_jwks_cache(str(provider.id))
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug, pk):
        provider = ExternalTokenProvider.objects.get(pk=pk, workspace__slug=slug)
        invalidate_jwks_cache(str(provider.id))
        provider.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ExternalTokenProviderTestAPIEndpoint(BaseAPIView):
    """
    API endpoint to test connectivity and JWKS retrieval from the provider's JWKS URL.
    """

    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def post(self, request, slug, pk):
        provider = ExternalTokenProvider.objects.get(pk=pk, workspace__slug=slug)
        try:
            client = PyJWKClient(provider.jwks_url)
            jwks = client.get_jwk_set()
            key_count = len(jwks.keys)
            return Response(
                {
                    "success": True,
                    "jwks_url": provider.jwks_url,
                    "key_count": key_count,
                    "message": f"Successfully fetched JWKS — {key_count} key(s) found.",
                },
                status=status.HTTP_200_OK,
            )
        except Exception as exc:
            logger.warning("JWKS connectivity test failed for provider %s: %s", provider.id, str(exc))
            return Response(
                {
                    "success": False,
                    "jwks_url": provider.jwks_url,
                    "error": str(exc),
                    "message": "Failed to fetch JWKS. Check the URL and network connectivity.",
                },
                status=status.HTTP_200_OK,
            )
