# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from .base import BaseSerializer
from plane.db.models import User, WorkspaceMember


class UserLiteSerializer(BaseSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name"]


class InstanceUserSerializer(BaseSerializer):
    """Serializer for listing/detail user in admin."""

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "display_name",
            "avatar",
            "is_active",
            "date_joined",
            "last_login",
        ]
        read_only_fields = ["id", "date_joined", "last_login"]


class InstanceUserCreateSerializer(serializers.Serializer):
    """Serializer for creating user via admin."""

    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, default="")
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()


class InstanceUserUpdateSerializer(serializers.Serializer):
    """Serializer for updating user via admin."""

    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    is_active = serializers.BooleanField(required=False)


class InstanceUserWorkspaceSerializer(BaseSerializer):
    """Serializer for user's workspace memberships."""

    workspace_name = serializers.CharField(source="workspace.name", read_only=True)
    workspace_slug = serializers.CharField(source="workspace.slug", read_only=True)

    class Meta:
        model = WorkspaceMember
        fields = [
            "id",
            "workspace",
            "workspace_name",
            "workspace_slug",
            "role",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class InstanceUserAddToWorkspaceSerializer(serializers.Serializer):
    """Serializer for adding user to workspace."""

    workspace_id = serializers.UUIDField()
    role = serializers.IntegerField(default=15)  # Default: MEMBER

    def validate_role(self, value):
        if value not in [5, 15, 20]:  # GUEST, MEMBER, ADMIN
            raise serializers.ValidationError("Role must be 5 (Guest), 15 (Member), or 20 (Admin).")
        return value
