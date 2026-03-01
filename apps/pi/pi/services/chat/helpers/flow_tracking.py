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

"""Decorators for automatic flow step tracking and token management."""

import asyncio
import functools
import json
import uuid
from typing import Any
from typing import Callable
from typing import Dict
from typing import List
from typing import Optional

from pi import logger
from pi.app.models.enums import ExecutionStatus
from pi.app.models.enums import FlowStepType
from pi.app.models.enums import MessageMetaStepType
from pi.core.db.plane_pi.lifecycle import get_streaming_db_session
from pi.services.chat.utils import standardize_flow_step_content
from pi.services.retrievers.pg_store.message import upsert_message_flow_steps

log = logger.getChild(__name__)


def track_token_usage(step_type: MessageMetaStepType):
    """
    Decorator to automatically set up token tracking context for LLM calls.

    Usage:
        @track_token_usage(MessageMetaStepType.TOOL_ORCHESTRATION)
        async def my_llm_function(self, llm_with_tools, messages, query_id, db, chat_id):
            # Token tracking is automatically configured
            return await llm_with_tools.ainvoke(messages)
    """

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract self, query_id, db, chat_id from args/kwargs
            # Assuming standard signature: (self, llm, messages, query_id, db, chat_id, ...)
            args[0] if args else None
            llm = args[1] if len(args) > 1 else kwargs.get("llm")
            query_id = kwargs.get("query_id") or (args[3] if len(args) > 3 else None)
            db = kwargs.get("db") or (args[4] if len(args) > 4 else None)
            chat_id = kwargs.get("chat_id") or (args[5] if len(args) > 5 else None)

            # Set tracking context if llm supports it
            if llm and hasattr(llm, "set_tracking_context"):
                llm.set_tracking_context(query_id, db, step_type, chat_id=str(chat_id) if chat_id else None)

            return await func(*args, **kwargs)

        return wrapper

    return decorator


def auto_persist_flow_steps(
    step_type: FlowStepType,
    tool_name: Optional[str] = None,
    extract_content: Optional[Callable] = None,
    extract_execution_data: Optional[Callable] = None,
    timeout: float = 2.0,
    on_error: str = "log",  # "log", "raise", or "ignore"
):
    """
    Decorator to automatically persist flow steps after function execution.

    Args:
        step_type: The type of flow step (TOOL, ROUTING, etc.)
        tool_name: Static tool name, or None to extract from result
        extract_content: Optional function to extract content from result
        extract_execution_data: Optional function to extract execution_data from result
        timeout: Timeout for persistence operation
        on_error: How to handle persistence errors ("log", "raise", "ignore")

    Usage:
        @auto_persist_flow_steps(
            step_type=FlowStepType.TOOL,
            extract_content=lambda result: result.get('formatted_output'),
            extract_execution_data=lambda result: result.get('metadata')
        )
        async def execute_tool(self, tool, query, query_id, chat_id, step_order, db):
            # Your tool execution logic
            return {"formatted_output": "...", "metadata": {...}}
    """

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Execute the original function
            result = await func(*args, **kwargs)

            # Extract required parameters from args/kwargs
            # Assuming: (self, ..., query_id, chat_id, step_order, db, ...)
            query_id = kwargs.get("query_id")
            chat_id = kwargs.get("chat_id")
            step_order = kwargs.get("step_order", 1)
            db = kwargs.get("db")

            if not all([query_id, chat_id, db]):
                if on_error == "raise":
                    raise ValueError("Missing required parameters for flow step persistence")
                if on_error == "log":
                    log.warning("Skipping flow step persistence: missing query_id, chat_id, or db")
                return result

            # Extract content and execution_data
            content = extract_content(result) if extract_content else str(result)
            execution_data = extract_execution_data(result) if extract_execution_data else {}

            # Determine tool_name (static or from result)
            actual_tool_name = tool_name
            if not actual_tool_name and isinstance(result, dict):
                actual_tool_name = result.get("tool_name")

            # Build flow step
            flow_step = {
                "step_order": step_order,
                "step_type": step_type.value,
                "tool_name": actual_tool_name,
                "content": standardize_flow_step_content(content, step_type),
                "execution_data": execution_data,
            }

            # Persist asynchronously with timeout
            try:
                # Ensure query_id and chat_id are UUIDs
                if not query_id or not chat_id:
                    if on_error == "raise":
                        raise ValueError("Missing required parameters for flow step persistence")
                    if on_error == "log":
                        log.warning("Skipping flow step persistence: missing query_id or chat_id")
                    return result

                query_id_uuid = query_id if isinstance(query_id, uuid.UUID) else uuid.UUID(str(query_id))
                chat_id_uuid = chat_id if isinstance(chat_id, uuid.UUID) else uuid.UUID(str(chat_id))

                async with get_streaming_db_session() as _db:
                    await asyncio.wait_for(
                        upsert_message_flow_steps(
                            message_id=query_id_uuid,
                            chat_id=chat_id_uuid,
                            flow_steps=[flow_step],
                            db=_db,
                        ),
                        timeout=timeout,
                    )
            except asyncio.TimeoutError:
                if on_error == "log":
                    log.warning(f"Flow step persistence timed out for {func.__name__}")
                elif on_error == "raise":
                    raise
            except Exception as e:
                if on_error == "log":
                    log.warning(f"Flow step persistence failed for {func.__name__}: {e}")
                elif on_error == "raise":
                    raise

            return result

        return wrapper

    return decorator


class FlowStepCollector:
    """
    Context manager for collecting flow steps during execution and persisting them in bulk.

    Usage:
        async with FlowStepCollector(query_id, chat_id, db) as collector:
            collector.add_step(
                step_order=1,
                step_type=FlowStepType.TOOL,
                tool_name="structured_db_tool",
                content="...",
                execution_data={...}
            )
            # Steps are automatically persisted on exit
    """

    def __init__(self, query_id: uuid.UUID, chat_id: str, db: Any, timeout: float = 2.0, on_error: str = "log"):
        self.query_id = query_id
        self.chat_id = chat_id
        self.db = db
        self.timeout = timeout
        self.on_error = on_error
        self.steps: List[Dict[str, Any]] = []

    def add_step(
        self,
        step_order: int,
        step_type: FlowStepType,
        tool_name: Optional[str] = None,
        content: Any = None,
        execution_data: Optional[Dict[str, Any]] = None,
        **kwargs,
    ):
        """Add a flow step to the collection."""
        step = {
            "step_order": step_order,
            "step_type": step_type.value if isinstance(step_type, FlowStepType) else step_type,
            "tool_name": tool_name,
            "content": standardize_flow_step_content(content, step_type) if content else "",
            "execution_data": execution_data or {},
            **kwargs,
        }
        self.steps.append(step)

    async def __aenter__(self):
        """Enter the context manager."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Exit and persist all collected steps."""
        if not self.steps:
            return

        try:
            # Convert chat_id to UUID (it's typed as str)
            chat_id_uuid = uuid.UUID(self.chat_id)

            async with get_streaming_db_session() as _db:
                await asyncio.wait_for(
                    upsert_message_flow_steps(
                        message_id=self.query_id,
                        chat_id=chat_id_uuid,
                        flow_steps=self.steps,
                        db=_db,
                    ),
                    timeout=self.timeout,
                )
        except asyncio.TimeoutError:
            if self.on_error == "log":
                log.warning(f"Flow step collection persistence timed out ({len(self.steps)} steps)")
            elif self.on_error == "raise":
                raise
        except Exception as e:
            if self.on_error == "log":
                log.warning(f"Flow step collection persistence failed: {e}")
            elif self.on_error == "raise":
                raise


def persist_tool_selection_steps(func: Callable) -> Callable:
    """
    Decorator to persist tool selection and optional LLM reasoning steps around an LLM call.

    The wrapped function must be async and accept keyword-only args:
      - query_id, chat_id, db, current_step, include_context (bool),
        enhanced_conversation_history (str|None), enhanced_query_for_processing (str|None), tools (list|None)

    It must return an AIMessage (or compatible) which may include tool_calls and content.

    Returns: (ai_message, new_current_step)
    """

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        query_id = kwargs.get("query_id")
        chat_id = kwargs.get("chat_id")
        db = kwargs.get("db")
        current_step = kwargs.get("current_step", 1)
        include_context = bool(kwargs.get("include_context", False))
        enhanced_conversation_history = kwargs.get("enhanced_conversation_history")
        enhanced_query_for_processing = kwargs.get("enhanced_query_for_processing")
        tools = kwargs.get("tools") or []

        ai_message = await func(*args, **kwargs)
        steps: List[Dict[str, Any]] = []

        try:
            # Optionally store orchestration context
            if (
                include_context
                and enhanced_conversation_history
                and isinstance(enhanced_conversation_history, str)
                and enhanced_conversation_history.strip()
            ):
                steps.append({
                    "step_order": current_step,
                    "step_type": FlowStepType.TOOL.value,
                    "tool_name": "tool_orchestration_context",
                    "content": "Context used for tool orchestration",
                    "execution_data": {"enhanced_conversation_history": enhanced_conversation_history},
                    "is_planned": False,
                    "is_executed": False,
                })
                current_step += 1

            # Persist tool selection
            tool_calls = getattr(ai_message, "tool_calls", None)
            if tool_calls:
                selected_tool_calls = [{"name": tc.get("name"), "args": tc.get("args", {}), "id": tc.get("id", "")} for tc in tool_calls]
                steps.append({
                    "step_order": current_step,
                    "step_type": FlowStepType.TOOL.value,
                    "tool_name": "tool_selection",
                    "content": standardize_flow_step_content({"selected_tools": selected_tool_calls}, FlowStepType.TOOL),
                    "execution_data": {
                        "selected_tools": selected_tool_calls,
                        "available_tools": [getattr(t, "name", "") for t in tools],
                        "query": enhanced_query_for_processing,
                    },
                    "is_planned": False,
                    "is_executed": False,
                })
                current_step += 1

            # Persist LLM reasoning content if present
            reasoning_text = str(getattr(ai_message, "content", "") or "").strip()
            if reasoning_text:
                steps.append({
                    "step_order": current_step,
                    "step_type": FlowStepType.TOOL.value,
                    "tool_name": "llm_reasoning",
                    "content": reasoning_text,
                    "execution_data": {"reasoning": reasoning_text},
                    "is_planned": False,
                    "is_executed": False,
                })
                current_step += 1

            if steps and query_id and chat_id and db:
                async with get_streaming_db_session() as _db:
                    await upsert_message_flow_steps(
                        message_id=query_id,
                        chat_id=chat_id,
                        flow_steps=steps,
                        db=_db,
                    )
        except Exception as e:
            log.warning(f"Failed to persist tool selection/llm steps: {e}")

        return ai_message, current_step

    return wrapper


@persist_tool_selection_steps
async def persist_precomputed_ai_message(*, ai_message: Any, **_kwargs: Any) -> Any:
    """
    Persist tool selection + optional reasoning steps for a message that was already produced elsewhere.

    Useful when the AIMessage is obtained via streaming (`astream`/`astream_events`) but we still want to
    reuse the existing persistence logic in `persist_tool_selection_steps`.
    """
    return ai_message


def persist_tool_execution_step(func: Callable) -> Callable:
    """
    Decorator to persist a tool execution step (success or error).

    The wrapped function must be async and accept keyword-only args:
      - query_id, chat_id, db, current_step, extract_facts_fn (callable|None)

    It must return the tool_result. The decorator will persist the step and return (tool_result, new_current_step).
    """

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        query_id = kwargs.get("query_id")
        chat_id = kwargs.get("chat_id")
        db = kwargs.get("db")
        current_step = kwargs.get("current_step", 1)
        extract_facts_fn = kwargs.get("extract_facts_fn")

        # Expect first two positional args to include tool_name and tool_args via signature
        # Safer: rely on kwargs provided by caller for tool_name/tool_args
        tool_name = kwargs.get("tool_name") or (args[1] if len(args) > 1 else "")
        tool_args = kwargs.get("tool_args") or (args[2] if len(args) > 2 else {})

        try:
            result = await func(*args, **kwargs)

            facts: Dict[str, Any] = {}
            if callable(extract_facts_fn):
                try:
                    facts = extract_facts_fn(tool_name, result) or {}
                except Exception:
                    facts = {}

            # Normalize execution result for persistence (used by chat history reconstruction)
            # Prefer structured JSON when possible, otherwise fall back to string
            execution_result: str = ""
            structured_result: Dict[str, Any] | List[Any] | None = None
            try:
                if isinstance(result, (dict, list)):
                    structured_result = result
                    # Keep a string copy to assist display formatters that expect strings
                    import json as _json

                    execution_result = _json.dumps(result, default=str)
                else:
                    execution_result = str(result)
            except Exception:
                execution_result = str(result)
                structured_result = None

            execution_data: Dict[str, Any] = {
                "tool_args": tool_args,
                "tool_name": tool_name,
                "execution_status": "success",
            }
            if facts:
                execution_data["facts"] = facts
            # Persist result in execution_data so retrieval can reconstruct external reasoning
            if execution_result:
                execution_data["execution_result"] = execution_result
            if structured_result is not None:
                execution_data["structured_result"] = structured_result

            step = {
                "step_order": current_step,
                "step_type": FlowStepType.TOOL.value,
                "tool_name": tool_name,
                "content": standardize_flow_step_content(execution_data, FlowStepType.TOOL),
                "execution_data": execution_data,
                "is_planned": False,
                "is_executed": True,
                # execution_success is persisted via upsert_message_flow_steps when provided.
                # We set it to SUCCESS explicitly to avoid PENDING default on retrieval.
                "execution_success": ExecutionStatus.SUCCESS.value,
            }

            if query_id and chat_id and db:
                async with get_streaming_db_session() as _db:
                    await upsert_message_flow_steps(
                        message_id=query_id,
                        chat_id=chat_id,
                        flow_steps=[step],
                        db=_db,
                    )
            return result, current_step + 1
        except Exception as e:
            # Persist error step
            error_step = {
                "step_order": current_step,
                "step_type": FlowStepType.TOOL.value,
                "tool_name": tool_name,
                "content": standardize_flow_step_content(
                    {
                        "tool_args": tool_args,
                        "execution_status": "error",
                        "execution_error": str(e),
                    },
                    FlowStepType.TOOL,
                ),
                "execution_data": {
                    "tool_args": tool_args,
                    "execution_status": "error",
                    "execution_error": str(e),
                },
                "is_planned": False,
                "is_executed": True,
                "execution_status": ExecutionStatus.FAILED.value,
            }
            try:
                if query_id and chat_id and db:
                    async with get_streaming_db_session() as _db:
                        await upsert_message_flow_steps(
                            message_id=query_id,
                            chat_id=chat_id,
                            flow_steps=[error_step],
                            db=_db,
                        )
            except Exception as pe:
                log.warning(f"Failed to persist error step: {pe}")
            raise

    return wrapper


# ------------------------------
# Pre-decorated helper functions
# ------------------------------


async def _collect_ai_message_from_astream(llm_with_tools: Any, messages: Any) -> Any:
    """
    Consume `llm_with_tools.astream(messages)` and return a final AIMessage-like object.

    Why: tool calls arrive incrementally in streaming (chunks). We must accumulate chunks
    into a complete message so callers can reliably read `.tool_calls` and `.content`.
    """
    accumulated: Any = None
    async for chunk in llm_with_tools.astream(messages):
        if accumulated is None:
            accumulated = chunk
            continue
        try:
            accumulated = accumulated + chunk
        except Exception:
            # Best-effort fallback: keep the latest chunk.
            accumulated = chunk

    if accumulated is None:
        return None

    # LangChain message chunks typically expose `to_message()` to convert to AIMessage.
    if hasattr(accumulated, "to_message") and callable(accumulated.to_message):
        try:
            return accumulated.to_message()
        except Exception:
            return accumulated

    return accumulated


async def orchestrate_llm_step_with_streaming(llm_with_tools, messages, **kwargs):
    """Invoke LLM with tools and persist selection/reasoning using decorator."""
    query_id = kwargs.get("query_id")
    chat_id = kwargs.get("chat_id")
    db = kwargs.get("db")
    current_step = kwargs.get("current_step", 1)
    include_context = bool(kwargs.get("include_context", False))
    enhanced_conversation_history = kwargs.get("enhanced_conversation_history")
    enhanced_query_for_processing = kwargs.get("enhanced_query_for_processing")
    tools = kwargs.get("tools") or []

    # Re-sync current_step with DB to avoid collisions with independently persisted steps
    try:
        if query_id and chat_id and db:
            async with get_streaming_db_session() as _db:
                from sqlalchemy import func  # type: ignore
                from sqlalchemy import select  # type: ignore

                from pi.app.models import MessageFlowStep  # lazy import to avoid cycles

                stmt: Any = select(func.max(MessageFlowStep.step_order)).where(  # type: ignore[arg-type]
                    MessageFlowStep.message_id == query_id
                )
                result = await _db.execute(stmt)
                max_step = result.scalar_one_or_none()
                next_step = (max_step or 0) + 1
                if current_step < next_step:
                    current_step = next_step
    except Exception:
        # best-effort; proceed with provided current_step on error
        pass

    # Execute LLM call
    ai_message = await _collect_ai_message_from_astream(llm_with_tools, messages)
    steps: List[Dict[str, Any]] = []

    try:
        # Optionally store orchestration context
        if (
            include_context
            and enhanced_conversation_history
            and isinstance(enhanced_conversation_history, str)
            and enhanced_conversation_history.strip()
        ):
            steps.append({
                "step_order": current_step,
                "step_type": FlowStepType.TOOL.value,
                "tool_name": "tool_orchestration_context",
                "content": "Context used for tool orchestration",
                "execution_data": {"enhanced_conversation_history": enhanced_conversation_history},
                "is_planned": False,
                "is_executed": False,
            })
            current_step += 1
            log.info("orchestrate_llm_step: Added tool_orchestration_context step")

        # Persist tool selection
        tool_calls = getattr(ai_message, "tool_calls", None)
        if tool_calls:
            selected_tool_calls = [{"name": tc.get("name"), "args": tc.get("args", {}), "id": tc.get("id", "")} for tc in tool_calls]
            steps.append({
                "step_order": current_step,
                "step_type": FlowStepType.TOOL.value,
                "tool_name": "tool_selection",
                "content": standardize_flow_step_content({"selected_tools": selected_tool_calls}, FlowStepType.TOOL),
                "execution_data": {
                    "selected_tools": selected_tool_calls,
                    "available_tools": [getattr(t, "name", "") for t in tools],
                    "query": enhanced_query_for_processing,
                },
                "is_planned": False,
                "is_executed": False,
            })
            current_step += 1
            log.info(f"orchestrate_llm_step: Added tool_selection step with {len(tool_calls)} tools")

        # Persist LLM reasoning content if present
        reasoning_text = str(getattr(ai_message, "content", "") or "").strip()
        if reasoning_text:
            steps.append({
                "step_order": current_step,
                "step_type": FlowStepType.TOOL.value,
                "tool_name": "llm_reasoning",
                "content": reasoning_text,
                "execution_data": {"reasoning": reasoning_text},
                "is_planned": False,
                "is_executed": False,
            })
            current_step += 1
            log.info(f"orchestrate_llm_step: Added llm_reasoning step (content length: {len(reasoning_text)})")

        log.info(f"orchestrate_llm_step: Total steps to persist: {len(steps)}, query_id={query_id}, chat_id={chat_id}, db={db is not None}")
        if steps and query_id and chat_id and db:
            log.info(f"orchestrate_llm_step: Persisting {len(steps)} steps...")
            async with get_streaming_db_session() as _db:
                result = await upsert_message_flow_steps(
                    message_id=query_id,
                    chat_id=chat_id,
                    flow_steps=steps,
                    db=_db,
                )
                log.info(f"orchestrate_llm_step: Persistence result: {result.get("message") if isinstance(result, dict) else result}")
        else:
            log.warning(
                f"orchestrate_llm_step: Skipping persistence - steps={len(steps)}, has_query_id={query_id is not None}, has_chat_id={chat_id is not None}, has_db={db is not None}"  # noqa: E501
            )
    except Exception as e:
        log.warning(f"Failed to persist tool selection/llm steps: {e}", exc_info=True)

    return ai_message, current_step


async def orchestrate_llm_step(llm_with_tools, messages, **kwargs):
    """Invoke LLM with tools and persist selection/reasoning using decorator."""
    query_id = kwargs.get("query_id")
    chat_id = kwargs.get("chat_id")
    db = kwargs.get("db")
    current_step = kwargs.get("current_step", 1)
    include_context = bool(kwargs.get("include_context", False))
    enhanced_conversation_history = kwargs.get("enhanced_conversation_history")
    enhanced_query_for_processing = kwargs.get("enhanced_query_for_processing")
    tools = kwargs.get("tools") or []

    # Re-sync current_step with DB to avoid collisions with independently persisted steps
    try:
        if query_id and chat_id and db:
            async with get_streaming_db_session() as _db:
                from sqlalchemy import func  # type: ignore
                from sqlalchemy import select  # type: ignore

                from pi.app.models import MessageFlowStep  # lazy import to avoid cycles

                stmt: Any = select(func.max(MessageFlowStep.step_order)).where(  # type: ignore[arg-type]
                    MessageFlowStep.message_id == query_id
                )
                result = await _db.execute(stmt)
                max_step = result.scalar_one_or_none()
                next_step = (max_step or 0) + 1
                if current_step < next_step:
                    current_step = next_step
    except Exception:
        # best-effort; proceed with provided current_step on error
        pass

    # Execute LLM call
    ai_message = await llm_with_tools.ainvoke(messages)
    steps: List[Dict[str, Any]] = []

    try:
        # Optionally store orchestration context
        if (
            include_context
            and enhanced_conversation_history
            and isinstance(enhanced_conversation_history, str)
            and enhanced_conversation_history.strip()
        ):
            steps.append({
                "step_order": current_step,
                "step_type": FlowStepType.TOOL.value,
                "tool_name": "tool_orchestration_context",
                "content": "Context used for tool orchestration",
                "execution_data": {"enhanced_conversation_history": enhanced_conversation_history},
                "is_planned": False,
                "is_executed": False,
            })
            current_step += 1
            log.info("orchestrate_llm_step: Added tool_orchestration_context step")

        # Persist tool selection
        tool_calls = getattr(ai_message, "tool_calls", None)
        if tool_calls:
            selected_tool_calls = [{"name": tc.get("name"), "args": tc.get("args", {}), "id": tc.get("id", "")} for tc in tool_calls]
            steps.append({
                "step_order": current_step,
                "step_type": FlowStepType.TOOL.value,
                "tool_name": "tool_selection",
                "content": standardize_flow_step_content({"selected_tools": selected_tool_calls}, FlowStepType.TOOL),
                "execution_data": {
                    "selected_tools": selected_tool_calls,
                    "available_tools": [getattr(t, "name", "") for t in tools],
                    "query": enhanced_query_for_processing,
                },
                "is_planned": False,
                "is_executed": False,
            })
            current_step += 1
            log.info(f"orchestrate_llm_step: Added tool_selection step with {len(tool_calls)} tools")

        # Persist LLM reasoning content if present
        reasoning_text = str(getattr(ai_message, "content", "") or "").strip()
        if reasoning_text:
            steps.append({
                "step_order": current_step,
                "step_type": FlowStepType.TOOL.value,
                "tool_name": "llm_reasoning",
                "content": reasoning_text,
                "execution_data": {"reasoning": reasoning_text},
                "is_planned": False,
                "is_executed": False,
            })
            current_step += 1
            log.info(f"orchestrate_llm_step: Added llm_reasoning step (content length: {len(reasoning_text)})")

        log.info(f"orchestrate_llm_step: Total steps to persist: {len(steps)}, query_id={query_id}, chat_id={chat_id}, db={db is not None}")
        if steps and query_id and chat_id and db:
            log.info(f"orchestrate_llm_step: Persisting {len(steps)} steps...")
            async with get_streaming_db_session() as _db:
                result = await upsert_message_flow_steps(
                    message_id=query_id,
                    chat_id=chat_id,
                    flow_steps=steps,
                    db=_db,
                )
                log.info(f"orchestrate_llm_step: Persistence result: {result.get("message") if isinstance(result, dict) else result}")
        else:
            log.warning(
                f"orchestrate_llm_step: Skipping persistence - steps={len(steps)}, has_query_id={query_id is not None}, has_chat_id={chat_id is not None}, has_db={db is not None}"  # noqa: E501
            )
    except Exception as e:
        log.warning(f"Failed to persist tool selection/llm steps: {e}", exc_info=True)

    return ai_message, current_step


@persist_tool_execution_step
async def execute_tool_step(tool_to_execute, tool_name: str, tool_args: Dict[str, Any], **kwargs):
    """Execute a single tool and persist success/error using decorator."""
    return await tool_to_execute.ainvoke(tool_args)


async def check_and_build_clarification(*, tools: List[Any], tool_name: str, tool_args: Dict[str, Any]) -> tuple[Dict[str, Any], Any]:
    """Execute ask_for_clarification tool and return (payload, raw_result)."""
    # Find tool
    tool_to_execute = next((t for t in tools if getattr(t, "name", None) == tool_name), None)
    try:
        result = await tool_to_execute.ainvoke(tool_args) if tool_to_execute else "{}"
    except Exception:
        result = "{}"

    # Parse payload
    payload: Dict[str, Any] = {}
    try:
        parsed = json.loads(result) if isinstance(result, str) else result
        if isinstance(parsed, dict):
            payload = parsed
        else:
            payload = {"raw_result": str(result)}
    except Exception:
        payload = {"reason": tool_args.get("reason", ""), "raw_result": str(result)}

    return payload, result


async def store_and_format_clarification(
    *,
    query_id: uuid.UUID,
    chat_id: str,
    db: Any,
    current_step: int,
    tool_name: str,
    tool_args: Dict[str, Any],
    result: Any,
    clarification_payload: Dict[str, Any],
    enhanced_query_for_processing: str | None,
    tools: List[Any],
) -> tuple[str, int]:
    """Persist flow step + message clarification row and return formatted text with next step."""
    # Persist flow step (pending)
    next_step = await record_clarification_step(
        query_id=query_id,
        chat_id=chat_id,
        db=db,
        current_step=current_step,
        tool_name=tool_name,
        tool_args=tool_args,
        result=result,
    )

    # Persist clarification record for deterministic follow-up handling
    try:
        from pi.services.retrievers.pg_store.clarifications import create_clarification

        clar_kind = "retrieval"
        bound_names = [getattr(t, "name", "") for t in tools] if tools else []
        categories: list[str] = []

        # Ensure original_query is not None
        original_query = enhanced_query_for_processing or ""

        await create_clarification(
            db=db,
            chat_id=uuid.UUID(str(chat_id)),
            message_id=uuid.UUID(str(query_id)),
            kind=clar_kind,
            original_query=original_query,
            payload=clarification_payload or {},
            categories=categories,
            method_tool_names=[],
            bound_tool_names=bound_names,
        )
    except Exception:
        # Non-fatal
        pass

    # Format clarification text
    try:
        from .tool_utils import format_clarification_as_text

        formatted_text = format_clarification_as_text(clarification_payload)
    except Exception:
        formatted_text = json.dumps(clarification_payload, default=str)

    return formatted_text, next_step


async def record_clarification_step(
    *,
    query_id: uuid.UUID,
    chat_id: str,
    db: Any,
    current_step: int,
    tool_name: str,
    tool_args: Dict[str, Any],
    result: Any,
) -> int:
    """Persist a clarification flow step as pending and return the next step index."""
    try:
        step = {
            "step_order": current_step,
            "step_type": FlowStepType.TOOL.value,
            "tool_name": tool_name,
            "content": standardize_flow_step_content(
                {
                    "tool_args": tool_args,
                    "clarification_result": result,
                },
                FlowStepType.TOOL,
            ),
            "execution_data": {
                "tool_args": tool_args,
                "clarification_result": result,
            },
            "is_planned": False,
            "is_executed": False,
            "execution_success": ExecutionStatus.PENDING,
        }
        # Convert chat_id to UUID (it's typed as str)
        chat_id_uuid = uuid.UUID(chat_id)

        async with get_streaming_db_session() as _db:
            await upsert_message_flow_steps(
                message_id=query_id,
                chat_id=chat_id_uuid,
                flow_steps=[step],
                db=_db,
            )
        return current_step + 1
    except Exception as e:
        log.warning(f"Failed to persist clarification step: {e}")
        return current_step


# ------------------------------
# Build-mode planning helpers
# ------------------------------


def build_planned_action_step(
    *,
    step_order: int,
    tool_name: str,
    action_summary: Dict[str, Any],
    execution_data: Dict[str, Any],
) -> Dict[str, Any]:
    """Build a standardized planned action flow step dict (not persisted)."""
    return {
        "step_order": step_order,
        "step_type": FlowStepType.TOOL,
        "tool_name": tool_name,
        "content": standardize_flow_step_content(action_summary, FlowStepType.TOOL),
        "execution_data": execution_data,
        "is_executed": False,
        "is_planned": True,
        "execution_success": ExecutionStatus.PENDING,
    }


async def persist_planned_action_step(
    *,
    query_id: uuid.UUID,
    chat_id: str,
    db: Any,
    step_order: int,
    tool_name: str,
    action_summary: Dict[str, Any],
    execution_data: Dict[str, Any],
    timeout: float = 2.0,
) -> Dict[str, Any]:
    """Build and persist a single planned action flow step; return the step dict.

    This is useful when you want immediate durability for a planned action rather than
    deferring to a batched collector.
    """
    step = build_planned_action_step(
        step_order=step_order,
        tool_name=tool_name,
        action_summary=action_summary,
        execution_data=execution_data,
    )

    try:
        chat_id_uuid = uuid.UUID(str(chat_id))
        async with get_streaming_db_session() as _db:
            await asyncio.wait_for(
                upsert_message_flow_steps(
                    message_id=query_id,
                    chat_id=chat_id_uuid,
                    flow_steps=[step],
                    db=_db,
                ),
                timeout=timeout,
            )
    except asyncio.TimeoutError:
        log.warning("persist_planned_action_step: persistence timed out")
    except Exception as e:
        log.warning(f"persist_planned_action_step: persistence failed: {e}")

    return step
