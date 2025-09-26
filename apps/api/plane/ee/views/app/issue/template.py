# Python imports
import uuid

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework.request import Request

# Module imports
from plane.app.views.base import BaseAPIView
from plane.ee.models import WorkitemTemplate
from plane.ee.bgtasks.template_task import create_subworkitems
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.db.models import Issue


class SubWorkitemTemplateEndpoint(BaseAPIView):
    """Subworkitem template endpoint"""

    @check_feature_flag(FeatureFlag.WORKITEM_TEMPLATES)
    def post(
        self, request: Request, slug: str, project_id: uuid.UUID, workitem_id: uuid.UUID
    ):
        """Get subworkitem template"""
        template_id = request.data.get("template_id", None)

        # Check if template_id is provided
        if not template_id:
            return Response(
                {"error": "Template ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the workitem is present or not

        if not Issue.issue_objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            id=workitem_id,
        ).exists():
            return Response(
                {"error": "Workitem not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get the workitem template
        workitem_template = WorkitemTemplate.objects.filter(
            workspace__slug=slug,
            template_id=template_id,
        ).first()

        if not workitem_template:
            return Response(
                {"error": "Workitem template not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Create the subworkitems
        create_subworkitems.delay(
            workitem_template_id=workitem_template.id,
            project_id=project_id,
            workitem_id=workitem_id,
            user_id=request.user.id,
        )

        return Response(
            {
                "message": "Subworkitem templates created successfully",
            },
            status=status.HTTP_200_OK,
        )
