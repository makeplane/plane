# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from rest_framework import serializers

# Module imports
from plane.db.models import PomodoroTimer

from .base import BaseSerializer
from .issue import IssueFlatSerializer
from .project import ProjectLiteSerializer
from .user import UserLiteSerializer


class PomodoroTimerSerializer(BaseSerializer):
    """Write serializer for a pomodoro timer.

    `issue_id` is the only client-supplied identifier; `workspace`, `project`,
    `started_by` and `started_at` are derived server-side.
    """

    issue_id = serializers.UUIDField(write_only=True)
    duration_minutes = serializers.IntegerField(required=False, min_value=1, max_value=1440)
    description = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = PomodoroTimer
        fields = [
            "id",
            "issue",
            "issue_id",
            "project",
            "workspace",
            "started_by",
            "started_at",
            "duration_minutes",
            "paused_seconds",
            "status",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "issue",
            "project",
            "workspace",
            "started_by",
            "started_at",
            "paused_seconds",
            "status",
            "created_at",
            "updated_at",
        ]


class PomodoroTimerReadSerializer(BaseSerializer):
    started_by_detail = UserLiteSerializer(read_only=True, source="started_by")
    issue_detail = IssueFlatSerializer(read_only=True, source="issue")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")

    class Meta:
        model = PomodoroTimer
        fields = "__all__"
