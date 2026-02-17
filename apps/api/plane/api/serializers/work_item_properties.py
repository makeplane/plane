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

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import Issue, IssueAssignee, IssueLabel
from plane.ee.models import PropertyTypeEnum, RelationTypeEnum


class CustomPropertySerializer(serializers.Serializer):
    """
    Serializes a custom property with metadata and value.
    Used for representing custom property fields in the consolidated response.
    """

    id = serializers.UUIDField(help_text="The property ID")
    type = serializers.CharField(help_text="The property type (TEXT, OPTION, RELATION, etc.)")
    name = serializers.CharField(help_text="The property name (slug)")
    display_name = serializers.CharField(help_text="The property display name")
    is_required = serializers.BooleanField(help_text="Whether the property is required")
    is_multi = serializers.BooleanField(help_text="Whether the property accepts multiple values")
    value = serializers.JSONField(allow_null=True, help_text="The property value (format depends on property type)")
    value_detail = serializers.JSONField(
        allow_null=True, help_text="Expanded value details for OPTION and RELATION types"
    )


class WorkItemWithPropertiesSerializer(serializers.ModelSerializer):
    """
    Standalone serializer for work items with custom properties.

    Explicitly defines all fields with proper naming conventions:
    - FK fields use _id suffix (state_id, workspace_id, project_id, etc.)
    - Custom properties are added with 'custom_field_' prefix

    Custom property fields contain:
    - id: The property definition ID
    - type: Property type (TEXT, OPTION, RELATION, etc.)
    - name: Property name (slug)
    - display_name: Human-readable property name
    - is_required: Whether the property is required
    - is_multi: Whether multiple values are allowed
    - value: The actual value(s)
    - value_detail: Expanded details for OPTION/RELATION types
    """

    # Explicit ID fields with proper naming
    id = serializers.UUIDField(read_only=True)
    state_id = serializers.UUIDField(read_only=True)
    workspace_id = serializers.UUIDField(read_only=True)
    project_id = serializers.UUIDField(read_only=True)
    parent_id = serializers.UUIDField(read_only=True, allow_null=True)
    type_id = serializers.UUIDField(read_only=True, allow_null=True)
    estimate_point_id = serializers.UUIDField(read_only=True, allow_null=True)
    created_by_id = serializers.UUIDField(read_only=True, allow_null=True)
    updated_by_id = serializers.UUIDField(read_only=True, allow_null=True)

    # Computed fields for assignees and labels (return list of IDs)
    assignee_ids = serializers.SerializerMethodField()
    label_ids = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = [
            # Core identifiers
            "id",
            "sequence_id",
            # Content
            "name",
            "description_html",
            "description_stripped",
            # Status and priority
            "state_id",
            "priority",
            # Relationships (as IDs)
            "workspace_id",
            "project_id",
            "parent_id",
            "type_id",
            "estimate_point_id",
            # Lists of IDs
            "assignee_ids",
            "label_ids",
            # Dates
            "start_date",
            "target_date",
            "completed_at",
            "archived_at",
            # Metadata
            "sort_order",
            "is_draft",
            "external_source",
            "external_id",
            # Audit fields
            "created_by_id",
            "updated_by_id",
            "created_at",
            "updated_at",
            "deleted_at",
        ]
        read_only_fields = fields

    def get_assignee_ids(self, obj):
        """Return list of assignee UUIDs."""
        # Use prefetched data if available
        if hasattr(obj, "_prefetched_objects_cache") and "assignees" in obj._prefetched_objects_cache:
            return [str(assignee.id) for assignee in obj.assignees.all()]
        # Otherwise query
        return list(IssueAssignee.objects.filter(issue=obj).values_list("assignee_id", flat=True))

    def get_label_ids(self, obj):
        """Return list of label UUIDs."""
        # Use prefetched data if available
        if hasattr(obj, "_prefetched_objects_cache") and "labels" in obj._prefetched_objects_cache:
            return [str(label.id) for label in obj.labels.all()]
        # Otherwise query
        return list(IssueLabel.objects.filter(issue=obj).values_list("label_id", flat=True))

    def to_representation(self, instance):
        """Override to add custom_field_<name> keys from context."""
        data = super().to_representation(instance)

        # Convert UUID fields to strings for consistency
        uuid_fields = [
            "id",
            "state_id",
            "workspace_id",
            "project_id",
            "parent_id",
            "type_id",
            "estimate_point_id",
            "created_by_id",
            "updated_by_id",
        ]
        for field in uuid_fields:
            if field in data and data[field] is not None:
                data[field] = str(data[field])

        # Add custom_field_<name> keys from context
        custom_properties = self.context.get("custom_properties", {})
        for prop_key, prop_data in custom_properties.items():
            data[prop_key] = prop_data

        return data


def build_custom_property_data(
    issue_property,
    property_values,
    users_map=None,
    issues_map=None,
):
    """
    Build the custom property data structure for a single property.

    Args:
        issue_property: The IssueProperty instance
        property_values: List of IssuePropertyValue instances for this property
        users_map: Dict mapping user IDs to user data (for USER relations)
        issues_map: Dict mapping issue IDs to issue data (for ISSUE relations)

    Returns:
        Dict with property metadata and value(s)
    """
    users_map = users_map or {}
    issues_map = issues_map or {}

    property_type = issue_property.property_type
    is_multi = issue_property.is_multi

    # Extract values based on property type
    values = []
    value_details = []

    for pv in property_values:
        value = None
        value_detail = None

        if property_type in [
            PropertyTypeEnum.TEXT,
            PropertyTypeEnum.URL,
            PropertyTypeEnum.EMAIL,
            PropertyTypeEnum.FILE,
        ]:
            value = pv.value_text

        elif property_type == PropertyTypeEnum.DATETIME:
            value = pv.value_datetime.strftime("%Y-%m-%d") if pv.value_datetime else None

        elif property_type == PropertyTypeEnum.DECIMAL:
            value = pv.value_decimal

        elif property_type == PropertyTypeEnum.BOOLEAN:
            value = pv.value_boolean

        elif property_type == PropertyTypeEnum.OPTION:
            if pv.value_option_id:
                value = str(pv.value_option_id)
                # Get option details from prefetched data
                if pv.value_option:
                    value_detail = {
                        "id": str(pv.value_option.id),
                        "name": pv.value_option.name,
                        "logo_props": pv.value_option.logo_props,
                    }

        elif property_type == PropertyTypeEnum.RELATION:
            if pv.value_uuid:
                value = str(pv.value_uuid)
                # Get relation details based on relation type
                if issue_property.relation_type == RelationTypeEnum.USER:
                    user_data = users_map.get(str(pv.value_uuid))
                    if user_data:
                        value_detail = user_data
                elif issue_property.relation_type == RelationTypeEnum.ISSUE:
                    issue_data = issues_map.get(str(pv.value_uuid))
                    if issue_data:
                        value_detail = issue_data

        if value is not None:
            values.append(value)
            value_details.append(value_detail)

    # Determine final value and value_detail based on is_multi
    if is_multi:
        final_value = values if values else []
        final_value_detail = value_details if value_details else None
    else:
        final_value = values[0] if values else None
        final_value_detail = value_details[0] if value_details else None

    return {
        "id": str(issue_property.id),
        "type": property_type,
        "name": issue_property.name,
        "display_name": issue_property.display_name,
        "is_required": issue_property.is_required,
        "is_multi": is_multi,
        "value": final_value,
        "value_detail": final_value_detail,
    }
