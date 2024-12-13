# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.db.models import IssueType, ProjectIssueType
from plane.ee.views.base import BaseAPIView
from plane.ee.permissions import ProjectMemberPermission
from plane.ee.models import ProjectFeature

from plane.ee.serializers.app.project import ProjectFeatureSerializer


class ProjectFeatureEndpoint(BaseAPIView):
    # permission_classes = [
    #     ProjectMemberPermission,
    # ]

    def get(self, request, slug, pk):
        project_feature, _ = ProjectFeature.objects.get_or_create(
            project_id=pk, workspace__slug=slug
        )
        serializer = ProjectFeatureSerializer(project_feature)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, slug, pk):
        project_feature = ProjectFeature.objects.get(
            project_id=pk, workspace__slug=slug
        )
        if request.data.get("is_epic_enabled", False):
            epic, is_created = IssueType.objects.get_or_create(
                workspace_id=project_feature.workspace_id,
                project_issue_types__project_id=pk,
                is_epic=True,
                level=1,
                is_active=True,
            )
            if is_created:
                ProjectIssueType.objects.get_or_create(project_id=pk, issue_type=epic)

        serializer = ProjectFeatureSerializer(
            project_feature, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
