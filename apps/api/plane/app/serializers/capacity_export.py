# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.utils import timezone
from rest_framework import serializers

from plane.db.models import CapacityExportJob


class CapacityExportJobCreateSerializer(serializers.Serializer):
    """Validates the POST body for enqueuing a capacity export."""

    date_from = serializers.DateField()
    date_to = serializers.DateField()
    member_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_null=True,
    )

    def validate(self, attrs):
        if attrs["date_from"] > attrs["date_to"]:
            raise serializers.ValidationError("date_from must be <= date_to")
        return attrs


class CapacityExportJobListSerializer(serializers.ModelSerializer):
    """Serializes a CapacityExportJob for GET list/retrieve responses."""

    created_at = serializers.SerializerMethodField()
    expires_at = serializers.SerializerMethodField()
    completed_at = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = CapacityExportJob
        fields = [
            "id",
            "status",
            "date_from",
            "date_to",
            "member_ids",
            "member_count",
            "row_count",
            "file_url",
            "file_size",
            "error_message",
            "cross_workspace",
            "is_expired",
            "created_at",
            "completed_at",
            "expires_at",
        ]

    def get_created_at(self, obj: CapacityExportJob):
        return obj.created_at.isoformat() if obj.created_at else None

    def get_expires_at(self, obj: CapacityExportJob):
        return obj.expires_at.isoformat() if obj.expires_at else None

    def get_completed_at(self, obj: CapacityExportJob):
        return obj.completed_at.isoformat() if obj.completed_at else None

    def get_member_count(self, obj: CapacityExportJob) -> int:
        return len(obj.member_ids or [])

    def get_is_expired(self, obj: CapacityExportJob) -> bool:
        return bool(obj.expires_at and obj.expires_at < timezone.now())


# Backwards-compatible alias — view still imports retrieve serializer name.
CapacityExportJobRetrieveSerializer = CapacityExportJobListSerializer
