# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import ApprovalAction, ApprovalFlow, ApprovalFlowStep, ApprovalRequest

from .org import ResearchUserSerializer


class ApprovalFlowStepSerializer(serializers.ModelSerializer):
    approver_user_detail = ResearchUserSerializer(source="approver_user", read_only=True)

    class Meta:
        model = ApprovalFlowStep
        fields = [
            "id",
            "flow",
            "order",
            "approver_mode",
            "approver_org_role",
            "approver_user",
            "approver_user_detail",
            "is_required",
        ]
        read_only_fields = ["id", "flow"]


class ApprovalFlowSerializer(serializers.ModelSerializer):
    steps = ApprovalFlowStepSerializer(many=True, read_only=True)

    class Meta:
        model = ApprovalFlow
        fields = [
            "id",
            "name",
            "org_unit",
            "approval_type",
            "is_active",
            "version",
            "steps",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ApprovalActionSerializer(serializers.ModelSerializer):
    actor_detail = ResearchUserSerializer(source="actor", read_only=True)
    step_order = serializers.IntegerField(source="step.order", read_only=True)

    class Meta:
        model = ApprovalAction
        fields = ["id", "request", "step", "step_order", "actor", "actor_detail", "action", "comment", "created_at"]
        read_only_fields = fields


class ApprovalRequestSerializer(serializers.ModelSerializer):
    requested_by_detail = ResearchUserSerializer(source="requested_by", read_only=True)
    issue_detail = serializers.SerializerMethodField()
    can_act = serializers.SerializerMethodField()
    flow_name = serializers.CharField(source="flow.name", read_only=True)

    class Meta:
        model = ApprovalRequest
        fields = [
            "id",
            "issue",
            "issue_detail",
            "flow",
            "flow_name",
            "flow_version",
            "approval_type",
            "status",
            "current_step_order",
            "requested_by",
            "requested_by_detail",
            "org_unit",
            "research_project",
            "report",
            "can_act",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_issue_detail(self, obj):
        issue = obj.issue
        if issue is None:
            return None
        return {"id": str(issue.id), "name": issue.name, "sequence_id": issue.sequence_id}

    def get_can_act(self, obj):
        actor = self.context.get("actor")
        if actor is None or obj.status != ApprovalRequest.Status.PENDING:
            return False
        from plane.research.utils.approvals import can_act_on_current_step

        allowed, _step = can_act_on_current_step(obj, actor)
        return allowed
