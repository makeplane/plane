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

# Django imports
from django.db.models import Prefetch

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseAPIView
from plane.app.permissions import WorkspaceUserPermission, allow_permission, ROLE
from plane.db.models import (
    Workspace,
    Release,
    ReleaseLabelAssociation,
    ReleaseWorkItem,
)
from plane.app.serializers.release import (
    ReleaseSerializer,
    ReleaseWriteSerializer,
)
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class ReleaseEndpoint(BaseAPIView):
    permission_classes = [WorkspaceUserPermission]
    model = Release
    serializer_class = ReleaseSerializer

    def get_queryset(self):
        return (
            Release.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .prefetch_related(
                Prefetch(
                    "release_label_associations",
                    queryset=ReleaseLabelAssociation.objects.filter(deleted_at__isnull=True),
                ),
                Prefetch(
                    "release_work_items",
                    queryset=ReleaseWorkItem.objects.filter(deleted_at__isnull=True),
                ),
                Prefetch(
                    "release_work_items",
                    queryset=ReleaseWorkItem.objects.filter(
                        deleted_at__isnull=True, work_item__state__group="completed"
                    ),
                    to_attr="completed_work_item",
                ),
                Prefetch(
                    "release_work_items",
                    queryset=ReleaseWorkItem.objects.filter(
                        deleted_at__isnull=True, work_item__state__group="cancelled"
                    ),
                    to_attr="cancelled_work_item",
                ),
            )
            .select_related("lead", "tag", "description")
            .order_by("-created_at")
            .distinct()
        )

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, pk=None):
        if pk:
            release = self.get_queryset().filter(pk=pk).first()
            if not release:
                return Response(
                    {"error": "Release not found", "code": "RELEASE_NOT_FOUND"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            serializer = ReleaseSerializer(release)
            return Response(serializer.data, status=status.HTTP_200_OK)

        releases = self.get_queryset()
        serializer = ReleaseSerializer(releases, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)

        serializer = ReleaseWriteSerializer(
            data=request.data,
            context={"workspace_id": workspace.id},
        )
        if serializer.is_valid():
            serializer.save()
            release = self.get_queryset().get(pk=serializer.data.get("id"))
            serializer = ReleaseSerializer(release)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, pk):
        workspace = Workspace.objects.get(slug=slug)
        release = (
            Release.objects.filter(pk=pk, workspace__slug=slug)
            .prefetch_related(
                Prefetch(
                    "release_label_associations",
                    queryset=ReleaseLabelAssociation.objects.filter(deleted_at__isnull=True),
                ),
            )
            .first()
        )
        if not release:
            return Response(
                {"error": "Release not found", "code": "RELEASE_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ReleaseWriteSerializer(
            release, data=request.data, context={"workspace_id": workspace.id}, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            release = self.get_queryset().get(pk=pk)
            serializer = ReleaseSerializer(release)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, pk):
        release = Release.objects.get(pk=pk, workspace__slug=slug)
        release.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
