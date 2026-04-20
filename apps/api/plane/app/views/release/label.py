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
from plane.db.models import Workspace, ReleaseLabel
from plane.app.serializers.release import ReleaseLabelSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class ReleaseLabelEndpoint(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.RELEASES)
    @can(ReleasePermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug, pk=None):
        if pk:
            label = ReleaseLabel.objects.get(pk=pk, workspace__slug=slug)
            return Response(ReleaseLabelSerializer(label).data, status=status.HTTP_200_OK)

        labels = ReleaseLabel.objects.filter(workspace__slug=slug).order_by("sort_order")
        serializer = ReleaseLabelSerializer(labels, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.RELEASES)
    @can(ReleasePermissions.CREATE, resource_param="workspace_id")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = ReleaseLabelSerializer(data=request.data, context={"workspace_id": workspace.id})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.RELEASES)
    @can(ReleasePermissions.EDIT, resource_param="workspace_id")
    def patch(self, request, slug, pk):
        workspace = Workspace.objects.get(slug=slug)
        label = ReleaseLabel.objects.get(pk=pk, workspace__slug=slug)
        serializer = ReleaseLabelSerializer(
            label, data=request.data, partial=True, context={"workspace_id": workspace.id}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.RELEASES)
    @can(ReleasePermissions.DELETE, resource_param="workspace_id")
    def delete(self, request, slug, pk):
        label = ReleaseLabel.objects.get(pk=pk, workspace__slug=slug)
        label.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
