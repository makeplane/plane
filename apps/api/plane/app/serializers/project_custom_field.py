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
            "group_name",
            "is_unique_key",
            "project_id",
            "workspace_id",
        ]
        # is_unique_key is deliberately read-only here: only the default-seed data
        # (apps/api/plane/db/default_data/project_custom_fields.py) may set it,
        # never a field created ad hoc through this API's create/update actions.
        read_only_fields = ["workspace", "project", "is_unique_key"]

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

        value_text = attrs.get("value_text")
        if value_text and self.instance.custom_field.is_unique_key:
            # Only whitespace is trimmed, not case or full/half-width: those are
            # lossy normalizations that could collapse two values a business
            # actually intends to keep distinct. Written back into attrs so the
            # stored value and the compared value are always the same string.
            value_text = value_text.strip()
            attrs["value_text"] = value_text

            # Custom fields are per-project rows even when several projects share a
            # field of the same name (e.g. every project's own "项目序号" field
            # is a distinct ProjectCustomField), so a uniqueness check keyed on
            # custom_field_id would only ever compare a project against itself.
            # Matching on is_unique_key alone (not also field name) is deliberate:
            # at most one field per project ever carries is_unique_key=True (it's
            # read-only, only set by the default-seed data), so the flag alone
            # already identifies "the" unique-key field across every project. A
            # name-based match would silently stop working the moment anyone
            # renamed the field on one project, since ProjectCustomFieldSerializer
            # leaves name editable.
            # Nothing in this model chain (BaseModel, AuditModel) filters deleted_at
            # automatically, unlike some Django soft-delete setups: every query that
            # only cares about live rows must say so explicitly, matching how the
            # UniqueConstraint above scopes itself with condition=Q(deleted_at__isnull=True).
            # Without these two filters, a soft-deleted field or value (project
            # archived, field deleted) would still block a live project from using
            # its value.
            duplicate_exists = (
                ProjectCustomFieldValue.objects.filter(
                    workspace_id=self.instance.workspace_id,
                    custom_field__is_unique_key=True,
                    custom_field__deleted_at__isnull=True,
                    value_text=value_text,
                    deleted_at__isnull=True,
                )
                .exclude(pk=self.instance.pk)
                .exists()
            )
            if duplicate_exists:
                # This exact string is matched by name on the frontend to show a
                # specific message instead of a generic save-failed toast: see
                # apps/web/core/components/project-custom-fields/custom-field-value-input.tsx,
                # handleSaveError(). Changing this string needs a matching change there.
                raise serializers.ValidationError(detail="VALUE_MUST_BE_UNIQUE")

        return attrs
