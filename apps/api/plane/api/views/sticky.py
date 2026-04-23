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

from rest_framework.response import Response
from rest_framework import status

from plane.api.views.base import ScopedBaseViewSet
from plane.permissions import can, WorkspacePermissions
from plane.db.models import Sticky, Workspace
from plane.api.serializers import StickySerializer

# OpenAPI imports
from plane.utils.openapi.decorators import sticky_docs

from drf_spectacular.utils import OpenApiRequest, OpenApiResponse
from plane.utils.openapi import (
    STICKY_EXAMPLE,
    create_paginated_response,
    DELETED_RESPONSE,
)
from plane.utils.oauth import READ_SCOPE, WRITE_SCOPE, STICKIES_READ_SCOPE, STICKIES_WRITE_SCOPE


class StickyViewSet(ScopedBaseViewSet):
    serializer_class = StickySerializer
    model = Sticky
    use_read_replica = True
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [STICKIES_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [STICKIES_WRITE_SCOPE]],
        "PUT": [[WRITE_SCOPE], [STICKIES_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [STICKIES_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [STICKIES_WRITE_SCOPE]],
    }

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(owner_id=self.request.user.id)
            .distinct()
        )

    @sticky_docs(
        operation_id="create_sticky",
        summary="Create a new sticky",
        description="Create a new sticky in the workspace",
        request=OpenApiRequest(request=StickySerializer),
        responses={
            201: OpenApiResponse(description="Sticky created", response=StickySerializer, examples=[STICKY_EXAMPLE])
        },
    )
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = StickySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id, owner_id=request.user.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @sticky_docs(
        operation_id="list_stickies",
        summary="List stickies",
        description="List all stickies in the workspace",
        responses={
            200: create_paginated_response(
                StickySerializer, "Sticky", "List of stickies", example_name="List of stickies"
            )
        },
    )
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def list(self, request, slug):
        query = request.query_params.get("query", False)
        stickies = self.get_queryset().order_by("-created_at")
        if query:
            stickies = stickies.filter(description_stripped__icontains=query)

        return self.paginate(
            request=request,
            queryset=(stickies),
            on_results=lambda stickies: StickySerializer(stickies, many=True).data,
            default_per_page=20,
        )

    @sticky_docs(
        operation_id="retrieve_sticky",
        summary="Retrieve a sticky",
        description="Retrieve a sticky by its ID",
        responses={200: OpenApiResponse(description="Sticky", response=StickySerializer, examples=[STICKY_EXAMPLE])},
    )
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def retrieve(self, request, slug, pk):
        sticky = self.get_object()
        return Response(StickySerializer(sticky).data)

    @sticky_docs(
        operation_id="update_sticky",
        summary="Update a sticky",
        description="Update a sticky by its ID",
        request=OpenApiRequest(request=StickySerializer),
        responses={200: OpenApiResponse(description="Sticky", response=StickySerializer, examples=[STICKY_EXAMPLE])},
    )
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def partial_update(self, request, slug, pk):
        sticky = self.get_object()
        serializer = StickySerializer(sticky, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @sticky_docs(
        operation_id="delete_sticky",
        summary="Delete a sticky",
        description="Delete a sticky by its ID",
        responses={204: DELETED_RESPONSE},
    )
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def destroy(self, request, slug, pk):
        sticky = self.get_object()
        sticky.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
