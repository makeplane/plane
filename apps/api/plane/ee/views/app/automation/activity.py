# Standard library imports
import uuid

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.request import Request

# Module imports
from plane.ee.views.app.automation.base import AutomationBaseEndpoint
from plane.ee.serializers import (
    AutomationActivityReadSerializer,
)
from plane.ee.models import AutomationActivity
from plane.app.permissions import allow_permission, ROLE
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag


class AutomationActivityEndpoint(AutomationBaseEndpoint):

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
        filters = {}
        if request.GET.get("created_at__gt", None) is not None:
            filters = {"created_at__gt": request.GET.get("created_at__gt")}

        if request.GET.get("type", None) is not None:
            if request.GET.get("type") == "run_history":
                filters["field"] = "automation.run_history"
            elif request.GET.get("type") == "activity":
                filters["field__ne"] = "automation.run_history"

        if pk:
            activity = (
                AutomationActivity.objects.select_related("automation")
                .filter(**filters)
                .exclude(field="automation.edge")
                .get(
                    id=pk,
                    project_id=project_id,
                    workspace__slug=slug,
                    automation_id=automation_id,
                )
            )
            serializer = AutomationActivityReadSerializer(activity)
            return Response(serializer.data, status=status.HTTP_200_OK)

        activities = (
            AutomationActivity.objects.select_related("automation")
            .select_related("automation_run")
            .filter(
                project_id=project_id,
                workspace__slug=slug,
                automation_id=automation_id,
            )
            .filter(**filters)
            .exclude(field="automation.edge")
            .order_by("created_at")
        )
        serializer = AutomationActivityReadSerializer(activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
