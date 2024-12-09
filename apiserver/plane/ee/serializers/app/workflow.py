# Module imports
from plane.app.serializers.base import BaseSerializer
from plane.ee.models import Workflow, WorkflowTransition, WorkflowTransitionActor


class WorkflowSerializer(BaseSerializer):
    class Meta:
        model = Workflow
        read_only_fields = [
            "workspace",
            "project",
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
        model = WorkflowTransitionActor
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
