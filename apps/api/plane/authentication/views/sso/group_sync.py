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

import logging

from rest_framework.response import Response
from rest_framework import status

from plane.authentication.models import GroupSyncConfig, GroupMapping
from plane.authentication.serializers.sso import (
    GroupSyncConfigSerializer,
    GroupMappingSerializer,
    GroupMappingCreateSerializer,
)
from plane.authentication.views.sso.base import BaseAPIView
from plane.db.models import Workspace
from plane.utils.permissions.workspace import WorkspaceOwnerPermission
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.permissions.system_roles import get_workspace_roles_for_workspace


logger = logging.getLogger("plane.authentication")


class GroupSyncConfigEndpoint(BaseAPIView):
    """
    Endpoint for managing workspace group sync configuration.

    GET: Retrieve the group sync config for a workspace
    PATCH: Update (or create) the group sync config for a workspace
    """

    permission_classes = [WorkspaceOwnerPermission]

    @check_feature_flag(FeatureFlag.IDP_GROUP_SYNC)
    def get(self, request, slug):
        """Get the group sync configuration for a workspace."""
        config = GroupSyncConfig.objects.filter(
            workspace__slug=slug
        ).select_related("default_workspace_role").first()
        # create it with default values
        if not config:
            workspace = Workspace.objects.get(slug=slug)
            ws_roles = get_workspace_roles_for_workspace(workspace.id)
            config = GroupSyncConfig.objects.create(
                workspace=workspace,
                default_workspace_role=ws_roles["member"],
            )
        serializer = GroupSyncConfigSerializer(config)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.IDP_GROUP_SYNC)
    def patch(self, request, slug):
        """Update or create the group sync configuration for a workspace."""
        config = GroupSyncConfig.objects.get(workspace__slug=slug)
        serializer = GroupSyncConfigSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GroupMappingEndpoint(BaseAPIView):
    """
    Endpoint for managing group mappings.
    """

    permission_classes = [
        WorkspaceOwnerPermission,
    ]

    @check_feature_flag(FeatureFlag.IDP_GROUP_SYNC)
    def get(self, request, slug):
        """List all group mappings for a workspace."""
        mappings = (
            GroupMapping.objects.filter(workspace__slug=slug)
            .select_related("project", "role")
            .order_by("idp_group_name", "project__name")
        )

        serializer = GroupMappingSerializer(mappings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.IDP_GROUP_SYNC)
    def post(self, request, slug):
        """Create a new group mapping."""
        workspace = Workspace.objects.get(slug=slug)

        serializer = GroupMappingCreateSerializer(
            data=request.data,
            context={"workspace": workspace},
        )

        if serializer.is_valid():
            mapping = serializer.save()
            response_serializer = GroupMappingSerializer(mapping)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.IDP_GROUP_SYNC)
    def delete(self, request, slug, pk):
        """Delete a group mapping."""
        mapping = GroupMapping.objects.get(workspace__slug=slug, pk=pk)
        mapping.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @check_feature_flag(FeatureFlag.IDP_GROUP_SYNC)
    def patch(self, request, slug, pk):
        """Update a group mapping."""
        workspace = Workspace.objects.get(slug=slug)
        mapping = GroupMapping.objects.get(workspace__slug=slug, pk=pk)

        serializer = GroupMappingSerializer(
            mapping,
            data=request.data,
            context={"workspace": workspace},
            partial=True,
        )

        # Check if the serializer is valid
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
