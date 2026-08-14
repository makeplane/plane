# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.app.serializers.base import BaseSerializer
from plane.app.serializers.user import UserLiteSerializer
from plane.db.models import IssueWorklog
from plane.utils.worklog import validate_worklog_duration


class IssueWorklogSerializer(BaseSerializer):
    actor_detail = UserLiteSerializer(read_only=True, source="actor")

    class Meta:
        model = IssueWorklog
        fields = [
            "id",
            "issue",
            "project",
            "workspace",
            "actor",
            "actor_detail",
            "duration",
            "description",
            "logged_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "issue",
            "project",
            "workspace",
            "actor",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def validate_description(self, value):
        if value is None:
            return ""
        if not isinstance(value, str):
            raise serializers.ValidationError("Description must be a string.")
        if len(value) > 2000:
            raise serializers.ValidationError("Description is too long.")
        return value

    def validate_duration(self, value):
        try:
            return validate_worklog_duration(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc
