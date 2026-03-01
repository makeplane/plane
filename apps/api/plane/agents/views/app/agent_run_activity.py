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

from rest_framework.response import Response
from rest_framework import status

from plane.app.views.base import BaseViewSet
from plane.agents.models import AgentRunActivity
from plane.agents.serializers.app import AgentRunActivitySerializer
from plane.app.permissions import WorkSpaceAdminPermission
from plane.agents.models import AgentRun


class AgentRunActivityViewSet(BaseViewSet):
    serializer_class = AgentRunActivitySerializer
    model = AgentRunActivity
    permission_classes = [WorkSpaceAdminPermission]

    def get_queryset(self):
        return self.filter_queryset(super().get_queryset().filter(agent_run__id=self.kwargs.get("run_id")))

    def retrieve(self, request, slug, run_id, pk):
        activity = AgentRunActivity.objects.get(id=pk, agent_run__id=run_id, agent_run__workspace__slug=slug)
        if not activity:
            return Response({"error": "Activity not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(activity)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def get_run_activities(self, request, slug, run_id):
        agent_run = AgentRun.objects.get(id=run_id, workspace__slug=slug)
        if not agent_run:
            return Response({"error": "Run not found"}, status=status.HTTP_404_NOT_FOUND)
        activities = self.get_queryset().order_by("-created_at")
        response = self.paginate(
            request=request,
            queryset=(activities),
            on_results=lambda activities: self.get_serializer(activities, many=True).data,
            default_per_page=20,
        )
        response.data["agent_run_status"] = agent_run.status
        return response
