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
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.app.views.base import BaseViewSet
from plane.permissions import can, WorkspacePermissions
from plane.db.models import Sticky, Workspace
from plane.app.serializers import StickySerializer


class WorkspaceStickyViewSet(BaseViewSet):
    serializer_class = StickySerializer
    model = Sticky
    use_read_replica = True

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(owner_id=self.request.user.id)
            .select_related("workspace", "owner")
            .distinct()
        )

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = StickySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id, owner_id=request.user.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def list(self, request, slug):
        query = request.query_params.get("query", False)
        stickies = self.get_queryset().order_by("-sort_order")
        if query:
            stickies = stickies.filter(description_stripped__icontains=query)

        return self.paginate(
            request=request,
            queryset=(stickies),
            on_results=lambda stickies: StickySerializer(stickies, many=True).data,
            default_per_page=20,
        )

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
