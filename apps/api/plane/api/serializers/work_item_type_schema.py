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


class FieldOptionSerializer(serializers.Serializer):
    """Schema for a field option (used for states, labels, members, etc.)"""

    id = serializers.CharField(required=False)
    value = serializers.CharField(required=False)
    label = serializers.CharField(required=False)
    name = serializers.CharField(required=False)
    color = serializers.CharField(required=False)
    group = serializers.CharField(required=False)
    display_name = serializers.CharField(required=False)
    email = serializers.CharField(required=False)
    avatar = serializers.CharField(required=False, allow_null=True)
    key = serializers.IntegerField(required=False)
    logo_props = serializers.JSONField(required=False)


class FieldSchemaSerializer(serializers.Serializer):
    """Schema for a single standard field"""

    type = serializers.CharField(help_text="Field type (string, uuid, array[uuid], date, option)")
    required = serializers.BooleanField(help_text="Whether this field is required")
    description = serializers.CharField(required=False, help_text="Field description")
    default = serializers.JSONField(required=False, help_text="Default value if any")
    max_length = serializers.IntegerField(required=False, help_text="Maximum length for string fields")
    format = serializers.CharField(required=False, help_text="Expected format (e.g., YYYY-MM-DD for dates)")
    options = FieldOptionSerializer(many=True, required=False, help_text="Available options for this field")


class CustomFieldSchemaSerializer(serializers.Serializer):
    """Schema for a custom property field"""

    id = serializers.UUIDField(help_text="Custom property ID")
    type = serializers.CharField(help_text="Property type (TEXT, OPTION, RELATION, etc.)")
    name = serializers.CharField(help_text="Property name (slug format)")
    display_name = serializers.CharField(help_text="Human-readable property name")
    description = serializers.CharField(required=False, allow_blank=True, help_text="Property description")
    required = serializers.BooleanField(help_text="Whether this property is required")
    is_multi = serializers.BooleanField(help_text="Whether this property accepts multiple values")
    relation_type = serializers.CharField(
        required=False, help_text="Relation type (USER, ISSUE) for RELATION properties"
    )
    options = FieldOptionSerializer(many=True, required=False, help_text="Available options for this property")


class WorkItemTypeSchemaSerializer(serializers.Serializer):
    """Complete schema response for a work item type"""

    type_id = serializers.UUIDField(help_text="Work item type ID")
    type_name = serializers.CharField(help_text="Work item type name")
    type_description = serializers.CharField(allow_blank=True, help_text="Work item type description")
    type_logo_props = serializers.JSONField(help_text="Logo properties for the work item type")
    fields = serializers.DictField(
        child=FieldSchemaSerializer(),
        help_text="Standard fields available for this work item type",
    )
    custom_fields = serializers.DictField(
        child=CustomFieldSchemaSerializer(),
        help_text="Custom property fields available for this work item type (only if ISSUE_TYPES feature is enabled)",
    )
