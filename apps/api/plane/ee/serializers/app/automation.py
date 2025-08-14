# Third party imports
from rest_framework import serializers

# Module imports
from plane.ee.serializers import BaseSerializer
from plane.ee.models import (
    Automation,
    AutomationNode,
    AutomationScopeChoices,
    NodeTypeChoices,
    AutomationEdge,
    AutomationRun,
    NodeExecution,
    AutomationActivity,
)


class AutomationWriteSerializer(BaseSerializer):

    # validate payload here check scope
    def validate_scope(self, value):
        if value not in AutomationScopeChoices.values:
            raise serializers.ValidationError("Invalid scope")
        return value

    class Meta:
        model = Automation
        fields = [
            "id",
            "name",
            "description",
            "scope",
            "status",
            "is_enabled",
            "run_count",
            "last_run_at",
            "bot_user",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "bot_user",
            "run_count",
            "last_run_at",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "status",
            "is_enabled",
        ]


class AutomationReadSerializer(BaseSerializer):
    class Meta:
        model = Automation
        fields = [
            "id",
            "name",
            "description",
            "scope",
            "status",
            "is_enabled",
            "run_count",
            "last_run_at",
            "bot_user",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "deleted_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class AutomationDetailReadSerializer(AutomationReadSerializer):

    nodes = serializers.SerializerMethodField()
    edges = serializers.SerializerMethodField()

    def get_nodes(self, obj):
        return AutomationNodeReadSerializer(obj.nodes, many=True).data

    def get_edges(self, obj):
        return AutomationEdgeReadSerializer(obj.edges, many=True).data

    class Meta:
        model = Automation
        fields = AutomationReadSerializer.Meta.fields + [
            "nodes",
            "edges",
        ]
        read_only_fields = AutomationReadSerializer.Meta.read_only_fields + [
            "nodes",
            "edges",
        ]


class AutomationNodeWriteSerializer(BaseSerializer):
    def validate_node_type(self, value):
        if value not in NodeTypeChoices.values:
            raise serializers.ValidationError("Invalid node type")
        return value

    class Meta:
        model = AutomationNode
        fields = [
            "id",
            "name",
            "node_type",
            "handler_name",
            "config",
            "is_enabled",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class AutomationNodeReadSerializer(BaseSerializer):
    class Meta:
        model = AutomationNode
        fields = [
            "id",
            "name",
            "node_type",
            "handler_name",
            "config",
            "is_enabled",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class AutomationEdgeWriteSerializer(BaseSerializer):

    def validate_source_node(self, value):
        if value not in AutomationNode.objects.filter(
            version=self.context["version"],
        ):
            raise serializers.ValidationError("Invalid source node")
        return value

    def validate_target_node(self, value):
        if value not in AutomationNode.objects.filter(
            version=self.context["version"],
        ):
            raise serializers.ValidationError("Invalid target node")
        return value

    class Meta:
        model = AutomationEdge
        fields = [
            "id",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "execution_order",
            "source_node",
            "target_node",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class AutomationEdgeReadSerializer(BaseSerializer):
    class Meta:
        model = AutomationEdge
        fields = [
            "id",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "execution_order",
            "source_node",
            "target_node",
        ]
        read_only_fields = fields


class AutomationRunReadSerializer(BaseSerializer):

    class Meta:
        model = AutomationRun
        fields = [
            "id",
            "automation",
            "version",
            "trigger_event",
            "trigger_source",
            "status",
            "started_at",
            "completed_at",
            "result",
            "error_message",
            "workspace",
            "project",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class NodeExecutionReadSerializer(BaseSerializer):
    class Meta:
        model = NodeExecution
        fields = [
            "id",
            "run",
            "node",
            "status",
            "started_at",
            "completed_at",
            "input_data",
            "output_data",
            "error_message",
            "retry_count",
            "execution_context",
            "workspace",
            "project",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class AutomationActivityReadSerializer(BaseSerializer):
    automation_scope = serializers.CharField(source="automation.scope", read_only=True)
    work_item_sequence_id = serializers.SerializerMethodField()

    class Meta:
        model = AutomationActivity
        fields = [
            "id",
            "automation",
            "automation_version",
            "automation_node",
            "automation_edge",
            "automation_run",
            "node_execution",
            "verb",
            "field",
            "old_value",
            "new_value",
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "actor",
            "old_identifier",
            "new_identifier",
            "epoch",
            "automation_scope",
            "work_item_sequence_id",
        ]
        read_only_fields = fields

    def get_work_item_sequence_id(self, obj):
        if obj.automation_run and obj.automation_run.work_item:
            return obj.automation_run.work_item.sequence_id
        return None
