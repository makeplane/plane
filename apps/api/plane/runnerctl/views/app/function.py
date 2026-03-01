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

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response

from plane.authentication.session import BaseSessionAuthentication
from plane.app.permissions import WorkSpaceAdminPermission
from plane.db.models import Workspace

from ...models import ScriptFunction
from ...serializers import ScriptFunctionSerializer, ScriptFunctionListSerializer


class FunctionListCreateView(ListCreateAPIView):
    """
    List all functions (system + workspace) and create new workspace functions.
    System functions are always included in the list but cannot be created via this endpoint.
    """

    authentication_classes = [BaseSessionAuthentication]
    permission_classes = [WorkSpaceAdminPermission]

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug")

    def get_serializer_class(self):
        if self.request.method == "GET":
            return ScriptFunctionListSerializer
        return ScriptFunctionSerializer

    def get_queryset(self):
        workspace = get_object_or_404(Workspace, slug=self.workspace_slug)

        # Get both system functions and workspace-specific functions
        queryset = ScriptFunction.objects.filter(
            Q(is_system=True) | Q(workspace=workspace)
        )

        # Optional query parameters for filtering
        category = self.request.query_params.get("category")
        is_system = self.request.query_params.get("is_system")
        search = self.request.query_params.get("search")

        if category:
            queryset = queryset.filter(category=category)
        if is_system is not None:
            queryset = queryset.filter(is_system=is_system.lower() == "true")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        return queryset.order_by("is_system", "category", "name")

    def perform_create(self, serializer):
        workspace = get_object_or_404(Workspace, slug=self.workspace_slug)
        # Workspace functions are always non-system
        serializer.save(workspace=workspace, is_system=False)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )


class FunctionRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a workspace function.
    System functions cannot be modified or deleted via this endpoint.
    """

    serializer_class = ScriptFunctionSerializer
    authentication_classes = [BaseSessionAuthentication]
    permission_classes = [WorkSpaceAdminPermission]

    lookup_field = "id"
    lookup_url_kwarg = "function_id"

    @property
    def workspace_slug(self):
        return self.kwargs.get("slug")

    def get_queryset(self):
        workspace = get_object_or_404(Workspace, slug=self.workspace_slug)
        # For retrieve, include both system and workspace functions
        # For update/delete, only workspace functions (handled in update/destroy methods)
        return ScriptFunction.objects.filter(
            Q(is_system=True) | Q(workspace=workspace)
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_system:
            return Response(
                {"error": "System functions cannot be modified"},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_system:
            return Response(
                {"error": "System functions cannot be deleted"},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)
