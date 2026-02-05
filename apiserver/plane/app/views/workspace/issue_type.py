# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import IssueTypeSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import IssueType
from plane.app.permissions import WorkspaceEntityPermission
from plane.utils.cache import cache_response


class WorkspaceIssueTypeEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    @cache_response(60 * 60 * 2)
    def get(self, request, slug):
        issue_types = IssueType.objects.filter(
            workspace__slug=slug,
            is_active=True,
        ).order_by("level")
        serializer = IssueTypeSerializer(issue_types, many=True).data
        return Response(serializer, status=status.HTTP_200_OK)
