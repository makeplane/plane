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

from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView, RetrieveAPIView

from plane.authentication.session import BaseSessionAuthentication
from plane.app.permissions import WorkSpaceAdminPermission
from plane.db.models import Workspace

from ...models import Script, ScriptExecution
from ...serializers import (
    ScriptExecutionWithScriptSerializer,
    ScriptExecutionListSerializer,
)


class ExecutionListView(ListAPIView):
    """List all executions in a workspace"""
    serializer_class = ScriptExecutionListSerializer
    authentication_classes = [BaseSessionAuthentication]
    permission_classes = [WorkSpaceAdminPermission]

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug")

    def get_queryset(self):
        workspace = get_object_or_404(Workspace, slug=self.workspace_slug)

        queryset = ScriptExecution.objects.filter(
            workspace=workspace
        ).select_related("script").order_by("-created_at")

        # Optional query parameters for filtering
        trigger_type = self.request.query_params.get("trigger_type")
        status_filter = self.request.query_params.get("status")
        script_id = self.request.query_params.get("script_id")

        if trigger_type:
            queryset = queryset.filter(trigger_type=trigger_type)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if script_id:
            queryset = queryset.filter(script_id=script_id)

        return queryset


class ExecutionRetrieveView(RetrieveAPIView):
    """Get details of a specific execution (works for both test and script runs)"""
    serializer_class = ScriptExecutionWithScriptSerializer
    authentication_classes = [BaseSessionAuthentication]
    permission_classes = [WorkSpaceAdminPermission]

    lookup_field = "id"
    lookup_url_kwarg = "execution_id"

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug")

    def get_queryset(self):
        workspace = get_object_or_404(Workspace, slug=self.workspace_slug)

        return ScriptExecution.objects.filter(
            workspace=workspace
        ).select_related("script", "project", "workspace")


class ScriptExecutionListView(ListAPIView):
    """List executions for a specific script"""
    serializer_class = ScriptExecutionListSerializer
    authentication_classes = [BaseSessionAuthentication]
    permission_classes = [WorkSpaceAdminPermission]

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug")

    def get_queryset(self):
        script_id = self.kwargs.get("script_id")
        workspace = get_object_or_404(Workspace, slug=self.workspace_slug)
        script = get_object_or_404(Script, id=script_id, workspace=workspace)

        queryset = ScriptExecution.objects.filter(script=script).order_by("-created_at")

        # Optional query parameters for filtering
        trigger_type = self.request.query_params.get("trigger_type")
        status_filter = self.request.query_params.get("status")

        if trigger_type:
            queryset = queryset.filter(trigger_type=trigger_type)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset
