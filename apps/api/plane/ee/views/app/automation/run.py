# Standard library imports
import uuid

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request

# Module imports
from plane.ee.views.app.automation.base import AutomationBaseEndpoint
from plane.ee.serializers import (
    AutomationRunReadSerializer,
)
from plane.ee.models import AutomationRun
from plane.app.permissions import allow_permission, ROLE
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class AutomationRunEndpoint(AutomationBaseEndpoint):

    @check_feature_flag(FeatureFlag.PROJECT_AUTOMATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER])
    def get(
        self,
        request: Request,
        slug: str,
        project_id: uuid.UUID,
        automation_id: uuid.UUID,
        pk=None,
    ):
        if pk:
            run = AutomationRun.objects.get(
                id=pk,
                project_id=project_id,
                workspace__slug=slug,
                automation_id=automation_id,
            )
            serializer = AutomationRunReadSerializer(run)
            return Response(serializer.data, status=status.HTTP_200_OK)

        runs = AutomationRun.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            automation_id=automation_id,
        )
        serializer = AutomationRunReadSerializer(runs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
