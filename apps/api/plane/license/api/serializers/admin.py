# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import User
from plane.app.serializers import UserAdminLiteSerializer
from plane.license.models import InstanceAdmin


class InstanceAdminMeSerializer(BaseSerializer):
    # Menu RBAC lives on the InstanceAdmin row, not the User — method
    # fields look it up (a plain `fields +=` would raise ImproperlyConfigured).
    is_super_admin = serializers.SerializerMethodField()
    allowed_menus = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "avatar",
            "avatar_url",
            "cover_image",
            "date_joined",
            "display_name",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_bot",
            "is_email_verified",
            "user_timezone",
            "username",
            "is_password_autoset",
            "is_email_verified",
            "is_super_admin",
            "allowed_menus",
        ]
        read_only_fields = fields

    def _admin_row(self, obj):
        return InstanceAdmin.objects.filter(user=obj).first()

    def get_is_super_admin(self, obj) -> bool:
        admin = self._admin_row(obj)
        return bool(admin and admin.is_super_admin)

    def get_allowed_menus(self, obj) -> list:
        admin = self._admin_row(obj)
        return list(admin.allowed_menus or []) if admin else []


class InstanceAdminSerializer(BaseSerializer):
    user_detail = UserAdminLiteSerializer(source="user", read_only=True)

    class Meta:
        model = InstanceAdmin
        fields = "__all__"
        # Grant fields are written only through the guarded view logic —
        # never via serializer mass-assignment (blocks self-escalation).
        read_only_fields = ["id", "instance", "user", "is_super_admin", "allowed_menus"]
