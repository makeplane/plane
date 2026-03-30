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
from plane.app.permissions import WorkspaceUserPermission, allow_permission, ROLE
from plane.db.models import Workspace, ReleasePage
from plane.app.serializers.release import ReleasePageSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class ReleasePageEndpoint(BaseAPIView):
    use_read_replica = True

    permission_classes = [WorkspaceUserPermission]

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, release_id):
        pages = (
            ReleasePage.objects.filter(release_id=release_id, workspace__slug=slug)
            .select_related("page")
            .order_by("-created_at")
        )
        serializer = ReleasePageSerializer(pages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def post(self, request, slug, release_id):
        workspace = Workspace.objects.get(slug=slug)
        page_ids = request.data.get("page_ids", [])

        if not page_ids:
            return Response(
                {"error": "page_ids are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_ids = ReleasePage.objects.filter(release_id=release_id, page_id__in=page_ids).values_list(
            "page_id", flat=True
        )

        existing_ids = [str(uid) for uid in existing_ids]
        new_ids = set(page_ids) - set(existing_ids)

        if new_ids:
            ReleasePage.objects.bulk_create(
                [
                    ReleasePage(
                        release_id=release_id,
                        page_id=pid,
                        workspace_id=workspace.id,
                        created_by_id=request.user.id,
                        updated_by_id=request.user.id,
                    )
                    for pid in new_ids
                ],
                batch_size=10,
            )

        return Response(
            {"message": "Pages added successfully"},
            status=status.HTTP_200_OK,
        )

    @check_feature_flag(FeatureFlag.RELEASES)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, release_id):
        page_ids = request.data.get("page_ids", [])

        if not page_ids:
            return Response(
                {"error": "page_ids are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ReleasePage.objects.filter(
            release_id=release_id,
            page_id__in=page_ids,
            workspace__slug=slug,
        ).delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
