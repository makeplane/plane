# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import Case, CharField, F, Func, Q, Value, When
from django.db.models.functions import Cast
from django.utils import timezone

# Third party imports
from drf_spectacular.utils import OpenApiExample, OpenApiRequest, OpenApiResponse
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Issue, Workspace
from plane.ee.bgtasks.issue_property_activity_task import issue_property_activity
from plane.ee.models import IssueProperty, IssuePropertyValue, PropertyTypeEnum
from plane.api.serializers import (
    IssuePropertyValueAPISerializer,
    IssuePropertyValueAPIDetailSerializer,
    WorkItemPropertyValueRequestSerializer,
    WorkItemPropertyValueResponseSerializer,
)
from plane.ee.utils.external_issue_property_validator import (
    externalIssuePropertyValueValidator,
    externalIssuePropertyValueSaver,
)
from plane.api.views.base import BaseAPIView
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.openapi.decorators import issue_property_value_docs
from plane.authentication.permissions.oauth import TokenHasScopeIfOAuth
from plane.utils.oauth import (
    READ_SCOPE,
    WRITE_SCOPE,
    PROJECTS_WORK_ITEM_PROPERTY_VALUES_READ_SCOPE,
    PROJECTS_WORK_ITEM_PROPERTY_VALUES_WRITE_SCOPE,
)


def _annotate_property_values_qs(queryset):
    """Annotate queryset with aggregated property values per property_id."""
    return queryset.values("property_id").annotate(
        values=ArrayAgg(
            Case(
                When(
                    property__property_type__in=[
                        PropertyTypeEnum.TEXT,
                        PropertyTypeEnum.URL,
                        PropertyTypeEnum.EMAIL,
                        PropertyTypeEnum.FILE,
                    ],
                    then=F("value_text"),
                ),
                When(
                    property__property_type=PropertyTypeEnum.DATETIME,
                    then=Func(
                        F("value_datetime"),
                        function="TO_CHAR",
                        template="%(function)s(%(expressions)s, 'YYYY-MM-DD')",
                        output_field=CharField(),
                    ),
                ),
                When(
                    property__property_type=PropertyTypeEnum.DECIMAL,
                    then=Cast(F("value_decimal"), output_field=CharField()),
                ),
                When(
                    property__property_type=PropertyTypeEnum.BOOLEAN,
                    then=Cast(F("value_boolean"), output_field=CharField()),
                ),
                When(
                    property__property_type=PropertyTypeEnum.RELATION,
                    then=Cast(F("value_uuid"), output_field=CharField()),
                ),
                When(
                    property__property_type=PropertyTypeEnum.OPTION,
                    then=Cast(F("value_option"), output_field=CharField()),
                ),
                default=Value(""),
                output_field=CharField(),
            ),
            filter=Q(property_id=F("property_id")),
            distinct=True,
        )
    )


def _annotate_property_values(queryset) -> dict:
    """Return {str(property_id): [str_values]} from an IssuePropertyValue queryset."""
    rows = _annotate_property_values_qs(queryset).values("property_id", "values")
    return {str(row["property_id"]): [v for v in row["values"] if v] for row in rows}


class IssuePropertyValueAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, and `update`
    actions related to issue property values.

    """

    use_read_replica = True

    model = IssuePropertyValue
    serializer_class = IssuePropertyValueAPISerializer
    permission_classes = [ProjectEntityPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_WORK_ITEM_PROPERTY_VALUES_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [PROJECTS_WORK_ITEM_PROPERTY_VALUES_WRITE_SCOPE]],
    }
    webhook_event = "issue_property_value"

    def query_annotator(self, query):
        return _annotate_property_values_qs(query)

    # list issue property options and get issue property option by id
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_value_docs(
        operation_id="list_issue_property_values",
        summary="List issue property values",
        description="List issue property values",
        responses={
            200: OpenApiResponse(
                description="Issue property values",
                response=IssuePropertyValueAPIDetailSerializer(many=True),
            ),
        },
    )
    def get(self, request, slug, project_id, issue_id, property_id):
        # list of issue properties values
        issue_property_values = self.model.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            property_id=property_id,
            property__issue_type_properties__issue_type__is_epic=False,
        )
        issue_property_values = self.query_annotator(issue_property_values).values("property_id", "values")
        return Response(issue_property_values, status=status.HTTP_200_OK)

    # create issue property option
    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_value_docs(
        operation_id="create_issue_property_value",
        summary="Create/update an issue property value",
        description="Create/update an issue property value",
        request=OpenApiRequest(
            request=IssuePropertyValueAPISerializer,
            examples=[
                OpenApiExample(
                    "IssuePropertyValueAPISerializer",
                    value={
                        "values": [
                            {
                                "value": "1234567890",
                                "external_id": "1234567890",
                                "external_source": "github",
                            }
                        ]
                    },
                    description="Example request for creating an issue property value",
                ),
            ],
        ),
        responses={
            201: OpenApiResponse(
                description="Issue property value created",
                response=IssuePropertyValueAPISerializer,
            ),
            400: OpenApiResponse(
                description="Value is required",
            ),
            404: OpenApiResponse(description="Issue property not found"),
        },
    )
    def post(self, request, slug, project_id, issue_id, property_id):
        workspace = Workspace.objects.get(slug=slug)
        issue_property = IssueProperty.objects.get(pk=property_id, workspace=workspace, project_id=project_id)

        # existing issue property values
        existing_issue_property_values = self.model.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            property_id=property_id,
            property__issue_type_properties__issue_type__is_epic=False,
        )

        issue_property_values = request.data.get("values", [])

        if not issue_property_values:
            return Response({"error": "Value is required"}, status=status.HTTP_400_BAD_REQUEST)

        # validate the property value
        bulk_external_issue_property_values = []
        for value in issue_property_values:
            # check if ant external id and external source is provided
            property_value = value.get("value", None)

            if property_value:
                externalIssuePropertyValueValidator(issue_property=issue_property, value=property_value)

                # check if issue property with the same external id and external source already exists
                property_external_id = value.get("external_id", None)
                property_external_source = value.get("external_source", None)

                # Save the values
                bulk_external_issue_property_values.append(
                    externalIssuePropertyValueSaver(
                        workspace_id=workspace.id,
                        project_id=project_id,
                        issue_id=issue_id,
                        issue_property=issue_property,
                        value=property_value,
                        external_id=property_external_id,
                        external_source=property_external_source,
                    )
                )

        # Capture existing values before deletion for activity tracking
        existing_values_qs = self.query_annotator(existing_issue_property_values).values("property_id", "values")
        existing_values_map = {str(pv["property_id"]): [v for v in pv["values"] if v] for pv in existing_values_qs}

        #  remove the existing issue property values
        existing_issue_property_values.delete()

        # Bulk create the issue property values
        self.model.objects.bulk_create(bulk_external_issue_property_values, batch_size=10)

        # Dispatch activity task to log the property change
        new_values = [v.get("value") for v in request.data.get("values", []) if v.get("value")]
        issue_property_activity.delay(
            existing_values=existing_values_map,
            requested_values={str(property_id): new_values},
            issue_id=issue_id,
            user_id=str(request.user.id),
            epoch=int(timezone.now().timestamp()),
        )

        # fetching the created issue property values
        issue_property_values = self.model.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            property=issue_property,
            property__issue_type_properties__issue_type__is_epic=False,
        )
        issue_property_values = self.query_annotator(issue_property_values).values("property_id", "values")

        return Response(issue_property_values, status=status.HTTP_201_CREATED)


class IssuePropertyValueListAPIEndpoint(IssuePropertyValueAPIEndpoint):
    """
    This viewset automatically provides `list`
    actions related to issue property values for an workitem.
    """

    model = IssuePropertyValue
    serializer_class = IssuePropertyValueAPISerializer
    permission_classes = [ProjectEntityPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_WORK_ITEM_PROPERTY_VALUES_READ_SCOPE]],
    }

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_value_docs(
        operation_id="list_issue_property_values_for_a_workitem",
        summary="List issue property values for a workitem",
        description="List issue property values for a workitem",
        responses={
            200: OpenApiResponse(
                description="Issue property values for a workitem",
                response=IssuePropertyValueAPISerializer,
            ),
        },
    )
    def get(self, request, slug, project_id, issue_id):
        # get the issue
        issue = Issue.objects.get(workspace__slug=slug, project_id=project_id, id=issue_id)

        # list of issue properties values
        issue_property_values = self.model.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            property__issue_type_properties__issue_type__is_epic=False,
            property__issue_type_id=issue.type_id,
        )
        issue_property_values = self.query_annotator(issue_property_values).values("property_id", "values")
        return Response(issue_property_values, status=status.HTTP_200_OK)


class WorkItemPropertyValueAPIEndpoint(BaseAPIView):
    """
    API endpoint for managing a work item's property value(s).

    For single-value properties:
    - Each work item can have only ONE value per property

    For multi-value properties (is_multi=True):
    - Each work item can have MULTIPLE values per property

    Supports:
    - GET: Retrieve the property value(s)
    - POST: Create or update the property value(s) (upsert/sync)
    - PATCH: Update the property value(s) (partial update/sync)
    - DELETE: Remove the property value(s)
    """

    use_read_replica = True

    model = IssuePropertyValue
    permission_classes = [ProjectEntityPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_WORK_ITEM_PROPERTY_VALUES_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [PROJECTS_WORK_ITEM_PROPERTY_VALUES_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [PROJECTS_WORK_ITEM_PROPERTY_VALUES_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [PROJECTS_WORK_ITEM_PROPERTY_VALUES_WRITE_SCOPE]],
    }
    webhook_event = "issue_property_value"

    def get_serializer_class(self):
        """Return appropriate serializer based on request method."""
        if self.request.method in ["POST", "PATCH"]:
            return WorkItemPropertyValueRequestSerializer
        return WorkItemPropertyValueResponseSerializer

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_value_docs(
        operation_id="get_work_item_property_value",
        summary="Get work item property value",
        description=(
            "Retrieve the property value(s) for a specific work item property. "
            "Returns a single value for non-multi properties, or a list for multi-value properties."
        ),
        responses={
            200: OpenApiResponse(
                description="Work item property value(s)",
                response=WorkItemPropertyValueResponseSerializer,
            ),
            404: OpenApiResponse(description="Property value not set for this work item"),
        },
    )
    def get(self, request, slug, project_id, work_item_id, property_id):
        """
        Get the property value(s) for a work item's property.
        Returns a single value or a list of values depending on is_multi.
        """
        # Fetch all values for this work item/property combination
        property_values = self.model.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=work_item_id,
            property_id=property_id,
            property__issue_type_properties__issue_type__is_epic=False,
        )

        if not property_values.exists():
            return Response(
                {"error": "Property value not set for this work item"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if this is a multi-value property
        first_value = property_values.first()
        if first_value.property.is_multi:
            # Return list for multi-value properties
            serializer = WorkItemPropertyValueResponseSerializer(property_values, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            # Return single value for non-multi properties
            serializer = WorkItemPropertyValueResponseSerializer(first_value)
            return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_value_docs(
        operation_id="create_or_update_work_item_property_value",
        summary="Create or update work item property value",
        description=(
            "Create or update the property value for a work item. Acts as an upsert "
            "operation since only one value is allowed per work item/property combination."
        ),
        request=OpenApiRequest(
            request=WorkItemPropertyValueRequestSerializer,
            examples=[
                OpenApiExample(
                    "Text Property Value",
                    value={
                        "value": "example text value",
                        "external_id": "ext_123",
                        "external_source": "github",
                    },
                    description="Example for text, URL, email, or file property types (string value)",
                ),
                OpenApiExample(
                    "Number Property Value",
                    value={
                        "value": 123.45,
                    },
                    description="Example for decimal property type (numeric value)",
                ),
                OpenApiExample(
                    "Boolean Property Value",
                    value={
                        "value": True,
                    },
                    description="Example for boolean property type (boolean value)",
                ),
                OpenApiExample(
                    "Date Property Value",
                    value={
                        "value": "2024-12-31",
                    },
                    description="Example for datetime property type (string in YYYY-MM-DD format)",
                ),
                OpenApiExample(
                    "Option/Relation Property Value (Single)",
                    value={
                        "value": "550e8400-e29b-41d4-a716-446655440000",
                    },
                    description="Example for single-value option or relation property types (UUID string)",
                ),
                OpenApiExample(
                    "Option/Relation Property Value (Multi)",
                    value={
                        "value": [
                            "550e8400-e29b-41d4-a716-446655440000",
                            "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
                            "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
                        ],
                    },
                    description=(
                        "Example for multi-value option or relation property types "
                        "(list of UUID strings). Only valid when property has is_multi=True."
                    ),
                ),
            ],
        ),
        responses={
            200: OpenApiResponse(
                description="Work item property value updated",
                response=WorkItemPropertyValueResponseSerializer,
            ),
            201: OpenApiResponse(
                description="Work item property value created",
                response=WorkItemPropertyValueResponseSerializer,
            ),
            400: OpenApiResponse(description="Invalid value"),
            404: OpenApiResponse(description="Workspace or property not found"),
        },
    )
    def post(self, request, slug, project_id, work_item_id, property_id):
        """
        Create or update the property value for a work item.
        For single-value properties, this acts as an upsert operation.
        For multi-value properties, this replaces all existing values with the new ones.
        """
        # Get workspace and property
        try:
            workspace = Workspace.objects.get(slug=slug)
            issue_property = IssueProperty.objects.get(
                pk=property_id,
                workspace__slug=slug,
                issue_type_properties__issue_type__is_epic=False,
            )
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except IssueProperty.DoesNotExist:
            return Response(
                {"error": "Property not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Capture existing values before any writes for activity tracking
        existing_qs = self.model.objects.filter(
            workspace_id=workspace.id,
            project_id=project_id,
            issue_id=work_item_id,
            property_id=property_id,
        )
        existing_values_map = _annotate_property_values(existing_qs)

        # Build requested values from request data
        raw_value = request.data.get("value")
        new_values = raw_value if isinstance(raw_value, list) else ([str(raw_value)] if raw_value is not None else [])
        requested_values_map = {str(property_id): [str(v) for v in new_values if v]}

        # Check if value already exists for this work item/property
        existing_value = existing_qs.first()

        if existing_value:
            # Update existing value(s)
            serializer = WorkItemPropertyValueRequestSerializer(
                instance=existing_value,
                data=request.data,
                partial=True,
                context={"property": issue_property},
            )
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            result = serializer.save()

            issue_property_activity.delay(
                existing_values=existing_values_map,
                requested_values=requested_values_map,
                issue_id=work_item_id,
                user_id=str(request.user.id),
                epoch=int(timezone.now().timestamp()),
            )

            # Handle multi-value properties (returns list)
            if isinstance(result, list):
                # Fetch fresh instances from DB
                property_value_objs = self.model.objects.filter(id__in=[obj.id for obj in result])
                response_serializer = WorkItemPropertyValueResponseSerializer(property_value_objs, many=True)
                return Response(response_serializer.data, status=status.HTTP_200_OK)
            else:
                # Single value property
                property_value_obj = self.model.objects.get(id=result.id)
                response_serializer = WorkItemPropertyValueResponseSerializer(property_value_obj)
                return Response(response_serializer.data, status=status.HTTP_200_OK)
        else:
            # Create new value(s)
            serializer = WorkItemPropertyValueRequestSerializer(
                data=request.data,
                context={
                    "property": issue_property,
                    "workspace_id": workspace.id,
                    "project_id": project_id,
                    "issue_id": work_item_id,
                },
            )
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            result = serializer.save()

            issue_property_activity.delay(
                existing_values=existing_values_map,
                requested_values=requested_values_map,
                issue_id=work_item_id,
                user_id=str(request.user.id),
                epoch=int(timezone.now().timestamp()),
            )

            # Handle multi-value properties (returns list)
            if isinstance(result, list):
                # Fetch fresh instances from DB
                property_value_objs = self.model.objects.filter(id__in=[obj.id for obj in result])
                response_serializer = WorkItemPropertyValueResponseSerializer(property_value_objs, many=True)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            else:
                # Single value property
                property_value_obj = self.model.objects.get(id=result.id)
                response_serializer = WorkItemPropertyValueResponseSerializer(property_value_obj)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_value_docs(
        operation_id="update_work_item_property_value",
        summary="Update work item property value",
        description="Update an existing property value for a work item (partial update)",
        request=OpenApiRequest(
            request=WorkItemPropertyValueRequestSerializer,
            examples=[
                OpenApiExample(
                    "Update Text Property Value",
                    value={
                        "value": "updated text value",
                    },
                    description="Example for updating text property type (string value)",
                ),
                OpenApiExample(
                    "Update Number Property Value",
                    value={
                        "value": 456.78,
                    },
                    description="Example for updating decimal property type (numeric value)",
                ),
                OpenApiExample(
                    "Update Boolean Property Value",
                    value={
                        "value": False,
                    },
                    description="Example for updating boolean property type (boolean value)",
                ),
                OpenApiExample(
                    "Update Multi-Value Option/Relation Property",
                    value={
                        "value": [
                            "550e8400-e29b-41d4-a716-446655440000",
                            "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
                        ],
                    },
                    description=(
                        "Example for updating multi-value option or relation property types "
                        "(list of UUID strings). Only valid when property has is_multi=True."
                    ),
                ),
            ],
        ),
        responses={
            200: OpenApiResponse(
                description="Work item property value updated",
                response=WorkItemPropertyValueResponseSerializer,
            ),
            400: OpenApiResponse(description="Invalid value"),
            404: OpenApiResponse(description="Workspace, property, or property value not found"),
        },
    )
    def patch(self, request, slug, project_id, work_item_id, property_id):
        """
        Update an existing property value (partial update).
        For multi-value properties, this replaces all existing values with the new ones.
        """
        try:
            # Get property
            issue_property = IssueProperty.objects.get(
                pk=property_id,
                workspace__slug=slug,
                issue_type_properties__issue_type__is_epic=False,
            )

            # Get the existing property value(s)
            property_values = self.model.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=work_item_id,
                property_id=property_id,
                property__issue_type_properties__issue_type__is_epic=False,
            )

            if not property_values.exists():
                return Response(
                    {"error": "Property value not set for this work item"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Capture existing values before save for activity tracking
            existing_values_map = _annotate_property_values(property_values)

            # Build requested values from request data
            raw_value = request.data.get("value")
            if isinstance(raw_value, list):
                new_values = [str(v) for v in raw_value if v]
            else:
                new_values = [str(raw_value)] if raw_value is not None else []
            requested_values_map = {str(property_id): new_values}

            # Get first value to pass as instance (for serializer validation)
            first_value = property_values.first()

            # Validate and update using serializer
            serializer = WorkItemPropertyValueRequestSerializer(
                instance=first_value,
                data=request.data,
                partial=True,
                context={"property": issue_property},
            )
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # Update the property value(s)
            result = serializer.save()

            issue_property_activity.delay(
                existing_values=existing_values_map,
                requested_values=requested_values_map,
                issue_id=work_item_id,
                user_id=str(request.user.id),
                epoch=int(timezone.now().timestamp()),
            )

            # Handle multi-value properties (returns list)
            if isinstance(result, list):
                # Fetch fresh instances from DB
                property_value_objs = self.model.objects.filter(id__in=[obj.id for obj in result])
                response_serializer = WorkItemPropertyValueResponseSerializer(property_value_objs, many=True)
                return Response(response_serializer.data, status=status.HTTP_200_OK)
            else:
                # Single value property
                updated_property_value = self.model.objects.get(id=result.id)
                response_serializer = WorkItemPropertyValueResponseSerializer(updated_property_value)
                return Response(response_serializer.data, status=status.HTTP_200_OK)

        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except IssueProperty.DoesNotExist:
            return Response(
                {"error": "Property not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @check_feature_flag(FeatureFlag.ISSUE_TYPES)
    @issue_property_value_docs(
        operation_id="delete_work_item_property_value",
        summary="Delete work item property value",
        description=("Delete the property value(s) for a work item. For multi-value properties, deletes all values."),
        responses={
            204: OpenApiResponse(description="Property value(s) deleted successfully"),
            404: OpenApiResponse(description="Property value not found"),
        },
    )
    def delete(self, request, slug, project_id, work_item_id, property_id):
        """
        Delete the property value(s) for a work item.
        For multi-value properties, deletes all values.
        """
        # Fetch all values for this work item/property combination
        property_values = self.model.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=work_item_id,
            property_id=property_id,
            property__issue_type_properties__issue_type__is_epic=False,
        )

        if not property_values.exists():
            return Response(
                {"error": "Property value not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Delete all values (handles both single and multi-value properties)
        deleted_count = property_values.count()
        property_values.delete()

        return Response(
            {
                "message": "Property value(s) deleted successfully",
                "deleted_count": deleted_count,
            },
            status=status.HTTP_204_NO_CONTENT,
        )
