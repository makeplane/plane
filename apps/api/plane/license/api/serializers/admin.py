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

# Thrid party imports
from rest_framework import serializers
from zxcvbn import zxcvbn

# Module imports
from .base import BaseSerializer
from plane.db.models import User
from plane.app.serializers import UserAdminLiteSerializer
from plane.license.models import InstanceAdmin


class InstanceAdminMeSerializer(BaseSerializer):
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
        ]
        read_only_fields = fields


class InstanceAdminSerializer(BaseSerializer):
    user_detail = UserAdminLiteSerializer(source="user", read_only=True)

    class Meta:
        model = InstanceAdmin
        fields = "__all__"
        read_only_fields = ["id", "instance", "user"]


class InstanceAdminPasswordResetSerializer(serializers.Serializer):
    new_password = serializers.CharField(required=True, write_only=True)

    def validate_new_password(self, value):
        results = zxcvbn(value)
        if results["score"] < 3:
            raise serializers.ValidationError(
                "Password is too weak. Please use a strong password", code="INVALID_PASSWORD"
            )
        return value

    def save(self):
        "Update the user's password and reset the flag"
        user = self.context.get("request").user
        new_password = self.validated_data["new_password"]

        user.set_password(new_password)
        user.is_password_reset_required = False
        user.save()

        return user
