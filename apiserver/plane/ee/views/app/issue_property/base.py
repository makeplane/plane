# Django imports
from django.db import IntegrityError

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Issue
from plane.ee.views.base import BaseAPIView
from plane.ee.models import IssueProperty
from plane.ee.permissions import ProjectEntityPermission
from plane.ee.serializers import (
    IssuePropertySerializer,
)


class IssuePropertyEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def get(self, request, slug, project_id, issue_type_id=None, pk=None):
        # Get a single issue property
        if pk:
            issue_property = IssueProperty.objects.get(
                workspace__slug=slug, project_id=project_id, pk=pk
            )
            serializer = IssuePropertySerializer(issue_property)
            return Response(serializer.data, status=status.HTTP_200_OK)

        if issue_type_id:
            # Get all issue properties for a specific issue type
            issue_properties = IssueProperty.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_type_id=issue_type_id,
            )
            serializer = IssuePropertySerializer(issue_properties, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all issue properties
        issue_types = IssueProperty.objects.filter(
            workspace__slug=slug, project_id=project_id
        )
        serializer = IssuePropertySerializer(issue_types, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(
        self,
        request,
        slug,
        project_id,
        issue_type_id,
    ):
        try:
            # Create a new issue properties
            serializer = IssuePropertySerializer(data=request.data)

            # Check is_active
            if not request.data.get("is_active"):
                request.data["is_active"] = False

            # Check defaults
            if (
                not request.data.get("is_multi")
                and len(request.data.get("default_value", [])) > 1
            ):
                return Response(
                    {
                        "error": "Default value must be a single value for non-multi properties"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if required and default_value
            if request.data.get("is_required") is True:
                request.data["default_value"] = []

            # Validate the data
            serializer.is_valid(raise_exception=True)
            # Save the data
            serializer.save(project_id=project_id, issue_type_id=issue_type_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response(
                {
                    "error": "A Property with the same name already exists in this issue type",
                },
                status=status.HTTP_409_CONFLICT,
            )

    def patch(self, request, slug, project_id, issue_type_id, pk):
        # Update an issue properties
        issue_property = IssueProperty.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            issue_type_id=issue_type_id,
            pk=pk,
        )
        if (
            request.data.get("property_type")
            or request.data.get("is_multi")
            or request.data.get("settings")
        ) and Issue.objects.filter(type_id=issue_type_id).exists():
            return Response(
                {
                    "error": "Some fields cannot be updated as issues exist with this property"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check defaults
        if (
            not request.data.get("is_multi", issue_property.is_multi)
            and len(request.data.get("default_value", [])) > 1
        ):
            return Response(
                {
                    "error": "Default value must be a single value for non-multi properties"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if is_required is being set to true and remove default_value if so
        if request.data.get("is_required", issue_property.is_required) is True:
            request.data["default_value"] = []

        serializer = IssuePropertySerializer(
            issue_property, data=request.data, partial=True
        )
        # Validate the data
        serializer.is_valid(raise_exception=True)
        # Save the data
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug, project_id, issue_type_id, pk):
        # Delete an issue properties
        issue_property = IssueProperty.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            issue_type_id=issue_type_id,
            pk=pk,
        )
        issue_property.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
