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
Hybrid Placeholder Orchestration System

This module provides programmatic orchestration of action execution with dependency resolution.
Instead of asking the LLM to handle everything, we use:
- Python for dependency tracking and execution flow control
- Focused LLM calls for extracting specific values from tool results
"""

import json
import re
from datetime import datetime
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple

from pydantic import BaseModel
from pydantic import Field

from pi import logger
from pi.services.chat.helpers.action_execution_helpers import IMPLICIT_DEPENDENCY_RULES
from pi.services.chat.helpers.entity_inference import infer_selected_entity

log = logger.getChild(__name__)


def _format_validation_error(error_str: str) -> str:
    """
    Format Pydantic validation errors to show only essential information.

    Converts verbose Pydantic validation traces like:
        "3 validation errors for cycles_add_work_items
        cycle_id
          Field required [type=missing, input_value={...}, input_type=dict]
          For further information visit https://errors.pydantic.dev/2.8/v/missing"

    To concise user-friendly messages like:
        "Missing required fields: cycle_id, issues, project_id"

    Args:
        error_str: The raw error string from Pydantic

    Returns:
        A concise, user-friendly error message
    """

    # Check if this is a Pydantic validation error
    if "validation error" in error_str.lower():
        # Extract field names from the error
        missing_fields = []

        # Pattern to match field names followed by "Field required"
        # This handles multi-line format where field name is on its own line
        lines = error_str.split("\n")
        for i, line in enumerate(lines):
            line = line.strip()
            # Look for lines that contain "Field required"
            if "Field required" in line and i > 0:
                # The field name is typically on the previous line
                prev_line = lines[i - 1].strip()
                # Filter out lines that are parts of error messages
                if prev_line and not prev_line.startswith("[") and not prev_line.startswith("For further"):
                    missing_fields.append(prev_line)

        if missing_fields:
            # Remove duplicates while preserving order
            unique_fields = list(dict.fromkeys(missing_fields))
            return f"Missing required fields: {", ".join(unique_fields)}"

    # For other validation errors, try to extract a meaningful summary
    if "validation error" in error_str.lower():
        # Extract the first line which usually has the summary
        first_line = error_str.split("\n")[0]
        # Return first 150 characters to keep it concise
        return first_line[:150]

    # For non-Pydantic errors, truncate to reasonable length
    return error_str[:200] if len(error_str) > 200 else error_str


# Pydantic models for structured extraction
class ExtractedEntity(BaseModel):
    """Extracted entity information from execution context."""

    entity_type: str = Field(..., description="Type of entity (e.g., 'project', 'cycle')")
    entity_name: str = Field(..., description="Name of the entity as it appears in context")
    entity_id: str = Field(..., description="UUID of the entity (use for *_id fields)")
    entity_identifier: Optional[str] = Field(None, description="Short identifier/slug (e.g., 'PROJ', use for project identifier fields)")


class PlaceholderResolutionBatch(BaseModel):
    """Batch resolution for all placeholders in an action."""

    resolutions: List[ExtractedEntity] = Field(default_factory=list, description="List of resolved entities")


class PlaceholderOrchestrator:
    """
    Orchestrates execution of planned actions with smart placeholder resolution.

    Key Features:
    - Detects dependencies between actions
    - Executes independent actions in parallel
    - Resolves placeholders using focused LLM extractions
    - Validates extracted values (e.g., UUID format)
    """

    def __init__(self, planned_actions: List[Dict[str, Any]], chatbot, method_executor, context: Dict[str, Any], chat_id: str, message_id: str, db):
        """
        Initialize the orchestrator.

        Args:
            planned_actions: List of actions to execute, each with tool_name and args
            chatbot: PlaneChatBot instance for LLM access and tool building
            method_executor: Executor for calling Plane API methods
            context: Execution context (workspace_slug, user_id, etc.)
            db: Database session for tracking
        """
        self.planned_actions = planned_actions
        self.chatbot = chatbot
        self.method_executor = method_executor
        self.context = context
        self.db = db
        self.chat_id = chat_id
        self.message_id = message_id

        # Execution state
        self.execution_context: Dict[str, Dict[str, Any]] = {}  # Stores tool results
        self.results: List[Dict[str, Any]] = []  # Final execution results
        self.tools_cache: Dict[str, Any] = {}  # Cache of built tools
        self.failed_entities: set = set()  # Track entities that failed to create

        # UUID validation pattern
        self.uuid_pattern = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")

    async def execute_all(self) -> List[Dict[str, Any]]:
        """
        Main orchestration loop with dependency resolution.

        Returns:
            List of execution results with metadata
        """
        log.info(f"Starting orchestrated execution of {len(self.planned_actions)} actions")
        log.info(f"\n\nPlanned actions: {self.planned_actions}\n\n")

        remaining = list(self.planned_actions)
        iteration = 0
        max_iterations = len(self.planned_actions) * 2  # Prevent infinite loops

        while remaining and iteration < max_iterations:
            iteration += 1
            log.info(f"Iteration {iteration}: {len(remaining)} actions remaining")

            # 1. Partition actions into ready vs blocked
            ready, blocked = await self._partition_by_readiness(remaining)

            log.info(f"Ready: {len(ready)}, Blocked: {len(blocked)}")

            # 2. Deadlock detection
            if not ready and blocked:
                error_msg = self._build_deadlock_error(blocked)
                log.error(error_msg)
                raise RuntimeError(error_msg)

            # 3. Execute all ready actions
            for action in ready:
                try:
                    result = await self._execute_action(action)
                    self.results.append(result)

                    # CRITICAL: Only update context if action succeeded
                    if result.get("success"):
                        self._update_context(action, result)
                    else:
                        log.warning(f"Action {action.get("tool_name")} failed, not updating context")
                        # Track failed entity to fail dependent actions early
                        self._track_failed_entity(action)

                    remaining.remove(action)
                except Exception as e:
                    log.error(f"Failed to execute action {action.get("tool_name")}: {e}", exc_info=True)
                    # Format error message for user-friendly display
                    formatted_error = _format_validation_error(str(e))
                    # Create failure result
                    failure_result = {
                        "tool_name": action.get("tool_name"),
                        "result": f"❌ Failed to execute: {formatted_error}",
                        "entity_info": None,
                        "artifact_id": action.get("artifact_id"),
                        "version_id": action.get("version_id"),  # Include version_id for execution status update
                        "sequence": len(self.results) + 1,
                        "artifact_type": action.get("entity_type"),
                        "executed_at": datetime.utcnow().isoformat(),
                        "success": False,
                        "error": formatted_error,
                    }
                    self.results.append(failure_result)
                    remaining.remove(action)
                    # Track failed entity to fail dependent actions early
                    self._track_failed_entity(action)

            # 4. Try to resolve placeholders for blocked actions
            for action in blocked:
                try:
                    await self._resolve_placeholders_in_action(action)
                except Exception as e:
                    log.warning(f"Failed to resolve placeholders for {action.get("tool_name")}: {e}")

        if iteration >= max_iterations:
            log.warning(f"Reached max iterations ({max_iterations}), stopping")

        log.info(f"Orchestration complete. Executed {len(self.results)} actions successfully")
        return self.results

    async def _partition_by_readiness(self, actions: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Split actions into ready (can execute now) vs blocked (has unresolved placeholders or pending implicit dependencies).

        Args:
            actions: List of actions to partition

        Returns:
            Tuple of (ready_actions, blocked_actions)
        """
        ready = []
        blocked = []

        # Get list of tool names currently pending execution (including the ones we're checking)
        pending_tool_names: List[str] = [tool_name for a in actions if (tool_name := a.get("tool_name")) is not None]

        for action in actions:
            is_blocked = False

            # 1. Check for unresolved placeholders
            if await self._has_unresolved_placeholders(action):
                is_blocked = True

            # 2. Check for implicit dependencies on other PENDING actions
            # If an action depends on a tool that is still in the 'actions' list (not executed yet),
            # it should be blocked.
            elif self._has_pending_implicit_dependency(action, pending_tool_names):
                is_blocked = True

            # 3. Check if action depends on failed entities
            elif self._depends_on_failed_entity(action):
                is_blocked = True

            if is_blocked:
                blocked.append(action)
            else:
                ready.append(action)

        return ready, blocked

    def _has_pending_implicit_dependency(self, action: Dict[str, Any], pending_tool_names: List[str]) -> bool:
        """
        Check if action has an implicit dependency on a tool that is yet to be executed.
        """
        tool_name = action.get("tool_name")

        for prerequisite, dependent in IMPLICIT_DEPENDENCY_RULES:
            if tool_name == dependent:
                # If this is a dependent tool, check if its prerequisite is still pending
                if prerequisite in pending_tool_names:
                    # Special case: don't block if we are checking against ourselves (rare but possible)
                    # or if there are multiple instances of same tool (handled by loop logic)
                    log.info(f"Action '{tool_name}' blocked by pending implicit dependency '{prerequisite}'")
                    return True

        return False

    async def _has_unresolved_placeholders(self, action: Dict[str, Any]) -> bool:
        """
        Check if action has placeholders that cannot yet be resolved from context.

        Args:
            action: Action to check

        Returns:
            True if action has unresolved placeholders
        """
        args = action.get("args", {})

        for key, value in args.items():
            if self._is_placeholder(value):
                # Check if we can resolve this placeholder from current context
                entity_type, entity_name = self._parse_placeholder(value)
                if not self._can_resolve_from_context(entity_type, entity_name):
                    return True

            # Check lists for placeholders
            if isinstance(value, list):
                for item in value:
                    if self._is_placeholder(item):
                        entity_type, entity_name = self._parse_placeholder(item)
                        if not self._can_resolve_from_context(entity_type, entity_name):
                            return True

        return False

    async def _resolve_placeholders_in_action(self, action: Dict[str, Any]):
        """
        Resolve all placeholders in an action's arguments.

        Args:
            action: Action with placeholders to resolve
        """
        args = action.get("args", {})

        for key, value in args.items():
            if self._is_placeholder(value):
                resolved = await self._resolve_single_placeholder(key, value)
                args[key] = resolved
                log.info(f"Resolved {key}: {value} -> {resolved}")

            # Handle lists of placeholders
            elif isinstance(value, list):
                resolved_list = []
                for item in value:
                    if self._is_placeholder(item):
                        resolved = await self._resolve_single_placeholder(key, item)
                        resolved_list.append(resolved)
                    else:
                        resolved_list.append(item)
                if resolved_list != value:
                    args[key] = resolved_list

    async def _resolve_single_placeholder(self, field_name: str, placeholder: str) -> str:
        """
        Programmatically resolve placeholder by looking up entity in execution context.

        NO LLM CALLS - Pure programmatic lookup for speed, reliability, and cost savings.

        Args:
            field_name: Name of the field (e.g., "project_id", "issues")
            placeholder: Placeholder string (e.g., "<id of project: Luxury Car>")

        Returns:
            Resolved value for this field

        Raises:
            ValueError: If entity not found in context or validation fails
        """
        entity_type, entity_name = self._parse_placeholder(placeholder)

        if not entity_type or not entity_name:
            raise ValueError(f"Failed to parse placeholder: {placeholder}")

        # Build lookup key (lowercase for case-insensitive matching)
        lookup_key = f"{entity_type}:{entity_name.lower()}"
        name_key = entity_name.lower()

        # Try exact match first (keys are stored lowercase)
        if lookup_key in self.execution_context:
            context_entry = self.execution_context[lookup_key]
        elif name_key in self.execution_context:
            # Fallback to name-only lookup
            context_entry = self.execution_context[name_key]
        else:
            raise ValueError(
                f"Entity '{entity_name}' (type: {entity_type}) not found in execution context. "
                f"Available entities: {list(self.execution_context.keys())}"
            )

        # Extract entity_info from the stored result
        entity_info = context_entry.get("entity_info", {})

        if not entity_info:
            raise ValueError(f"No entity_info found for '{entity_name}'. " f"Stored context entry: {context_entry}")

        # Programmatically select the appropriate field
        # LOGIC: Almost all fields are entity references (UUID) except slugs/identifiers

        if field_name in ["workspace_slug", "identifier"]:
            # Slug/identifier fields → use entity_identifier (short code like "PROJ")
            resolved_value = entity_info.get("entity_identifier")
            if not resolved_value:
                # Fallback to entity_id if identifier not present
                log.warning(f"No entity_identifier for '{entity_name}', using entity_id as fallback")
                resolved_value = entity_info.get("entity_id")
        else:
            # ALL other fields are entity references → use entity_id (UUID)
            # This includes: project_id, cycle_id, issue_id, issues, assignees, members, labels, etc.
            resolved_value = entity_info.get("entity_id")
            if not resolved_value:
                raise ValueError(f"No entity_id found for '{entity_name}' in entity_info: {entity_info}")

        if not resolved_value:
            raise ValueError(f"Could not extract value for field '{field_name}' from entity '{entity_name}'. " f"Entity info: {entity_info}")

        # Validate the resolved value
        self._validate_extracted_value(field_name, resolved_value)

        log.info(f"✅ Resolved {field_name}='{placeholder}' → '{resolved_value}' " f"(from {entity_type}:{entity_name})")

        return resolved_value

    def _build_extraction_prompt(self, entity_type: str, entity_name: str) -> str:
        """
        Build a focused prompt for extracting entity information with structured output.

        Args:
            entity_type: Type of entity to find (e.g., "project", "cycle")
            entity_name: Name of entity to find (e.g., "Motor Bike")

        Returns:
            Extraction prompt string requesting structured JSON
        """
        # Escape curly braces in the context JSON so LangChain doesn't treat them as variables
        context_json = json.dumps(self.execution_context, indent=2)
        escaped_context = context_json.replace("{", "{{").replace("}", "}}")

        prompt = f"""You are extracting entity information from tool execution results.

TASK: Extract complete entity information for a specific entity

ENTITY TO FIND: {entity_type} named "{entity_name}"

CONTEXT (Tool execution results):
```json
{escaped_context}
```

INSTRUCTIONS:
You must extract ALL of the following fields for the requested entity:
1. entity_type - The type of entity (e.g., "project", "cycle", "workitem")
2. entity_name - The exact name of the entity as it appears in the context
3. entity_id - The UUID of the entity (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
4. entity_identifier - The short identifier/slug (e.g., "PROJ") if available, null if not

CRITICAL RULES:
- entity_id is ALWAYS a UUID (36 characters with hyphens)
- entity_identifier is a SHORT code like "MOTO" or "PROJ" (or null if not present)
- DO NOT confuse these two! They are completely different fields!
- Look in the entity_info or entity section of the context

OUTPUT FORMAT:
Return a JSON object with this exact structure:
```json
{{{{
  "entity_type": "project",
  "entity_name": "Motor Bike",
  "entity_id": "acf5c262-790b-4a15-bd56-501bb8863968",
  "entity_identifier": "MOTO"
}}}}
```

IMPORTANT:
- Return ONLY the JSON object, no other text
- You may wrap it in markdown code blocks if needed
- All fields are required except entity_identifier (can be null)
- Make sure the entity_id is the UUID, NOT the identifier!
"""
        return prompt

    def _validate_extracted_value(self, field_name: str, value: str):
        """
        Validate that extracted value has the correct format.

        Args:
            field_name: Name of the field
            value: Extracted value to validate

        Raises:
            ValueError: If validation fails
        """
        # Validate UUID fields
        if field_name.endswith("_id"):
            if not self._is_valid_uuid(value):
                raise ValueError(
                    f"Field '{field_name}' requires UUID format, but got: '{value}'. " f"This looks like an identifier/slug, not a UUID."
                )

        # Basic presence check
        if not value or value.strip() == "":
            raise ValueError(f"Extracted value for '{field_name}' is empty")

    def _is_valid_uuid(self, value: str) -> bool:
        """Check if value matches UUID format."""
        return bool(self.uuid_pattern.match(value))

    async def _execute_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a single action (all placeholders should be resolved at this point).

        Args:
            action: Action to execute

        Returns:
            Execution result with metadata
        """
        tool_name = action["tool_name"]
        args = action["args"]

        log.info(f"Executing: {tool_name} with args: {args}")

        # Build tool if not cached
        if tool_name not in self.tools_cache:
            # Special cases where tool name doesn't follow {category}_{method} pattern
            SPECIAL_TOOL_CATEGORIES = {
                "create_epic": "workitems",
                "update_epic": "workitems",
            }

            # Extract category from tool name
            if tool_name in SPECIAL_TOOL_CATEGORIES:
                category = SPECIAL_TOOL_CATEGORIES[tool_name]
            else:
                # Standard pattern: {category}_{method}
                # e.g., "initiatives_create_label" -> "initiatives"
                category = tool_name.split("_")[0] if "_" in tool_name else tool_name

            log.info(f"Building tools for category '{category}' (tool: {tool_name})")
            tools = self.chatbot._build_method_tools(category, self.method_executor, self.context)
            for tool in tools:
                self.tools_cache[tool.name] = tool

        # Get the tool
        tool = self.tools_cache.get(tool_name)
        if not tool:
            raise ValueError(f"Tool '{tool_name}' not found")

        # Execute the tool
        log.info(f"[DEBUG] About to invoke tool '{tool_name}' with args: {args}")
        try:
            result = await tool.ainvoke(args)
            log.info(f"[DEBUG] Tool '{tool_name}' invocation completed. Result type: {type(result)}")
        except Exception as tool_error:
            log.error(f"[DEBUG] Tool '{tool_name}' raised exception during ainvoke: {tool_error}", exc_info=True)
            raise

        if not isinstance(result, dict):
            raise ValueError(f"Tool '{tool_name}' must return a dict, got {type(result)}")

        # Build execution result
        message = result.get("message") or ""
        ok = bool(result.get("ok", True))
        entity_info = result.get("entity")

        if ok and not entity_info:
            entity_info = await infer_selected_entity(args, self.context, entity_type_hint=action.get("entity_type"))

        execution_result = {
            "tool_name": tool_name,
            "result": message,
            "entity_info": entity_info,
            "artifact_id": action.get("artifact_id"),
            "version_id": action.get("version_id"),  # Include version_id for execution status update
            "sequence": len(self.results) + 1,
            "artifact_type": action.get("entity_type"),
            "executed_at": datetime.utcnow().isoformat(),
            "success": ok,
        }

        if not ok:
            execution_result["error"] = result.get("error", "Unknown error")

        # Preserve workitem_entity if present (e.g., from intake creation)
        if "workitem_entity" in result:
            execution_result["workitem_entity"] = result["workitem_entity"]

        return execution_result

    def _update_context(self, action: Dict[str, Any], result: Dict[str, Any]):
        """
        Store execution result in context for future placeholder resolution.

        CRITICAL: Stores under BOTH the planned name and actual name to handle
        cases where the SDK modifies the name on conflict (e.g., "Motor Bike" → "Motor Bike47119").

        Args:
            action: Executed action with original planned args
            result: Execution result with actual entity_info
        """
        entity_info = result.get("entity_info", {})
        if not entity_info:
            return

        entity_type = entity_info.get("entity_type")
        actual_name = entity_info.get("entity_name")  # Name from API response (may be modified)

        if not entity_type or not actual_name:
            return

        # Get the planned name from action args
        # Check both 'name' and 'display_name' (properties use display_name)
        planned_name = action.get("args", {}).get("name") or action.get("args", {}).get("display_name")

        # Build all possible lookup keys (use lowercase for case-insensitive matching)
        keys = [
            f"{entity_type}:{actual_name.lower()}",  # e.g., "property:severity"
            actual_name.lower(),  # Allow lookup by actual name alone
        ]

        # IMPORTANT: Also store under planned name if different from actual
        # This handles SDK name modifications on conflict (409) AND case differences
        if planned_name:
            keys.append(f"{entity_type}:{planned_name.lower()}")  # e.g., "property:severity"
            keys.append(planned_name.lower())  # Allow lookup by planned name
            if planned_name.lower() != actual_name.lower():
                log.info(f"⚠️ Name mismatch: planned='{planned_name}' vs actual='{actual_name}'. " f"Storing under both names for lookup.")

        # Store under all keys
        for key in keys:
            self.execution_context[key] = result

        log.info(f"✅ Stored in context: {entity_type}:{actual_name} (with {len(keys)} lookup keys)")

        # If result includes a workitem_entity (e.g., from intake creation), also store it
        if "workitem_entity" in result:
            workitem_entity = result["workitem_entity"]
            workitem_name = workitem_entity.get("entity_name")
            workitem_type = workitem_entity.get("entity_type", "workitem")
            if workitem_name:
                workitem_result = {"entity_info": workitem_entity, **result}

                workitem_keys = [
                    f"{workitem_type}:{workitem_name.lower()}",
                    f"{workitem_type}:{actual_name.lower()}",
                ]
                if planned_name:
                    workitem_keys.append(f"{workitem_type}:{planned_name.lower()}")

                for key in workitem_keys:
                    self.execution_context[key] = workitem_result

                log.info(f"✅ Also stored secondary entity: {workitem_type}:{workitem_name} (ID: {workitem_entity.get("entity_id")})")

    def _can_resolve_from_context(self, entity_type: Optional[str], entity_name: Optional[str]) -> bool:
        """
        Check if we have this entity in our execution context (case-insensitive).

        Args:
            entity_type: Type of entity (e.g., "project")
            entity_name: Name of entity (e.g., "Motor Bike")

        Returns:
            True if entity is available in context
        """
        if not entity_type or not entity_name:
            return False

        # Check if we have this entity stored (case-insensitive)
        key = f"{entity_type}:{entity_name.lower()}"
        name_key = entity_name.lower()
        return key in self.execution_context or name_key in self.execution_context

    def _is_placeholder(self, value: Any) -> bool:
        """Check if value is a placeholder string."""
        return isinstance(value, str) and "<id of" in value

    def _parse_placeholder(self, placeholder: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Parse placeholder string into entity type and name.

        Args:
            placeholder: Placeholder string (e.g., "<id of project: Motor Bike>")

        Returns:
            Tuple of (entity_type, entity_name), or (None, None) if parse fails
        """
        # Pattern: '<id of {entity_type}: {entity_name}>'
        match = re.match(r"<id of (\w+): (.+)>", placeholder)
        if match:
            return match.group(1), match.group(2).strip()
        return None, None

    def _track_failed_entity(self, action: Dict[str, Any]):
        """Track entity that failed to create."""
        args = action.get("args", {})
        entity_name = args.get("name") or args.get("display_name")
        entity_type = action.get("artifact_type")  # Fixed: was "entity_type", should be "artifact_type"

        if entity_name and entity_type:
            failed_key = f"{entity_type}:{entity_name.lower()}"
            self.failed_entities.add(failed_key)
            log.warning(f"Tracked failed entity: {failed_key}")

    def _depends_on_failed_entity(self, action: Dict[str, Any]) -> bool:
        """Check if action depends on an entity that failed to create."""
        args = action.get("args", {})

        for key, value in args.items():
            if self._is_placeholder(value):
                entity_type, entity_name = self._parse_placeholder(value)
                if entity_type and entity_name:
                    failed_key = f"{entity_type}:{entity_name.lower()}"
                    if failed_key in self.failed_entities:
                        log.error(f"Action {action.get("tool_name")} depends on failed entity: {failed_key}")
                        # Create immediate failure result
                        failure_result = {
                            "tool_name": action.get("tool_name"),
                            "result": f"Cannot execute: prerequisite '{entity_name}' ({entity_type}) failed to create",
                            "entity_info": None,
                            "artifact_id": action.get("artifact_id"),
                            "version_id": action.get("version_id"),  # Include version_id for execution status update
                            "sequence": len(self.results) + 1,
                            "artifact_type": action.get("entity_type"),
                            "executed_at": datetime.utcnow().isoformat(),
                            "success": False,
                            "error": f"Prerequisite entity '{entity_name}' failed to create",
                        }
                        self.results.append(failure_result)
                        return True

        return False

    def _build_deadlock_error(self, blocked_actions: List[Dict[str, Any]]) -> str:
        """
        Build informative error message for deadlock situations.

        Args:
            blocked_actions: Actions that are still blocked

        Returns:
            Error message string
        """
        placeholders = []
        for action in blocked_actions:
            args = action.get("args", {})
            for key, value in args.items():
                if self._is_placeholder(value):
                    placeholders.append(value)

        available_entities = list(self.execution_context.keys())
        failed_entities_list = list(self.failed_entities)

        return (
            f"Deadlock detected: Cannot resolve placeholders.\n"
            f"Blocked placeholders: {placeholders}\n"
            f"Available entities in context: {available_entities}\n"
            f"Failed entities (not created): {failed_entities_list}\n"
            f"Possible causes:\n"
            f"- Prerequisite entity creation failed (check failed entities above)\n"
            f"- Entity name mismatch between placeholder and actual name\n"
            f"- Circular dependency between actions"
        )
