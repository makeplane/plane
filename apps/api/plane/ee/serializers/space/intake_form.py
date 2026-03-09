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

# Third Party imports
from rest_framework import serializers

# Module imports
from plane.ee.serializers import BaseSerializer
from plane.ee.models import (
    IntakeForm,
    PropertyTypeEnum,
    IssueProperty,
    IssuePropertyOption,
    IntakeFormField,
    IssuePropertyValue,
)
from plane.ee.serializers import IssueCreateSerializer
from plane.db.models.intake import IntakeIssue, SourceType
from plane.db.models.asset import FileAsset


class IntakeFormSettingsSerializer(BaseSerializer):
    project_details = serializers.SerializerMethodField()

    class Meta:
        model = IntakeForm
        fields = [
            "id",
            "name",
            "description",
            "anchor",
            "is_active",
            "intake",
            "work_item_type",
            "is_workitem_description_required",
            "is_workitem_name_required",
            "created_at",
            "updated_at",
            "workspace",
            "project_details",
        ]
        read_only_fields = fields

    def get_project_details(self, obj):
        project = getattr(obj, "project", None)
        if not project:
            return None

        return {
            "id": str(project.id),
            "identifier": project.identifier,
            "name": project.name,
            "cover_image": project.cover_image,
            "cover_image_url": project.cover_image_url,
            "logo_props": project.logo_props or {},
            "description": project.description or "",
        }


class IssuePropertyOptionSerializer(BaseSerializer):
    class Meta:
        model = IssuePropertyOption
        fields = [
            "id",
            "name",
            "sort_order",
            "description",
            "logo_props",
            "is_active",
            "parent",
            "is_default",
        ]


class IntakeFormFieldSerializer(BaseSerializer):
    options = serializers.SerializerMethodField()

    class Meta:
        model = IssueProperty
        fields = [
            "id",
            "display_name",
            "description",
            "property_type",
            "relation_type",
            "is_required",
            "default_value",
            "settings",
            "is_active",
            "issue_type",
            "is_multi",
            "validation_rules",
            "options",
        ]
        read_only_fields = fields

    def get_options(self, obj):
        if obj.property_type == PropertyTypeEnum.OPTION:
            return IssuePropertyOptionSerializer(obj.options.all(), many=True).data
        else:
            return []


class IntakeWorkItemTypeFormCreateSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    name = serializers.CharField(required=False)
    description_html = serializers.CharField(required=False, allow_blank=True)
    values = serializers.JSONField(required=False)
    attachment_ids = serializers.ListField(required=False)

    def validate_values(self, value):
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
        )

        intake_id = self.context.get("intake_id")
        project_id = self.context.get("project_id")
        intake_form_id = self.context.get("intake_form_id")

        # Get all the field ids
        field_ids = IntakeFormField.objects.filter(
            intake_form__intake_id=intake_id, intake_form_id=intake_form_id
        ).values_list("work_item_property_id", flat=True)
        property_objs = IssueProperty.objects.filter(id__in=field_ids, project_id=project_id)

        for property_obj in property_objs:
            property_value = value.get(str(property_obj.id))

            # Check if required
            if property_obj.is_required and not property_value:
                raise serializers.ValidationError(f"{property_obj.display_name} is required")

            # If value is empty and not required, no further validation needed
            if not property_value and property_value != 0 and property_value is not False:
                continue

            property_type = property_obj.property_type

            # TEXT - accepts any string
            if property_type == PropertyTypeEnum.TEXT:
                if not isinstance(property_value, str):
                    raise serializers.ValidationError("Must be a string")

            # URL - must be valid URL format
            elif property_type == PropertyTypeEnum.URL:
                if not isinstance(property_value, str):
                    raise serializers.ValidationError("Must be a string")
                url_validator = URLValidator()
                try:
                    url_validator(property_value)
                except DjangoValidationError:
                    raise serializers.ValidationError("Must be a valid URL (e.g., https://example.com)")

            # EMAIL - must be valid email format
            elif property_type == PropertyTypeEnum.EMAIL:
                if not isinstance(property_value, str):
                    raise serializers.ValidationError("Must be a string")
                try:
                    validate_email(property_value)
                except DjangoValidationError:
                    raise serializers.ValidationError("Must be a valid email address (e.g., user@example.com)")

            # DATETIME - accepts YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
            elif property_type == PropertyTypeEnum.DATETIME:
                if not isinstance(property_value, str):
                    raise serializers.ValidationError("Must be a string")
                valid_formats = ["%Y-%m-%d", "%Y-%m-%d %H:%M:%S"]
                parsed = False
                for fmt in valid_formats:
                    try:
                        datetime.strptime(property_value, fmt)
                        parsed = True
                        break
                    except ValueError:
                        continue

                if not parsed:
                    raise serializers.ValidationError(
                        "Must be a valid date in format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS"
                    )

            # DECIMAL - must be a number
            elif property_type == PropertyTypeEnum.DECIMAL:
                property_value = float(property_value)
                if not isinstance(property_value, (int, float)):
                    raise serializers.ValidationError("Must be a number (e.g., 123.45)")

            # BOOLEAN - must be a boolean
            elif property_type == PropertyTypeEnum.BOOLEAN:
                if not isinstance(property_value, bool):
                    raise serializers.ValidationError("Must be a boolean (true or false)")

            # FILE - accepts any string (file path/URL)
            elif property_type == PropertyTypeEnum.FILE:
                if not isinstance(property_value, str):
                    raise serializers.ValidationError("Must be a string")

            # OPTION - must be a valid UUID or list of UUIDs (if is_multi)
            elif property_type == PropertyTypeEnum.OPTION:
                # Handle multi-value properties
                if property_obj.is_multi:
                    if isinstance(property_value, list):
                        if not property_value:
                            raise serializers.ValidationError("List cannot be empty for multi-value property")
                        # Validate each UUID in the list
                        uuid_list = []
                        for v in property_value:
                            print(v)
                            if not isinstance(v, str):
                                raise serializers.ValidationError("Each value in list must be a string (UUID)")
                            try:
                                uuid_obj = uuid.UUID(str(v), version=4)
                                uuid_list.append(uuid_obj)
                            except (ValueError, AttributeError):
                                raise serializers.ValidationError(f"Invalid UUID format: {v}")

                        # Check if all options exist for this property
                        existing_count = IssuePropertyOption.objects.filter(
                            property=property_obj, id__in=uuid_list
                        ).count()
                        if existing_count != len(uuid_list):
                            raise serializers.ValidationError(
                                "One or more selected options do not exist for this property"
                            )
                    elif isinstance(property_value, str):
                        # Single value also acceptable for multi-value property
                        try:
                            uuid_obj = uuid.UUID(str(property_value), version=4)
                        except (ValueError, AttributeError):
                            raise serializers.ValidationError("Must be a valid UUID for a property option")

                        if not IssuePropertyOption.objects.filter(property=property_obj, id=uuid_obj).exists():
                            raise serializers.ValidationError("Selected option does not exist for this property")
                    else:
                        raise serializers.ValidationError("Must be a string (UUID) or list of UUIDs")
                else:
                    # Single value only
                    value_to_validate = property_value
                    if isinstance(property_value, list):
                        if len(property_value) != 1:
                            raise serializers.ValidationError(
                                "Must contain exactly one value for single-select property"
                            )
                        value_to_validate = property_value[0]

                    if not isinstance(value_to_validate, str):
                        raise serializers.ValidationError("Must be a string (UUID)")
                    try:
                        uuid_obj = uuid.UUID(str(value_to_validate), version=4)
                    except (ValueError, AttributeError):
                        raise serializers.ValidationError("Must be a valid UUID for a property option")

                    if not IssuePropertyOption.objects.filter(property=property_obj, id=uuid_obj).exists():
                        raise serializers.ValidationError("Selected option does not exist for this property")

            # Unknown property type
            else:
                raise serializers.ValidationError(f"Unsupported property type: {property_type}")

        return value

    def validate(self, attrs):
        # Validate description HTML
        if not attrs.get("description_html"):
            attrs["description_html"] = "<p></p>"

        # Validate email
        if not attrs.get("email"):
            raise serializers.ValidationError("Email is required")

        # Validate username
        if not attrs.get("username"):
            raise serializers.ValidationError("Username is required")

        # Validate name
        if not attrs.get("name"):
            attrs["name"] = "Untitled"

        return attrs

    def create(self, validated_data):
        """
        Creates issue and related property values
        """
        issue_data = {
            "name": validated_data.get("name"),
            "description_html": validated_data.get("description_html"),
        }
        work_item_type_id = self.context.get("work_item_type_id")
        if work_item_type_id:
            issue_data["type_id"] = work_item_type_id

        project_id = self.context.get("project_id")
        workspace_id = self.context.get("workspace_id")
        intake_id = self.context.get("intake_id")
        intake_form_id = self.context.get("intake_form_id")

        serializer = IssueCreateSerializer(
            data=issue_data,
            context={
                "project_id": self.context.get("project_id"),
                "workspace_id": self.context.get("workspace_id"),
                "default_assignee_id": self.context.get("default_assignee_id"),
                "created_by_id": self.context.get("created_by_id"),
                "slug": self.context.get("slug"),
                "intake_id": intake_id,
                "user_id": self.context.get("created_by_id"),
            },
        )

        if not serializer.is_valid():
            raise serializers.ValidationError(serializer.errors)

        issue = serializer.save()

        intake_issue = IntakeIssue(
            intake_id=intake_id,
            project_id=project_id,
            issue=issue,
            source=SourceType.FORMS,
            source_email=validated_data.get("email"),
            extra={
                "username": validated_data.get("username"),
            },
            created_by_id=self.context.get("created_by_id"),
        )
        intake_issue.save()

        # Base parameters for all property values
        base_params = {
            "workspace_id": workspace_id,
            "project_id": project_id,
            "issue_id": issue.id,
        }

        # Link attachments to intake work item
        attachment_ids = validated_data.get("attachment_ids") or []

        # Create attachments for the intake work item
        FileAsset.objects.filter(
            id__in=attachment_ids,
            entity_type=FileAsset.EntityTypeContext.INTAKE_FORM_ATTACHMENT,
        ).update(
            issue_id=issue.id,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
        )

        # Create property values
        property_values = validated_data.get("values") or {}

        # Get all the field ids
        intake_form_field_qs = IntakeFormField.objects.filter(intake_form_id=intake_form_id or 0)
        if not intake_form_field_qs.exists():
            intake_form_field_qs = IntakeFormField.objects.filter(intake_form__intake_id=intake_id)

        field_ids = intake_form_field_qs.values_list("work_item_property_id", flat=True)
        property_objs = IssueProperty.objects.filter(id__in=field_ids, project_id=project_id)

        property_value_objs = []

        for property_obj in property_objs:
            property_type = property_obj.property_type

            property_value = property_values.get(str(property_obj.id))
            if not property_value:
                continue

            # Handle multi-value OPTION and RELATION properties
            if property_type in [PropertyTypeEnum.OPTION, PropertyTypeEnum.RELATION] and property_obj.is_multi:
                # Normalize to list
                values = property_value if isinstance(property_value, list) else [property_value]

                # Create multiple property value records
                for v in values:
                    params = base_params.copy()
                    params["property_id"] = property_obj.id
                    if property_type == PropertyTypeEnum.OPTION:
                        params["value_option_id"] = v

                    if property_type == PropertyTypeEnum.RELATION:
                        params["value_uuid"] = v

                    property_value_objs.append(
                        IssuePropertyValue(**params),
                    )

            else:
                # Set the appropriate value field based on property type
                params = base_params.copy()
                params["property_id"] = property_obj.id
                if property_type in [
                    PropertyTypeEnum.TEXT,
                    PropertyTypeEnum.URL,
                    PropertyTypeEnum.EMAIL,
                    PropertyTypeEnum.FILE,
                ]:
                    params["value_text"] = property_value
                elif property_type == PropertyTypeEnum.DATETIME:
                    params["value_datetime"] = property_value
                elif property_type == PropertyTypeEnum.DECIMAL:
                    params["value_decimal"] = property_value
                elif property_type == PropertyTypeEnum.BOOLEAN:
                    params["value_boolean"] = property_value
                elif property_type == PropertyTypeEnum.OPTION:
                    value_to_store = property_value[0] if isinstance(property_value, list) else property_value
                    params["value_option_id"] = value_to_store
                elif property_type == PropertyTypeEnum.RELATION:
                    value_to_store = property_value[0] if isinstance(property_value, list) else property_value
                    params["value_uuid"] = value_to_store

                # Create and save the property value
                property_value_objs.append(
                    IssuePropertyValue(**params),
                )

        IssuePropertyValue.objects.bulk_create(property_value_objs)

        return intake_issue
