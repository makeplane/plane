# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import IssueDescriptionVersion
from ..base import BaseAPIView
from plane.app.serializers import (
    IssueDescriptionVersionSerializer,
    IssueDescriptionVersionDetailSerializer,
)
from plane.app.permissions import allow_permission, ROLE


class IssueVersionEndpoint(BaseAPIView):

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id, pk=None):
        # Check if pk is provided
        if pk:
            # Return a single issue version
            issue_version = IssueDescriptionVersion.objects.get(
                workspace__slug=slug,
                issue_id=issue_id,
                pk=pk,
            )
            # Serialize the issue version
            serializer = IssueDescriptionVersionDetailSerializer(issue_version)
            return Response(serializer.data, status=status.HTTP_200_OK)
        # Return all issue versions
        issue_versions = IssueDescriptionVersion.objects.filter(
            workspace__slug=slug,
            issue_id=issue_id,
        ).order_by("-last_saved_at")[:20]
        # Serialize the issue versions
        serializer = IssueDescriptionVersionSerializer(
            issue_versions, many=True
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
