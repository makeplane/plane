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

"""
External API serializers for Workflow resources.

These are intentionally separate from the internal EE serializers:
- Only stable, public-facing fields are exposed.
- Write fields are explicit rather than __all__.
"""

import json

from django.db import IntegrityError
from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers

from plane.db.models import State
from plane.ee.models import (
    Workflow,
    WorkflowState,
    WorkflowTransition,
    WorkflowTransitionActivity,
    WorkflowTransitionApprover,
    WorkflowTransitionHook,
    WorkflowTransitionHookPhase,
    WorkflowWorkItemType,
)
from plane.runnerctl.models import Script


class WorkflowAPISerializer(serializers.ModelSerializer):
    project_id = serializers.UUIDField(source="project.id", read_only=True)
    workspace_id = serializers.UUIDField(source="workspace.id", read_only=True)
    # write_only input; response uses the SerializerMethodField below
    work_item_type_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, write_only=True
    )
    work_item_type_ids_display = serializers.SerializerMethodField()

    class Meta:
        model = Workflow
        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "is_default",
            "project_id",
            "workspace_id",
            "work_item_type_ids",
            "work_item_type_ids_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "is_default",
            "project_id",
            "workspace_id",
            "created_at",
            "updated_at",
        ]

    def get_work_item_type_ids_display(self, obj):
        # Prefer the annotated value added by the view queryset to avoid N+1.
        if hasattr(obj, "work_item_type_ids"):
            return [str(uid) for uid in (obj.work_item_type_ids or []) if uid is not None]
        return list(
            WorkflowWorkItemType.objects.filter(
                workflow=obj, deleted_at__isnull=True, work_item_type_id__isnull=False
            ).values_list("work_item_type_id", flat=True)
        )

    def validate(self, attrs):
        if self.instance is None and not attrs.get("name"):
            raise serializers.ValidationError({"name": "Name is required."})
        if self.instance is not None and "name" in attrs and not attrs["name"]:
            raise serializers.ValidationError({"name": "Name cannot be empty."})
        return attrs

    def _sync_work_item_types(self, instance, work_item_type_ids):
        current_ids = set(
            WorkflowWorkItemType.objects.filter(workflow=instance).values_list("work_item_type_id", flat=True)
        )
        incoming_ids = set(work_item_type_ids)

        to_remove = current_ids - incoming_ids
        if to_remove:
            WorkflowWorkItemType.objects.filter(workflow=instance, work_item_type_id__in=to_remove).delete()

        to_add = incoming_ids - current_ids
        if to_add:
            WorkflowWorkItemType.objects.bulk_create(
                [
                    WorkflowWorkItemType(
                        work_item_type_id=wid,
                        workflow_id=instance.id,
                        project_id=instance.project_id,
                        workspace_id=instance.workspace_id,
                        created_by_id=instance.created_by_id,
                        updated_by_id=instance.updated_by_id,
                    )
                    for wid in to_add
                ],
                batch_size=10,
                ignore_conflicts=True,
            )

    def create(self, validated_data):
        work_item_type_ids = validated_data.pop("work_item_type_ids", None)
        instance = super().create(validated_data)
        if work_item_type_ids:
            self._sync_work_item_types(instance, work_item_type_ids)
        return instance

    def update(self, instance, validated_data):
        work_item_type_ids = validated_data.pop("work_item_type_ids", None)
        instance = super().update(instance, validated_data)
        if work_item_type_ids is not None:
            self._sync_work_item_types(instance, work_item_type_ids)
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Rename the display field to work_item_type_ids in the response so
        # the public API field name is stable regardless of the write/read split.
        data["work_item_type_ids"] = data.pop("work_item_type_ids_display", [])
        return data


class WorkflowStateAPISerializer(serializers.ModelSerializer):
    state_id = serializers.UUIDField(source="state.id", read_only=True)
    workflow_id = serializers.UUIDField(source="workflow.id", read_only=True)

    class Meta:
        model = WorkflowState
        fields = [
            "id",
            "state_id",
            "workflow_id",
            "type",
            "allow_issue_creation",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "state_id",
            "workflow_id",
            "created_at",
            "updated_at",
        ]


def _validate_rules(rules):
    """Validate and normalise a list of hook rule dicts from the request payload."""
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

        handler_name = rule.get("handler_name", WorkflowTransitionHook.SCRIPT_HANDLER_NAME)

        if handler_name == WorkflowTransitionHook.SCRIPT_HANDLER_NAME:
            if not config.get("script_id"):
                raise serializers.ValidationError("run_script rule must include config.script_id.")
            execution_variables = config.get("execution_variables") or {}
            if not isinstance(execution_variables, dict):
                raise serializers.ValidationError("config.execution_variables must be an object.")

        validated.append({"handler_name": handler_name, "rule_type": rule_type, "config": config})

    return validated


class WorkflowTransitionAPISerializer(serializers.ModelSerializer):
    workflow_state_id = serializers.UUIDField(source="workflow_state.id", read_only=True)
    transition_state_id = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(),
        source="transition_state",
        required=False,
        allow_null=True,
    )
    rejection_state_id = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(),
        source="rejection_state",
        required=False,
        allow_null=True,
    )
    member_ids = serializers.SerializerMethodField()
    pre_rules = serializers.ListField(child=serializers.DictField(), required=False, default=list, write_only=True)
    post_rules = serializers.ListField(child=serializers.DictField(), required=False, default=list, write_only=True)
    pre_hooks = serializers.SerializerMethodField()
    post_hooks = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowTransition
        fields = [
            "id",
            "workflow_state_id",
            "transition_state_id",
            "rejection_state_id",
            "required_approvals",
            "member_ids",
            "pre_rules",
            "post_rules",
            "pre_hooks",
            "post_hooks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workflow_state_id",
            "member_ids",
            "pre_hooks",
            "post_hooks",
            "created_at",
            "updated_at",
        ]

    def get_member_ids(self, obj):
        # Prefer the annotated value added by the view to avoid N+1.
        if hasattr(obj, "member_ids"):
            return [str(uid) for uid in (obj.member_ids or [])]
        return list(
            WorkflowTransitionApprover.objects.filter(
                workflow_transition=obj, deleted_at__isnull=True
            ).values_list("approver_id", flat=True)
        )

    def _get_hooks(self, obj, phase):
        return list(
            WorkflowTransitionHook.objects.filter(
                workflow_transition=obj,
                phase=phase,
                deleted_at__isnull=True,
            )
            .order_by("execution_order")
            .values("id", "hook_type", "handler_name", "config", "execution_order", "is_enabled")
        )

    def get_pre_hooks(self, obj):
        return self._get_hooks(obj, WorkflowTransitionHookPhase.PRE)

    def get_post_hooks(self, obj):
        return self._get_hooks(obj, WorkflowTransitionHookPhase.POST)

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
            str(sid)
            for sid in Script.objects.filter(id__in=script_ids)
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
        current_hooks = list(
            instance.hooks.filter(phase=phase, deleted_at__isnull=True).values(
                "id", "handler_name", "hook_type", "config"
            )
        )
        current_key_map = {
            self._hook_key(r["handler_name"], r["hook_type"], r["config"]): r["id"] for r in current_hooks
        }
        payload_keys = {self._hook_key(r["handler_name"], r["rule_type"], r["config"]) for r in hooks}

        ids_to_remove = [v for k, v in current_key_map.items() if k not in payload_keys]
        if ids_to_remove:
            instance.hooks.filter(id__in=ids_to_remove).update(deleted_at=timezone.now())

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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Flatten PrimaryKeyRelatedField representations to plain UUIDs.
        for field in ("transition_state_id", "rejection_state_id"):
            if data.get(field) and not isinstance(data[field], str):
                data[field] = str(data[field])
        return data


class WorkflowTransitionActivityAPISerializer(serializers.ModelSerializer):
    actor_id = serializers.UUIDField(source="actor.id", read_only=True)
    state_id = serializers.UUIDField(source="workflow_state.state_id", read_only=True)

    class Meta:
        model = WorkflowTransitionActivity
        fields = [
            "id",
            "actor_id",
            "state_id",
            "type",
            "old_value",
            "new_value",
            "epoch",
            "created_at",
        ]
        read_only_fields = fields
