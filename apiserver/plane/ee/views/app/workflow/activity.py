# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.models import WorkflowTransitionActivity
from plane.ee.serializers import WorkflowTransitionActivitySerializer
from plane.ee.permissions import allow_permission, ROLE
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag

from rest_framework import status
from rest_framework.response import Response


class WorkflowActivityEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.WORKFLOWS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        filters = {}
        if request.GET.get("created_at__gt", None) is not None:
            filters = {"created_at__gt": request.GET.get("created_at__gt")}

        issue_activities = (
            WorkflowTransitionActivity.objects.filter(
                workspace__slug=slug, project_id=project_id
            )
            .filter(**filters)
            .select_related("actor", "workspace", "project")
        ).order_by("created_at")

        issue_activities = WorkflowTransitionActivitySerializer(
            issue_activities, many=True
        ).data

        return Response(issue_activities, status=status.HTTP_200_OK)
