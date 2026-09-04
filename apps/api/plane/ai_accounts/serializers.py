# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import User

from .constants import ACTION_CHOICES, RESOURCE_CHOICES
from .models import AIAccount, AIScopePolicy


class BotUserLiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "display_name", "email", "avatar_url", "is_bot", "bot_type"]
        read_only_fields = fields


class AIScopePolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = AIScopePolicy
        fields = ["id", "project", "resource_type", "action"]
        read_only_fields = ["id"]


class AIAccountSerializer(serializers.ModelSerializer):
    bot_user = BotUserLiteSerializer(read_only=True)
    scope_policies = AIScopePolicySerializer(many=True, read_only=True)

    class Meta:
        model = AIAccount
        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "workspace",
            "owner",
            "bot_user",
            "scope_policies",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace", "owner", "bot_user", "created_at", "updated_at"]


class AIAccountCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    role = serializers.ChoiceField(choices=((15, "Member"), (5, "Guest")), default=15)


class AIScopePolicyInputSerializer(serializers.Serializer):
    project = serializers.UUIDField(required=False, allow_null=True, default=None)
    resource_type = serializers.ChoiceField(choices=[c[0] for c in RESOURCE_CHOICES])
    action = serializers.ChoiceField(choices=[c[0] for c in ACTION_CHOICES])
