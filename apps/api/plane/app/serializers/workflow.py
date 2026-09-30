# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.app.serializers import StateLiteSerializer, UserLiteSerializer
from plane.db.models import (
    IssueType,
    State,
    Workflow,
    WorkflowApproval,
    WorkflowFlow,
    WorkflowHistory,
    WorkflowStateConfig,
)
from plane.utils.workflow import log_workflow_change

from .base import BaseSerializer


class WorkflowStateConfigSerializer(BaseSerializer):
    state_id = serializers.PrimaryKeyRelatedField(source="state", queryset=State.all_state_objects.all())
    state_detail = StateLiteSerializer(read_only=True, source="state")

    class Meta:
        model = WorkflowStateConfig
        fields = [
            "id",
            "workflow_id",
            "state_id",
            "state_detail",
            "allow_work_item_creation",
            "sequence",
        ]
        read_only_fields = ["workflow"]


class WorkflowFlowSerializer(BaseSerializer):
    source_state_id = serializers.PrimaryKeyRelatedField(source="source_state", queryset=State.all_state_objects.all())
    target_state_id = serializers.PrimaryKeyRelatedField(source="target_state", queryset=State.all_state_objects.all())
    reject_state_id = serializers.PrimaryKeyRelatedField(
        source="reject_state",
        queryset=State.all_state_objects.all(),
        required=False,
        allow_null=True,
    )
    source_state_detail = StateLiteSerializer(read_only=True, source="source_state")
    target_state_detail = StateLiteSerializer(read_only=True, source="target_state")
    reject_state_detail = StateLiteSerializer(read_only=True, source="reject_state")

    class Meta:
        model = WorkflowFlow
        fields = [
            "id",
            "workflow_id",
            "source_state_id",
            "source_state_detail",
            "flow_type",
            "target_state_id",
            "target_state_detail",
            "reject_state_id",
            "reject_state_detail",
            "allowed_roles",
            "allowed_members",
            "sequence",
        ]
        read_only_fields = ["workflow"]

    def validate(self, attrs):
        source_state = attrs.get("source_state") or getattr(self.instance, "source_state", None)
        target_state = attrs.get("target_state") or getattr(self.instance, "target_state", None)
        reject_state = attrs.get("reject_state") or getattr(self.instance, "reject_state", None)
        flow_type = attrs.get("flow_type") or getattr(self.instance, "flow_type", "transition")
        project_id = self.context.get("project_id")

        if source_state and str(source_state.project_id) != str(project_id):
            raise serializers.ValidationError({"source_state_id": "State must belong to the project."})
        if target_state and str(target_state.project_id) != str(project_id):
            raise serializers.ValidationError({"target_state_id": "State must belong to the project."})
        if reject_state and str(reject_state.project_id) != str(project_id):
            raise serializers.ValidationError({"reject_state_id": "State must belong to the project."})
        if flow_type == "approval" and not reject_state:
            raise serializers.ValidationError({"reject_state_id": "Reject state is required for approval flows."})

        return attrs


class WorkflowHistorySerializer(BaseSerializer):
    actor_detail = UserLiteSerializer(read_only=True, source="created_by")

    class Meta:
        model = WorkflowHistory
        fields = ["id", "workflow_id", "action", "changes", "created_at", "actor_detail"]
        read_only_fields = fields


class WorkflowSerializer(BaseSerializer):
    issue_type_id = serializers.PrimaryKeyRelatedField(
        source="issue_type",
        queryset=IssueType.objects.all(),
        required=False,
        allow_null=True,
    )
    state_configs = WorkflowStateConfigSerializer(many=True, read_only=True)
    flows = WorkflowFlowSerializer(many=True, read_only=True)

    class Meta:
        model = Workflow
        fields = [
            "id",
            "project_id",
            "workspace_id",
            "name",
            "description",
            "is_default",
            "is_enabled",
            "is_paused",
            "issue_type_id",
            "state_configs",
            "flows",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["workspace", "project"]

    def validate(self, attrs):
        issue_type = attrs.get("issue_type")
        is_default = attrs.get("is_default", getattr(self.instance, "is_default", False))
        project_id = self.context.get("project_id")

        if issue_type and str(issue_type.workspace_id) != str(self.context.get("workspace_id")):
            raise serializers.ValidationError({"issue_type_id": "Issue type must belong to the workspace."})

        if issue_type and is_default:
            raise serializers.ValidationError({"is_default": "Type-specific workflows cannot be default."})

        if self.instance is None and not is_default and not issue_type:
            raise serializers.ValidationError({"issue_type_id": "Non-default workflows must have an issue type."})

        if issue_type and project_id:
            from plane.db.models import ProjectIssueType

            if not ProjectIssueType.objects.filter(
                project_id=project_id,
                issue_type_id=issue_type.id,
                deleted_at__isnull=True,
            ).exists():
                raise serializers.ValidationError({"issue_type_id": "Issue type is not enabled for this project."})

        return attrs

    def create(self, validated_data):
        workflow = super().create(validated_data)
        user = self.context["request"].user
        log_workflow_change(workflow, "created", {"name": workflow.name}, user.id)
        return workflow

    def update(self, instance, validated_data):
        changes = {key: value for key, value in validated_data.items()}
        workflow = super().update(instance, validated_data)
        user = self.context["request"].user
        log_workflow_change(workflow, "updated", changes, user.id)
        return workflow


class WorkflowLiteSerializer(BaseSerializer):
    class Meta:
        model = Workflow
        fields = ["id", "name", "is_default", "is_enabled", "is_paused", "issue_type_id"]
        read_only_fields = fields


class WorkflowApprovalSerializer(BaseSerializer):
    requested_by_detail = UserLiteSerializer(read_only=True, source="requested_by")
    resolved_by_detail = UserLiteSerializer(read_only=True, source="resolved_by")
    source_state_detail = StateLiteSerializer(read_only=True, source="source_state")
    approve_state_detail = StateLiteSerializer(read_only=True, source="approve_state")
    reject_state_detail = StateLiteSerializer(read_only=True, source="reject_state")
    flow_detail = WorkflowFlowSerializer(read_only=True, source="flow")

    class Meta:
        model = WorkflowApproval
        fields = [
            "id",
            "issue_id",
            "flow_id",
            "flow_detail",
            "status",
            "source_state_id",
            "source_state_detail",
            "approve_state_id",
            "approve_state_detail",
            "reject_state_id",
            "reject_state_detail",
            "requested_by",
            "requested_by_detail",
            "resolved_by",
            "resolved_by_detail",
            "resolved_at",
            "created_at",
        ]
        read_only_fields = fields


class WorkflowBulkUpdateSerializer(serializers.Serializer):
    state_configs = WorkflowStateConfigSerializer(many=True, required=False)
    flows = WorkflowFlowSerializer(many=True, required=False)


class IssueWorkflowStatusSerializer(serializers.Serializer):
    is_workflow_enabled = serializers.BooleanField()
    allowed_state_ids = serializers.ListField(child=serializers.CharField(), allow_null=True)
    # Pass through nested approval payload without re-validating as write input (read-only fields would be dropped).
    pending_approval = serializers.JSONField(allow_null=True, required=False)
    blocker_message = serializers.CharField(allow_null=True, required=False)
