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

from plane.db.models import UserRecentVisit
from plane.app.serializers import WorkspaceRecentVisitSerializer

# Modules imports
from ..base import BaseViewSet
from plane.permissions import can, WorkspacePermissions


class UserRecentVisitViewSet(BaseViewSet):
    model = UserRecentVisit
    use_read_replica = True

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def list(self, request, slug):
        entity_name = request.query_params.get("entity_name")

        if entity_name and entity_name not in ["issue", "page", "project", "workspace_page"]:
            return Response({"error": "Invalid entity_name"}, status=status.HTTP_400_BAD_REQUEST)

        user_recent_visits = UserRecentVisit.objects.filter(workspace__slug=slug, user=request.user)
        if entity_name:
            user_recent_visits = user_recent_visits.filter(entity_name=entity_name)
        else:
            user_recent_visits = user_recent_visits.filter(entity_name__in=["issue", "page", "project"])

        serializer = WorkspaceRecentVisitSerializer(user_recent_visits[:20], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
