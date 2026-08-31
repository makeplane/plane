# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third-party imports
from rest_framework import serializers

# Module imports
from plane.db.models import ProjectCustomField, ProjectCustomFieldValue
from .base import BaseSerializer


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
            "project_id",
            "workspace_id",
        ]
        # Ownership (this value's custom_field belongs to this project) is enforced
        # by the view's lookup filter, not here: "custom_field" is read-only, so it
        # is never present in this serializer's validated data.
        read_only_fields = ["workspace", "project", "custom_field"]
