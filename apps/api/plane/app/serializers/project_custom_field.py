# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third-party imports
from rest_framework import serializers

# Module imports
from plane.db.models import (
    ProjectCustomField,
    ProjectCustomFieldOption,
    ProjectCustomFieldType,
    ProjectCustomFieldValue,
)
from .base import BaseSerializer

# Which single value_* column each field type is allowed to write.
FIELD_TYPE_TO_VALUE_KEY = {
    ProjectCustomFieldType.NUMBER: "value_decimal",
    ProjectCustomFieldType.TEXT: "value_text",
    ProjectCustomFieldType.DATE: "value_date",
    ProjectCustomFieldType.DROPDOWN: "value_option",
    ProjectCustomFieldType.MEMBER: "value_member",
}
VALUE_KEYS = set(FIELD_TYPE_TO_VALUE_KEY.values())


class ProjectCustomFieldSerializer(BaseSerializer):
    class Meta:
        model = ProjectCustomField
        fields = [
            "id",
            "name",
            "description",
            "field_type",
            "sort_order",
            "is_active",
            "project_id",
            "workspace_id",
        ]
        read_only_fields = ["workspace", "project"]

    def validate_name(self, value):
        project_id = self.context.get("project_id")
        field = ProjectCustomField.objects.filter(project_id=project_id, name__iexact=value)
        if self.instance:
            field = field.exclude(id=self.instance.pk)
        if field.exists():
            raise serializers.ValidationError(detail="PROJECT_CUSTOM_FIELD_NAME_ALREADY_EXISTS")
        return value

    def validate_field_type(self, value):
        # Locked after creation: every existing value row for this field lives in
        # one specific value_* column, so changing the type would either orphan
        # that data or require migrating it. Rename is allowed, retype is not.
        if self.instance and self.instance.field_type != value:
            raise serializers.ValidationError(detail="PROJECT_CUSTOM_FIELD_TYPE_CANNOT_BE_CHANGED")
        return value


class ProjectCustomFieldOptionSerializer(BaseSerializer):
    class Meta:
        model = ProjectCustomFieldOption
        fields = ["id", "custom_field", "name", "sort_order", "project_id", "workspace_id"]
        # custom_field is resolved from the URL by the view and passed to save()
        # explicitly, same as workspace/project.
        read_only_fields = ["workspace", "project", "custom_field"]

    def validate_name(self, value):
        custom_field_id = self.context.get("custom_field_id")
        option = ProjectCustomFieldOption.objects.filter(custom_field_id=custom_field_id, name__iexact=value)
        if self.instance:
            option = option.exclude(id=self.instance.pk)
        if option.exists():
            raise serializers.ValidationError(detail="PROJECT_CUSTOM_FIELD_OPTION_NAME_ALREADY_EXISTS")
        return value


class ProjectCustomFieldValueSerializer(BaseSerializer):
    field_name = serializers.CharField(source="custom_field.name", read_only=True)
    field_type = serializers.CharField(source="custom_field.field_type", read_only=True)

    class Meta:
        model = ProjectCustomFieldValue
        fields = [
            "id",
            "custom_field",
            "field_name",
            "field_type",
            "value_decimal",
            "value_text",
            "value_date",
            "value_option",
            "value_member",
            "project_id",
            "workspace_id",
        ]
        # Ownership (this value's custom_field belongs to this project) is enforced
        # by the view's lookup filter, not here: "custom_field" is read-only, so it
        # is never present in this serializer's validated data.
        read_only_fields = ["workspace", "project", "custom_field"]

    def validate(self, attrs):
        field_type = self.instance.custom_field.field_type
        expected_key = FIELD_TYPE_TO_VALUE_KEY.get(field_type)
        unexpected_keys = VALUE_KEYS.intersection(attrs.keys()) - {expected_key}
        if unexpected_keys:
            raise serializers.ValidationError(detail="VALUE_DOES_NOT_MATCH_FIELD_TYPE")

        option = attrs.get("value_option")
        if option is not None and option.custom_field_id != self.instance.custom_field_id:
            raise serializers.ValidationError(detail="OPTION_DOES_NOT_BELONG_TO_FIELD")

        return attrs
