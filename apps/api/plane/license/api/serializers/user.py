# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import User

from .base import BaseSerializer


class UserLiteSerializer(BaseSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name"]


class InstanceUserSerializer(BaseSerializer):
    workspace_count = serializers.IntegerField(read_only=True)
    instance_admin_role = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "display_name",
            "first_name",
            "last_name",
            "avatar_url",
            "is_active",
            "is_email_verified",
            "date_joined",
            "last_active",
            "last_login_time",
            "workspace_count",
            "instance_admin_role",
        ]
        read_only_fields = fields
