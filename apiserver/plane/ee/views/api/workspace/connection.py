# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models.workspace import Workspace
from plane.ee.views.base import BaseAPIView, BaseViewSet
from plane.ee.models.workspace import WorkspaceConnection, WorkspaceCredential
from plane.ee.serializers import WorkspaceConnectionSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.app.permissions.workspace import WorkSpaceBasePermission

class WorkspaceConnectionAPIView(BaseAPIView):
    permission_classes = [WorkSpaceBasePermission]
    
    def get(self, request, slug, pk = None):
        if not pk:
            connections = WorkspaceConnection.objects.filter(**request.query_params).order_by("-created_at")
            serializer = WorkspaceConnectionSerializer(connections, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        connection = WorkspaceConnection.objects.filter(id=pk).first()
        serializer = WorkspaceConnectionSerializer(connection)
        return Response(serializer.data, status=status.HTTP_200_OK)  

    def post(self, request, slug):
        report = ImportReport.objects.create()

        serializer = WorkspaceConnectionSerializer(data={**request.data, "report": report.id}, context={"project_id": project_id})
        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED
            )
        return Response(
            serializer.errors, 
            status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, slug, pk):
        connection = WorkspaceConnection.objects.filter(id=pk).first()

        serializer = WorkspaceConnectionSerializer(
            connection, 
            data=request.data, 
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, slug, pk):
        connection = WorkspaceConnection.objects.filter(id=pk).first()
        connection.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



class WorkspaceUserConnectionAPIView(BaseAPIView):
    permission_classes = [WorkSpaceBasePermission]
    
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
            result_connections.append({
                **WorkspaceConnectionSerializer(connection).data,
                "isUserConnected": is_user_connected,
            })

        return Response(result_connections, status=status.HTTP_200_OK)
