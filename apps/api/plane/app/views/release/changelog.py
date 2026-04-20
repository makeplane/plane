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
from plane.db.models import Workspace, ReleaseChangelog, Description
from plane.app.serializers.release import ReleaseChangelogSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class ReleaseChangelogEndpoint(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.RELEASES)
    @can(ReleasePermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug, release_id):
        workspace = Workspace.objects.get(slug=slug)
        try:
            release_changelog = ReleaseChangelog.objects.get(release_id=release_id, workspace_id=workspace.id)
        except ReleaseChangelog.DoesNotExist:
            changelog_description = Description.objects.create(
                workspace_id=workspace.id, description_html="<p></p>", description_json={}
            )
            release_changelog = ReleaseChangelog.objects.create(
                release_id=release_id, changelog_id=changelog_description.id, workspace_id=workspace.id
            )

        serializer = ReleaseChangelogSerializer(release_changelog)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.RELEASES)
    @can(ReleasePermissions.EDIT, resource_param="workspace_id")
    def patch(self, request, slug, release_id):
        workspace = Workspace.objects.get(slug=slug)

        try:
            changelog = ReleaseChangelog.objects.get(release_id=release_id, workspace_id=workspace.id)
            serializer = ReleaseChangelogSerializer(
                changelog, data=request.data, context={"workspace_id": workspace.id}, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ReleaseChangelog.DoesNotExist:
            description_html = request.data.get("description_html", "<p></p>")
            description_json = request.data.get("description_json", {})

            changelog_description = Description.objects.create(
                description_html=description_html, description_json=description_json, workspace_id=workspace.id
            )

            release_changelog = ReleaseChangelog.objects.create(
                release_id=release_id, changelog_id=changelog_description.id, workspace_id=workspace.id
            )

            return Response(ReleaseChangelogSerializer(release_changelog).data, status=status.HTTP_200_OK)
