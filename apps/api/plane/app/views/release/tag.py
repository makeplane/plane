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
from plane.app.views.base import BaseAPIView
from plane.permissions import can, ReleasePermissions
from plane.db.models import Workspace, ReleaseTag
from plane.app.serializers.release import ReleaseTagSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class ReleaseTagEndpoint(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.RELEASES)
    @can(ReleasePermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug, pk=None):
        if pk:
            tag = ReleaseTag.objects.get(pk=pk, workspace__slug=slug)
            return Response(ReleaseTagSerializer(tag).data, status=status.HTTP_200_OK)

        tags = ReleaseTag.objects.filter(workspace__slug=slug).order_by("-created_at")
        serializer = ReleaseTagSerializer(tags, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.RELEASES)
    @can(ReleasePermissions.CREATE, resource_param="workspace_id")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = ReleaseTagSerializer(data=request.data, context={"workspace_id": workspace.id})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.RELEASES)
    @can(ReleasePermissions.EDIT, resource_param="workspace_id")
    def patch(self, request, slug, pk):
        tag = ReleaseTag.objects.get(pk=pk, workspace__slug=slug)
        serializer = ReleaseTagSerializer(
            tag, data=request.data, partial=True, context={"workspace_id": tag.workspace_id}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.RELEASES)
    @can(ReleasePermissions.DELETE, resource_param="workspace_id")
    def delete(self, request, slug, pk):
        tag = ReleaseTag.objects.get(pk=pk, workspace__slug=slug)
        tag.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
