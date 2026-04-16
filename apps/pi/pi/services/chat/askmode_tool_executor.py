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

"""Retrieval tool execution logic for single and multi-tool scenarios.
Also includes tools for ask mode."""

import json
from collections.abc import AsyncIterator
from typing import Any
from typing import Dict
from typing import List
from typing import Tuple
from typing import Union
from typing import cast

from langchain_core.messages import BaseMessage
from langchain_core.messages import HumanMessage
from langchain_core.messages import SystemMessage
from langchain_core.messages import ToolMessage

from pi import logger
from pi.app.models.enums import MessageMetaStepType
from pi.core.db.plane_pi.lifecycle import get_streaming_db_session
from pi.services.chat.helpers import ask_mode_helpers
from pi.services.chat.helpers.flow_tracking import check_and_build_clarification
from pi.services.chat.helpers.flow_tracking import execute_tool_step
from pi.services.chat.helpers.flow_tracking import orchestrate_llm_step
from pi.services.chat.helpers.flow_tracking import persist_precomputed_ai_message
from pi.services.chat.helpers.flow_tracking import store_and_format_clarification
from pi.services.chat.helpers.tool_utils import WordBatcher
from pi.services.chat.helpers.tool_utils import extract_text_from_content
from pi.services.chat.helpers.tool_utils import format_tool_query_for_display
from pi.services.chat.helpers.tool_utils import stream_content_in_chunks
from pi.services.chat.helpers.tool_utils import tool_name_shown_to_user
from pi.services.chat.kit import TODO_STATUS_ICON
from pi.services.chat.prompt_mixins import pai_ask_system_prompt_sensitive_version
from pi.services.chat.prompts import WRITE_TODOS_SYSTEM_PROMPT_ASK
from pi.services.chat.prompts import pai_ask_system_prompt
from pi.services.chat.utils import reasoning_dict_maker
from pi.services.llm.cache_utils import create_claude_cached_system_message
from pi.services.llm.cache_utils import get_claude_bind_kwargs_with_cache
from pi.services.llm.cache_utils import should_cache_messages
from pi.services.llm.cache_utils import should_cache_tool_bindings
from pi.services.retrievers.pg_store.message import upsert_write_todos_flow_step as _upsert_write_todos_flow_step

log = logger.getChild(__name__)


def extract_facts_from_tool_result(tool_name: str, result: Any) -> Dict[str, Any]:
    """Extract structured facts from tool results for enhanced history."""
    facts = {}

    try:
        # Handle StandardAgentResponse dict format (most common case)
        # Tool handlers return dicts like: {"results": "...", "entity_urls": [...], ...}
        if isinstance(result, dict):
            # Extract entity URLs (critical for citations and linking)
            entity_urls = result.get("entity_urls")
            if entity_urls and isinstance(entity_urls, list):
                facts["entity_urls"] = entity_urls[:10]  # Limit to prevent bloat
                facts["entity_urls_count"] = len(entity_urls)
                # Extract IDs from entity URLs for easier reference
                entity_ids = [url.get("id") for url in entity_urls if isinstance(url, dict) and url.get("id")]
                if entity_ids:
                    facts["entity_ids"] = entity_ids[:10]

            # Extract intermediate results (SQL debugging for structured_db_tool)
            intermediate_results = result.get("intermediate_results")
            if intermediate_results and isinstance(intermediate_results, dict):
                if intermediate_results.get("generated_sql"):
                    facts["sql_query"] = str(intermediate_results["generated_sql"])[:300]
                if intermediate_results.get("relevant_tables"):
                    facts["relevant_tables"] = intermediate_results["relevant_tables"]
                if intermediate_results.get("final_query"):
                    facts["final_query"] = str(intermediate_results["final_query"])[:200]

            # Extract search metadata (for vector/semantic search tools)
            execution_metadata = result.get("execution_metadata")
            if execution_metadata and isinstance(execution_metadata, dict):
                facts["search_metadata"] = execution_metadata

            # Extract result preview from "results" field
            results_text = result.get("results")
            if results_text:
                facts["result_preview"] = str(results_text)[:300]

            # Extract other common fields that might be in the dict
            for key in ["entity_id", "entity_name", "entity_url", "count", "ids", "results_count"]:
                if key in result and result[key]:
                    facts[key] = result[key]

        # Handle string results (simple tool responses)
        elif isinstance(result, str):
            facts["result_preview"] = result[:300]

    except Exception as e:
        log.debug(f"Could not extract facts from {tool_name}: {e}")

    return facts


async def execute_tools_for_ask_mode(
    chatbot_instance,
    user_meta,
    workspace_id,
    workspace_slug,
    project_id,
    conversation_history,
    enhanced_conversation_history,  # 🆕 Enhanced context with action details
    user_id,
    chat_id,
    query_flow_store,
    enhanced_query_for_processing,  # This is what's actually passed from chat.py
    query_id,
    step_order,
    db,
    parsed_query,
    reasoning_container=None,
    mention_context=None,
    websearch_enabled: bool = False,
    web_search_context: str | None = None,
) -> AsyncIterator[Union[str, Dict[str, Any]]]:
    """Execute tools for ask mode"""
    log.debug(f"ChatID: {chat_id} - Executing tools for ask mode with enhanced_conversation_history: {enhanced_conversation_history}")
    try:
        # Extract workspace_in_context from query_flow_store
        workspace_in_context = True
        if isinstance(query_flow_store, dict):
            workspace_in_context = query_flow_store.get("workspace_in_context", True)
            is_guest_user = bool(query_flow_store.get("is_guest_user") or query_flow_store.get("is_guest"))

        log.info(f"ChatID: {chat_id} - Workspace in context: {workspace_in_context}")

        # Resolve workspace_id and workspace_slug (only when workspace is in context)
        workspace_id, workspace_slug = await ask_mode_helpers.resolve_workspace_id_and_slug(
            workspace_id=workspace_id,
            project_id=project_id,
            chat_id=chat_id,
        )

        tools = await chatbot_instance._create_tools_for_ask_mode(
            db,
            user_meta,
            workspace_id,
            workspace_slug,
            project_id,
            user_id,
            chat_id,
            query_flow_store,
            conversation_history,
            query_id,
            workspace_in_context=workspace_in_context,
            websearch_enabled=websearch_enabled,
            chatbot_instance=chatbot_instance,
        )

        if not tools:
            log.warning("Unable to initialize tools. Please try again.")
            msg = "An unexpected error occurred. Please try again later."
            yield msg
            return

        try:
            # Determine if this is a clarification follow-up (raw user input)
            is_clarification_followup = bool(user_meta and isinstance(user_meta, dict) and user_meta.get("clarification_context"))
            query_label = "Query (raw user input from clarification)" if is_clarification_followup else "Query"

            # Log comprehensive debugging information
            log.debug(f"ChatID: {chat_id} - {query_label}: {enhanced_query_for_processing}")
            log.debug(f"ChatID: {chat_id} - Ask mode LLM input - Available tools: {[t.name for t in tools]}")

        except Exception as e:
            log.warning(f"ChatID: {chat_id} - Failed to log debug info: {e}")

        # Build enhanced prompt and context block
        custom_prompt, context_block = await ask_mode_helpers.construct_enhanced_prompt_and_context(
            enhanced_conversation_history=enhanced_conversation_history,
            project_id=project_id,
            workspace_id=workspace_id,
            user_id=user_id,
            user_meta=user_meta,
            workspace_in_context=workspace_in_context,
            web_search_context=web_search_context,
            mention_context=mention_context,
            is_guest_user=is_guest_user,
        )

        # Bind tools to the LLM - explicitly set tool_choice to 'auto' to ensure tool use is enabled
        # deduplicate tools
        tools = list({tool.name: tool for tool in tools}.values())

        # Tool-level cache_control only works with native ChatAnthropic
        bind_kwargs = {}
        if should_cache_tool_bindings(chatbot_instance.switch_llm):
            bind_kwargs = get_claude_bind_kwargs_with_cache()

        llm_with_tools = chatbot_instance.tool_llm.bind_tools(tools, **bind_kwargs)

        # Set tracking context on the bound LLM instance
        llm_with_tools.set_tracking_context(query_id, db, MessageMetaStepType.TOOL_ORCHESTRATION, chat_id=str(chat_id))

        # Track execution - use FlowStepCollector context manager for automatic persistence
        current_step = step_order
        messages: List[BaseMessage] = []  # type: ignore[no-redef]
        responses: List[Tuple[str, str, Union[str, Dict[str, Any]]]] = []
        # Delimiter-based routing: all reasoning flows until ππANSWERππ, then final answer
        final_answer_streamed = False
        final_response_marker_emitted = False

        async def _orchestrate_llm_step_with_ui_ticks(
            *,
            include_context: bool,
            result_holder: Dict[str, Any],
            stream_final_answer: bool = False,
        ) -> AsyncIterator[Union[Dict[str, Any], str]]:
            """
            Ask-mode streaming using the shared smart buffering utility.
            Maps StreamEvent events to Ask Mode-specific behavior including tool announcements.
            """
            nonlocal current_step
            nonlocal final_answer_streamed
            nonlocal final_response_marker_emitted

            from pi.services.chat.helpers.tool_utils import stream_llm_with_delimiter

            # Emit an immediate "planning" tick so UI updates even before first model event arrives
            stage = "planner_tool_selection_calling"
            tick = reasoning_dict_maker(stage=stage, tool_name="", tool_query="", content="")
            if reasoning_container is not None:
                reasoning_container["content"] += tick["header"] + tick["content"]
            yield tick

            announced_tools: set[str] = set()
            answer_streaming_started = False
            streamed_reasoning_chunks = False
            ai_message: Any = None

            # Word-level batcher to reduce browser SSE event overhead
            _batcher = WordBatcher(words_per_batch=15)

            # Word-level batcher to reduce browser SSE event overhead
            _batcher = WordBatcher(words_per_batch=15)

            async for event in stream_llm_with_delimiter(llm_with_tools, messages, stream_final_answer=stream_final_answer):
                event_type = event.get("type", "")

                if event_type == "reasoning_chunk":
                    content = event.get("content", "")
                    if content:
                        streamed_reasoning_chunks = True
                        if reasoning_container is not None:
                            reasoning_container["content"] += content
                        yield {"chunk_type": "reasoning", "header": "", "content": content}

                elif event_type == "final_answer_chunk":
                    content = event.get("content", "")
                    if content:
                        # Emit final response marker on first chunk
                        if not answer_streaming_started:
                            answer_streaming_started = True
                            final_answer_streamed = True
                            if not final_response_marker_emitted:
                                final_response_marker_emitted = True
                                yield {
                                    "chunk_type": "reasoning",
                                    "header": "Generating final response...\n\n",
                                    "content": "",
                                    "stage": "final_response",
                                }
                        batched = _batcher.add(content)
                        if batched:
                            yield batched

                elif event_type == "tool_detected":
                    # Ask mode announces individual tools during streaming
                    tool_name = event.get("tool_name", "")
                    if tool_name and tool_name not in announced_tools:
                        announced_tools.add(tool_name)
                        user_friendly = tool_name_shown_to_user(tool_name)
                        stage = "planner_tool_selection_final"
                        tick = reasoning_dict_maker(stage=stage, tool_name=user_friendly, tool_query="", content="")
                        if reasoning_container is not None:
                            reasoning_container["content"] += tick["header"] + tick["content"]
                        yield tick

                elif event_type == "complete":
                    ai_message = event.get("accumulated_message")

                    # FALLBACK: If we streamed reasoning but never got a final_answer_chunk,
                    # the LLM didn't output the delimiter. Emit the final_response marker
                    # to close the reasoning panel, and re-emit the content as the answer.
                    # IMPORTANT: Only apply fallback for TRUE final responses (no tool_calls).
                    # Intermediate responses (with tool_calls) should NOT trigger this fallback.
                    has_tool_calls = ai_message and hasattr(ai_message, "tool_calls") and bool(getattr(ai_message, "tool_calls", None))

                    if (
                        streamed_reasoning_chunks
                        and not answer_streaming_started
                        and stream_final_answer
                        and not has_tool_calls  # Only for final responses without tool calls
                    ):
                        log.warning(f"ChatID: {chat_id} - LLM did not output delimiter; falling back to treat reasoning as answer")
                        # Emit final_response stage marker to close reasoning panel
                        if not final_response_marker_emitted:
                            final_response_marker_emitted = True
                            yield {
                                "chunk_type": "reasoning",
                                "header": "",
                                "content": "",
                                "stage": "final_response",
                            }

                        # Extract content from the accumulated message and emit as answer
                        if ai_message and hasattr(ai_message, "content") and ai_message.content:
                            content = extract_text_from_content(ai_message.content).strip()
                            # Handle case where delimiter exists but answer is empty (fallback to reasoning)
                            ANSWER_DELIMITER = "ππANSWERππ"
                            if ANSWER_DELIMITER in content:
                                parts = content.split(ANSWER_DELIMITER, 1)
                                answer_part = parts[-1].strip()
                                if answer_part:
                                    content = answer_part
                                else:
                                    content = parts[0].strip()

                            if content:
                                answer_streaming_started = True
                                final_answer_streamed = True
                                # Batch the fallback content through word batcher
                                # (could be large accumulated text)
                                batched = _batcher.add(content)

                                if batched:
                                    yield batched

            # Flush any remaining word batch
            remaining_batch = _batcher.flush()
            if remaining_batch:
                yield remaining_batch

            # If streaming produced no message (unexpected), fail fast
            if ai_message is None:
                raise RuntimeError("astream_events returned no chunks; cannot build AI message")

            # Some providers don't populate `tool_call_chunks` during streaming.
            # Emit tool-selection ticks based on the final message as a fallback.
            try:
                tool_calls = getattr(ai_message, "tool_calls", None)
                if isinstance(tool_calls, list) and tool_calls:
                    for tc in tool_calls:
                        if not isinstance(tc, dict):
                            continue
                        name = str(tc.get("name") or "").strip()
                        if not name or name in announced_tools:
                            continue
                        announced_tools.add(name)
                        user_friendly = tool_name_shown_to_user(name)
                        stage = "planner_tool_selection_final"
                        tick = reasoning_dict_maker(stage=stage, tool_name=user_friendly, tool_query="", content="")
                        if reasoning_container is not None:
                            reasoning_container["content"] += tick["header"] + tick["content"]
                        yield tick
            except Exception:
                pass

            # Persist tool selection + reasoning steps based on the final message
            ai_message, current_step = await persist_precomputed_ai_message(
                ai_message=ai_message,
                query_id=query_id,
                chat_id=chat_id,
                db=db,
                current_step=current_step,
                include_context=include_context,
                enhanced_conversation_history=enhanced_conversation_history if include_context else None,
                enhanced_query_for_processing=enhanced_query_for_processing if include_context else None,
                tools=tools,
            )

            result_holder["ai_message"] = ai_message
            result_holder["current_step"] = current_step
            result_holder["streamed_reasoning_chunks"] = streamed_reasoning_chunks

        # CRITICAL FOR CACHING: Separate static (cacheable) from dynamic (conversation history) content
        # Static content (system prompt + context_block) should remain constant for cache hits
        from pi.services.chat.prompt_mixins import TEXT_ONLY_AGENTIC_SEARCH_STRATEGY
        from pi.services.retrievers.pg_store.embedding_model import check_ml_model_configured_sync

        base_prompt = pai_ask_system_prompt if not is_guest_user else pai_ask_system_prompt_sensitive_version
        ml_model_configured = check_ml_model_configured_sync()
        if not is_guest_user and not ml_model_configured:
            base_prompt = base_prompt + "\n\n" + TEXT_ONLY_AGENTIC_SEARCH_STRATEGY
            log.info("ChatID: %s - Agentic text search strategy INJECTED (no embedding model configured)", chat_id)
        else:
            log.info(
                "ChatID: %s - Agentic text search strategy SKIPPED (ml_model_configured=%s, is_guest=%s)", chat_id, ml_model_configured, is_guest_user
            )

        system_prompt_to_use = f"{base_prompt}\n\n{WRITE_TODOS_SYSTEM_PROMPT_ASK}\n\n{context_block}"

        # Message-level cache_control works with both ChatAnthropic and LiteLLM
        if should_cache_messages(chatbot_instance.switch_llm):
            messages.append(create_claude_cached_system_message(system_prompt_to_use))
        else:
            messages.append(SystemMessage(content=system_prompt_to_use))

        # Inject mention context as a NON-CACHED system message (dynamic per request)
        if mention_context and mention_context.get("formatted_context"):
            mention_section = f"""**Pre-fetched context for entities mentioned in the user's query**

        The following entities were mentioned in the user's query (@mentions).
        Their current state has been fetched fresh from the database for this request.

        ═══════════════════════════════════════════════════
        {mention_context["formatted_context"]}
        ═══════════════════════════════════════════════════

        **MANDATORY PRE-TOOL-SELECTION CHECK:**
        Before selecting ANY tools, answer these questions:
        1. Does the user's query ask about entities shown above? (YES/NO)
        2. Is the requested information (state, assignee, project, etc.) present above? (YES/NO)
        3. If BOTH are YES → Answer DIRECTLY from context above. DO NOT call tools.
        4. If either is NO → Proceed with tool selection.

        For queries like "what's the state of issue <uuid>" where state is shown above → Answer immediately without tools.
        Only use tools for: filtering, aggregation, cross-entity analysis, or data NOT in the context above.
        """

            messages.append(SystemMessage(content=mention_section))

            log.info(f"ChatID: {chat_id} - Injected mention context for " f"{mention_context.get("count", 0)} entities into system prompt")

            # 🐛 DEBUG: Log actual mention context content
            log.debug(f"ChatID: {chat_id} - MENTION CONTEXT DEBUG:\n" f"{mention_context["formatted_context"]}")

        # IMPORTANT: custom_prompt contains dynamic conversation history - put it in user message
        # This keeps the cached system message unchanged
        query_to_use = f"{custom_prompt}\n\nUser Query: {enhanced_query_for_processing}"
        messages.append(HumanMessage(content=query_to_use))

        ## change point: "πspecial reasoning blockπ:
        # Yield initial status - different message for clarification follow-ups
        if is_clarification_followup:
            stage = "ask_mode_clarification_followup"
            reasoning_chunk_dict = reasoning_dict_maker(stage=stage, tool_name="", tool_query="", content="")
        else:
            stage = "ask_mode_beginning"
            reasoning_chunk_dict = reasoning_dict_maker(stage=stage, tool_name="", tool_query="", content="")
        if reasoning_container is not None:
            reasoning_container["content"] += reasoning_chunk_dict["header"] + reasoning_chunk_dict["content"]
        yield reasoning_chunk_dict

        # Initial invocation of LLM with tools (decorator persists selection/context/reasoning)
        # Stream tool-selection ticks during the LLM call (UI-visible stage tracking)
        try:
            stream_result: Dict[str, Any] = {}
            async for tick in _orchestrate_llm_step_with_ui_ticks(include_context=True, result_holder=stream_result, stream_final_answer=True):
                yield tick
            ai_message = stream_result.get("ai_message")
            current_step = int(stream_result.get("current_step", current_step))
        except Exception:
            # Fallback to non-streaming orchestration on unexpected streaming errors
            ai_message, current_step = await orchestrate_llm_step(
                llm_with_tools,
                messages,
                query_id=query_id,
                chat_id=chat_id,
                db=db,
                current_step=current_step,
                include_context=True,
                enhanced_conversation_history=enhanced_conversation_history,
                enhanced_query_for_processing=enhanced_query_for_processing,
                tools=tools,
            )

        # Defensive typing guard: streaming helper should always produce a message (falls back to `ainvoke`),
        # and the except-path above falls back to `orchestrate_llm_step`.
        assert ai_message is not None

        # Log LLM's initial response for debugging
        log.debug(f"ChatID: {chat_id} - Has Tool Calls: {hasattr(ai_message, "tool_calls") and bool(getattr(ai_message, "tool_calls", None))}")

        # Check if LLM made any tool calls
        if not ai_message.tool_calls:
            log.debug(f"ChatID: {chat_id} - No tool calls found in the initial LLM response.")

            if not final_response_marker_emitted:
                stage = "final_response"
                reasoning_chunk_dict = reasoning_dict_maker(stage=stage, tool_name="", tool_query="", content="")
                if reasoning_container is not None:
                    reasoning_container["content"] += reasoning_chunk_dict["header"] + reasoning_chunk_dict["content"]
                yield reasoning_chunk_dict

            if ai_message.content and not final_answer_streamed:
                # Stream the final answer in chunks to simulate streaming
                # Only if smart streaming didn't already handle it (which splits out the delimiter)
                final_text = extract_text_from_content(ai_message.content)
                async for chunk in stream_content_in_chunks(final_text):
                    yield chunk
            return

        # Stream LLM's initial reasoning content (internal thinking)
        # Only stream as reasoning if there ARE tool calls (otherwise it's the final answer)
        try:
            if hasattr(ai_message, "content") and ai_message.content:
                reasoning_content = extract_text_from_content(ai_message.content).strip()
                if reasoning_content:
                    # If we already streamed content deltas during astream_events, don't emit the full block again
                    # (would duplicate text in the UI).
                    if not bool(stream_result.get("streamed_reasoning_chunks")):
                        stage = "planner_tool_selection"
                        reasoning_chunk_dict = reasoning_dict_maker(stage=stage, tool_name="", tool_query="", content=reasoning_content)
                        if reasoning_container is not None:
                            # Persist the same reasoning content shown in UI so it is available in history.
                            reasoning_container["content"] += reasoning_chunk_dict["header"] + reasoning_chunk_dict["content"]
                        content_preview = str(reasoning_chunk_dict.get("content", ""))[:1500]
                        log.debug(f"ChatID: {chat_id} - LLM tool-selection content (final aggregated): {content_preview}")
                        yield reasoning_chunk_dict
        except Exception:
            pass

        # Add the AIMessage with tool_calls to conversation BEFORE processing tool calls
        messages.append(cast(BaseMessage, ai_message))

        # Process tool calls iteratively; persist steps via decorators
        # Add safety limit to prevent infinite loops
        MAX_TOOL_ITERATIONS = 15  # Lower than build mode (25) since ask mode is simpler
        iteration_count = 0

        while ai_message.tool_calls and iteration_count < MAX_TOOL_ITERATIONS:
            iteration_count += 1
            log.debug(f"ChatID: {chat_id} - Ask mode tool iteration {iteration_count}/{MAX_TOOL_ITERATIONS}")

            # Execute all tool calls
            tool_messages: List[ToolMessage] = []
            for tool_call in ai_message.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                tool_id = tool_call["id"]

                # Intercept clarification requests and short-circuit
                if tool_name == "ask_for_clarification":
                    log.debug(f"ChatID: {chat_id} - Clarification requested by LLM: {tool_args.get("reason", "No reason provided")}")
                    clarification_payload, result = await check_and_build_clarification(tools=tools, tool_name=tool_name, tool_args=tool_args)
                    formatted_text, current_step = await store_and_format_clarification(
                        query_id=query_id,
                        chat_id=chat_id,
                        db=db,
                        current_step=current_step,
                        tool_name=tool_name,
                        tool_args=tool_args,
                        result=result,
                        clarification_payload=clarification_payload,
                        enhanced_query_for_processing=enhanced_query_for_processing,
                        tools=tools,
                    )
                    # Yield with the same special prefix as build mode so chat.py
                    # detects it, persists the assistant message, and skips the
                    # empty-response fallback.
                    try:
                        stream_chunk = f"πspecial clarification blockπ: {json.dumps(clarification_payload, default=str)}\n"
                    except Exception:
                        stream_chunk = f"πspecial clarification blockπ: {formatted_text}\n"
                    yield stream_chunk
                    return

                elif tool_name == "write_todos":
                    # write_todos is intercepted here (before execute_tool_step) so the
                    # @persist_tool_execution_step decorator never fires for it.
                    # That decorator always INSERTs a new row; if it ran alongside
                    # _upsert_write_todos_flow_step we'd accumulate duplicate rows and
                    # the upsert would fail on the second call with "Multiple rows found".
                    _wt_func = next((t for t in tools if t.name == "write_todos"), None)
                    if _wt_func:
                        try:
                            user_friendly_tool_name = tool_name_shown_to_user(tool_name)
                            tool_query_str = format_tool_query_for_display(tool_name, tool_args, enhanced_query_for_processing)
                            reasoning_chunk_dict = reasoning_dict_maker(
                                stage="retrieval_tool_execution", tool_name=user_friendly_tool_name, tool_query=tool_query_str, content=""
                            )
                            if reasoning_container is not None:
                                reasoning_container["content"] += reasoning_chunk_dict["header"] + reasoning_chunk_dict["content"]
                            yield reasoning_chunk_dict

                            _wt_result = await _wt_func.ainvoke(tool_args)
                            log.debug(f"ChatID: {chat_id} - Tool write_todos result preview: {str(_wt_result)[:200]}")
                            log.debug(f"ChatID: {chat_id} - Tool write_todos completed successfully")

                            _tc = query_flow_store.get("todos_container") if isinstance(query_flow_store, dict) else None
                            if _tc and _tc.get("updated"):
                                _tc["updated"] = False
                                todos_list = _tc.get("todos", [])
                                if todos_list:
                                    display_todos = [
                                        {**t, "content": f"{TODO_STATUS_ICON.get(t.get('status', 'pending'), '○')} {t['content']}"}
                                        for t in todos_list
                                    ]
                                    yield {"chunk_type": "todos", "todos": display_todos}
                                    try:
                                        async with get_streaming_db_session() as _todos_db:
                                            await _upsert_write_todos_flow_step(
                                                message_id=query_id,
                                                chat_id=chat_id,
                                                todos=display_todos,
                                                db=_todos_db,
                                            )
                                    except Exception as _te:
                                        log.warning(f"ChatID: {chat_id} - Failed to persist todos flow step: {_te}")

                            responses.append(("write_todos", str(tool_args), _wt_result))
                            tool_messages.append(ToolMessage(content=str(_wt_result), tool_call_id=str(tool_id)))
                        except Exception as e:
                            log.error(f"ChatID: {chat_id} - Error executing tool write_todos: {str(e)}")
                            tool_messages.append(ToolMessage(content=f"Error executing write_todos: {str(e)}", tool_call_id=str(tool_id or "")))

                else:
                    # Find and execute the tool (decorator persists success/error)
                    tool_to_execute = next((t for t in tools if t.name == tool_name), None)
                    if tool_to_execute:
                        if tool_name == "web_search_tool":
                            original_query = enhanced_query_for_processing
                            tool_query = tool_args.get("query") if isinstance(tool_args, dict) else None
                            if tool_query and tool_query != original_query:
                                log.debug(f"ChatID: {chat_id} - Web search query rewritten. Original: '{original_query}' | Tool: '{tool_query}'")
                        log.debug(f"ChatID: {chat_id} - Executing tool: {tool_name} with args: {str(tool_args)[:100]}")
                        try:
                            # Yield tool execution status
                            user_friendly_tool_name = tool_name_shown_to_user(tool_name)
                            log.debug(f"ChatID: {chat_id} - Tool name: {tool_name} - User friendly tool name: {user_friendly_tool_name}")
                            # Format tool query for display (same as build mode)
                            tool_query_str = format_tool_query_for_display(tool_name, tool_args, enhanced_query_for_processing)
                            stage = "retrieval_tool_execution"
                            content = ""
                            reasoning_chunk_dict = reasoning_dict_maker(
                                stage=stage, tool_name=user_friendly_tool_name, tool_query=tool_query_str, content=content
                            )
                            if reasoning_container is not None:
                                reasoning_container["content"] += reasoning_chunk_dict["header"] + reasoning_chunk_dict["content"]
                            yield reasoning_chunk_dict

                            # Provide current step_order to downstream structured DB tool sub-steps
                            try:
                                if tool_name == "structured_db_tool" and isinstance(query_flow_store, dict):
                                    query_flow_store["step_order"] = current_step
                            except Exception:
                                pass

                            # Execute the tool with persistence
                            tool_result, current_step = await execute_tool_step(
                                tool_to_execute,
                                tool_name,
                                tool_args,
                                query_id=query_id,
                                chat_id=chat_id,
                                db=db,
                                current_step=current_step,
                                extract_facts_fn=extract_facts_from_tool_result,
                            )

                            # Log brief output for observability
                            result_preview = str(tool_result) if tool_result else "None"
                            log.debug(f"ChatID: {chat_id} - Tool {tool_name} result preview: {result_preview[:200]}")
                            log.debug(f"ChatID: {chat_id} - Tool {tool_name} completed successfully")

                            # Track the response
                            responses.append((tool_name, str(tool_args), tool_result))

                            # Create tool message for LLM
                            tool_message = ToolMessage(content=str(tool_result), tool_call_id=str(tool_id))
                            tool_messages.append(tool_message)

                            # Format tool result for display in reasoning block
                            if isinstance(tool_result, dict):
                                # Format as "message\n\nResult: {data}" so format_tool_message_for_display can clean it for users
                                # while the LLM gets the full structured data with UUIDs
                                message = tool_result.get("message", "")
                                # If there's a 'data' field, use it; otherwise omit the Result section (simpler format)
                                if "data" in tool_result and tool_result["data"]:
                                    tool_content = f"{message}\n\nResult: {json.dumps(tool_result['data'], ensure_ascii=False)}"
                                else:
                                    # No data field, just use the message
                                    tool_content = message
                            else:
                                tool_content = str(tool_result)

                            # Format and stream tool message content for user-friendly display (remove UUIDs, URLs, etc.)
                            # IMPORTANT: For structured DB queries, do not stream raw row/column output to the UI.
                            # The LLM still receives the full ToolMessage above to generate the final answer.
                            # if tool_name not in ["structured_db_tool"] + list(PLOTTING_TOOL_NAMES):
                            #     cleaned_content = format_tool_message_for_display(tool_content)
                            #     if cleaned_content and cleaned_content.strip():
                            #         stage = "retrieval_tool_execution_message"
                            #         content = f"{user_friendly_tool_name}'s result: {cleaned_content}\n\n"
                            #         reasoning_chunk_dict = reasoning_dict_maker(
                            #             stage=stage, tool_name=user_friendly_tool_name, tool_query=tool_query_str, content=content
                            #         )
                            #         if reasoning_container is not None:
                            #             reasoning_container["content"] += reasoning_chunk_dict["header"] + reasoning_chunk_dict["content"]
                            #         yield reasoning_chunk_dict

                        except Exception as e:
                            log.error(f"ChatID: {chat_id} - Error executing tool {tool_name}: {str(e)}")

                            # Yield error status
                            stage = "tool_error"
                            error_status_message = f"⚠️ Error executing {user_friendly_tool_name}\n\n"
                            reasoning_chunk_dict = reasoning_dict_maker(
                                stage=stage,
                                tool_name=user_friendly_tool_name,
                                tool_query=tool_query_str if "tool_query_str" in locals() else "",
                                content=error_status_message,
                            )
                            if reasoning_container is not None:
                                reasoning_container["content"] += reasoning_chunk_dict["header"] + reasoning_chunk_dict["content"]
                            yield reasoning_chunk_dict

                            # Error step already persisted by decorator; step updated

                            error_tool_message = ToolMessage(content=f"Error executing {tool_name}: {str(e)}", tool_call_id=str(tool_id or ""))
                            tool_messages.append(error_tool_message)
                    else:
                        log.error(f"ChatID: {chat_id} - Tool {tool_name} not found")
                        stage = "tool_unavailable"
                        reasoning_chunk_dict = reasoning_dict_maker(stage=stage, tool_name="", tool_query="", content="")
                        if reasoning_container is not None:
                            reasoning_container["content"] += reasoning_chunk_dict["header"] + reasoning_chunk_dict["content"]
                        yield reasoning_chunk_dict
                        error_tool_message = ToolMessage(content=f"Tool {tool_name} not found", tool_call_id=str(tool_id or ""))
                        tool_messages.append(error_tool_message)

            # Add tool messages to conversation
            messages.extend(tool_messages)

            # # Log the messages being sent to the LLM (includes tool results)
            # log.info(f"ChatID: {chat_id} - Ask mode LLM iteration - Messages count: {len(messages)}")
            # try:
            #     # Log last few messages for context (tool results + conversation)
            #     last_messages_preview = []
            #     for message_preview in messages[-3:]:  # Last 3 messages
            #         if hasattr(message_preview, "content"):
            #             content_preview = str(message_preview.content)[:200] + "..." if
            #                   len(str(message_preview.content)) > 200 else str(message_preview.content)
            #             last_messages_preview.append(f"{message_preview.__class__.__name__}: {content_preview}")
            #     log.info(f"ChatID: {chat_id} - Ask mode LLM iteration - Recent messages:\n" + "\n".join(last_messages_preview))
            # except Exception:
            #     pass

            # Yield status before getting next LLM response
            stage = "ask_mode_analyzing_results"
            reasoning_chunk_dict = reasoning_dict_maker(stage=stage, tool_name="", tool_query="", content="")
            if reasoning_container is not None:
                reasoning_container["content"] += reasoning_chunk_dict["header"] + reasoning_chunk_dict["content"]
            yield reasoning_chunk_dict

            # Get next response from LLM (persist follow-up selection/reasoning)
            try:
                stream_result_followup: Dict[str, Any] = {}

                async for tick in _orchestrate_llm_step_with_ui_ticks(
                    include_context=False,
                    result_holder=stream_result_followup,
                    stream_final_answer=True,
                ):
                    yield tick
                ai_message = stream_result_followup.get("ai_message")
                current_step = int(stream_result_followup.get("current_step", current_step))
            except Exception:
                ai_message, current_step = await orchestrate_llm_step(
                    llm_with_tools,
                    messages,
                    query_id=query_id,
                    chat_id=chat_id,
                    db=db,
                    current_step=current_step,
                    include_context=False,
                    enhanced_conversation_history=None,
                    enhanced_query_for_processing=None,
                    tools=tools,
                )
            if ai_message is None:
                ai_message, current_step = await orchestrate_llm_step(
                    llm_with_tools,
                    messages,
                    query_id=query_id,
                    chat_id=chat_id,
                    db=db,
                    current_step=current_step,
                    include_context=False,
                    enhanced_conversation_history=None,
                    enhanced_query_for_processing=None,
                    tools=tools,
                )
            # Handle failure case
            if ai_message == "TOOL_ORCHESTRATION_FAILURE":
                stage = "final_response"
                reasoning_chunk_dict = reasoning_dict_maker(stage=stage, tool_name="", tool_query="", content="")
                if reasoning_container is not None:
                    reasoning_container["content"] += reasoning_chunk_dict["header"] + reasoning_chunk_dict["content"]
                yield reasoning_chunk_dict
                yield "An unexpected error occurred. Please try again later."
                return

            # Stream LLM's reasoning content after tool execution (internal thinking)
            # Only stream as reasoning if there are more tool calls coming (not the final response)
            has_more_tool_calls = bool(getattr(ai_message, "tool_calls", None))
            if has_more_tool_calls:
                try:
                    # Only emit reasoning if it wasn't already streamed during _orchestrate_llm_step_with_ui_ticks
                    already_streamed = bool(stream_result_followup.get("streamed_reasoning_chunks"))
                    if not already_streamed and hasattr(ai_message, "content") and ai_message.content:
                        reasoning_content = extract_text_from_content(ai_message.content).strip()
                        # Strip content after delimiter (keep only reasoning part)
                        ANSWER_DELIMITER = "ππANSWERππ"
                        if ANSWER_DELIMITER in reasoning_content:
                            reasoning_content = reasoning_content.split(ANSWER_DELIMITER, 1)[0].strip()
                        if reasoning_content:
                            stage = "planner_tool_selection"
                            reasoning_chunk_dict = reasoning_dict_maker(stage=stage, tool_name="", tool_query="", content=reasoning_content)
                            if reasoning_container is not None:
                                reasoning_container["content"] += reasoning_chunk_dict["header"] + reasoning_chunk_dict["content"]
                            yield reasoning_chunk_dict
                except Exception:
                    pass

            messages.append(cast(BaseMessage, ai_message))

            # Follow-up selection persisted by decorator above

        # Check if we exited due to max iterations
        if iteration_count >= MAX_TOOL_ITERATIONS and ai_message.tool_calls:
            log.warning(
                f"ChatID: {chat_id} - Ask mode reached max tool iterations ({MAX_TOOL_ITERATIONS}) "
                f"with pending tool calls. Proceeding with partial results."
            )
            # Emit final response stage to close reasoning panel
            stage = "final_response"
            reasoning_chunk_dict = reasoning_dict_maker(stage=stage, tool_name="", tool_query="", content="")
            if reasoning_container is not None:
                reasoning_container["content"] += reasoning_chunk_dict["header"] + reasoning_chunk_dict["content"]
            yield reasoning_chunk_dict

            # Inform user about partial results
            yield "I've gathered information from multiple sources but reached the query complexity limit. Here's what I found:\n\n"

            # Try to extract any partial content from the last message
            if ai_message.content:
                final_content = extract_text_from_content(ai_message.content)
                ANSWER_DELIMITER = "ππANSWERππ"
                if ANSWER_DELIMITER in final_content:
                    parts = final_content.split(ANSWER_DELIMITER, 1)
                    answer_part = parts[-1].strip()
                    if answer_part:
                        final_content = answer_part
                    else:
                        final_content = parts[0].strip()
                if final_content:
                    async for chunk in stream_content_in_chunks(final_content):
                        yield chunk
                else:
                    yield "Please try refining your question or breaking it into smaller parts."
            else:
                yield "Please try refining your question or breaking it into smaller parts."
            return

        # Final response from LLM (no more tool calls)
        log.info(f"ChatID: {chat_id} - Tool orchestration complete, generating final response")

        # Yield final response generation status (unless we already emitted it when starting token streaming).
        # NOTE: `chat.py` uses stage=="final_response" to start collecting the final streamed answer
        # for persistence (and title generation). Even if we've stopped emitting reasoning for UI,
        # we must emit a final_response marker dict.
        if not final_response_marker_emitted:
            stage = "final_response"
            reasoning_chunk_dict = reasoning_dict_maker(stage=stage, tool_name="", tool_query="", content="")
            if reasoning_container is not None:
                reasoning_container["content"] += reasoning_chunk_dict["header"] + reasoning_chunk_dict["content"]
            yield reasoning_chunk_dict

        # Stream the final answer back to caller
        if final_answer_streamed:
            # Already streamed token-by-token from the LLM call above.
            return
        if ai_message.content:
            final_content = extract_text_from_content(ai_message.content)
            # Strip content before delimiter (keep only answer part)
            ANSWER_DELIMITER = "ππANSWERππ"
            if ANSWER_DELIMITER in final_content:
                parts = final_content.split(ANSWER_DELIMITER, 1)
                answer_part = parts[-1].strip()
                if answer_part:
                    final_content = answer_part
                else:
                    final_content = parts[0].strip()
            log.debug(f"ChatID: {chat_id} - Final response length: {len(final_content)} chars")
            # Stream the final answer in chunks to simulate streaming
            # Note: plane-attachment:// placeholders are replaced with presigned URLs in chat.py
            # before yielding to the client, while the original placeholders are stored in DB
            async for chunk in stream_content_in_chunks(final_content):
                yield chunk
        else:
            log.warning(f"ChatID: {chat_id} - LLM provided no final content")
            yield "I've gathered the information but couldn't generate a response. Please try again."

    except Exception as e:
        log.error(f"ChatID: {chat_id} - Error in execute_tools_for_ask_mode: {str(e)}")
        raise e
