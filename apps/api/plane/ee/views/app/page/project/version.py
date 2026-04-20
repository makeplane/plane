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

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import PageVersion
from plane.ee.views.base import BaseAPIView
from plane.app.serializers import PageVersionSerializer, PageVersionDetailSerializer
from plane.ee.permissions.page import ProjectPagePermission
from plane.permissions import PagePermissions
from plane.permissions import HasResourcePermission


class PageVersionExtendedEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [HasResourcePermission, ProjectPagePermission]

    action_permissions = {
        "retrieve": {"permission": PagePermissions.VIEW, "resource_param": "project_id"},
    }

    def get(self, request, slug, project_id, page_id, pk=None):
        # Check if pk is provided
        if pk:
            # Return a single page version
            page_version = PageVersion.objects.get(workspace__slug=slug, page_id=page_id, pk=pk)
            # Serialize the page version
            serializer = PageVersionDetailSerializer(page_version)
            return Response(serializer.data, status=status.HTTP_200_OK)
        # Return all page versions
        page_versions = PageVersion.objects.filter(workspace__slug=slug, page_id=page_id)
        # Serialize the page versions
        serializer = PageVersionSerializer(page_versions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
