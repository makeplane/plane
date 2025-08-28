"""
Automation Execution Engine for the Plane Automation Engine.

This module provides the core execution logic for running automations
with a linear flow: Trigger → Condition (optional) → Action(s).
Supports multiple action nodes executed sequentially, stopping on first failure.
"""

import logging
from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List

from django.db import transaction, connection
from django.utils import timezone

from plane.automations.registry import NodeRegistry, BaseAutomationNode
from plane.ee.models import (
    Automation,
    AutomationVersion,
    AutomationNode,
    AutomationRun,
    NodeExecution,
    RunStatusChoices,
    NodeTypeChoices,
    AutomationActivity,
    AutomationScopeChoices,
)

# Using enum constants directly from models for type safety and consistency


# Using BaseAutomationNode as the type hint for node handlers


@dataclass
class ExecutionContext:
    """Standardized execution context for automation runs."""

    timestamp: str
    automation_run_id: Optional[str] = None
    automation_id: Optional[str] = None
    workspace_id: Optional[str] = None
    project_id: Optional[str] = None
    initiator_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for backwards compatibility."""
        return {
            "timestamp": self.timestamp,
            "automation_run_id": self.automation_run_id,
            "automation_id": self.automation_id,
            "workspace_id": self.workspace_id,
            "project_id": self.project_id,
            "initiator_id": self.initiator_id,
        }


@dataclass
class NodeResult:
    """Result from executing a single node."""

    success: bool
    output: Dict[str, Any] = field(default_factory=dict)
    error: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for backwards compatibility."""
        result = {"success": self.success}
        if self.output:
            result.update(self.output)
        if self.error:
            result["error"] = self.error
        return result


# TODO: Might have to store the issue id of the issue that was updated in the result
@dataclass
class AutomationResult:
    """Final result from automation execution."""

    automation_run_id: str
    status: str
    message: str
    result: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "automation_run_id": self.automation_run_id,
            "status": self.status,
            "message": self.message,
            "result": self.result,
        }


logger = logging.getLogger(__name__)


class AutomationExecutionEngine:
    """
    Execution engine for linear automation workflows.

    Handles the execution flow: Trigger → Condition (optional) → Action(s)
    Supports multiple action nodes executed sequentially, stopping on first failure.
    """

    def __init__(self):
        self.registry = NodeRegistry()

    def get_entity_id_field(self, entity_type, entity_id):
        # Workspace Logo
        if entity_type == AutomationScopeChoices.WORKITEM:
            return {"work_item_id": entity_id}

        return {}

    def _extract_source_entity_id(self, event: dict, entity_type: str) -> Optional[str]:
        """Extract the triggering issue ID from the event, if present."""
        try:
            if entity_type == AutomationScopeChoices.WORKITEM:
                return event.get("entity_id") or event.get("payload", {}).get(
                    "data", {}
                ).get("id")
            return None
        except Exception:
            return None

    def _validate_event(self, event: dict) -> Optional[str]:
        """
        Validate the event structure.

        Args:
            event: The database event

        Returns:
            str: Error message if invalid, None if valid
        """
        if not isinstance(event, dict):
            return "Event must be a dictionary"

        workspace_id = event.get("workspace_id")
        if not workspace_id or not isinstance(workspace_id, str):
            return "Event must contain valid workspace_id"

        event_type = event.get("event_type")
        if not event_type or not isinstance(event_type, str):
            return "Event must contain valid event_type"

        return None

    def _create_execution_context(
        self,
        automation_run: Optional[AutomationRun] = None,
        automation_id: Optional[str] = None,
        workspace_id: Optional[str] = None,
        project_id: Optional[str] = None,
        event: Optional[dict] = None,
    ) -> ExecutionContext:
        """
        Create standardized execution context.

        Args:
            automation_run: Optional automation run instance
            automation_id: Optional automation ID for pre-run context
            workspace_id: Optional workspace ID
            project_id: Optional project ID
            event: Optional event data

        Returns:
            ExecutionContext: Standardized execution context
        """
        # Extract initiator ID from event if present
        initiator_id = None
        if event:
            initiator_id = event.get("initiator_id")

        if automation_run:
            return ExecutionContext(
                timestamp=timezone.now().isoformat(),
                automation_run_id=str(automation_run.id),
                automation_id=str(automation_run.automation.id),
                workspace_id=str(automation_run.workspace.id),
                project_id=str(automation_run.project.id),
                initiator_id=initiator_id,
            )
        else:
            # Pre-run context
            return ExecutionContext(
                timestamp=timezone.now().isoformat(),
                automation_id=automation_id,
                workspace_id=workspace_id,
                project_id=project_id,
                initiator_id=initiator_id,
            )

    def _ensure_trigger_and_action_exist(self, nodes: Dict[str, Any]) -> Optional[str]:
        """
        Ensure that required trigger and action nodes are present.

        Args:
            nodes: Dictionary of loaded nodes

        Returns:
            str: Error message if validation fails, None if valid
        """
        if not nodes.get(NodeTypeChoices.TRIGGER):
            return "No trigger node found"

        action_nodes = nodes.get(NodeTypeChoices.ACTION)

        if not action_nodes or len(action_nodes) == 0:
            return "No action nodes found"

        return None

    def _execute_condition_and_action(
        self,
        automation_run: AutomationRun,
        nodes: Dict[str, Any],
        event: dict,
        context: ExecutionContext,
    ) -> AutomationResult:
        """
        Execute condition node (if present) then action nodes linearly.

        Args:
            automation_run: The automation run instance
            nodes: Loaded automation nodes
            event: The database event
            context: Execution context

        Returns:
            AutomationResult: Execution result with status and details
        """
        condition_node = nodes.get(NodeTypeChoices.CONDITION)  # Optional
        action_nodes = nodes.get(NodeTypeChoices.ACTION)  # List of action nodes

        # Step 1: Execute condition (if present)
        if condition_node:
            condition_result = self._execute_node(
                node_handler=condition_node["handler"],
                node_instance=condition_node["instance"],
                event=event,
                context=context,
                automation_run=automation_run,
            )
            if not condition_result.success:
                return self._finalize_automation_failure(
                    automation_run, "Condition failed", condition_result
                )

        # Step 2: Execute action nodes linearly
        # If any action fails, stop execution and return failure
        action_results = []
        for i, action_node in enumerate(action_nodes):
            action_result = self._execute_node(
                node_handler=action_node["handler"],
                node_instance=action_node["instance"],
                event=event,
                context=context,
                automation_run=automation_run,
            )
            action_results.append(action_result)

            if not action_result.success:
                return self._finalize_automation_failure(
                    automation_run, f"Action {i + 1} failed", action_result
                )

        # All actions succeeded
        # Use the last action result for the success response
        final_result = action_results[-1] if action_results else None
        return self._finalize_automation_success(
            automation_run, "Automation completed successfully", final_result
        )

    def _execute_automation_after_trigger(
        self,
        automation_run: AutomationRun,
        event: dict,
        trigger_result: NodeResult,
        nodes: Dict[str, Any],
    ) -> AutomationResult:
        """
        Execute automation workflow after trigger has already been validated.

        This method is used by dispatch_automation_event to avoid re-executing
        triggers that have already been tested.

        Args:
            automation_run: The automation run instance
            event: The database event that triggered the automation
            trigger_result: The result from trigger execution (already successful)
            nodes: Pre-loaded automation nodes

        Returns:
            AutomationResult: Execution result with status and details
        """
        try:
            # Validate event structure
            # TODO: Do we need to validate the event structure again?
            error_msg = self._validate_event(event)
            if error_msg:
                return self._finalize_automation_failure(automation_run, error_msg)

            # Validate required nodes
            # TODO: We're here because the trigger node was already validated in the dispatch_automation_event function.
            validation_error = self._ensure_trigger_and_action_exist(nodes)
            if validation_error:
                return self._finalize_automation_failure(
                    automation_run, validation_error
                )

            # Create execution context
            context = self._create_execution_context(
                automation_run=automation_run, event=event
            )

            # Record trigger execution (already successful)
            trigger_node = nodes.get(NodeTypeChoices.TRIGGER)
            self._log_node_execution(
                automation_run=automation_run,
                node_instance=trigger_node["instance"],
                event=event,
                context=context,
                result=trigger_result,
            )

            # Execute remaining workflow (condition → action)
            return self._execute_condition_and_action(
                automation_run=automation_run,
                nodes=nodes,
                event=event,
                context=context,
            )

        except Exception as e:
            logger.exception("Unexpected error during triggered automation execution")
            return self._finalize_automation_failure(
                automation_run, f"Execution error: {str(e)}"
            )

    def dispatch_automation_event(self, event: dict) -> List[Dict[str, Any]]:
        """
        Find matching automations for an event and start their execution.

        This function:
        1. Validates the event structure
        2. Finds active automations in the workspace/project
        3. Tests triggers first to see if they match the event
        4. Only creates AutomationRun if trigger succeeds
        5. Then executes the full automation workflow

        Args:
            event: The database event from the outbox system

        Returns:
            list: List of automation execution results
        """
        # Validate event structure first
        error_msg = self._validate_event(event)
        if error_msg:
            return [{"error": error_msg}]

        results = []

        try:
            # Extract workspace and project info from event
            workspace_id = event.get("workspace_id")
            project_id = event.get("project_id")

            # Find active automations that might match this event
            active_automations = (
                Automation.objects.filter(workspace_id=workspace_id, is_enabled=True)
                .select_related("current_version")
                .prefetch_related("current_version__nodes")
            )

            if project_id:
                active_automations = active_automations.filter(project_id=project_id)

            # IF there are no active automations, return early
            if not active_automations.exists():
                return results

            # For each automation, test trigger first before creating AutomationRun
            # TODO: Should we call a separate celery task to process each Automation?
            for automation in active_automations:
                try:
                    # Get the active version
                    version = automation.current_version
                    if not version:
                        continue

                    # Load automation nodes to test trigger
                    nodes = self._load_automation_nodes(version)
                    trigger_node = nodes.get(NodeTypeChoices.TRIGGER)

                    if not trigger_node:
                        # No trigger node - skip this automation
                        continue

                    # Create basic context for trigger evaluation
                    context = self._create_execution_context(
                        automation_id=str(automation.id),
                        workspace_id=workspace_id,
                        project_id=project_id or automation.project_id,
                        event=event,
                    )

                    # Test the trigger - NO AutomationRun created yet
                    raw_trigger_result = trigger_node["handler"].execute(
                        event, context.to_dict()
                    )

                    # Only proceed if trigger matches
                    if not raw_trigger_result.get("success", False):
                        # Trigger didn't match - automation not relevant for this event
                        continue

                    # Convert to structured result
                    trigger_result = NodeResult(
                        success=raw_trigger_result.get("success", False),
                        output={
                            k: v
                            for k, v in raw_trigger_result.items()
                            if k not in ["success", "error"]
                        },
                        error=raw_trigger_result.get("error", ""),
                    )

                    # Trigger matched! Now create AutomationRun and execute full workflow
                    with transaction.atomic():
                        # Ensure DB triggers mark events as originating from automations
                        try:
                            with connection.cursor() as cur:
                                cur.execute(
                                    "SELECT set_config('plane.initiator_type', 'SYSTEM.AUTOMATION', true)"
                                )
                        except Exception:
                            # Fail-safe: do not block automation if GUC is unavailable
                            pass

                        entity_type = event.get(
                            "entity_type", AutomationScopeChoices.WORKITEM
                        )
                        if entity_type == "issue":
                            entity_type = AutomationScopeChoices.WORKITEM

                        entity_id = self._extract_source_entity_id(event, entity_type)

                        automation_run = AutomationRun.objects.create(
                            automation=automation,
                            version=version,
                            workspace_id=workspace_id,
                            project_id=project_id or automation.project_id,
                            trigger_event=event,
                            trigger_source=event.get("source", "unknown"),
                            status=RunStatusChoices.RUNNING,
                            started_at=timezone.now(),
                            entity_type=entity_type,
                            initiator_id=event.get("initiator_id", None),
                            **self.get_entity_id_field(entity_type, entity_id),
                        )

                        # Update automation run count and last run at
                        automation.last_run_at = timezone.now()
                        automation.run_count += 1
                        automation.save(update_fields=["last_run_at", "run_count"])

                        # Record automation run activity
                        try:
                            AutomationActivity.objects.create(
                                automation=automation,
                                automation_version=version,
                                automation_run=automation_run,
                                actor=getattr(automation, "bot_user", None),
                                verb="created",
                                field="automation.run_history",
                                new_value=str(automation_run.id),
                                old_value=None,
                                old_identifier=None,
                                new_identifier=None,
                                epoch=event.get("epoch", None),
                                project_id=project_id,
                                workspace_id=workspace_id,
                            )
                        except Exception:
                            logger.warning(
                                "Failed to create AutomationActivity for run",
                                exc_info=True,
                            )

                        # Execute the full automation (trigger already succeeded)
                        result = self._execute_automation_after_trigger(
                            automation_run, event, trigger_result, nodes
                        )
                        results.append(result.to_dict())  # Convert back to dict for API

                except Exception as e:
                    logger.exception(f"Failed to process automation {automation.id}")
                    results.append(
                        {
                            "automation_id": str(automation.id),
                            "error": f"Failed to process automation: {str(e)}",
                        }
                    )

            return results

        except Exception as e:
            logger.exception("Event dispatch failed")
            return [{"error": f"Event dispatch failed: {str(e)}"}]

    def _load_automation_nodes(self, version: AutomationVersion) -> Dict[str, Any]:
        """
        Load and prepare automation nodes for execution.

        Args:
            version: The automation version to load nodes from

        Returns:
            dict: Dictionary with 'trigger', 'condition' keys containing single nodes,
            and 'action' key containing a list of action nodes ordered by execution_order
        """
        nodes = {}

        # Get all nodes for this version (optimize if not already prefetched)
        # TODO: Need to double check the node fetching logic and how it's preserving the execution order
        if (
            hasattr(version, "_prefetched_objects_cache")
            and "nodes" in version._prefetched_objects_cache
        ):
            # Use prefetched nodes if available
            automation_nodes = version.nodes.all()
        else:
            # Fallback to direct query
            automation_nodes = AutomationNode.objects.filter(version=version)

        for node in automation_nodes:
            # TODO: The nodes dictionary should be have a key called instance instead of model.
            try:
                # Get node handler from registry
                node_meta = self.registry.get(node.handler_name)

                # Create node instance with parameters
                node_handler = node_meta.handler(**node.config)

                # Store nodes by type - action nodes as list, others as single nodes
                if node.node_type == NodeTypeChoices.ACTION:
                    if NodeTypeChoices.ACTION not in nodes:
                        nodes[NodeTypeChoices.ACTION] = []
                    nodes[NodeTypeChoices.ACTION].append(
                        {"handler": node_handler, "instance": node}
                    )
                else:
                    # Store trigger and condition nodes as single items
                    nodes[node.node_type] = {"handler": node_handler, "instance": node}

            except Exception as e:
                # Log error but continue with other nodes
                logger.warning(f"Failed to load node {node.handler_name}: {e}")
                continue

        return nodes

    def _execute_node(
        self,
        node_handler: BaseAutomationNode,
        node_instance: AutomationNode,
        event: dict,
        context: ExecutionContext,
        automation_run: AutomationRun,
    ) -> NodeResult:
        """
        Execute a single node and record the execution.

        Args:
            node_handler: The node handler instance to execute
            node_instance: The AutomationNode model instance
            event: The database event
            context: Execution context
            automation_run: The automation run for tracking

        Returns:
            NodeResult: Node execution result
        """
        # Create node execution record
        node_execution = NodeExecution.objects.create(
            run=automation_run,
            node=node_instance,
            status=RunStatusChoices.RUNNING,
            started_at=timezone.now(),
            input_data={"event": event},
            execution_context=context.to_dict(),
            workspace_id=automation_run.workspace_id,
            project_id=automation_run.project_id,
        )

        try:
            # Execute the node (nodes still expect dict context for now)
            raw_result = node_handler.execute(event, context.to_dict())

            # Convert to structured result
            node_result = NodeResult(
                success=raw_result.get("success", False),
                output={
                    k: v for k, v in raw_result.items() if k not in ["success", "error"]
                },
                error=raw_result.get("error", ""),
            )

            # Update execution record
            node_execution.status = (
                RunStatusChoices.SUCCESS
                if node_result.success
                else RunStatusChoices.FAILED
            )
            node_execution.completed_at = timezone.now()
            node_execution.output_data = node_result.to_dict()
            node_execution.error_message = node_result.error
            node_execution.save()

            return node_result

        except Exception as e:
            # Update execution record with error
            logger.exception(
                f"Node execution failed: {getattr(node_instance, 'name', 'unknown')}"
            )
            node_execution.status = RunStatusChoices.FAILED
            node_execution.completed_at = timezone.now()
            node_execution.error_message = str(e)

            error_result = NodeResult(success=False, error=str(e))
            node_execution.output_data = error_result.to_dict()
            node_execution.save()

            return error_result

    def _log_node_execution(
        self,
        automation_run: AutomationRun,
        node_instance: AutomationNode,
        event: dict,
        context: ExecutionContext,
        result: NodeResult,
    ) -> None:
        """
        Log a node execution that has already been performed.

        This is used to log trigger executions that happened during
        the dispatch phase before AutomationRun was created.

        Args:
            automation_run: The automation run for tracking
            node_instance: The node instance that was executed
            event: The database event
            context: Execution context
            result: The execution result
        """
        # Create node execution record for already-executed node
        NodeExecution.objects.create(
            run=automation_run,
            node=node_instance,
            status=(
                RunStatusChoices.SUCCESS if result.success else RunStatusChoices.FAILED
            ),
            started_at=timezone.now(),  # Approximate - actual execution was earlier
            completed_at=timezone.now(),
            input_data={"event": event},
            execution_context=context.to_dict(),
            output_data=result.to_dict(),
            error_message=result.error,
            workspace_id=automation_run.workspace_id,
            project_id=automation_run.project_id,
        )

    def _finalize_automation_success(
        self, automation_run: AutomationRun, message: str, result: NodeResult
    ) -> AutomationResult:
        """Finalize automation as successfully completed."""
        automation_run.status = RunStatusChoices.SUCCESS
        automation_run.completed_at = timezone.now()
        automation_run.result_data = {
            "message": message,
            "final_result": result.to_dict(),
        }
        automation_run.save()

        return AutomationResult(
            automation_run_id=str(automation_run.id),
            status=RunStatusChoices.SUCCESS,
            message=message,
            result=result.to_dict(),
        )

    def _finalize_automation_failure(
        self,
        automation_run: AutomationRun,
        message: str,
        result: Optional[NodeResult] = None,
    ) -> AutomationResult:
        """Finalize automation as failed."""
        automation_run.status = RunStatusChoices.FAILED
        automation_run.completed_at = timezone.now()

        result_dict = result.to_dict() if result else {}
        automation_run.result_data = {"message": message, "error_result": result_dict}
        automation_run.save()

        return AutomationResult(
            automation_run_id=str(automation_run.id),
            status=RunStatusChoices.FAILED,
            message=message,
            result=result_dict,
        )


# Singleton instance for easy access
automation_engine = AutomationExecutionEngine()


def dispatch_automation_event(event: dict) -> List[Dict[str, Any]]:
    """
    Convenience function to dispatch automation events.

    Args:
        event: The database event from the outbox system

    Returns:
        list: List of automation execution results
    """
    return automation_engine.dispatch_automation_event(event)


def get_automation_status(automation_run_id: str) -> Dict[str, Any]:
    """
    Get the current status of an automation run.

    Args:
        automation_run_id: UUID of the automation run

    Returns:
        dict: Status information
    """
    try:
        automation_run = AutomationRun.objects.get(id=automation_run_id)

        # Get node executions
        node_executions = NodeExecution.objects.filter(
            automation_run=automation_run
        ).order_by("started_at")

        return {
            "automation_run_id": str(automation_run.id),
            "automation_id": str(automation_run.automation.id),
            "status": automation_run.status,
            "started_at": (
                automation_run.started_at.isoformat()
                if automation_run.started_at
                else None
            ),
            "completed_at": (
                automation_run.completed_at.isoformat()
                if automation_run.completed_at
                else None
            ),
            "result_data": automation_run.result_data,
            "node_executions": [
                {
                    "node_name": execution.node_name,
                    "node_type": execution.node_type,
                    "status": execution.status,
                    "started_at": (
                        execution.started_at.isoformat()
                        if execution.started_at
                        else None
                    ),
                    "completed_at": (
                        execution.completed_at.isoformat()
                        if execution.completed_at
                        else None
                    ),
                    "output_data": execution.output_data,
                    "error_message": execution.error_message,
                }
                for execution in node_executions
            ],
        }

    except AutomationRun.DoesNotExist:
        return {"error": "Automation run not found"}
    except Exception as e:
        return {"error": f"Failed to get status: {str(e)}"}
