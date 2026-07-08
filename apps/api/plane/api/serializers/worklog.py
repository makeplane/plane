# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.app.serializers.worklog import (
    MAX_WORKLOG_DESCRIPTION_LENGTH,
    MAX_WORKLOG_DURATION_MINUTES,
)
from plane.db.models import IssueWorkLog

from .base import BaseSerializer


class IssueWorkLogSerializer(BaseSerializer):
    """External API (v1) serializer for work item time-tracking entries.

    ``duration`` is expressed in minutes. Ownership (``logged_by``) and the
    scoping relations (``issue``/``project``/``workspace``) are assigned
    server-side and are read-only for API clients.

    Output keys mirror the ``WorkItemWorkLog`` model of the public Plane
    Python SDK / MCP server: ``project_id``/``workspace_id``/``logged_by``
    are exposed as identifiers (not nested ``project``/``workspace`` keys).
    """

    project_id = serializers.UUIDField(read_only=True)
    workspace_id = serializers.UUIDField(read_only=True)
    logged_by = serializers.UUIDField(source="logged_by_id", read_only=True)
    duration = serializers.IntegerField(min_value=1, max_value=MAX_WORKLOG_DURATION_MINUTES)
    description = serializers.CharField(
        max_length=MAX_WORKLOG_DESCRIPTION_LENGTH, required=False, allow_blank=True
    )

    class Meta:
        model = IssueWorkLog
        fields = [
            "id",
            "logged_by",
            "duration",
            "description",
            "workspace_id",
            "project_id",
            "external_source",
            "external_id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        # project_id / workspace_id / logged_by are declared explicitly above
        # (already read-only); listing them here would raise an assertion.
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
