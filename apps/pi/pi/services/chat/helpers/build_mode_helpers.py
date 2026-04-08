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

"""Helpers to modularize Build-mode orchestration.

These helpers mirror the approach used for Ask mode and keep the core
execute_tools_for_build_mode function lean and readable.
"""

from __future__ import annotations

import ast
import asyncio
import contextlib
import datetime
import json
import re
import uuid
from copy import deepcopy
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Sequence
from typing import Tuple
from typing import Union

from langchain_core.messages import ToolMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.utils.json import parse_json_markdown
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi import settings
from pi.app.controllers.access_controls import access_control
from pi.app.models.enums import ExecutionStatus
from pi.app.models.enums import FlowStepType
from pi.app.models.enums import MessageMetaStepType
from pi.core.db.plane_pi.lifecycle import get_streaming_db_session
from pi.services.actions.artifacts.utils import serialize_for_json
from pi.services.actions.method_executor import MethodExecutor
from pi.services.actions.plane_actions_executor import PlaneActionsExecutor
from pi.services.actions.registry import get_available_categories
from pi.services.actions.registry import get_category_methods
from pi.services.chat.helpers.action_property_mapper import map_tool_properties
from pi.services.chat.helpers.planning_enrichment import enrich_planning_payload
from pi.services.chat.helpers.tool_utils import TOOL_NAME_TO_CATEGORY_MAP
from pi.services.chat.helpers.tool_utils import build_reasoning_display_text
from pi.services.chat.helpers.tool_utils import category_display_name
from pi.services.chat.helpers.tool_utils import clean_tool_args_for_storage
from pi.services.chat.helpers.tool_utils import handle_missing_required_fields
from pi.services.chat.prompts import action_category_router_prompt
from pi.services.chat.prompts import build_action_category_router_prompt
from pi.services.chat.utils import standardize_flow_step_content
from pi.services.retrievers.pg_store.message import upsert_message_flow_steps as _upsert_message_flow_steps
from pi.services.schemas.chat import ActionCategoryRouting
from pi.services.schemas.chat import ActionCategorySelection

log = logger.getChild(__name__)


async def check_oauth_for_build_mode(
    *,
    chatbot_instance,
    user_id: str,
    workspace_id: Optional[str],
    workspace_slug: Optional[str],
    project_id: Optional[str],
    chat_id: str,
    query_id,
    step_order: int,
    combined_tool_query: str,
    enhanced_conversation_history: Optional[str],
    is_project_chat: Optional[bool],
    pi_sidebar_open: Optional[bool],
    sidebar_open_url: Optional[str],
    db,
) -> Optional[str]:
    """Check OAuth token early for build mode. Returns auth message if OAuth required, None otherwise.

    This is called BEFORE building any tools, since build mode always requires OAuth for actions.
    """
    if not workspace_id:
        log.warning(f"ChatID: {chat_id} - No workspace_id provided for build mode OAuth check")
        return None

    try:
        # Resolve workspace_slug if not provided
        if not workspace_slug:
            from pi.app.api.v1.helpers.plane_sql_queries import get_workspace_slug

            workspace_slug = await get_workspace_slug(workspace_id)

        if not workspace_slug:
            log.warning(f"ChatID: {chat_id} - Could not resolve workspace slug for workspace {workspace_id}")
            return None

        # Check for OAuth token
        access_token = await chatbot_instance._get_oauth_token_for_user(db, user_id, workspace_id)

        if not access_token:
            # No valid OAuth token - create auth required tool and get message
            log.info(f"ChatID: {chat_id} - OAuth required for user {user_id} in workspace {workspace_id} (build mode)")

            auth_tools = chatbot_instance._create_auth_required_tools(
                workspace_id=workspace_id,
                user_id=user_id,
                chat_id=chat_id,
                message_token=str(query_id),
                is_project_chat=is_project_chat,
                project_id=project_id,
                pi_sidebar_open=pi_sidebar_open,
                sidebar_open_url=sidebar_open_url,
                workspace_slug=workspace_slug,
            )

            if auth_tools and len(auth_tools) > 0:
                auth_tool = auth_tools[0]
                auth_message = await auth_tool.ainvoke(combined_tool_query)

                # Persist OAuth flow step for queue mechanism
                async with get_streaming_db_session() as _subdb:
                    flow_step_result = await _upsert_message_flow_steps(
                        message_id=query_id,
                        chat_id=uuid.UUID(str(chat_id)),
                        flow_steps=[
                            {
                                "step_order": step_order,
                                "step_type": FlowStepType.TOOL.value,
                                "tool_name": "QUEUE",
                                "content": "OAuth authorization required",
                                "execution_data": {
                                    "query": combined_tool_query,
                                    "chat_id": str(chat_id),
                                    "workspace_id": str(workspace_id) if workspace_id else "",
                                    "workspace_slug": workspace_slug or "",
                                    "project_id": str(project_id) if project_id else "",
                                    "user_id": str(user_id) if user_id else "",
                                    "enhanced_conversation_history": enhanced_conversation_history,
                                },
                                "oauth_required": True,
                                "is_planned": False,
                                "is_executed": False,
                                "execution_success": ExecutionStatus.PENDING,
                            }
                        ],
                        db=_subdb,
                    )
                if flow_step_result.get("message") != "success":
                    log.warning("Failed to create OAuth flow step")

                return auth_message

        # OAuth token exists - proceed with build mode
        return None

    except Exception as e:
        log.error(f"ChatID: {chat_id} - Error checking OAuth for build mode: {e}")
        return None


async def build_advisory_tool_step(
    *,
    combined_tool_query: str,
    current_step: int,
) -> Tuple[str, Dict[str, Any], int]:
    """Call category advisory function directly and return advisory text + flow-step.

    Returns: (advisory_text, flow_step_dict, next_step)
    """

    categories = get_available_categories()

    lines: list[str] = []
    lines.append("Available methods per action category:\n")
    for cat in categories:
        try:
            cat_methods = get_category_methods(cat)
            method_names = ", ".join(cat_methods.keys()) if cat_methods else "-"
        except Exception as exc:
            log.warning(f"Failed to get methods for category '{cat}': {exc}")
            method_names = "(error retrieving methods)"
        lines.append(f"- {cat}: {method_names}")

    advisory_text = "\n".join(lines)

    flow_step = {
        "step_order": current_step,
        "step_type": FlowStepType.TOOL,
        "tool_name": "get_available_plane_actions",
        "content": standardize_flow_step_content(advisory_text, FlowStepType.TOOL),
        "execution_data": {"args": {"user_intent": combined_tool_query}},
    }
    return str(advisory_text), flow_step, current_step + 1


async def run_category_router_and_persist(
    chatbot_instance,
    advisory_text: str,
    combined_tool_query: str,
    enhanced_conversation_history: Optional[str],
    query_id,
    chat_id,
    current_step: int,
    db,
    mcp_descriptions: Optional[Dict[str, str]] = None,
) -> Tuple[List[ActionCategorySelection | Dict[str, Optional[str]]], int]:
    """Run the LLM-based category router and persist a routing step.

    Returns: (selections_list, next_step)
    """

    custom_prompt = f"User intent: {combined_tool_query}\n\nAdvisory: {advisory_text}"
    if enhanced_conversation_history and isinstance(enhanced_conversation_history, str) and enhanced_conversation_history.strip():
        custom_prompt = f"CONVERSATION HISTORY & ACTION CONTEXT:\n{enhanced_conversation_history}\n\n" + custom_prompt

    # Use dynamic prompt when MCP descriptions are available, otherwise fall back to static
    router_system_prompt = build_action_category_router_prompt(mcp_descriptions) if mcp_descriptions else action_category_router_prompt
    router_prompt_template = ChatPromptTemplate.from_messages(
        [
            ("system", router_system_prompt),
            ("human", "{custom_prompt}"),
        ]
    )

    # For Claude models: Don't use with_structured_output as it doesn't handle markdown-wrapped JSON properly
    # Instead, get raw response and manually parse the JSON
    action_router = chatbot_instance.decomposer_llm
    action_router.set_tracking_context(query_id, db, MessageMetaStepType.ACTION_CATEGORY_ROUTING, chat_id=str(chat_id))
    dynamic_action_router = router_prompt_template | action_router

    # Get raw response from LLM
    raw_response = await dynamic_action_router.ainvoke(input=custom_prompt)

    # Extract content and parse JSON (handles markdown-wrapped JSON from Claude)
    content = raw_response.content if hasattr(raw_response, "content") else str(raw_response)

    try:
        # parse_json_markdown handles both raw JSON and markdown-wrapped JSON
        parsed_data = parse_json_markdown(content)
        # Validate against Pydantic model
        parsed_obj = ActionCategoryRouting.model_validate(parsed_data)
    except Exception as e:
        log.error(f"ChatID: {chat_id} - Failed to parse category routing response: {e}")
        log.error(f"ChatID: {chat_id} - Raw content: {content}")
        # Fallback to empty selections
        parsed_obj = ActionCategoryRouting(selections=[])
    selections_list: List[ActionCategorySelection | Dict[str, Optional[str]]] = []
    if parsed_obj and getattr(parsed_obj, "selections", None):
        selections_list = list(parsed_obj.selections)

    # Persist routing decision immediately (keeps order correct with subsequent steps)
    routing_content: List[Dict[str, Optional[str]]] = []
    for sel in selections_list:
        if isinstance(sel, ActionCategorySelection):
            routing_content.append({"category": sel.category, "rationale": sel.rationale})
        elif isinstance(sel, dict):
            routing_content.append({"category": sel.get("category"), "rationale": sel.get("rationale")})

    async with get_streaming_db_session() as _subdb:
        flow_step_result = await _upsert_message_flow_steps(
            message_id=query_id,
            chat_id=uuid.UUID(str(chat_id)),
            flow_steps=[
                {
                    "step_order": current_step,
                    "step_type": FlowStepType.ROUTING.value,
                    "tool_name": "action_category_router",
                    "content": standardize_flow_step_content(routing_content, FlowStepType.ROUTING),
                    "execution_data": {"skip_category_selection": False, "enhanced_conversation_history": enhanced_conversation_history},
                }
            ],
            db=_subdb,
        )
    if flow_step_result.get("message") != "success":
        log.warning("Failed to record category routing in database")

    # TEST: Drop 'workitems' category from selections
    # selections_list = [
    #     sel for sel in selections_list
    #     if (sel.category if isinstance(sel, ActionCategorySelection) else sel.get("category")) != "workitems"
    # ]
    # selections_list = [
    #     sel for sel in selections_list
    #     if 'github' not in (sel.category if isinstance(sel, ActionCategorySelection) else sel.get("category"))
    # ]

    return selections_list, current_step + 1


@access_control
def _merge_planning_tools(
    context: Dict[str, Any],
    all_method_tools: List[Any],
    fresh_retrieval_tools: List[Any],
    method_tool_names: set,
) -> List[Any]:
    """Merge method tools and retrieval tools into the final build-mode planning list.

    @access_control filters ACCESS_CONTROLLED_TOOL_NAMES from the returned list when
    the caller is a guest, using context["is_guest"] via the fast-path in _extract_is_guest.
    This is the single authoritative gate for build-mode tool assembly.
    """
    return all_method_tools + [t for t in fresh_retrieval_tools if getattr(t, "name", "") not in method_tool_names]


def build_planning_tools(
    *,
    chatbot_instance,
    selections_list: Sequence[ActionCategorySelection | Dict[str, Optional[str]]],
    method_executor,
    context: Dict[str, Any],
    fresh_retrieval_tools: List[Any],
    mcp_tools_by_slug: Optional[Dict[str, List[Any]]] = None,
) -> Tuple[List[Any], List[Any], List[str]]:
    """Build method tools for categories, merge with retrieval tools, and return combined.

    Returns: (combined_tools, all_method_tools, built_categories)
    """
    project_scoped_cats = [
        "cycles",
        "cycle",
        "modules",
        "module",
        "worklogs",
        "worklog",
        "workitems",  # Added to support epic feature checking via projects_retrieve
        "epics",
        "epic",
        "intake",
        "intakes",
        "properties",
        "property",
        "types",
        "type",
        "pages",
        "page",
    ]
    workspace_scoped_cats = [
        "initiatives",
        "initiative",
        "teamspaces",
        "teamspace",
        "customers",
        "customer",
    ]

    all_method_tools: List[Any] = []
    existing_tool_names: set = set()
    built_categories: List[str] = []
    for sel in selections_list:
        cat: Optional[str]
        if isinstance(sel, ActionCategorySelection):
            cat = sel.category
        else:
            cat = sel.get("category")  # type: ignore[assignment]
        if not cat or cat in built_categories:
            continue
        built_categories.append(cat)
        # Skip retrieval_tools - it's a meta-category, not an API category with methods
        if cat == "retrieval_tools":
            continue
        # Handle MCP categories — pull tools from the pre-grouped dict
        if cat.startswith("mcp_") and mcp_tools_by_slug:
            slug = cat[4:]  # strip "mcp_" prefix to get connector slug
            mcp_cat_tools = mcp_tools_by_slug.get(slug, [])
            if mcp_cat_tools:
                all_method_tools.extend(mcp_cat_tools)
            else:
                log.warning(f"MCP category {cat} selected but no tools found for slug '{slug}'")
            continue
        try:
            tools_for_cat = chatbot_instance._build_planning_method_tools(cat, method_executor, context)
            # Dedup: _build_planning_method_tools now includes unified tools (entity_list/retrieve/search)
            # for every category, so we must deduplicate across iterations.
            for t in tools_for_cat:
                t_name = getattr(t, "name", "")
                if t_name not in existing_tool_names:
                    all_method_tools.append(t)
                    existing_tool_names.add(t_name)

            if cat in project_scoped_cats:
                tools_for_project = chatbot_instance._build_planning_method_tools("projects", method_executor, context)
                # Include projects_retrieve, projects_update, and projects_update_features for project-scoped work
                # projects_update_features is needed to enable features like epics before creating them
                for t in tools_for_project:
                    if getattr(t, "name", "") in ["projects_retrieve", "projects_update", "projects_update_features"]:
                        t_name = getattr(t, "name", "")
                        if t_name not in existing_tool_names:
                            all_method_tools.append(t)
                            existing_tool_names.add(t_name)

            if cat in workspace_scoped_cats:
                tools_for_workspace = chatbot_instance._build_planning_method_tools("workspaces", method_executor, context)
                # remove all tools except workspaces_get_features and workspaces_update_features
                for t in tools_for_workspace:
                    if getattr(t, "name", "") in ["workspaces_get_features", "workspaces_update_features"]:
                        t_name = getattr(t, "name", "")
                        if t_name not in existing_tool_names:
                            all_method_tools.append(t)
                            existing_tool_names.add(t_name)

        except Exception as e:
            log.warning(f"Failed to build tools for category {cat}: {e}")

    try:
        from pi.services.actions.tools.workitems import get_workitem_tools

        workitem_tools = get_workitem_tools(method_executor=method_executor, context=context) or []
        # Only include workitems_advanced_search (filter tool)
        workitem_tools = [t for t in workitem_tools if getattr(t, "name", "") == "workitems_advanced_search"]
        all_method_tools.extend(workitem_tools)
    except Exception as e:
        log.warning(f"Failed to add workitems_advanced_search tool: {e}")

    method_tool_names = {getattr(t, "name", "") for t in all_method_tools}
    combined_tools = _merge_planning_tools(context, all_method_tools, fresh_retrieval_tools, method_tool_names)
    return combined_tools, all_method_tools, built_categories


# ---------------------------------------------------------------------------
# Multi-hop tool picker: batched LLM filtering when tool count > threshold
# ---------------------------------------------------------------------------

# Names that must always be present in the tool set regardless of picker output.
_ALWAYS_INCLUDE_PREFIXES = ("search_", "list_recent_", "list_member_", "entity_list", "entity_retrieve", "entity_search")
_ALWAYS_INCLUDE_NAMES = frozenset(
    {
        "vector_search_tool",
        "structured_db_tool",
        "pages_search_tool",
        "docs_search_tool",
        "web_search_tool",
        "ask_for_clarification",
        "provide_final_answer_for_app",
        "reselect_action_categories",
    }
)


def _is_always_include(tool_name: str) -> bool:
    """Return True if a tool must always be bound regardless of LLM picker output."""
    if tool_name in _ALWAYS_INCLUDE_NAMES:
        return True
    if tool_name.startswith(_ALWAYS_INCLUDE_PREFIXES):
        return True
    return False


async def _pick_tools_for_batch(
    batch_descriptions: str,
    user_intent: str,
    llm,
) -> tuple[bool, list[str]]:
    """Ask the decomposer LLM to select relevant tools from a single batch.

    Returns a list of tool names selected by the LLM for this batch.
    """
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.utils.json import parse_json_markdown

    from pi.services.chat.prompts import tool_picker_human_prompt
    from pi.services.chat.prompts import tool_picker_system_prompt

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", tool_picker_system_prompt),
            ("human", tool_picker_human_prompt),
        ]
    )
    chain = prompt | llm
    raw_response = await chain.ainvoke(
        {
            "user_intent": user_intent,
            "tool_batch": batch_descriptions,
        }
    )
    content = raw_response.content if hasattr(raw_response, "content") else str(raw_response)
    try:
        parsed = parse_json_markdown(content)
        selected = parsed.get("selected_tools", [])
        if isinstance(selected, list):
            return True, [str(s) for s in selected]
    except Exception as exc:
        log.warning(f"Tool picker batch parse failed ({exc}); including entire batch as fallback")
    # On parse failure, return empty — caller will fall back to including the batch.
    return False, []


async def multi_hop_tool_picker(
    *,
    all_tools: list,
    user_intent: str,
    enhanced_conversation_history: str | None,
    chatbot_instance,
    chat_id,
    query_id=None,
    db=None,
) -> list:
    """Filter a large tool set down to the relevant subset using batched LLM calls.

    Algorithm:
    1. Separate tools into *always-include* (entity search, retrieval, system) and
       *selectable* (action / category-specific) buckets.
    2. Chunk the selectable tools into batches of ``TOOL_PICKER_BATCH_SIZE``.
    3. For each batch, ask the decomposer LLM which tools are relevant.
    4. Merge always-include + LLM-selected tools.
    5. If a batch call fails to parse, include the entire batch (safe fallback).
    """
    batch_size = settings.chat.TOOL_PICKER_BATCH_SIZE

    always_include: list = []
    selectable: list = []
    for tool in all_tools:
        name = getattr(tool, "name", "")
        if _is_always_include(name):
            always_include.append(tool)
        else:
            selectable.append(tool)

    if not selectable:
        return all_tools

    # Build the query context for the picker
    intent_with_context = user_intent
    if enhanced_conversation_history and isinstance(enhanced_conversation_history, str) and enhanced_conversation_history.strip():
        intent_with_context = f"{user_intent}\n\nConversation context:\n{enhanced_conversation_history[:1000]}"

    # Chunk selectable tools into batches
    batches: list[tuple[list, str]] = []
    for i in range(0, len(selectable), batch_size):
        batch = selectable[i : i + batch_size]
        descriptions = "\n".join(f"- {getattr(t, 'name', '?')} | {(getattr(t, 'description', '') or '')[:300]}" for t in batch)
        batches.append((batch, descriptions))

    llm = chatbot_instance.decomposer_llm
    # Ensure tokens for tool selection are tracked under a dedicated step type
    try:
        if query_id and db:
            llm.set_tracking_context(query_id, db, MessageMetaStepType.ACTION_TOOL_PICKING, chat_id=str(chat_id))
    except Exception:
        # Non-fatal: continue without tracking if context cannot be set
        pass

    # Run all batches concurrently
    async def _process_batch(batch_tools: list, batch_desc: str) -> list:
        parsed_ok, selected_names = await _pick_tools_for_batch(batch_desc, intent_with_context, llm)
        if not parsed_ok:
            # Parse failure — include entire batch as safe fallback
            return batch_tools
        # Parsed OK: if LLM explicitly selected none, drop the batch.
        if not selected_names:
            return []
        name_set = set(selected_names)
        picked = [t for t in batch_tools if getattr(t, "name", "") in name_set]
        # If the LLM returned names that don't match any tool, fallback to full batch
        if not picked:
            return batch_tools
        return picked

    results = await asyncio.gather(
        *[_process_batch(bt, bd) for bt, bd in batches],
        return_exceptions=True,
    )

    selected_tools: list = list(always_include)
    for res in results:
        if isinstance(res, BaseException):
            # On error, include the corresponding batch entirely
            idx = results.index(res)
            selected_tools.extend(batches[idx][0])
            log.warning(f"ChatID: {chat_id} - Tool picker batch failed: {res}; including full batch")
        else:
            selected_tools.extend(res)

    # Deduplicate by name
    selected_tools = list({getattr(t, "name", id(t)): t for t in selected_tools}.values())

    log.info(
        f"ChatID: {chat_id} - Multi-hop tool picker: {len(all_tools)} -> {len(selected_tools)} tools "
        f"(always-include-tools={len(always_include)}, batches processed={len(batches)})"
    )
    return selected_tools


# (Moved) Dynamic category re-selection tool now lives in services/chat/kit.py


def build_tool_orchestration_context_step(
    current_step: int,
    enhanced_conversation_history: Optional[str],
    combined_tool_query: str,
    built_categories: List[str],
    all_method_tools: List[Any],
    combined_tools: List[Any],
) -> Tuple[Optional[Dict[str, Any]], int]:
    """Optionally build a flow step capturing orchestration context for auditability."""
    if not (enhanced_conversation_history and isinstance(enhanced_conversation_history, str) and enhanced_conversation_history.strip()):
        return None, current_step

    # Ensure tool lists are deduplicated for clearer orchestration context
    all_method_tools = list({getattr(t, "name", ""): t for t in (all_method_tools or []) if getattr(t, "name", "")}.values())
    combined_tools = list({getattr(t, "name", ""): t for t in (combined_tools or []) if getattr(t, "name", "")}.values())

    step = {
        "step_order": current_step,
        "step_type": FlowStepType.TOOL.value,
        "tool_name": "tool_orchestration_context",
        "content": "Context used for method planning",
        "execution_data": {
            "enhanced_conversation_history": enhanced_conversation_history,
            "tool_query": combined_tool_query,
            "selected_categories": list(built_categories),
            "available_tools_count": len(combined_tools),
            "method_tool_names": [getattr(t, "name", "") for t in all_method_tools],
            "bound_tool_names": [getattr(t, "name", "") for t in combined_tools],
        },
        "is_planned": False,
        "is_executed": False,
        "execution_success": ExecutionStatus.PENDING,
    }
    return step, current_step + 1


def build_planner_tool_selection_step(response, *, current_step: int) -> Tuple[Optional[Dict[str, Any]], int]:
    """Build the planner_tool_selection flow step from the LLM response."""
    try:
        if hasattr(response, "tool_calls") and getattr(response, "tool_calls", None):
            selected_calls: list[dict] = []
            for _tc in getattr(response, "tool_calls", []) or []:
                if isinstance(_tc, dict):
                    _name = _tc.get("name", "")
                    _args = _tc.get("args", {})
                    _id = _tc.get("id", "")
                else:
                    _name = getattr(_tc, "name", "")
                    _args = getattr(_tc, "args", {})
                    _id = getattr(_tc, "id", "")
                selected_calls.append({"name": _name, "args": _args, "id": _id})

            reasoning_text = build_reasoning_display_text(response)

            step = {
                "step_order": current_step,
                "step_type": FlowStepType.TOOL,
                "tool_name": "planner_tool_selection",
                "content": standardize_flow_step_content({"selected_tool_calls": selected_calls, "reasoning": reasoning_text}, FlowStepType.TOOL),
                "execution_data": {
                    "selected_tool_calls": selected_calls,
                    "reasoning": reasoning_text,
                },
                "is_planned": False,
                "is_executed": False,
                "execution_success": ExecutionStatus.PENDING,
            }
            return step, current_step + 1
    except Exception:
        pass
    return None, current_step


# ------------------------------
# Planning loop helpers
# ------------------------------


async def execute_and_persist_clarification(
    *,
    tool_args: Dict[str, Any],
    tool_id: str,
    combined_tools: List[Any],
    combined_tool_query: str,
    current_step: int,
    built_categories: List[str],
    all_method_tools: List[Any],
    chat_id,
    query_id,
    db,
) -> Tuple[Dict[str, Any], Any, int, str]:
    """Execute ask_for_clarification, persist flow step and create clarification record.

    Returns: (flow_step_dict, tool_message, next_step, stream_chunk)
    """
    tool_func = next((t for t in combined_tools if getattr(t, "name", "") == "ask_for_clarification"), None)
    result = None
    try:
        if tool_func is not None:
            if hasattr(tool_func, "ainvoke"):
                result = await tool_func.ainvoke(tool_args)
            else:
                result = tool_func.invoke(tool_args)
        else:
            result = "{}"
    except Exception:
        result = "{}"

    try:
        clarification_payload = json.loads(str(result)) if result else {}
    except Exception:
        clarification_payload = {"raw": str(result)}

    tool_message = ToolMessage(content=str(result), tool_call_id=tool_id)

    flow_step = {
        "step_order": current_step,
        "step_type": FlowStepType.TOOL,
        "tool_name": "ask_for_clarification",
        "content": standardize_flow_step_content(clarification_payload, FlowStepType.TOOL),
        "execution_data": {
            "args": tool_args,
            "clarification_payload": clarification_payload,
            "selected_categories": list(built_categories or []),
            "method_tool_names": [getattr(t, "name", "") for t in (all_method_tools or [])],
            "original_query": combined_tool_query,
        },
        "is_planned": False,
        "is_executed": False,
        "execution_success": ExecutionStatus.PENDING,
    }

    # Create clarification record
    try:
        from pi.services.retrievers.pg_store.clarifications import create_clarification

        clar_id = await create_clarification(
            db,
            chat_id=uuid.UUID(str(chat_id)),
            message_id=uuid.UUID(str(query_id)),
            kind="action" if all_method_tools else "retrieval",
            original_query=combined_tool_query,
            payload=clarification_payload or {},
            categories=[str(c) for c in (built_categories or [])],
            method_tool_names=[getattr(t, "name", "") for t in (all_method_tools or [])],
            bound_tool_names=[getattr(t, "name", "") for t in (combined_tools or [])],
        )
        log.info(f"ChatID: {chat_id} - Created clarification record: id={clar_id}")
    except Exception as e:
        log.warning(f"ChatID: {chat_id} - Failed to create clarification record: {e}")

    # Build stream chunk
    try:
        stream_chunk = f"πspecial clarification blockπ: {json.dumps(serialize_for_json(clarification_payload))}\n"
    except Exception:
        stream_chunk = f"πspecial clarification blockπ: {str(result)}\n"
    return flow_step, tool_message, current_step + 1, stream_chunk


async def plan_action_and_prepare_outputs(
    tool_name: str,
    tool_args: Dict[str, Any],
    tool_id: str,
    current_step: int,
    chat_id: str,
    query_id: str,
    conversation_history: List[Any],
    combined_tool_query: str,
    db: AsyncSession,
    project_id: Optional[str] = None,
    workspace_slug: Optional[str] = None,
) -> Tuple[Dict[str, Any], Dict[str, Any], ToolMessage, int]:
    """Generate action summary, artifact, planned step, ack tool message, and stream chunk.
    Returns: (artifact_content, action_summary, tool_message_ack, next_step)
    """

    _tool_args = deepcopy(tool_args)

    # Inject context if missing
    if project_id and "project_id" not in tool_args:
        tool_args["project_id"] = project_id
        _tool_args["project_id"] = project_id

    if workspace_slug:
        # Always inject workspace_slug if we have it
        # This fixes the issue where LLM passes workspace_id as workspace_slug
        tool_args["workspace_slug"] = workspace_slug
        _tool_args["workspace_slug"] = workspace_slug

    category = TOOL_NAME_TO_CATEGORY_MAP.get(tool_name, {"action_type": "unknown", "entity_type": "unknown"})
    action_type = category["action_type"]
    artifact_type = category["entity_type"]

    extras = await enrich_planning_payload(tool_args=tool_args, shadow_args=_tool_args, action_type=action_type, entity_type=artifact_type)

    cleaned_args = clean_tool_args_for_storage(tool_args)

    action_summary: Dict[str, Any] = {}

    action_summary = {
        "action": action_type,
        "artifact_type": artifact_type,
        "tool_name": tool_name,
        **(extras or {}),
    }

    # Build parameters from tool_args
    parameters: Dict[str, Any] = {}

    if "name" in _tool_args.keys():
        parameters["name"] = _tool_args.pop("name")
    if "description" in _tool_args.keys():
        parameters["description"] = _tool_args.pop("description")
    if "description_html" in _tool_args.keys():
        parameters["description"] = _tool_args.pop("description_html")
    if "project_id" in _tool_args.keys():
        parameters["project"] = {"id": _tool_args.pop("project_id")}

    # Parse duration for worklogs before mapping properties
    if artifact_type == "worklog" and "duration" in _tool_args:
        duration = _tool_args["duration"]
        if isinstance(duration, str):
            total_minutes = 0
            hours_match = re.search(r"(\d+(?:\.\d+)?)\s*h", duration, re.IGNORECASE)
            minutes_match = re.search(r"(\d+(?:\.\d+)?)\s*m", duration, re.IGNORECASE)

            if hours_match:
                hours = int(float(hours_match.group(1)) * 60)
                total_minutes += hours
            if minutes_match:
                mins = int(float(minutes_match.group(1)))
                total_minutes += mins
            # If regex matched nothing but it's a digit string, treat as minutes
            if not hours_match and not minutes_match:
                with contextlib.suppress(ValueError):
                    total_minutes = int(duration)

            if total_minutes > 0:
                _tool_args["duration"] = total_minutes

    # Add other parameters into properties sub-dict
    properties = map_tool_properties(artifact_type, _tool_args)
    if properties:
        parameters["properties"] = properties

    action_summary["parameters"] = parameters

    # Assign placeholder artifact id; will be updated later by artifact creation
    action_summary["artifact_id"] = str(uuid.uuid4())
    action_summary["sequence"] = current_step
    action_summary["message_id"] = query_id

    # Build planning ack
    try:
        # Build a planning ack that includes a human-readable placeholder reference
        # for entities created in this plan, and intentionally omits internal artifact IDs
        # to avoid the LLM mistaking them for real API IDs.

        placeholder_ref = None
        if action_type == "create":
            # Prefer 'name', fallback to 'title' for display name
            _display_name = None
            try:
                if isinstance(tool_args, dict):
                    for _k in ("name", "title"):
                        _v = tool_args.get(_k)
                        if isinstance(_v, str) and _v.strip():
                            _display_name = _v.strip()
                            break
            except Exception:
                _display_name = None

            if isinstance(artifact_type, str) and artifact_type and _display_name:
                placeholder_ref = f"<id of {artifact_type}: {_display_name}>"

        ack_payload = {
            "status": "planned",
            "tool": tool_name,
            "args": cleaned_args,
            "sequence": current_step,
        }
        if placeholder_ref:
            ack_payload["placeholder_ref"] = placeholder_ref

        ack_content = json.dumps(ack_payload, default=str)
    except Exception:
        ack_content = f"PLANNED:{tool_name}"

    tool_message_ack = ToolMessage(content=ack_content, tool_call_id=tool_id)

    # Create artifact data to be stored in the database for execution after user confirms the action
    # Prepare context
    planning_context = {
        "original_query": combined_tool_query,
        "planning_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "conversation_context": {
            "has_conversation_history": len(conversation_history) > 0,
            "previous_message_count": len(conversation_history),
        },
    }
    artifact_data = {
        "planning_data": action_summary,
        "tool_args": cleaned_args,
        "tool_args_raw": tool_args,
        "planning_context": planning_context,
        "tool_id": tool_id,
    }
    if placeholder_ref:
        artifact_data["placeholder_ref"] = placeholder_ref

    # For UPDATE actions on workitems/epics, merge LLM updates with existing data
    if action_type == "update" and artifact_type in ["workitem", "epic"]:
        # Extract entity_id from tool_args
        entity_id = tool_args.get("issue_id")
        if entity_id:
            try:
                from pi.services.actions.artifacts.utils import merge_llm_updates_with_existing_data

                log.info(f"[Planning] UPDATE action detected for {artifact_type} {entity_id} - merging with existing data")
                # Merge LLM's partial updates with complete existing workitem data
                merged_parameters = await merge_llm_updates_with_existing_data(
                    artifact_type,
                    str(entity_id),
                    parameters,  # The LLM's partial updates
                )
                # Update action_summary with complete merged data
                action_summary["parameters"] = merged_parameters
                # Also update the artifact_data with the new action_summary
                artifact_data["planning_data"] = action_summary
                log.debug(f"[Planning] Merge completed - parameters now have {len(merged_parameters.get('properties', {}))} properties")
            except Exception as e:
                log.warning(f"[Planning] Failed to merge with existing {artifact_type} data: {e} - using LLM updates only")

    # Create artifact and get the database-assigned ID
    artifact_result = None
    artifact_id = None
    try:
        from pi.services.retrievers.pg_store.action_artifact import create_action_artifact

        artifact_result = await create_action_artifact(
            db=db,
            chat_id=uuid.UUID(str(chat_id)),
            entity=artifact_type,
            action=action_type,
            data={
                **serialize_for_json(artifact_data),
            },
            message_id=uuid.UUID(str(query_id)),
            sequence=current_step,
            is_executed=False,
        )

        # Extract the artifact ORM object and update action_summary with actual DB ID
        if artifact_result and artifact_result.get("message") == "success":
            artifact_obj = artifact_result.get("artifact")
            if artifact_obj and hasattr(artifact_obj, "id"):
                # Update action_summary with the actual database-assigned artifact ID
                artifact_id = str(artifact_obj.id)
                action_summary["artifact_id"] = artifact_id
            else:
                log.info("Artifact created but no ID found in result")
        else:
            error_msg = artifact_result.get("error", "Unknown error") if artifact_result else "No result returned"
            log.info(f"Failed to create artifact: {error_msg}")

    except Exception as e:
        log.info(f"Exception creating artifact: {str(e)}", exc_info=True)

    # Create the flow step for this planned action

    planned_step = {
        "step_type": FlowStepType.TOOL,
        "step_order": current_step,
        "tool_name": tool_name,
        "execution_data": {
            "artifact_id": artifact_id,
            "tool_name": tool_name,
            "entity_type": artifact_type,
            "action_type": action_type,
            "args": cleaned_args,
        },
        "is_planned": True,
        "is_executed": False,
        "execution_success": ExecutionStatus.PENDING,
    }

    return planned_step, action_summary, tool_message_ack, current_step + 1


async def enrich_tool_query_for_display(
    tool_name: str,
    tool_args: Dict[str, Any],
    tool_query: str,
) -> str:
    """Enrich the display text for certain tools with human-friendly context (e.g., project name).

    Args:
        tool_name: Name of the tool being executed
        tool_args: Arguments passed to the tool
        tool_query: Base tool query string from format_tool_query_for_display

    Returns:
        Enhanced tool query string with human-friendly context
    """
    try:
        if tool_name == "search_current_cycle":
            proj_id = tool_args.get("project_id")
            if isinstance(proj_id, str) and proj_id:
                try:
                    from pi.app.api.v1.helpers.plane_sql_queries import get_project_details_for_artifact as _get_proj

                    proj = await _get_proj(str(proj_id))
                    if isinstance(proj, dict):
                        pname = proj.get("name")
                        pident = proj.get("identifier")
                        if pname and pident:
                            tool_query = f"current cycle in {pname} ({pident})"
                        elif pname or pident:
                            tool_query = f"current cycle in project {pname or pident}"
                        else:
                            tool_query = f"current cycle in project {proj_id}"
                except Exception:
                    # Keep original tool_query on any lookup failure
                    pass
        elif tool_name == "list_member_projects":
            # Clarify scope as workspace projects if workspace context is present
            wid = tool_args.get("workspace_id")
            if isinstance(wid, str) and wid:
                tool_query = "your projects in this workspace"
    except Exception:
        pass
    return tool_query


# ------------------------------------------------------------------
# Placeholder resolution helpers (shared by multiple functions)
# ------------------------------------------------------------------


def _extract_placeholder_references(tool_args: Dict[str, Any]) -> List[Tuple[str, str, str]]:
    """Return placeholder references found in tool arguments."""
    refs: List[Tuple[str, str, str]] = []

    for field_name, value in tool_args.items():
        values = value if isinstance(value, list) else [value]
        for candidate in values:
            if not isinstance(candidate, str):
                continue
            match = re.search(r"<id of (\w+): ([^>]+)>", candidate)
            if match:
                refs.append((field_name, match.group(1), match.group(2).strip()))

    return refs


def _build_placeholder_skip_message(tool_name: str, placeholder_refs: List[Tuple[str, str, str]]) -> str:
    """Create a user-facing skip message for retrieval tools blocked by placeholders."""
    field_name, entity_type, entity_name = placeholder_refs[0]

    if field_name == "project_id" and entity_type == "project":
        if tool_name == "search_state_by_name":
            return (
                f"Skipping {tool_name}: project '{entity_name}' is being created in this plan, "
                "so project-scoped state search cannot run yet. The state will be resolved during execution "
                "after the project exists."
            )

        return f"Skipping {tool_name}: project '{entity_name}' is being created in this plan, " "so this retrieval cannot run until execution."

    refs_summary = ", ".join([f"{etype} '{ename}' via {fname}" for fname, etype, ename in placeholder_refs])
    return (
        f"Skipping {tool_name}: it references unresolved placeholders ({refs_summary}). "
        "Retrieval can only run after those entities are created during execution."
    )


def _maybe_build_placeholder_skip_result(
    *,
    tool_name: str,
    tool_id: str,
    tool_args: Dict[str, Any],
    current_step: int,
    tool_query: str,
) -> Optional[Tuple[Optional[Dict[str, Any]], Optional[Any], int, str, ExecutionStatus, Optional[str]]]:
    """Return a structured skip result when a retrieval tool references unresolved placeholders."""
    placeholder_refs = _extract_placeholder_references(tool_args)
    if not placeholder_refs:
        return None

    message = _build_placeholder_skip_message(tool_name, placeholder_refs)
    tool_message = ToolMessage(content=message, tool_call_id=tool_id) if tool_id else None
    flow_step = {
        "step_order": current_step,
        "step_type": FlowStepType.TOOL,
        "tool_name": tool_name,
        "content": message,
        "execution_data": {
            "args": tool_args,
            "tool_id": tool_id,
            "skipped_due_to_placeholder": True,
            "placeholder_references": [
                {"field_name": field_name, "entity_type": entity_type, "entity_name": entity_name}
                for field_name, entity_type, entity_name in placeholder_refs
            ],
        },
        "is_executed": False,
        "is_planned": False,
        "execution_success": ExecutionStatus.PENDING,
    }
    return flow_step, tool_message, current_step + 1, tool_query, ExecutionStatus.PENDING, None


def _extract_project_id_from_search_result(res: Any) -> Optional[str]:
    """Extract project ID from an entity_search tool result (dict or string).

    Handles three response formats:
    - dict with ``data.id`` or ``data.projects[0].id``
    - raw string parseable via ``ast.literal_eval``
    - legacy ``"Result: {...}"`` string format
    """
    data: Optional[Dict[str, Any]] = None

    if isinstance(res, dict):
        data = res.get("data", {})
    elif isinstance(res, str):
        # Try direct parse first
        try:
            parsed = ast.literal_eval(res)
            if isinstance(parsed, dict):
                data = parsed.get("data", parsed)
        except Exception:
            # Fallback: legacy "Result:" prefix format
            m = re.search(r"Result:\s*(\{[\s\S]*?\})", res)
            if m:
                try:
                    data = ast.literal_eval(m.group(1))
                except Exception:
                    return None

    if not isinstance(data, dict):
        return None

    # Single project result: {"id": "..."}
    cand = data.get("id") or data.get("project_id")
    if isinstance(cand, str):
        return cand

    # Multi-project result: {"projects": [{"id": "..."}]}
    projs = data.get("projects", [])
    if projs and isinstance(projs, list) and len(projs) == 1:
        return projs[0].get("id")

    return None


async def _try_resolve_project_placeholder(
    *,
    tool_name: str,
    tool_id: str,
    tool_args: Dict[str, Any],
    combined_tools: List[Any],
    current_step: int,
    tool_query: str,
) -> Union[Tuple[Optional[Dict[str, Any]], Optional[Any], int, str, ExecutionStatus, Optional[str]], Dict[str, Any], None]:
    """Resolve ``<id of project: X>`` placeholders in project-retrieve calls.

    Returns:
        - A full "skipped" return tuple if the placeholder cannot be resolved.
        - The *mutated* ``tool_args`` dict (with ``project_id`` replaced) on success.
        - ``None`` if this call is not a project-retrieve or has no placeholder.
    """
    # Only applies to project-retrieve calls
    is_project_retrieve = (tool_name == "projects_retrieve") or (
        tool_name == "entity_retrieve" and isinstance(tool_args, dict) and tool_args.get("entity_type") == "projects"
    )
    if not is_project_retrieve or not isinstance(tool_args, dict):
        return None

    proj_id = tool_args.get("project_id") or tool_args.get("entity_id")
    if not isinstance(proj_id, str):
        return None

    m = re.search(r"<id of (\w+): ([^>]+)>", proj_id)
    if not m:
        return None

    _etype, _ename = m.groups()
    if _etype != "project" or not (isinstance(_ename, str) and _ename.strip()):
        return None

    # Locate the entity_search tool
    search_tool = next((t for t in combined_tools if getattr(t, "name", "") == "entity_search"), None)
    if search_tool is None:
        return None

    try:
        # Invoke search
        search_args = {"entity_type": "projects", "search_mode": "by_name", "name": _ename}
        res = await (search_tool.ainvoke(search_args) if hasattr(search_tool, "ainvoke") else search_tool.invoke(search_args))

        resolved_id = _extract_project_id_from_search_result(res)

        if isinstance(resolved_id, str) and resolved_id:
            # Success — mutate args and signal the caller to proceed normally
            tool_args = dict(tool_args)
            tool_args["project_id"] = resolved_id
            return tool_args

        # Could not resolve — fall through to generic placeholder skip
        return _maybe_build_placeholder_skip_result(
            tool_name=tool_name,
            tool_id=tool_id,
            tool_args=tool_args,
            current_step=current_step,
            tool_query=tool_query,
        )

    except Exception:
        # Resolver failure — fall through to generic placeholder skip
        return _maybe_build_placeholder_skip_result(
            tool_name=tool_name,
            tool_id=tool_id,
            tool_args=tool_args,
            current_step=current_step,
            tool_query=tool_query,
        )


async def execute_retrieval_tool_and_build_step(
    *,
    tool_name: str,
    tool_id: str,
    tool_args: Dict[str, Any],
    combined_tool_query: str,
    combined_tools: List[Any],
    query_flow_store: Dict[str, Any],
    current_step: int,
    tool_query: str,
    mcp_connector_slug_to_id: Optional[Dict[str, str]] = None,
) -> Tuple[Optional[Dict[str, Any]], Optional[Any], int, str, ExecutionStatus, Optional[str]]:
    """Execute a retrieval tool, build flow step and tool message.

    Args:
        tool_name: Name of the tool to execute
        tool_id: ID of the tool call
        tool_args: Arguments for the tool
        combined_tool_query: Original user query
        combined_tools: List of available tools
        query_flow_store: Store for query flow data
        current_step: Current step number
        tool_query: Pre-formatted and enriched tool query string for display

    Returns: (flow_step_dict, tool_message, next_step, tool_query_display, execution_status, execution_error)
    """
    getattr(getattr(__import__("builtins"), "str"), "__call__")(tool_name)  # harmless label; actual friendly name handled upstream
    # Ensure mypy understands this can be None when tool_call_id is missing
    tool_message: Optional[Any] = None
    # Seed base for text2sql
    try:
        if tool_name == "structured_db_tool" and isinstance(query_flow_store, dict):
            query_flow_store["step_order"] = current_step
    except Exception:
        pass

    # Guard: avoid calling retrieval tools with unresolved placeholder IDs.
    # For projects_retrieve, try to actively resolve the placeholder via entity_search first.
    # For all other tools, immediately skip if any placeholder references are detected.
    try:
        placeholder_result = await _try_resolve_project_placeholder(
            tool_name=tool_name,
            tool_id=tool_id,
            tool_args=tool_args,
            combined_tools=combined_tools,
            current_step=current_step,
            tool_query=tool_query,
        )
        if isinstance(placeholder_result, tuple):
            # Placeholder could not be resolved — return the "skipped" tuple directly
            return placeholder_result  # type: ignore[return-value]
        if isinstance(placeholder_result, dict):
            # Placeholder was resolved — use the updated args
            tool_args = placeholder_result
        elif placeholder_result is None:
            # Not a project-retrieve call — apply broad placeholder skip check
            placeholder_skip = _maybe_build_placeholder_skip_result(
                tool_name=tool_name,
                tool_id=tool_id,
                tool_args=tool_args,
                current_step=current_step,
                tool_query=tool_query,
            )
            if placeholder_skip is not None:
                return placeholder_skip
    except Exception:
        # Non-fatal; continue with normal execution
        pass

    tool_func = next((t for t in combined_tools if getattr(t, "name", "") == tool_name), None)
    result = None
    execution_success = ExecutionStatus.SUCCESS
    execution_error = None

    if tool_func:
        try:
            if hasattr(tool_func, "ainvoke"):
                result = await tool_func.ainvoke(tool_args)
            else:
                result = tool_func.invoke(tool_args)
        except Exception as tool_error:
            result = f"Error: {str(tool_error)}"
            execution_success = ExecutionStatus.FAILED
            execution_error = str(tool_error)
    else:
        result = f"Tool {tool_name} not found"

    # Only create ToolMessage if we have both tool_name and tool_id
    # tool_id must match a tool_call from the previous assistant message
    if tool_name and tool_id:
        # Extract message from dict if result is structured, otherwise use string representation
        if isinstance(result, dict):
            # Format as "message\n\nResult: {data}" so format_tool_message_for_display can clean it for users
            # while the LLM gets the full structured data with UUIDs
            message = result.get("message", "")
            # If there's a 'data' field, use it; otherwise omit the Result section (simpler format)
            if "data" in result and result["data"]:
                # Serialize UUID objects to strings before JSON encoding
                serialized_data = serialize_for_json(result["data"])
                content = f"{message}\n\nResult: {json.dumps(serialized_data, ensure_ascii=False)}"
            else:
                # No data field, just use the message
                content = message
        else:
            content = str(result)
        tool_message = ToolMessage(content=content, tool_call_id=tool_id)
    else:
        tool_message = None
        if tool_name and not tool_id:
            log.warning(f"Missing tool_call_id for tool {tool_name}, skipping ToolMessage creation")

    # Build execution data

    enhanced_execution_data: Dict[str, Any] = {
        "args": tool_args,
        "retrieval_result": str(result),
        "tool_query": tool_query,
        "execution_timestamp": datetime.datetime.utcnow().isoformat(),
    }
    try:
        if hasattr(result, "__dict__"):
            enhanced_execution_data["structured_result"] = {
                k: v for k, v in result.__dict__.items() if not str(k).startswith("_") and isinstance(v, (str, int, float, bool, list, dict))
            }
        elif isinstance(result, dict):
            enhanced_execution_data["structured_result"] = result
        elif isinstance(result, list) and len(result) > 0:
            enhanced_execution_data["result_count"] = len(result)
            enhanced_execution_data["result_preview"] = result[:3] if len(result) > 3 else result
    except Exception:
        pass

    flow_step = {
        "step_order": current_step,
        "step_type": FlowStepType.TOOL,
        "tool_name": tool_name,
        "content": standardize_flow_step_content(result, FlowStepType.TOOL),
        "execution_data": enhanced_execution_data,
        "is_executed": False,
        "is_planned": False,
        "execution_success": execution_success,
        "execution_error": execution_error,
    }

    # Derive mcp_connector_id for MCP tools
    if tool_name.startswith("mcp_") and mcp_connector_slug_to_id:
        try:
            import uuid as _uuid

            _slug = tool_name[4:].split("__")[0]
            _cid_str = mcp_connector_slug_to_id.get(_slug)
            if _cid_str:
                flow_step["mcp_connector_id"] = _uuid.UUID(str(_cid_str))
        except Exception:
            pass

    return flow_step, tool_message, current_step + 1, tool_query, execution_success, execution_error


# ------------------------------
# Phase 2 initialization helpers
# ------------------------------


async def build_method_executor_and_context(
    *,
    chatbot_instance,
    user_id,
    workspace_id: str,
    project_id: Optional[str],
    conversation_history: List[Any],
    user_meta: Dict[str, Any],
    is_project_chat: Optional[bool],
    chat_id,
    db,
) -> Tuple[Any, Dict[str, Any], str]:
    """Build method executor and action context for Phase 2.

    Returns: (method_executor, context_dict, final_workspace_slug)
    """

    from pi.app.api.v1.helpers.plane_sql_queries import get_project_id_from_identifier
    from pi.app.api.v1.helpers.plane_sql_queries import get_workspace_slug

    # Get OAuth token for method executor
    access_token = await chatbot_instance._get_oauth_token_for_user(db, user_id, workspace_id)

    # Build workspace context
    final_workspace_slug = await get_workspace_slug(workspace_id)

    # Normalize project_id: resolve identifier to UUID if needed
    final_project_id = project_id
    try:
        proj_str = str(project_id) if project_id else None
        is_uuid_like = False
        if proj_str:
            try:
                uuid.UUID(proj_str)
                is_uuid_like = True
            except Exception:
                is_uuid_like = False

        if proj_str and not is_uuid_like:
            try:
                resolved = await get_project_id_from_identifier(proj_str, str(workspace_id))
                if resolved:
                    final_project_id = str(resolved)
                else:
                    log.warning(
                        f"ChatID: {chat_id} - Received non-UUID project_id '{proj_str}'. Could not resolve identifier to UUID; omitting project scope."  # noqa: E501
                    )
                    final_project_id = None
            except Exception as _e:
                log.warning(f"ChatID: {chat_id} - Failed to resolve project identifier '{proj_str}' to UUID: {_e}. Omitting project scope.")
                final_project_id = None
    except Exception:
        pass

    context = {
        "workspace_id": workspace_id,
        "workspace_slug": final_workspace_slug,
        "project_id": final_project_id,
        "user_id": user_id,
        "conversation_history": conversation_history,
        "user_meta": user_meta,
        "is_project_chat": is_project_chat,
    }

    # Create method executor only if we have a valid token
    method_executor = None
    if access_token:
        # Create method executor with the available token
        if access_token.startswith("plane_api_"):
            actions_executor = PlaneActionsExecutor(api_key=access_token, base_url=settings.plane_api.HOST)
        else:
            actions_executor = PlaneActionsExecutor(access_token=access_token, base_url=settings.plane_api.HOST)
        method_executor = MethodExecutor(actions_executor)
    else:
        # No token available - method_executor will be None
        # This is acceptable for ask mode where tools may not need workspace API access
        # (e.g., simple greetings, general questions without workspace data)
        log.warning(f"ChatID: {chat_id} - No OAuth token available, method_executor will be None")

    return method_executor, context, final_workspace_slug or ""


# ------------------------------
# Clarification recovery helper
# ------------------------------


async def recover_clarification_categories(
    *,
    user_meta: Dict[str, Any],
    chat_id,
    db,
) -> Tuple[bool, List[Dict[str, Optional[str]]], Dict[str, Any]]:
    """Check if resuming after clarification and recover previously selected categories.

    Returns: (skip_category_selection, selections_list, clar_ctx)
    """
    clar_ctx: Dict[str, Any] = {}
    skip_category_selection = False
    selections_list: List[Dict[str, Optional[str]]] = []

    try:
        if isinstance(user_meta, dict) and user_meta.get("clarification_context"):
            clar_ctx = user_meta.get("clarification_context") or {}
            hint_list = clar_ctx.get("category_hints") or []

            # Always try to recover previously selected categories from the saved clarification step
            prev_categories: List[str] = []
            try:
                from pi.services.retrievers.pg_store.message import get_tool_results_from_chat_history as _get_steps

                clar_steps = await _get_steps(db=db, chat_id=uuid.UUID(str(chat_id)), tool_name="ask_for_clarification")
                if clar_steps:
                    last = clar_steps[0]
                    exec_data = getattr(last, "execution_data", {}) or {}
                    prev_categories = [str(c) for c in (exec_data.get("selected_categories") or []) if c]
            except Exception:
                prev_categories = []

            # Union of hints and previously selected categories
            union_categories = list({*(str(h) for h in hint_list if h), *prev_categories})
            if union_categories:
                skip_category_selection = True
                selections_list = [{"category": c, "rationale": "from_clarification_resume"} for c in union_categories]
    except Exception:
        skip_category_selection = False

    return skip_category_selection, selections_list, clar_ctx


async def persist_skip_category_selection_step(
    *,
    selections_list: Sequence[Dict[str, Optional[str]]],
    current_step: int,
    enhanced_conversation_history: Optional[str],
    query_id,
    chat_id,
    db,
) -> int:
    """Persist a routing step when category selection was skipped due to clarification context."""
    async with get_streaming_db_session() as _subdb:
        flow_step_result = await _upsert_message_flow_steps(
            message_id=query_id,
            chat_id=uuid.UUID(str(chat_id)),
            flow_steps=[
                {
                    "step_order": current_step,
                    "step_type": FlowStepType.ROUTING.value,
                    "tool_name": "action_category_router",
                    "content": standardize_flow_step_content(
                        [
                            {"category": str(sel.get("category")) if isinstance(sel, dict) else str(getattr(sel, "category", ""))}
                            for sel in selections_list
                        ],
                        FlowStepType.ROUTING,
                    ),
                    "execution_data": {
                        "skip_category_selection": True,
                        "source": "clarification",
                        "enhanced_conversation_history": enhanced_conversation_history,
                    },
                }
            ],
            db=_subdb,
        )
    if flow_step_result.get("message") != "success":
        log.warning("Failed to record clarification-based routing in database")
    return current_step + 1


# ------------------------------
# Auto-resolution and preflight helpers
# ------------------------------


async def auto_resolve_missing_ids(
    *,
    tool_name: str,
    tool_args: Dict[str, Any],
    missing_required: List[str],
    combined_tools: List[Any],
    workspace_slug: str,
) -> bool:
    """Attempt to auto-resolve missing required IDs (esp. project_id) before asking user.

    Mutates tool_args in-place if resolution succeeds.
    Returns True if at least one field was resolved.
    """

    def _extract_placeholder_name(val: str) -> tuple[str | None, str | None]:
        if isinstance(val, str) and "<id of" in val and ":" in val and val.endswith(">"):
            try:
                inner = val.strip("<>")
                parts = inner.split(":", 1)
                left = parts[0].strip()
                right = parts[1].strip()
                etype = left.split()[-1].strip()
                return etype, right
            except Exception:
                return None, None
        return None, None

    async def _resolve_project_name_via_entity_search(name: str) -> str | None:
        """Use entity_search tool to resolve a project name to a UUID."""
        resolver = next((t for t in combined_tools if getattr(t, "name", "") == "entity_search"), None)
        if not resolver:
            return None
        try:
            res = await resolver.ainvoke({"entity_type": "projects", "search_mode": "by_name", "name": name})
            return _extract_project_id_from_search_result(res)
        except Exception:
            return None

    async def _auto_resolve_project_id_if_needed() -> bool:
        nonlocal tool_args
        pid_val = tool_args.get("project_id") if isinstance(tool_args, dict) else None
        etype, pname = _extract_placeholder_name(pid_val) if isinstance(pid_val, str) else (None, None)
        if pname and (etype == "project" or etype is None):
            resolved = await _resolve_project_name_via_entity_search(pname)
            if isinstance(resolved, str):
                tool_args["project_id"] = resolved
                return True
        # If not placeholder but a non-UUID string, try extracting a quoted name from the value
        if isinstance(pid_val, str):
            uuid_like = re.match(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", pid_val, flags=re.IGNORECASE)
            if not uuid_like:
                m_quote = re.search(r"'([^']+)'|\"([^\"]+)\"", pid_val)
                candidate = None
                if m_quote:
                    candidate = m_quote.group(1) or m_quote.group(2)
                if not candidate and len(pid_val) <= 80:
                    candidate = pid_val.strip()
                if candidate:
                    resolved = await _resolve_project_name_via_entity_search(candidate)
                    if isinstance(resolved, str):
                        tool_args["project_id"] = resolved
                        return True
        return False

    try:
        if "project_id" in (missing_required or []):
            did_resolve = await _auto_resolve_project_id_if_needed()
            if not did_resolve and tool_name == "workitems_update":
                # Derive project_id from issue_id when updating a work-item
                try:
                    issue_id_val = tool_args.get("issue_id") if isinstance(tool_args, dict) else None
                    if isinstance(issue_id_val, str) and re.match(
                        r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", issue_id_val, flags=re.IGNORECASE
                    ):
                        from pi.app.api.v1.helpers.plane_sql_queries import get_issue_identifier_for_artifact

                        ident_details = await get_issue_identifier_for_artifact(issue_id_val)
                        if ident_details and isinstance(ident_details, dict):
                            pid = ident_details.get("project_id")
                            if isinstance(pid, str):
                                tool_args["project_id"] = pid
                                did_resolve = True
                except Exception:
                    pass
            return did_resolve
    except Exception:
        pass
    return False


async def handle_preflight_clarification(
    *,
    tool_name: str,
    tool_args: Dict[str, Any],
    action_context: Dict[str, Any],
    missing_required: List[str],
    method_executor,
    workspace_slug: str,
    chat_id,
    tool_id: str,
    current_step: int,
    combined_tool_query: str,
    is_project_chat: Optional[bool],
    built_categories: List[str],
    all_method_tools: List[Any],
    combined_tools: List[Any],
    query_id,
    db,
) -> Tuple[bool, Optional[Dict[str, Any]], Optional[Any], Optional[Dict[str, Any]], int]:
    """Handle preflight missing fields check, create clarification, persist step and record.

    Returns: (clarification_requested, clarification_payload, tool_message, flow_step, next_step)
    """

    clarification_result = await handle_missing_required_fields(
        tool_name=tool_name,
        tool_args=tool_args,
        action_context=action_context,
        missing_required=missing_required,
        method_executor=method_executor,
        workspace_slug=workspace_slug,
        chat_id=chat_id,
        tool_id=tool_id,
        current_step=current_step,
        combined_tool_query=combined_tool_query,
        is_project_chat=is_project_chat,
    )

    if not clarification_result:
        return False, None, None, None, current_step

    clarification_payload = clarification_result["clarification_payload"]
    clarification_tool_message = clarification_result.get("tool_message")
    flow_step = clarification_result["flow_step"]

    # Persist message_clarifications row
    try:
        from pi.services.retrievers.pg_store.clarifications import create_clarification

        clar_id = await create_clarification(
            db,
            chat_id=uuid.UUID(str(chat_id)),
            message_id=uuid.UUID(str(query_id)),
            kind="action",
            original_query=combined_tool_query,
            payload=clarification_payload or {},
            categories=[str(c) for c in (built_categories or [])],
            method_tool_names=[getattr(t, "name", "") for t in (all_method_tools or [])],
            bound_tool_names=[getattr(t, "name", "") for t in (combined_tools or [])],
        )
        log.info(f"ChatID: {chat_id} - Created clarification record (preflight): id={clar_id}")
    except Exception as e:
        log.warning(f"ChatID: {chat_id} - Failed to create clarification record (preflight): {e}")

    return True, clarification_payload, clarification_tool_message, flow_step, current_step + 1


# ------------------------------
# Planner summary helper
# ------------------------------
def build_planner_summary_step(
    *,
    current_step: int,
    iteration_count: int,
    planned_actions_count: int,
    loop_warning_detected: bool,
    tool_calls_count: int,
    exited_due_to_max_iterations: bool | None = None,
) -> tuple[dict, int]:
    """Create a standardized planner_summary flow step and return (step, next_step)."""
    execution_data: Dict[str, Any] = {
        "iteration_count": iteration_count,
        "planned_actions_count": planned_actions_count,
        "loop_warning_detected": loop_warning_detected,
        "tool_calls_count": tool_calls_count,
    }

    if exited_due_to_max_iterations is not None:
        execution_data["exited_due_to_max_iterations"] = bool(exited_due_to_max_iterations)

    step = {
        "step_order": current_step,
        "step_type": FlowStepType.TOOL,
        "tool_name": "planner_summary",
        "content": "Method planning summary",
        "execution_data": execution_data,
        "is_planned": False,
        "is_executed": False,
        "execution_success": ExecutionStatus.SUCCESS,
    }
    return step, current_step + 1


def selected_action_categories_display(selections_list: List[Union["ActionCategorySelection", Dict[str, Optional[str]]]]) -> str:
    """Display the selected action categories in a structured format."""
    cats = []
    reasons = []
    bullets: list[str] = []
    for _sel in selections_list:
        if isinstance(_sel, dict):
            _cat = str(_sel.get("category") or "").strip()
            _rat = _sel.get("rationale")
        else:
            _cat = str(getattr(_sel, "category", "")).strip()
            _rat = getattr(_sel, "rationale", None)
        # Convert internal category to a user-friendly label
        _cat_display = category_display_name(_cat)
        if _cat:
            cats.append(_cat)
            # build per-category bullet with rationale if present
            if _rat:
                _rat_s = str(_rat).strip()
                reasons.append(_rat_s)
                bullets.append(f"- {_cat_display}: {_rat_s}")
            else:
                bullets.append(f"- {_cat_display}")

    cats = [c for c in cats if c]

    # Structured, multi-line block to show in thinking bubble
    # Build display list for selected areas
    cats_display = [category_display_name(c) for c in cats]
    sub = f"{', '.join(cats_display)}" if cats_display else " -"
    details = "\n".join(bullets) if bullets else ""

    if details:
        sub += f"\n{details}"
    content = f"{sub}\n\n"

    return content
