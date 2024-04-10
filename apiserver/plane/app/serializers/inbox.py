# Third party frameworks
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from .issue import (
    IssueInboxSerializer,
    LabelLiteSerializer,
    IssueDetailSerializer,
)
from .project import ProjectLiteSerializer
from .state import StateLiteSerializer
from .user import UserLiteSerializer
from plane.db.models import Inbox, InboxIssue, Issue


class InboxSerializer(BaseSerializer):
    project_detail = ProjectLiteSerializer(source="project", read_only=True)
    pending_issue_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Inbox
        fields = "__all__"
        read_only_fields = [
            "project",
            "workspace",
        ]


class InboxIssueSerializer(BaseSerializer):
    issue = IssueInboxSerializer(read_only=True)

    class Meta:
        model = InboxIssue
        fields = [
            "id",
            "status",
            "duplicate_to",
            "snoozed_till",
            "source",
            "issue",
            "created_by",
        ]
        read_only_fields = [
            "project",
            "workspace",
        ]

    def to_representation(self, instance):
        # Pass the annotated fields to the Issue instance if they exist
        if hasattr(instance, "label_ids"):
            instance.issue.label_ids = instance.label_ids
        return super().to_representation(instance)


class InboxIssueDetailSerializer(BaseSerializer):
    issue = IssueDetailSerializer(read_only=True)
    duplicate_issue_detail = IssueInboxSerializer(
        read_only=True, source="duplicate_to"
    )

    class Meta:
        model = InboxIssue
        fields = [
            "id",
            "status",
            "duplicate_to",
            "snoozed_till",
            "duplicate_issue_detail",
            "source",
            "issue",
        ]
        read_only_fields = [
            "project",
            "workspace",
        ]

    def to_representation(self, instance):
        # Pass the annotated fields to the Issue instance if they exist
        if hasattr(instance, "assignee_ids"):
            instance.issue.assignee_ids = instance.assignee_ids
        if hasattr(instance, "label_ids"):
            instance.issue.label_ids = instance.label_ids

        return super().to_representation(instance)


class InboxIssueLiteSerializer(BaseSerializer):
    class Meta:
        model = InboxIssue
        fields = ["id", "status", "duplicate_to", "snoozed_till", "source"]
        read_only_fields = fields


class IssueStateInboxSerializer(BaseSerializer):
    state_detail = StateLiteSerializer(read_only=True, source="state")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")
    label_details = LabelLiteSerializer(
        read_only=True, source="labels", many=True
    )
    assignee_details = UserLiteSerializer(
        read_only=True, source="assignees", many=True
    )
    sub_issues_count = serializers.IntegerField(read_only=True)
    issue_inbox = InboxIssueLiteSerializer(read_only=True, many=True)

    class Meta:
        model = Issue
        fields = "__all__"
