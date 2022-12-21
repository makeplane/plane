# Third Party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from .user import UserLiteSerializer
from .state import StateSerializer
from .user import UserLiteSerializer
from .project import ProjectSerializer
from .workspace import WorkSpaceSerializer
from plane.db.models import (
    User,
    Issue,
    IssueActivity,
    IssueComment,
    TimelineIssue,
    IssueProperty,
    IssueBlocker,
    IssueAssignee,
    IssueLabel,
    Label,
    IssueBlocker,
    CycleIssue,
    Cycle,
)


class IssueFlatSerializer(BaseSerializer):
    ## Contain only flat fields

    class Meta:
        model = Issue
        fields = [
            "id",
            "name",
            "description",
            "priority",
            "start_date",
            "target_date",
            "sequence_id",
        ]


# Issue Serializer with state details
class IssueStateSerializer(BaseSerializer):

    state_detail = StateSerializer(read_only=True, source="state")

    class Meta:
        model = Issue
        fields = "__all__"


##TODO: Find a better way to write this serializer
## Find a better approach to save manytomany?
class IssueCreateSerializer(BaseSerializer):

    state_detail = StateSerializer(read_only=True, source="state")
    created_by_detail = UserLiteSerializer(read_only=True, source="created_by")
    project_detail = ProjectSerializer(read_only=True, source="project")
    workspace_detail = WorkSpaceSerializer(read_only=True, source="workspace")

    assignees_list = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all()),
        write_only=True,
        required=False,
    )
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

    def create(self, validated_data):
        blockers = validated_data.pop("blockers_list", None)
        assignees = validated_data.pop("assignees_list", None)
        labels = validated_data.pop("labels_list", None)

        project = self.context["project"]
        issue = Issue.objects.create(**validated_data, project=project)

        if blockers is not None:
            IssueBlocker.objects.bulk_create(
                [
                    IssueBlocker(
                        block=issue,
                        blocked_by=blocker,
                        project=project,
                        workspace=project.workspace,
                        created_by=issue.created_by,
                        updated_by=issue.updated_by,
                    )
                    for blocker in blockers
                ],
                batch_size=10,
            )

        if assignees is not None:
            IssueAssignee.objects.bulk_create(
                [
                    IssueAssignee(
                        assignee=user,
                        issue=issue,
                        project=project,
                        workspace=project.workspace,
                        created_by=issue.created_by,
                        updated_by=issue.updated_by,
                    )
                    for user in assignees
                ],
                batch_size=10,
            )

        if labels is not None:
            IssueLabel.objects.bulk_create(
                [
                    IssueLabel(
                        label=label,
                        issue=issue,
                        project=project,
                        workspace=project.workspace,
                        created_by=issue.created_by,
                        updated_by=issue.updated_by,
                    )
                    for label in labels
                ],
                batch_size=10,
            )

        return issue

    def update(self, instance, validated_data):

        blockers = validated_data.pop("blockers_list", None)
        assignees = validated_data.pop("assignees_list", None)
        labels = validated_data.pop("labels_list", None)

        if blockers is not None:
            IssueBlocker.objects.filter(block=instance).delete()
            IssueBlocker.objects.bulk_create(
                [
                    IssueBlocker(
                        block=instance,
                        blocked_by=blocker,
                        project=instance.project,
                        workspace=instance.project.workspace,
                        created_by=instance.created_by,
                        updated_by=instance.updated_by,
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
                        project=instance.project,
                        workspace=instance.project.workspace,
                        created_by=instance.created_by,
                        updated_by=instance.updated_by,
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
                        project=instance.project,
                        workspace=instance.project.workspace,
                        created_by=instance.created_by,
                        updated_by=instance.updated_by,
                    )
                    for label in labels
                ],
                batch_size=10,
            )

        return super().update(instance, validated_data)


class IssueActivitySerializer(BaseSerializer):

    actor_detail = UserLiteSerializer(read_only=True, source="actor")

    class Meta:
        model = IssueActivity
        fields = "__all__"


class IssueCommentSerializer(BaseSerializer):

    actor_detail = UserLiteSerializer(read_only=True, source="actor")
    issue_detail = IssueFlatSerializer(read_only=True, source="issue")
    project_detail = ProjectSerializer(read_only=True, source="project")

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


class TimeLineIssueSerializer(BaseSerializer):
    class Meta:
        model = TimelineIssue
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
    class Meta:
        model = Label
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
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

    blocked_issue_detail = IssueFlatSerializer(source="block", read_only=True)

    class Meta:
        model = IssueBlocker
        fields = "__all__"


class BlockerIssueSerializer(BaseSerializer):

    blocker_issue_detail = IssueFlatSerializer(source="blocked_by", read_only=True)

    class Meta:
        model = IssueBlocker
        fields = "__all__"


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


class IssueSerializer(BaseSerializer):
    project_detail = ProjectSerializer(read_only=True, source="project")
    state_detail = StateSerializer(read_only=True, source="state")
    parent_detail = IssueFlatSerializer(read_only=True, source="parent")
    label_details = LabelSerializer(read_only=True, source="labels", many=True)
    assignee_details = UserLiteSerializer(read_only=True, source="assignees", many=True)
    blocked_issues = BlockedIssueSerializer(read_only=True, many=True)
    blocker_issues = BlockerIssueSerializer(read_only=True, many=True)
    issue_cycle = IssueCycleDetailSerializer(read_only=True)

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
