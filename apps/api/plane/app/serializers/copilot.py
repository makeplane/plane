# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import CopilotMemory, CopilotMessage, CopilotSession, CopilotToolCall
from plane.utils.copilot_constants import INTERACTIVE_TOOL_NAMES, CopilotEntityType, CopilotToolStatus

from .base import BaseSerializer


class CopilotSessionCreateSerializer(serializers.Serializer):
    entity_type = serializers.ChoiceField(choices=CopilotEntityType.choices)
    entity_id = serializers.UUIDField()


class CopilotMemorySerializer(BaseSerializer):
    class Meta:
        model = CopilotMemory
        fields = ["id", "content", "created_at", "updated_at"]
        read_only_fields = fields


class CopilotToolCallSerializer(BaseSerializer):
    awaiting_input = serializers.SerializerMethodField()

    class Meta:
        model = CopilotToolCall
        fields = [
            "id",
            "name",
            "args",
            "result",
            "error",
            "status",
            "is_stale",
            "is_answered",
            "awaiting_input",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_awaiting_input(self, obj):
        return obj.name in INTERACTIVE_TOOL_NAMES and obj.status == CopilotToolStatus.RUNNING and not obj.is_answered


class CopilotMessageSerializer(BaseSerializer):
    tool_calls = CopilotToolCallSerializer(many=True, read_only=True)

    class Meta:
        model = CopilotMessage
        fields = ["id", "role", "content", "sequence", "tool_calls", "created_at", "updated_at"]
        read_only_fields = fields


class CopilotSessionSerializer(BaseSerializer):
    messages = CopilotMessageSerializer(many=True, read_only=True)
    memories = CopilotMemorySerializer(many=True, read_only=True)

    class Meta:
        model = CopilotSession
        fields = [
            "id",
            "workspace",
            "project",
            "entity_type",
            "entity_id",
            "messages",
            "memories",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
