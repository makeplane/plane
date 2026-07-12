# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import Milestone, MilestoneIssue


class MilestoneWriteSerializer(BaseSerializer):
    class Meta:
        model = Milestone
        fields = "__all__"
        # `fields="__all__"` would otherwise let a PATCH payload reassign audit
        # attribution (created_by/updated_by), soft-delete (deleted_at) or reorder
        # (sort_order) — none of these are legitimate client input.
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "deleted_at",
            "sort_order",
        ]


class MilestoneSerializer(BaseSerializer):
    total_issues = serializers.IntegerField(read_only=True)
    completed_issues = serializers.IntegerField(read_only=True)

    class Meta:
        model = Milestone
        fields = [
            # necessary fields
            "id",
            "workspace_id",
            "project_id",
            # model fields
            "name",
            "description",
            "target_date",
            "sort_order",
            "external_source",
            "external_id",
            # meta fields
            "total_issues",
            "completed_issues",
            "created_at",
            "updated_at",
            "created_by",
        ]
        read_only_fields = fields


class MilestoneIssueSerializer(BaseSerializer):
    class Meta:
        model = MilestoneIssue
        fields = "__all__"
        read_only_fields = ["workspace", "project", "milestone"]
        # The conditional UniqueConstraint on (issue, milestone) would generate a
        # UniqueTogetherValidator making both fields required — deduplication is
        # handled in the view (bulk add), so drop the generated validators.
        validators = []
