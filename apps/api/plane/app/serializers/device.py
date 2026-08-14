# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import Device

from .base import BaseSerializer


class DeviceSerializer(BaseSerializer):
    class Meta:
        model = Device
        fields = ["id", "platform", "apns_token", "apns_env", "last_active_at", "created_at"]
        read_only_fields = ["id", "last_active_at", "created_at"]

    def validate_apns_token(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("apns_token is required.")
        return value.strip()
