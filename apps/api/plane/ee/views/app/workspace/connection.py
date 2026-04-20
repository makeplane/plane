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
from plane.ee.views.base import BaseAPIView
from plane.db.models.workspace import Workspace
from plane.ee.models.workspace import WorkspaceConnection, WorkspaceCredential
from plane.ee.serializers import WorkspaceConnectionSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.permissions import can, IntegrationPermissions


class WorkspaceConnectionView(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.SILO)
    @can(IntegrationPermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug, pk=None):
        if not pk:
            connections = WorkspaceConnection.objects.filter(**request.query_params).order_by("-created_at")
            serializer = WorkspaceConnectionSerializer(connections, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        connection = WorkspaceConnection.objects.filter(id=pk).first()
        serializer = WorkspaceConnectionSerializer(connection)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.SILO)
    @can(IntegrationPermissions.DELETE, resource_param="workspace_id")
    def delete(self, request, slug, pk):
        connection = WorkspaceConnection.objects.filter(id=pk).first()
        connection.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceUserConnectionView(BaseAPIView):
    use_read_replica = True

    @check_feature_flag(FeatureFlag.SILO)
    @can(IntegrationPermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug, user_id):
        workspace = Workspace.objects.filter(slug=slug).first()

        # Fetch all workspace connections for the workspace
        connections = WorkspaceConnection.objects.filter(workspace=workspace)

        # Fetch all workspace credentials for the given workspace and user
        credentials = WorkspaceCredential.objects.filter(workspace=workspace, user_id=user_id)

        # Create a map of credential sources for quick lookup
        credential_map = {credential.source: credential for credential in credentials}

        result_connections = []

        # Check if the user is connected to each workspace connection
        for connection in connections:
            is_user_connected = f"{connection.connection_type}-USER" in credential_map
            result_connections.append(
                {
                    **WorkspaceConnectionSerializer(connection).data,
                    "isUserConnected": is_user_connected,
                }
            )

        return Response(result_connections, status=status.HTTP_200_OK)
