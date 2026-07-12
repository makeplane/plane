# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import Milestone, MilestoneIssue


class MilestoneCreateSerializer(BaseSerializer):
    """
    Serializer for creating milestones.

    The public SDK/MCP contract exposes ``title`` while the model field is
    ``name`` (Plane convention, same as Cycle/Module) — mapped via ``source``.
    """

    title = serializers.CharField(source="name", max_length=255, help_text="Milestone title")

    class Meta:
        model = Milestone
        fields = [
            "title",
            "description",
            "target_date",
            "external_source",
            "external_id",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
        ]


class MilestoneUpdateSerializer(MilestoneCreateSerializer):
    """
    Serializer for partially updating milestones — ``title`` becomes optional.
    """

    title = serializers.CharField(source="name", max_length=255, required=False, help_text="Milestone title")

    class Meta(MilestoneCreateSerializer.Meta):
        model = Milestone
        fields = MilestoneCreateSerializer.Meta.fields


class MilestoneSerializer(BaseSerializer):
    """
    Milestone serializer for the public API responses.

    Exposes ``title`` (mapped from the ``name`` model field) plus work item
    counters when the queryset provides the annotations.
    """

    title = serializers.CharField(source="name", read_only=True)
    total_issues = serializers.IntegerField(read_only=True)
    completed_issues = serializers.IntegerField(read_only=True)

    class Meta:
        model = Milestone
        fields = [
            "id",
            "title",
            "description",
            "target_date",
            "sort_order",
            "external_source",
            "external_id",
            "workspace",
            "project",
            "total_issues",
            "completed_issues",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class MilestoneIssueSerializer(BaseSerializer):
    """
    Serializer for milestone-work item relationships.
    """

    class Meta:
        model = MilestoneIssue
        fields = "__all__"
        read_only_fields = ["workspace", "project", "milestone"]
        # The conditional UniqueConstraint on (issue, milestone) would generate a
        # UniqueTogetherValidator making both fields required — deduplication is
        # handled in the view (bulk add), so drop the generated validators.
        validators = []


class MilestoneIssueRequestSerializer(serializers.Serializer):
    """
    Serializer for bulk work item attachment/detachment on a milestone.
    """

    issues = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
        help_text="List of work item IDs to add to or remove from the milestone",
    )
