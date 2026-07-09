# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import PageVersion
from ..base import BaseAPIView
from plane.app.serializers import PageVersionSerializer, PageVersionDetailSerializer
from plane.app.permissions import ProjectPagePermission


class PageVersionEndpoint(BaseAPIView):
    permission_classes = [ProjectPagePermission]

    def get(self, request, slug, project_id, page_id, pk=None):
        # Check if pk is provided
        if pk:
            # Return a single page version. Scope to the project in the URL so a
            # page belonging to another project cannot be read via this endpoint
            # (GHSA-g49r / GHSA-ghcr).
            page_version = PageVersion.objects.get(
                workspace__slug=slug, page__projects__id=project_id, page_id=page_id, pk=pk
            )
            # Serialize the page version
            serializer = PageVersionDetailSerializer(page_version)
            return Response(serializer.data, status=status.HTTP_200_OK)
        # Return all page versions (scoped to the project in the URL). distinct()
        # guards against duplicate rows when a page has both an active and a
        # soft-deleted ProjectPage link to the same project.
        page_versions = PageVersion.objects.filter(
            workspace__slug=slug, page__projects__id=project_id, page_id=page_id
        ).distinct()
        # Serialize the page versions
        serializer = PageVersionSerializer(page_versions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
