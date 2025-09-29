# Third party imports
import base64
import json
from rest_framework import status
from rest_framework.response import Response
import logging

# Module imports
from plane.ee.views.api import BaseServiceAPIView
from plane.ee.models.workspace import WorkspaceConnection, WorkspaceCredential
from plane.ee.serializers import WorkspaceConnectionAPISerializer

logger = logging.getLogger(__name__)


class WorkspaceConnectionAPIView(BaseServiceAPIView):
    def get(self, request, pk=None):
        if not pk:
            connections = (
                WorkspaceConnection.objects.filter(**request.query_params.dict())
                .select_related("workspace")
                .order_by("-created_at")
            )
            serializer = WorkspaceConnectionAPISerializer(connections, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        connection = (
            WorkspaceConnection.objects.filter(id=pk)
            .select_related("workspace")
            .first()
        )
        serializer = WorkspaceConnectionAPISerializer(connection)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # Check if the workspace connection already exists
        workspace_connection = WorkspaceConnection.objects.filter(
            workspace_id=request.data.get("workspace_id"),
            connection_type=request.data.get("connection_type"),
            deleted_at__isnull=True,
        ).first()

        if not workspace_connection:
            serializer = WorkspaceConnectionAPISerializer(data={**request.data})
        else:
            serializer = WorkspaceConnectionAPISerializer(
                workspace_connection, data=request.data, partial=True
            )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        connection = WorkspaceConnection.objects.filter(id=pk).first()

        serializer = WorkspaceConnectionAPISerializer(
            connection, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        connection = WorkspaceConnection.objects.filter(id=pk).first()
        if not connection:
            return Response(
                {"error": "Connection not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Get deleted_by from query parameters
        deleted_by_id = request.GET.get("deleted_by")

        # Get disconnect_meta from query parameters
        disconnect_meta_encoded = request.GET.get("disconnect_meta")
        disconnect_meta = None

        if disconnect_meta_encoded:
            try:
                # Decode the base64 string
                disconnect_meta_json = base64.b64decode(disconnect_meta_encoded).decode(
                    "utf-8"
                )
                # Parse the JSON
                disconnect_meta = json.loads(disconnect_meta_json)
            except (base64.binascii.Error, json.JSONDecodeError) as e:
                # Log the error and continue without setting disconnect_meta
                logger.warning("Invalid disconnect_meta format: %s", e)

            # Update the connection with disconnect_meta

        connection.delete(deleted_by_id=deleted_by_id, disconnect_meta=disconnect_meta)

        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceUserConnectionAPIView(BaseServiceAPIView):
    def get(self, request):
        workspace_id = request.query_params.get("workspace_id", None)
        user_id = request.query_params.get("user_id", None)

        if not workspace_id or not user_id:
            return Response(
                {"error": "workspace_id and user_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Fetch all workspace connections for the workspace
        connections = WorkspaceConnection.objects.filter(workspace_id=workspace_id)

        # Fetch all workspace credentials for the given workspace and user
        credentials = WorkspaceCredential.objects.filter(
            workspace_id=workspace_id, user_id=user_id, is_active=True
        )

        # Create a map of credential sources for quick lookup
        credential_map = {credential.source: credential for credential in credentials}

        result_connections = []

        # Check if the user is connected to each workspace connection
        for connection in connections:
            is_user_connected = f"{connection.connection_type}-USER" in credential_map
            result_connections.append(
                {
                    **WorkspaceConnectionAPISerializer(connection).data,
                    "isUserConnected": is_user_connected,
                }
            )

        return Response(result_connections, status=status.HTTP_200_OK)
