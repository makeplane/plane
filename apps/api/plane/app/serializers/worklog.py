# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import IssueWorkLog

from .base import BaseSerializer
from .user import UserLiteSerializer

# One year of minutes — sanity ceiling for a single time-tracking entry.
MAX_WORKLOG_DURATION_MINUTES = 525600
MAX_WORKLOG_DESCRIPTION_LENGTH = 5000


class IssueWorkLogSerializer(BaseSerializer):
    """Serializer for time-tracking entries (worklogs) on a work item.

    ``duration`` is expressed in minutes. Ownership (``logged_by``) and the
    scoping relations (``issue``/``project``/``workspace``) are set server-side
    and are never client-writable.
    """

    logged_by_detail = UserLiteSerializer(read_only=True, source="logged_by")
    duration = serializers.IntegerField(min_value=1, max_value=MAX_WORKLOG_DURATION_MINUTES)
    description = serializers.CharField(
        max_length=MAX_WORKLOG_DESCRIPTION_LENGTH, required=False, allow_blank=True
    )

    class Meta:
        model = IssueWorkLog
        fields = [
            "id",
            "issue",
            "logged_by",
            "logged_by_detail",
            "duration",
            "description",
            "workspace",
            "project",
            "external_source",
            "external_id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "issue",
            "logged_by",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
