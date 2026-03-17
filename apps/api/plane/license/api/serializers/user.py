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

# Django imports
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email as django_validate_email

# Third party imports
from rest_framework import serializers
from zxcvbn import zxcvbn

# Module imports
from .base import BaseSerializer
from plane.db.models import User
from plane.payment.utils.member_payment_count import instance_member_check


class UserLiteSerializer(BaseSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name"]


class InstanceUserSerializer(BaseSerializer):
    is_instance_admin = serializers.BooleanField(read_only=True)
    workspace_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "display_name",
            "first_name",
            "last_name",
            "avatar",
            "avatar_url",
            "is_active",
            "created_at",
            "is_instance_admin",
            "workspace_count",
            "date_joined",
        ]
        read_only_fields = fields


class InstanceAdminCreateSerializer(serializers.Serializer):
    """Serializer for creating instance admin"""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    is_password_reset_required = serializers.BooleanField(required=False, default=False)

    # Validations
    def validate_email(self, value):
        "Validate email format and uniqueness"
        email = str(value).strip().lower()

        # Check if user already exists
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError("User with this email already exists", code="USER_ALREADY_EXISTS")

        try:
            django_validate_email(email)
        except DjangoValidationError:
            raise serializers.ValidationError("Email format is not valid", code="INVALID_EMAIL")

        return email

    def validate_password(self, value):
        "Validate password strength"
        results = zxcvbn(value)

        if results["score"] < 3:
            raise serializers.ValidationError(
                "Password is too weak. Please use a strong password", code="INVALID_PASSWORD"
            )
        return value

    # Check for available seats
    def validate(self, data):
        """Check for email uniqueness and available seats"""
        is_allowed = instance_member_check(requested_invites_list=[{"email": data.get("email")}])

        if not is_allowed:
            raise serializers.ValidationError(
                "Reached seat limit - Purchase seats to add more users", code="REACHED_SEAT_LIMIT"
            )

        return data
