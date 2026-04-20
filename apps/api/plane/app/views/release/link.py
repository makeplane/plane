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
from plane.app.views.base import BaseViewSet
from plane.permissions import can, ReleasePermissions
from plane.db.models import Workspace, ReleaseLink
from plane.app.serializers.release import ReleaseLinkSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class ReleaseLinkViewSet(BaseViewSet):
    model = ReleaseLink
    serializer_class = ReleaseLinkSerializer

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(release_id=self.kwargs.get("release_id"))
            .order_by("-created_at")
            .distinct()
        )

    @check_feature_flag(FeatureFlag.RELEASES)
    @can(ReleasePermissions.VIEW, resource_param="workspace_id")
    def list(self, request, slug, release_id):
        return super().list(request, slug, release_id)

    @check_feature_flag(FeatureFlag.RELEASES)
    @can(ReleasePermissions.CREATE, resource_param="workspace_id")
    def create(self, request, slug, release_id):
        workspace = Workspace.objects.get(slug=slug)
        serializer = ReleaseLinkSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                workspace_id=workspace.id,
                release_id=release_id,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.RELEASES)
    @can(ReleasePermissions.EDIT, resource_param="workspace_id")
    def partial_update(self, request, slug, release_id, pk):
        link = ReleaseLink.objects.get(workspace__slug=slug, release_id=release_id, pk=pk)
        serializer = ReleaseLinkSerializer(link, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.RELEASES)
    @can(ReleasePermissions.DELETE, resource_param="workspace_id")
    def destroy(self, request, slug, release_id, pk):
        link = ReleaseLink.objects.get(workspace__slug=slug, release_id=release_id, pk=pk)
        link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
