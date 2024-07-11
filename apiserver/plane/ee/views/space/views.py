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
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import ErrorCodes


class ViewsPublicEndpoint(BaseAPIView):

    permission_classes = [
        AllowAny,
    ]

    def get(self, request, anchor):
        # Get the deploy board object
        deploy_board = DeployBoard.objects.get(
            anchor=anchor, entity_name="view"
        )

        # Check if the workspace has access to feature
        if check_workspace_feature_flag(
            feature_key=FeatureFlag.PAGE_PUBLISH,
            slug=deploy_board.workspace.slug,
        ):
            # Get the views object
            views = IssueView.objects.get(pk=deploy_board.entity_identifier)
            serializer = ViewsPublicSerializer(views)
            return Response(serializer.data, status=status.HTTP_200_OK)
        # Check if the workspace has access to feature
        else:
            return Response(
                {
                    "error": "Payment required",
                    "error_code": ErrorCodes.PAYMENT_REQUIRED.value,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )
