# Django imports
from django.db.models import Exists, OuterRef

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.db.models import IssueType, Issue, Project
from plane.ee.permissions import ProjectEntityPermission
from plane.ee.serializers import IssueTypeSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class IssueTypeEndpoint(BaseAPIView):

    permission_classes = [
        ProjectEntityPermission,
    ]

    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
    def get(self, request, slug, project_id, pk=None):
        # Get a single issue type
        if pk:
            issue_type = IssueType.objects.annotate(
                issue_exists=Exists(
                    Issue.objects.filter(project_id=project_id, type_id=pk)
                )
            ).get(workspace__slug=slug, project_id=project_id, pk=pk)
            serializer = IssueTypeSerializer(issue_type)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all issue types
        issue_types = IssueType.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).annotate(
            issue_exists=Exists(
                Issue.objects.filter(
                    project_id=project_id, type_id=OuterRef("pk")
                )
            )
        )
        serializer = IssueTypeSerializer(issue_types, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
    def post(self, request, slug, project_id):
        # Create a new issue type
        serializer = IssueTypeSerializer(data=request.data)
        # check weight
        if not request.data.get("weight"):
            request.data["weight"] = 1
        # Validate the data
        serializer.is_valid(raise_exception=True)
        # Save the data
        serializer.save(project_id=project_id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
    def patch(self, request, slug, project_id, pk):
        # Update an issue type
        issue_type = IssueType.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk
        )

        # Default cannot be made in active
        if request.data.get("is_default") and not request.data.get(
            "is_active"
        ):
            return Response(
                {"error": "Default issue type cannot be inactive"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = IssueTypeSerializer(
            issue_type, data=request.data, partial=True
        )
        # Validate the data
        serializer.is_valid(raise_exception=True)
        # Save the data
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
    def delete(self, request, slug, project_id, pk):
        # Delete an issue type
        issue_type = IssueType.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk
        )

        # Check if there are any issues using this issue type
        if Issue.objects.filter(project_id=project_id, type_id=pk).exists():
            return Response(
                {"error": "Cannot delete issue type with associated issues"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the issue type is the default issue type
        if issue_type.is_default:
            return Response(
                {"error": "Cannot delete default issue type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issue_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DefaultIssueTypeEndpoint(BaseAPIView):

    permission_classes = [
        ProjectEntityPermission,
    ]

    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
    def post(self, request, slug, project_id):
        # Get the project
        project = Project.objects.get(pk=project_id)

        # If issue type is already created return an error
        if IssueType.objects.filter(
            workspace__slug=slug, project_id=project_id
        ).exists():
            return Response(
                {{"error": "Default issue type already exists"}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create a new default issue type
        issue_type, _ = IssueType.objects.get_or_create(
            project_id=project_id,
            name="Issue",
            is_default=True,
            defaults={
                "description": "Default issue type with the option to add new properties",
                "is_default": True,
                "weight": 0,
                "sort_order": 1,
                "logo_props": {
                    "in_use": "icon",
                    "icon": {"name": "Layers", "color": "#6d7b8a"},
                },
            },
        )
        # Update existing issues to use the new default issue type
        Issue.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            type_id__isnull=True,
        ).update(type_id=issue_type.id)

        # Update the project
        project.is_issue_type_enabled = True
        project.save()

        # Serialize the data
        return Response(status=status.HTTP_204_NO_CONTENT)
