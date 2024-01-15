from lxml import html


# Django imports
from django.utils import timezone

#  Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import (
    User,
    Issue,
    State,
    IssueAssignee,
    Label,
    IssueLabel,
    IssueLink,
    IssueComment,
    IssueAttachment,
    IssueActivity,
    ProjectMember,
)
from .base import BaseSerializer
from .cycle import CycleSerializer, CycleLiteSerializer
from .module import ModuleSerializer, ModuleLiteSerializer
from .user import UserLiteSerializer
from .state import StateLiteSerializer


class IssueSerializer(BaseSerializer):
    assignees = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(
            queryset=User.objects.values_list("id", flat=True)
        ),
        write_only=True,
        required=False,
    )

    labels = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(
            queryset=Label.objects.values_list("id", flat=True)
        ),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Issue
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        exclude = [
            "description",
            "description_stripped",
        ]

    def validate(self, data):
        if (
            data.get("start_date", None) is not None
            and data.get("target_date", None) is not None
            and data.get("start_date", None) > data.get("target_date", None)
        ):
            raise serializers.ValidationError(
                "Start date cannot exceed target date"
            )

        try:
            if data.get("description_html", None) is not None:
                parsed = html.fromstring(data["description_html"])
                parsed_str = html.tostring(parsed, encoding="unicode")
                data["description_html"] = parsed_str

        except Exception as e:
            raise serializers.ValidationError(f"Invalid HTML: {str(e)}")

        # Validate assignees are from project
        if data.get("assignees", []):
            data["assignees"] = ProjectMember.objects.filter(
                project_id=self.context.get("project_id"),
                is_active=True,
                member_id__in=data["assignees"],
            ).values_list("member_id", flat=True)

        # Validate labels are from project
        if data.get("labels", []):
            data["labels"] = Label.objects.filter(
                project_id=self.context.get("project_id"),
                id__in=data["labels"],
            ).values_list("id", flat=True)

        # Check state is from the project only else raise validation error
        if (
            data.get("state")
            and not State.objects.filter(
                project_id=self.context.get("project_id"),
                pk=data.get("state").id,
            ).exists()
        ):
            raise serializers.ValidationError(
                "State is not valid please pass a valid state_id"
            )

        # Check parent issue is from workspace as it can be cross workspace
        if (
            data.get("parent")
            and not Issue.objects.filter(
                workspace_id=self.context.get("workspace_id"),
                pk=data.get("parent").id,
            ).exists()
        ):
            raise serializers.ValidationError(
                "Parent is not valid issue_id please pass a valid issue_id"
            )

        return data

    def create(self, validated_data):
        assignees = validated_data.pop("assignees", None)
        labels = validated_data.pop("labels", None)

        project_id = self.context["project_id"]
        workspace_id = self.context["workspace_id"]
        default_assignee_id = self.context["default_assignee_id"]

        issue = Issue.objects.create(**validated_data, project_id=project_id)

        # Issue Audit Users
        created_by_id = issue.created_by_id
        updated_by_id = issue.updated_by_id

        if assignees is not None and len(assignees):
            IssueAssignee.objects.bulk_create(
                [
                    IssueAssignee(
                        assignee_id=assignee_id,
                        issue=issue,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for assignee_id in assignees
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
                        label_id=label_id,
                        issue=issue,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for label_id in labels
                ],
                batch_size=10,
            )

        return issue

    def update(self, instance, validated_data):
        assignees = validated_data.pop("assignees", None)
        labels = validated_data.pop("labels", None)

        # Related models
        project_id = instance.project_id
        workspace_id = instance.workspace_id
        created_by_id = instance.created_by_id
        updated_by_id = instance.updated_by_id

        if assignees is not None:
            IssueAssignee.objects.filter(issue=instance).delete()
            IssueAssignee.objects.bulk_create(
                [
                    IssueAssignee(
                        assignee_id=assignee_id,
                        issue=instance,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for assignee_id in assignees
                ],
                batch_size=10,
            )

        if labels is not None:
            IssueLabel.objects.filter(issue=instance).delete()
            IssueLabel.objects.bulk_create(
                [
                    IssueLabel(
                        label_id=label_id,
                        issue=instance,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for label_id in labels
                ],
                batch_size=10,
            )

        # Time updation occues even when other related models are updated
        instance.updated_at = timezone.now()
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if "assignees" in self.fields:
            if "assignees" in self.expand:
                from .user import UserLiteSerializer

                data["assignees"] = UserLiteSerializer(
                    instance.assignees.all(), many=True
                ).data
            else:
                data["assignees"] = [
                    str(assignee.id) for assignee in instance.assignees.all()
                ]
        if "labels" in self.fields:
            if "labels" in self.expand:
                data["labels"] = LabelSerializer(
                    instance.labels.all(), many=True
                ).data
            else:
                data["labels"] = [
                    str(label.id) for label in instance.labels.all()
                ]

        return data


class LabelSerializer(BaseSerializer):
    class Meta:
        model = Label
        fields = "__all__"
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class IssueLinkSerializer(BaseSerializer):
    class Meta:
        model = IssueLink
        fields = "__all__"
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "issue",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    # Validation if url already exists
    def create(self, validated_data):
        if IssueLink.objects.filter(
            url=validated_data.get("url"),
            issue_id=validated_data.get("issue_id"),
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
            "id",
            "workspace",
            "project",
            "issue",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class IssueCommentSerializer(BaseSerializer):
    is_member = serializers.BooleanField(read_only=True)

    class Meta:
        model = IssueComment
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "issue",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        exclude = [
            "comment_stripped",
            "comment_json",
        ]

    def validate(self, data):
        try:
            if data.get("comment_html", None) is not None:
                parsed = html.fromstring(data["comment_html"])
                parsed_str = html.tostring(parsed, encoding="unicode")
                data["comment_html"] = parsed_str

        except Exception as e:
            raise serializers.ValidationError(f"Invalid HTML: {str(e)}")
        return data


class IssueActivitySerializer(BaseSerializer):
    class Meta:
        model = IssueActivity
        exclude = [
            "created_by",
            "updated_by",
        ]


class CycleIssueSerializer(BaseSerializer):
    cycle = CycleSerializer(read_only=True)

    class Meta:
        fields = [
            "cycle",
        ]


class ModuleIssueSerializer(BaseSerializer):
    module = ModuleSerializer(read_only=True)

    class Meta:
        fields = [
            "module",
        ]


class LabelLiteSerializer(BaseSerializer):
    class Meta:
        model = Label
        fields = [
            "id",
            "name",
            "color",
        ]


class IssueExpandSerializer(BaseSerializer):
    cycle = CycleLiteSerializer(source="issue_cycle.cycle", read_only=True)
    module = ModuleLiteSerializer(source="issue_module.module", read_only=True)
    labels = LabelLiteSerializer(read_only=True, many=True)
    assignees = UserLiteSerializer(read_only=True, many=True)
    state = StateLiteSerializer(read_only=True)

    class Meta:
        model = Issue
        fields = "__all__"
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
