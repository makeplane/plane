# Django imports
from django.db import models

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.ee.permissions import ProjectEntityPermission
from plane.ee.views.base import BaseAPIView
from plane.ee.models import IssuePropertyOption, IssueProperty
from plane.ee.serializers import IssuePropertyOptionSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class IssuePropertyOptionEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    @check_feature_flag(FeatureFlag.ISSUE_TYPE_DISPLAY)
    def get(self, request, slug, project_id, issue_property_id=None, pk=None):
        # Get a single issue property option
        if pk:
            issue_property_option = IssuePropertyOption.objects.get(
                workspace__slug=slug, project_id=project_id, pk=pk
            )
            serializer = IssuePropertyOptionSerializer(issue_property_option)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all issue property options for a specific property
        if issue_property_id:
            issue_property_options = IssuePropertyOption.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                property_id=issue_property_id,
            )
            serializer = IssuePropertyOptionSerializer(
                issue_property_options, many=True
            )
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Get all issue property options for the project_id in the form of property_id: options[]
        issue_property_options = IssuePropertyOption.objects.filter(
            workspace__slug=slug, project_id=project_id
        )

        serializer = IssuePropertyOptionSerializer(
            issue_property_options, many=True
        )

        response_map = {}
        for option in serializer.data:
            if str(option["property"]) in response_map:
                response_map[str(option["property"])].append(option)
            else:
                response_map[str(option["property"])] = [option]

        return Response(response_map, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
    def post(self, request, slug, project_id, issue_property_id):
        # Create a new issue property option
        # Only allow when property type is option
        issue_property = IssueProperty.objects.get(
            workspace__slug=slug, project_id=project_id, pk=issue_property_id
        )

        # Check if the property type is option
        if issue_property.property_type != "OPTION":
            return Response(
                {"error": "Property type must be an option"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        last_id = IssuePropertyOption.objects.filter(
            project=project_id, property_id=issue_property_id
        ).aggregate(largest=models.Max("sort_order"))["largest"]

        if last_id:
            sort_order = last_id + 10000
        else:
            sort_order = 10000

        bulk_property_options = []
        for option in request.data.get("options", []):
            bulk_property_options.append(
                IssuePropertyOption(
                    name=option.get("name"),
                    sort_order=sort_order,
                    property_id=issue_property_id,
                    description=option.get("description", ""),
                    logo_props=option.get("logo_props", {}),
                    is_active=option.get("is_active", True),
                    is_default=option.get("is_default", False),
                    parent_id=option.get("parent_id"),
                    workspace_id=issue_property.workspace_id,
                    project_id=project_id,
                )
            )
            sort_order += 10000

        # Bulk create the options
        issue_property_options = IssuePropertyOption.objects.bulk_create(
            bulk_property_options, batch_size=100
        )

        serializer = IssuePropertyOptionSerializer(
            issue_property_options, many=True
        )

        # Save the default value
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
    def patch(self, request, slug, project_id, issue_property_id, pk):
        # Update an issue property option
        issue_property_option = IssuePropertyOption.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            property_id=issue_property_id,
            pk=pk,
        )

        # Fetch the issue property
        issue_property = IssueProperty.objects.get(
            workspace__slug=slug, project_id=project_id, pk=issue_property_id
        )

        # Check if the property type is option
        if issue_property.property_type != "OPTION":
            return Response(
                {"error": "Property type must be an option"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = IssuePropertyOptionSerializer(
            issue_property_option, data=request.data, partial=True
        )
        # Validate the data
        serializer.is_valid(raise_exception=True)
        # Save the data
        serializer.save()

        # Return the data
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
    def delete(self, request, slug, project_id, issue_property_id, pk):
        # Delete an issue property option
        issue_property_option = IssuePropertyOption.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            property_id=issue_property_id,
            pk=pk,
        )
        issue_property_option.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
