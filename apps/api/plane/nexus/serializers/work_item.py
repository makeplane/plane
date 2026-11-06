# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Serializers for the work_item feature group (plane-sdk WorkItemWorkLog, WorkItemWithRelationType)."""

from rest_framework import serializers

from plane.db.models import IssueAssignee, IssueLabel
from plane.nexus.models import WorkItemWorkLog


class WorkItemWorkLogSerializer(serializers.ModelSerializer):
    """plane-sdk WorkItemWorkLog. duration is in minutes."""

    project_id = serializers.UUIDField(read_only=True)
    workspace_id = serializers.UUIDField(read_only=True)
    issue_id = serializers.UUIDField(read_only=True)
    logged_by = serializers.UUIDField(source="logged_by_id", read_only=True)
    created_by = serializers.UUIDField(source="created_by_id", read_only=True)
    updated_by = serializers.UUIDField(source="updated_by_id", read_only=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=10000)
    duration = serializers.IntegerField(min_value=1, max_value=60 * 24 * 365)

    class Meta:
        model = WorkItemWorkLog
        fields = [
            "id",
            "description",
            "duration",
            "logged_by",
            "issue_id",
            "project_id",
            "workspace_id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_description(self, value):
        return value or ""


def related_work_items(issues, relation_type_of) -> list[dict]:
    """plane-sdk WorkItemWithRelationType rows for `issues`.

    `relation_type_of(issue)` gives the label from the viewed work item's side.
    """
    issues = list(issues)
    ids = [issue.id for issue in issues]
    labels: dict = {}
    for issue_id, label_id in IssueLabel.objects.filter(issue_id__in=ids).values_list("issue_id", "label_id"):
        labels.setdefault(issue_id, []).append(str(label_id))
    assignees: dict = {}
    for issue_id, user_id in IssueAssignee.objects.filter(issue_id__in=ids).values_list("issue_id", "assignee_id"):
        assignees.setdefault(issue_id, []).append(str(user_id))

    def as_str(value):
        return str(value) if value is not None else None

    return [
        {
            "id": str(issue.id),
            "name": issue.name,
            "sequence_id": issue.sequence_id,
            "project_id": str(issue.project_id),
            "project_identifier": issue.project.identifier,
            "state_id": as_str(issue.state_id),
            "priority": issue.priority,
            "type_id": as_str(issue.type_id),
            "is_epic": bool(issue.type and issue.type.is_epic),
            "label_ids": labels.get(issue.id, []),
            "assignee_ids": assignees.get(issue.id, []),
            "sort_order": issue.sort_order,
            "created_at": issue.created_at.isoformat() if issue.created_at else None,
            "updated_at": issue.updated_at.isoformat() if issue.updated_at else None,
            "created_by": as_str(issue.created_by_id),
            "updated_by": as_str(issue.updated_by_id),
            "relation_type": relation_type_of(issue),
        }
        for issue in issues
    ]
