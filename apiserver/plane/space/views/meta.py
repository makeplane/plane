# third party
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import DeployBoard, Project

from .base import BaseAPIView
from plane.space.serializer.project import ProjectLiteSerializer


class ProjectMetaDataEndpoint(BaseAPIView):
    permission_classes = [AllowAny]

    def get(self, request, anchor):
        deploy_board = DeployBoard.objects.filter(
            anchor=anchor, entity_name="project"
        ).first()
        if not deploy_board:
            return Response(
                {"error": "Project is not published"}, status=status.HTTP_404_NOT_FOUND
            )

        project_id = deploy_board.entity_identifier
        serializer = ProjectLiteSerializer(Project.objects.get(id=project_id))
        return Response(serializer.data, status=status.HTTP_200_OK)
