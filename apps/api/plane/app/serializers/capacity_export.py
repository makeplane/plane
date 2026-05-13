# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

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
        """Ensure date_from <= date_to."""
        if attrs["date_from"] > attrs["date_to"]:
            raise serializers.ValidationError("date_from must be <= date_to")
        return attrs


class CapacityExportJobRetrieveSerializer(serializers.ModelSerializer):
    """Serializes a CapacityExportJob for GET requests."""

    created_at = serializers.SerializerMethodField()
    expires_at = serializers.SerializerMethodField()

    class Meta:
        model = CapacityExportJob
        fields = [
            "id",
            "status",
            "date_from",
            "date_to",
            "member_ids",
            "created_at",
            "expires_at",
            "rows_count",
            "file_size",
        ]

    def get_created_at(self, obj: CapacityExportJob) -> str:
        return obj.created_at.isoformat() if obj.created_at else None

    def get_expires_at(self, obj: CapacityExportJob) -> str:
        return obj.expires_at.isoformat() if obj.expires_at else None


class CapacityExportJobListSerializer(serializers.ModelSerializer):
    """Serializes a CapacityExportJob for list endpoints."""

    created_at = serializers.SerializerMethodField()
    expires_at = serializers.SerializerMethodField()

    class Meta:
        model = CapacityExportJob
        fields = [
            "id",
            "status",
            "date_from",
            "date_to",
            "member_ids",
            "created_at",
            "expires_at",
            "rows_count",
            "file_size",
        ]

    def get_created_at(self, obj: CapacityExportJob) -> str:
        return obj.created_at.isoformat() if obj.created_at else None

    def get_expires_at(self, obj: CapacityExportJob) -> str:
        return obj.expires_at.isoformat() if obj.expires_at else None
