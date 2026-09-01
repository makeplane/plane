# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from .base import BaseSerializer
from plane.db.models import User


class UserLiteSerializer(BaseSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name"]


class InstanceUserSerializer(BaseSerializer):
    is_instance_admin = serializers.SerializerMethodField()

    def get_is_instance_admin(self, obj):
        # Relies on the `is_instance_admin` annotation set by the view queryset.
        return getattr(obj, "is_instance_admin", False)

    class Meta:
        model = User
        fields = [
            "id",
            "display_name",
            "first_name",
            "last_name",
            "email",
            "avatar",
            "avatar_url",
            "is_active",
            "is_bot",
            "is_email_verified",
            "is_instance_admin",
            "date_joined",
            "last_active",
        ]
        read_only_fields = [
            "id",
            "display_name",
            "first_name",
            "last_name",
            "email",
            "avatar",
            "avatar_url",
            "is_bot",
            "is_email_verified",
            "is_instance_admin",
            "date_joined",
            "last_active",
        ]
