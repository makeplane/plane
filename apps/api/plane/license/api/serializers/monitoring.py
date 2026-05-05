# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models.notification import EmailNotificationLog


class EmailNotificationLogSerializer(serializers.ModelSerializer):
    receiver_email = serializers.CharField(source="receiver.email", read_only=True)
    triggered_by_email = serializers.CharField(
        source="triggered_by.email", read_only=True
    )

    class Meta:
        model = EmailNotificationLog
        fields = [
            "id",
            "receiver_email",
            "triggered_by_email",
            "entity_name",
            "entity",
            "created_at",
            "processed_at",
            "sent_at",
        ]
        read_only_fields = fields
