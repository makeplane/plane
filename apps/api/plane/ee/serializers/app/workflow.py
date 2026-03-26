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
import json

from django.db import IntegrityError
from django.db.models import Q
from django.utils import timezone

from plane.app.serializers.base import BaseSerializer
from plane.db.models import State
from plane.ee.models import (
    Workflow,
    WorkflowState,
    WorkflowTransition,
    WorkflowTransitionHook,
    WorkflowTransitionHookPhase,
    WorkflowWorkItemType,
    WorkflowTransitionApprover,
    WorkflowTransitionActivity,
)
from plane.runnerctl.models import Script
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


def _validate_rules(rules):
    """Validate and normalise a list of rule dicts from the request payload."""
    if not rules:
        return []

    validated = []
    for rule in rules:
        if not isinstance(rule, dict):
            raise serializers.ValidationError("Each rule must be an object.")

        rule_type = rule.get("rule_type")
        if not rule_type:
            raise serializers.ValidationError("Each rule must include rule_type.")

        config = rule.get("config")
        if not isinstance(config, dict):
            raise serializers.ValidationError("Each rule must include a config object.")

        # handler_name is hardcoded to run_script for now.
        # When new handlers are added, the frontend will send handler_name explicitly
        # and this default will be removed.
        handler_name = rule.get("handler_name", WorkflowTransitionHook.SCRIPT_HANDLER_NAME)

        # Per-handler config validation
        if handler_name == WorkflowTransitionHook.SCRIPT_HANDLER_NAME:
            if not config.get("script_id"):
                raise serializers.ValidationError("run_script rule must include config.script_id.")
            execution_variables = config.get("execution_variables") or {}
            if not isinstance(execution_variables, dict):
                raise serializers.ValidationError("config.execution_variables must be an object.")

        validated.append(
            {
                "handler_name": handler_name,
                "rule_type": rule_type,
                "config": config,
            }
        )

    return validated


class WorkflowTransitionSerializer(BaseSerializer):
    member_ids = serializers.ListField(child=serializers.UUIDField(), read_only=True, default=[])
    transition_state_id = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(), source="transition_state", required=False, allow_null=True
    )
    rejection_state_id = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(), source="rejection_state", required=False, allow_null=True
    )
    pre_rules = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    post_rules = serializers.ListField(child=serializers.DictField(), required=False, default=list)

    def validate_pre_rules(self, value):
        return _validate_rules(value)

    def validate_post_rules(self, value):
        return _validate_rules(value)

    def _validate_script_ids(self, instance, rules):
        script_ids = [
            r["config"]["script_id"]
            for r in rules
            if r.get("handler_name") == WorkflowTransitionHook.SCRIPT_HANDLER_NAME
            and r.get("config", {}).get("script_id")
        ]
        if not script_ids:
            return

        valid_script_ids = set(
            str(script_id)
            for script_id in Script.objects.filter(id__in=script_ids)
            .filter(Q(is_system=True) | Q(workspace_id=instance.workspace_id))
            .filter(Q(project_id__isnull=True) | Q(project_id=instance.project_id))
            .values_list("id", flat=True)
        )

        missing = [sid for sid in script_ids if sid not in valid_script_ids]
        if missing:
            raise serializers.ValidationError(
                {"scripts": f"Invalid script ids for workflow transition: {', '.join(missing)}"}
            )

    @staticmethod
    def _hook_key(handler_name, hook_type, config):
        return (handler_name, hook_type, json.dumps(config, sort_keys=True))

    def _sync_hooks(self, instance, phase, hooks):
        # Get current active hooks for this phase
        current_hooks = list(
            instance.hooks.filter(phase=phase, deleted_at__isnull=True).values(
                "id", "handler_name", "hook_type", "config"
            )
        )

        current_key_map = {
            self._hook_key(r["handler_name"], r["hook_type"], r["config"]): r["id"] for r in current_hooks
        }
        payload_keys = {self._hook_key(r["handler_name"], r["rule_type"], r["config"]) for r in hooks}

        # Soft-delete hooks no longer in the payload
        ids_to_remove = [v for k, v in current_key_map.items() if k not in payload_keys]
        if ids_to_remove:
            instance.hooks.filter(id__in=ids_to_remove).update(deleted_at=timezone.now())

        # Only create hooks not already present
        hooks_to_add = [
            (index, hook)
            for index, hook in enumerate(hooks)
            if self._hook_key(hook["handler_name"], hook["rule_type"], hook["config"]) not in current_key_map
        ]

        if not hooks_to_add:
            return

        self._validate_script_ids(instance, [hook for _, hook in hooks_to_add])

        try:
            WorkflowTransitionHook.objects.bulk_create(
                [
                    WorkflowTransitionHook(
                        workflow_transition=instance,
                        project_id=instance.project_id,
                        workspace_id=instance.workspace_id,
                        phase=phase,
                        name="",
                        hook_type=hook["rule_type"],
                        handler_name=hook["handler_name"],
                        execution_order=index,
                        config=hook["config"],
                        is_enabled=True,
                    )
                    for index, hook in hooks_to_add
                ],
                batch_size=20,
                ignore_conflicts=True,
            )
        except IntegrityError:
            pass

    def create(self, validated_data):
        pre_rules = validated_data.pop("pre_rules", [])
        post_rules = validated_data.pop("post_rules", [])

        instance = super().create(validated_data)
        self._sync_hooks(instance, WorkflowTransitionHookPhase.PRE, pre_rules)
        self._sync_hooks(instance, WorkflowTransitionHookPhase.POST, post_rules)
        return instance

    def update(self, instance, validated_data):
        pre_rules = validated_data.pop("pre_rules", None)
        post_rules = validated_data.pop("post_rules", None)

        instance = super().update(instance, validated_data)

        if pre_rules is not None:
            self._sync_hooks(instance, WorkflowTransitionHookPhase.PRE, pre_rules)
        if post_rules is not None:
            self._sync_hooks(instance, WorkflowTransitionHookPhase.POST, post_rules)

        return instance

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
