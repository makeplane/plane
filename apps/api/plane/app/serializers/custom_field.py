# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import re

# Third party imports
from rest_framework import serializers

# Django imports
from django.utils.text import slugify

# Module imports
from .base import DynamicBaseSerializer
from plane.db.models import CustomField, CustomFieldValue
from plane.db.models.custom_field import CustomFieldType

# field types whose settings carry a selectable ``options`` list
OPTION_FIELD_TYPES = {
    CustomFieldType.SINGLE_SELECT,
    CustomFieldType.MULTI_SELECT,
    CustomFieldType.RADIO,
}


def generate_field_key(workspace_id, entity_type, display_name):
    """Build a slug key unique per (workspace, entity_type)."""
    base = slugify(display_name).replace("-", "_") or "field"
    base = re.sub(r"[^a-z0-9_]", "", base)[:240] or "field"
    key = base
    index = 1
    existing = set(
        CustomField.objects.filter(
            workspace_id=workspace_id,
            entity_type=entity_type,
            deleted_at__isnull=True,
        ).values_list("key", flat=True)
    )
    while key in existing:
        index += 1
        key = f"{base}_{index}"
    return key


class CustomFieldSerializer(DynamicBaseSerializer):
    class Meta:
        model = CustomField
        fields = "__all__"
        read_only_fields = ["workspace", "key", "deleted_at"]

    def validate_width(self, value):
        if value is None:
            return 12
        return max(1, min(12, value))

    def validate(self, attrs):
        field_type = attrs.get("field_type", getattr(self.instance, "field_type", None))
        settings = attrs.get("settings", getattr(self.instance, "settings", {}) or {})

        # selectable field types require a non-empty options list
        if field_type in OPTION_FIELD_TYPES:
            options = (settings or {}).get("options") or []
            if not isinstance(options, list) or len(options) == 0:
                raise serializers.ValidationError(
                    {"settings": "At least one option is required for this field type."}
                )
        return attrs

    def create(self, validated_data):
        validated_data["key"] = generate_field_key(
            validated_data["workspace_id"],
            validated_data.get("entity_type", "project"),
            validated_data.get("display_name", ""),
        )
        return CustomField.objects.create(**validated_data)


class CustomFieldValueSerializer(DynamicBaseSerializer):
    class Meta:
        model = CustomFieldValue
        fields = "__all__"
        read_only_fields = ["workspace", "project", "issue", "deleted_at"]
