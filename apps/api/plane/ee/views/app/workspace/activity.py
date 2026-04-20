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

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.models import WorkspaceMemberActivity
from plane.permissions import WorkspaceActivityPermissions, can
from plane.ee.serializers import WorkspaceMemberActivitySerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class WorkspaceMemberActivityEndpoint(BaseAPIView):
    use_read_replica = True

    filterset_fields = {"created_at": ["gt", "gte", "lt", "lte"]}

    @check_feature_flag(FeatureFlag.WORKSPACE_MEMBER_ACTIVITY)
    @can(WorkspaceActivityPermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug):
        workspace_member_activities = WorkspaceMemberActivity.objects.filter(workspace__slug=slug)

        workspace_member_activities = (
            self.filter_queryset(workspace_member_activities)
            .select_related("actor", "workspace_member")
            .order_by("created_at")
        )

        workspace_member_activities = WorkspaceMemberActivitySerializer(workspace_member_activities, many=True).data

        return Response(workspace_member_activities, status=status.HTTP_200_OK)
