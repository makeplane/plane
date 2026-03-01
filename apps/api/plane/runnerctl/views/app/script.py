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

import logging

from django.db.models import Count, Max, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response

from plane.authentication.session import BaseSessionAuthentication
from plane.app.permissions import WorkSpaceAdminPermission
from plane.db.models import Workspace

from ...models import Script
from ...serializers import ScriptSerializer, ScriptListSerializer
from ...services.script_builder import build_script

logger = logging.getLogger(__name__)


class ScriptListCreateView(ListCreateAPIView):
    authentication_classes = [BaseSessionAuthentication]
    permission_classes = [WorkSpaceAdminPermission]

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug")

    def get_serializer_class(self):
        if self.request.method == "GET":
            return ScriptListSerializer
        return ScriptSerializer

    def get_queryset(self):
        workspace = get_object_or_404(Workspace, slug=self.workspace_slug)

        # Include both workspace scripts AND system scripts
        queryset = Script.objects.filter(
            Q(workspace=workspace) | Q(is_system=True)
        )

        # Optional query parameters for filtering
        project_id = self.request.query_params.get("project_id")
        platform = self.request.query_params.get("platform")
        is_system = self.request.query_params.get("is_system")

        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if platform:
            queryset = queryset.filter(platform=platform)
        if is_system is not None:
            queryset = queryset.filter(is_system=is_system.lower() == "true")

        # Annotate with execution stats for list view
        if self.request.method == "GET":
            queryset = queryset.annotate(
                total_executions=Count(
                    "executions",
                    filter=Q(executions__deleted_at__isnull=True),
                ),
                successful_executions=Count(
                    "executions",
                    filter=Q(
                        executions__status="completed",
                        executions__deleted_at__isnull=True,
                    ),
                ),
                last_run=Max(
                    "executions__created_at",
                    filter=Q(executions__deleted_at__isnull=True),
                ),
            )

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        workspace = get_object_or_404(Workspace, slug=self.workspace_slug)
        instance = serializer.save(workspace=workspace)

        # Build and validate - rollback on failure
        result = build_script(instance)
        if not result.success:
            logger.warning(f"Build failed for new script {instance.id}: {result.error}")
            instance.delete(soft=False)  # Hard delete since it was never valid
            return Response({"error": result.error}, status=status.HTTP_400_BAD_REQUEST)

        # Re-fetch serializer data to include build and function_names
        return_serializer = self.get_serializer(instance)
        headers = self.get_success_headers(return_serializer.data)
        return Response(return_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ScriptRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    serializer_class = ScriptSerializer
    authentication_classes = [BaseSessionAuthentication]
    permission_classes = [WorkSpaceAdminPermission]

    lookup_field = "id"
    lookup_url_kwarg = "script_id"

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug")

    def get_queryset(self):
        workspace = get_object_or_404(Workspace, slug=self.workspace_slug)
        # Include both workspace scripts AND system scripts for retrieval
        return Script.objects.filter(
            Q(workspace=workspace) | Q(is_system=True)
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        # Prevent editing system scripts
        if instance.is_system:
            return Response(
                {"error": "System scripts cannot be modified"},
                status=status.HTTP_403_FORBIDDEN,
            )

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Check if code or code_type changed
        code_changed = "code" in serializer.validated_data
        code_type_changed = "code_type" in serializer.validated_data

        instance = serializer.save()

        # Rebuild if code or code_type changed
        if code_changed or code_type_changed:
            result = build_script(instance)
            if not result.success:
                logger.warning(f"Build failed for updated script {instance.id}: {result.error}")
                return Response({"error": result.error}, status=status.HTTP_400_BAD_REQUEST)

        # Re-fetch serializer data to include updated build and function_names
        return_serializer = self.get_serializer(instance)
        return Response(return_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Prevent deleting system scripts
        if instance.is_system:
            return Response(
                {"error": "System scripts cannot be deleted"},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().destroy(request, *args, **kwargs)
