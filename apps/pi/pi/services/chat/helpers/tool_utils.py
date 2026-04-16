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
Tool utilities shared across planning and execution.

This module intentionally centralizes non-core helpers used by the action executor
so that `action_executor.execute_action_with_retrieval` stays lean and readable.
"""

import asyncio
import contextlib
import re
from collections.abc import AsyncIterator
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple
from typing import TypedDict
from typing import Union

from pi import logger
from pi.services.chat.prompts import HISTORY_FRESHNESS_WARNING
from pi.services.chat.prompts import WRITE_TODOS_SYSTEM_PROMPT_BUILD
from pi.services.retrievers.pg_store.embedding_model import check_ml_model_configured_sync

log = logger.getChild(__name__)


def extract_text_from_content(content: Any) -> str:
    """Extract text from streaming chunk content, handling both OpenAI and Anthropic formats.

    OpenAI returns `chunk.content` as a plain string during streaming.
    Anthropic returns `chunk.content` as a list of content block dicts:
      - Text blocks: [{'text': 'content here', 'type': 'text', 'index': 0}]
      - Tool input deltas: [{'partial_json': '...', 'type': 'input_json_delta', 'index': 1}]

    Args:
        content: The chunk.content value from a streaming LLM response

    Returns:
        Extracted text string (empty string if no text found)
    """
    if content is None:
        return ""

    # OpenAI format: already a string
    if isinstance(content, str):
        return content

    # Anthropic format: list of content block dicts
    if isinstance(content, list):
        text_parts = []
        for block in content:
            if isinstance(block, dict):
                # Extract 'text' from text blocks (type: 'text')
                if block.get("type") == "text" and "text" in block:
                    text_parts.append(str(block["text"]))
                # Skip input_json_delta blocks - those are tool call inputs, not reasoning text
        return "".join(text_parts)

    # Fallback: try converting to string (shouldn't normally reach here)
    return str(content)


def _collect_reasoning_text(value: Any) -> List[str]:
    """Recursively extract text-like fields from OpenAI reasoning summary payloads."""
    if value is None:
        return []

    if isinstance(value, str):
        text = value.strip()
        return [text] if text else []

    if isinstance(value, list):
        parts: List[str] = []
        for item in value:
            parts.extend(_collect_reasoning_text(item))
        return parts

    if isinstance(value, dict):
        dict_parts: List[str] = []
        preferred_keys = ("text", "summary_text", "summary", "content")
        used_preferred = False
        for key in preferred_keys:
            if key in value:
                used_preferred = True
                dict_parts.extend(_collect_reasoning_text(value.get(key)))
        if not used_preferred:
            for key, item in value.items():
                if key in {"id", "index", "type"}:
                    continue
                dict_parts.extend(_collect_reasoning_text(item))
        return dict_parts

    return []


def extract_reasoning_summary_text(message: Any, *, chunk_only: bool = False) -> str:
    """Extract OpenAI reasoning summary text from AIMessage/AIMessageChunk metadata."""
    metadata_sources: List[Dict[str, Any]] = []

    if isinstance(message, dict):
        additional_kwargs = message.get("additional_kwargs")
        response_metadata = message.get("response_metadata")
    else:
        additional_kwargs = getattr(message, "additional_kwargs", None)
        response_metadata = getattr(message, "response_metadata", None)

    if isinstance(additional_kwargs, dict):
        metadata_sources.append(additional_kwargs)
    if isinstance(response_metadata, dict):
        metadata_sources.append(response_metadata)

    fragments: List[str] = []
    for metadata in metadata_sources:
        if "reasoning_summary_chunk" in metadata:
            fragments.extend(_collect_reasoning_text(metadata.get("reasoning_summary_chunk")))
        if not chunk_only and "reasoning_summary" in metadata:
            fragments.extend(_collect_reasoning_text(metadata.get("reasoning_summary")))

    deduped: List[str] = []
    for fragment in fragments:
        if fragment and fragment not in deduped:
            deduped.append(fragment)

    return "\n".join(deduped).strip()


def build_reasoning_display_text(message: Any) -> str:
    """Combine reasoning summary metadata with visible content for the reasoning UI."""
    summary = extract_reasoning_summary_text(message)

    if isinstance(message, dict):
        content = extract_text_from_content(message.get("content"))
    else:
        content = extract_text_from_content(getattr(message, "content", None))

    parts: List[str] = []
    if summary:
        parts.append(f"Reasoning summary:\n{summary}")
    if content and content.strip():
        parts.append(content.strip())
    return "\n\n".join(parts).strip()


# ------------------------------------
# Smart Buffering Streaming Utility
# ------------------------------------


class StreamEvent(TypedDict, total=False):
    """Event types yielded by stream_llm_with_smart_buffering.

    Types:
    - "reasoning_chunk": Content that should go to reasoning/thought panel
    - "final_answer_chunk": Content that should go to final answer stream
    - "tool_detected": A tool name was detected in the stream
    - "complete": Streaming finished, contains the accumulated message
    """

    type: str  # "reasoning_chunk" | "final_answer_chunk" | "tool_detected" | "complete"
    content: str  # Text content for chunks
    tool_name: str  # For tool_detected events
    accumulated_message: Any  # Final AIMessage for "complete" event
    saw_tool_calls: bool  # Whether any tool calls were detected
    streamed_reasoning: bool  # Whether any reasoning was streamed


async def stream_llm_with_delimiter(
    llm: Any,
    messages: Any,
    *,
    stream_final_answer: bool = False,
) -> AsyncIterator[StreamEvent]:
    """
    Shared streaming utility using delimiter-based answer routing.

    Streams content immediately as reasoning (or pre-answer text) until
    the answer delimiter (ππANSWERππ) is encountered, then switches to
    streaming the final answer.

    Args:
        llm: The LangChain LLM instance (TrackedLLM or similar)
        messages: List of messages to send to the LLM
        stream_final_answer: If True, stream content after delimiter as final answer

    Yields:
        StreamEvent dicts with type-specific content

    Example:
        async for event in stream_llm_with_delimiter(llm, messages):
            if event["type"] == "reasoning_chunk":
                # Handle reasoning content
                pass
            elif event["type"] == "tool_detected":
                # Handle tool announcement
                pass
            elif event["type"] == "complete":
                ai_message = event["accumulated_message"]
    """
    from pi.services.chat.utils import mask_uuids_in_text

    accumulated: Any = None
    saw_tool_calls = False
    streamed_reasoning = False
    announced_tools: set[str] = set()

    # State
    content_buffer = ""
    stream_mode: Optional[str] = None  # "final_answer" or None (reasoning by default)

    # Batch reasoning chunks (~15 words) to reduce browser SSE event overhead
    _reasoning_batcher = WordBatcher(words_per_batch=15)

    try:
        # Get event iterator
        try:
            event_iter = llm.astream_events(messages, version="v2")
        except TypeError:
            event_iter = llm.astream_events(messages)

        async for event in event_iter:
            if not isinstance(event, dict):
                continue
            data = event.get("data") or {}
            chunk = data.get("chunk")
            if chunk is None:
                continue

            # Accumulate chunks
            if accumulated is None:
                accumulated = chunk
            else:
                try:
                    accumulated = accumulated + chunk
                except Exception:
                    accumulated = chunk

            # 1. Extract content from chunk (handles OpenAI string and Anthropic content blocks)
            reasoning_summary_chunk = extract_reasoning_summary_text(chunk, chunk_only=True)
            if reasoning_summary_chunk:
                streamed_reasoning = True
                batched_summary = _reasoning_batcher.add(reasoning_summary_chunk)
                if batched_summary:
                    yield StreamEvent(type="reasoning_chunk", content=batched_summary)

            chunk_text = getattr(chunk, "content", None)
            if chunk_text:
                # Use helper to normalize between OpenAI (string) and Anthropic (list of blocks)
                text_content = extract_text_from_content(chunk_text)
                if text_content:
                    content_buffer += text_content

            # 2. Detect and announce tool names (for UI display only, not for routing)
            tool_call_chunks = getattr(chunk, "tool_call_chunks", None) or []
            for tc in tool_call_chunks:
                name = (tc.get("name") if isinstance(tc, dict) else None) or ""
                if name and name not in announced_tools:
                    announced_tools.add(name)
                    saw_tool_calls = True
                    # Flush pending buffered reasoning BEFORE emitting tool header
                    # Check for delimiter first to avoid breaking delimiter detection
                    ANSWER_DELIMITER = "ππANSWERππ"
                    delimiter_pos = content_buffer.find(ANSWER_DELIMITER)
                    if delimiter_pos != -1:
                        # Delimiter found - emit reasoning before it, then handle rest later
                        reasoning_content = content_buffer[:delimiter_pos]
                        if reasoning_content:
                            delta = mask_uuids_in_text(reasoning_content)
                            if delta.strip():
                                streamed_reasoning = True
                                batched = _reasoning_batcher.add(delta)
                                if batched:
                                    yield StreamEvent(type="reasoning_chunk", content=batched)
                        # Keep delimiter and answer in buffer for later processing
                        content_buffer = content_buffer[delimiter_pos:]
                    elif content_buffer:
                        # No delimiter - safe to emit entire buffer
                        delta = mask_uuids_in_text(content_buffer)
                        if delta.strip():
                            streamed_reasoning = True
                            batched = _reasoning_batcher.add(delta)
                            if batched:
                                yield StreamEvent(type="reasoning_chunk", content=batched)
                        content_buffer = ""
                    # Flush reasoning batcher before tool header so UI sees all reasoning before the tool tick
                    _remaining = _reasoning_batcher.flush()
                    if _remaining:
                        yield StreamEvent(type="reasoning_chunk", content=_remaining)
                    yield StreamEvent(type="tool_detected", tool_name=name)

            # 3. Delimiter-based routing (the ONLY logic for content routing)
            # Before delimiter → reasoning, After delimiter → final_answer
            ANSWER_DELIMITER = "ππANSWERππ"
            delimiter_pos = content_buffer.find(ANSWER_DELIMITER)

            if delimiter_pos != -1:
                # Found delimiter! Split and emit

                # Everything before delimiter goes to reasoning
                reasoning_content = content_buffer[:delimiter_pos]
                if reasoning_content:
                    delta = mask_uuids_in_text(reasoning_content)
                    if delta.strip():
                        streamed_reasoning = True
                        batched = _reasoning_batcher.add(delta)
                        if batched:
                            yield StreamEvent(type="reasoning_chunk", content=batched)

                # Flush reasoning batcher before switching to final answer mode
                _remaining = _reasoning_batcher.flush()
                if _remaining:
                    yield StreamEvent(type="reasoning_chunk", content=_remaining)

                # Everything after delimiter goes to answer
                answer_start = delimiter_pos + len(ANSWER_DELIMITER)
                answer_content = content_buffer[answer_start:].lstrip("\n")

                # Clear buffer and switch mode
                content_buffer = ""
                stream_mode = "final_answer"

                if answer_content and stream_final_answer:
                    yield StreamEvent(type="final_answer_chunk", content=answer_content)

            elif stream_mode == "final_answer":
                # Already past delimiter - stream everything to answer
                if content_buffer and stream_final_answer:
                    yield StreamEvent(type="final_answer_chunk", content=content_buffer)
                    content_buffer = ""

            else:
                # Haven't found delimiter yet - stream to reasoning (with tail buffer for safety)
                safe_tail_len = len(ANSWER_DELIMITER) - 1

                if len(content_buffer) > safe_tail_len:
                    to_emit = content_buffer[:-safe_tail_len]
                    content_buffer = content_buffer[-safe_tail_len:]

                    if to_emit:
                        delta = mask_uuids_in_text(to_emit)
                        if delta:
                            streamed_reasoning = True
                            batched = _reasoning_batcher.add(delta)
                            if batched:
                                yield StreamEvent(type="reasoning_chunk", content=batched)

        # 5. End of Stream - Flush Remainder
        ANSWER_DELIMITER = "ππANSWERππ"
        if content_buffer:
            # Check for delimiter in remaining buffer
            delimiter_pos = content_buffer.find(ANSWER_DELIMITER)

            if delimiter_pos != -1:
                # Split at delimiter
                reasoning_content = content_buffer[:delimiter_pos].strip()
                if reasoning_content:
                    delta = mask_uuids_in_text(reasoning_content)
                    if delta.strip():
                        streamed_reasoning = True
                        batched = _reasoning_batcher.add(delta)
                        if batched:
                            yield StreamEvent(type="reasoning_chunk", content=batched)

                # Flush reasoning batcher before switching to answer
                _remaining = _reasoning_batcher.flush()
                if _remaining:
                    yield StreamEvent(type="reasoning_chunk", content=_remaining)

                answer_start = delimiter_pos + len(ANSWER_DELIMITER)
                answer_content = content_buffer[answer_start:].lstrip("\n")
                if answer_content and stream_final_answer:
                    yield StreamEvent(type="final_answer_chunk", content=answer_content)

            elif stream_mode != "final_answer":
                # Flush as reasoning
                # If we haven't found a delimiter, we assume it's part of the reasoning/preamble
                # (or the model failed to output a delimiter, in which case consistent reasoning events
                # allow the consumer's fallback logic to handle the full message)
                delta = mask_uuids_in_text(content_buffer)
                if delta.strip():
                    streamed_reasoning = True
                    batched = _reasoning_batcher.add(delta)
                    if batched:
                        yield StreamEvent(type="reasoning_chunk", content=batched)
            else:
                # Flush as final answer
                if stream_final_answer:
                    yield StreamEvent(type="final_answer_chunk", content=content_buffer)

        # Flush any remaining reasoning in the batcher
        _remaining = _reasoning_batcher.flush()
        if _remaining:
            yield StreamEvent(type="reasoning_chunk", content=_remaining)

        # Convert accumulated chunk to message if needed
        response = accumulated
        if response is not None and hasattr(response, "to_message") and callable(response.to_message):
            with contextlib.suppress(Exception):
                response = response.to_message()

        # Log the complete LLM response for debugging
        try:
            response_content = getattr(response, "content", None) if response else None
            response_tool_calls = getattr(response, "tool_calls", None) if response else None
            content_preview = str(response_content)[:500] if response_content else "None"
            tool_calls_preview = str(response_tool_calls)[:300] if response_tool_calls else "None"
            log.debug(
                f"stream_llm_with_delimiter - LLM Response Summary:\n"
                f"  - Has tool_calls: {bool(response_tool_calls)}\n"
                f"  - Tool calls: {tool_calls_preview}\n"
                f"  - Content preview ({len(str(response_content)) if response_content else 0} chars): {content_preview}"
            )

            # DEBUG: Log full content with delimiter analysis for debugging content leakage
            if response_content:
                full_content = str(response_content)
                ANSWER_DELIMITER = "ππANSWERππ"
                delimiter_pos = full_content.find(ANSWER_DELIMITER)
                if delimiter_pos != -1:
                    reasoning_part = full_content[:delimiter_pos]
                    answer_part = full_content[delimiter_pos + len(ANSWER_DELIMITER) :]
                    log.debug(
                        f"stream_llm_with_delimiter - DELIMITER ANALYSIS:\n"
                        f"{'=' * 80}\n"
                        f"REASONING SECTION (before delimiter, {len(reasoning_part)} chars):\n"
                        f"{reasoning_part}\n"
                        f"{'=' * 80}\n"
                        f"ANSWER SECTION (after delimiter, {len(answer_part)} chars):\n"
                        f"{answer_part}\n"
                        f"{'=' * 80}"
                    )
                else:
                    log.debug(f"stream_llm_with_delimiter - NO DELIMITER FOUND in content:\n" f"{"=" * 80}\n" f"{full_content}\n" f"{"=" * 80}")
        except Exception as log_err:
            log.debug(f"stream_llm_with_delimiter - Failed to log response: {log_err}")

        # Yield completion event
        yield StreamEvent(
            type="complete",
            accumulated_message=response,
            saw_tool_calls=saw_tool_calls,
            streamed_reasoning=streamed_reasoning,
        )

    except Exception as e:
        log.warning(f"stream_llm_with_delimiter error: {e}")
        # Fallback: non-streaming invoke
        try:
            response = await llm.ainvoke(messages)
            yield StreamEvent(
                type="complete",
                accumulated_message=response,
                saw_tool_calls=False,
                streamed_reasoning=False,
            )
        except Exception as fallback_err:
            log.error(f"Fallback ainvoke also failed: {fallback_err}")
            raise


# build a map of tool name to category
TOOL_NAME_TO_CATEGORY_MAP: Dict[str, Dict[str, str]] = {
    # Assets
    "assets_create": {"entity_type": "asset", "action_type": "create", "front_facing_name": "Create Asset"},
    "assets_create_user_upload": {"entity_type": "asset", "action_type": "create", "front_facing_name": "Create Asset User Upload"},
    "assets_delete_user": {"entity_type": "asset", "action_type": "delete", "front_facing_name": "Delete Asset User"},
    "assets_get_generic": {"entity_type": "asset", "action_type": "get", "front_facing_name": "Get Asset Generic"},
    "assets_update_generic": {"entity_type": "asset", "action_type": "update", "front_facing_name": "Update Asset Generic"},
    "assets_update_user": {"entity_type": "asset", "action_type": "update", "front_facing_name": "Update Asset User"},
    # Attachments
    "attachments_create": {"entity_type": "attachment", "action_type": "create", "front_facing_name": "Create Attachment"},
    "attachments_delete": {"entity_type": "attachment", "action_type": "delete", "front_facing_name": "Delete Attachment"},
    # Comments
    "comments_create": {"entity_type": "comment", "action_type": "create", "front_facing_name": "Create Comment"},
    "comments_delete": {"entity_type": "comment", "action_type": "delete", "front_facing_name": "Delete Comment"},
    "comments_update": {"entity_type": "comment", "action_type": "update", "front_facing_name": "Update Comment"},
    # Cycles
    "cycles_add_work_items": {"entity_type": "cycle", "action_type": "add", "front_facing_name": "Add Work Items to Cycle"},
    "cycles_archive": {"entity_type": "cycle", "action_type": "archive", "front_facing_name": "Archive Cycle"},
    "cycles_create": {"entity_type": "cycle", "action_type": "create", "front_facing_name": "Create Cycle"},
    "cycles_remove_work_item": {"entity_type": "cycle", "action_type": "remove", "front_facing_name": "Remove Work Item from Cycle"},
    "cycles_transfer_work_items": {"entity_type": "cycle", "action_type": "transfer", "front_facing_name": "Transfer Work Items to Cycle"},
    "cycles_unarchive": {"entity_type": "cycle", "action_type": "unarchive", "front_facing_name": "Unarchive Cycle"},
    "cycles_update": {"entity_type": "cycle", "action_type": "update", "front_facing_name": "Update Cycle"},
    # Intakes
    "intake_create": {"entity_type": "intake", "action_type": "create", "front_facing_name": "Create Intake"},
    "intake_delete": {"entity_type": "intake", "action_type": "delete", "front_facing_name": "Delete Intake"},
    "intake_update": {"entity_type": "intake", "action_type": "update", "front_facing_name": "Update Intake"},
    # Labels
    "labels_create": {"entity_type": "label", "action_type": "create", "front_facing_name": "Create Label"},
    "labels_update": {"entity_type": "label", "action_type": "update", "front_facing_name": "Update Label"},
    # Links
    "links_create": {"entity_type": "link", "action_type": "create", "front_facing_name": "Create Link"},
    "links_delete": {"entity_type": "link", "action_type": "delete", "front_facing_name": "Delete Link"},
    "links_update": {"entity_type": "link", "action_type": "update", "front_facing_name": "Update Link"},
    # Modules
    "modules_add_work_items": {"entity_type": "module", "action_type": "add", "front_facing_name": "Add Work Items to Module"},
    "modules_archive": {"entity_type": "module", "action_type": "archive", "front_facing_name": "Archive Module"},
    "modules_create": {"entity_type": "module", "action_type": "create", "front_facing_name": "Create Module"},
    "modules_remove_work_item": {"entity_type": "module", "action_type": "remove", "front_facing_name": "Remove Work Item from Module"},
    "modules_unarchive": {"entity_type": "module", "action_type": "unarchive", "front_facing_name": "Unarchive Module"},
    "modules_update": {"entity_type": "module", "action_type": "update", "front_facing_name": "Update Module"},
    # Pages
    "pages_create_page": {"entity_type": "page", "action_type": "create", "front_facing_name": "Create Page"},
    "pages_create_project_page": {"entity_type": "page", "action_type": "create", "front_facing_name": "Create Project Page"},
    "pages_create_workspace_page": {"entity_type": "page", "action_type": "create", "front_facing_name": "Create Workspace Page"},
    # Projects
    "projects_create": {"entity_type": "project", "action_type": "create", "front_facing_name": "Create Project"},
    "projects_delete": {"entity_type": "project", "action_type": "delete", "front_facing_name": "Delete Project"},
    "projects_update": {"entity_type": "project", "action_type": "update", "front_facing_name": "Update Project"},
    "projects_retrieve": {"entity_type": "project", "action_type": "retrieve", "front_facing_name": "Retrieve Project"},
    "projects_get_features": {"entity_type": "project", "action_type": "get", "front_facing_name": "Get Project Features"},
    "projects_update_features": {"entity_type": "project", "action_type": "update", "front_facing_name": "Update Project Features"},
    # Properties
    "properties_create": {"entity_type": "property", "action_type": "create", "front_facing_name": "Create Property"},
    "properties_create_option": {"entity_type": "property", "action_type": "create_option", "front_facing_name": "Create Property Option"},
    "properties_create_value": {"entity_type": "property", "action_type": "create_value", "front_facing_name": "Create Property Value"},
    "properties_delete": {"entity_type": "property", "action_type": "delete", "front_facing_name": "Delete Property"},
    "properties_delete_option": {"entity_type": "property", "action_type": "delete_option", "front_facing_name": "Delete Property Option"},
    "properties_update": {"entity_type": "property", "action_type": "update", "front_facing_name": "Update Property"},
    "properties_update_option": {"entity_type": "property", "action_type": "update_option", "front_facing_name": "Update Property Option"},
    # States
    "states_create": {"entity_type": "state", "action_type": "create", "front_facing_name": "Create State"},
    "states_update": {"entity_type": "state", "action_type": "update", "front_facing_name": "Update State"},
    # Types
    "types_create": {"entity_type": "type", "action_type": "create", "front_facing_name": "Create Type"},
    "types_delete": {"entity_type": "type", "action_type": "delete", "front_facing_name": "Delete Type"},
    "types_update": {"entity_type": "type", "action_type": "update", "front_facing_name": "Update Type"},
    # Initiatives (SDK v0.2.1)
    "initiatives_create": {"entity_type": "initiative", "action_type": "create", "front_facing_name": "Create Initiative"},
    "initiatives_list": {"entity_type": "initiative", "action_type": "list", "front_facing_name": "List Initiatives"},
    "initiatives_retrieve": {"entity_type": "initiative", "action_type": "retrieve", "front_facing_name": "Retrieve Initiative"},
    "initiatives_update": {"entity_type": "initiative", "action_type": "update", "front_facing_name": "Update Initiative"},
    "initiatives_delete": {"entity_type": "initiative", "action_type": "delete", "front_facing_name": "Delete Initiative"},
    "initiatives_create_label": {"entity_type": "initiative_label", "action_type": "create", "front_facing_name": "Create Initiative Label"},
    "initiatives_list_labels": {"entity_type": "initiative_label", "action_type": "list", "front_facing_name": "List Initiative Labels"},
    "initiatives_retrieve_label": {"entity_type": "initiative_label", "action_type": "retrieve", "front_facing_name": "Retrieve Initiative Label"},
    "initiatives_update_label": {"entity_type": "initiative_label", "action_type": "update", "front_facing_name": "Update Initiative Label"},
    "initiatives_delete_label": {"entity_type": "initiative_label", "action_type": "delete", "front_facing_name": "Delete Initiative Label"},
    "initiatives_add_labels": {"entity_type": "initiative", "action_type": "add", "front_facing_name": "Add Labels to Initiative"},
    "initiatives_remove_labels": {"entity_type": "initiative", "action_type": "remove", "front_facing_name": "Remove Labels from Initiative"},
    "initiatives_add_projects": {"entity_type": "initiative", "action_type": "add", "front_facing_name": "Add Projects to Initiative"},
    "initiatives_list_projects": {"entity_type": "initiative", "action_type": "list", "front_facing_name": "List Initiative Projects"},
    "initiatives_remove_projects": {"entity_type": "initiative", "action_type": "remove", "front_facing_name": "Remove Projects from Initiative"},
    "initiatives_add_epics": {"entity_type": "initiative", "action_type": "add", "front_facing_name": "Add Epics to Initiative"},
    "initiatives_list_epics": {"entity_type": "initiative", "action_type": "list", "front_facing_name": "List Initiative Epics"},
    "initiatives_remove_epics": {"entity_type": "initiative", "action_type": "remove", "front_facing_name": "Remove Epics from Initiative"},
    # Teamspaces (SDK v0.2.1)
    "teamspaces_create": {"entity_type": "teamspace", "action_type": "create", "front_facing_name": "Create Teamspace"},
    "teamspaces_list": {"entity_type": "teamspace", "action_type": "list", "front_facing_name": "List Teamspaces"},
    "teamspaces_retrieve": {"entity_type": "teamspace", "action_type": "retrieve", "front_facing_name": "Retrieve Teamspace"},
    "teamspaces_update": {"entity_type": "teamspace", "action_type": "update", "front_facing_name": "Update Teamspace"},
    "teamspaces_delete": {"entity_type": "teamspace", "action_type": "delete", "front_facing_name": "Delete Teamspace"},
    "teamspaces_add_members": {"entity_type": "teamspace", "action_type": "add", "front_facing_name": "Add Members to Teamspace"},
    "teamspaces_list_members": {"entity_type": "teamspace", "action_type": "list", "front_facing_name": "List Teamspace Members"},
    "teamspaces_remove_members": {"entity_type": "teamspace", "action_type": "remove", "front_facing_name": "Remove Members from Teamspace"},
    "teamspaces_add_projects": {"entity_type": "teamspace", "action_type": "add", "front_facing_name": "Add Projects to Teamspace"},
    "teamspaces_list_projects": {"entity_type": "teamspace", "action_type": "list", "front_facing_name": "List Teamspace Projects"},
    "teamspaces_remove_projects": {"entity_type": "teamspace", "action_type": "remove", "front_facing_name": "Remove Projects from Teamspace"},
    # Stickies (SDK v0.2.1)
    "stickies_create": {"entity_type": "sticky", "action_type": "create", "front_facing_name": "Create Sticky Note"},
    "stickies_list": {"entity_type": "sticky", "action_type": "list", "front_facing_name": "List Sticky Notes"},
    "stickies_retrieve": {"entity_type": "sticky", "action_type": "retrieve", "front_facing_name": "Retrieve Sticky Note"},
    "stickies_update": {"entity_type": "sticky", "action_type": "update", "front_facing_name": "Update Sticky Note"},
    "stickies_delete": {"entity_type": "sticky", "action_type": "delete", "front_facing_name": "Delete Sticky Note"},
    # Customers (SDK v0.2.1)
    "customers_create": {"entity_type": "customer", "action_type": "create", "front_facing_name": "Create Customer"},
    "customers_list": {"entity_type": "customer", "action_type": "list", "front_facing_name": "List Customers"},
    "customers_retrieve": {"entity_type": "customer", "action_type": "retrieve", "front_facing_name": "Retrieve Customer"},
    "customers_update": {"entity_type": "customer", "action_type": "update", "front_facing_name": "Update Customer"},
    "customers_delete": {"entity_type": "customer", "action_type": "delete", "front_facing_name": "Delete Customer"},
    # Customer Properties
    "customers_create_property": {"entity_type": "customer", "action_type": "create", "front_facing_name": "Create Customer Property"},
    "customers_list_properties": {"entity_type": "customer", "action_type": "list", "front_facing_name": "List Customer Properties"},
    "customers_retrieve_property": {"entity_type": "customer", "action_type": "retrieve", "front_facing_name": "Retrieve Customer Property"},
    "customers_update_property": {"entity_type": "customer", "action_type": "update", "front_facing_name": "Update Customer Property"},
    "customers_delete_property": {"entity_type": "customer", "action_type": "delete", "front_facing_name": "Delete Customer Property"},
    # Customer Requests
    "customers_create_request": {"entity_type": "customer", "action_type": "create", "front_facing_name": "Create Customer Request"},
    "customers_list_requests": {"entity_type": "customer", "action_type": "list", "front_facing_name": "List Customer Requests"},
    "customers_retrieve_request": {"entity_type": "customer", "action_type": "retrieve", "front_facing_name": "Retrieve Customer Request"},
    "customers_update_request": {"entity_type": "customer", "action_type": "update", "front_facing_name": "Update Customer Request"},
    "customers_delete_request": {"entity_type": "customer", "action_type": "delete", "front_facing_name": "Delete Customer Request"},
    # Workspaces (SDK v0.2.2 - features)
    "workspaces_get_features": {"entity_type": "workspace", "action_type": "get", "front_facing_name": "Get Workspace Features"},
    "workspaces_update_features": {"entity_type": "workspace", "action_type": "update", "front_facing_name": "Update Workspace Features"},
    # Workitems and Epics
    "create_epic": {"entity_type": "epic", "action_type": "create", "front_facing_name": "Create Epic"},
    "update_epic": {"entity_type": "epic", "action_type": "update", "front_facing_name": "Update Epic"},
    "workitems_create": {"entity_type": "workitem", "action_type": "create", "front_facing_name": "Create Work Item"},
    "workitems_create_relation": {"entity_type": "workitem", "action_type": "update", "front_facing_name": "Create Work Item Relation"},
    "workitems_update": {"entity_type": "workitem", "action_type": "update", "front_facing_name": "Update Work Item"},
    "workitems_delete": {"entity_type": "workitem", "action_type": "delete", "front_facing_name": "Delete Work Item"},
    # Worklogs
    "worklogs_create": {"entity_type": "worklog", "action_type": "create", "front_facing_name": "Create Work Log"},
    "worklogs_delete": {"entity_type": "worklog", "action_type": "delete", "front_facing_name": "Delete Work Log"},
    "worklogs_update": {"entity_type": "worklog", "action_type": "update", "front_facing_name": "Update Work Log"},
    # Unified retrieval tools
    "entity_list": {"entity_type": "entity", "action_type": "list", "front_facing_name": "List Entities"},
    "entity_retrieve": {"entity_type": "entity", "action_type": "retrieve", "front_facing_name": "Retrieve Entity"},
    "entity_search": {"entity_type": "entity", "action_type": "search", "front_facing_name": "Search Entity"},
}


def is_retrieval_tool(tool_name: Any) -> bool:
    """Return True if the tool is a retrieval/lookup tool.

    Heuristics:
    - search_* prefix
    - *_list or *_retrieve suffix
    - known retrieval utilities
    - empty/unknown names default to retrieval (defensive)
    """
    name = str(tool_name).strip() if tool_name is not None else ""
    if not name:
        return True
    # Prefix-based retrieval tools (entity search + list/get helpers)
    if name.startswith(("search_", "list_", "get_", "retrieve_")):
        return True
    # Suffix-based retrieval tools (legacy convention)
    if name.endswith("_list") or name.endswith("_retrieve"):
        return True
    # Known retrieval utilities
    if name in {
        "structured_db_tool",
        "vector_search_tool",
        "pages_search_tool",
        "docs_search_tool",
        "web_search_tool",
        "fetch_cycle_details",
        "entity_list",
        "entity_retrieve",
        "entity_search",
    }:
        return True
    return False


"""Tool name mapping utilities and classification registry."""

# ------------------------------
# Tool classification registry
# ------------------------------

# kind: "retrieval" | "action"
# plan_only: True means never execute in planning; store as planned
TOOL_METADATA_REGISTRY: Dict[str, Dict[str, Any]] = {
    # Retrieval tools (execute immediately)
    "vector_search_tool": {"kind": "retrieval", "plan_only": False},
    "structured_db_tool": {"kind": "retrieval", "plan_only": False},
    "pages_search_tool": {"kind": "retrieval", "plan_only": False},
    "docs_search_tool": {"kind": "retrieval", "plan_only": False},
    "web_search_tool": {"kind": "retrieval", "plan_only": False},
    "fetch_cycle_details": {"kind": "retrieval", "plan_only": False},
    # Planner/system helpers
    "ask_for_clarification": {"kind": "retrieval", "plan_only": False},
    "reselect_action_categories": {"kind": "retrieval", "plan_only": False},
    # Common actions (examples - fallback to heuristics for unknown tools)
    "workitems_create": {"kind": "action", "plan_only": True},
    "workitems_update": {"kind": "action", "plan_only": True},
    "workitems_create_relation": {"kind": "action", "plan_only": True},
    "modules_add_work_items": {"kind": "action", "plan_only": True},
    "cycles_add_work_items": {"kind": "action", "plan_only": True},
    "create_epic": {"kind": "action", "plan_only": True},
    "projects_retrieve": {"kind": "retrieval", "plan_only": False},
    "workitems_advanced_search": {"kind": "retrieval", "plan_only": False},
    "entity_list": {"kind": "retrieval", "plan_only": False},
    "entity_retrieve": {"kind": "retrieval", "plan_only": False},
    "entity_search": {"kind": "retrieval", "plan_only": False},
}


def register_tool_metadata(name: str, *, kind: str, plan_only: bool = False) -> None:
    """Register or update tool metadata in the classification registry."""
    if not name:
        return
    TOOL_METADATA_REGISTRY[name] = {"kind": kind, "plan_only": bool(plan_only)}


def get_tool_metadata(name: str) -> Dict[str, Any]:
    """Return metadata for a tool if available; empty dict if unknown."""
    return TOOL_METADATA_REGISTRY.get(name, {})


def is_plan_only_tool(name: str) -> bool:
    """Return True if the tool must not be executed during planning (planned only)."""
    return bool(TOOL_METADATA_REGISTRY.get(name, {}).get("plan_only", False))


from pi.services.schemas.chat import RetrievalTools


def tool_name_to_retrieval_tool(tool_name: str) -> str:
    """Convert tool name back to retrieval tool enum value."""
    tool_to_enum_map = {
        "vector_search_tool": RetrievalTools.VECTOR_SEARCH_TOOL,
        "structured_db_tool": RetrievalTools.STRUCTURED_DB_TOOL,
        "pages_search_tool": RetrievalTools.PAGES_SEARCH_TOOL,
        "docs_search_tool": RetrievalTools.DOCS_SEARCH_TOOL,
        "web_search_tool": RetrievalTools.WEB_SEARCH_TOOL,
        "action_executor_agent": RetrievalTools.ACTION_EXECUTOR_TOOL,
    }
    return tool_to_enum_map.get(tool_name, tool_name)


def tool_name_shown_to_user(tool_name: str) -> str:
    """Convert tool name to a user-friendly name."""

    # Small helper to clean unknown tool names into a readable, title-cased label
    def _clean_tool_display_name(raw: str) -> str:
        try:
            s = str(raw or "").strip()
        except Exception:
            s = ""
        if not s:
            return str(raw or "")
        # Remove MCP prefix if still present and normalize common separators
        if s.startswith("mcp_"):
            s = s[4:]
        s = s.replace("__", " ")
        s = s.replace("_", " ")
        s = s.replace("-", " ")
        s = s.replace("/", " ")
        # Collapse multiple spaces and title-case
        s = " ".join(s.split())
        return s.title() if s else str(raw or "")

    # Handle MCP tools first (pattern: mcp_<connector_slug>__<tool_name>)
    if tool_name.startswith("mcp_"):
        return _clean_tool_display_name(tool_name[4:] or tool_name)

    _semantic_available = check_ml_model_configured_sync()

    tool_to_user_map = {
        "vector_search_tool": "Semantic search" if _semantic_available else "Agentic search",
        "structured_db_tool": "Database querying",
        "search_current_cycle": "Find Current Cycle",
        "fetch_cycle_details": "Cycle Details",
        "list_recent_cycles": "Recent Cycles",
        "pages_search_tool": "Semantic search of pages" if _semantic_available else "Agentic search of pages",
        "docs_search_tool": "Semantic search of docs" if _semantic_available else "Agentic search of docs",
        "web_search_tool": "Web search",
        "action_executor_agent": "Action Execution",
        # Entity search tools
        "search_project_by_name": "Search Project",
        "search_project_by_identifier": "Search Project by Identifier",
        "search_module_by_name": "Search Module",
        "search_cycle_by_name": "Search Cycle",
        "search_state_by_name": "Search State",
        "search_label_by_name": "Search Label",
        "search_user_by_name": "Search User",
        "search_workitem_by_name": "Search Work-item",
        "search_workitem_by_identifier": "Search Work-item by ID",
        "workitems_advanced_search": "Filter Work Items",
        "entity_list": "List Entities",
        "entity_retrieve": "Retrieve Entity",
        "entity_search": "Search Entity",
        # Plotting Tools
        "create_pie_chart": "Generate a Pie Chart",
        "create_bar_chart": "Generate a Bar Chart",
        "create_line_chart": "Generate a Line Chart",
        "create_stacked_bar_chart": "Generate a Stacked Bar Chart",
        # Other common tools
        "states_list": "List States",
        "projects_list": "List Projects",
        "modules_list": "List Modules",
        "cycles_list": "List Cycles",
        "labels_list": "List Labels",
        "users_list": "List Users",
        "workitems_list": "List Work-items",
        "list_member_projects": "List Member Projects",
        "worklogs_get_summary": "Worklog Summary",
        "ask_for_clarification": "Elicitation",
        "write_todos": "Task planning",
    }
    name_to_return = tool_to_user_map.get(tool_name, "")
    if not name_to_return:
        # Prefer explicitly configured front-facing name when available
        name_to_return = TOOL_NAME_TO_CATEGORY_MAP.get(tool_name, {}).get("front_facing_name", "")
    if not name_to_return:
        # Generic fallback: clean the raw tool name for user display
        name_to_return = _clean_tool_display_name(tool_name)
    return name_to_return


def action_entity_display_name(
    tool_name: str,
    *,
    entity_info: Optional[Dict[str, Any]] = None,
    parameters: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Label for build-mode actions when there is no resolved entity name (stream, execute-action, history).
    Prefers entity_info / planning parameters, then TOOL_NAME_TO_CATEGORY_MAP front_facing_name via
    tool_name_shown_to_user.
    """
    if entity_info and isinstance(entity_info, dict):
        n = entity_info.get("entity_name")
        if isinstance(n, str) and n.strip():
            return n.strip()
    if parameters and isinstance(parameters, dict):
        for key in ("name", "title"):
            v = parameters.get(key)
            if isinstance(v, str) and v.strip():
                return v.strip()
        props = parameters.get("properties")
        if isinstance(props, dict):
            for key in ("name", "display_name", "title"):
                v = props.get(key)
                if isinstance(v, str) and v.strip():
                    return v.strip()
    return tool_name_shown_to_user(tool_name)


def category_display_name(category: str) -> str:
    """
    Convert internal category slug to a user-friendly display name.
    Falls back to Title Case of the slug with underscores replaced.
    """

    category = category.strip().lower()
    overrides = {
        "workitems": "Work items",
        "worklogs": "Work logs",
        "projects": "Projects",
        "cycles": "Cycles",
        "modules": "Modules",
        "labels": "Labels",
        "states": "States",
        "pages": "Pages",
        "assets": "Assets",
        "users": "Users",
        "members": "Members",
        "activity": "Activity",
        "attachments": "Attachments",
        "comments": "Comments",
        "links": "Links",
        "properties": "Properties",
        "types": "Types",
        "intake": "Intake",
    }
    return overrides.get(category, category.replace("_", " ").title())


def generate_success_message(tool_name: str, entity_name: Optional[str] = None) -> str:
    """Generate user-friendly success message from tool metadata.

    Uses existing TOOL_NAME_TO_CATEGORY_MAP to build messages like:
    'Successfully created work item newsfive'
    """
    tool_meta = TOOL_NAME_TO_CATEGORY_MAP.get(tool_name, {})
    if not tool_meta:
        return f"Successfully executed {tool_name}"

    action_type = tool_meta.get("action_type", "executed")
    entity_type = tool_meta.get("entity_type", "entity")

    # Convert action to past tense
    action_map = {
        "create": "created",
        "update": "updated",
        "delete": "deleted",
        "add": "added",
        "remove": "removed",
        "archive": "archived",
        "unarchive": "unarchived",
        "transfer": "transferred",
    }
    action_verb = action_map.get(action_type, action_type)

    if entity_name:
        return f"Successfully {action_verb} {entity_type} '{entity_name}'"
    return f"Successfully {action_verb} {entity_type}"


def generate_error_message(tool_name: str, entity_name: Optional[str] = None) -> str:
    """Generate user-friendly error message from tool metadata.

    Uses existing TOOL_NAME_TO_CATEGORY_MAP to build messages like:
    'Failed to create comment'
    """
    tool_meta = TOOL_NAME_TO_CATEGORY_MAP.get(tool_name, {})
    if not tool_meta:
        return f"Failed to execute {tool_name}"

    action_type = tool_meta.get("action_type", "execute")
    entity_type = tool_meta.get("entity_type", "entity")

    if entity_name:
        return f"Failed to {action_type} {entity_type} '{entity_name}'"
    return f"Failed to {action_type} {entity_type}"


def is_uuid_like(value: Any) -> bool:
    """Check if a value looks like a UUID."""
    if not isinstance(value, str):
        return False
    # UUID pattern: 8-4-4-4-12 hex digits with optional hyphens
    uuid_pattern = re.compile(r"^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$", re.IGNORECASE)
    return bool(uuid_pattern.match(value.strip()))


def is_url(value: Any) -> bool:
    """Check if a value looks like a URL."""
    if not isinstance(value, str):
        return False
    return value.startswith(("http://", "https://", "ftp://"))


def clean_result_dict(data: Any, depth: int = 0) -> Any:
    """
    Recursively clean a result dictionary by removing UUIDs, URLs, and technical fields.
    Keeps user-friendly fields like names, identifiers, counts, dates, etc.

    Args:
        data: The data structure to clean (dict, list, or primitive)
        depth: Current recursion depth (to prevent infinite loops)

    Returns:
        Cleaned data structure
    """
    if depth > 10:  # Safety limit
        return "..."

    # Fields to always exclude
    EXCLUDE_FIELDS = {
        "id",
        "project_id",
        "workspace_id",
        "user_id",
        "member_id",
        "cycle_id",
        "module_id",
        "state_id",
        "label_id",
        "type_id",
        "parent_id",
        "url",
        "entity_url",
        "workspace",
        "created_by_id",
        "updated_by_id",
        "owner_id",
        "assignee_id",
        "reporter_id",
        "lead_id",
    }

    # Fields to always keep (even if they look like UUIDs)
    KEEP_FIELDS = {
        "name",
        "identifier",
        "title",
        "description",
        "count",
        "total",
        "status",
        "priority",
        "state",
        "type",
        "access",
        "color",
        "start_date",
        "end_date",
        "target_date",
        "created_at",
        "updated_at",
        "is_current",
        "is_active",
        "is_draft",
        "is_archived",
    }

    if isinstance(data, dict):
        cleaned = {}
        for key, value in data.items():
            key_lower = key.lower()

            # Skip excluded fields
            if key_lower in EXCLUDE_FIELDS:
                continue

            # Skip UUID-like values unless it's a keep field
            if is_uuid_like(value) and key_lower not in KEEP_FIELDS:
                continue

            # Skip URLs
            if is_url(value):
                continue

            # Recursively clean nested structures
            cleaned_value = clean_result_dict(value, depth + 1)

            # Only include non-empty cleaned values
            if cleaned_value not in (None, {}, []):
                cleaned[key] = cleaned_value

        return cleaned or None

    elif isinstance(data, list):
        cleaned_list = []
        for item in data:
            cleaned_item = clean_result_dict(item, depth + 1)
            if cleaned_item not in (None, {}, []):
                cleaned_list.append(cleaned_item)
        return cleaned_list or None

    else:
        # Primitives: return as-is unless it's a UUID or URL
        if is_uuid_like(data) or is_url(data):
            return None
        return data


def format_tool_message_for_display(content: Optional[str | dict]) -> str:
    """
    Parse and clean tool message content for user-friendly display.
    Removes UUIDs, URLs, and technical fields while preserving meaningful information.

    Args:
        content: Raw tool message content string (or dict that will be converted)

    Returns:
        Cleaned, user-friendly tool message string
    """
    if not content:
        return ""

    # Handle case where content is still a dict (shouldn't happen but defensive)
    if isinstance(content, dict):
        # Extract just the message field if it's a structured response
        if "message" in content:
            return content["message"]
        # Otherwise convert to string
        content = str(content)

    try:
        # Split into message and result parts
        parts = content.split("\n\nResult:", 1)
        success_message = parts[0].strip() if parts else ""
        result_part = parts[1].strip() if len(parts) > 1 else ""

        if not result_part:
            # No result section, just return the message as-is
            return content

        # We have a Result section - hide it and return just the message
        # The LLM gets the full data, user only sees the clean message
        return success_message or "✅ Operation completed successfully"

    except Exception as e:
        # On any error, return original for debugging purposes but log it
        log.debug(f"Error formatting tool message: {e}")
        return content


def retrieval_tool_to_tool_name(retrieval_tool: str) -> str:
    """Convert retrieval tool enum value to corresponding LangChain tool name."""
    enum_to_tool_map = {
        "vector_search_tool": "vector_search_tool",
        "structured_db_tool": "structured_db_tool",
        "pages_search_tool": "pages_search_tool",
        "docs_search_tool": "docs_search_tool",
        "web_search_tool": "web_search_tool",
        "action_executor_tool": "action_executor_agent",
    }
    return enum_to_tool_map.get(retrieval_tool, retrieval_tool)


# Legacy function name for backward compatibility
agent_to_tool_name = retrieval_tool_to_tool_name


def log_toolset_details(tools: List[Any], chat_id: str) -> None:
    """Log detailed information about a toolset including argument schemas.

    Args:
        tools: List of LangChain tools to log
        chat_id: Chat ID for logging context
    """
    log.info(f"ChatID: {chat_id} - Re-binding LLM with the full toolset ({len(tools)} tools):")

    for i, tool in enumerate(tools, 1):
        tool_name = getattr(tool, "name", "Unknown")
        tool_desc = getattr(tool, "description", "No description")
        log.info(f"  {i:2d}. {tool_name}: {tool_desc}")

        # Try to introspect and print the argument schema for each tool
        args_schema = getattr(tool, "args_schema", None)
        if args_schema is not None:
            try:
                # Pydantic v2 style: model_fields
                if hasattr(args_schema, "model_fields"):
                    fields = getattr(args_schema, "model_fields", {}) or {}
                    if fields:
                        for field_name, field in fields.items():
                            try:
                                annotation = getattr(field, "annotation", None)
                                field_type = getattr(annotation, "__name__", None) or str(annotation)
                            except Exception:
                                field_type = "Any"
                            # Determine required and default
                            is_required = False
                            try:
                                if hasattr(field, "is_required") and callable(field.is_required):
                                    is_required = bool(field.is_required())
                                else:
                                    is_required = getattr(field, "default", None) is None and not bool(getattr(field, "default_factory", None))
                            except Exception:
                                pass
                            default_value = getattr(field, "default", None)
                            log.info(f"       - {field_name}: type={field_type}, required={is_required}, default={default_value!r}")
                # Pydantic v1 style: schema()
                elif hasattr(args_schema, "schema") and callable(getattr(args_schema, "schema")):
                    schema_dict = args_schema.schema()
                    properties = schema_dict.get("properties", {}) or {}
                    required_list = schema_dict.get("required", []) or []
                    for field_name, meta in properties.items():
                        field_type = meta.get("type") or meta.get("title") or str(meta.get("anyOf") or "Any")
                        default_value = meta.get("default", None)
                        is_required = field_name in required_list
                        log.info(f"       - {field_name}: type={field_type}, required={is_required}, default={default_value!r}")
            except Exception as schema_err:
                log.info(f"       - (args_schema introspection failed: {schema_err})")
        else:
            # Fallback: inspect function signature if available
            func = getattr(tool, "coroutine", None) or getattr(tool, "func", None)
            if func is not None:
                try:
                    import inspect as _inspect

                    sig = _inspect.signature(func)
                    for param in sig.parameters.values():
                        if param.name == "self":
                            continue
                        annotation = None if param.annotation is _inspect._empty else param.annotation
                        ann_str = getattr(annotation, "__name__", None) or str(annotation)
                        default_value = None if param.default is _inspect._empty else param.default
                        log.info(f"       - {param.name}: type={ann_str}, default={default_value!r}")
                except Exception as sig_err:
                    log.info(f"       - (signature introspection failed: {sig_err})")


# ------------------------------
# Action Executor helper methods
# ------------------------------

TOOL_CALL_REASONING_INSTRUCTIONS = """## Mandatory reasoning & communication (required for every tool call)

Before each tool call, write a short, natural explanation of what you are doing and why.
After each tool call, write a short recap of what you learned and what you will do next.

### Guidelines
- Before tool call: 5–7 sentences (intent + why + what you expect back).
- After tool call: 3–5 sentences (key result + next step).
- Be clear and helpful, but do not write a long essay.
- Put this reasoning in the assistant `content` surrounding your `tool_calls` (before/after), not inside tool arguments.
"""  # noqa: E501


# TOOL_CALL_REASONING_REINFORCEMENT = """**FINAL MANDATORY REQUIREMENT - REASONING FOR EVERY TOOL CALL:**
# You MUST provide clear reasoning in your response content BEFORE and AFTER each tool call:
# - BEFORE: Explain what you're about to do and why (e.g., "Let me first find user Anil's details to get their ID...") # noqa: E501
# - AFTER: Summarize what you found and your next step (e.g., "Found Anil Kumar (ID: xyz-123). Now searching for workitems assigned to them...") # noqa: E501
# - This reasoning is NOT optional - it's required for transparency and helps users understand your process
# - Even for simple searches, explain your thinking (e.g., "Searching for project 'Mobile' to get its UUID for creating workitems...")
# - Provide this in the content field surrounding your tool_calls"""  # noqa: E501

app_response_instructions = """

**CRITICAL - APP INTEGRATION RESPONSE:**
You have access to a special tool: `provide_final_answer_for_app`

**WHEN TO USE THIS TOOL:**
- After you have gathered all necessary information via retrieval tools
- When you have completed answering the user's question
- ONLY for retrieval/informational queries (NOT for modification requests with actions)

**HOW TO USE:**
Call `provide_final_answer_for_app` with:
1. **text_response**: Your comprehensive natural language answer in PLAIN TEXT ONLY (absolutely NO markdown formatting - no bold, italic, headers, lists, etc.)
2. **entities**: List of relevant entities from the retrieval results

**Entity format for each item:**
- **type**: Entity type (workitem, project, cycle, module, page, user, label, state, etc.)
- **name**: Entity name/title
- **properties**: Dictionary containing relevant fields:
  - id: Entity UUID (when available)
  - identifier: Human-readable ID like PROJECT-123 (for workitems)
  - state: Current state (for workitems)
  - priority: Priority level (for workitems)
  - assignee: Assigned user name (for workitems)
  - status: Status (for cycles/modules)
  - ... other relevant fields based on entity type

NOTE: Do NOT include 'url' in properties - URLs are added automatically by the system.

**Example:**
```
provide_final_answer_for_app(
    text_response="You have 3 high priority work items assigned to you:\nFix login bug (PROJ-123) - In Progress\nUpdate documentation (PROJ-124) - Todo\nRefactor API (PROJ-125) - In Progress",
    entities=[
        {
            "type": "workitem",
            "name": "Fix login bug",
            "properties": {
                "id": "abc-123-uuid",
                "identifier": "PROJ-123",
                "state": "In Progress",
                "priority": "high",
                "assignee": "John Doe"
            }
        },
        {
            "type": "workitem",
            "name": "Update documentation",
            "properties": {
                "id": "def-456-uuid",
                "identifier": "PROJ-124",
                "state": "Todo",
                "priority": "high",
                "assignee": "John Doe"
            }
        },
        {
            "type": "workitem",
            "name": "Refactor API",
            "properties": {
                "id": "ghi-789-uuid",
                "identifier": "PROJ-125",
                "state": "In Progress",
                "priority": "high",
                "assignee": "John Doe"
            }
        }
    ]
)
```

**This will be formatted as:**
```json
{
  "text": "You have 3 high priority work items assigned to you:\nFix login bug (PROJ-123) - In Progress\nUpdate documentation (PROJ-124) - Todo\nRefactor API (PROJ-125) - In Progress",
  "entities": [{"type": "workitem", "name": "Fix login bug", "properties": {"url": "https://...", "identifier": "PROJ-123", ...}}]
}
```
**CRITICAL - REGARDING ENTITIES:**
- Extract entity information from retrieval tool results
- Only include entities if they are the **actual subject** of the user's query. Do not include supporting/contextual entities.
- Do NOT include entities that are merely context or filters for the query.
- Only include entities that are the direct answer to what the user asked for.
- If no specific entities are the direct answer, pass an empty list for entities
- This structured format enables rich display in external applications like Slack
"""  # noqa E501

work_tree_instructions_normal_response = """
**IF the user's request is informational/retrieval-only (questions, searches, listing, checking status):**
1. Use retrieval/search tools to gather the requested information
2. Provide a detailed, elaborate, and neatly formatted answer in the content section based on the retrieved data. Do NOT be brief.
3. Do NOT plan any modifying actions - just invoke retrieval tools, then answer in your content
4. **Formatting Requirements**:
    While formatting the answer in the final content section, use the following rules:
    - Use "work-item" (not "issue") and "unique key" (not "Issue ID") terminology
    - Suppress UUIDs - they are PII (exception: unique keys like PAI-123 are not UUIDs, can show)
    - No hallucination - if no data, say so clearly without mentioning SQL/tools/internals
    - Never reveal sensitive info: passwords, API keys, table names, SQL queries
    - Create clickable URLs: `[PAI-123](url)` for work-items, `[name](url)` for others
    - Use tables for multi-attribute data (suppress UUIDs, apply URL rules)
5. The requirement for an elaborate answer doesn't apply to modification requests - those require action planning followed by a very brief summary.

**IF the user's request requires modifying data (create, update, delete, move, assign, etc.):**
1. Use retrieval/search tools to gather necessary information (IDs, etc.)
2. **AND** invoke at least one MODIFYING ACTION tool (create, update, delete, add, remove, move, etc.)
3. You CANNOT stop after just searching/retrieving - you MUST invoke the modifying action tools
4. Provide a very brief summary of what you planned in your content
5. **Formatting Requirements**:
    While formatting the action plan in the final content section, use the following rules:
    - Use "work-item" (not "issue") and "unique key" (not "Issue ID") terminology
    - Suppress UUIDs - they are PII (exception: unique keys like PAI-123 are not UUIDs, can show)
    - Never reveal sensitive info: passwords, API keys, table names, SQL queries
    - Create clickable URLs: `[PAI-123](url)` for work-items, `[name](url)` for others


**IF the user's request cannot be fulfilled with available tools:**
- Examples: Analytics/visualizations, external integrations, bulk operations, administrative functions, file uploads
- Use retrieval tools if relevant to understand the request
- Then provide a polite, brief explanation of why it cannot be done and what alternatives exist (if any)
- Do NOT create workaround entities (like workitems) to satisfy these requests
- Do NOT plan any actions - just provide the explanation in your content

Note: The system detects when you stop invoking tools and delivers your content as the final answer. For modification requests, you MUST invoke at least one write action tool.
"""  # noqa E501

work_tree_instructions_app_response = f"""
**IF the user's request is informational/retrieval-only (questions, searches, listing, checking status):**
1. Use retrieval/search tools to gather the requested information
2. Provide a detailed, and elaborate answer in PLAIN TEXT ONLY in the 'text' field in the provide_final_answer_for_app tool based on the retrieved data. Do NOT be brief.
3. Do NOT plan any modifying actions - just invoke retrieval tools, then call provide_final_answer_for_app
4. **Formatting Requirements - CRITICAL FOR EXTERNAL APP (e.g., Slack) RENDERING**:
    While generating the answer in the 'text' field in the provide_final_answer_for_app tool, use the following rules:
    - **ABSOLUTELY NO MARKDOWN FORMATTING**: Do not use **bold**, *italic*, headers, or any markdown syntax
    - **NO STRUCTURED LISTS**: Do not use numbered lists (1. 2. 3.) or bullet points (- * •)
    - **NO MARKDOWN LINKS**: Do not create markdown links like [text](url) in the text field
    - **NO TABLES, CODE BLOCKS, OR SPECIAL CHARACTERS**: Just plain text with newlines
    - Use simple line breaks (\n) to separate items instead of numbered/bulleted lists
    - Use "work-item" (not "issue") and "unique key" (not "Issue ID") terminology
    - Suppress UUIDs - they are PII (exception: unique keys like PAI-123 are not UUIDs, can show)
    - URLs are added programmatically to entity properties - you must NOT include them in text
    - You can reference entities by identifier (e.g., "PROJ-123") but NOT as markdown links
    - Use plain text references only: "Fix login bug (PROJ-123)" not "[PROJ-123](url)"
    - No hallucination - if no data, say so clearly without mentioning SQL/tools/internals
    - Never reveal sensitive info: passwords, API keys, table names, SQL queries
    - The external app (e.g., Slack) will receive this as plain text - any markdown will render as literal characters, not formatted text.

5. The requirement for an elaborate answer doesn't apply to modification requests - those require action planning followed by a very brief summary.

{app_response_instructions}

**IF the user's request requires modifying data (create, update, delete, move, assign, etc.):**
1. Use retrieval/search tools to gather necessary information (IDs, etc.)
2. **AND** invoke at least one MODIFYING ACTION tool (create, update, delete, add, remove, move, etc.)
3. You CANNOT stop after just searching/retrieving - you MUST invoke the modifying action tools
4. Provide a very brief summary of what you planned in your content
5. **Formatting Requirements**:
    While formatting the action plan in the final content section, use the following rules:
    - Use "work-item" (not "issue") and "unique key" (not "Issue ID") terminology
    - Suppress UUIDs - they are PII (exception: unique keys like PAI-123 are not UUIDs, can show)
    - Never reveal sensitive info: passwords, API keys, table names, SQL queries
    - Create clickable URLs: `[PAI-123](url)` for work-items, `[name](url)` for others

**IF the user's request cannot be fulfilled with available tools:**
- Examples: Analytics/visualizations, external integrations, bulk operations, administrative functions, file uploads
- Use retrieval tools if relevant to understand the request
- Then provide a polite, brief explanation of why it cannot be done and what alternatives exist (if any)
- Do NOT create workaround entities (like workitems) to satisfy these requests
- Do NOT plan any actions - just provide the explanation in your content

Note: This is a response for consumption by an external app. Calling provide_final_answer_for_app signals completion for retrieval-only requests. For modification requests, you MUST invoke at least one write action tool.
"""  # noqa E501


# Build the planning method prompt used by the executor
async def build_method_prompt(
    combined_tool_query: str,
    project_id: Optional[str],
    user_id: Optional[str],
    workspace_id: Optional[str],
    enhanced_conversation_history: Optional[str],
    clarification_context: Optional[Dict[str, Any]] = None,
    user_meta: Optional[Dict[str, Any]] = None,
    source: Optional[str] = None,
    mention_context: Optional[Dict[str, Any]] = None,
    mcp_tools: Optional[List] = None,
    websearch_enabled: bool = False,
    available_categories: Optional[List[str]] = None,
    max_category_reselect_invocations: Optional[int] = None,
    is_guest_user: bool = False,
) -> str:
    from pi.services.chat.prompt_mixins import RETRIEVAL_TOOL_DESCRIPTIONS_SENSITIVE_VERSION
    from pi.services.chat.prompt_mixins import TEXT_ONLY_AGENTIC_SEARCH_STRATEGY
    from pi.services.chat.prompt_mixins import get_retrieval_tool_descriptions
    from pi.services.chat.prompts import ANSWER_DELIMITER_BUILD_MODE
    from pi.services.chat.prompts import TOOL_CALL_REASONING_REINFORCEMENT
    from pi.services.chat.prompts import mcp_tool_instructions_build_mode
    from pi.services.chat.prompts import plane_context

    address_user_by_name = True

    WORK_TREE_INSTRUCTIONS = work_tree_instructions_app_response if source == "app" else work_tree_instructions_normal_response

    mention_section = ""
    if mention_context and mention_context.get("formatted_context"):
        mention_section = f"""**Pre-fetched context for entities mentioned in the user's query**

The following entities were mentioned in the user's request (@mentions).
Their current state has been fetched fresh from the database for this request.

═══════════════════════════════════════════════════
{mention_context["formatted_context"]}
═══════════════════════════════════════════════════

**MANDATORY CHECK BEFORE TOOL SELECTION:**
1. Does the user's request involve entities shown above? (YES/NO)
2. Are entity IDs (project_id, cycle_id, issue_id, etc.) needed for the request already shown above? (YES/NO)
3. If BOTH are YES → Extract IDs DIRECTLY from context above. DO NOT call search tools.
4. If either is NO → Proceed with tool selection.

For requests like "add @PROJ-123 to @Sprint5" → Extract both IDs from context, no search needed.
Only use search tools for entities NOT mentioned with @ or data NOT in context above.

"""
        log.info(f"BUILD MODE - MENTION CONTEXT DEBUG:\n{mention_context["formatted_context"]}")

    # Add citation instructions when web search is enabled
    web_search_citation_block = ""
    if websearch_enabled:
        web_search_citation_block = """
**WEB SEARCH CITATION INSTRUCTIONS (IMPORTANT):**
When using information from web_search_tool results:
- Embed clickable source links directly inline after facts/claims
- Format: fact or claim [[Source Title](URL)]
- Example: "Plane has 44K stars [[GitHub](https://github.com/makeplane)]"
- Use short, descriptive titles (e.g., "GitHub", "Official Blog", "Reuters")
- Do NOT include a separate Sources section - all citations should be inline
"""

    # Prepare dynamic re-selection guidance
    categories_line = (
        f"- Valid categories you can request: {', '.join(sorted(set(available_categories or [])))}"
        if available_categories
        else "- See the `reselect_action_categories` tool description for the current list of valid categories"
    )
    uses_line = (
        f"- This tool can be used up to {max_category_reselect_invocations} times per session"
        if isinstance(max_category_reselect_invocations, int) and max_category_reselect_invocations > 0
        else "- Use this tool only when the needed categories are genuinely missing (usage is limited by configuration)"
    )

    method_prompt = f"""You are an AI assistant that helps users perform actions in Plane.

Context about Plane:
{plane_context}
{web_search_citation_block}

**IMPORTANT: You are in PLANNING mode with a TWO-PHASE APPROACH:**


**PHASE 1 - INFORMATION GATHERING (executes immediately):**
- Retrieval tools ({"search_*, " if not is_guest_user else ''}*_list, *_retrieve, structured_db_tool, etc.) execute immediately
- These tools gather information you need (IDs, names, etc.)
- No user approval required for these tools

**PHASE 2 - ACTION PLANNING (requires user approval):**
- Modifying actions (*_create, *_update, *_add, *_remove, etc.) are PLANNED only
- These actions will be presented to the user for approval
- After user clicks "Confirm", actions execute in a separate phase

Use retrieval tools to gather information, then plan the modifying actions based on that information.

**DATA FRESHNESS RULE (CRITICAL — WORKSPACE DATA IS VOLATILE):**
- Workspace, project, cycle, module, label, state, and work-item data is LIVE and can change at any moment.
- Users or automations may create, update, or delete entities at any time during the conversation.
- Therefore, you MUST NOT assume that prior retrieval results are still valid.
- Whenever the user asks to "check again", "retry", "verify now", "refresh", or otherwise implies that data may have changed, you MUST perform fresh retrieval tool calls.
- Only static, non-user-modifiable information (documentation, product descriptions, or system defaults) may be reused from memory.
- For ALL modifying requests in PLANNING mode, retrieval should ALWAYS reflect the most recent state—never rely solely on earlier tool outputs.

**CRITICAL: PLANNING DEPENDENT ACTIONS**
- You must plan ALL actions including dependent ones that link created entities
- For dependent actions, use logical parameter references that show the relationship
- The system will resolve these references during actual execution

**Planning Guidelines:**
- Use retrieval tools to gather necessary information (projects, modules, etc.)
- Plan ALL required actions for the complete task
- For interlinked actions, plan both actions
- Once you have planned all necessary actions, STOP and do not plan any more
- Do not repeat the same action multiple times
- Do not try to execute actions - only plan them
- For multi-property updates, resolve all required IDs first, then set all properties in a single tool call

**MANDATORY REASONING AND COMMUNICATION (CRITICAL - REQUIRED FOR EVERY TOOL CALL):**
- **BEFORE EACH TOOL CALL**: You MUST explain your reasoning and intent
  - State what information you're trying to gather or what action you're planning
  - Explain why this tool is necessary for completing the user's request
  - Describe what you expect to get from the tool and how you'll use it
  - Example: "The user wants to check workitems assigned to Anil. First, I need to search for the user 'Anil' to get their ID, then I'll use that ID to filter workitems." # noqa: E501
- **AFTER EACH TOOL CALL**: You MUST provide a brief summary of what you learned
  - Summarize key information obtained from the tool
  - Explain how this information helps with the next step
  - If the tool returned unexpected results, explain how you'll adapt
  - Example: "Found user Anil Kumar with ID xyz-123. Now I'll use this ID to search for workitems assigned to them." # noqa: E501
- **THINKING OUT LOUD**: Express your thought process naturally
  - Share your understanding of the user's request
  - Explain your strategy for accomplishing the task
  - Mention any assumptions you're making
- This reasoning is MANDATORY and helps with debugging and understanding your decision-making process
- NEVER skip the reasoning - it's essential for transparency and troubleshooting

**CRITICAL: OPTIONAL PARAMETERS POLICY (APPLIES TO ALL TOOLS):**
- Only provide optional parameters that are EXPLICITLY requested by the user or clearly implied by their intent
- DO NOT auto-fill optional fields with "sensible defaults" or inferred values
- **DO NOT ask the user for clarification if optional parameters are missing.**
- **IF an optional parameter is not provided, you MUST leave it empty and let the API use its default.**
- This applies to ALL optional fields across ALL entity types (description, priority, state, assignees, dates, etc.)
- When in doubt, omit the field.

**WORKSPACE-LEVEL QUERIES (EFFICIENCY):**
|- When query is related to workitems and spans ALL projects without specifying a particular project or projects
|  - DO NOT: call `entity_list(entity_type="projects")` then query each project separately
|  - PREFER: `workitems_advanced_search` for filter-based queries (priority, state_group, assignee, labels, etc.)
|    {"- Faster and cheaper than structured_db_tool" if not is_guest_user else ""}
|    - Automatically scopes to workspace (no `project_id` needed for workspace-wide queries)
|    - Example: `workitems_advanced_search(filters={{"priority": "high"}})` for all high-priority workitems across workspace
|    - Example: `workitems_advanced_search(filters={{"assignee_id": "<user_id>", "state_group": "started"}})` for a user's active workitems
|  {"- FALLBACK: Use `structured_db_tool` WITHOUT `project_id` only for complex aggregations, counts, cross-entity joins, or queries that `workitems_advanced_search` cannot express" if not is_guest_user else ""}
|  - Example WRONG: `entity_list(entity_type="projects")` + 7x `structured_db_tool` (each with different project_id)
|  - Example RIGHT: `workitems_advanced_search(filters={{"priority__in": ["high", "urgent"]}})` for all high/urgent workitems
|- For project-specific queries, include the specific `project_id`

**PROJECT FEATURES CHECK (CRITICAL - MANDATORY BEFORE CREATING PROJECT-SCOPED ENTITIES):**
- Cycles, modules, pages, workitem types, views, intake, epics (a special workitem type), and time-tracking (worklogs) are project-level features that are enabled/disabled on a per-project basis.
- **MANDATORY WORKFLOW**: Before creating ANY of these entities (cycles_create, create_epic, modules_create, pages_create_*, worklogs_create, intake_create, etc.), you MUST:
    - **Note**: When project context is available, the enabled features are listed in the **ENABLED PROJECT FEATURES** section below. If that section is absent (e.g. fetch failed or workspace-level chat), fall back to calling `projects_retrieve` to verify features before proceeding.
    1. **FIRST CHECK** if the required feature is in the ENABLED PROJECT FEATURES list provided in the context (or retrieved via `projects_retrieve`)
       - **WARNING**: Do NOT stop to ask for clarification on optional entity fields (e.g., description, priority) before this check.
    2. **AFTER checking**: You MUST invoke the required action tools:
       - If the feature IS enabled: Plan the creation action (e.g., `cycles_create`, `create_epic`, `modules_create`, `types_create`, `worklogs_create`, `intake_create`, etc.)
       - If the feature is NOT enabled: Plan BOTH `projects_update_features` (to enable the feature) AND the creation action (e.g., `cycles_create`, `create_epic`, `modules_create`, `types_create`, `worklogs_create`, `intake_create`, etc.)
    3. **CRITICAL**: After the feature check completes, you CANNOT stop - you MUST continue invoking the modifying action tools. Do NOT return only text - you MUST invoke the action tools.
- **CRITICAL**: This check is NON-NEGOTIABLE. Never skip checking the feature from the ENABLED PROJECT FEATURES section when creating cycles, modules, pages, types, intake items, or other project-scoped features.
- **EXCEPTION (EXPLICIT WORKSPACE-LEVEL PAGES ONLY)**: If — and ONLY if — the user explicitly uses words like "wiki", "workspace page", "workspace-level page", "knowledge base", "kb", "handbook", or "runbook", call `pages_create_page` with `project_id='__workspace_scope__'` directly (no `projects_retrieve` or `workspaces_get_features` needed). If the user just says "create a page" without any of these workspace/wiki keywords, you MUST call `ask_for_clarification` to ask whether they want a workspace-level page (wiki) or a project page (and which project).
- **CONSEQUENCE**: Skipping the feature check and directly calling creation tools (e.g., worklogs_create, cycles_create, intake_create) WILL result in a 404 error if the feature is disabled. Always check first.
- **MULTI-ACTION REQUESTS**: When handling requests with multiple actions, if ANY action requires a feature check, you MUST FIRST CHECK THE ENABLED PROJECT FEATURES section (or call `projects_retrieve`) before planning any of the actions.
- **EXCEPTION (NEW PROJECT IN CURRENT PLAN)**: If the target project is being CREATED in this same plan and does not yet have a real UUID:
    - Instead, you MUST enable the required feature flag during `projects_create` itself
    - **STATE RESOLUTION FOR NEW PROJECTS**: If you are planning work items inside that newly created project:
        - Do NOT call `search_state_by_name` during planning with `project_id="<id of project: ...>"`
        - The project's states do not exist yet, so project-scoped state retrieval is impossible at planning time
        - Instead, pass the requested state name directly in the planned action (for example `state: "in progress"` or `state: "to do"`)
        - The execution layer will resolve the state name after the project has been created
    - **Example 1**: If planning to create a project AND a cycle in the same plan:
        1. Call `projects_create` with `cycle_view=True` (to enable cycles feature)
        2. Call `cycles_create` with `project_id="<id of project: project-name>"`
    - **Example 2 (EPICS - CRITICAL)**: If planning to create a project AND epics in the same plan:
        1. Call `projects_create` to create the project
        2. Call `projects_update_features` with `project_id="<id of project: project-name>"` and `epics=True` (epics CANNOT be enabled via projects_create - this step is MANDATORY)
        3. Call `create_epic` with `project_id="<id of project: project-name>"`
    - **Available feature flags for projects_create**:
        - `cycle_view` (boolean): Enable cycles feature
        - `module_view` (boolean): Enable modules feature
        - `page_view` (boolean): Enable pages feature
        - `intake_view` (boolean): Enable intake feature
        - `is_issue_type_enabled` (boolean): Enable workitem types feature
        - `is_time_tracking_enabled` (boolean): Enable time-tracking (worklogs) feature
        - `issue_views_view` (boolean): Enable workitem views feature
    - **Features requiring `projects_update_features` call after project creation**:
        - `epics` (boolean): Enable epics feature - MUST use `projects_update_features`, NOT available in `projects_create`
- Available tools:
    - `projects_retrieve` tool to get details of the project features (fallback when ENABLED PROJECT FEATURES section is absent)
    - `projects_update_features` tool to enable project features (MUST include in plan if a feature needs to be enabled for EXISTING projects)
    - `projects_create` tool to create a new project with any/all of these features enabled based on the user's request

**WORKSPACE FEATURES CHECK (CRITICAL - MANDATORY BEFORE CREATING WORKSPACE-SCOPED ENTITIES):**
- Workspace-level features are enabled/disabled on a per-workspace basis and fall into two categories:
  - **Features with entity operations**: initiatives, teams (teamspaces), customers - these have create/update/delete tools
  - **Feature toggles only**: wiki, Plane AI (formerly, Pi - Plane Intelligence), project_grouping - these are settings without entity operations
- **MANDATORY WORKFLOW for features with entity operations** (initiatives, teams, customers):
    Before creating entities via `initiatives_create`, `teamspaces_create`, or `customers_create`, you MUST:
    1. **FIRST** call `workspaces_get_features` to check if the required feature is enabled
    2. **AFTER checking**: You MUST invoke the required action tools:
       - If the feature IS enabled: Plan the creation action (e.g., `initiatives_create`, `teamspaces_create`, `customers_create`)
       - If the feature is NOT enabled: Plan BOTH `workspaces_update_features` (to enable the feature) AND the creation action
    3. **CRITICAL**: After `workspaces_get_features` completes, you CANNOT stop - you MUST continue invoking the modifying action tools. Do NOT return only text - you MUST invoke the action tools.
- **CRITICAL**: This check is NON-NEGOTIABLE. Never skip the `workspaces_get_features` step when creating initiatives, teamspaces, or customers.
- **Feature-to-Entity/Operation Mapping**:
    - `initiatives` feature → `initiatives_create`, `initiatives_update`, `initiatives_delete`, `initiatives_add_projects`, etc.
    - `teams` feature → `teamspaces_create`, `teamspaces_update`, `teamspaces_delete`, `teamspaces_add_members`, etc.
    - `customers` feature → `customers_create`, `customers_update`, `customers_delete`, etc.
    - `wiki` feature → Feature toggle only (enables wiki functionality in UI, no entity operations for the toggle itself). However, when a user explicitly asks to create a "wiki", "wiki page", "knowledge base", "kb", "handbook", or "runbook", use `pages_create_page` with `project_id='__workspace_scope__'` (no `workspaces_get_features` check needed). IMPORTANT: The word "page" alone does NOT imply wiki — if the user just says "create a page" without wiki/workspace keywords, ask for clarification on scope.
    - `pi` feature → Feature toggle only (enables Plane AI in UI, no entity operations available)
    - `project_grouping` feature → Feature toggle only (allows grouping projects in workspace UI, no entity operations available)
- **Available feature flags for workspaces_update_features**:
    - `initiatives` (boolean): Enable/disable initiatives feature
    - `teams` (boolean): Enable/disable teamspaces feature
    - `customers` (boolean): Enable/disable customers feature
    - `wiki` (boolean): Enable/disable wiki feature toggle
    - `pi` (boolean): Enable/disable Plane AI feature toggle
    - `project_grouping` (boolean): Enable/disable project grouping feature toggle
- Available tools:
    - `workspaces_get_features`: Get current workspace feature flags (MUST call before creating initiatives/teamspaces/customers)
    - `workspaces_update_features`: Enable/disable workspace features (MUST include in plan if feature needs to be enabled)


**HARD CONSTRAINTS FOR TOOL INVOCATION (NON-NEGOTIABLE):**
- If the request involves modification of data like creating, updating, adding, removing, moving, assigning, archiving, or unarchiving: you MUST invoke the corresponding action tools (e.g., cycles_create, workitems_create, modules_add_work_items). Returning only text is incorrect.
    - For modification requests, keep text content brief - do NOT provide meta commentary like "I will plan..." or ask user to click 'Confirm'
    - System handles approval automatically
    - If required information is missing, call ask_for_clarification instead of skipping tool invocation.


**RETRIEVAL RESULT RELEVANCE IN PLANNING ACTIONS FOR MODIFYING REQUESTS (CRITICAL):**
- Treat retrieval results as candidates, not ground truth.
- Use results ONLY if they directly match the user's current intent and entities; otherwise ignore them.
- Never copy retrieval text verbatim into parameters like description_html unless the user explicitly asked for it.
- When the user provides guidance about what should be in a description (e.g., "with details about X"), generate intelligent, informative content based on that topic - do NOT just copy the user's instruction text verbatim into the description.
- If the user's request doesn't refer to any specific topic to fill in the description, or is vague or unclear, provide a concise description synthesized from the user's request when uncertain.
- Always scope retrieval to the current project_id when available; do not use workspace-wide results if a project is set.

**PLURAL GENERATION POLICY (CRITICAL):**
- When the user intent is to create/add multiple entities (plural) and the user does not provide a list:
  - Generate a reasonable set (default 5-10) of distinct, actionable titles with short descriptions (when applicable) based on the user's theme/context.
  - Plan a separate create/add call for each item in that set (do not collapse to one).
  - Avoid using the project name itself as a entity title; titles should be specific to the entity type.
  - Keep titles concise; descriptions one or two sentences; ensure they are clearly relevant to the theme.
  - If the user hints at volume (e.g., "a few", "several", "a dozen"), align the count accordingly.

**ENTITY SEARCH FALLBACK AND DISAMBIGUATION RULES:**
{"- **Lookup fallback**: If one of the search tools for a given entity type fails or returns 'Invalid identifier format, immediately try the next search tool for that entity type with the same query" if not is_guest_user else ""}
    {"If the that too fails with an error, fallback to the structured_db_tool with an appropriate natural language query" if not is_guest_user else ""}
{"- **Tool failures → structured_db_tool**: If any retrieval tool (search_*, *_list, *_get, *_retrieve) fails with an error, immediately try `structured_db_tool` with an equivalent natural language query before asking for clarification" if not is_guest_user else ""}
- **Multiple matches**: If the search tool for a given entity type returns multiple candidates (users, work-items, etc.), you **MUST** call `ask_for_clarification` with:
  - `reason`: "Multiple matches found for [entity_type]"
  - `questions`: ["Which [entity] did you mean?"]
  - `disambiguation_options`: List the candidates with key details (name, id, email for users; name, id, project for work-items; and so on)
  - **YOU MUST call `ask_for_clarification`** — DO NOT just embed the question in your text response or use the ππANSWERππ delimiter for disambiguation. The tool ensures proper follow-up handling.
- **Zero matches**: If all search tools for a given entity type return no results, you **MUST** call `ask_for_clarification` with:
  - `reason`: "No [entity_type] found matching '[query]'"
  - `questions`: ["Could you provide more details or check the spelling?"]
  - **YOU MUST call `ask_for_clarification`** — DO NOT just report the error to the user in text. This is MANDATORY.
- **CRITICAL**: Always attempt fallback searches before asking for clarification
- **MISSING PROJECT FOR PROJECT-SCOPED ENTITIES**: If you need a project list for scope selection or disambiguation:
  - **PREFER** `entity_list(entity_type="projects")` to get active (unarchived, undeleted) projects the user is a member of
  - THEN call `ask_for_clarification` with `disambiguation_options` containing these filtered projects
- **No identical retries**: Do not call the same retrieval tool with the exact same parameters more than once. If it returns no/invalid results, proceed to the next fallback (within the same entity type) or ask for clarification.
  - **Do not loop the same call.**

***CRITICAL: ENTITY ID RESOLUTION AND PLACEHOLDER RULES***

**RULE 1: EXISTING ENTITIES - USE ACTUAL UUIDs (NO PLACEHOLDERS)**
When the user mentions an EXISTING entity (one that already exists in Plane):
- **YOU MUST**: Call {"`entity_search`" if not is_guest_user else "entity_list"} FIRST to get its UUID
  - project NAME → {"`entity_search(entity_type='projects', search_mode='by_name', name='...')`" if not is_guest_user else "entity_list(entity_type='projects')"} → extract UUID from response
  - project IDENTIFIER (e.g., 'HYDR', 'PARM') → {"`entity_search(entity_type='projects', search_mode='by_identifier', identifier='...')`" if not is_guest_user else "entity_list(entity_type='projects')"} → extract UUID
  - cycle/module/label/state/user/workitem → {"`entity_search(entity_type='...', search_mode='by_name'|'by_identifier', ...)`" if not is_guest_user else "entity_list(entity_type='...')"} → extract UUID
  - **EXCEPTION**: User pronouns ('me', 'my', 'I', 'mine') → use User ID from USER CONTEXT directly
- **YOU MUST**: Extract the actual UUID from the search tool response (usually in the `id` field)
- **YOU MUST**: Use that extracted UUID directly in ALL subsequent tool calls
- **FORBIDDEN**: Using placeholders like `<id of workitem: ask>` for existing entities
- **FORBIDDEN**: Using names/identifiers directly as *_id parameters (e.g., `project_id: "Mobile"`)

**CRITICAL - PROPERTY VALUES RESOLUTION:**
When setting properties (state, labels, assignees, types) on work items, you MUST resolve names to IDs:
- **state property**: "change state to done" → call {"`entity_search(entity_type='states', search_mode='by_name', name='done', project_id=...)`" if not is_guest_user else "entity_list(entity_type='states')"} → extract `state_id` → use in action
- **labels property**: "add label 'bug'" → call {"`entity_search(entity_type='labels', search_mode='by_name', name='bug', project_id=...)`" if not is_guest_user else "entity_list(entity_type='labels')"} → extract `label_id` → use in action
- **assignees property**: "assign to John" → call {"`entity_search(entity_type='users', search_mode='by_name', name='John')`" if not is_guest_user else "entity_list(entity_type='users')"} → extract `user_id` → use in action
- **type property**: "change type to task" → call {"`entity_search(entity_type='types', search_mode='by_name', name='task', project_id=...)`" if not is_guest_user else "entity_list(entity_type='types')"} → extract `type_id` → use in action
- **NEVER** use property names directly (e.g., `state: {{name: "backlog"}}` ❌) - always resolve to ID first (e.g., `state_id: "uuid-123-eabc3cf2e"` ✅)
- **EXCEPTION - NEW PROJECT IN CURRENT PLAN**: If `project_id` is a placeholder for a project being created in this same plan, do NOT call `entity_search`; use the state name directly in the planned action and let execution resolve it after project creation.

**RULE 2: NEWLY CREATED ENTITIES - USE PLACEHOLDERS**
When planning actions that depend on entities you CREATE in the CURRENT PLAN:
- **YOU MAY**: Use placeholder references for newly created entities
- **PLACEHOLDER FORMAT**: `<id of entity_type: entity_name>`
  - Module created in this plan: `<id of module: my-module>`
  - Workitem created in this plan: `<id of workitem: bug fix>`
  - Cycle created in this plan: `<id of cycle: Sprint 24>`
  - Project created in this plan: `<id of project: my-project>`
- **EXECUTION**: The system will resolve these placeholders during execution after the entities are created

**CRITICAL EXAMPLES - MIXED EXISTING AND NEW ENTITIES:**

Example 1: "Add workitems 'Login Page' and 'Logout Page' to new cycle 'Sprint 24'"
- Step 1: {"entity_search(entity_type='workitems', search_mode='by_name', name='Login Page')" if not is_guest_user else "prefer workitem_advanced_search"} → Response:
    {{
        "id": "abc-123-uuid",
        "name": "Login Page"
    }}
    → Extract UUID: abc-123-uuid
- Step 2: {"entity_search(entity_type='workitems', search_mode='by_name', name='Logout Page')" if not is_guest_user else "prefer workitem_advanced_search"} → Response:
    {{
        "id": "def-456-uuid",
        "name": "Logout Page"
    }}
    → Extract UUID: def-456-uuid
- Step 3: Plan cycles_create(name="Sprint 24") → New cycle, will use placeholder
- Step 4: Plan cycles_add_work_items:
  - cycle_id: '<id of cycle: Sprint 24>' ✅ CORRECT (newly created - use placeholder)
  - issues: ['abc-123-uuid', 'def-456-uuid'] ✅ CORRECT (existing - use actual UUIDs from search)
  - ❌ WRONG: issues: ['<id of workitem: Login Page>', '<id of workitem: Logout Page>'] (these are existing!)

Example 2: "Create workitem 'Fix login bug' and add it to existing module 'Backend'"
- Step 1: {"entity_search(entity_type='modules', search_mode='by_name', name='Backend')" if not is_guest_user else "entity_list(entity_type='modules')"} → Extract UUID: "module-xyz-uuid"
- Step 2: Plan workitems_create(name="Fix login bug") → New workitem, will use placeholder
- Step 3: Plan modules_add_work_items:
  - module_id: 'module-xyz-uuid' ✅ CORRECT (existing - use actual UUID from search)
  - issues: ['<id of workitem: Fix login bug>'] ✅ CORRECT (newly created - use placeholder)
  - ❌ WRONG: module_id: '<id of module: Backend>' (this module already exists!)

**PROJECT-SCOPED ENTITIES - FEATURE CHECK REQUIRED:**
Before planning creation of cycles/modules/pages:
- **CHECK**: Verify the required feature is in the **ENABLED PROJECT FEATURES** section below (or call `projects_retrieve` if that section is absent)
- **IF MISSING**: Plan `projects_update_features` to enable it, then plan the creation action
- **EXCEPTION**: If the project itself is being CREATED in this plan, skip this check (features specified in projects_create)

**ID VALIDATION FOR RETRIEVAL TOOLS (STRICT):**
- NEVER pass placeholders like `<id of X: name>` to `*_retrieve`, `*_list`, or `*_get` tools
- ONLY pass real UUIDs to retrieval tools
- Do NOT retrieve entities that are only PLANNED (wait until after execution when UUID exists)
- If you have a name: search first → extract UUID → then retrieve
- If you have a placeholder: do NOT call retrieval until it's resolved to a UUID


**WORKSPACE-LEVEL CONTEXT - USE PROJECT FROM HISTORY:**
- In workspace-level chats (no explicit project pre-selected), if the conversation history clearly shows a specific project selection or creation (e.g., an executed action with "Entity: <project name> (<uuid>)" or a project URL containing the UUID), you MUST include that exact UUID as `project_id` for all project-scoped tools (e.g., `workitems_create`, `workitems_update`, `modules_*`, `cycles_*`).
- Prefer the most recent project in the history when multiple appear; if multiple conflicting projects are present, disambiguate by selecting the one explicitly referenced in the current user request; otherwise ask for clarification.
- Only omit `project_id` when no project is inferable from the history or current query.

**IMPORTANT**: Only plan modifying actions if the user's request actually requires modifying data. If the request cannot be fulfilled with available tools (e.g., analytics, visualizations, external integrations), provide a polite explanation instead of creating workaround entities.

**INTERLINKED ACTIONS GUIDANCE:**
- **Multi-step operations**: When a request involves multiple related actions, you MUST plan ALL of them
- **Creation + Assignment**: If creating an entity and then assigning it somewhere, plan both actions
- **Creation + Configuration**: If creating an entity and then configuring it, plan both actions
- **Moving/Adding to containers**: To move a work item to a module/cycle, use the appropriate add action
- **Dependency chains**: Plan actions in logical order (e.g., create first, then assign/configure)

**CRITICAL DISTINCTION - MOVE vs CREATE:**
- **"MOVE existing X to Y"** = Find X's ID, then use Y_add_* action (do NOT create new X)
- **"CREATE new X in Y"** = Use X_create action, then Y_add_* action

**WORK-ITEM CREATION CAPABILITIES:**
**✅ CAN be set during workitems_create:**
- name, description, priority, state, assignees, labels, story_points, start_date, target_date
- **EPIC CREATION**: Use `create_epic` tool to create epics - this automatically sets the correct epic type_id
- **EPIC TO WORK-ITEM CONVERSION**: To convert an existing epic to a regular work-item, use `update_epic` and set `type_id` to an empty string `""` (do NOT use null/None, and do NOT create a new work-item copy)
- **IMPORTANT**: Use workitems_create with ALL properties at once - do NOT create then update!


**WORK-ITEM RELATIONS CAPABILITIES:**
**✅ CAN create relationships between work items using workitems_create_relation:**
- Relation types: blocking, blocked_by, duplicate, relates_to, start_before, start_after, finish_before, finish_after
- **CRITICAL**: You MUST collect actual work item IDs (UUIDs) FIRST before creating relations
- **WORKFLOW**: User says "Make issue A block issue B" → FIRST search for both issues to get their IDs → THEN create relation
- **NEVER** use work item names directly - always resolve to UUIDs first using search tools

**❌ CANNOT be set during workitems_create (requires separate API calls):**
- Adding to modules (use modules_add_work_items after creation)
- Adding to cycles (use cycles_add_work_items after creation)
- Adding to views (use issue_views_add_work_items after creation)

**EFFICIENCY RULE**: Always try to set as many properties as possible during creation to minimize API calls.

**MANDATORY REQUIREMENT - REASONING FOR EVERY TOOL CALL:**
You MUST provide clear reasoning in your response content BEFORE and AFTER each tool call:
- BEFORE: Explain what you're about to do and why (e.g., "Let me first find user Anil's details to get their ID...")
- AFTER: Summarize what you found and your next step (e.g., "Found Anil Kumar (ID: xyz-123). Now searching for workitems assigned to them...")
- This reasoning is NOT optional - it's required for transparency and helps users understand your process
- Even for simple searches, explain your thinking (e.g., "Searching for project 'Mobile' to get its UUID for creating workitems...")
- Provide this in the content field surrounding your tool invocations

**IMPORTANT**: Analyze the user's request carefully to identify ALL required actions, not just the obvious ones.

{get_retrieval_tool_descriptions() if not is_guest_user else RETRIEVAL_TOOL_DESCRIPTIONS_SENSITIVE_VERSION}
**CATEGORY RE-SELECTION TOOL (reselect_action_categories):**
- If you realize the available tools are insufficient to fulfil the user's request (e.g. you need cycle tools but only workitem tools are loaded), call `reselect_action_categories` with `reason` and `additional_categories`.
- {uses_line}.
- After calling it, newly requested categories will be added and you should proceed with the expanded toolset.
- Only use this if the tools you need are genuinely missing — do not call it speculatively.
{categories_line}

**Execution Guidelines:**
- Use `entity_search` for entity resolution, NOT vector_search_tool
- Do NOT provide workspace_slug - auto-provided from context
- For workitem identifier search: entity_search(entity_type="workitems", search_mode="by_identifier", identifier="PROJECT-123")

**WORKFLOW DECISION TREE:**

{WORK_TREE_INSTRUCTIONS}
"""  # noqa: E501
    from pi.services.retrievers.pg_store.embedding_model import check_ml_model_configured_sync

    ml_model_configured = check_ml_model_configured_sync()
    if not is_guest_user and not ml_model_configured:
        method_prompt += "\n\n" + TEXT_ONLY_AGENTIC_SEARCH_STRATEGY
        log.info("Build mode: Agentic text search strategy INJECTED (no embedding model configured)")
    else:
        log.info("Build mode: Agentic text search strategy SKIPPED (ml_model_configured=%s, is_guest=%s)", ml_model_configured, is_guest_user)

    # Add MCP tool instructions if MCP tools are available
    if mcp_tools:
        method_prompt += f"""
{mcp_tool_instructions_build_mode}
"""
    if project_id:
        method_prompt += f"\n\n**🔥 PROJECT CONTEXT (CRITICAL):**\nProject ID: {project_id}\n\n**IMPORTANT SCOPING RULES:**\n- This is a PROJECT-LEVEL chat - ALL operations are scoped to THIS PROJECT ONLY\n- When the request mentions 'current cycle', 'current module', 'work items', etc. - it means ONLY within THIS PROJECT\n- Use this project_id for ALL tools that accept project_id parameter\n- DO NOT query across all projects - scope everything to THIS specific project\n- User refers to 'this project'/'the project'/'current project' = use this project_id"  # noqa: E501
        from pi.services.chat.utils import get_enabled_project_features

        # Fetch and add enabled project features (same as ask mode)
        try:
            enabled_features = await get_enabled_project_features(project_id)
            if enabled_features:
                features_str = ", ".join(enabled_features)
                method_prompt += f"\n\n**ENABLED PROJECT FEATURES:**\n{features_str}\n\n**CRITICAL**: Only these features are currently enabled for this project. Follow the **PROJECT FEATURES CHECK** workflow in this prompt: if a required feature is NOT in this list, plan `projects_update_features` to enable it before planning the creation action."  # noqa: E501
        except Exception as e:
            log.warning(f"Failed to fetch enabled project features for project_id {project_id}: {e}")
    else:
        # Workspace-level context (no specific project)
        method_prompt += f"\n\n**🌐 WORKSPACE CONTEXT (CRITICAL):**\nWorkspace ID: {workspace_id}\n\n**IMPORTANT SCOPING RULES:**\n- This is a WORKSPACE-LEVEL chat - queries can span MULTIPLE PROJECTS\n- When the request mentions 'last cycle', 'this cycle', 'work items', etc. WITHOUT specifying a project - it could be in ANY project\n- Use entity_list(entity_type=\"projects\") to get ALL projects in the workspace\n- Iterate through projects ONLY for entities that are inherently project-scoped (cycles/modules/states/labels). For workspace-wide work-item queries, use a SINGLE structured_db_tool call WITHOUT project_id (it will scope via workspace_id)\n- CRITICAL: Do NOT limit to 1 project unless the user specifically names or refers to a specific project"  # noqa: E501

    if enhanced_conversation_history and enhanced_conversation_history.strip():
        method_prompt += f"\n\n**CONVERSATION HISTORY & ACTION CONTEXT:**\n{enhanced_conversation_history}\n\nBased on this conversation history, you can reference previously mentioned entity IDs and use them as parameters in your tool calls. However, if the user asks for entity DATA/details, you still MUST call the appropriate retrieval tools - conversation history provides IDs for PARAMETERS, not complete entity data."  # noqa: E501
        method_prompt += HISTORY_FRESHNESS_WARNING
        address_user_by_name = False

    if mention_section:
        from pi.services.chat.prompts import MENTION_CONTEXT_INSTRUCTIONS_BUILD_MODE

        method_prompt += f"\n\n{mention_section}"
        method_prompt += MENTION_CONTEXT_INSTRUCTIONS_BUILD_MODE

    if user_id:
        method_prompt += f"\n\n**USER CONTEXT:**\nUser ID: {user_id}\nUse this when user refers to him/herself or 'I' or 'me' or 'my' or 'mine' or any other personal pronoun or any derivative of these words."  # noqa: E501

    if address_user_by_name:
        # Include user's first name if available from user_meta
        if user_meta and isinstance(user_meta, dict):
            first_name = user_meta.get("first_name") or user_meta.get("firstName")
            if first_name:
                method_prompt += f"\nUser's first name: {first_name}"
            last_name = user_meta.get("last_name") or user_meta.get("lastName")
            if last_name:
                method_prompt += f", and last name: {last_name}"
            email = user_meta.get("email")
            if email:
                method_prompt += f"\nUser's email: {email}"
            method_prompt += "\nUse the user's name (primarily first name) to address them in your responses.\n"
            method_prompt += "\nYou can reveal the user's name and email to them if requested. The name details here are primarily for greeting purposes. Use the user_id in tool calls if you need to get more user details.\n"  # noqa: E501
    else:
        method_prompt += "\nSkip greetings and get straight to the point."

    log.debug(f"ENHANCED_CONVERSATION_HISTORY being sent to LLM:\n{enhanced_conversation_history}")

    # Inject clarification context if present (from previous turn's ask_for_clarification)
    if clarification_context and isinstance(clarification_context, dict):
        method_prompt += build_clarification_context_block(clarification_context)
        # Reasoning guidance is added globally below so it applies to all build-mode planning.

    # Inject write_todos guidance before the final reasoning/format instructions

    method_prompt += f"\n\n{WRITE_TODOS_SYSTEM_PROMPT_BUILD}"

    # Ensure build-mode planning uses the same "reasoning around tool_calls" guidance as ask-mode.
    method_prompt += f"\n\n{TOOL_CALL_REASONING_REINFORCEMENT}"

    # Add answer delimiter instruction LAST (after TOOL_CALL_REASONING_REINFORCEMENT) to ensure it's the final instruction the model sees
    # This frames the delimiter as a one-way gate: reasoning before, answer after, never repeated
    method_prompt += f"\n\n{ANSWER_DELIMITER_BUILD_MODE}"
    return method_prompt


# ------------------------------
# Clarification context builders
# ------------------------------


def build_clarification_context_block(clar_ctx: dict | None) -> str:
    """Builds a formatted clarification context block for prompts.

    Expected clar_ctx keys: original_query, reason, disambiguation_options (list of dicts),
    answer_text, missing_fields, category_hints
    """
    try:
        if not clar_ctx or not isinstance(clar_ctx, dict):
            return ""

        original_query_text = clar_ctx.get("original_query")
        reason = clar_ctx.get("reason")
        disambig_options = clar_ctx.get("disambiguation_options") or []
        answer_text = clar_ctx.get("answer_text")
        missing_fields = clar_ctx.get("missing_fields") or []
        category_hints = clar_ctx.get("category_hints") or []

        parts: list[str] = []
        parts.append("\n\n**CLARIFICATION CONTEXT:**\n")
        if original_query_text:
            parts.append(f"Original user request: {original_query_text}\n")
        if reason:
            parts.append(f"Clarification reason: {reason}\n")
        if missing_fields:
            parts.append(f"Missing fields resolved: {", ".join(str(x) for x in missing_fields)}\n")
        if category_hints:
            parts.append(f"Category hints: {", ".join(str(x) for x in category_hints)}\n")
        if disambig_options:
            parts.append("The user was previously shown these options:\n")
            for idx, opt in enumerate(disambig_options, 1):
                if isinstance(opt, dict):
                    opt_id = opt.get("id")
                    opt_name = opt.get("name") or opt.get("display_name") or ""
                    opt_identifier = opt.get("identifier") or ""
                    opt_email = opt.get("email") or ""

                    if opt_email:
                        parts.append(f"  {idx}. {opt_name} ({opt_email}) → UUID: {opt_id}\n")
                    elif opt_identifier:
                        parts.append(f"  {idx}. {opt_name} (Identifier: {opt_identifier}) → UUID: {opt_id}\n")
                    else:
                        parts.append(f"  {idx}. {opt_name} → UUID: {opt_id}\n")
        if answer_text:
            parts.append(f"\nUser's clarification answer: {answer_text}\n")
        parts.append(
            "\nIMPORTANT: The current user message is a clarification response to the original request above. "
            "Use the clarification answer to resolve missing information and continue with the ORIGINAL request, "
            "not as a new standalone request.\n"
        )

        return "".join(parts)
    except Exception:
        return ""


def classify_tool(tool_name: str) -> Tuple[bool, bool]:
    """Return (is_retrieval_tool, is_action_tool) using registry first, then heuristics."""
    # 1) Registry check (authoritative if present)
    meta = get_tool_metadata(tool_name)
    if meta:
        kind = str(meta.get("kind") or "").lower()
        if kind == "retrieval":
            return True, False
        if kind == "action":
            return False, True
        # Fall through to heuristics if malformed

    # 2) Heuristics fallback
    # Include both prefix and substring patterns for robustness
    read_only_patterns = [
        "list_",  # prefix form like list_member_projects
        "get_",  # prefix form
        "retrieve_",  # prefix form
        "_list",
        "_retrieve",
        "_get",
        "_search",
        "search_",
    ]
    modifying_patterns = ["_create", "_update", "_delete", "_add", "_remove", "_archive", "_unarchive"]

    is_read_only = any(p in tool_name for p in read_only_patterns)
    has_modifying_pattern = any(p in tool_name for p in modifying_patterns)
    if has_modifying_pattern and is_read_only:
        is_read_only = False  # prioritize modifying for safety

    retrieval = is_retrieval_tool(tool_name) or is_read_only
    return retrieval, not retrieval


def format_tool_query_for_display(tool_name: str, tool_args: dict, user_query: Optional[str] = None) -> str:
    """Format tool arguments for display in streaming messages."""

    # Handle MCP tools: show "for query: <user_query>"
    if tool_name.startswith("mcp_"):
        if user_query:
            return f"for query: {user_query}"
        elif tool_args:
            # Show simplified args for MCP tools
            params = ", ".join(f"{k}={v}" for k, v in tool_args.items() if not k.startswith("_"))
            return f"with: {params}"
        return ""

    if not tool_args:
        return user_query or "the request"

    # For entity search tools, show the textual input used for search
    if tool_name.startswith("search_") and tool_name.endswith("_by_name"):
        entity_name = tool_args.get("name") or tool_args.get("display_name") or ""
        if entity_name:
            return f'"{str(entity_name)}"'

    # Special-case: user search using display_name
    if tool_name == "search_user_by_name":
        display_name = tool_args.get("display_name")
        if display_name:
            return f'"{str(display_name)}"'

    # For identifier-based searches, show the identifier
    if tool_name == "search_workitem_by_identifier":
        identifier = tool_args.get("identifier", "")
        if identifier:
            return f'"{identifier}"'

    if tool_name == "search_project_by_identifier":
        identifier = tool_args.get("identifier", "")
        if identifier:
            return f'"{identifier}"'
    if tool_name == "search_workitem_smart":
        q = tool_args.get("query", "")
        if q:
            return f'"{q}"'

    # Unified entity_search tool
    if tool_name == "entity_search":
        entity_type = tool_args.get("entity_type", "")
        search_name = tool_args.get("name") or tool_args.get("display_name") or tool_args.get("identifier") or ""
        if search_name:
            return f'"{search_name}" ({entity_type})'
        return entity_type or "entity"

    # For list tools, show what's being listed
    if tool_name.endswith("_list"):
        if "project_id" in tool_args:
            return "for project"
        elif "module_id" in tool_args:
            return "for module"
        elif "cycle_id" in tool_args:
            return "for cycle"
        else:
            return "all items"

    # For other tools, show the query parameter if available
    if "query" in tool_args:
        query = str(tool_args["query"])
        if query and query != "the request":
            return f'"{query}"'

    # Fallback to showing key parameters
    key_params = []
    for key, value in tool_args.items():
        if key in ["name", "display_name", "title", "description", "identifier", "search"] and value:
            key_params.append(f'{key}="{value}"')

    if key_params:
        return ", ".join(key_params)

    # Final fallback: use the actual user query
    return user_query or "the request"


def clean_tool_args_for_storage(tool_args: Dict[str, Any]) -> Dict[str, Union[str, List[str], Any]]:
    """
    Clean tool arguments before storing in database.
    Replace non-UUID values with specific placeholders that need to be resolved during execution.
    """
    cleaned_args: Dict[str, Union[str, List[str], Any]] = {}
    uuid_pattern = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE)

    # SPECIAL HANDLING: If tool_args contains a "project" dict with an "id" field that's a UUID,
    # extract it and set project_id directly to avoid later resolution
    project_id_extracted_from_dict = False
    if "project" in tool_args and isinstance(tool_args["project"], dict):
        project_block = tool_args["project"]
        project_id_candidate = project_block.get("id")
        if isinstance(project_id_candidate, str) and uuid_pattern.match(project_id_candidate):
            # Use the UUID from the project block directly
            cleaned_args["project_id"] = project_id_candidate
            project_id_extracted_from_dict = True

    for key, value in tool_args.items():
        if key.endswith("_id"):
            # Skip if we already extracted project_id from project block
            if key == "project_id" and project_id_extracted_from_dict:
                continue
            # For ID fields, only keep if they look like UUIDs
            if isinstance(value, str) and uuid_pattern.match(value):
                cleaned_args[key] = value
            else:
                # Store specific placeholder for non-UUID IDs
                entity_type = key.replace("_id", "")
                cleaned_args[key] = f"<id of {entity_type}: {value}>"
        elif key == "project":
            # Keep the project dict for action summary generation (display purposes)
            # We already extracted project_id above if it was a UUID
            cleaned_args[key] = value
        elif key == "issues" and isinstance(value, list):
            # For issues list, only convert non-UUID items to placeholders
            cleaned_issues = []
            for item in value:
                if isinstance(item, str) and uuid_pattern.match(item):
                    cleaned_issues.append(item)  # Keep UUIDs as-is
                else:
                    cleaned_issues.append(f"<id of workitem: {item}>")  # Convert names to placeholders
            cleaned_args[key] = cleaned_issues
        elif key == "workitems" and isinstance(value, list):
            # For workitems list, only convert non-UUID items to placeholders
            cleaned_workitems = []
            for item in value:
                if isinstance(item, str) and uuid_pattern.match(item):
                    cleaned_workitems.append(item)  # Keep UUIDs as-is
                else:
                    cleaned_workitems.append(f"<id of workitem: {item}>")  # Convert names to placeholders
            cleaned_args[key] = cleaned_workitems
        elif key == "workspace_slug":
            # Skip workspace_slug - it should be auto-filled from context during execution
            continue
        else:
            # For other fields, keep as is
            cleaned_args[key] = value

    return cleaned_args


def extract_entity_type_from_tool_name(tool_name: str) -> str:
    """Extract entity type from tool name (e.g., 'workitems_create' -> 'workitem')."""
    if tool_name.startswith("workitems_"):
        return "workitem"
    elif tool_name.startswith("epics_"):
        return "epic"  # Treat epics as their own entity type for user-facing display
    elif tool_name.startswith("projects_"):
        return "project"
    elif tool_name.startswith("cycles_"):
        return "cycle"
    elif tool_name.startswith("modules_"):
        return "module"
    elif tool_name.startswith("comments_"):
        return "comment"
    elif tool_name.startswith("pages_"):
        return "page"
    elif tool_name.startswith("labels_"):
        return "label"
    elif tool_name.startswith("states_"):
        return "state"
    elif tool_name.startswith("users_"):
        return "user"
    else:
        parts = tool_name.split("_")
        if len(parts) > 1:
            entity = parts[0]
            if entity.endswith("s") and entity not in ["issues", "users"]:
                entity = entity[:-1]
            return entity
        return "unknown"


def extract_action_type_from_tool_name(tool_name: str) -> str:
    """Extract action type from tool name (e.g., 'workitems_create' -> 'create')."""
    # Special case: relation operations are updates, not creates
    if "_create_relation" in tool_name:
        return "update"
    elif "_create" in tool_name:
        return "create"
    elif "_update" in tool_name:
        return "update"
    elif "_delete" in tool_name:
        return "delete"
    elif "_list" in tool_name:
        return "list"
    elif "_retrieve" in tool_name or "_get" in tool_name:
        return "retrieve"
    elif "_search" in tool_name:
        return "search"
    elif "_add" in tool_name:
        return "add"
    elif "_remove" in tool_name:
        return "remove"
    else:
        parts = tool_name.split("_")
        if len(parts) > 1:
            return parts[-1]
        return "unknown"


# ------------------------------
# Clarification formatting utils
# ------------------------------


def format_clarification_as_text(clarification_data: Dict[str, Any]) -> str:
    """Format structured clarification data as natural language text for frontend display.

    This helper lives here so any caller (endpoint or executor) can format
    clarification prompts consistently without duplicating logic.
    """
    try:
        reason = clarification_data.get("reason", "")
        questions = clarification_data.get("questions", []) or []
        disambiguation_options = clarification_data.get("disambiguation_options", []) or []
        clarification_data.get("missing_fields", []) or []

        text_parts: List[str] = []
        if reason:
            text_parts.append(f"❓ **{reason}**\n")

        for question in questions:
            text_parts.append(f"{str(question)}\n")

        if disambiguation_options:
            text_parts.append("\n**Please choose one:**\n")
            for i, option in enumerate(disambiguation_options, 1):
                if isinstance(option, dict):
                    display_name = option.get("display_name") or option.get("name") or option.get("title")
                    email = option.get("email")
                    identifier = option.get("identifier")
                    url = option.get("url")
                    archived_tag = " *(archived)*" if option.get("archived") else ""

                    if display_name and email:
                        if url:
                            text_parts.append(f"{i}. [**{display_name}**]({url}) ({email}){archived_tag}\n")
                        else:
                            text_parts.append(f"{i}. **{display_name}** ({email}){archived_tag}\n")
                    elif display_name and "(" in display_name and ")" in display_name:
                        name_part = display_name.split("(")[0].strip()
                        if url:
                            text_parts.append(f"{i}. [**{name_part}**]({url}) ({display_name.split("(")[1]}{archived_tag}\n")
                        else:
                            text_parts.append(f"{i}. **{display_name}**{archived_tag}\n")
                    elif display_name and identifier:
                        if url:
                            text_parts.append(f"{i}. [**{display_name}**]({url}) (ID: {identifier}){archived_tag}\n")
                        else:
                            text_parts.append(f"{i}. **{display_name}** (ID: {identifier}){archived_tag}\n")
                    elif display_name:
                        if url:
                            text_parts.append(f"{i}. [**{display_name}**]({url}){archived_tag}\n")
                        else:
                            text_parts.append(f"{i}. **{display_name}**{archived_tag}\n")
                    else:
                        # Handle custom dict formats (e.g., intake items with custom keys)
                        # Extract meaningful values and format them nicely
                        formatted_parts = []
                        for key, value in option.items():
                            if key in ("id", "type", "url"):
                                # Skip internal/metadata fields
                                continue
                            if isinstance(value, (str, int, float)) and value:
                                # Format key nicely: 'intake_item_title' -> 'Intake Item Title'
                                nice_key = key.replace("_", " ").title()
                                formatted_parts.append(f"{nice_key}: {value}")

                        if formatted_parts:
                            text_parts.append(f"{i}. **{' | '.join(formatted_parts)}**\n")
                        else:
                            # Final fallback if dict has no useful data
                            text_parts.append(f"{i}. {str(option)}\n")
                else:
                    text_parts.append(f"{i}. {str(option)}\n")

        # missing_fields info is useful in the LLM prompt (build_clarification_context_block)
        # but raw field names are confusing in user-facing text; the questions already cover it.
        # if missing_fields:
        #     text_parts.append(f"\n*Missing information: {', '.join(str(m) for m in missing_fields)}*\n")

        text_parts.append("\n*Please provide your answer in your next message.*")

        return "".join(text_parts)
    except Exception:
        return "❓ I need clarification about your request. Please provide more details."


# ------------------------------
# Required fields preflight
# ------------------------------

# Central registry of required fields per action tool
REQUIRED_FIELDS_BY_TOOL: Dict[str, List[str]] = {
    # Workitems
    "workitems_create": ["project_id", "name"],
    # For updates, issue_id is sufficient at planning time; project_id is auto-resolved from issue_id during execution
    "workitems_update": ["issue_id"],
    # Modules
    "modules_create": ["name", "project_id"],
    "modules_add_work_items": ["module_id", "issues", "project_id"],
    "modules_remove_work_item": ["module_id", "issue_id", "project_id"],
    # Cycles
    "cycles_create": ["name", "project_id"],
    # Labels/States (project scoped)
    "labels_create": ["name", "project_id"],
    "states_create": ["name", "color", "project_id"],
    # Pages - project_id is conditionally required based on chat context
    # Will be handled specially in the clarification logic
    "pages_create_project_page": ["project_id", "name"],
    # Workspace pages don't require project_id
    "pages_create_workspace_page": ["name"],
    # Consolidated pages tool (workspace context): project_id is required but
    # empty/falsy values are valid (treated as workspace scope by the tool).
    # The preflight check handles this specially for page tools.
    "pages_create_page": ["project_id", "name"],
}


def resolve_from_context(required_key: str, tool_args: Dict[str, Any], action_context: Optional[Dict[str, Any]]) -> Optional[Any]:
    """Try to resolve a missing required field from the provided action_context.

    Currently supports mapping `project_id` from context.
    """
    try:
        if required_key == "project_id" and isinstance(action_context, dict):
            ctx_val = action_context.get("project_id")
            if ctx_val:
                return ctx_val
    except Exception:
        pass
    return None


def preflight_missing_required_fields(tool_name: str, tool_args: Dict[str, Any], action_context: Optional[Dict[str, Any]] = None) -> List[str]:
    """Return a list of required fields still missing after considering context.

    - Uses REQUIRED_FIELDS_BY_TOOL to determine required params
    - Treats values as present if in tool_args and truthy
    - Allows auto-resolving certain keys from action_context
    """
    missing: List[str] = []
    required = REQUIRED_FIELDS_BY_TOOL.get(tool_name, [])
    if not required:
        return missing

    args = tool_args or {}
    # Determine if this is an action tool; placeholders are allowed during planning for action tools
    try:
        _is_retrieval, _is_action = classify_tool(tool_name)
    except Exception:
        _is_action = False
    # UUID format for strict validation of *_id fields
    uuid_pattern = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE)
    for key in required:
        val = args.get(key)
        # Treat 'NEEDS_CLARIFICATION' as missing - it's a sentinel value from LLM
        # Also treat placeholders (e.g., "<id of project: X>") and non-UUID *_id values as missing
        is_missing = False

        # Check workspace scope sentinel BEFORE the falsy check,
        # because '' is falsy but '__workspace_scope__' is truthy and valid for page tools
        if isinstance(val, str) and key == "project_id" and val == "__workspace_scope__":
            is_missing = False
        elif not val or val == "NEEDS_CLARIFICATION":
            is_missing = True
        elif key.endswith("_id"):
            if isinstance(val, str):
                # Placeholders like "<id of project: X>" are allowed for ACTION tools during planning
                if "<id of" in val:
                    is_missing = not _is_action
                elif not uuid_pattern.match(val):
                    # Non-UUID strings (e.g., names) must be resolved; still missing
                    is_missing = True
            elif isinstance(val, dict):
                # If dict provided, require a valid UUID in 'id' key
                vid = val.get("id") if isinstance(val, dict) else None
                if not (isinstance(vid, str) and uuid_pattern.match(vid)):
                    is_missing = True
        # Non *_id fields: treat as present if truthy

        if not is_missing:
            continue
        # Try resolving from context
        ctx_val = resolve_from_context(key, args, action_context)
        if ctx_val:
            continue
        missing.append(key)

    return missing


async def handle_missing_required_fields(
    tool_name: str,
    tool_args: Dict[str, Any],
    action_context: Optional[Dict[str, Any]],
    missing_required: List[str],
    method_executor: Any,
    workspace_slug: str,
    chat_id: str,
    tool_id: str,
    current_step: int,
    combined_tool_query: str,
    is_project_chat: Optional[bool] = None,
) -> Optional[Dict[str, Any]]:
    """Handle missing required fields by creating clarification payload with disambiguation options.

    Returns a dict with:
        - clarification_payload: The clarification data to send to frontend
        - tool_message: ToolMessage to append to conversation
        - flow_step: Flow step dict to track the clarification
        - clarification_requested: Boolean flag indicating clarification was triggered

    Returns None if clarification creation fails.
    """
    import json

    from langchain_core.messages import ToolMessage

    from pi.app.models.enums import ExecutionStatus
    from pi.app.models.enums import FlowStepType
    from pi.services.chat.utils import standardize_flow_step_content

    try:
        # Seed category hints so downstream clarification can auto-populate options correctly
        category_hints: List[str] = []
        if tool_name.startswith("workitems_"):
            category_hints = ["workitems"]
        elif tool_name.startswith("pages_"):
            # CRITICAL: mark pages so clarification can fetch filtered project list
            category_hints = ["pages"]

        clarification_payload: Dict[str, Any] = {
            "reason": "Missing required field(s) for action",
            "questions": ["Which project should I use?" if "project_id" in missing_required else "Provide missing information"],
            "missing_fields": missing_required,
            "category_hints": category_hints,
        }

        # Build disambiguation options where possible for the primary missing field
        disambig_options: List[Dict[str, Any]] = []
        try:
            # Choose a primary field to clarify first
            # Special case: if module/cycle/etc need project context, prioritize project_id first
            priority = [
                "project_id",
                "module_id",
                "cycle_id",
                "label_id",
                "state_id",
                "assignee",
                "assignee_id",
                "user_id",
            ]

            # If both project_id and a project-scoped entity are missing, prioritize project_id
            project_scoped_entities = ["module_id", "cycle_id", "label_id", "state_id"]
            has_project_scoped = any(f in missing_required for f in project_scoped_entities)
            if "project_id" not in missing_required and has_project_scoped:
                # Project context exists, continue with normal priority
                primary = next((f for f in priority if f in missing_required), missing_required[0])
            elif "project_id" in missing_required and has_project_scoped:
                # Both project and project-scoped entity missing - ask for project first
                primary = "project_id"
            else:
                # Normal case
                primary = next((f for f in priority if f in missing_required), missing_required[0])

            if primary == "project_id":
                # Special handling for pages: add workspace-level option if not in project chat
                is_page_tool = tool_name in ("pages_create_project_page", "pages_create_workspace_page", "pages_create_page")

                # Debug logging
                from pi import logger

                log = logger.getChild(__name__)
                log.info(f"ChatID: {chat_id} - Clarification for tool={tool_name}, is_page_tool={is_page_tool}, is_project_chat={is_project_chat}")

                # If we're in workspace context (not project chat) and this is a page tool,
                # add "Workspace level" as the first option
                # Explicitly check for False or None (workspace context)
                if is_page_tool and is_project_chat is not True:
                    log.info(f"ChatID: {chat_id} - Adding workspace-level option for page creation")
                    disambig_options.append(
                        {
                            "id": "__workspace_scope__",
                            "name": "Workspace level",
                            "type": "scope",
                            "description": "Create page at workspace level (accessible across all projects)",
                        }
                    )

                # Prefer DB-backed, filtered project list to avoid archived/deleted noise
                try:
                    ws_id = (action_context or {}).get("workspace_id") if isinstance(action_context, dict) else None
                    if ws_id:
                        from pi.core.db.plane import PlaneDBPool as _DB

                        query = """
                            SELECT p.id, p.name, p.identifier, p.archived_at
                            FROM projects p
                            WHERE p.workspace_id = $1
                              AND p.deleted_at IS NULL
                            ORDER BY p.archived_at NULLS FIRST, p.name
                            LIMIT 50
                            """
                        rows = await _DB.fetch(query, (ws_id,))
                        for r in rows or []:
                            option = {"id": str(r["id"]), "name": r["name"], "type": "project"}
                            if r.get("identifier"):
                                option["identifier"] = r["identifier"]
                            if r.get("archived_at") is not None:
                                option["archived"] = True
                            disambig_options.append(option)
                    else:
                        # Fallback to API list with defensive filtering
                        proj_res = await method_executor.execute(
                            "projects",
                            "list",
                            workspace_slug=workspace_slug,
                            per_page=50,
                        )
                        if isinstance(proj_res, dict) and proj_res.get("success"):
                            data_block = proj_res.get("data")
                            candidates = []
                            if isinstance(data_block, list):
                                candidates = data_block
                            elif isinstance(data_block, dict):
                                for key in ("results", "items", "projects", "data"):
                                    val = data_block.get(key)
                                    if isinstance(val, list):
                                        candidates = val
                                        break
                            for it in candidates:
                                try:
                                    pid = it.get("id") if isinstance(it, dict) else None
                                    name = it.get("name") if isinstance(it, dict) else None
                                    identifier = it.get("identifier") if isinstance(it, dict) else None
                                    is_archived = it.get("archived_at") is not None
                                    is_deleted = it.get("deleted_at") is not None

                                    if pid and name and not is_deleted:
                                        option = {"id": str(pid), "name": str(name), "type": "project"}
                                        if identifier:
                                            option["identifier"] = str(identifier)
                                        if is_archived:
                                            option["archived"] = True
                                        disambig_options.append(option)
                                except Exception:
                                    continue
                except Exception:
                    # As a last resort, leave options empty
                    pass

                # Adjust question for pages vs other entities
                if is_page_tool and is_project_chat is not True:
                    clarification_payload["questions"] = ["Where would you like to create this page?"]
                else:
                    clarification_payload["questions"] = ["Which project should I use?"]

            elif primary == "module_id":
                # Need project context to scope modules
                proj = tool_args.get("project_id") or (action_context.get("project_id") if action_context else None)
                if proj:
                    mod_res = await method_executor.execute("modules", "list", project_id=proj, workspace_slug=workspace_slug)
                    if isinstance(mod_res, dict) and mod_res.get("success"):
                        data_block = mod_res.get("data")
                        candidates = []
                        if isinstance(data_block, list):
                            candidates = data_block
                        elif isinstance(data_block, dict):
                            for key in ("results", "items", "modules", "data"):
                                val = data_block.get(key)
                                if isinstance(val, list):
                                    candidates = val
                                    break
                        for it in candidates:
                            try:
                                mid = it.get("id") if isinstance(it, dict) else None
                                name = it.get("name") if isinstance(it, dict) else None
                                if mid and name:
                                    disambig_options.append({"id": str(mid), "name": str(name)})
                            except Exception:
                                continue
                clarification_payload["questions"] = ["Which module should I use?"]

            elif primary == "cycle_id":
                proj = tool_args.get("project_id") or (action_context.get("project_id") if action_context else None)
                if proj:
                    cyc_res = await method_executor.execute("cycles", "list", project_id=proj, workspace_slug=workspace_slug, per_page=50)
                    if isinstance(cyc_res, dict) and cyc_res.get("success"):
                        data_block = cyc_res.get("data")
                        candidates = []
                        if isinstance(data_block, list):
                            candidates = data_block
                        elif isinstance(data_block, dict):
                            for key in ("results", "items", "cycles", "data"):
                                val = data_block.get(key)
                                if isinstance(val, list):
                                    candidates = val
                                    break
                        for it in candidates:
                            try:
                                cid = it.get("id") if isinstance(it, dict) else None
                                name = it.get("name") if isinstance(it, dict) else None
                                if cid and name:
                                    disambig_options.append({"id": str(cid), "name": str(name), "type": "cycle", "project_id": str(proj)})
                            except Exception:
                                continue
                clarification_payload["questions"] = ["Which cycle should I use?"]

            elif primary == "label_id":
                proj = tool_args.get("project_id") or (action_context.get("project_id") if action_context else None)
                if proj:
                    lab_res = await method_executor.execute("labels", "list", project_id=proj, workspace_slug=workspace_slug)
                    if isinstance(lab_res, dict) and lab_res.get("success"):
                        data_block = lab_res.get("data")
                        candidates = []
                        if isinstance(data_block, list):
                            candidates = data_block
                        elif isinstance(data_block, dict):
                            for key in ("results", "items", "labels", "data"):
                                val = data_block.get(key)
                                if isinstance(val, list):
                                    candidates = val
                                    break
                        for it in candidates:
                            try:
                                lid = it.get("id") if isinstance(it, dict) else None
                                name = it.get("name") if isinstance(it, dict) else None
                                color = it.get("color") if isinstance(it, dict) else None
                                if lid and name:
                                    opt = {"id": str(lid), "name": str(name)}
                                    if color:
                                        opt["color"] = str(color)
                                    disambig_options.append(opt)
                            except Exception:
                                continue
                clarification_payload["questions"] = ["Which label should I use?"]

            elif primary == "state_id":
                proj = tool_args.get("project_id") or (action_context.get("project_id") if action_context else None)
                if proj:
                    st_res = await method_executor.execute("states", "list", project_id=proj, workspace_slug=workspace_slug)
                    if isinstance(st_res, dict) and st_res.get("success"):
                        data_block = st_res.get("data")
                        candidates = []
                        if isinstance(data_block, list):
                            candidates = data_block
                        elif isinstance(data_block, dict):
                            for key in ("results", "items", "states", "data"):
                                val = data_block.get(key)
                                if isinstance(val, list):
                                    candidates = val
                                    break
                        for it in candidates:
                            try:
                                sid = it.get("id") if isinstance(it, dict) else None
                                name = it.get("name") if isinstance(it, dict) else None
                                group = it.get("group") if isinstance(it, dict) else None
                                if sid and name:
                                    opt = {"id": str(sid), "name": str(name)}
                                    if group:
                                        opt["group"] = str(group)
                                    disambig_options.append(opt)
                            except Exception:
                                continue
                clarification_payload["questions"] = ["Which state should I use?"]

            elif primary in ("assignee", "assignee_id", "user_id"):
                # Prefer project members if project context present
                proj = tool_args.get("project_id") or (action_context.get("project_id") if action_context else None)
                if proj:
                    mem_res = await method_executor.execute("members", "get_project_members", project_id=proj, workspace_slug=workspace_slug)
                else:
                    mem_res = await method_executor.execute("members", "get_workspace_members", workspace_slug=workspace_slug)
                if isinstance(mem_res, dict) and mem_res.get("success"):
                    data_block = mem_res.get("data")
                    candidates = []
                    if isinstance(data_block, list):
                        candidates = data_block
                    elif isinstance(data_block, dict):
                        for key in ("results", "items", "members", "data"):
                            val = data_block.get(key)
                            if isinstance(val, list):
                                candidates = val
                                break
                    for it in candidates:
                        try:
                            uid = (it.get("id") if isinstance(it, dict) else None) or it.get("member_id") if isinstance(it, dict) else None
                            display_name = (
                                (it.get("display_name") if isinstance(it, dict) else None) or it.get("name") if isinstance(it, dict) else None
                            )
                            email = it.get("email") if isinstance(it, dict) else None
                            if uid and (display_name or email):
                                opt = {"id": str(uid)}
                                if display_name:
                                    opt["display_name"] = str(display_name)
                                if email:
                                    opt["email"] = str(email)
                                disambig_options.append(opt)
                        except Exception:
                            continue
                clarification_payload["questions"] = ["Which user should I use?"]
        except Exception:
            # Best-effort only; lack of options shouldn't block clarification
            pass

        # Enrich options with entity URLs (projects/users/cycles/modules) for better UX in clarification
        try:
            if disambig_options:
                from pi.services.chat.helpers.url_builder import build_entity_url

                if isinstance(workspace_slug, str) and workspace_slug:
                    enriched: List[Dict[str, Any]] = []
                    for _opt in disambig_options:
                        if isinstance(_opt, dict):
                            _opt2 = dict(_opt)
                            _typ = _opt2.get("type")
                            _idv = _opt2.get("id")
                            _proj_id = _opt2.get("project_id")
                            try:
                                if _typ == "project" and _idv:
                                    _opt2["url"] = build_entity_url("project", workspace_slug, entity_id=str(_idv))
                                elif _typ == "cycle" and _idv and _proj_id:
                                    _opt2["url"] = build_entity_url(
                                        "cycle",
                                        workspace_slug,
                                        entity_id=str(_idv),
                                        project_id=str(_proj_id),
                                    )
                                elif _typ == "module" and _idv and _proj_id:
                                    _opt2["url"] = build_entity_url(
                                        "module",
                                        workspace_slug,
                                        entity_id=str(_idv),
                                        project_id=str(_proj_id),
                                    )
                                elif _typ == "user" and _idv:
                                    _opt2["url"] = build_entity_url("profile", workspace_slug, entity_id=str(_idv))
                            except Exception:
                                pass
                            enriched.append(_opt2)
                    disambig_options = enriched
        except Exception:
            pass

        if disambig_options:
            clarification_payload["disambiguation_options"] = disambig_options

        # Create a tool message responding to the tool_call to satisfy LLM protocol
        tool_message = None
        with contextlib.suppress(Exception):
            tool_message = ToolMessage(content=json.dumps(clarification_payload), tool_call_id=tool_id)

        # Log clarification payload synthesized during preflight
        with contextlib.suppress(Exception):
            log.debug(
                f"{"*" * 100}\nChatID: {chat_id} - ASK_FOR_CLARIFICATION payload (preflight): {json.dumps(clarification_payload, default=str)}\n{"*" * 100}"  # noqa: E501
            )

        # Track flow step for clarification
        flow_step = {
            "step_order": current_step,
            "step_type": FlowStepType.TOOL,
            "tool_name": "ask_for_clarification",
            "content": standardize_flow_step_content(clarification_payload, FlowStepType.TOOL),
            "execution_data": {
                "args": tool_args,
                "clarification_pending": True,
                "clarification_payload": clarification_payload,
                # CRITICAL: Store the original query so we can reconstruct full context on clarification follow-up
                "original_query": combined_tool_query,
            },
            "is_planned": False,
            "is_executed": False,
            "execution_success": ExecutionStatus.PENDING,
        }

        return {
            "clarification_payload": clarification_payload,
            "tool_message": tool_message,
            "flow_step": flow_step,
            "clarification_requested": True,
        }

    except Exception:
        return None


async def stream_content_in_chunks(content: str, words_per_chunk: int = 15, delay_seconds: float = 0.08) -> AsyncIterator[str]:
    """
    Stream content in chunks of words with a slight delay to simulate streaming.

    Args:
        content: The full content to stream
        words_per_chunk: Number of words to include in each chunk (default: 15)
        delay_seconds: Delay between chunks in seconds (default: 0.08)

    Yields:
        Content chunks as strings
    """
    if not content:
        return

    # Split by whitespace but keep delimiters to preserve formatting (newlines, tabs, etc.)
    # This ensures tables and other formatted text are preserved exactly.
    tokens = re.split(r"(\s+)", content)

    current_chunk = []
    word_count = 0

    for token in tokens:
        current_chunk.append(token)
        # Count non-whitespace tokens as words
        if token and not token.isspace():
            word_count += 1

        if word_count >= words_per_chunk:
            yield "".join(current_chunk)
            current_chunk = []
            word_count = 0
            await asyncio.sleep(delay_seconds)

    # Yield remaining content
    if current_chunk:
        yield "".join(current_chunk)


class WordBatcher:
    """Stateful word-level batcher that accumulates text and yields when a word threshold is reached.

    Use this to reduce the number of SSE events sent to the browser by batching
    individual LLM tokens (~1-3 chars each) into larger chunks (~15 words).

    Usage::

        batcher = WordBatcher(words_per_batch=15)
        for token in tokens:
            batched = batcher.add(token)
            if batched:
                yield batched
        remaining = batcher.flush()
        if remaining:
            yield remaining
    """

    __slots__ = ("_batch", "_word_count", "_threshold")

    def __init__(self, words_per_batch: int = 15) -> None:
        self._batch: list[str] = []
        self._word_count = 0
        self._threshold = words_per_batch

    def add(self, text: str) -> str | None:
        """Add *text* to the buffer. Returns accumulated batch when threshold is reached, else ``None``."""
        tokens = re.split(r"(\s+)", text)
        to_yield_parts: list[str] = []
        for token in tokens:
            self._batch.append(token)
            if token and not token.isspace():
                self._word_count += 1
            if self._word_count >= self._threshold:
                to_yield_parts.append("".join(self._batch))
                self._batch = []
                self._word_count = 0
        if to_yield_parts:
            return "".join(to_yield_parts)
        return None

    def flush(self) -> str | None:
        """Flush any remaining buffered text. Returns ``None`` if buffer is empty."""
        if not self._batch:
            return None
        result = "".join(self._batch)
        self._batch = []
        self._word_count = 0
        return result


async def batch_llm_stream_by_words(llm_stream: AsyncIterator[Any], words_per_batch: int = 10) -> AsyncIterator[str]:
    """
    Batch LLM stream chunks in real-time by word count to reduce browser event overhead.

    This function collects chunks from an LLM stream as they arrive and batches them
    by word count before yielding. Unlike stream_content_in_chunks which operates on
    complete content with artificial delays, this performs true real-time batching
    without delays.

    Args:
        llm_stream: Async iterator of LLM chunks (e.g., from llm.astream())
        words_per_batch: Number of words to accumulate before yielding a batch (default: 10)

    Yields:
        Batched content chunks as strings
    """
    batcher = WordBatcher(words_per_batch)

    async for chunk in llm_stream:
        # Extract content from LLM chunk (handles different LLM response formats)
        chunk_content = getattr(chunk, "content", None)
        if not chunk_content:
            continue

        batched = batcher.add(extract_text_from_content(chunk_content))
        if batched:
            yield batched

    # Yield any remaining content
    remaining = batcher.flush()
    if remaining:
        yield remaining
