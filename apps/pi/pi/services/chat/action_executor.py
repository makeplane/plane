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

# batch_execution.py (~150 lines total)
import asyncio
from datetime import datetime
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple

from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi import settings
from pi.app.api.v1.helpers.plane_sql_queries import get_workspace_slug
from pi.services.actions import MethodExecutor
from pi.services.actions import PlaneActionsExecutor
from pi.services.chat.chat import PlaneChatBot
from pi.services.chat.helpers.action_execution_helpers import IMPLICIT_DEPENDENCY_RULES
from pi.services.chat.helpers.action_execution_helpers import format_response
from pi.services.chat.helpers.action_execution_helpers import load_artifacts
from pi.services.chat.helpers.action_execution_helpers import update_flow_steps
from pi.services.chat.helpers.entity_inference import infer_selected_entity
from pi.services.chat.helpers.placeholder_orchestrator import PlaceholderOrchestrator

log = logger.getChild(__name__)

# Mapping of entity_type to tool category
# Some tools have different entity_type than their category (e.g., epic tools are in workitems)
ENTITY_TYPE_TO_CATEGORY = {
    "epic": "workitems",  # Epic tools are in workitems category
    # Add more mappings as needed
}


async def get_execution_context(request, chatbot: PlaneChatBot, user_id, db) -> Tuple[str, Optional[str], bool]:
    """Extract execution context from request and database."""

    # Token
    if request.access_token:
        token = request.access_token
        log.info(f"Using access_token from request for user {user_id}")
    else:
        token = await chatbot._get_oauth_token_for_user(db, str(user_id), str(request.workspace_id))
        if token:
            log.info(f"Retrieved OAuth token from database for user {user_id}, workspace {request.workspace_id}")
        else:
            log.warning(f"No valid OAuth token found for user {user_id}, workspace {request.workspace_id}")

    # Project ID from preferences
    from pi.services.retrievers.pg_store.chat import get_project_from_chat_preference

    project_id, is_project_chat = await get_project_from_chat_preference(request.chat_id, user_id, db)

    return token, project_id, is_project_chat


class BuildModeToolExecutor:
    def __init__(self, chatbot: PlaneChatBot, db: AsyncSession):
        self.chatbot = chatbot
        self.db = db

    async def execute(self, request, user_id):
        """Execute the planned actions"""

        log.info(f"EXECUTE ACTION REQUEST: {request}")
        # 1. Load artifacts
        message_id = request.message_id
        chat_id = request.chat_id
        planned_actions, original_query, conversation_context = await load_artifacts(
            request.artifact_data, self.db, message_id=message_id, chat_id=chat_id
        )

        # 2. Get context
        workspace_id = request.workspace_id
        workspace_slug = planned_actions[0]["args"].get("workspace_slug", "")

        if not workspace_slug:
            workspace_slug = await get_workspace_slug(str(workspace_id))

        token, project_id, is_project_chat = await get_execution_context(request, self.chatbot, user_id, self.db)

        # Validate token exists
        if not token:
            error_msg = f"No valid OAuth token found for user {user_id} and workspace {request.workspace_id}. Please re-authorize Plane AI."
            log.error(error_msg)
            raise ValueError(error_msg)

        # Log token type for debugging (without exposing the actual token)
        token_type = "API key" if token.startswith("plane_api_") else "OAuth access token"
        log.info(f"Using {token_type} for execution (token length: {len(token)}, starts with: {token[:10]}...)")

        # 3. Execution
        # Setup
        # Create actions executor
        if token_type == "API key":
            actions_executor = PlaneActionsExecutor(api_key=token, base_url=settings.plane_api.HOST)
        else:
            actions_executor = PlaneActionsExecutor(access_token=token, base_url=settings.plane_api.HOST)

        method_executor = MethodExecutor(actions_executor)

        context = {
            "workspace_slug": workspace_slug,
            "workspace_id": str(workspace_id) if workspace_id else None,
            "project_id": project_id,
            "message_id": message_id,
            "chat_id": chat_id,
            "is_project_chat": is_project_chat,
        }

        # Execute single action
        # If single action, execute directly
        if len(planned_actions) == 1:
            log.info(f"Single action execution: {planned_actions[0]}")
            results = await self.execute_single_action(planned_actions[0], method_executor, context)

        elif self._are_actions_independent(planned_actions):
            # Execute independent actions in parallel
            log.info(f"Parallel execution for {len(planned_actions)} independent actions")
            tasks = [self.execute_single_action(action, method_executor, context) for action in planned_actions]
            # Gather results and flatten the list of lists
            parallel_results = await asyncio.gather(*tasks)
            results = [item for sublist in parallel_results for item in sublist]

        else:
            # Orchestrate tool execution
            # If more than one action, orchestrate tool execution
            results = await self.orchestrate_execution(original_query, planned_actions, conversation_context, method_executor, context)

        # 4. Update DB and return
        await update_flow_steps(results, message_id, chat_id, self.db)

        return format_response(planned_actions, results, datetime.utcnow())

    async def execute_single_action(self, planned_action, method_executor, context):
        """Execute a single action."""

        tool_name = planned_action["tool_name"]
        args = planned_action["args"]
        entity_type = planned_action["entity_type"]

        # Map entity_type to actual category (e.g., "epic" -> "workitems")
        category = ENTITY_TYPE_TO_CATEGORY.get(entity_type, entity_type)

        # Build tool
        all_category_tools = self.chatbot._build_method_tools(category, method_executor, context)
        # get the specific tool we need
        tool = next((t for t in all_category_tools if t.name == tool_name), None)

        if not tool:
            raise ValueError(f"Tool '{tool_name}' not found in category '{category}' (entity_type: '{entity_type}')")

        # Execute the tool - EXPECT structured payload dict
        log.info(f"[DEBUG] execute_single_action: About to invoke tool '{tool_name}' with args: {args}")
        try:
            result = await tool.ainvoke(args)
            log.info(f"[DEBUG] execute_single_action: Tool '{tool_name}' returned successfully. Result: {result}")
        except Exception as tool_error:
            log.error(f"[DEBUG] execute_single_action: Tool '{tool_name}' raised exception: {tool_error}", exc_info=True)
            raise
        if not isinstance(result, dict):
            raise ValueError(f"Tool '{tool_name}' must return a structured payload dict, got {type(result)}")

        # Normalize dict payload
        message = result.get("message") or ""
        ok = bool(result.get("ok", True))
        entity_info = result.get("entity")
        if ok and not entity_info:
            entity_info = await infer_selected_entity(args, context, entity_type_hint=entity_type)

        executed = {
            "tool_name": tool_name,
            "result": message,
            "entity_info": entity_info,
            "artifact_id": planned_action.get("artifact_id"),
            "version_id": planned_action.get("version_id"),  # Include version_id for execution status update
            "sequence": 1,
            "artifact_type": entity_type,
            "executed_at": datetime.utcnow().isoformat(),
            "success": ok,
        }
        return [executed]

    async def orchestrate_execution(self, original_query, planned_actions, conversation_context, method_executor, context):
        """
        Execute actions using hybrid orchestration with dependency resolution.

        This method uses PlaceholderOrchestrator to:
        - Programmatically track dependencies between actions
        - Execute independent actions when ready
        - Use focused LLM calls to extract specific values from tool results
        - Validate extracted values (e.g., UUID format)
        """
        log.info(f"\n\nORCHESTRATE EXECUTION: {len(planned_actions)} actions\n")

        # Use the new hybrid orchestrator
        orchestrator = PlaceholderOrchestrator(
            planned_actions=planned_actions,
            chatbot=self.chatbot,
            method_executor=method_executor,
            context=context,
            chat_id=str(context.get("chat_id")),
            message_id=str(context.get("message_id")),
            db=self.db,
        )

        # Execute all actions with dependency resolution
        results = await orchestrator.execute_all()

        log.info(f"Orchestration complete: {len(results)} actions executed")
        return results

    def _has_placeholder(self, value: Any) -> bool:
        """Check if a value contains a placeholder recursively."""
        if isinstance(value, str):
            return "<id of" in value
        elif isinstance(value, dict):
            return any(self._has_placeholder(v) for v in value.values())
        elif isinstance(value, list):
            return any(self._has_placeholder(v) for v in value)
        return False

    def _has_implicit_dependency(self, planned_actions: List[Dict]) -> bool:
        """
        Check if actions have implicit dependencies that require sequential execution.

        Returns True if any action depends on state changes from a prior action.
        """
        tool_names = [action.get("tool_name") for action in planned_actions]
        log.info(f"Checking implicit dependencies for tools: {tool_names}")

        # Check if any dependency pattern exists in the planned actions
        for prerequisite, dependent in IMPLICIT_DEPENDENCY_RULES:
            if prerequisite in tool_names and dependent in tool_names:
                # Check order - if dependent comes after prerequisite, there's a dependency
                # OR if they are both present regardless of order (safer for parallel execution check)
                prereq_idx = tool_names.index(prerequisite)
                dep_idx = tool_names.index(dependent)

                log.info(f"Found potential dependency: {dependent} (idx {dep_idx}) depends on {prerequisite} (idx {prereq_idx})")

                # If dependent is NOT strictly before prerequisite, we assume dependency exists
                # (Even if dependent is before, parallel execution is dangerous, so we should serialize)
                log.info(f"Detected implicit dependency: {dependent} depends on {prerequisite}, " f"forcing sequential execution")
                return True

        return False

    def _are_actions_independent(self, planned_actions: List[Dict]) -> bool:
        """Check if all planned actions are independent (no placeholders or implicit dependencies)."""
        # Check for placeholder dependencies
        for action in planned_actions:
            if self._has_placeholder(action.get("args", {})):
                return False

        # Check for implicit dependencies
        if self._has_implicit_dependency(planned_actions):
            return False

        return True
