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

# Module imports
from plane.app.serializers.base import BaseSerializer
from plane.db.models import State
from plane.ee.models import (
    Workflow,
    WorkflowState,
    WorkflowTransition,
    WorkflowWorkItemType,
    WorkflowTransitionApprover,
    WorkflowTransitionActivity,
)
from rest_framework import serializers


class WorkflowSerializer(BaseSerializer):
    work_item_type_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    project_id = serializers.UUIDField(source="project.id", read_only=True)
    workspace_id = serializers.UUIDField(source="workspace.id", read_only=True)

    class Meta:
        model = Workflow
        exclude = ["workspace", "project"]
        read_only_fields = [
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
            "is_default",
        ]

    def validate(self, attrs):
        # Name is only required during creation, not updates
        if self.instance is None:
            if attrs.get("name") is None or attrs.get("name") == "":
                raise serializers.ValidationError("Name is required")
        else:
            if "name" in attrs and attrs["name"] == "":
                raise serializers.ValidationError("Name cannot be empty")
        return attrs

    def create(self, validated_data):
        # create the bridge model with work item type ids
        work_item_type_ids = validated_data.pop("work_item_type_ids", None)
        instance = super().create(validated_data)

        if work_item_type_ids is not None and len(work_item_type_ids):
            try:
                WorkflowWorkItemType.objects.bulk_create(
                    [
                        WorkflowWorkItemType(
                            work_item_type_id=work_item_type_id,
                            workflow_id=instance.id,
                            project_id=instance.project_id,
                            workspace_id=instance.workspace_id,
                            created_by_id=instance.created_by_id,
                            updated_by_id=instance.updated_by_id,
                        )
                        for work_item_type_id in work_item_type_ids
                    ],
                    batch_size=10,
                )
            except Exception:
                raise serializers.ValidationError("Failed to create workflow work item types")

        return instance

    def update(self, instance, validated_data):
        work_item_type_ids = validated_data.pop("work_item_type_ids", None)

        # Related models
        project_id = instance.project_id
        workspace_id = instance.workspace_id
        created_by_id = instance.created_by_id
        updated_by_id = instance.updated_by_id

        if work_item_type_ids is not None:
            # Get the current work item type ids
            current_work_item_type_ids = WorkflowWorkItemType.objects.filter(workflow=instance).values_list(
                "work_item_type_id", flat=True
            )

            # Get the work item type ids to add
            work_item_type_ids_to_add = list(set(work_item_type_ids) - set(current_work_item_type_ids))

            # Get the work item type ids to remove
            work_item_type_ids_to_remove = list(set(current_work_item_type_ids) - set(work_item_type_ids))

            # Delete the work item type ids to remove
            WorkflowWorkItemType.objects.filter(
                workflow=instance, work_item_type_id__in=work_item_type_ids_to_remove
            ).delete()

            try:
                WorkflowWorkItemType.objects.bulk_create(
                    [
                        WorkflowWorkItemType(
                            work_item_type_id=work_item_type_id,
                            workflow_id=instance.id,
                            project_id=project_id,
                            workspace_id=workspace_id,
                            created_by_id=created_by_id,
                            updated_by_id=updated_by_id,
                        )
                        for work_item_type_id in work_item_type_ids_to_add
                    ],
                    batch_size=10,
                    ignore_conflicts=True,
                )
            except Exception:
                pass

        return super().update(instance, validated_data)


class WorkflowStateSerializer(BaseSerializer):
    class Meta:
        model = WorkflowState
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "workflow",
        ]


class WorkflowTransitionSerializer(BaseSerializer):
    member_ids = serializers.ListField(child=serializers.UUIDField(), read_only=True, default=[])
    transition_state_id = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(), source="transition_state", required=False, allow_null=True
    )
    rejection_state_id = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(), source="rejection_state", required=False, allow_null=True
    )

    class Meta:
        model = WorkflowTransition
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "workflow_state",
            "transition_state",
            "rejection_state",
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
            "workflow_state",
            "workflow_transition",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "deleted_at",
        ]


class WorkflowTransitionActivitySerializer(BaseSerializer):
    state_id = serializers.UUIDField(source="workflow_state.state_id", read_only=True)

    class Meta:
        model = WorkflowTransitionActivity
        fields = "__all__"
