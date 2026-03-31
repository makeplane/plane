# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

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
    AutomationProjectAssociation,
)


class AutomationWriteSerializer(BaseSerializer):
    project_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
    )

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
            "project_ids",
            "is_global",
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
            "is_global",
        ]

    def create(self, validated_data):
        project_ids = validated_data.pop("project_ids", [])
        automation = super().create(validated_data)
        # Handle project associations
        AutomationProjectAssociation.objects.bulk_create(
            [
                AutomationProjectAssociation(
                    automation=automation,
                    project_id=project_id,
                    workspace=automation.workspace,
                    created_by=automation.created_by,
                )
                for project_id in project_ids
            ]
        )
        return automation
    
    def update(self, instance, validated_data):
        project_ids = validated_data.pop("project_ids", None)
        automation = super().update(instance, validated_data)

        if project_ids is not None:
            # Update project associations
            existing_project_ids = set(
                (project_id) for project_id in AutomationProjectAssociation.objects.filter(
                    automation=automation,
                ).values_list("project_id", flat=True)
            )
            new_project_ids = set(project_ids)

            added_project_ids = new_project_ids - existing_project_ids
            removed_project_ids = existing_project_ids - new_project_ids 

            # Add new associations
            AutomationProjectAssociation.objects.bulk_create(
                [
                    AutomationProjectAssociation(
                        automation=automation,
                        project_id=project_id,
                        workspace=automation.workspace,
                        created_by=automation.updated_by,
                    )
                    for project_id in added_project_ids
                ]
            )

            # Soft delete removed associations
            AutomationProjectAssociation.objects.filter(
                automation=automation,
                project_id__in=removed_project_ids,
            ).delete()

        return automation


class AutomationReadSerializer(BaseSerializer):
    project_ids = serializers.SerializerMethodField()

    def get_project_ids(self, obj):
        if obj.project:
            return [obj.project_id]
        return [assoc.project_id for assoc in getattr(obj, "project_associations", [])]

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
            "created_by",
            "updated_by",
            "deleted_at",
            "created_at",
            "updated_at",
            "project_ids",
            "is_global",
        ]
        read_only_fields = fields


class AutomationDetailReadSerializer(AutomationReadSerializer):
    nodes = serializers.SerializerMethodField()
    edges = serializers.SerializerMethodField()
    project_ids = serializers.SerializerMethodField()

    def get_nodes(self, obj):
        return AutomationNodeReadSerializer(obj.nodes, many=True).data

    def get_edges(self, obj):
        return AutomationEdgeReadSerializer(obj.edges, many=True).data

    def get_project_ids(self, obj):
        if obj.project:
            return [obj.project_id]
        return [assoc.project_id for assoc in getattr(obj, "project_associations", [])]

    class Meta:
        model = Automation
        fields = AutomationReadSerializer.Meta.fields + [
            "nodes",
            "edges",
            "project_ids",
        ]
        read_only_fields = AutomationReadSerializer.Meta.read_only_fields + [
            "nodes",
            "edges",
            "project_ids",
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


class AutomationRunLiteSerializer(BaseSerializer):
    work_item_sequence_id = serializers.IntegerField(source="work_item.sequence_id", read_only=True)

    class Meta:
        model = AutomationRun
        fields = [
            "id",
            "work_item",
            "initiator",
            "started_at",
            "status",
            "completed_at",
            "work_item_sequence_id",
        ]
        read_only_fields = fields


class AutomationActivityReadSerializer(BaseSerializer):
    automation_scope = serializers.CharField(source="automation.scope", read_only=True)
    automation_run = AutomationRunLiteSerializer()

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
        ]
        read_only_fields = fields
