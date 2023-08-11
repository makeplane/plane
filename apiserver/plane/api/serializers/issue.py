# Django imports
from django.utils import timezone

# Third Party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from .user import UserLiteSerializer
from .state import StateSerializer, StateLiteSerializer
from .user import UserLiteSerializer
from .project import ProjectSerializer, ProjectLiteSerializer
from .workspace import WorkspaceLiteSerializer
from plane.db.models import (
    User,
    Issue,
    IssueActivity,
    IssueComment,
    IssueProperty,
    IssueBlocker,
    IssueAssignee,
    IssueSubscriber,
    IssueLabel,
    Label,
    IssueBlocker,
    CycleIssue,
    Cycle,
    Module,
    ModuleIssue,
    IssueLink,
    IssueAttachment,
    IssueReaction,
    CommentReaction,
)


class IssueFlatSerializer(BaseSerializer):
    ## Contain only flat fields

    class Meta:
        model = Issue
        fields = [
            "id",
            "name",
            "description",
            "description_html",
            "priority",
            "start_date",
            "target_date",
            "sequence_id",
            "sort_order",
        ]


class IssueProjectLiteSerializer(BaseSerializer):
    project_detail = ProjectLiteSerializer(source="project", read_only=True)

    class Meta:
        model = Issue
        fields = [
            "id",
            "project_detail",
            "name",
            "sequence_id",
        ]
        read_only_fields = fields


##TODO: Find a better way to write this serializer
## Find a better approach to save manytomany?
class IssueCreateSerializer(BaseSerializer):
    state_detail = StateSerializer(read_only=True, source="state")
    created_by_detail = UserLiteSerializer(read_only=True, source="created_by")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")
    workspace_detail = WorkspaceLiteSerializer(read_only=True, source="workspace")

    assignees_list = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all()),
        write_only=True,
        required=False,
    )

    # List of issues that are blocking this issue
    blockers_list = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Issue.objects.all()),
        write_only=True,
        required=False,
    )
    labels_list = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Label.objects.all()),
        write_only=True,
        required=False,
    )

    # List of issues that are blocked by this issue
    blocks_list = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Issue.objects.all()),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Issue
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def validate(self, data):
        if data.get("start_date", None) is not None and data.get("target_date", None) is not None and data.get("start_date", None) > data.get("target_date", None):
            raise serializers.ValidationError("Start date cannot exceed target date")
        return data

    def create(self, validated_data):
        blockers = validated_data.pop("blockers_list", None)
        assignees = validated_data.pop("assignees_list", None)
        labels = validated_data.pop("labels_list", None)
        blocks = validated_data.pop("blocks_list", None)

        project_id = self.context["project_id"]
        workspace_id = self.context["workspace_id"]
        default_assignee_id = self.context["default_assignee_id"]

        issue = Issue.objects.create(**validated_data, project_id=project_id)

        # Issue Audit Users
        created_by_id = issue.created_by_id
        updated_by_id = issue.updated_by_id

        if blockers is not None and len(blockers):
            IssueBlocker.objects.bulk_create(
                [
                    IssueBlocker(
                        block=issue,
                        blocked_by=blocker,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for blocker in blockers
                ],
                batch_size=10,
            )

        if assignees is not None and len(assignees):
            IssueAssignee.objects.bulk_create(
                [
                    IssueAssignee(
                        assignee=user,
                        issue=issue,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for user in assignees
                ],
                batch_size=10,
            )
        else:
            # Then assign it to default assignee
            if default_assignee_id is not None:
                IssueAssignee.objects.create(
                    assignee_id=default_assignee_id,
                    issue=issue,
                    project_id=project_id,
                    workspace_id=workspace_id,
                    created_by_id=created_by_id,
                    updated_by_id=updated_by_id,
                )

        if labels is not None and len(labels):
            IssueLabel.objects.bulk_create(
                [
                    IssueLabel(
                        label=label,
                        issue=issue,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for label in labels
                ],
                batch_size=10,
            )

        if blocks is not None and len(blocks):
            IssueBlocker.objects.bulk_create(
                [
                    IssueBlocker(
                        block=block,
                        blocked_by=issue,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for block in blocks
                ],
                batch_size=10,
            )

        return issue

    def update(self, instance, validated_data):
        blockers = validated_data.pop("blockers_list", None)
        assignees = validated_data.pop("assignees_list", None)
        labels = validated_data.pop("labels_list", None)
        blocks = validated_data.pop("blocks_list", None)

        # Related models
        project_id = instance.project_id
        workspace_id = instance.workspace_id
        created_by_id = instance.created_by_id
        updated_by_id = instance.updated_by_id

        if blockers is not None:
            IssueBlocker.objects.filter(block=instance).delete()
            IssueBlocker.objects.bulk_create(
                [
                    IssueBlocker(
                        block=instance,
                        blocked_by=blocker,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for blocker in blockers
                ],
                batch_size=10,
            )

        if assignees is not None:
            IssueAssignee.objects.filter(issue=instance).delete()
            IssueAssignee.objects.bulk_create(
                [
                    IssueAssignee(
                        assignee=user,
                        issue=instance,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for user in assignees
                ],
                batch_size=10,
            )

        if labels is not None:
            IssueLabel.objects.filter(issue=instance).delete()
            IssueLabel.objects.bulk_create(
                [
                    IssueLabel(
                        label=label,
                        issue=instance,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for label in labels
                ],
                batch_size=10,
            )

        if blocks is not None:
            IssueBlocker.objects.filter(blocked_by=instance).delete()
            IssueBlocker.objects.bulk_create(
                [
                    IssueBlocker(
                        block=block,
                        blocked_by=instance,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for block in blocks
                ],
                batch_size=10,
            )

        # Time updation occues even when other related models are updated
        instance.updated_at = timezone.now()
        return super().update(instance, validated_data)


class IssueActivitySerializer(BaseSerializer):
    actor_detail = UserLiteSerializer(read_only=True, source="actor")
    issue_detail = IssueFlatSerializer(read_only=True, source="issue")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")

    class Meta:
        model = IssueActivity
        fields = "__all__"


class IssueCommentSerializer(BaseSerializer):
    actor_detail = UserLiteSerializer(read_only=True, source="actor")
    issue_detail = IssueFlatSerializer(read_only=True, source="issue")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")
    workspace_detail = WorkspaceLiteSerializer(read_only=True, source="workspace")

    class Meta:
        model = IssueComment
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "issue",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class IssuePropertySerializer(BaseSerializer):
    class Meta:
        model = IssueProperty
        fields = "__all__"
        read_only_fields = [
            "user",
            "workspace",
            "project",
        ]


class LabelSerializer(BaseSerializer):
    workspace_detail = WorkspaceLiteSerializer(source="workspace", read_only=True)
    project_detail = ProjectLiteSerializer(source="project", read_only=True)

    class Meta:
        model = Label
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
        ]


class LabelLiteSerializer(BaseSerializer):
    class Meta:
        model = Label
        fields = [
            "id",
            "name",
            "color",
        ]


class IssueLabelSerializer(BaseSerializer):
    # label_details = LabelSerializer(read_only=True, source="label")

    class Meta:
        model = IssueLabel
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
        ]


class BlockedIssueSerializer(BaseSerializer):
    blocked_issue_detail = IssueProjectLiteSerializer(source="block", read_only=True)

    class Meta:
        model = IssueBlocker
        fields = [
            "blocked_issue_detail",
            "blocked_by",
            "block",
        ]
        read_only_fields = fields


class BlockerIssueSerializer(BaseSerializer):
    blocker_issue_detail = IssueProjectLiteSerializer(
        source="blocked_by", read_only=True
    )

    class Meta:
        model = IssueBlocker
        fields = [
            "blocker_issue_detail",
            "blocked_by",
            "block",
        ]
        read_only_fields = fields


class IssueAssigneeSerializer(BaseSerializer):
    assignee_details = UserLiteSerializer(read_only=True, source="assignee")

    class Meta:
        model = IssueAssignee
        fields = "__all__"


class CycleBaseSerializer(BaseSerializer):
    class Meta:
        model = Cycle
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class IssueCycleDetailSerializer(BaseSerializer):
    cycle_detail = CycleBaseSerializer(read_only=True, source="cycle")

    class Meta:
        model = CycleIssue
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class ModuleBaseSerializer(BaseSerializer):
    class Meta:
        model = Module
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class IssueModuleDetailSerializer(BaseSerializer):
    module_detail = ModuleBaseSerializer(read_only=True, source="module")

    class Meta:
        model = ModuleIssue
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class IssueLinkSerializer(BaseSerializer):
    created_by_detail = UserLiteSerializer(read_only=True, source="created_by")

    class Meta:
        model = IssueLink
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "issue",
        ]

    # Validation if url already exists
    def create(self, validated_data):
        if IssueLink.objects.filter(
            url=validated_data.get("url"), issue_id=validated_data.get("issue_id")
        ).exists():
            raise serializers.ValidationError(
                {"error": "URL already exists for this Issue"}
            )
        return IssueLink.objects.create(**validated_data)


class IssueAttachmentSerializer(BaseSerializer):
    class Meta:
        model = IssueAttachment
        fields = "__all__"
        read_only_fields = [
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "workspace",
            "project",
            "issue",
        ]


class IssueReactionSerializer(BaseSerializer):
    class Meta:
        model = IssueReaction
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "issue",
            "actor",
        ]


class IssueReactionLiteSerializer(BaseSerializer):
    actor_detail = UserLiteSerializer(read_only=True, source="actor")

    class Meta:
        model = IssueReaction
        fields = [
            "id",
            "reaction",
            "issue",
            "actor_detail",
        ]


class CommentReactionLiteSerializer(BaseSerializer):
    actor_detail = UserLiteSerializer(read_only=True, source="actor")

    class Meta:
        model = CommentReaction
        fields = [
            "id",
            "reaction",
            "comment",
            "actor_detail",
        ]


class CommentReactionSerializer(BaseSerializer):
    class Meta:
        model = CommentReaction
        fields = "__all__"
        read_only_fields = ["workspace", "project", "comment", "actor"]



class IssueCommentSerializer(BaseSerializer):
    actor_detail = UserLiteSerializer(read_only=True, source="actor")
    issue_detail = IssueFlatSerializer(read_only=True, source="issue")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")
    workspace_detail = WorkspaceLiteSerializer(read_only=True, source="workspace")
    comment_reactions = CommentReactionLiteSerializer(read_only=True, many=True)


    class Meta:
        model = IssueComment
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "issue",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class IssueStateFlatSerializer(BaseSerializer):
    state_detail = StateLiteSerializer(read_only=True, source="state")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")

    class Meta:
        model = Issue
        fields = [
            "id",
            "sequence_id",
            "name",
            "state_detail",
            "project_detail",
        ]


# Issue Serializer with state details
class IssueStateSerializer(BaseSerializer):
    label_details = LabelLiteSerializer(read_only=True, source="labels", many=True)
    state_detail = StateLiteSerializer(read_only=True, source="state")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")
    assignee_details = UserLiteSerializer(read_only=True, source="assignees", many=True)
    sub_issues_count = serializers.IntegerField(read_only=True)
    bridge_id = serializers.UUIDField(read_only=True)
    attachment_count = serializers.IntegerField(read_only=True)
    link_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Issue
        fields = "__all__"


class IssueSerializer(BaseSerializer):
    project_detail = ProjectLiteSerializer(read_only=True, source="project")
    state_detail = StateSerializer(read_only=True, source="state")
    parent_detail = IssueStateFlatSerializer(read_only=True, source="parent")
    label_details = LabelSerializer(read_only=True, source="labels", many=True)
    assignee_details = UserLiteSerializer(read_only=True, source="assignees", many=True)
    # List of issues blocked by this issue
    blocked_issues = BlockedIssueSerializer(read_only=True, many=True)
    # List of issues that block this issue
    blocker_issues = BlockerIssueSerializer(read_only=True, many=True)
    issue_cycle = IssueCycleDetailSerializer(read_only=True)
    issue_module = IssueModuleDetailSerializer(read_only=True)
    issue_link = IssueLinkSerializer(read_only=True, many=True)
    issue_attachment = IssueAttachmentSerializer(read_only=True, many=True)
    sub_issues_count = serializers.IntegerField(read_only=True)
    issue_reactions = IssueReactionLiteSerializer(read_only=True, many=True)

    class Meta:
        model = Issue
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class IssueLiteSerializer(BaseSerializer):
    workspace_detail = WorkspaceLiteSerializer(read_only=True, source="workspace")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")
    state_detail = StateLiteSerializer(read_only=True, source="state")
    label_details = LabelLiteSerializer(read_only=True, source="labels", many=True)
    assignee_details = UserLiteSerializer(read_only=True, source="assignees", many=True)
    sub_issues_count = serializers.IntegerField(read_only=True)
    cycle_id = serializers.UUIDField(read_only=True)
    module_id = serializers.UUIDField(read_only=True)
    attachment_count = serializers.IntegerField(read_only=True)
    link_count = serializers.IntegerField(read_only=True)
    issue_reactions = IssueReactionLiteSerializer(read_only=True, many=True)

    class Meta:
        model = Issue
        fields = "__all__"
        read_only_fields = [
            "start_date",
            "target_date",
            "completed_at",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class IssueSubscriberSerializer(BaseSerializer):
    class Meta:
        model = IssueSubscriber
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "issue",
        ]
