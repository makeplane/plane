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

"""Helper functions for ask mode processing to keep the main flow clean."""

import asyncio
import uuid
from typing import Any
from typing import AsyncIterator
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple
from typing import Union

from langchain_core.messages import BaseMessage
from langchain_core.messages import HumanMessage
from langchain_core.messages import SystemMessage
from pydantic import UUID4
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.models.enums import FlowStepType
from pi.app.models.enums import MessageMetaStepType
from pi.services.chat.helpers.tool_utils import batch_llm_stream_by_words
from pi.services.chat.prompts import HISTORY_FRESHNESS_WARNING
from pi.services.chat.utils import StandardAgentResponse
from pi.services.chat.utils import get_current_timestamp_context
from pi.services.chat.utils import reasoning_dict_maker
from pi.services.chat.utils import resolve_workspace_slug
from pi.services.chat.utils import standardize_flow_step_content
from pi.services.retrievers.pg_store.message import upsert_message_flow_steps

log = logger.getChild(__name__)


# ------------------------------
# Initialization helpers
# ------------------------------


async def resolve_workspace_id_from_project(project_id: str | None) -> str | None:
    """Resolve workspace_id from project_id if workspace_id is not provided."""
    if not project_id:
        return None

    try:
        from pi.app.api.v1.helpers.plane_sql_queries import resolve_workspace_id_from_project_id

        resolved_workspace_id = await resolve_workspace_id_from_project_id(project_id)
        if resolved_workspace_id:
            log.info(f"Resolved workspace_id {resolved_workspace_id} from project_id {project_id}")
            return str(resolved_workspace_id)
    except Exception as e:
        log.error(f"Failed to resolve workspace_id from project_id {project_id}: {e}")

    return None


def extract_or_create_query_id(user_meta: dict | None) -> uuid.UUID:
    """Extract query_id from user_meta token_id or create a new one."""
    query_id = None
    try:
        if isinstance(user_meta, dict):
            token_id = user_meta.get("token_id")
            if token_id:
                query_id = uuid.UUID(str(token_id))
    except Exception:
        pass

    return query_id or uuid.uuid4()


async def resolve_workspace_slug_if_needed(workspace_id: str | None, provided_workspace_slug: str | None) -> str | None:
    """Resolve workspace slug from workspace_id if not provided."""
    if provided_workspace_slug:
        return provided_workspace_slug

    if not workspace_id:
        return None

    try:
        workspace_uuid = uuid.UUID(workspace_id)
        return await resolve_workspace_slug(workspace_uuid, provided_workspace_slug)
    except Exception as e:
        log.warning(f"Failed to resolve workspace slug: {e}")
        return None


async def check_and_enrich_clarification_context(
    *, chat_id: UUID4, db: AsyncSession, user_meta: dict, parsed_query: str, query_id: UUID4, step_order: int
) -> Tuple[dict, int]:
    """
    Check for pending clarifications and enrich user_meta with clarification context.

    Returns: (enriched_user_meta, new_step_order)
    """
    try:
        from pi.services.retrievers.pg_store.clarifications import get_latest_pending_for_chat as _get_pending_clar

        log.info(f"ChatID: {chat_id} - Checking for pending clarifications...")
        clar_row = await _get_pending_clar(db=db, chat_id=uuid.UUID(str(chat_id)))

        if clar_row:
            clar_payload = clar_row.payload or {}
            log.info(
                f"ChatID: {chat_id} - Found pending clarification, enriching user_meta. Kind: {clar_row.kind}, Categories: {clar_row.categories}"
            )
            user_meta["clarification_context"] = {
                "reason": clar_payload.get("reason"),
                "missing_fields": clar_payload.get("missing_fields") or [],
                "disambiguation_options": clar_payload.get("disambiguation_options") or [],
                "category_hints": clar_payload.get("category_hints") or [],
                "answer_text": parsed_query,
                "original_query": clar_row.original_query,
                "clarifies_message_id": str(clar_row.message_id),
            }
            log.info(f"ChatID: {chat_id} - Enriched user_meta with clarification_context")

            # Record a clarification_response flow step for traceability
            try:
                await upsert_message_flow_steps(
                    message_id=query_id,
                    chat_id=chat_id,
                    flow_steps=[
                        {
                            "step_order": step_order + 1,
                            "step_type": FlowStepType.TOOL.value,
                            "tool_name": "clarification_response",
                            "content": standardize_flow_step_content(user_meta.get("clarification_context", {}), FlowStepType.TOOL),
                            "execution_data": {
                                "clarifies_message_id": str(clar_row.message_id),
                                "clarification_resolved": False,
                            },
                        }
                    ],
                    db=db,
                )
                # Push subsequent steps by +1
                step_order = step_order + 2
            except Exception:
                pass
        else:
            log.info(f"ChatID: {chat_id} - No pending clarification found")
    except Exception as _e:
        log.warning(f"ChatID: {chat_id} - Clarification table check failed: {_e}")

    return user_meta, step_order


async def resolve_pending_clarification(*, chat_id: UUID4, db: AsyncSession, parsed_query: str, query_id: UUID4) -> None:
    """Resolve any pending clarification record for this chat."""
    try:
        from pi.services.retrievers.pg_store.clarifications import get_latest_pending_for_chat
        from pi.services.retrievers.pg_store.clarifications import resolve_clarification

        log.info(f"ChatID: {chat_id} - Processing clarification follow-up")
        clar_row = await get_latest_pending_for_chat(db=db, chat_id=uuid.UUID(str(chat_id)))

        if clar_row:
            try:
                await resolve_clarification(
                    db,
                    clarification_id=clar_row.id,
                    answer_text=parsed_query,
                    resolved_by_message_id=query_id,
                )
                log.info(f"ChatID: {chat_id} - Clarification resolved, continuing with tool execution")
            except Exception as e:
                log.warning(f"ChatID: {chat_id} - Failed to resolve clarification: {e}")
        else:
            log.warning(f"ChatID: {chat_id} - No clarification record found")
    except Exception as e:
        log.error(f"ChatID: {chat_id} - Error processing clarification follow-up: {e}")


async def handle_preset_query_flow(
    chatbot_instance,
    preset_query_steps: List[Dict[str, Any]],
    query_id: UUID4,
    chat_id: UUID4,
    step_order: int,
    db: AsyncSession,
    user_meta: dict,
    workspace_id: str,
    project_id: str,
    conversation_history: List[Any],
    user_id: str,
    query_flow_store: dict,
    enhanced_query_for_processing: str,
    workspace_in_context: bool,
    switch_llm: str,
    reasoning_container: dict,
    source: Optional[str],
) -> AsyncIterator[Union[str, Dict[str, Any]]]:
    """
    Handle complete preset query flow: build tools, record routing, execute, and stream response.

    Returns chunks including final response marker.
    """
    from pi.services.schemas.chat import ToolQuery

    # Build selected tools from preset config
    selected_tools = []

    for step in preset_query_steps:
        reasoning_messages = step.get("reasoning_messages", [])
        tools_config = step.get("agents", [])  # Still called "agents" in template

        # Show preset reasoning messages
        async for chunk in process_preset_reasoning_messages(reasoning_messages, reasoning_container):
            yield chunk

        # Convert preset config to ToolQuery format
        for tool_config in tools_config:
            tool_name = tool_config.get("agent")  # Template still uses "agent" key
            tool_query_str = tool_config.get("query")
            if tool_name and tool_query_str:
                selected_tools.append(ToolQuery(tool=tool_name, query=tool_query_str))

    # Record preset routing as flow step
    if selected_tools:
        step_order = await record_preset_routing_step(query_id=query_id, chat_id=chat_id, step_order=step_order, selected_tools=selected_tools, db=db)

    # Execute preset tool flow
    if selected_tools:
        async for chunk in execute_preset_tool_flow(
            chatbot_instance,
            preset_query_steps,
            selected_tools,
            user_meta,
            query_id,
            workspace_id,
            project_id,
            conversation_history,
            user_id,
            str(chat_id),
            query_flow_store,
            enhanced_query_for_processing,
            step_order,
            workspace_in_context,
            db,
            switch_llm,
            reasoning_container["content"],
            source,
        ):
            yield chunk


async def execute_preset_tool_flow(
    chatbot_instance,
    preset_query_steps: List[Dict[str, Any]],
    selected_tools: List[Any],
    user_meta: dict,
    query_id: UUID4,
    workspace_id: str,
    project_id: str,
    conversation_history: List[Any],
    user_id: str,
    chat_id: str,
    query_flow_store: dict,
    enhanced_query_for_processing: str,
    step_order: int,
    workspace_in_context: bool,
    db: AsyncSession,
    switch_llm: str,
    reasoning: str,
    source: Optional[str],
) -> AsyncIterator[Union[str, Dict[str, Any]]]:
    """Execute preset tool flow and yield response chunks."""
    try:
        # For now, execute the first preset tool (templates currently define one)
        preset_step = preset_query_steps[0] if len(preset_query_steps) > 0 else {}
        preset_tools_cfg = preset_step.get("agents", []) if isinstance(preset_step, dict) else []
        first_tool_cfg = preset_tools_cfg[0] if preset_tools_cfg else {}

        # Extract preset SQL execution parameters
        preset_tables = first_tool_cfg.get("tables")
        preset_sql_query = first_tool_cfg.get("sql_query")
        preset_placeholders = first_tool_cfg.get("placeholders_in_order")

        # Align sub-step persistence for text2sql with current step
        try:
            if isinstance(query_flow_store, dict):
                query_flow_store["step_order"] = step_order
        except Exception:
            pass

        # Execute the preset query via the standard tool handler (handles CTEs, flow steps, entity URLs)
        result = await chatbot_instance.handle_tool_query(
            db=db,
            tool=selected_tools[0].tool,
            query=selected_tools[0].query,
            user_meta=user_meta,
            message_id=query_id,
            workspace_id=workspace_id,
            project_id=project_id,
            conv_hist=conversation_history,
            user_id=str(user_id),
            chat_id=str(chat_id),
            query_flow_store=query_flow_store,
            is_multi_tool=False,
            preset_tables=preset_tables,
            preset_sql_query=preset_sql_query,
            preset_placeholders=preset_placeholders,
        )

        # Persist a high-level tool execution step so downstream views can extract entity_urls and summaries
        try:
            tool_name_value = getattr(selected_tools[0].tool, "value", str(selected_tools[0].tool))
            flow_step_payload = {
                "step_order": step_order,
                "step_type": FlowStepType.TOOL.value,
                "tool_name": tool_name_value,
                "content": standardize_flow_step_content(result, FlowStepType.TOOL),
                "execution_data": result if isinstance(result, dict) else {"results": str(result)},
                "is_planned": False,
                "is_executed": True,
                "execution_success": "success",
            }
            await upsert_message_flow_steps(message_id=query_id, chat_id=uuid.UUID(str(chat_id)), flow_steps=[flow_step_payload], db=db)
            step_order += 1
        except Exception as e:
            log.warning(f"ChatID: {chat_id} - Failed to persist preset tool execution step: {e}")

        # Prepare streaming of the final user-visible text via LLM combiner (applies phrasing rules)
        results_text = StandardAgentResponse.extract_results(result)  # plain tool output
        try:
            # Include attachments if any are in shared context
            attachment_blocks = getattr(chatbot_instance, "get_current_attachment_blocks", lambda: None)()
        except Exception:
            attachment_blocks = None
        base_stream = chatbot_instance.combined_response_stream(
            query=(enhanced_query_for_processing or selected_tools[0].query),
            responses=results_text,
            conversation_history=conversation_history,
            user_meta=user_meta or {},
            user_id=str(user_id),
            attachment_blocks=attachment_blocks,
            workspace_in_context=workspace_in_context,
        )

        # Stream and persist assistant message
        final_response = ""
        async for chunk in chatbot_instance._process_response(
            base_stream, chat_id, query_id, uuid.uuid4(), switch_llm, db, reasoning=reasoning, source=source
        ):
            if chunk.startswith("__FINAL_RESPONSE__"):
                final_response = chunk[len("__FINAL_RESPONSE__") :]
                continue
            yield chunk

        if final_response:
            query_flow_store["answer"] = final_response

    except Exception as e:
        log.error(f"ChatID: {chat_id} - Error executing preset flow: {e}")
        raise


async def record_preset_routing_step(*, query_id: UUID4, chat_id: UUID4, step_order: int, selected_tools: List[Any], db: AsyncSession) -> int:
    """Record preset routing as flow step with timeout protection."""
    routing_content = [{"tool": tool_query.tool.name, "query": tool_query.query} for tool_query in selected_tools]

    try:
        flow_step_result = await asyncio.wait_for(
            upsert_message_flow_steps(
                message_id=query_id,
                chat_id=chat_id,
                flow_steps=[
                    {
                        "step_order": step_order,
                        "step_type": FlowStepType.ROUTING.value,
                        "tool_name": None,
                        "content": standardize_flow_step_content(routing_content, FlowStepType.ROUTING),
                        "execution_data": {},
                    }
                ],
                db=db,
            ),
            timeout=2.0,
        )
        if flow_step_result["message"] != "success":
            log.warning(f"Failed to record RAG routing flow step: {flow_step_result.get("error", "Unknown error")}")
    except asyncio.TimeoutError:
        log.warning("Timed out recording RAG routing flow step; continuing")
    except Exception as e:
        log.warning(f"Failed to record RAG routing flow step: {e}")

    return step_order + 1


async def process_preset_reasoning_messages(reasoning_messages: List[str], reasoning_container: dict) -> AsyncIterator[Union[str, Dict[str, Any]]]:
    """Yield preset reasoning messages as special reasoning blocks."""
    log.info(f"Reasoning messages: {reasoning_messages}")

    for reasoning_msg in reasoning_messages:
        reasoning_chunk_dict = {
            "chunk_type": "reasoning",
            "header": reasoning_msg,
            "content": "",
            "stage": "ask_preset_reasoning",
        }
        reasoning_container["content"] += reasoning_chunk_dict["header"] + reasoning_chunk_dict["content"]
        yield reasoning_chunk_dict


async def collect_conversation_attachments(*, chat_id: UUID4, db: AsyncSession, current_attachment_ids: List[UUID4]) -> List[UUID4]:
    """Collect all attachments from conversation history and merge with current attachments."""
    all_attachment_ids = current_attachment_ids.copy() if current_attachment_ids else []

    try:
        from pi.services.retrievers.pg_store.chat import retrieve_chat_history

        raw_history = await retrieve_chat_history(chat_id=chat_id, db=db, dialogue_object=True)

        if raw_history.get("dialogue"):
            attachment_count = 0
            for qa_pair in raw_history["dialogue"]:
                if qa_pair.get("attachments"):
                    for att in qa_pair["attachments"]:
                        att_id = att.get("id")
                        if att_id and att_id not in [str(aid) for aid in all_attachment_ids]:
                            all_attachment_ids.append(uuid.UUID(att_id))
                            attachment_count += 1

            if attachment_count > 0:
                log.info(f"ChatID: {chat_id} - Collected {attachment_count} attachments from conversation history")
    except Exception as e:
        log.warning(f"ChatID: {chat_id} - Failed to collect conversation attachments: {e}")

    return all_attachment_ids


async def generate_chat_title_if_needed(
    *,
    chatbot_instance,
    chat_id: UUID4,
    query_id: UUID4,
    db: AsyncSession,
    final_response: str,
    parsed_query: str | None,
    query: str,
) -> None:
    """
    Generate chat title for new chats (first message only).

    Checks if this is the first message and generates a title either:
    - Directly from the query (for error responses)
    - Using LLM (for successful responses)
    """
    try:
        from sqlalchemy import select

        from pi.app.models import Message

        # Get the message sequence number to determine if this is a new chat
        stmt = select(Message).where(Message.id == query_id)  # type: ignore[arg-type]
        result = await db.execute(stmt)
        message = result.scalar_one_or_none()

        if message:
            message_sequence = message.sequence
            is_first_message = message_sequence == 1
        else:
            log.warning(f"ChatID: {chat_id} - Message {query_id} not found for sequence check")
            is_first_message = False

        if is_first_message:
            try:
                # For error scenarios, use the user's question directly as title
                is_error_response = (
                    not final_response
                    or final_response.startswith("An unexpected error occurred")
                    or final_response == "TOOL_ORCHESTRATION_FAILURE"
                    or final_response.startswith("Action execution is not available")
                    or final_response.startswith("Chat ID is required")
                    or final_response.startswith("Your request timed out")
                )

                title = None
                if is_error_response:
                    # Use the user's original question as title, with some cleanup
                    title = (parsed_query if parsed_query is not None else query).strip()
                    # Truncate if too long (keeping it under ~60 characters for readability)
                    if len(title) > 60:
                        title = title[:57] + "..."
                    await chatbot_instance.set_chat_title_directly(chat_id, title, db)
                elif final_response:
                    # For successful responses, generate title using LLM
                    chat_history = [parsed_query if parsed_query is not None else query, final_response]
                    # Ensure both elements are strings
                    chat_history = [str(item) for item in chat_history if item is not None]
                    if len(chat_history) >= 2:  # Make sure we have both query and response
                        title = await chatbot_instance.generate_title(chat_id, chat_history, db)
                        # Generated chat title search index upserted via Celery background task
                    else:
                        log.warning(f"ChatID: {chat_id} - Not enough valid content to generate title")
                        title = (parsed_query if parsed_query is not None else query).strip()
                        # Truncate if too long (keeping it under ~60 characters for readability)
                        if len(title) > 60:
                            title = title[:57] + "..."
                        await chatbot_instance.set_chat_title_directly(chat_id, title, db)
                else:
                    log.warning(f"ChatID: {chat_id} - No final_response available for title generation")

                if title:
                    log.info(f"ChatID: {chat_id} - Generated title: {title}")
            except Exception as e:
                log.error(f"Error generating title: {str(e)}")

    except Exception as e:
        log.error(f"Error checking message sequence for title generation: {str(e)}")


def log_ask_mode_request_details(data: Any, context: Dict[str, Any]) -> None:
    """
    Log all important request details for ask mode processing.

    Args:
        data: ChatRequest object with original request fields
        context: Dict with derived/computed values:
            - enhanced_query_for_processing
            - attachment_context
            - workspace_slug (resolved)
            - workspace_id (resolved)
            - workspace_in_context (computed)
    """
    chat_id = data.chat_id
    log.info(f"ChatID: {chat_id} - Input query: {data.query}")
    log.info(f"ChatID: {chat_id} - Enhanced query: {context.get("enhanced_query_for_processing")}")
    log.info(f"ChatID: {chat_id} - Attachment context: {context.get("attachment_context")}")
    log.info(f"ChatID: {chat_id} - User meta: {data.context}")
    log.info(f"ChatID: {chat_id} - Workspace in context: {context.get("workspace_in_context", data.workspace_in_context)}")
    log.info(f"ChatID: {chat_id} - Workspace slug: {context.get("workspace_slug", data.workspace_slug)}")
    log.info(f"ChatID: {chat_id} - Workspace ID: {context.get("workspace_id", str(data.workspace_id) if data.workspace_id else None)}")
    log.info(f"ChatID: {chat_id} - Web search enabled: {context.get("websearch_enabled", getattr(data, "is_websearch_enabled", False))}")
    log.info(f"ChatID: {chat_id} - Is New Chat: {data.is_new}")
    log.info(f"ChatID: {chat_id} - Source: {data.source}")
    log.info(f"ChatID: {chat_id} - Is Project Chat: {data.is_project_chat}")
    log.info(f"ChatID: {chat_id} - User ID: {data.user_id}")
    log.info(f"ChatID: {chat_id} - Project ID: {str(data.project_id) if data.project_id else None}")
    log.info(f"ChatID: {chat_id} - LLM: {data.llm}")


async def construct_enhanced_prompt_and_context(
    enhanced_conversation_history: str | None,
    project_id: str | None,
    workspace_id: str | None,
    user_id: str | None,
    user_meta: dict | None,
    workspace_in_context: bool = True,
    web_search_context: str | None = None,
) -> Tuple[str, str]:
    """
    Build enhanced custom prompt and context block for LLM orchestration.

    Returns:
        Tuple of (custom_prompt, context_block)
    """
    from pi.services.chat.helpers.tool_utils import build_clarification_context_block
    from pi.services.chat.utils import get_current_timestamp_context

    custom_prompt = ""

    # Inject enhanced conversation history if available to guide orchestration
    address_user_by_name = True
    try:
        if enhanced_conversation_history and isinstance(enhanced_conversation_history, str) and enhanced_conversation_history.strip():
            custom_prompt += f"\n\n**CONVERSATION HISTORY & ACTION CONTEXT:**\n{enhanced_conversation_history}\n"
            custom_prompt += HISTORY_FRESHNESS_WARNING
            address_user_by_name = False
    except Exception:
        pass

    if web_search_context and isinstance(web_search_context, str) and web_search_context.strip():
        custom_prompt += f"\n\n**WEB SEARCH RESULTS (EXTERNAL SOURCES):**\n{web_search_context}\n"
        custom_prompt += """
**CITATION INSTRUCTIONS:** Embed clickable source links inline: fact [[Source Title](URL)]. No separate Sources section.
"""

    # Provide PROJECT/USER/TIME context to the tool planner
    context_block = ""
    try:
        # Check if workspace is in context
        if not workspace_in_context:
            # No workspace context - guide LLM on how to handle queries
            context_block += "\n\n**⚠️ NO WORKSPACE CONTEXT:**\n\n**Instructions:**\n- For general questions about Plane features and functionality, use docs_search_tool to search documentation\n- For questions NOT related to Plane, answer directly using your knowledge\n- For questions about specific workspace data (issues, projects, cycles, team members, etc.), politely inform the user:\n  'To access your workspace data, please enable workspace context using the chat input box options.'\n"  # noqa: E501
        elif project_id:
            # Project scoping (project chat)
            context_block += f"\n\n**🔥 PROJECT CONTEXT (CRITICAL):**\nProject ID: {project_id} ⚠️ (FOR YOUR USE ONLY - DO NOT SHOW THIS UUID TO USER)\n\n**IMPORTANT SCOPING RULES:**\n- This is a PROJECT-LEVEL chat - ALL operations are scoped to THIS PROJECT ONLY\n- When the request mentions 'current cycle', 'current module', 'work items', etc. - it means ONLY within THIS PROJECT\n- Use this project_id for ALL tools that accept project_id parameter\n- DO NOT query across all projects - scope everything to THIS specific project\n- User refers to 'this project'/'the project'/'current project' = use this project_id"  # noqa: E501
        else:
            # Workspace-level context (no specific project)
            context_block += f"\n\n**🌐 WORKSPACE CONTEXT (CRITICAL):**\nWorkspace ID: {workspace_id} ⚠️ (FOR YOUR USE ONLY - DO NOT SHOW THIS UUID TO USER)\n\n**IMPORTANT SCOPING RULES:**\n- This is a WORKSPACE-LEVEL chat - queries can span MULTIPLE PROJECTS\n- When the request mentions 'last cycle', 'this cycle', 'work items', etc. WITHOUT specifying a project - it could be in ANY project\n- Use list_member_projects (without limit or with high limit) to get ALL projects in the workspace\n- Then iterate through projects to find relevant cycles/modules/work-items\n- CRITICAL: Do NOT limit to 1 project unless the user specifically names or refers to a specific project"  # noqa: E501

        # User context
        if user_id:
            context_block += (
                "\n**USER CONTEXT:**\n"
                f"User ID: {user_id} ⚠️ (FOR YOUR USE ONLY - DO NOT SHOW THIS UUID TO USER)\n"
                "- Use this to resolve pronouns like 'me', 'my', 'assigned to me'.\n"
            )

            if address_user_by_name:
                # Include user's first name if available from user_meta
                if user_meta and isinstance(user_meta, dict):
                    first_name = user_meta.get("first_name") or user_meta.get("firstName")
                    if first_name:
                        context_block += f"- User's first name: {first_name}\n"

                    last_name = user_meta.get("last_name") or user_meta.get("lastName")
                    if last_name:
                        context_block += f", and last name: {last_name}\n"

                    email = user_meta.get("email")
                    if email:
                        context_block += f"- User's email: {email}\n"

                    context_block += "\n use the user's name (primarily first name) to address them in your responses.\n"
                    context_block += "- You can reveal the user's name and email to them if requested. The name details here are primarily for greeting purposes. Use the user_id in tool calls if you need to get more user details.\n"  # noqa: E501
            else:
                context_block += "\nSkip greetings and get straight to the point."

        # Date/time context - MOVED TO custom_prompt to avoid breaking cache
        dt_ctx = None
        try:
            if user_id:
                dt_ctx = await get_current_timestamp_context(user_id)
        except Exception:
            dt_ctx = None
    except Exception:
        # Non-fatal; continue without context block if any error occurs
        pass

    # CRITICAL: Inject clarification context if this is a follow-up to ask_for_clarification
    if user_meta and isinstance(user_meta, dict) and user_meta.get("clarification_context"):
        custom_prompt += build_clarification_context_block(user_meta.get("clarification_context"))

    # Add timestamp context AFTER all other content (dynamic, goes in HumanMessage)
    if dt_ctx:
        custom_prompt += f"\n{dt_ctx}\n"

    return custom_prompt, context_block


async def resolve_workspace_id_and_slug(
    *,
    workspace_id: str | None,
    project_id: str | None,
    chat_id: UUID4,
) -> Tuple[str | None, str | None]:
    """
    Resolve workspace_id from project_id if needed, then get workspace_slug.

    Returns:
        Tuple of (resolved_workspace_id, workspace_slug)
    """
    from pi.app.api.v1.helpers.plane_sql_queries import get_workspace_slug
    from pi.app.api.v1.helpers.plane_sql_queries import resolve_workspace_id_from_project_id

    # Resolve workspace_id from project_id if needed (for project-level chats)
    if not workspace_id and project_id:
        try:
            resolved_workspace_id = await resolve_workspace_id_from_project_id(str(project_id))
            if resolved_workspace_id:
                workspace_id = str(resolved_workspace_id)
                log.info(f"ChatID: {chat_id} - Resolved workspace_id {workspace_id} from project_id {project_id} (Phase 1)")
        except Exception as e:
            log.error(f"ChatID: {chat_id} - Failed to resolve workspace_id from project_id {project_id}: {e}")

    # Build workspace slug
    workspace_slug = None
    if workspace_id:
        try:
            workspace_slug = await get_workspace_slug(workspace_id)
        except Exception as e:
            log.warning(f"ChatID: {chat_id} - Failed to get workspace_slug for workspace_id {workspace_id}: {e}")

    return workspace_id, workspace_slug


# ------------------------------
# Fast-path helpers (no workspace context)
# ------------------------------


async def create_fast_path_stream(
    chatbot_instance,
    query_id: UUID4,
    db: AsyncSession,
    chat_id: UUID4,
    user_meta: Dict[str, Any] | None,
    user_id: str | None,
    enhanced_query_for_processing: str,
    enhanced_conversation_history: str | None,
    reasoning_container: Dict[str, str] | None = None,
    web_search_context: str | None = None,
) -> AsyncIterator[Union[str, Dict[str, Any]]]:
    """
    Create a fast-path stream for queries without workspace context.

    This bypasses tool orchestration and directly calls the LLM with a simple prompt.
    Used when workspace_in_context is False for both Ask and Build modes.

    Args:
        chatbot_instance: The chatbot instance with tool_llm attribute
        query_id: Message ID for token tracking
        db: Database session
        chat_id: Chat ID for logging
        user_meta: User metadata dict (may contain first_name, email)
        user_id: User ID for timestamp context
        enhanced_query_for_processing: The user's query (may include attachment context)
        enhanced_conversation_history: Previous conversation history

    Yields:
        str: Streaming chunks from LLM response
    """

    log.info(f"ChatID: {chat_id} - No workspace context, using fast path (direct LLM call)")

    # Extract user name from user_meta if available
    user_first_name = None
    user_email = None
    if user_meta and isinstance(user_meta, dict):
        user_first_name = user_meta.get("first_name")
        user_email = user_meta.get("email")

    # Get timestamp context
    dt_ctx = None
    try:
        if user_id:
            dt_ctx = await get_current_timestamp_context(user_id)
    except Exception:
        pass

    # Build context block
    context_parts = []
    if user_first_name:
        context_parts.append(f"**User:** {user_first_name}")
    elif user_email:
        context_parts.append(f"**User:** {user_email}")
    if dt_ctx:
        context_parts.append(dt_ctx.strip())
    context_block = "\n".join(context_parts) if context_parts else ""

    # Build system prompt
    web_search_block = ""
    citation_instructions = ""
    if web_search_context and isinstance(web_search_context, str) and web_search_context.strip():
        web_search_block = f"\n\n**WEB SEARCH RESULTS (EXTERNAL SOURCES):**\n{web_search_context}"
        citation_instructions = """

**CITATION INSTRUCTIONS (IMPORTANT):**
When using information from the web search results above, embed clickable source links directly in your answer:
- Format: fact or claim [[Source Title](URL)]
- Example: "Plane has 44K stars [[GitHub](https://github.com/makeplane)]"
- Use short, descriptive titles for links (e.g., "GitHub", "Official Blog", "Reuters")
- Only cite sources you actually used
- Do NOT include a separate Sources section at the end - all citations should be inline"""

    system_prompt = f"""You are Plane AI, an AI assistant for Plane - a work management platform.

**Current Mode:** No workspace context available.

{context_block}
{web_search_block}
{citation_instructions}

**Your role:**
- Answer general knowledge questions not related to Plane
- If user asks about their specific workspace data (issues, projects, cycles, team members, etc.), politely inform them:
  "To access your workspace data, please enable workspace context using the chat input box options."

Be helpful, concise, and professional."""

    # Build message list
    messages: List[BaseMessage] = [SystemMessage(content=system_prompt)]
    if enhanced_conversation_history and isinstance(enhanced_conversation_history, str) and enhanced_conversation_history.strip():
        messages.append(SystemMessage(content=f"Conversation History:\n{enhanced_conversation_history}"))
    messages.append(HumanMessage(content=enhanced_query_for_processing))

    # Setup LLM with token tracking
    llm = chatbot_instance.tool_llm
    llm.set_tracking_context(query_id, db, MessageMetaStepType.TOOL_ORCHESTRATION, chat_id=str(chat_id))

    # Signal to the caller that we're generating the final response
    # This marker is used by chat.py to start collecting chunks for DB persistence
    stage = "final_response"
    reasoning_chunk_dict = reasoning_dict_maker(stage=stage, tool_name="", tool_query="", content="")
    if reasoning_container is not None:
        reasoning_container["content"] += reasoning_chunk_dict["header"] + reasoning_chunk_dict["content"]
    yield reasoning_chunk_dict

    # Stream LLM response with batching to avoid overwhelming browser with individual token events

    # Wrap the LLM stream with batching (10 words per batch)
    async for batched_chunk in batch_llm_stream_by_words(llm.astream(messages), words_per_batch=15):
        yield batched_chunk
