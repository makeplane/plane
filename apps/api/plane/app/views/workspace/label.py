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

# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers import LabelSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import Label, Workspace
from plane.permissions import WorkspacePermissions, can
from plane.utils.cache import cache_response

# Django imports
from django.db import IntegrityError


class WorkspaceLabelsEndpoint(BaseAPIView):
    use_read_replica = True

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    @cache_response(60 * 60 * 2)
    def get(self, request, slug):
        labels = Label.objects.filter(
            workspace__slug=slug,
            project__archived_at__isnull=True,
        ).accessible_to(request.user.id, slug)

        serializer = LabelSerializer(labels, many=True).data
        return Response(serializer, status=status.HTTP_200_OK)

    @can(WorkspacePermissions.MANAGE, resource_param="workspace_id")
    def post(self, request, slug):
        try:
            workspace = Workspace.objects.get(slug=slug)
            serializer = LabelSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(workspace_id=workspace.id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response(
                {"error": "Label with the same name already exists in the project"},
                status=status.HTTP_400_BAD_REQUEST,
            )
