# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.app.serializers.base import BaseSerializer
from plane.chat.models import ChannelMember, ChannelMemberRole

# How many people one request can add to a channel.
MAX_MEMBERS_PER_ADD = 100


class ChannelMemberSerializer(BaseSerializer):
    """A channel member as anyone in the channel sees them: no read cursor, no notification setting."""

    class Meta:
        model = ChannelMember
        fields = ["id", "channel", "user", "role", "created_at"]
        read_only_fields = fields


class ChannelMemberAddSerializer(serializers.Serializer):
    member_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1, max_length=MAX_MEMBERS_PER_ADD)


class ChannelMemberRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=ChannelMemberRole.choices)


class MarkReadSerializer(serializers.Serializer):
    message_id = serializers.UUIDField()
