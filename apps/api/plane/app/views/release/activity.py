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
from plane.db.models import ReleaseActivity
from plane.app.serializers.release import ReleaseActivitySerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class ReleaseActivityEndpoint(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.RELEASES)
    @can(ReleasePermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug, release_id):
        filters = {}
        if request.GET.get("created_at__gt") is not None:
            filters["created_at__gt"] = request.GET.get("created_at__gt")

        activities = (
            ReleaseActivity.objects.filter(workspace__slug=slug, release_id=release_id)
            .filter(**filters)
            .select_related("actor", "release")
            .order_by("created_at")
        )

        serializer = ReleaseActivitySerializer(activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
