# Django imports
from django.utils import timezone

# Third Party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import (
    User,
    Issue,
    Label,
    State,
    DraftIssue,
    DraftIssueAssignee,
    DraftIssueLabel,
    DraftIssueCycle,
    DraftIssueModule,
)


class DraftIssueCreateSerializer(BaseSerializer):
    # ids
    state_id = serializers.PrimaryKeyRelatedField(
        source="state", queryset=State.objects.all(), required=False, allow_null=True
    )
    parent_id = serializers.PrimaryKeyRelatedField(
        source="parent", queryset=Issue.objects.all(), required=False, allow_null=True
    )
    label_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Label.objects.all()),
        write_only=True,
        required=False,
    )
    assignee_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all()),
        write_only=True,
        required=False,
    )

    class Meta:
        model = DraftIssue
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        assignee_ids = self.initial_data.get("assignee_ids")
        data["assignee_ids"] = assignee_ids if assignee_ids else []
        label_ids = self.initial_data.get("label_ids")
        data["label_ids"] = label_ids if label_ids else []
        return data

    def validate(self, data):
        if (
            data.get("start_date", None) is not None
            and data.get("target_date", None) is not None
            and data.get("start_date", None) > data.get("target_date", None)
        ):
            raise serializers.ValidationError("Start date cannot exceed target date")
        return data

    def create(self, validated_data):
        assignees = validated_data.pop("assignee_ids", None)
        labels = validated_data.pop("label_ids", None)
        modules = validated_data.pop("module_ids", None)
        cycle_id = self.initial_data.get("cycle_id", None)
        modules = self.initial_data.get("module_ids", None)

        workspace_id = self.context["workspace_id"]
        project_id = self.context["project_id"]

        # Create Issue
        issue = DraftIssue.objects.create(
            **validated_data, workspace_id=workspace_id, project_id=project_id
        )

        # Issue Audit Users
        created_by_id = issue.created_by_id
        updated_by_id = issue.updated_by_id

        if assignees is not None and len(assignees):
            DraftIssueAssignee.objects.bulk_create(
                [
                    DraftIssueAssignee(
                        assignee=user,
                        draft_issue=issue,
                        workspace_id=workspace_id,
                        project_id=project_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for user in assignees
                ],
                batch_size=10,
            )

        if labels is not None and len(labels):
            DraftIssueLabel.objects.bulk_create(
                [
                    DraftIssueLabel(
                        label=label,
                        draft_issue=issue,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for label in labels
                ],
                batch_size=10,
            )

        if cycle_id is not None:
            DraftIssueCycle.objects.create(
                cycle_id=cycle_id,
                draft_issue=issue,
                project_id=project_id,
                workspace_id=workspace_id,
                created_by_id=created_by_id,
                updated_by_id=updated_by_id,
            )

        if modules is not None and len(modules):
            DraftIssueModule.objects.bulk_create(
                [
                    DraftIssueModule(
                        module_id=module_id,
                        draft_issue=issue,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for module_id in modules
                ],
                batch_size=10,
            )

        return issue

    def update(self, instance, validated_data):
        assignees = validated_data.pop("assignee_ids", None)
        labels = validated_data.pop("label_ids", None)
        cycle_id = self.context.get("cycle_id", None)
        modules = self.initial_data.get("module_ids", None)

        # Related models
        workspace_id = instance.workspace_id
        project_id = instance.project_id

        created_by_id = instance.created_by_id
        updated_by_id = instance.updated_by_id

        if assignees is not None:
            DraftIssueAssignee.objects.filter(draft_issue=instance).delete()
            DraftIssueAssignee.objects.bulk_create(
                [
                    DraftIssueAssignee(
                        assignee=user,
                        draft_issue=instance,
                        workspace_id=workspace_id,
                        project_id=project_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for user in assignees
                ],
                batch_size=10,
            )

        if labels is not None:
            DraftIssueLabel.objects.filter(draft_issue=instance).delete()
            DraftIssueLabel.objects.bulk_create(
                [
                    DraftIssueLabel(
                        label=label,
                        draft_issue=instance,
                        workspace_id=workspace_id,
                        project_id=project_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for label in labels
                ],
                batch_size=10,
            )

        if cycle_id != "not_provided":
            DraftIssueCycle.objects.filter(draft_issue=instance).delete()
            if cycle_id:
                DraftIssueCycle.objects.create(
                    cycle_id=cycle_id,
                    draft_issue=instance,
                    workspace_id=workspace_id,
                    project_id=project_id,
                    created_by_id=created_by_id,
                    updated_by_id=updated_by_id,
                )

        if modules is not None:
            DraftIssueModule.objects.filter(draft_issue=instance).delete()
            DraftIssueModule.objects.bulk_create(
                [
                    DraftIssueModule(
                        module_id=module_id,
                        draft_issue=instance,
                        workspace_id=workspace_id,
                        project_id=project_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for module_id in modules
                ],
                batch_size=10,
            )

        # Time updation occurs even when other related models are updated
        instance.updated_at = timezone.now()
        return super().update(instance, validated_data)


class DraftIssueSerializer(BaseSerializer):
    # ids
    cycle_id = serializers.PrimaryKeyRelatedField(read_only=True)
    module_ids = serializers.ListField(child=serializers.UUIDField(), required=False)

    # Many to many
    label_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    assignee_ids = serializers.ListField(child=serializers.UUIDField(), required=False)

    class Meta:
        model = DraftIssue
        fields = [
            "id",
            "name",
            "state_id",
            "sort_order",
            "completed_at",
            "estimate_point",
            "priority",
            "start_date",
            "target_date",
            "project_id",
            "parent_id",
            "cycle_id",
            "module_ids",
            "label_ids",
            "assignee_ids",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "type_id",
            "description_html",
        ]
        read_only_fields = fields


class DraftIssueDetailSerializer(DraftIssueSerializer):
    description_html = serializers.CharField()

    class Meta(DraftIssueSerializer.Meta):
        fields = DraftIssueSerializer.Meta.fields + ["description_html"]
        read_only_fields = fields
