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

import json
import random
import re
import uuid
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple
from typing import Union

from langchain_core.messages import AIMessage
from langchain_core.messages import BaseMessage
from langchain_core.messages import HumanMessage
from pydantic import UUID4
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi import settings
from pi.app.api.v1.helpers.plane_sql_queries import get_user_timezone_context_for_prompt
from pi.services.retrievers.pg_store.attachment import get_attachments_with_base64_data

log = logger.getChild(__name__)
MAX_CHAT_LENGTH = settings.chat.MAX_CHAT_LENGTH
MENTION_TAGS = settings.chat.MENTION_TAGS
TESTED_FOR_WORKSPACE = settings.llm_config.TESTED_FOR_WORKSPACE

"""Utility functions for LLM model validation and configuration."""


def mask_uuids_in_text(text: str) -> str:
    """
    Remove context lines and mask UUIDs in the text by replacing them with 'xxxx-' + last 4 characters.

    Args:
        text: Input text that may contain UUIDs and optional context

    Returns:
        Cleaned text with UUIDs masked and context removed
    """
    uuid_pattern = r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b"

    def replace_uuid(match):
        uuid_str = match.group(0)
        return f"xxxx-{uuid_str[-4:]}"

    return re.sub(uuid_pattern, replace_uuid, text)


# Standard Agent Response Format - All agents should return this format
class StandardAgentResponse:
    """Standard response format for all agents that can return entity URLs"""

    @staticmethod
    def create_response(results: str, entity_urls: Optional[List[Dict[str, str]]] = None, **kwargs) -> Dict[str, Any]:
        """Create a standardized agent response"""
        response = {
            "results": results,
            "entity_urls": entity_urls,
        }
        response.update(kwargs)  # Allow additional fields like sql_query for SQL agent
        return response

    @staticmethod
    def extract_results(response: Union[str, Dict[str, Any]]) -> str:
        """Extract results text from any agent response format"""
        if isinstance(response, dict):
            return response.get("results", "")
        return str(response)

    @staticmethod
    def extract_entity_urls(response: Union[str, Dict[str, Any]]) -> Optional[List[Dict[str, str]]]:
        """Extract entity URLs from any agent response format"""
        if isinstance(response, dict):
            return response.get("entity_urls")
        return None

    @staticmethod
    def has_entity_urls(response: Union[str, Dict[str, Any]]) -> bool:
        """Check if response has entity URLs"""
        urls = StandardAgentResponse.extract_entity_urls(response)
        return urls is not None and len(urls) > 0

    @staticmethod
    def has_retrieval_error(response: Union[str, Dict[str, Any]]) -> bool:
        """Check if response contains a retrieval error that should not be rewritten by LLM"""
        response_text = StandardAgentResponse.extract_results(response)
        if not response_text:
            return False

        # Common error patterns that indicate retrieval failure
        error_patterns = [
            "Failed to retrieve data from the DB due to an error",
            "Unable to generate SQL query due to processing limitations",
            "Error: Unable to",
            "Failed to retrieve",
            "An error occurred while",
            "Could not retrieve",
            "Database query failed",
            "Table selection failed",
            "SQL generation failed",
        ]

        response_lower = response_text.lower()
        return any(pattern.lower() in response_lower for pattern in error_patterns)

    @staticmethod
    def format_response_with_entity_urls(response: Union[str, Dict[str, Any]]) -> str:
        """Format a response into a string with entity URLs"""
        if isinstance(response, dict):
            entity_urls = response.get("entity_urls") or []
            url_info = ""
            if entity_urls:
                url_info = "\n\n**Entity URLs Available:**\n"
                for url in entity_urls:
                    url_info += f"- {url.get("type", "").title()}: {url.get("name")} - URL: {url.get("url")}\n"
                    if url.get("type") == "issue":
                        url_info += f"Issue Unique Key: {url.get("issue_identifier")}\n"
            formatted_response = response.get("results", "") + url_info
            return formatted_response
        return str(response)

    @staticmethod
    def format_responses(responses, chat_id, query_flow_store):
        formatted_responses = []
        formatted_responses_str = ""
        extracted_urls = []
        has_errors = False

        for response_item in responses:
            if not isinstance(response_item, tuple) or len(response_item) < 3:
                continue

            agent, sub_query, response, *_ = response_item
            query_flow_store["tool_response"] += f"Agent: {agent};\nQuery: {sub_query};\nResponse: {response}\n\n"  # noqa: E501

            # Check if this response contains a retrieval error
            if StandardAgentResponse.has_retrieval_error(response):
                has_errors = True
                log.warning(f"ChatID: {chat_id} - Detected retrieval error in {agent} response, will not allow LLM to rewrite")

            # Extract URLs using standardized method
            urls = StandardAgentResponse.extract_entity_urls(response)
            if urls:
                extracted_urls.extend(urls)

            # Get response text using standardized method
            response_text = StandardAgentResponse.extract_results(response)
            formatted_response = f"**{agent}**:\nQuery: {sub_query}\nResponse: {response_text}"
            formatted_responses.append(formatted_response)

        formatted_responses_str = "\n\n".join(formatted_responses)

        # Add URL info if we found any
        if extracted_urls:
            url_info = "\n\n**Entity URLs Available:**\n"
            for url in extracted_urls:
                if url.get("name") and url.get("url"):
                    url_info += f"- {url.get("type", "").title()}: {url.get("name")} - URL: {url.get("url")}\n"
                    # check if type is 'issue' in the extracted_urls. if yes, then add issue_identifier to url_info string
                    if url.get("type") == "issue":
                        url_info += f"Issue Unique Key: {url.get("issue_identifier")}\n"
            formatted_responses_str += url_info

        # Mark if responses contain errors (used by caller to skip LLM rewriting)
        return {"formatted": formatted_responses_str, "has_errors": has_errors}


def reasoning_header_factory(stage: str, tool_name: str, tool_query: str) -> str:
    """Factory function to create a reasoning header for a given stage"""
    stage_dict = {
        "build_beginning": [
            "\n\nAssembling the action sequence...\n\n",
            "\n\nPlanning next steps...\n\n",
            "\n\nBrainstorming the best approach...\n\n",
            "\n\nMapping out the action path...\n\n",
            "\n\nConstructing your request workflow...\n\n",
            "\n\nEvaluating available options...\n\n",
            "\n\nOrchestrating the next steps...\n\n",
        ],
        "selected_action_categories": [
            "\n\nIdentified planning focus\n\n",
            "\n\nEvaluated relevant areas\n\n",
        ],
        "actions_clarification_followup": [
            "\n\nContinuing with your request...\n\n",
        ],
        "planner_tool_selection_calling": [
            "\n\nZeroing in on the best step...\n\n",
            "\n\nNarrowing down the next moves...\n\n",
            "\n\nSteps to take next...\n\n",
        ],
        "planner_tool_selection": [
            "\n\nContemplating...\n\n",
        ],
        "planner_tool_selection_final": [
            f"\n\n{tool_name} ({tool_query})\n\n" if tool_query else f"\n\n{tool_name}\n\n",
        ],
        "retrieval_tool_execution": [
            f"\n\nExecuting: {tool_name}: {tool_query}\n\n",
            f"\n\nCalling {tool_name} for {tool_query}\n\n",
        ],
        "retrieval_tool_execution_message": [
            f"\n\nTool {tool_name} returned its output...\n\n",
            f"\n\nI received {tool_name}'s result..\n\n",
        ],
        "tool_complete": [
            f"\n\n{tool_name} execution completed\n\n",
            f"\n\n{tool_name} is executed successfully\n\n",
        ],
        "tool_error": [
            f"\n\nError executing {tool_name}\n\n",
        ],
        "tool_unavailable": [
            "\n\nA required capability was unavailable.\n\n",
        ],
        "ask_mode_clarification_followup": [
            "\n\nProcessing your clarification...\n\n",
        ],
        "ask_mode_beginning": [
            "\n\nRetrieving information...\n\n",
            "\n\nProcessing your request...\n\n",
            "\n\nPlanning next steps...\n\n",
            "\n\nPlanning next steps...\n\n",
            "\n\nBrainstorming the best approach...\n\n",
        ],
        "ask_mode_analyzing_results": [
            "\n\nAnalyzing results...\n\n",
            "\n\nReviewing tool outputs...\n\n",
        ],
        "build_mode_analyzing_results": [
            "\n\nAnalyzing results...\n\n",
            "\n\nReviewing tool outputs...\n\n",
        ],
        "ask_preset_reasoning": [
            "\n\nUsing optimized path...\n\n",
            "\n\nApplying optimized insights...\n\n",
            "\n\nFollowing optimized guidance...\n\n",
        ],
        "final_response": ["\n\nGenerating final response...\n\n"],
    }
    stage_list = stage_dict.get(stage, "{stage}\n\n")
    return random.choice(stage_list)


def reasoning_dict_maker(stage: str, tool_name: str, tool_query: str, content: str) -> dict:
    """Factory function to create a reasoning dictionary for a given stage"""
    return {
        "chunk_type": "reasoning",
        "header": mask_uuids_in_text(reasoning_header_factory(stage, tool_name, tool_query)),
        "content": mask_uuids_in_text(content),
        "stage": stage,
    }


def format_conversation_history(conversation_history):
    return "\n".join([f"{m.type}: {m.content}" for m in conversation_history])


async def process_conv_history(conv_history: list[dict[str, Any]], db: AsyncSession, chat_id: UUID4, user_id: UUID4) -> dict[str, Any]:
    if not conv_history:
        return {"langchain_conv_history": [], "enhanced_conv_history": ""}

    conv_history_lc = []
    conv_history_enhanced = ""
    recent_conv_history = conv_history[-MAX_CHAT_LENGTH:]
    if len(recent_conv_history) < len(conv_history):
        log.info(f"Truncating the conversation history to MAX_CHAT_LENGTH: {MAX_CHAT_LENGTH} messages, based on configured limit")

    for idx, qa_pair in enumerate(recent_conv_history):
        # Process user message with potential attachments
        user_content = qa_pair.get("parsed_query", "") or qa_pair.get("query", "")

        # Check if this message has attachments
        attachments = qa_pair.get("attachments", [])
        if attachments:
            # Get attachment IDs for processing
            attachment_ids = [att.get("id") for att in attachments if att.get("id")]

            if attachment_ids:
                try:
                    # Process attachments for LLM context
                    attachment_blocks = await process_message_attachments_for_llm(
                        attachment_ids=attachment_ids, chat_id=chat_id, user_id=user_id, db=db
                    )

                    if attachment_blocks:
                        # Format user message with attachments
                        user_message_content = format_message_with_attachments(user_content, attachment_blocks)
                        log.info(f"Added {len(attachment_blocks)} attachments to conversation history")
                    else:
                        user_message_content = user_content
                except Exception as e:
                    log.warning(f"Failed to process attachments in conversation history: {e}")
                    user_message_content = user_content
            else:
                user_message_content = user_content
        else:
            user_message_content = user_content

        # Create message objects
        qa_pair_lc = [
            HumanMessage(content=user_message_content),  # type: ignore[arg-type]
            AIMessage(content=qa_pair.get("answer", "")),
        ]
        conv_history_lc.extend(qa_pair_lc)

        # Enhanced history for text-based processing
        attachment_info = ""
        if attachments:
            filenames = [att.get("filename", "Unknown") for att in attachments]
            attachment_info = f" [Attachments: {", ".join(filenames)}]"

        # Extract and include action context if available
        action_context = ""
        execution_status = qa_pair.get("execution_status", {})
        # Fix: Remove has_planned_actions gate - just check if actions exist
        if execution_status.get("actions"):
            action_context += "\n**Action Context:**\n"

            # Include planning context from actions
            for action in execution_status.get("actions", []):
                action_type = action.get("action")
                success = action.get("success")

                if success and action.get("entity"):
                    entity = action.get("entity", {})
                    entity_type = entity.get("entity_type", "entity")
                    entity_name = entity.get("entity_name", "")
                    entity_id = entity.get("entity_id", "")

                    action_context += f"- Action: {action_type} → Successfully created/updated {entity_type} '{entity_name}' (ID: {entity_id})\n"
                elif success:
                    action_context += f"- Action: {action_type} → Executed successfully\n"
                else:
                    action_context += f"- Action: {action_type} → Failed to execute\n"

            # Check if we can extract planning context from the qa_pair structure
            # This would be available when the enhanced execution_data includes planning_context
            if hasattr(qa_pair, "planning_context") or "planning_context" in str(qa_pair):
                action_context += "**Planning was informed by:** Previous retrieval and search results\n"

        # Format internal reasoning with better structure
        internal_reasoning = qa_pair.get("internal_reasoning", "").strip()
        internal_selected = qa_pair.get("internal_selected", "").strip()
        internal_executed = qa_pair.get("internal_executed", "").strip()

        # Determine if this is the last QA and if it is a placeholder response (to avoid duplication)
        is_last = idx == len(recent_conv_history) - 1
        ans_text = (qa_pair.get("answer", "") or "").strip()
        is_placeholder_answer = ans_text.startswith("⏳") or "Processing your request" in ans_text or ans_text == ""

        # Decide whether to include this QA in enhanced history
        skip_in_enhanced = bool(is_last and is_placeholder_answer)

        if skip_in_enhanced:
            continue

        conv_history_enhanced += f"{"=" * 60}\n"

        # Add user query first
        conv_history_enhanced += f"User Query{attachment_info}: {user_content}\n\n"

        # If this QA includes executed actions, place assistant response before execution details for cohesion
        has_executed_actions = False
        try:
            actions = execution_status.get("actions", [])
            has_executed_actions = any(bool(a.get("success")) for a in actions)
        except Exception:
            has_executed_actions = False

        if has_executed_actions and (internal_selected or internal_executed):
            # Keep selected tools first
            if internal_selected:
                conv_history_enhanced += f"{internal_selected}\n"

            # Then the assistant's planned message
            conv_history_enhanced += f"Plane AI (formerly, Plane Intelligence (Pi)) Response: {qa_pair.get("answer", "")}\n"

            # Finally, the executed summaries with entity info
            if internal_executed:
                conv_history_enhanced += f"{internal_executed}\n"
        else:
            # Retrieval-only or no split sections available → keep original order
            if internal_reasoning:
                conv_history_enhanced += f"{internal_reasoning}\n"
            conv_history_enhanced += f"Plane AI (formerly, Plane Intelligence (Pi)) Response: {qa_pair.get("answer", "")}\n"

        # Add action context if present
        if action_context:
            conv_history_enhanced += f"{action_context}\n"

        conv_history_enhanced += f"{"=" * 60}\n\n"

    return {"langchain_conv_history": conv_history_lc, "enhanced_conv_history": conv_history_enhanced}


def standardize_flow_step_content(content: Any, step_type: str) -> str:
    """
    Standardize content for MessageFlowStep based on step type.
    Always returns a JSON string for complex data or plain string for simple data.
    """
    if content is None:
        return ""

    # For simple string content, return as-is
    if isinstance(content, str):
        return content

    # For complex data structures, convert to JSON
    if isinstance(content, (dict, list)):
        try:
            return json.dumps(content, ensure_ascii=False, indent=None)
        except (TypeError, ValueError):
            # Fallback to string representation if JSON serialization fails
            return str(content)

    # For other types, convert to string
    return str(content)


async def resolve_workspace_slug(workspace_id: Optional[UUID4], workspace_slug: Optional[str]) -> Optional[str]:
    """
    Resolve workspace_slug from workspace_id if slug is not provided.

    Args:
        workspace_id: The workspace UUID
        workspace_slug: The workspace slug (if already known)

    Returns:
        The workspace slug, or None if not found
    """
    # If slug is already provided, return it
    if workspace_slug:
        return workspace_slug

    # If no workspace_id, return None
    if not workspace_id:
        return None

    try:
        from pi.app.api.v1.helpers.plane_sql_queries import get_workspace_slug

        resolved_slug = await get_workspace_slug(str(workspace_id))
        return resolved_slug
    except Exception as e:
        log.warning(f"Failed to resolve workspace_slug for workspace_id {workspace_id}: {e}")
        return None


def parse_flow_step_content(content: str) -> Union[str, Dict[str, Any], List[Any], int, float, bool, None]:
    """
    Parse content from MessageFlowStep.
    Returns parsed JSON (dict, list, str, int, float, bool, None) if content is valid JSON,
    otherwise returns the string as-is.
    """
    if not content:
        return ""

    # Try to parse as JSON first
    try:
        return json.loads(content)
    except (json.JSONDecodeError, TypeError):
        # If not valid JSON, return as string
        return content


async def initialize_new_chat(
    user_id: UUID4,
    db: AsyncSession,
    chat_id: UUID4 | None = None,
    is_project_chat: bool | None = False,
    workspace_in_context: bool | None = None,
    workspace_id: UUID4 | None = None,
) -> dict[str, Any]:
    """
    Initialize a new chat quickly without workspace resolution.
    Workspace details will be backfilled later in queue_answer.

    Args:
        user_id: The user creating the chat
        db: Database session
        chat_id: Optional chat ID (generates one if not provided)
        is_project_chat: Whether this is a project chat

    Returns:
        dict with 'success', 'chat_id', and optional 'message' fields
    """
    try:
        # Import here to avoid circular dependency
        from pi.services.retrievers.pg_store.chat import check_if_chat_exists
        from pi.services.retrievers.pg_store.chat import upsert_chat

        # Generate new chat_id if not provided
        final_chat_id = chat_id or uuid.uuid4()

        # Check if chat already exists (in case ID was provided)
        if chat_id:
            chat_exists = await check_if_chat_exists(final_chat_id, db)
            if chat_exists:
                return {"success": False, "message": "Chat ID already exists", "error_code": "CHAT_EXISTS"}
        # Create the chat record without workspace details (will be backfilled later)
        chat_result = await upsert_chat(
            chat_id=final_chat_id,
            user_id=user_id,
            title="",
            description="",
            db=db,
            workspace_id=workspace_id,
            workspace_slug=None,  # Will be backfilled in queue_answer
            is_project_chat=is_project_chat,
            workspace_in_context=workspace_in_context,
        )

        # Chat search index upserted via Celery background task

        if chat_result["message"] != "success":
            log.error(f"Failed to create chat {final_chat_id}: {chat_result}")
            return {"success": False, "message": "Failed to create chat", "error_code": "CHAT_CREATION_FAILED"}

        return {"success": True, "chat_id": str(final_chat_id), "message": "Chat initialized successfully"}

    except Exception as e:
        log.error(f"Error initializing chat: {str(e)}")
        return {"success": False, "message": f"Unexpected error: {str(e)}", "error_code": "UNEXPECTED_ERROR"}


async def get_current_timestamp_context(user_id: str) -> str:
    """
    Generate current timestamp context string for LLM queries.

    Returns:
        Formatted string with current date, time, year, and month information
        for interpreting relative time references like 'today', 'this month', etc.
    """
    user_timezone_context = await get_user_timezone_context_for_prompt(user_id)

    return f"{user_timezone_context}\nUse this information when interpreting relative time references like 'today', 'this month', 'this year', etc."  # noqa: E501


async def process_message_attachments_for_llm(
    attachment_ids: Optional[List[str]], chat_id: UUID4, user_id: UUID4, db: AsyncSession
) -> List[Dict[str, Any]]:
    """
    Process attachments for inclusion in LLM messages.

    Args:
        attachment_ids: List of attachment IDs
        chat_id: Chat ID
        user_id: User ID
        db: Database session

    Returns:
        List of formatted attachment content blocks for LLM
    """
    if not attachment_ids:
        return []

    try:
        # Convert string IDs to UUIDs
        uuid_attachment_ids = [uuid.UUID(aid) for aid in attachment_ids]

        # Get attachments with base64 data
        attachments_with_data = await get_attachments_with_base64_data(attachment_ids=uuid_attachment_ids, chat_id=chat_id, user_id=user_id, db=db)

        attachment_blocks = []
        for attachment_data in attachments_with_data:
            base64_data = attachment_data.get("base64_data")
            content_type = attachment_data.get("content_type", "")
            filename = attachment_data.get("filename", "")

            if not base64_data:
                continue

            # Determine the content block type based on file type
            if content_type.startswith("image/"):
                content_block = {
                    "type": "image",
                    "source_type": "base64",
                    "mime_type": content_type,
                    "data": base64_data,
                }
            elif content_type == "application/pdf":
                content_block = {
                    "type": "file",
                    "source_type": "base64",
                    "mime_type": content_type,
                    "data": base64_data,
                    "filename": filename,
                }
            else:
                # For other file types, treat as generic file
                content_block = {
                    "type": "file",
                    "source_type": "base64",
                    "mime_type": content_type,
                    "data": base64_data,
                    "filename": filename,
                }

            attachment_blocks.append(content_block)
            log.info(f"Processed attachment {filename} ({content_type}) for LLM")

        return attachment_blocks

    except Exception as e:
        log.error(f"Error processing attachments for LLM: {e}")
        return []


def format_message_with_attachments(text_content: str, attachment_blocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Format a message with text and attachment content blocks for LLM.

    Args:
        text_content: The text content of the message
        attachment_blocks: List of attachment content blocks

    Returns:
        List of content blocks for LLM message
    """
    content_blocks = [{"type": "text", "text": text_content}]

    # Add attachment blocks
    content_blocks.extend(attachment_blocks)

    return content_blocks


async def auto_populate_disambiguation_options(
    category_hints: Optional[List[str]] = None,
    missing_fields: Optional[List[str]] = None,
    workspace_id: Optional[str] = None,
    project_id: Optional[str] = None,
    user_id: Optional[str] = None,
    chat_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Auto-populate disambiguation options based on category hints and missing fields.

    Uses direct database queries with membership filtering for security.
    Note: This is used by retrieval agents. Action executors use SDK-based approach
    in handle_missing_required_fields() which has server-side permission checks.

    Args:
        category_hints: List of category hints (e.g., ["projects", "users"])
        missing_fields: List of missing field names (e.g., ["project_id", "assignee_id"])
        workspace_id: Workspace UUID for scoping queries
        project_id: Project UUID for scoping queries (for modules, cycles, etc.)
        user_id: User UUID for membership filtering
        chat_id: Chat ID for logging purposes

    Returns:
        List of disambiguation options with id, name, and relevant metadata
    """
    from pi.core.db.plane import PlaneDBPool

    options: List[Dict[str, Any]] = []

    if not category_hints and not missing_fields:
        return options

    if not user_id:
        log.warning(f"ChatID: {chat_id} - Cannot auto-populate without user_id for membership checks")
        return options

    hints = category_hints or []
    fields = missing_fields or []

    try:
        # Check for projects - WITH MEMBERSHIP FILTERING
        # Also check for "pages" since page creation requires project selection
        if "projects" in hints or "project" in hints or "pages" in hints or any("project" in str(f).lower() for f in fields):
            if workspace_id:
                query = """
                SELECT p.id, p.name, p.identifier
                FROM projects p
                JOIN project_members pm ON p.id = pm.project_id
                WHERE p.workspace_id = $1
                AND pm.member_id = $2
                AND p.deleted_at IS NULL
                AND p.archived_at IS NULL
                AND pm.deleted_at IS NULL
                AND pm.is_active = true
                ORDER BY p.name
                LIMIT 50
                """
                results = await PlaneDBPool.fetch(query, (workspace_id, user_id))
                for row in results:
                    opt = {"id": str(row["id"]), "name": row["name"], "type": "project"}
                    if row["identifier"]:
                        opt["identifier"] = row["identifier"]
                    options.append(opt)

                if options:
                    log.info(f"ChatID: {chat_id} - Auto-populated {len(options)} project options (with membership filter)")

        # Check for modules
        elif "modules" in hints or "module" in hints or any("module" in str(f).lower() for f in fields):
            if project_id:
                query = """
                SELECT m.id, m.name, m.description
                FROM modules m
                WHERE m.project_id = $1
                AND m.deleted_at IS NULL
                AND m.archived_at IS NULL
                ORDER BY m.name
                LIMIT 50
                """
                results = await PlaneDBPool.fetch(query, (project_id,))
                for row in results:
                    opt = {"id": str(row["id"]), "name": row["name"], "type": "module"}
                    if row["description"]:
                        opt["description"] = row["description"]
                    options.append(opt)

                if options:
                    log.info(f"ChatID: {chat_id} - Auto-populated {len(options)} module options")

        # Check for cycles
        elif "cycles" in hints or "cycle" in hints or any("cycle" in str(f).lower() for f in fields):
            if project_id:
                query = """
                SELECT c.id, c.name, c.start_date, c.end_date, c.project_id
                FROM cycles c
                WHERE c.project_id = $1
                AND c.deleted_at IS NULL
                AND c.archived_at IS NULL
                ORDER BY c.start_date DESC, c.name
                LIMIT 50
                """
                results = await PlaneDBPool.fetch(query, (project_id,))
                for row in results:
                    opt = {"id": str(row["id"]), "name": row["name"], "type": "cycle", "project_id": str(row["project_id"])}
                    if row["start_date"]:
                        opt["start_date"] = str(row["start_date"])
                    if row["end_date"]:
                        opt["end_date"] = str(row["end_date"])
                    options.append(opt)

                if options:
                    log.info(f"ChatID: {chat_id} - Auto-populated {len(options)} cycle options")

        # Check for users/members - WITH MEMBERSHIP FILTERING
        elif "users" in hints or "members" in hints or any(field in ["assignee_id", "user_id", "member_id"] for field in fields):
            if workspace_id:
                # If project context exists, get project members; otherwise workspace members
                if project_id:
                    query = """
                    SELECT DISTINCT u.id, u.display_name, u.email, u.avatar
                    FROM users u
                    JOIN project_members pm ON u.id = pm.member_id
                    WHERE pm.project_id = $1
                    AND pm.deleted_at IS NULL
                    AND pm.is_active = true
                    AND u.is_active = true
                    AND u.is_bot = false
                    ORDER BY u.display_name
                    LIMIT 50
                    """
                    results = await PlaneDBPool.fetch(query, (project_id,))
                else:
                    query = """
                    SELECT DISTINCT u.id, u.display_name, u.email, u.avatar
                    FROM users u
                    JOIN workspace_members wm ON u.id = wm.member_id
                    WHERE wm.workspace_id = $1
                    AND wm.deleted_at IS NULL
                    AND wm.is_active = true
                    AND u.is_active = true
                    AND u.is_bot = false
                    ORDER BY u.display_name
                    LIMIT 50
                    """
                    results = await PlaneDBPool.fetch(query, (workspace_id,))

                for row in results:
                    opt = {"id": str(row["id"]), "name": row["display_name"] or row["email"], "type": "user"}
                    if row["email"]:
                        opt["email"] = row["email"]
                    if row["avatar"]:
                        opt["avatar"] = row["avatar"]
                    options.append(opt)

                if options:
                    log.info(f"ChatID: {chat_id} - Auto-populated {len(options)} user options")

        # Check for labels
        elif "labels" in hints or "label" in hints or any("label" in str(f).lower() for f in fields):
            if project_id:
                query = """
                SELECT l.id, l.name, l.color, l.description
                FROM labels l
                WHERE l.project_id = $1
                AND l.deleted_at IS NULL
                ORDER BY l.sort_order, l.name
                LIMIT 50
                """
                results = await PlaneDBPool.fetch(query, (project_id,))
                for row in results:
                    opt = {"id": str(row["id"]), "name": row["name"], "type": "label"}
                    if row["color"]:
                        opt["color"] = row["color"]
                    if row["description"]:
                        opt["description"] = row["description"]
                    options.append(opt)

                if options:
                    log.info(f"ChatID: {chat_id} - Auto-populated {len(options)} label options")

        # Check for states
        elif "states" in hints or "state" in hints or any("state" in str(f).lower() for f in fields):
            if project_id:
                query = """
                SELECT s.id, s.name, s.color, s.group
                FROM states s
                WHERE s.project_id = $1
                AND s.deleted_at IS NULL
                ORDER BY s.sequence
                LIMIT 50
                """
                results = await PlaneDBPool.fetch(query, (project_id,))
                for row in results:
                    opt = {"id": str(row["id"]), "name": row["name"], "type": "state"}
                    if row["color"]:
                        opt["color"] = row["color"]
                    if row["group"]:
                        opt["group"] = row["group"]
                    options.append(opt)

                if options:
                    log.info(f"ChatID: {chat_id} - Auto-populated {len(options)} state options")

    except Exception as e:
        log.warning(f"ChatID: {chat_id} - Failed to auto-populate disambiguation options: {e}")
        # Return empty list on error

    return options


def conv_history_from_app_query(query: str) -> Tuple[str, str, List[BaseMessage]]:
    """
    Extract conversation history from an app query.

    Args:
        query: The query string to extract conversation history from

    Returns:
        Tuple of (current user message, conversation history string, list of BaseMessage objects)
    """
    # use the text before "πCurrent user messageπ:" as the conversation history and the text after it as the current user message
    current_user_message_index = query.find("πCurrent user messageπ:")
    conversation_history = ""
    if current_user_message_index != -1:
        conversation_history = query[:current_user_message_index].strip()
        query = query[current_user_message_index + len("πCurrent user messageπ:") :].strip()

    # Parse conversation history into User and Assistant messages
    langchain_conv_history: List[BaseMessage] = []
    if conversation_history.strip():
        # Find all User: and Assistant: patterns
        pattern = r"(User|Assistant):\s*(.*?)(?=(?:User|Assistant):|$)"
        matches = re.findall(pattern, conversation_history, re.DOTALL)

        for role, content in matches:
            content = content.strip()
            if not content:
                continue
            log.info(f"Conversation history role: {role}, content: {content}")
            if role == "User":
                langchain_conv_history.append(HumanMessage(content=content))
            elif role == "Assistant":
                langchain_conv_history.append(AIMessage(content=content))

    return query, conversation_history, langchain_conv_history
