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

# Django imports
from django.conf import settings

# Module imports
from plane.db.models.workspace import Workspace
from plane.ee.models.workspace import WorkspaceCredential
from plane.ee.views.base import BaseAPIView
from plane.ee.serializers import WorkspaceCredentialSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.permissions import can, IntegrationPermissions


class WorkspaceCredentialView(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.SILO)
    @can(IntegrationPermissions.DELETE, resource_param="workspace_id")
    def delete(self, request, slug, pk):
        credential = WorkspaceCredential.objects.filter(pk=pk).first()
        if not credential:
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = WorkspaceCredentialSerializer(credential, data={"is_active": False}, partial=True)
        if serializer.is_valid():
            serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class VerifyWorkspaceCredentialView(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.SILO)
    @can(IntegrationPermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug):
        # Extract `source` from query params
        source = request.query_params.get("source", "").lower()
        user_id = request.query_params.get("user_id", None)

        # Fetch credentials using a service function
        workspace = Workspace.objects.filter(slug=slug).first()
        workspace_id = workspace.id
        credentials = WorkspaceCredential.objects.filter(
            workspace_id=workspace_id, user_id=user_id, source=source
        ).first()

        # Determine if OAuth is enabled for the given source
        is_oauth_enabled = False
        if source == "linear":
            is_oauth_enabled = getattr(settings, "LINEAR_OAUTH_ENABLED", "0") == "1"
        elif source == "jira":
            is_oauth_enabled = getattr(settings, "JIRA_OAUTH_ENABLED", "0") == "1"
        elif source == "jira_server":
            is_oauth_enabled = getattr(settings, "JIRA_SERVER_OAUTH_ENABLED", "0") == "1"
        elif source == "asana":
            is_oauth_enabled = getattr(settings, "ASANA_OAUTH_ENABLED", "0") == "1"

        # Return appropriate response based on credentials
        if not credentials:
            return Response(
                {"isAuthenticated": False, "isOAuthEnabled": is_oauth_enabled},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            {"isAuthenticated": True, "isOAuthEnabled": is_oauth_enabled},
            status=status.HTTP_200_OK,
        )

    @check_feature_flag(FeatureFlag.SILO)
    @can(IntegrationPermissions.CONNECT, resource_param="workspace_id")
    def post(self, request, slug, pk):
        credential = WorkspaceCredential.objects.filter(pk=pk).first()
        token = request.data.get("token", None)

        serializer = WorkspaceCredentialSerializer(credential, data={"token": token}, partial=True)

        if serializer.is_valid():
            serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
