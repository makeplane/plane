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

# Python imports
import uuid as uuid_module

# Django imports
from django.db import transaction
from django.db.models import Prefetch

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# drf-spectacular imports
from drf_spectacular.utils import extend_schema, OpenApiExample

# Module imports
from plane.api.views.base import BaseAPIView
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Issue, Workspace, User
from plane.ee.models import (
    IssueProperty,
    IssuePropertyValue,
    IssuePropertyOption,
    PropertyTypeEnum,
    RelationTypeEnum,
)
from plane.api.serializers.work_item_properties import (
    WorkItemWithPropertiesSerializer,
    build_custom_property_data,
)
from plane.api.serializers.issue import IssueSerializer
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.openapi import (
    WORKSPACE_SLUG_PARAMETER,
    PROJECT_ID_PARAMETER,
    ISSUE_ID_PARAMETER,
    WORK_ITEM_NOT_FOUND_RESPONSE,
    VALIDATION_ERROR_RESPONSE,
)


class WorkItemPropertiesAPIEndpoint(BaseAPIView):
    """
    API endpoint for retrieving and updating a work item with all default fields
    AND custom properties in a single response.

    GET: Returns work item with all default fields + custom properties
    PATCH: Updates work item and/or custom properties
    """

    model = Issue
    permission_classes = [ProjectEntityPermission]
    webhook_event = "issue"

    def get_issue_with_relations(self, slug, project_id, pk):
        """Fetch issue with optimized query for related data."""
        return (
            Issue.issue_objects.select_related("project", "workspace", "state", "parent", "type")
            .prefetch_related("assignees", "labels")
            .get(workspace__slug=slug, project_id=project_id, pk=pk)
        )

    def get_property_definitions(self, slug, project_id, issue_type_id):
        """Fetch property definitions for the issue type."""
        if not issue_type_id:
            return []

        return list(
            IssueProperty.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_type_properties__issue_type_id=issue_type_id,
                is_active=True,
            )
            .prefetch_related(
                Prefetch(
                    "options",
                    queryset=IssuePropertyOption.objects.filter(is_active=True).order_by("sort_order"),
                )
            )
            .order_by("sort_order")
        )

    def get_property_values(self, slug, project_id, issue_id, issue_type_id):
        """Fetch property values for the issue."""
        if not issue_type_id:
            return []

        return list(
            IssuePropertyValue.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=issue_id,
                property__is_active=True,
                property__issue_type_id=issue_type_id,
            ).select_related("property", "value_option")
        )

    def get_related_users(self, property_values, properties):
        """Fetch users referenced in relation properties."""
        # Find USER relation properties
        user_relation_property_ids = {
            p.id
            for p in properties
            if p.property_type == PropertyTypeEnum.RELATION and p.relation_type == RelationTypeEnum.USER
        }

        if not user_relation_property_ids:
            return {}

        # Get user UUIDs from property values
        user_ids = {
            pv.value_uuid for pv in property_values if pv.property_id in user_relation_property_ids and pv.value_uuid
        }

        if not user_ids:
            return {}

        # Fetch users
        users = User.objects.filter(id__in=user_ids).values(
            "id", "first_name", "last_name", "email", "avatar", "display_name"
        )

        return {
            str(u["id"]): {
                "id": str(u["id"]),
                "first_name": u["first_name"],
                "last_name": u["last_name"],
                "email": u["email"],
                "avatar": u["avatar"],
                "display_name": u["display_name"],
            }
            for u in users
        }

    def get_related_issues(self, property_values, properties):
        """Fetch issues referenced in relation properties."""
        # Find ISSUE relation properties
        issue_relation_property_ids = {
            p.id
            for p in properties
            if p.property_type == PropertyTypeEnum.RELATION and p.relation_type == RelationTypeEnum.ISSUE
        }

        if not issue_relation_property_ids:
            return {}

        # Get issue UUIDs from property values
        issue_ids = {
            pv.value_uuid for pv in property_values if pv.property_id in issue_relation_property_ids and pv.value_uuid
        }

        if not issue_ids:
            return {}

        # Fetch issues (lite version)
        issues = Issue.issue_objects.filter(id__in=issue_ids).values(
            "id", "name", "sequence_id", "project__identifier", "state_id", "priority"
        )

        return {
            str(i["id"]): {
                "id": str(i["id"]),
                "name": i["name"],
                "sequence_id": i["sequence_id"],
                "project_identifier": i["project__identifier"],
                "state_id": str(i["state_id"]) if i["state_id"] else None,
                "priority": i["priority"],
            }
            for i in issues
        }

    def build_custom_properties_dict(self, properties, property_values, users_map, issues_map):
        """Build the custom_field_<name> dictionary for all properties."""
        # Group property values by property ID
        values_by_property = {}
        for pv in property_values:
            prop_id = pv.property_id
            if prop_id not in values_by_property:
                values_by_property[prop_id] = []
            values_by_property[prop_id].append(pv)

        # Build custom properties dict
        custom_properties = {}
        for prop in properties:
            prop_values = values_by_property.get(prop.id, [])
            field_key = f"custom_field_{prop.name}"
            custom_properties[field_key] = build_custom_property_data(
                prop,
                prop_values,
                users_map=users_map,
                issues_map=issues_map,
            )

        return custom_properties

    @extend_schema(
        operation_id="get_work_item_properties",
        summary="Get Work Item with Properties",
        description="""Retrieve a work item with all standard fields and custom properties.

Returns a consolidated response where:
- Standard fields use `_id` suffix (state_id, project_id, etc.)
- Custom properties are included as `custom_field_<name>` keys
- Each custom field contains: id, type, name, display_name, is_required, is_multi, value, value_detail

Custom properties are only included if the ISSUE_TYPES feature is enabled for the workspace.""",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
            ISSUE_ID_PARAMETER,
        ],
        responses={
            200: WorkItemWithPropertiesSerializer,
            404: WORK_ITEM_NOT_FOUND_RESPONSE,
        },
        tags=["Work Items"],
    )
    def get(self, request, slug, project_id, pk):
        """
        Get work item with all default fields and custom properties.
        Returns a consolidated response with custom_field_<name> keys.
        Custom properties are only included if ISSUE_TYPES feature is enabled.
        """
        try:
            # 1. Fetch issue with prefetched relations
            issue = self.get_issue_with_relations(slug, project_id, pk)

            # 2. Check if ISSUE_TYPES feature is enabled for custom properties
            custom_properties = {}
            issue_types_enabled = check_workspace_feature_flag(
                feature_key=FeatureFlag.ISSUE_TYPES,
                slug=slug,
                user_id=str(request.user.id) if not request.user.is_bot else None,
            )

            if issue_types_enabled:
                # 3. Fetch property definitions for the issue type
                properties = self.get_property_definitions(slug, project_id, issue.type_id)

                # 4. Fetch property values for the issue
                property_values = self.get_property_values(slug, project_id, pk, issue.type_id)

                # 5. Fetch related users and issues for value_detail
                users_map = self.get_related_users(property_values, properties)
                issues_map = self.get_related_issues(property_values, properties)

                # 6. Build custom properties dictionary
                custom_properties = self.build_custom_properties_dict(
                    properties,
                    property_values,
                    users_map,
                    issues_map,
                )

            # 7. Serialize with custom properties in context
            serializer = WorkItemWithPropertiesSerializer(
                issue,
                context={"custom_properties": custom_properties},
            )

            return Response(serializer.data, status=status.HTTP_200_OK)

        except Issue.DoesNotExist:
            return Response(
                {"error": "Work item not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @extend_schema(
        operation_id="update_work_item_properties",
        summary="Update Work Item with Properties",
        description="""Update a work item's standard fields and/or custom properties.

Accepts both standard issue fields and custom property fields:
- Standard fields: name, priority, state_id, assignee_ids, label_ids, etc.
- Custom fields: `custom_field_<name>` with value or {"value": ...} format

For OPTION type custom fields, you can pass either:
- The option UUID
- The option name (case-insensitive)

Custom properties can only be updated if the ISSUE_TYPES feature is enabled.""",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
            ISSUE_ID_PARAMETER,
        ],
        request=WorkItemWithPropertiesSerializer,
        responses={
            200: WorkItemWithPropertiesSerializer,
            400: VALIDATION_ERROR_RESPONSE,
            402: {"description": "Payment Required - Custom properties not available"},
            404: WORK_ITEM_NOT_FOUND_RESPONSE,
        },
        tags=["Work Items"],
        examples=[
            OpenApiExample(
                name="Update standard fields",
                value={
                    "name": "Updated work item name",
                    "priority": "high",
                },
            ),
            OpenApiExample(
                name="Update custom fields",
                value={
                    "custom_field_severity": "critical",
                    "custom_field_story_points": 5,
                },
            ),
            OpenApiExample(
                name="Mixed update",
                value={
                    "name": "Bug fix",
                    "priority": "urgent",
                    "custom_field_severity": "2340fb98-8344-4910-ad0e-d453e9f28748",
                },
            ),
        ],
    )
    @transaction.atomic
    def patch(self, request, slug, project_id, pk):
        """
        Update work item and/or custom properties.
        Accepts standard issue fields and custom_field_<name> fields.
        Custom properties can only be updated if ISSUE_TYPES feature is enabled.
        """
        try:
            # Fetch the issue
            issue = self.get_issue_with_relations(slug, project_id, pk)
            workspace = Workspace.objects.get(slug=slug)

        except Issue.DoesNotExist:
            return Response(
                {"error": "Work item not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if ISSUE_TYPES feature is enabled
        issue_types_enabled = check_workspace_feature_flag(
            feature_key=FeatureFlag.ISSUE_TYPES,
            slug=slug,
            user_id=str(request.user.id) if not request.user.is_bot else None,
        )

        # Separate standard fields from custom_field_* keys
        request_data = request.data
        standard_fields = {}
        custom_fields = {}

        for key, value in request_data.items():
            if key.startswith("custom_field_"):
                custom_fields[key] = value
            else:
                standard_fields[key] = value

        # Reject custom field updates if feature is not enabled
        if custom_fields and not issue_types_enabled:
            return Response(
                {"error": "Custom properties are not available for this workspace"},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        # 1. Update standard fields if any
        if standard_fields:
            serializer = IssueSerializer(
                issue,
                data=standard_fields,
                partial=True,
                context={
                    "project_id": project_id,
                    "workspace_id": workspace.id,
                },
            )
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            issue = serializer.save()

        # 2. Update custom fields if any (only if feature enabled)
        if custom_fields and issue_types_enabled:
            # Fetch property definitions for the issue type
            properties = self.get_property_definitions(slug, project_id, issue.type_id)
            properties_by_name = {f"custom_field_{p.name}": p for p in properties}

            # Collect all property values to create
            property_values_to_create = []
            property_ids_to_delete = []

            for field_key, field_data in custom_fields.items():
                # Look up property by name
                issue_property = properties_by_name.get(field_key)
                if not issue_property:
                    return Response(
                        {"error": f"Unknown property: {field_key}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Extract value from field_data
                # Accept either raw value or {"value": ...} format
                if isinstance(field_data, dict) and "value" in field_data:
                    value = field_data["value"]
                else:
                    value = field_data

                # Validate the value
                validation_error = self._validate_property_value(issue_property, value)
                if validation_error:
                    return Response(
                        {"error": f"{field_key}: {validation_error}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Mark for deletion
                property_ids_to_delete.append(issue_property.id)

                # Build property values to create
                if value is not None:
                    new_values = self._build_property_values(
                        issue_property,
                        value,
                        pk,
                        project_id,
                        workspace.id,
                    )
                    property_values_to_create.extend(new_values)

            # Delete existing values for all updated properties
            if property_ids_to_delete:
                IssuePropertyValue.objects.filter(
                    workspace_id=workspace.id,
                    project_id=project_id,
                    issue_id=pk,
                    property_id__in=property_ids_to_delete,
                ).delete()

            # Bulk create all property values
            if property_values_to_create:
                IssuePropertyValue.objects.bulk_create(property_values_to_create, batch_size=50)

        # 3. Re-fetch and return updated data
        issue = self.get_issue_with_relations(slug, project_id, pk)

        custom_properties = {}
        if issue_types_enabled:
            properties = self.get_property_definitions(slug, project_id, issue.type_id)
            property_values = self.get_property_values(slug, project_id, pk, issue.type_id)

            users_map = self.get_related_users(property_values, properties)
            issues_map = self.get_related_issues(property_values, properties)

            custom_properties = self.build_custom_properties_dict(
                properties,
                property_values,
                users_map,
                issues_map,
            )

        serializer = WorkItemWithPropertiesSerializer(
            issue,
            context={"custom_properties": custom_properties},
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    def _validate_property_value(self, issue_property, value):
        """
        Validate a property value. Returns error message or None if valid.
        """
        # Check required
        if issue_property.is_required and value is None:
            return f"{issue_property.display_name} is required"

        # Empty value is OK for non-required properties
        if value is None:
            return None

        # Handle multi-value properties
        if issue_property.is_multi and isinstance(value, list):
            # Batch validate options
            if issue_property.property_type == PropertyTypeEnum.OPTION:
                resolved = self._resolve_option_values_batch(issue_property, value)
                if len(resolved) != len(value):
                    invalid = [v for v in value if v not in resolved.values() and v not in resolved.keys()]
                    return f"Invalid option(s): {invalid}"
                return None

            for v in value:
                error = self._validate_single_value(issue_property, v)
                if error:
                    return error
        else:
            error = self._validate_single_value(issue_property, value)
            if error:
                return error

        return None

    def _validate_single_value(self, issue_property, value):
        """Validate a single value against the property type."""
        from django.core.exceptions import ValidationError
        from plane.ee.utils.issue_property_validators import VALIDATOR_MAPPER

        # Special handling for OPTION type - accept both UUID and name
        if issue_property.property_type == PropertyTypeEnum.OPTION:
            resolved = self._resolve_option_value(issue_property, value)
            if resolved is None:
                return f"Invalid option: '{value}' is not a valid option ID or name"
            return None

        validator = VALIDATOR_MAPPER.get(issue_property.property_type)
        if not validator:
            return f"Unsupported property type: {issue_property.property_type}"

        try:
            validator(property=issue_property, value=value)
        except ValidationError as e:
            return str(e.message if hasattr(e, "message") else e)

        return None

    def _resolve_option_value(self, issue_property, value):
        """
        Resolve an option value to its UUID.
        Accepts either a UUID string or an option name (case-insensitive).
        Returns the option UUID if found, None otherwise.
        """
        if not isinstance(value, str):
            return None

        # First, try to parse as UUID
        try:
            option_uuid = uuid_module.UUID(str(value), version=4)
            # Verify it exists in the property's options
            if issue_property.options.filter(id=option_uuid, is_active=True).exists():
                return str(option_uuid)
        except (ValueError, AttributeError):
            pass

        # Not a valid UUID, try to look up by name (case-insensitive)
        option = issue_property.options.filter(name__iexact=value, is_active=True).first()
        if option:
            return str(option.id)

        return None

    def _resolve_option_values_batch(self, issue_property, values):
        """
        Resolve multiple option values to their UUIDs.
        Returns a dict mapping input values to resolved UUIDs.
        """
        if not values:
            return {}

        # Get all active options for this property
        options = list(issue_property.options.filter(is_active=True))
        options_by_id = {str(opt.id): opt for opt in options}
        options_by_name_lower = {opt.name.lower(): opt for opt in options}

        resolved = {}
        for v in values:
            if not isinstance(v, str):
                continue

            # Try as UUID first
            try:
                option_uuid = uuid_module.UUID(str(v), version=4)
                if str(option_uuid) in options_by_id:
                    resolved[v] = str(option_uuid)
                    continue
            except (ValueError, AttributeError):
                pass

            # Try as name (case-insensitive)
            opt = options_by_name_lower.get(v.lower())
            if opt:
                resolved[v] = str(opt.id)

        return resolved

    def _build_property_values(self, issue_property, value, issue_id, project_id, workspace_id):
        """
        Build IssuePropertyValue instances for bulk creation.
        Returns a list of IssuePropertyValue objects (not saved).
        """
        property_type = issue_property.property_type

        # Handle multi-value properties
        if issue_property.is_multi and isinstance(value, list):
            values = value
        else:
            values = [value]

        # For OPTION type with multiple values, batch resolve
        resolved_options = {}
        if property_type == PropertyTypeEnum.OPTION and len(values) > 1:
            resolved_options = self._resolve_option_values_batch(issue_property, values)

        property_values = []
        for v in values:
            pv = IssuePropertyValue(
                property_id=issue_property.id,
                issue_id=issue_id,
                project_id=project_id,
                workspace_id=workspace_id,
            )

            if property_type in [
                PropertyTypeEnum.TEXT,
                PropertyTypeEnum.URL,
                PropertyTypeEnum.EMAIL,
                PropertyTypeEnum.FILE,
            ]:
                pv.value_text = v

            elif property_type == PropertyTypeEnum.DATETIME:
                pv.value_datetime = v

            elif property_type == PropertyTypeEnum.DECIMAL:
                pv.value_decimal = v

            elif property_type == PropertyTypeEnum.BOOLEAN:
                # Handle string "true"/"false" as well as actual boolean
                if isinstance(v, str):
                    pv.value_boolean = v.lower() == "true"
                else:
                    pv.value_boolean = bool(v)

            elif property_type == PropertyTypeEnum.OPTION:
                # Use batch resolved value or resolve individually
                if v in resolved_options:
                    pv.value_option_id = resolved_options[v]
                else:
                    pv.value_option_id = self._resolve_option_value(issue_property, v)

            elif property_type == PropertyTypeEnum.RELATION:
                pv.value_uuid = v

            property_values.append(pv)

        return property_values
