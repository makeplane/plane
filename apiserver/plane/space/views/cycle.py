# Third Party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.db.models import (
    DeployBoard,
    Cycle,
)


class ProjectCyclesEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    def get(self, request, anchor):
        deploy_board = DeployBoard.objects.filter(anchor=anchor).first()
        if not deploy_board:
            return Response(
                {"error": "Invalid anchor"},
                status=status.HTTP_404_NOT_FOUND,
            )

        cycles = Cycle.objects.filter(
            workspace__slug=deploy_board.workspace.slug,
            project_id=deploy_board.project_id,
        ).values("id", "name")

        return Response(
            cycles,
            status=status.HTTP_200_OK,
        )
