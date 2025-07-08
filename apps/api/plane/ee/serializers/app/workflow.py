# Module imports
from plane.app.serializers.base import BaseSerializer
from plane.ee.models import (
    Workflow,
    WorkflowTransition,
    WorkflowTransitionApprover,
    WorkflowTransitionActivity,
)
from rest_framework import serializers


class WorkflowSerializer(BaseSerializer):
    class Meta:
        model = Workflow
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "state",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
        ]


class WorkflowTransitionSerializer(BaseSerializer):
    class Meta:
        model = WorkflowTransition
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "workflow",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
        ]


class WorkflowTransitionActorSerializer(BaseSerializer):
    class Meta:
        model = WorkflowTransitionApprover
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "workflow",
            "workflow_transition",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
        ]


class WorkflowTransitionActivitySerializer(BaseSerializer):
    state_id = serializers.UUIDField(source="workflow.state_id", read_only=True)

    class Meta:
        model = WorkflowTransitionActivity
        fields = "__all__"
