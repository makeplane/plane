from lxml import html

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
    ProjectMember,
    EstimatePoint,
)
from plane.utils.content_validator import (
    validate_html_content,
    validate_json_content,
    validate_binary_data,
)
from plane.app.permissions import ROLE


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

    def validate(self, attrs):
        if (
            attrs.get("start_date", None) is not None
            and attrs.get("target_date", None) is not None
            and attrs.get("start_date", None) > attrs.get("target_date", None)
        ):
            raise serializers.ValidationError("Start date cannot exceed target date")

        # Validate description content for security
        if "description" in attrs and attrs["description"]:
            is_valid, error_msg = validate_json_content(attrs["description"])
            if not is_valid:
                raise serializers.ValidationError({"description": error_msg})

        if "description_html" in attrs and attrs["description_html"]:
            is_valid, error_msg = validate_html_content(attrs["description_html"])
            if not is_valid:
                raise serializers.ValidationError({"description_html": error_msg})

        if "description_binary" in attrs and attrs["description_binary"]:
            is_valid, error_msg = validate_binary_data(attrs["description_binary"])
            if not is_valid:
                raise serializers.ValidationError({"description_binary": error_msg})

        # Validate assignees are from project
        if attrs.get("assignee_ids", []):
            attrs["assignee_ids"] = ProjectMember.objects.filter(
                project_id=self.context["project_id"],
                role__gte=ROLE.MEMBER.value,
                is_active=True,
                member_id__in=attrs["assignee_ids"],
            ).values_list("member_id", flat=True)

        # Validate labels are from project
        if attrs.get("label_ids"):
            label_ids = [label.id for label in attrs["label_ids"]]
            attrs["label_ids"] = list(
                Label.objects.filter(
                    project_id=self.context.get("project_id"), id__in=label_ids
                ).values_list("id", flat=True)
            )

        # # Check state is from the project only else raise validation error
        if (
            attrs.get("state")
            and not State.objects.filter(
                project_id=self.context.get("project_id"),
                pk=attrs.get("state").id,
            ).exists()
        ):
            raise serializers.ValidationError(
                "State is not valid please pass a valid state_id"
            )

        # # Check parent issue is from workspace as it can be cross workspace
        if (
            attrs.get("parent")
            and not Issue.objects.filter(
                project_id=self.context.get("project_id"),
                pk=attrs.get("parent").id,
            ).exists()
        ):
            raise serializers.ValidationError(
                "Parent is not valid issue_id please pass a valid issue_id"
            )

        if (
            attrs.get("estimate_point")
            and not EstimatePoint.objects.filter(
                project_id=self.context.get("project_id"),
                pk=attrs.get("estimate_point").id,
            ).exists()
        ):
            raise serializers.ValidationError(
                "Estimate point is not valid please pass a valid estimate_point_id"
            )

        return attrs

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
                        assignee_id=assignee_id,
                        draft_issue=issue,
                        workspace_id=workspace_id,
                        project_id=project_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for assignee_id in assignees
                ],
                batch_size=10,
            )

        if labels is not None and len(labels):
            DraftIssueLabel.objects.bulk_create(
                [
                    DraftIssueLabel(
                        label_id=label_id,
                        draft_issue=issue,
                        project_id=project_id,
                        workspace_id=workspace_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for label_id in labels
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
                        assignee_id=assignee_id,
                        draft_issue=instance,
                        workspace_id=workspace_id,
                        project_id=project_id,
                        created_by_id=created_by_id,
                        updated_by_id=updated_by_id,
                    )
                    for assignee_id in assignees
                ],
                batch_size=10,
            )

        if labels is not None:
            DraftIssueLabel.objects.filter(draft_issue=instance).delete()
            DraftIssueLabel.objects.bulk_create(
                [
                    DraftIssueLabel(
                        label_id=label,
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
