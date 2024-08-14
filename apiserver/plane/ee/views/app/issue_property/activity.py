# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.serializers import IssuePropertyActivitySerializer
from plane.ee.models import IssuePropertyActivity
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import ProjectEntityPermission


class IssuePropertyActivityEndpoint(BaseAPIView):

    permission_classes = [
        ProjectEntityPermission,
    ]

    def get(self, request, slug, project_id, issue_id):
        # Get the order by
        order_by = request.GET.get("order_by", "-created_at")

        # Get all issue properties for a specific issue
        activities = IssuePropertyActivity.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
        ).order_by(order_by)

        # Serialize the data
        serializer = IssuePropertyActivitySerializer(activities, many=True)

        # Return the response
        return Response(serializer.data, status=status.HTTP_200_OK)
