# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.serializers import IssuePropertyActivitySerializer
from plane.ee.models import IssuePropertyActivity
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import ProjectEntityPermission
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class IssuePropertyActivityEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    def get(self, request, slug, project_id, issue_id):
        # Get the filters
        filters = {}
        if request.GET.get("created_at__gt", None) is not None:
            filters = {"created_at__gt": request.GET.get("created_at__gt")}

        # Get the order by
        order_by = request.GET.get("order_by", "-created_at")

        # Get all issue properties for a specific issue
        activities = (
            IssuePropertyActivity.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=issue_id,
                property__issue_type__is_epic=False,
                **filters,
            )
            .select_related("actor")
            .order_by(order_by)
        )

        # Serialize the data
        serializer = IssuePropertyActivitySerializer(activities, many=True)

        # Return the response
        return Response(serializer.data, status=status.HTTP_200_OK)
