# Python imports
from uuid import uuid4

# Django imports
from django.conf import settings

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseViewSet
from plane.ee.permissions import ProjectMemberPermission
from plane.db.models import DeployBoard, Intake
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class ProjectInTakePublishViewSet(BaseViewSet):
    permission_classes = [ProjectMemberPermission]

    models = Intake

    def get_intake_email_domain(self):
        return settings.INTAKE_EMAIL_DOMAIN

    @check_feature_flag(FeatureFlag.INTAKE_FORM)
    @check_feature_flag(FeatureFlag.INTAKE_EMAIL)
    def regenerate(self, request, slug, project_id, type=None):
        # generate the entity name
        entity_name = (
            DeployBoard.DeployBoardType.INTAKE_EMAIL
            if type == "intake_email"
            else DeployBoard.DeployBoardType.INTAKE
        )

        # fetch the deploy board
        deploy_board = DeployBoard.objects.get(
            entity_name=entity_name, project_id=project_id, workspace__slug=slug
        )

        # Update the anchor
        new_anchor = uuid4().hex
        deploy_board.anchor = new_anchor
        deploy_board.save(update_fields=["anchor"])

        # new anchor
        anchor = deploy_board.anchor

        # update the anchor with full email address if entity is intake_email
        if type == "intake_email":
            # Get the deploy board
            email_domain = self.get_intake_email_domain()
            anchor = f"{slug}-{new_anchor}@{email_domain}"

        return Response({"anchor": anchor}, status=status.HTTP_200_OK)
