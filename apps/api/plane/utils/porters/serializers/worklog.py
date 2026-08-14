# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.app.serializers.base import BaseSerializer
from plane.db.models import IssueWorklog


class IssueWorklogExportSerializer(BaseSerializer):
    work_item_identifier = serializers.SerializerMethodField()
    work_item_name = serializers.CharField(source="issue.name", read_only=True, default="")
    project_identifier = serializers.CharField(source="project.identifier", read_only=True, default="")
    project_name = serializers.CharField(source="project.name", read_only=True, default="")
    actor_name = serializers.CharField(source="actor.full_name", read_only=True, default="")
    duration_seconds = serializers.IntegerField(source="duration", read_only=True)
    duration_hours = serializers.SerializerMethodField()

    class Meta:
        model = IssueWorklog
        fields = [
            "id",
            "project_identifier",
            "project_name",
            "work_item_identifier",
            "work_item_name",
            "actor_name",
            "duration_seconds",
            "duration_hours",
            "description",
            "logged_at",
            "created_at",
        ]

    def get_work_item_identifier(self, obj):
        if not obj.issue_id or not obj.project_id:
            return ""
        return f"{obj.project.identifier}-{obj.issue.sequence_id}"

    def get_duration_hours(self, obj):
        return round((obj.duration or 0) / 3600, 4)
