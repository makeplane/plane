# Django imports
from django.db import IntegrityError, models

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Issue
from plane.ee.views.base import BaseAPIView
from plane.ee.models import IssueProperty, IssuePropertyOption
from plane.ee.permissions import ProjectEntityPermission
from plane.ee.serializers import (
    IssuePropertySerializer,
    IssuePropertyOptionSerializer,
)
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class IssuePropertyEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    @check_feature_flag(FeatureFlag.ISSUE_TYPE_DISPLAY)
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

    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
    def post(
        self,
        request,
        slug,
        project_id,
        issue_type_id,
    ):
        try:

            # Get the options
            options = request.data.pop("options", [])

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

            # Create a new issue properties
            serializer = IssuePropertySerializer(data=request.data)
            # Validate the data
            serializer.is_valid(raise_exception=True)
            # Save the data
            serializer.save(project_id=project_id, issue_type_id=issue_type_id)

            issue_property = IssueProperty.objects.get(
                project_id=project_id,
                issue_type_id=issue_type_id,
                pk=serializer.data["id"],
            )

            # Check if the property type is option and create the options
            if issue_property.property_type == "OPTION":
                workspace_id = issue_property.workspace_id
                issue_property_id = issue_property.id

                # Bulk create the options
                bulk_create_options = []
                last_id = IssuePropertyOption.objects.filter(
                    project=project_id, property_id=issue_property_id
                ).aggregate(largest=models.Max("sort_order"))["largest"]

                if last_id:
                    sort_order = last_id + 10000
                else:
                    sort_order = 10000

                for option in options:
                    if not option.get("name"):
                        return Response(
                            {"error": "Name of option is required"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    bulk_create_options.append(
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

                # Create the options
                IssuePropertyOption.objects.bulk_create(
                    bulk_create_options,
                    batch_size=100,
                )

                # Fetch all the default options
                issue_property_options = IssuePropertyOption.objects.filter(
                    property_id=issue_property_id,
                    workspace_id=workspace_id,
                    project_id=project_id,
                    is_default=True,
                ).values_list("id", flat=True)

                # Save the default value
                issue_property.default_value = [
                    str(option) for option in issue_property_options
                ]
                issue_property.save()

            serializer = IssuePropertySerializer(issue_property)
            options = IssuePropertyOption.objects.filter(
                property_id=issue_property.id,
                workspace_id=issue_property.workspace_id,
                project_id=project_id,
            )
            options_serializer = IssuePropertyOptionSerializer(
                options, many=True
            )
            # generate the response with the new data and options
            response = {
                "property_detail": serializer.data,
                "options": options_serializer.data,
            }
            return Response(response, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response(
                {
                    "error": "A Property with the same name already exists in this issue type",
                },
                status=status.HTTP_409_CONFLICT,
            )

    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
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
        # if property type is being changed, reset the defaults
        if (
            request.data.get("property_type")
            and request.data.get("property_type")
            != issue_property.property_type
        ):
            defaults = {
                "relation_type": None,
                "default_value": [],
                "settings": {},
                "is_multi": False,
                "validation_rules": {},
            }
            # Update request data with defaults for missing fields
            for field, default_value in defaults.items():
                request.data.setdefault(field, default_value)

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

    @check_feature_flag(FeatureFlag.ISSUE_TYPE_SETTINGS)
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
