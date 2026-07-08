# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import (
    IssueProperty,
    IssuePropertyOption,
    IssuePropertyValue,
    PropertyTypeEnum,
    RelationTypeEnum,
)
from plane.utils.issue_property import V1_PROPERTY_TYPES


class IssuePropertyOptionSerializer(BaseSerializer):
    """Serializer for the selectable options of an OPTION property."""

    class Meta:
        model = IssuePropertyOption
        fields = [
            "id",
            "property_id",
            "project_id",
            "workspace_id",
            "name",
            "description",
            "is_active",
            "is_default",
            "sort_order",
            "logo_props",
            "external_source",
            "external_id",
        ]
        read_only_fields = ["workspace", "project", "property"]


class IssuePropertySerializer(BaseSerializer):
    """Serializer for custom property definitions with nested options."""

    options = IssuePropertyOptionSerializer(many=True, read_only=True)

    class Meta:
        model = IssueProperty
        fields = [
            "id",
            "issue_type_id",
            "project_id",
            "workspace_id",
            "display_name",
            "description",
            "property_type",
            "relation_type",
            "is_required",
            "is_multi",
            "is_active",
            "default_value",
            "settings",
            "sort_order",
            "external_source",
            "external_id",
            "options",
        ]
        read_only_fields = ["workspace", "project", "issue_type"]

    def validate(self, attrs):
        property_type = attrs.get("property_type", getattr(self.instance, "property_type", None))
        relation_type = attrs.get("relation_type", getattr(self.instance, "relation_type", None))

        if property_type is not None and property_type not in V1_PROPERTY_TYPES:
            raise serializers.ValidationError({"property_type": "This property type is not supported yet."})

        if property_type == PropertyTypeEnum.RELATION.value:
            if relation_type not in (RelationTypeEnum.USER.value, RelationTypeEnum.ISSUE.value):
                raise serializers.ValidationError(
                    {"relation_type": "A relation property requires a relation_type of USER or ISSUE."}
                )
        else:
            attrs["relation_type"] = None

        return attrs


class IssuePropertyValueSerializer(BaseSerializer):
    """Read serializer for typed custom property values."""

    class Meta:
        model = IssuePropertyValue
        fields = [
            "id",
            "issue_id",
            "property_id",
            "project_id",
            "workspace_id",
            "value_text",
            "value_boolean",
            "value_decimal",
            "value_datetime",
            "value_uuid",
            "value_option",
            "external_source",
            "external_id",
        ]
        read_only_fields = fields
