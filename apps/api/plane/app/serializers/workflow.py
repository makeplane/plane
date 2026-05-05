# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import ProjectWorkflow, WorkflowActivity, WorkflowStateConfig, WorkflowTransition

from .base import BaseSerializer


class WorkflowTransitionSerializer(BaseSerializer):
    """Used inside the nested GET /workflow-states/ response."""

    approvers = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowTransition
        fields = ["id", "state", "transition_state", "approvers"]
        read_only_fields = ["workspace", "project"]

    def get_approvers(self, obj):
        return list(obj.approvers.values_list("approver_id", flat=True))


class WorkflowStateConfigSerializer(BaseSerializer):
    """For PATCH /workflow-states/{state_id}/ response."""

    class Meta:
        model = WorkflowStateConfig
        fields = ["id", "state", "allow_issue_creation"]
        read_only_fields = ["workspace", "project", "state"]


class ProjectWorkflowSerializer(BaseSerializer):
    """For GET/PATCH /projects/{id}/workflow/."""

    class Meta:
        model = ProjectWorkflow
        fields = ["id", "project", "is_live"]
        read_only_fields = ["workspace", "project"]


class WorkflowActivitySerializer(BaseSerializer):
    """For GET /projects/{id}/workflow/activity/."""

    actor_detail = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowActivity
        fields = ["id", "field", "old_value", "new_value", "actor", "actor_detail", "created_at"]
        read_only_fields = ["workspace", "project", "actor"]

    def get_actor_detail(self, obj):
        if obj.actor:
            return {"id": str(obj.actor_id), "display_name": obj.actor.display_name}
        return None
