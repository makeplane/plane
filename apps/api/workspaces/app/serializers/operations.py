# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Serializers for the Engineering Operations layer."""

# Third party imports
from rest_framework import serializers

# Module imports
from workspaces.db.models import (
    Deployment,
    OperationsRecord,
    OperationsSetting,
    OperationsTicket,
    OperationsTicketActivity,
    OperationsTicketComment,
    WorkLog,
)
from workspaces.utils.content_validator import validate_html_content

from .base import BaseSerializer, DynamicBaseSerializer


class HTMLDescriptionMixin:
    """
    Sanitise every rich-text field before it is stored.

    The same guard Workspaces puts on stickies and comments. Operations tickets and
    records are written by people outside engineering and read by everybody, so
    they are exactly the wrong place to trust incoming markup.
    """

    HTML_FIELDS = ()

    def validate(self, data):
        for field in self.HTML_FIELDS:
            if data.get(field):
                is_valid, _error, sanitized = validate_html_content(data[field])
                if not is_valid:
                    raise serializers.ValidationError({field: "html content is not valid"})
                if sanitized is not None:
                    data[field] = sanitized
        return super().validate(data)


class WorkspaceScopedRelationsMixin:
    """
    Refuse a related object that belongs to a different workspace.

    ``project`` and ``module`` are writable primary-key fields, and DRF's
    default queryset for them is every row in the table. Without this a
    workspace member could file their work log -- or point an operations
    ticket -- at a project id belonging to somebody else's workspace. The row
    would still live in their own workspace, so nothing leaks outward, but the
    record would name a project they cannot see and every join through it
    would behave strangely from then on.

    The workspace comes from the view's context, never from the payload, so
    there is nothing here for a caller to influence.
    """

    SCOPED_FIELDS = ("project",)

    def validate(self, data):
        workspace_id = self.context.get("workspace_id")
        # On a partial update the view has no reason to re-resolve it; the
        # instance already knows which workspace it is in.
        if workspace_id is None and getattr(self, "instance", None) is not None:
            workspace_id = self.instance.workspace_id

        if workspace_id is not None:
            for field in self.SCOPED_FIELDS:
                related = data.get(field)
                if related is not None and str(related.workspace_id) != str(workspace_id):
                    raise serializers.ValidationError({field: "That does not belong to this workspace."})

        return super().validate(data)


class WorkLogSerializer(WorkspaceScopedRelationsMixin, HTMLDescriptionMixin, DynamicBaseSerializer):
    issue_ids = serializers.ListField(child=serializers.UUIDField(), required=False, write_only=True)
    issues = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = WorkLog
        fields = [
            "id",
            "workspace",
            "project",
            "owner",
            "date",
            "summary",
            "worked_on",
            "meetings",
            "research",
            "production_support",
            "deployment",
            "blockers",
            "tomorrow_plan",
            "time_spent",
            "submitted_at",
            "created_at",
            "updated_at",
            "issue_ids",
            "issues",
        ]
        read_only_fields = ["id", "workspace", "owner", "submitted_at", "created_at", "updated_at"]

    def get_issues(self, obj):
        # `work_log_issues` is prefetched with its issue and project by the
        # viewset; reading it here costs nothing extra.
        return [
            {
                "id": str(link.issue_id),
                "name": link.issue.name,
                "sequence_id": link.issue.sequence_id,
                "project_id": str(link.issue.project_id),
                "state_id": str(link.issue.state_id) if link.issue.state_id else None,
            }
            for link in obj.work_log_issues.all()
        ]

    def validate_time_spent(self, value):
        # A day has 24 hours and a log that claims more is a typo, not a fact.
        if value is not None and (value < 0 or value > 24):
            raise serializers.ValidationError("Time spent must be between 0 and 24 hours.")
        return value


class OperationsTicketSerializer(WorkspaceScopedRelationsMixin, HTMLDescriptionMixin, DynamicBaseSerializer):
    HTML_FIELDS = ("description_html",)
    SCOPED_FIELDS = ("project", "module")

    class Meta:
        model = OperationsTicket
        fields = [
            "id",
            "workspace",
            "sequence_id",
            "name",
            "description_json",
            "description_html",
            "description_stripped",
            "status",
            "source",
            "priority",
            "requested_by",
            "requester_name",
            "requester_email",
            "assignee",
            "project",
            "module",
            "converted_issue",
            "converted_at",
            "reviewed_at",
            "closed_at",
            "target_date",
            "created_at",
            "created_by",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "sequence_id",
            "description_stripped",
            # Status moves through the lifecycle endpoint, never through a
            # PATCH: every transition has to leave an audit row behind, and a
            # serializer cannot write one.
            "status",
            "converted_issue",
            "converted_at",
            "reviewed_at",
            "closed_at",
            "created_at",
            "created_by",
            "updated_at",
        ]


class OperationsTicketCommentSerializer(HTMLDescriptionMixin, BaseSerializer):
    HTML_FIELDS = ("comment_html",)

    class Meta:
        model = OperationsTicketComment
        fields = [
            "id",
            "workspace",
            "ticket",
            "actor",
            "comment_json",
            "comment_html",
            "comment_stripped",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace", "ticket", "actor", "comment_stripped", "created_at", "updated_at"]


class OperationsTicketActivitySerializer(BaseSerializer):
    class Meta:
        model = OperationsTicketActivity
        fields = ["id", "ticket", "actor", "verb", "field", "old_value", "new_value", "comment", "created_at"]
        read_only_fields = fields


class OperationsRecordSerializer(WorkspaceScopedRelationsMixin, HTMLDescriptionMixin, DynamicBaseSerializer):
    HTML_FIELDS = ("description_html",)

    participant_ids = serializers.ListField(child=serializers.UUIDField(), required=False, write_only=True)
    issue_ids = serializers.ListField(child=serializers.UUIDField(), required=False, write_only=True)
    participants = serializers.SerializerMethodField(read_only=True)
    issues = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = OperationsRecord
        fields = [
            "id",
            "workspace",
            "project",
            "record_type",
            "name",
            "description_json",
            "description_html",
            "description_stripped",
            "occurred_at",
            "metadata",
            "created_at",
            "created_by",
            "updated_at",
            "participant_ids",
            "issue_ids",
            "participants",
            "issues",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "description_stripped",
            "created_at",
            "created_by",
            "updated_at",
        ]

    def get_participants(self, obj):
        return [str(link.member_id) for link in obj.record_participants.all()]

    def get_issues(self, obj):
        return [
            {
                "id": str(link.issue_id),
                "name": link.issue.name,
                "sequence_id": link.issue.sequence_id,
                "project_id": str(link.issue.project_id),
            }
            for link in obj.record_issues.all()
        ]


class DeploymentSerializer(HTMLDescriptionMixin, DynamicBaseSerializer):
    HTML_FIELDS = ("release_notes_html",)

    issue_ids = serializers.ListField(child=serializers.UUIDField(), required=False, write_only=True)
    issues = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Deployment
        fields = [
            "id",
            "workspace",
            "project",
            "version",
            "environment",
            "status",
            "deployed_by",
            "scheduled_for",
            "started_at",
            "completed_at",
            "notes",
            "release_notes_html",
            "rolled_back_from",
            "created_at",
            "created_by",
            "updated_at",
            "issue_ids",
            "issues",
        ]
        read_only_fields = ["id", "workspace", "project", "created_at", "created_by", "updated_at"]

    def get_issues(self, obj):
        return [
            {
                "id": str(link.issue_id),
                "name": link.issue.name,
                "sequence_id": link.issue.sequence_id,
                "project_id": str(link.issue.project_id),
            }
            for link in obj.deployment_issues.all()
        ]


class OperationsSettingSerializer(BaseSerializer):
    class Meta:
        model = OperationsSetting
        fields = ["id", "workspace", "config", "created_at", "updated_at"]
        read_only_fields = ["id", "workspace", "created_at", "updated_at"]
