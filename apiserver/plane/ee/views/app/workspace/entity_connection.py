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


class WorkspaceEntityConnectionView(BaseAPIView):
    permission_classes = [WorkSpaceBasePermission]

    @check_feature_flag(FeatureFlag.SILO)
    def get(self, request, slug, pk):
        if not pk:
            workspace = Workspace.objects.get(slug=slug)
            connections = WorkspaceEntityConnection.objects.filter(workspace=workspace)
            serializer = WorkspaceEntityConnectionSerializer(connections, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        connection = WorkspaceEntityConnection.objects.get(pk=pk)
        serializer = WorkspaceEntityConnectionSerializer(connection)
        return Response(serializer.data, status=status.HTTP_200_OK)
