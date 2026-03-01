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
from ..models import ScriptExecution
from .script import ScriptSerializer, ScriptLiteSerializer


class ScriptExecutionSerializer(serializers.ModelSerializer):
    status = serializers.CharField(required=False, default="pending")

    class Meta:
        model = ScriptExecution
        fields = "__all__"
        read_only_fields = [
            "id", "project", "workspace", "output_data", "error_data",
            "started_at", "completed_at", "created_at", "updated_at",
            "created_by", "updated_by"
        ]

    def validate_status(self, value):
        valid_statuses = [choice[0] for choice in ScriptExecution.STATUS_CHOICES]
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Status must be one of: {', '.join(valid_statuses)}")
        return value

    def validate_trigger_type(self, value):
        valid_types = [choice[0] for choice in ScriptExecution.TRIGGER_TYPE_CHOICES]
        if value not in valid_types:
            raise serializers.ValidationError(f"Trigger type must be one of: {', '.join(valid_types)}")
        return value

    def validate_input_data(self, value):
        if value is not None and not isinstance(value, dict):
            raise serializers.ValidationError("Input data must be a valid JSON object")
        return value

    def validate_execution_variables(self, value):
        if value is None:
            return value
        if not isinstance(value, dict):
            raise serializers.ValidationError("Execution variables must be a valid JSON object")

        for key, val in value.items():
            if not isinstance(key, str):
                raise serializers.ValidationError(f"Variable key must be a string, got {type(key).__name__}")
            if not isinstance(val, str):
                raise serializers.ValidationError(
                    f"Variable '{key}' value must be a string, got {type(val).__name__}"
                )

        return value


class ScriptExecutionWithScriptSerializer(ScriptExecutionSerializer):
    """Serializer that includes full script details"""
    script = ScriptSerializer(read_only=True)

    class Meta(ScriptExecutionSerializer.Meta):
        pass


class ScriptExecutionListSerializer(ScriptExecutionSerializer):
    """Lightweight serializer for listing executions"""
    script = ScriptLiteSerializer(read_only=True)

    class Meta(ScriptExecutionSerializer.Meta):
        fields = [
            "id", "script", "trigger_type", "trigger_id", "status",
            "started_at", "completed_at", "created_at", "updated_at"
        ]
