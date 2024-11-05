# Python imports
from uuid import uuid4

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseViewSet
from plane.ee.permissions import (
    ProjectMemberPermission,
)
from plane.db.models import DeployBoard, Inbox
from plane.app.serializers import DeployBoardSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class ProjectInTakePublishViewSet(BaseViewSet):

    permission_classes = [
        ProjectMemberPermission,
    ]

    models = Inbox

    @check_feature_flag(FeatureFlag.INTAKE_PUBLISH)
    def regenerate(self, request, slug, project_id):
        # Get the deploy board
        deploy_board = DeployBoard.objects.get(
            entity_name="intake",
            project_id=project_id,
            workspace__slug=slug,
        )
        new_anchor = uuid4().hex
        # Update the anchor
        deploy_board.anchor = new_anchor
        deploy_board.save(update_fields=["anchor"])
        return Response(
            DeployBoardSerializer(deploy_board).data, status=status.HTTP_200_OK
        )
