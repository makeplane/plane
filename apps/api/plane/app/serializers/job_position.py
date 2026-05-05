# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import JobGrade, JobPosition
from .base import BaseSerializer


class JobGradeSerializer(BaseSerializer):
    """Serializer for standalone JobGrade (parent entity)."""

    class Meta:
        model = JobGrade
        fields = ["id", "name", "description", "sort_order", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class JobPositionSerializer(BaseSerializer):
    """Serializer for JobPosition (child of JobGrade)."""

    class Meta:
        model = JobPosition
        fields = [
            "id",
            "job_grade",
            "name",
            "description",
            "sort_order",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        job_grade = attrs.get("job_grade", getattr(self.instance, "job_grade", None))
        if job_grade and not job_grade.is_active:
            raise serializers.ValidationError({"job_grade": "Job grade is not active."})
        return attrs
