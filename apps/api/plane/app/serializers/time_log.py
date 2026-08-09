# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from plane.db.models import TimeLog

from .base import BaseSerializer
from .issue import IssueFlatSerializer
from .project import ProjectLiteSerializer
from .user import UserLiteSerializer


class TimeLogSerializer(BaseSerializer):
    class Meta:
        model = TimeLog
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "issue",
            "logged_by",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class TimeLogReadSerializer(BaseSerializer):
    logged_by_detail = UserLiteSerializer(read_only=True, source="logged_by")
    created_by_detail = UserLiteSerializer(read_only=True, source="created_by")
    issue_detail = IssueFlatSerializer(read_only=True, source="issue")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")

    class Meta:
        model = TimeLog
        fields = "__all__"
