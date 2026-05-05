# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import IssueWorkLog


class WorklogExportSerializer(serializers.ModelSerializer):
    """Flat export serializer for worklog CSV/XLSX exports."""

    issue_identifier = serializers.SerializerMethodField()
    issue_name = serializers.CharField(source="issue.name", read_only=True, default="")
    logged_by_name = serializers.CharField(source="logged_by.display_name", read_only=True, default="")
    duration_hours = serializers.SerializerMethodField()
    project_name = serializers.CharField(source="project.name", read_only=True, default="")

    class Meta:
        model = IssueWorkLog
        fields = [
            "issue_identifier",
            "issue_name",
            "logged_by_name",
            "duration_hours",
            "logged_at",
            "description",
            "project_name",
        ]

    def get_issue_identifier(self, obj):
        if obj.issue and obj.project:
            return f"{obj.project.identifier}-{obj.issue.sequence_id}"
        return ""

    def get_duration_hours(self, obj):
        if obj.duration_minutes:
            return round(obj.duration_minutes / 60, 2)
        return 0
