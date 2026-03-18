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

from plane.api.views.base import BaseAPIView
from plane.api.serializers import WorkspaceFeatureSerializer
from plane.ee.models import WorkspaceFeature
from plane.db.models import Workspace
from plane.app.permissions import WorkSpaceAdminPermission
from plane.authentication.permissions.oauth import TokenHasScopeIfOAuth

# OpenAPI imports
from plane.utils.openapi.decorators import workspace_docs
from drf_spectacular.utils import OpenApiRequest, OpenApiResponse
from plane.utils.openapi import WORKSPACE_FEATURE_EXAMPLE
from plane.utils.oauth import READ_SCOPE, WRITE_SCOPE, WORKSPACES_FEATURES_READ_SCOPE, WORKSPACES_FEATURES_WRITE_SCOPE


class WorkspaceFeatureAPIEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [WORKSPACES_FEATURES_READ_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [WORKSPACES_FEATURES_WRITE_SCOPE]],
    }
    serializer_class = WorkspaceFeatureSerializer

    def get_queryset(self, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return None

        workspace_feature, _ = WorkspaceFeature.objects.get_or_create(workspace=workspace)

        return {
            "project_grouping": workspace_feature.is_project_grouping_enabled,
            "initiatives": workspace_feature.is_initiative_enabled,
            "teams": workspace_feature.is_teams_enabled,
            "customers": workspace_feature.is_customer_enabled,
            "wiki": workspace_feature.is_wiki_enabled,
            "pi": workspace_feature.is_pi_enabled,
            "work_item_types": workspace_feature.is_work_item_types_enabled,
        }

    @workspace_docs(
        operation_id="get_workspace_features",
        summary="Get workspace features",
        description="Get the features of a workspace",
        responses={
            200: OpenApiResponse(
                description="Workspace features",
                response=WorkspaceFeatureSerializer,
                examples=[WORKSPACE_FEATURE_EXAMPLE],
            )
        },
    )
    def get(self, request, slug):
        workspace_features = self.get_queryset(slug)
        if workspace_features is None:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(workspace_features, status=status.HTTP_200_OK)

    @workspace_docs(
        operation_id="update_workspace_features",
        summary="Update workspace features",
        description="Update the features of a workspace",
        request=OpenApiRequest(request=WorkspaceFeatureSerializer, examples=[WORKSPACE_FEATURE_EXAMPLE]),
        responses={
            200: OpenApiResponse(
                description="Workspace features",
                response=WorkspaceFeatureSerializer,
                examples=[WORKSPACE_FEATURE_EXAMPLE],
            )
        },
    )
    def patch(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        workspace_features = self.get_queryset(slug)
        serializer = WorkspaceFeatureSerializer(
            workspace_features, data=request.data, partial=True, context={"slug": slug, "workspace_id": workspace.id}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
