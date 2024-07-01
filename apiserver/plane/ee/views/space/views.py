# Third party imports
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .base import BaseAPIView
from plane.db.models import (
    DeployBoard,
    IssueView,
)
from plane.ee.serializers import (
    ViewsPublicSerializer,
)


class ViewsPublicEndpoint(BaseAPIView):

    permission_classes = [
        AllowAny,
    ]

    def get(self, request, anchor):
        # Get the deploy board object
        deploy_board = DeployBoard.objects.get(
            anchor=anchor, entity_name="view"
        )
        # Get the views object
        views = IssueView.objects.get(pk=deploy_board.entity_identifier)
        serializer = ViewsPublicSerializer(views)
        return Response(serializer.data, status=status.HTTP_200_OK)
