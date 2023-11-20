# Django imports
from django.db.models import (
    Exists,
    OuterRef,
)

# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

# Module imports
from .base import BaseAPIView
from plane.app.serializers import ProjectDeployBoardSerializer
from plane.app.permissions import ProjectMemberPermission
from plane.db.models import (
    Project,
    ProjectDeployBoard,
)


class ProjectDeployBoardPublicSettingsEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def get(self, request, slug, project_id):
        project_deploy_board = ProjectDeployBoard.objects.get(
            workspace__slug=slug, project_id=project_id
        )
        serializer = ProjectDeployBoardSerializer(project_deploy_board)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspaceProjectDeployBoardEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def get(self, request, slug):
        projects = (
            Project.objects.filter(workspace__slug=slug)
            .annotate(
                is_public=Exists(
                    ProjectDeployBoard.objects.filter(
                        workspace__slug=slug, project_id=OuterRef("pk")
                    )
                )
            )
            .filter(is_public=True)
        ).values(
            "id",
            "identifier",
            "name",
            "description",
            "emoji",
            "icon_prop",
            "cover_image",
        )

        return Response(projects, status=status.HTTP_200_OK)
