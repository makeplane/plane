# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Workspace
from plane.ee.models import WorkspaceEntityConnection
from plane.ee.views.base import BaseAPIView, BaseViewSet
from plane.ee.serializers import WorkspaceEntityConnectionSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.app.permissions.workspace import WorkSpaceBasePermission

class WorkspaceEntityConnectionAPIView(BaseAPIView):
    permission_classes = [WorkSpaceBasePermission]
    def get(self, request, slug, pk = None):
        if not pk:
            workspace = Workspace.objects.get(slug=slug)
            connections = WorkspaceEntityConnection.objects.filter(workspace=workspace)
            serializer = WorkspaceEntityConnectionSerializer(connections, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        connection = WorkspaceEntityConnection.objects.get(pk=pk)
        serializer = WorkspaceEntityConnectionSerializer(connection)
        return Response(serializer.data, status=status.HTTP_200_OK)


    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = WorkspaceEntityConnectionSerializer(data={"workspace": workspace.id, **request.data})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def patch(self, request, slug, pk):
        connection = WorkspaceEntityConnection.objects.get(pk=pk)
        serializer = WorkspaceEntityConnectionSerializer(connection, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, pk):
        connection = WorkspaceEntityConnection.objects.filter(pk=pk).first()
        if not connection:
            return Response(status=status.HTTP_204_NO_CONTENT)
        connection.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
   
