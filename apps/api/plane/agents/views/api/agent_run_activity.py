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

from plane.api.views.base import BaseViewSet
from plane.agents.models import AgentRunActivity
from plane.agents.serializers.api import AgentRunActivityAPISerializer
from plane.app.permissions import WorkSpaceAdminPermission
from plane.agents.models import AgentRun

from plane.authentication.permissions.oauth import TokenHasScopeIfOAuth
from plane.utils.oauth import (
    READ_SCOPE,
    WRITE_SCOPE,
    AGENT_RUN_ACTIVITIES_READ_SCOPE,
    AGENT_RUN_ACTIVITIES_WRITE_SCOPE,
)


class AgentRunActivityAPIViewSet(BaseViewSet):
    serializer_class = AgentRunActivityAPISerializer
    model = AgentRunActivity
    permission_classes = [WorkSpaceAdminPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [AGENT_RUN_ACTIVITIES_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [AGENT_RUN_ACTIVITIES_WRITE_SCOPE]],
        "PUT": [[WRITE_SCOPE], [AGENT_RUN_ACTIVITIES_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [AGENT_RUN_ACTIVITIES_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [AGENT_RUN_ACTIVITIES_WRITE_SCOPE]],
    }

    def get_queryset(self):
        return self.filter_queryset(super().get_queryset().filter(agent_run__id=self.kwargs.get("run_id")))

    def create(self, request, slug, run_id):
        agent_run = AgentRun.objects.get(id=run_id, workspace__slug=slug)
        if not agent_run:
            return Response({"error": "Run not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(
            data=request.data, context={"agent_run": agent_run, "actor": request.user, "workspace": agent_run.workspace}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
        activities = self.get_queryset().order_by("created_at")
        return self.paginate(
            request=request,
            queryset=(activities),
            on_results=lambda activities: self.get_serializer(activities, many=True).data,
            default_per_page=20,
        )
