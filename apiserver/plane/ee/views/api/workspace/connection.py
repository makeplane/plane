# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.api import BaseServiceAPIView
from plane.ee.models.workspace import WorkspaceConnection, WorkspaceCredential
from plane.ee.serializers import WorkspaceConnectionAPISerializer


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
        serializer = WorkspaceConnectionAPISerializer(data={**request.data})
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
        connection.delete()
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
