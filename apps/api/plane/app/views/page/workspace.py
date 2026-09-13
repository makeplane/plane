# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models import Q
from rest_framework.response import Response
from rest_framework import status

from plane.app.permissions import WorkspaceEntityPermission
from plane.app.serializers.page import PageSerializer
from plane.db.models import Page
from ..base import BaseAPIView


class WorkspacePageListEndpoint(BaseAPIView):
    serializer_class = PageSerializer
    model = Page
    permission_classes = [WorkspaceEntityPermission]

    def get(self, request, slug):
        pages = (
            Page.objects.filter(workspace__slug=slug, is_global=True, deleted_at__isnull=True)
            .filter(Q(owned_by=request.user) | Q(access=Page.PUBLIC_ACCESS))
            .select_related("workspace", "owned_by")
            .order_by("name", "-created_at")
        )
        return Response(PageSerializer(pages, many=True).data, status=status.HTTP_200_OK)
