# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import ChatChannel, ChatMessage

from .base import BaseSerializer
from .user import UserLiteSerializer


class ChatChannelSerializer(BaseSerializer):
    class Meta:
        model = ChatChannel
        fields = [
            "id",
            "name",
            "description",
            "is_default",
            "workspace",
            "project",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_default", "workspace", "project", "created_by", "created_at", "updated_at"]

    def validate_name(self, value):
        name = value.strip().lstrip("#").lower()
        if not name:
            raise serializers.ValidationError("Channel name cannot be empty.")
        return name


class ChatMessageSerializer(BaseSerializer):
    sender = UserLiteSerializer(source="created_by", read_only=True)

    class Meta:
        model = ChatMessage
        fields = [
            "id",
            "channel",
            "content",
            "sender",
            "created_at",
            "updated_at",
            "edited_at",
        ]
        read_only_fields = ["id", "channel", "sender", "created_at", "updated_at", "edited_at"]

    def validate_content(self, value):
        content = value.strip()
        if not content:
            raise serializers.ValidationError("Message cannot be empty.")
        if len(content) > ChatMessage.MAX_LENGTH:
            raise serializers.ValidationError(f"Message cannot be longer than {ChatMessage.MAX_LENGTH} characters.")
        return content
