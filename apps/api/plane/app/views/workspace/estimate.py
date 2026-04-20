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

# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers import WorkspaceEstimateSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import Estimate
from plane.permissions import WorkspacePermissions, can
from plane.utils.cache import cache_response


class WorkspaceEstimatesEndpoint(BaseAPIView):
    use_read_replica = True

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    @cache_response(60 * 60 * 2)
    def get(self, request, slug):
        estimates = (
            Estimate.objects.filter(
                workspace__slug=slug,
                project__archived_at__isnull=True,
            )
            .accessible_to(request.user.id, slug)
            .prefetch_related("points")
            .select_related("workspace", "project")
        )

        serializer = WorkspaceEstimateSerializer(estimates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
