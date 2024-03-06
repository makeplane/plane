# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers import StateSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import State
from plane.app.permissions import WorkspaceEntityPermission


class WorkspaceStatesEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def get(self, request, slug):
        states = State.objects.filter(
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
            project__project_projectmember__is_active=True,
        )
        serializer = StateSerializer(states, many=True).data
        return Response(serializer, status=status.HTTP_200_OK)
