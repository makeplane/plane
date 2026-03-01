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

from rest_framework import serializers

from ..models import ScriptFunction


class FunctionParameterSerializer(serializers.Serializer):
    """Serializer for function parameter definitions."""

    name = serializers.CharField(max_length=100)
    type = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True)
    required = serializers.BooleanField(default=True)
    defaultValue = serializers.CharField(required=False, allow_blank=True)


class ScriptFunctionSerializer(serializers.ModelSerializer):
    """Full serializer for ScriptFunction CRUD operations."""

    class Meta:
        model = ScriptFunction
        fields = "__all__"
        read_only_fields = [
            "id",
            "workspace",
            "is_system",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def validate_category(self, value):
        valid_categories = [choice[0] for choice in ScriptFunction.CATEGORY_CHOICES]
        if value not in valid_categories:
            raise serializers.ValidationError(
                f"Category must be one of: {', '.join(valid_categories)}"
            )
        return value

    def validate_parameters(self, value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("Parameters must be a valid JSON array")

        seen_names = set()
        for i, param in enumerate(value):
            # Validate required fields
            if not param.get("name"):
                raise serializers.ValidationError(
                    f"Parameter at index {i} is missing 'name'"
                )
            if not param.get("type"):
                raise serializers.ValidationError(
                    f"Parameter at index {i} is missing 'type'"
                )

            # Check for duplicate names
            name = param.get("name")
            if name in seen_names:
                raise serializers.ValidationError(f"Duplicate parameter name: {name}")
            seen_names.add(name)

            # Validate structure
            param_serializer = FunctionParameterSerializer(data=param)
            if not param_serializer.is_valid():
                raise serializers.ValidationError(
                    f"Invalid parameter at index {i}: {param_serializer.errors}"
                )

        return value

    def validate_name(self, value):
        # Function names should be valid JavaScript identifiers
        import re

        if not re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", value):
            raise serializers.ValidationError(
                "Function name must be a valid identifier (start with letter or underscore, "
                "contain only letters, numbers, and underscores)"
            )
        return value


class ScriptFunctionLiteSerializer(serializers.ModelSerializer):
    """Lightweight serializer for function lists and references."""

    class Meta:
        model = ScriptFunction
        fields = [
            "id",
            "name",
            "description",
            "category",
            "is_system",
            "parameters",
            "return_type",
            "code",
            "usage_example",
        ]
        read_only_fields = fields


class ScriptFunctionListSerializer(serializers.ModelSerializer):
    """Serializer for function list with all needed info."""

    class Meta:
        model = ScriptFunction
        fields = [
            "id",
            "name",
            "description",
            "category",
            "is_system",
            "parameters",
            "return_type",
            "code",
            "usage_example",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
