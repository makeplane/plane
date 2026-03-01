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
from django.db import models, transaction

# Module imports
from rest_framework import serializers
from plane.db.models import ProjectIssueType
from plane.ee.serializers import BaseSerializer
from plane.ee.models import (
    IssueProperty,
    IssuePropertyOption,
    IssuePropertyValue,
    IssuePropertyActivity,
    RelationTypeEnum,
    PropertyTypeEnum,
)


class IssuePropertyOptionAPISerializer(BaseSerializer):
    class Meta:
        model = IssuePropertyOption
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "sort_order",
            "property",
            "logo_props",
            "deleted_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]


class IssuePropertyAPISerializer(BaseSerializer):
    relation_type = serializers.ChoiceField(choices=RelationTypeEnum.choices, required=False, allow_null=True)
    options = serializers.ListField(
        child=IssuePropertyOptionAPISerializer(),
        required=False,
        write_only=True,
        help_text="List of options to create when property_type is OPTION. Each option should have 'name', optionally 'description', 'is_default', 'external_id', and 'external_source'.",  # noqa: E501
    )

    class Meta:
        model = IssueProperty
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "name",
            "logo_props",
            "sort_order",
            "issue_type",
            "deleted_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def to_representation(self, instance):
        """Override to add options field to response"""
        representation = super().to_representation(instance)
        # Add options field for OPTION type properties
        if instance.property_type == PropertyTypeEnum.OPTION:
            options = IssuePropertyOption.objects.filter(
                property=instance,
                deleted_at__isnull=True,
            ).order_by("sort_order")
            representation["options"] = IssuePropertyOptionAPISerializer(options, many=True).data
        else:
            representation["options"] = []
        return representation

    def validate_options(self, value):
        """Validate options field - ensure it's only used with OPTION property type"""
        if not value:
            return value

        # Get property_type from the initial data (since this is field-level validation)
        property_type = self.initial_data.get("property_type")

        if property_type != PropertyTypeEnum.OPTION:
            raise serializers.ValidationError("Options can only be provided when property_type is OPTION")

        # Validate that only one option is marked as default
        # Note: Individual option validation (name, etc.) is handled by IssuePropertyOptionAPISerializer
        default_count = sum(1 for option_data in value if option_data.get("is_default", False))

        if default_count > 1:
            raise serializers.ValidationError("Only one option can be marked as default")

        return value

    def validate(self, data):
        """Validate the serializer data"""

        # validate if the issue type is in the project sent in the request
        issue_type = self.context.get("issue_type")
        project = self.context.get("project")

        if issue_type and project:
            project_issue_type = ProjectIssueType.objects.filter(issue_type=issue_type, project=project).first()
            if not project_issue_type:
                raise serializers.ValidationError("Issue type is not in the project")

        return data

    @transaction.atomic
    def create(self, validated_data):
        """Override create to handle options creation"""
        options_data = validated_data.pop("options", [])
        property_type = validated_data.get("property_type")

        # Create the property
        issue_property = super().create(validated_data)

        # Create options if property_type is OPTION and options are provided
        if property_type == PropertyTypeEnum.OPTION and options_data:
            # Get workspace and project from the created property
            workspace = issue_property.workspace
            project = issue_property.project

            # Get the last sort order
            last_sort_order = IssuePropertyOption.objects.filter(
                project=project,
                property=issue_property,
            ).aggregate(largest=models.Max("sort_order"))["largest"]

            sort_order = last_sort_order + 10000 if last_sort_order is not None else 10000

            # Create options using the nested serializer's validated data
            for option_validated_data in options_data:
                # Check for external_id conflicts
                external_id = option_validated_data.get("external_id")
                external_source = option_validated_data.get("external_source")
                if external_id and external_source:
                    existing_option = IssuePropertyOption.objects.filter(
                        workspace=workspace,
                        project=project,
                        property=issue_property,
                        external_source=external_source,
                        external_id=external_id,
                        deleted_at__isnull=True,
                    ).first()
                    if existing_option:
                        raise serializers.ValidationError(
                            {
                                "options": f"Option with external_id '{external_id}' and external_source '{external_source}' already exists"  # noqa: E501
                            }
                        )

                # Create the option using validated data from nested serializer
                IssuePropertyOption.objects.create(
                    workspace=workspace,
                    project=project,
                    property=issue_property,
                    name=option_validated_data.get("name"),
                    description=option_validated_data.get("description", ""),
                    is_default=option_validated_data.get("is_default", False),
                    external_id=external_id,
                    external_source=external_source,
                    sort_order=sort_order,
                )
                sort_order += 10000

        return issue_property


class IssuePropertyValueAPISerializer(BaseSerializer):
    class Meta:
        model = IssuePropertyValue
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "name",
            "logo_props",
            "sort_order",
            "settings",
            "issue_type",
            "deleted_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]


class IssuePropertyValueAPIDetailSerializer(serializers.Serializer):
    """
    Serializer for aggregated issue property values response.
    This serializer handles the response format from the query_annotator method
    which returns property_id and values (ArrayAgg of property values).
    """

    property_id = serializers.UUIDField(help_text="The ID of the issue property")
    values = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of aggregated property values for the given property",
    )


class IssuePropertyActivityAPISerializer(BaseSerializer):
    class Meta:
        model = IssuePropertyActivity
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "deleted_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]


# ====== Work Item Property Value Serializers ======
# Clean, focused serializers for the new WorkItemPropertyValueAPIEndpoint


class WorkItemPropertyValueRequestSerializer(serializers.Serializer):
    """
    Serializer for creating or updating a single work item property value.
    Accepts a clean, simple structure with just the essential fields.
    Handles validation against property type rules.
    """

    value = serializers.JSONField(
        required=True,
        help_text=(
            "The value to set for the property. Type depends on property type: "
            "string for text/url/email/file fields, string (UUID) or list of UUIDs for "
            "relations/options (list only when is_multi=True), "
            "string (YYYY-MM-DD) for dates, number for decimals, boolean for booleans"
        ),
    )
    external_id = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        max_length=255,
        help_text=("Optional external identifier for syncing with external systems"),
    )
    external_source = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        max_length=255,
        help_text=("Optional external source identifier (e.g., 'github', 'jira')"),
    )

    def validate_value(self, value):
        """
        Field-level validation for the value field.
        Validates based on property type from context.
        """
        import uuid
        from datetime import datetime
        from django.core.validators import URLValidator, validate_email
        from django.core.exceptions import ValidationError as DjangoValidationError
        from plane.ee.models import (
            PropertyTypeEnum,
            IssuePropertyOption,
            RelationTypeEnum,
        )
        from plane.db.models import Issue, WorkspaceMember

        # Get property from context
        property_obj = self.context.get("property")
        if not property_obj:
            # No property context means we can't validate
            return value

        # Check if required
        if property_obj.is_required and not value:
            raise serializers.ValidationError(f"{property_obj.display_name} is required")

        # If value is empty and not required, no further validation needed
        if not value and value != 0 and value is not False:
            return value

        property_type = property_obj.property_type

        # TEXT - accepts any string
        if property_type == PropertyTypeEnum.TEXT:
            if not isinstance(value, str):
                raise serializers.ValidationError("Must be a string")

        # URL - must be valid URL format
        elif property_type == PropertyTypeEnum.URL:
            if not isinstance(value, str):
                raise serializers.ValidationError("Must be a string")
            url_validator = URLValidator()
            try:
                url_validator(value)
            except DjangoValidationError:
                raise serializers.ValidationError("Must be a valid URL (e.g., https://example.com)")

        # EMAIL - must be valid email format
        elif property_type == PropertyTypeEnum.EMAIL:
            if not isinstance(value, str):
                raise serializers.ValidationError("Must be a string")
            try:
                validate_email(value)
            except DjangoValidationError:
                raise serializers.ValidationError("Must be a valid email address (e.g., user@example.com)")

        # DATETIME - accepts YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
        elif property_type == PropertyTypeEnum.DATETIME:
            if not isinstance(value, str):
                raise serializers.ValidationError("Must be a string")
            valid_formats = ["%Y-%m-%d", "%Y-%m-%d %H:%M:%S"]
            parsed = False
            for fmt in valid_formats:
                try:
                    datetime.strptime(value, fmt)
                    parsed = True
                    break
                except ValueError:
                    continue

            if not parsed:
                raise serializers.ValidationError("Must be a valid date in format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS")

        # DECIMAL - must be a number
        elif property_type == PropertyTypeEnum.DECIMAL:
            if not isinstance(value, (int, float)):
                raise serializers.ValidationError("Must be a number (e.g., 123.45)")

        # BOOLEAN - must be a boolean
        elif property_type == PropertyTypeEnum.BOOLEAN:
            if not isinstance(value, bool):
                raise serializers.ValidationError("Must be a boolean (true or false)")

        # FILE - accepts any string (file path/URL)
        elif property_type == PropertyTypeEnum.FILE:
            if not isinstance(value, str):
                raise serializers.ValidationError("Must be a string")

        # OPTION - must be a valid UUID or list of UUIDs (if is_multi)
        elif property_type == PropertyTypeEnum.OPTION:
            # Handle multi-value properties
            if property_obj.is_multi:
                if isinstance(value, list):
                    if not value:
                        raise serializers.ValidationError("List cannot be empty for multi-value property")
                    # Validate each UUID in the list
                    uuid_list = []
                    for v in value:
                        if not isinstance(v, str):
                            raise serializers.ValidationError("Each value in list must be a string (UUID)")
                        try:
                            uuid_obj = uuid.UUID(str(v), version=4)
                            uuid_list.append(uuid_obj)
                        except (ValueError, AttributeError):
                            raise serializers.ValidationError(f"Invalid UUID format: {v}")

                    # Check if all options exist for this property
                    existing_count = IssuePropertyOption.objects.filter(property=property_obj, id__in=uuid_list).count()
                    if existing_count != len(uuid_list):
                        raise serializers.ValidationError("One or more selected options do not exist for this property")
                elif isinstance(value, str):
                    # Single value also acceptable for multi-value property
                    try:
                        uuid_obj = uuid.UUID(str(value), version=4)
                    except (ValueError, AttributeError):
                        raise serializers.ValidationError("Must be a valid UUID for a property option")

                    if not IssuePropertyOption.objects.filter(property=property_obj, id=uuid_obj).exists():
                        raise serializers.ValidationError("Selected option does not exist for this property")
                else:
                    raise serializers.ValidationError("Must be a string (UUID) or list of UUIDs")
            else:
                # Single value only
                if not isinstance(value, str):
                    raise serializers.ValidationError("Must be a string (UUID)")
                try:
                    uuid_obj = uuid.UUID(str(value), version=4)
                except (ValueError, AttributeError):
                    raise serializers.ValidationError("Must be a valid UUID for a property option")

                if not IssuePropertyOption.objects.filter(property=property_obj, id=uuid_obj).exists():
                    raise serializers.ValidationError("Selected option does not exist for this property")

        # RELATION - must be a valid UUID or list of UUIDs (if is_multi)
        elif property_type == PropertyTypeEnum.RELATION:
            # Validate based on relation type
            if not property_obj.relation_type:
                raise serializers.ValidationError("Property relation type is not configured")

            # Handle multi-value properties
            if property_obj.is_multi:
                if isinstance(value, list):
                    if not value:
                        raise serializers.ValidationError("List cannot be empty for multi-value property")
                    # Validate each UUID in the list
                    uuid_list = []
                    for v in value:
                        if not isinstance(v, str):
                            raise serializers.ValidationError("Each value in list must be a string (UUID)")
                        try:
                            uuid_obj = uuid.UUID(str(v), version=4)
                            uuid_list.append(uuid_obj)
                        except (ValueError, AttributeError):
                            raise serializers.ValidationError(f"Invalid UUID format: {v}")

                    # Check if all relations exist
                    if property_obj.relation_type == RelationTypeEnum.ISSUE:
                        existing_count = Issue.objects.filter(
                            workspace_id=property_obj.workspace_id, id__in=uuid_list
                        ).count()
                        if existing_count != len(uuid_list):
                            raise serializers.ValidationError(
                                "One or more referenced work items do not exist in this workspace"
                            )
                    elif property_obj.relation_type == RelationTypeEnum.USER:
                        existing_count = WorkspaceMember.objects.filter(
                            workspace_id=property_obj.workspace_id,
                            member_id__in=uuid_list,
                        ).count()
                        if existing_count != len(uuid_list):
                            raise serializers.ValidationError(
                                "One or more referenced users are not members of this workspace"
                            )
                    else:
                        raise serializers.ValidationError(f"Invalid relation type: {property_obj.relation_type}")
                elif isinstance(value, str):
                    # Single value also acceptable for multi-value property
                    try:
                        uuid_obj = uuid.UUID(str(value), version=4)
                    except (ValueError, AttributeError):
                        raise serializers.ValidationError("Must be a valid UUID")

                    if property_obj.relation_type == RelationTypeEnum.ISSUE:
                        if not Issue.objects.filter(workspace_id=property_obj.workspace_id, id=uuid_obj).exists():
                            raise serializers.ValidationError("Referenced work item does not exist in this workspace")
                    elif property_obj.relation_type == RelationTypeEnum.USER:
                        if not WorkspaceMember.objects.filter(
                            workspace_id=property_obj.workspace_id, member_id=uuid_obj
                        ).exists():
                            raise serializers.ValidationError("Referenced user is not a member of this workspace")
                    else:
                        raise serializers.ValidationError(f"Invalid relation type: {property_obj.relation_type}")
                else:
                    raise serializers.ValidationError("Must be a string (UUID) or list of UUIDs")
            else:
                # Single value only
                if not isinstance(value, str):
                    raise serializers.ValidationError("Must be a string (UUID)")
                try:
                    uuid_obj = uuid.UUID(str(value), version=4)
                except (ValueError, AttributeError):
                    raise serializers.ValidationError("Must be a valid UUID")

                if property_obj.relation_type == RelationTypeEnum.ISSUE:
                    if not Issue.objects.filter(workspace_id=property_obj.workspace_id, id=uuid_obj).exists():
                        raise serializers.ValidationError("Referenced work item does not exist in this workspace")
                elif property_obj.relation_type == RelationTypeEnum.USER:
                    if not WorkspaceMember.objects.filter(
                        workspace_id=property_obj.workspace_id, member_id=uuid_obj
                    ).exists():
                        raise serializers.ValidationError("Referenced user is not a member of this workspace")
                else:
                    raise serializers.ValidationError(f"Invalid relation type: {property_obj.relation_type}")

        # Unknown property type
        else:
            raise serializers.ValidationError(f"Unsupported property type: {property_type}")

        return value

    def validate(self, attrs):
        """
        Object-level validation.
        Validates external field pairing.
        """
        external_id = attrs.get("external_id")
        external_source = attrs.get("external_source")

        # Validate external field pairing
        if bool(external_id) != bool(external_source):
            raise serializers.ValidationError(
                {
                    "external_id": "Both external_id and external_source must be provided together",
                    "external_source": "Both external_id and external_source must be provided together",
                }
            )

        return attrs

    def create(self, validated_data):
        """
        Create property value instance(s).
        Expects workspace_id, project_id, issue_id, and property in context.
        Returns a single instance for non-multi properties, or a list for multi-value properties.
        """
        from plane.ee.models import PropertyTypeEnum

        workspace_id = self.context.get("workspace_id")
        project_id = self.context.get("project_id")
        issue_id = self.context.get("issue_id")
        property_obj = self.context.get("property")

        if not all([workspace_id, project_id, issue_id, property_obj]):
            raise serializers.ValidationError("Missing required context for creating property value")

        value = validated_data["value"]
        property_type = property_obj.property_type

        # Base parameters for all property values
        base_params = {
            "workspace_id": workspace_id,
            "project_id": project_id,
            "issue_id": issue_id,
            "property": property_obj,
            "external_id": validated_data.get("external_id"),
            "external_source": validated_data.get("external_source"),
        }

        # Handle multi-value OPTION and RELATION properties
        if property_type in [PropertyTypeEnum.OPTION, PropertyTypeEnum.RELATION] and property_obj.is_multi:
            # Normalize to list
            values = value if isinstance(value, list) else [value]

            # Create multiple property value records
            property_value_objs = []
            for v in values:
                params = base_params.copy()
                if property_type == PropertyTypeEnum.OPTION:
                    params["value_option_id"] = v
                elif property_type == PropertyTypeEnum.RELATION:
                    params["value_uuid"] = v

                property_value_obj = IssuePropertyValue(**params)
                property_value_obj.save()
                property_value_objs.append(property_value_obj)

            return property_value_objs

        # Handle single-value properties
        else:
            # Set the appropriate value field based on property type
            if property_type in [
                PropertyTypeEnum.TEXT,
                PropertyTypeEnum.URL,
                PropertyTypeEnum.EMAIL,
                PropertyTypeEnum.FILE,
            ]:
                base_params["value_text"] = value
            elif property_type == PropertyTypeEnum.DATETIME:
                base_params["value_datetime"] = value
            elif property_type == PropertyTypeEnum.DECIMAL:
                base_params["value_decimal"] = value
            elif property_type == PropertyTypeEnum.BOOLEAN:
                base_params["value_boolean"] = value
            elif property_type == PropertyTypeEnum.OPTION:
                base_params["value_option_id"] = value
            elif property_type == PropertyTypeEnum.RELATION:
                base_params["value_uuid"] = value

            # Create and save the property value
            property_value_obj = IssuePropertyValue(**base_params)
            property_value_obj.save()
            return property_value_obj

    def update(self, instance, validated_data):
        """
        Update property value instance(s).
        For multi-value properties, deletes existing values and creates new ones (sync operation).
        For single-value properties, updates the existing instance.
        Returns a single instance for non-multi properties, or a list for multi-value properties.
        """
        from plane.ee.models import PropertyTypeEnum

        new_value = validated_data.get("value")
        if new_value is None:
            raise serializers.ValidationError({"value": "Value is required"})

        property_type = instance.property.property_type
        property_obj = instance.property

        # Handle multi-value OPTION and RELATION properties
        if property_type in [PropertyTypeEnum.OPTION, PropertyTypeEnum.RELATION] and property_obj.is_multi:
            # Normalize to list
            values = new_value if isinstance(new_value, list) else [new_value]

            # Delete all existing property values for this property/issue combination
            IssuePropertyValue.objects.filter(
                workspace_id=instance.workspace_id,
                project_id=instance.project_id,
                issue_id=instance.issue_id,
                property_id=instance.property_id,
            ).delete()

            # Create new property value records
            property_value_objs = []
            base_params = {
                "workspace_id": instance.workspace_id,
                "project_id": instance.project_id,
                "issue_id": instance.issue_id,
                "property": property_obj,
                "external_id": validated_data.get("external_id", instance.external_id),
                "external_source": validated_data.get("external_source", instance.external_source),
            }

            for v in values:
                params = base_params.copy()
                if property_type == PropertyTypeEnum.OPTION:
                    params["value_option_id"] = v
                elif property_type == PropertyTypeEnum.RELATION:
                    params["value_uuid"] = v

                property_value_obj = IssuePropertyValue(**params)
                property_value_obj.save()
                property_value_objs.append(property_value_obj)

            return property_value_objs

        # Handle single-value properties
        else:
            # Update the appropriate field based on property type
            if property_type in [
                PropertyTypeEnum.TEXT,
                PropertyTypeEnum.URL,
                PropertyTypeEnum.EMAIL,
                PropertyTypeEnum.FILE,
            ]:
                instance.value_text = new_value
            elif property_type == PropertyTypeEnum.DATETIME:
                instance.value_datetime = new_value
            elif property_type == PropertyTypeEnum.DECIMAL:
                instance.value_decimal = new_value
            elif property_type == PropertyTypeEnum.BOOLEAN:
                instance.value_boolean = new_value
            elif property_type == PropertyTypeEnum.OPTION:
                instance.value_option_id = new_value
            elif property_type == PropertyTypeEnum.RELATION:
                instance.value_uuid = new_value

            instance.save()
            return instance


class WorkItemPropertyValueResponseSerializer(serializers.ModelSerializer):
    """
    Serializer for work item property value responses.
    Provides a clean, consistent response structure with typed values.
    Handles automatic value extraction based on property type.
    """

    property_id = serializers.UUIDField(read_only=True)
    issue_id = serializers.UUIDField(read_only=True)
    value = serializers.SerializerMethodField(help_text="The actual value, formatted according to property type")
    value_type = serializers.SerializerMethodField(help_text="Type of the value")

    class Meta:
        model = IssuePropertyValue
        fields = [
            "id",
            "property_id",
            "issue_id",
            "value",
            "value_type",
            "external_id",
            "external_source",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "property_id",
            "issue_id",
            "value",
            "value_type",
            "external_id",
            "external_source",
            "created_at",
            "updated_at",
        ]

    def get_value(self, obj):
        """Extract the actual value based on property type."""
        from plane.ee.models import PropertyTypeEnum

        property_type = obj.property.property_type

        # Map to the correct field based on property type
        if property_type in [
            PropertyTypeEnum.TEXT,
            PropertyTypeEnum.URL,
            PropertyTypeEnum.EMAIL,
            PropertyTypeEnum.FILE,
        ]:
            return obj.value_text
        elif property_type == PropertyTypeEnum.DATETIME:
            return obj.value_datetime.strftime("%Y-%m-%d") if obj.value_datetime else None
        elif property_type == PropertyTypeEnum.DECIMAL:
            return obj.value_decimal
        elif property_type == PropertyTypeEnum.BOOLEAN:
            return obj.value_boolean
        elif property_type == PropertyTypeEnum.OPTION:
            return str(obj.value_option_id) if obj.value_option_id else None
        elif property_type == PropertyTypeEnum.RELATION:
            return str(obj.value_uuid) if obj.value_uuid else None
        else:
            return None

    def get_value_type(self, obj):
        """Get the type of the value."""
        return obj.property.property_type
