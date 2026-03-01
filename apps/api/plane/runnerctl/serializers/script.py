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

from pydantic import ValidationError as PydanticValidationError
from rest_framework import serializers

from ..models import Script
from ..schemas import VariableDefinition


class ScriptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Script
        fields = "__all__"
        read_only_fields = [
            "id",
            "workspace",
            "build",
            "function_names",
            "is_system",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if "project" in self.fields:
            from plane.db.models import Project

            self.fields["project"].queryset = Project.objects.all()

    def validate_platform(self, value):
        valid_platforms = [choice[0] for choice in Script.PLATFORM_CHOICES]
        if value not in valid_platforms:
            raise serializers.ValidationError(f"Platform must be one of: {', '.join(valid_platforms)}")
        return value

    def validate_code_type(self, value):
        if value is not None:
            valid_types = [choice[0] for choice in Script.CODE_TYPE_CHOICES]
            if value not in valid_types:
                raise serializers.ValidationError(f"Code type must be one of: {', '.join(valid_types)}")
        return value

    def validate_variables(self, value):
        if value is None:
            return value
        if not isinstance(value, list):
            raise serializers.ValidationError("Variables must be a valid JSON array")

        seen_keys = set()
        for i, item in enumerate(value):
            try:
                VariableDefinition.model_validate(item)
            except PydanticValidationError as e:
                errors = [f"{err['loc'][0]}: {err['msg']}" for err in e.errors()]
                raise serializers.ValidationError(f"Invalid variable at index {i}: {', '.join(errors)}")

            key = item.get("key")
            if key in seen_keys:
                raise serializers.ValidationError(f"Duplicate variable key: {key}")
            seen_keys.add(key)

        return value

    def validate(self, attrs):
        # Skip project validation for system scripts
        if self.instance and self.instance.is_system:
            return attrs

        workspace = attrs.get("workspace") or (self.instance.workspace if self.instance else None)
        project = attrs.get("project")

        if project and workspace:
            if project.workspace_id != workspace.id:
                raise serializers.ValidationError({"project": "Project must belong to the specified workspace."})

        return attrs


class ScriptLiteSerializer(serializers.ModelSerializer):
    """Lightweight serializer for nested script references"""

    class Meta:
        model = Script
        fields = ["id", "name", "platform", "description", "variables", "is_system"]
        read_only_fields = ["id", "name", "platform", "description", "variables", "is_system"]


class ScriptListSerializer(serializers.ModelSerializer):
    """Serializer for script list with execution stats"""

    total_executions = serializers.IntegerField(read_only=True)
    successful_executions = serializers.IntegerField(read_only=True)
    success_rate = serializers.SerializerMethodField()
    last_run = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Script
        fields = [
            "id",
            "name",
            "description",
            "platform",
            "code_type",
            "variables",
            "is_system",
            "created_at",
            "updated_at",
            # Stats
            "total_executions",
            "successful_executions",
            "success_rate",
            "last_run",
        ]
        read_only_fields = fields

    def get_success_rate(self, obj):
        total = getattr(obj, "total_executions", 0) or 0
        successful = getattr(obj, "successful_executions", 0) or 0
        if total == 0:
            return None
        return round((successful / total) * 100, 1)
