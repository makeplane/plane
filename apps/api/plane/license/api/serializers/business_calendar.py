# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import IntegrityError

from rest_framework import serializers

from plane.db.models import DayOverride, Holiday, WorkSchedule


class WorkScheduleSerializer(serializers.ModelSerializer):
    """Serializer for WorkSchedule model with week_pattern validation.

    V0 note: workspace is always None (instance-level). The field is
    read-only so that even if a payload includes workspace=<uuid> it is
    silently ignored — workspace-scoped schedules are out of MVP scope.
    """

    class Meta:
        model = WorkSchedule
        fields = [
            "id",
            "name",
            "week_pattern",
            "timezone",
            "is_default",
            "country_code",
            "workspace",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace", "created_at", "updated_at"]

    def validate_week_pattern(self, value: list) -> list:
        if len(value) != 7:
            raise serializers.ValidationError("week_pattern must contain exactly 7 elements (Mon–Sun).")
        if not all(isinstance(v, bool) for v in value):
            raise serializers.ValidationError("Each element of week_pattern must be a boolean.")
        return value

    def validate(self, attrs: dict) -> dict:
        # Explicit pre-flight uniqueness check for is_default — IntegrityError
        # only fires in save(), never in validate(), so we check proactively.
        if attrs.get("is_default"):
            ws = self.instance.workspace if self.instance else None
            existing = WorkSchedule.objects.filter(workspace=ws, is_default=True)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError(
                    {"is_default": "Another default schedule already exists for this workspace."}
                )
        return super().validate(attrs)


class HolidaySerializer(serializers.ModelSerializer):
    """Serializer for Holiday model."""

    class Meta:
        model = Holiday
        fields = ["id", "schedule", "date", "name"]
        read_only_fields = ["id"]

    def create(self, validated_data: dict) -> Holiday:
        try:
            return super().create(validated_data)
        except IntegrityError:
            raise serializers.ValidationError(
                {"date": "A holiday already exists for this date in this schedule."}
            )

    def update(self, instance: Holiday, validated_data: dict) -> Holiday:
        try:
            return super().update(instance, validated_data)
        except IntegrityError:
            raise serializers.ValidationError(
                {"date": "A holiday already exists for this date in this schedule."}
            )


class DayOverrideSerializer(serializers.ModelSerializer):
    """Serializer for DayOverride model with type validation."""

    VALID_TYPES = [DayOverride.WORKDAY, DayOverride.HOLIDAY]

    class Meta:
        model = DayOverride
        fields = ["id", "schedule", "date", "type", "reason", "swap_with_date"]
        read_only_fields = ["id"]

    def validate_type(self, value: str) -> str:
        if value not in self.VALID_TYPES:
            raise serializers.ValidationError(
                f"type must be one of {self.VALID_TYPES}."
            )
        return value

    def create(self, validated_data: dict) -> DayOverride:
        try:
            return super().create(validated_data)
        except IntegrityError:
            raise serializers.ValidationError(
                {"date": "A day override already exists for this date in this schedule."}
            )

    def update(self, instance: DayOverride, validated_data: dict) -> DayOverride:
        try:
            return super().update(instance, validated_data)
        except IntegrityError:
            raise serializers.ValidationError(
                {"date": "A day override already exists for this date in this schedule."}
            )
