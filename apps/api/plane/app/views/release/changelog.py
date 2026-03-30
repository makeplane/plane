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
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import Workspace, ReleaseChangelog
from plane.app.serializers.release import ReleaseChangelogSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class ReleaseChangelogEndpoint(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, release_id, pk=None):
        if pk:
            changelog = ReleaseChangelog.objects.get(pk=pk, release_id=release_id, workspace__slug=slug)
            return Response(ReleaseChangelogSerializer(changelog).data, status=status.HTTP_200_OK)

        changelogs = ReleaseChangelog.objects.filter(release_id=release_id, workspace__slug=slug).order_by(
            "-created_at"
        )
        serializer = ReleaseChangelogSerializer(changelogs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, release_id):
        workspace = Workspace.objects.get(slug=slug)
        serializer = ReleaseChangelogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id, release_id=release_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, release_id, pk):
        changelog = ReleaseChangelog.objects.get(pk=pk, release_id=release_id, workspace__slug=slug)
        serializer = ReleaseChangelogSerializer(changelog, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, release_id, pk):
        changelog = ReleaseChangelog.objects.get(pk=pk, release_id=release_id, workspace__slug=slug)
        changelog.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
