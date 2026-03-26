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

import logging
from dataclasses import dataclass
from typing import Optional

from django.utils import timezone

from plane.ee.models import (
    WorkflowApprovalType,
    WorkflowStateType,
    WorkflowTransition,
    WorkflowTransitionHook,
    WorkflowTransitionHookPhase,
    WorkflowTransitionHookStatus,
    WorkflowHookExecutionStatus,
)

logger = logging.getLogger(__name__)


@dataclass
class ExecutionResult:
    allowed: bool
    error: Optional[str] = None
    execution_id: Optional[str] = None


class WorkflowTransitionExecutor:
    """
    Executes rules for a workflow transition.

    Dispatches each WorkflowTransitionHook to the correct handler based on
    handler_name. Currently implements run_script; other handlers (change_property,
    trigger_email, trigger_webhook) follow the same _handle_* pattern.

    Pre-validation: fail-fast — first failure blocks the state change.
    Post-actions: all rules run regardless of individual failures.
    """

    # ------------------------------------------------------------------ #
    # Public entry points                                                   #
    # ------------------------------------------------------------------ #

    def run_pre_validation(self, issue, workflow_transition) -> ExecutionResult:
        hooks = self._get_hooks(workflow_transition, WorkflowTransitionHookPhase.PRE)
        for hook in hooks:
            result = self._dispatch(hook, issue, workflow_transition)
            if not result.allowed:
                return result
        return ExecutionResult(allowed=True)

    def run_post_actions(self, issue, workflow_transition) -> None:
        hooks = self._get_hooks(workflow_transition, WorkflowTransitionHookPhase.POST)
        if not hooks:
            return
        for hook in hooks:
            try:
                result = self._dispatch(hook, issue, workflow_transition)
                if result.allowed:
                    logger.info(
                        "Post-action hook succeeded | hook_id=%s issue_id=%s",
                        hook.id,
                        issue.id,
                    )
                else:
                    logger.error(
                        "Post-action hook returned not-allowed | hook_id=%s issue_id=%s error=%s",
                        hook.id,
                        issue.id,
                        result.error,
                    )
            except Exception as e:
                logger.exception(
                    "Post-action hook raised an exception | hook_id=%s issue_id=%s error=%s",
                    hook.id,
                    issue.id,
                    e,
                )

    @classmethod
    def get_transition(cls, project_id, to_state_id, workflow_state_id, workflow_type, approval_type=None):
        base_qs = WorkflowTransition.objects.filter(
            project_id=project_id,
            workflow_state_id=workflow_state_id,
            deleted_at__isnull=True,
        )
        if workflow_type == WorkflowStateType.TRANSITION:
            return base_qs.filter(transition_state_id=to_state_id).first()
        elif workflow_type == WorkflowStateType.APPROVAL:
            if approval_type == WorkflowApprovalType.APPROVAL:
                return base_qs.filter(transition_state_id=to_state_id).first()
            elif approval_type == WorkflowApprovalType.REJECTION:
                return base_qs.filter(rejection_state_id=to_state_id).first()

    # ------------------------------------------------------------------ #
    # Dispatcher                                                            #
    # ------------------------------------------------------------------ #

    def _dispatch(self, rule, issue, workflow_transition) -> ExecutionResult:
        handler = self._HANDLER_REGISTRY.get(rule.handler_name)
        if handler is None:
            logger.warning("No handler registered for workflow rule handler_name=%s", rule.handler_name)
            return ExecutionResult(allowed=False, error=f"Unknown handler: {rule.handler_name}")
        return handler(self, rule, issue, workflow_transition)

    # ------------------------------------------------------------------ #
    # Handlers                                                              #
    # ------------------------------------------------------------------ #

    def _handle_run_script(self, rule, issue, workflow_transition) -> ExecutionResult:
        """Mirrors RunScriptAction.execute() from the automation engine."""
        from plane.runnerctl.services import execute_sync

        config = rule.config or {}
        script_id = config.get("script_id", "")
        execution_variables = config.get("execution_variables", {})

        if not script_id:
            return ExecutionResult(allowed=False, error="Rule has no script_id in config")

        input_data = {
            "event": {
                "event_type": "workflow.transition",
                "entity_type": "issue",
                "entity_id": str(issue.id),
                "workspace_id": str(issue.workspace_id),
                "project_id": str(issue.project_id),
                "payload": {
                    "data": {
                        "id": str(issue.id),
                        "state_id": str(issue.state_id) if issue.state_id else None,
                        "project_id": str(issue.project_id),
                        "workspace_id": str(issue.workspace_id),
                    }
                },
            },
            "context": {
                "workflow_transition_id": str(workflow_transition.id),
                "rule_id": str(rule.id),
            },
        }

        trigger_context = {
            "workflow_transition_id": str(workflow_transition.id),
            "rule_id": str(rule.id),
        }

        execution = WorkflowTransitionHookStatus.objects.create(
            workflow_transition_hook=rule,
            issue=issue,
            project_id=issue.project_id,
            workspace_id=issue.workspace_id,
            status=WorkflowHookExecutionStatus.PENDING,
            input_data=input_data,
        )
        execution.status = WorkflowHookExecutionStatus.RUNNING
        execution.started_at = timezone.now()
        execution.save(update_fields=["status", "started_at", "updated_at"])

        try:
            result = execute_sync(
                script_id=script_id,
                script_type="workflow_transition",
                input_data=input_data,
                execution_variables=execution_variables,
                workspace_id=str(issue.workspace_id),
                workspace_slug=issue.workspace.slug,
                trigger_type="workflow",
                trigger_id=str(workflow_transition.id),
                trigger_context=trigger_context,
            )
        except Exception as e:
            execution.status = WorkflowHookExecutionStatus.FAILED
            execution.completed_at = timezone.now()
            execution.error_message = str(e)
            execution.save(update_fields=["status", "completed_at", "error_message", "updated_at"])
            return ExecutionResult(allowed=False, error=str(e), execution_id=str(execution.id))

        if result.success:
            output = result.output_data or {}
            # Scripts can explicitly return {"success": false, "message": "..."}
            # to block the transition without throwing an error.
            if isinstance(output, dict) and output.get("success") is False:
                execution.status = WorkflowHookExecutionStatus.FAILED
                execution.completed_at = timezone.now()
                execution.error_message = output.get("message", "Pre-validation script returned not allowed")
                execution.output_data = output
                execution.save(update_fields=["status", "completed_at", "error_message", "output_data", "updated_at"])
                return ExecutionResult(
                    allowed=False,
                    error=execution.error_message,
                    execution_id=str(execution.id),
                )
            execution.status = WorkflowHookExecutionStatus.SUCCESS
            execution.completed_at = timezone.now()
            execution.output_data = output
            execution.save(update_fields=["status", "completed_at", "output_data", "updated_at"])
            return ExecutionResult(allowed=True, execution_id=str(execution.id))

        execution.status = WorkflowHookExecutionStatus.FAILED
        execution.completed_at = timezone.now()
        execution.error_message = result.error or ""
        execution.output_data = result.error_data or {}
        execution.save(update_fields=["status", "completed_at", "error_message", "output_data", "updated_at"])
        return ExecutionResult(allowed=False, error=result.error, execution_id=str(execution.id))

    def _handle_change_property(self, rule, issue, workflow_transition) -> ExecutionResult:
        """
        Future handler: change an issue property on transition.
        config shape: {"property_name": "priority", "property_value": ["high"], "change_type": "update"}
        """
        raise NotImplementedError("change_property handler is not yet implemented")

    def _handle_trigger_email(self, rule, issue, workflow_transition) -> ExecutionResult:
        """
        Future handler: send an email on transition.
        config shape: {"template_id": "...", "recipients": ["assignees", "watchers"]}
        """
        raise NotImplementedError("trigger_email handler is not yet implemented")

    def _handle_trigger_webhook(self, rule, issue, workflow_transition) -> ExecutionResult:
        """
        Future handler: call an external webhook on transition.
        config shape: {"url": "https://...", "method": "POST", "headers": {...}}
        """
        raise NotImplementedError("trigger_webhook handler is not yet implemented")

    # ------------------------------------------------------------------ #
    # Internal helpers                                                      #
    # ------------------------------------------------------------------ #

    _HANDLER_REGISTRY = {
        WorkflowTransitionHook.SCRIPT_HANDLER_NAME: _handle_run_script,
    }

    def _get_hooks(self, workflow_transition, phase):
        return list(
            WorkflowTransitionHook.objects.filter(
                workflow_transition=workflow_transition,
                phase=phase,
                is_enabled=True,
                deleted_at__isnull=True,
            ).order_by("execution_order", "created_at")
        )
