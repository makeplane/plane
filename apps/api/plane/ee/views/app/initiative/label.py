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

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.permissions import can, InitiativePermissions
from plane.payment.flags.flag import FeatureFlag
from plane.db.models import Workspace
from plane.ee.models import InitiativeLabel
from plane.ee.serializers import InitiativeLabelSerializer


# Third party imports
from rest_framework import status
from rest_framework.response import Response


class InitiativeLabelsEndpoint(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(InitiativePermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=self.kwargs.get("slug"))

        initiative_labels = InitiativeLabel.objects.filter(workspace_id=workspace.id)

        serializer = InitiativeLabelSerializer(initiative_labels, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(InitiativePermissions.MANAGE, resource_param="workspace_id")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=self.kwargs.get("slug"))

        serializer = InitiativeLabelSerializer(data=request.data, context={"workspace_id": workspace.id})

        if serializer.is_valid():
            serializer.save()

            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(InitiativePermissions.MANAGE, resource_param="workspace_id")
    def patch(self, request, slug, initiative_label_id):
        workspace = Workspace.objects.get(slug=self.kwargs.get("slug"))

        initiative_label = InitiativeLabel.objects.get(id=initiative_label_id, workspace__slug=slug)

        serializer = InitiativeLabelSerializer(
            initiative_label,
            data=request.data,
            partial=True,
            context={"workspace_id": workspace.id},
        )

        if serializer.is_valid():
            serializer.save()

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(InitiativePermissions.MANAGE, resource_param="workspace_id")
    def delete(self, request, slug, initiative_label_id):
        initiative_label = InitiativeLabel.objects.get(id=initiative_label_id, workspace__slug=slug)

        initiative_label.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
