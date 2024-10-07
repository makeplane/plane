# Django imports
from django.db.models import Q

# Third Party imports
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.db.models import (
    DeployBoard,
    State,
)


class ProjectStatesEndpoint(BaseAPIView):
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

        states = State.objects.filter(
            ~Q(name="Triage"),
            workspace__slug=deploy_board.workspace.slug,
            project_id=deploy_board.project_id,
        ).values("name", "group", "color", "id", "sequence")

        return Response(
            states,
            status=status.HTTP_200_OK,
        )
