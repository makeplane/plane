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
import uuid
from typing import Any
from typing import Dict
from typing import List
from typing import Literal
from typing import Optional
from typing import Tuple
from typing import Union

from pydantic import UUID4
from sqlalchemy import desc
from sqlalchemy import func
from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.agents.sql_agent.helpers import format_as_bullet_points
from pi.app.models import Chat
from pi.app.models import Message
from pi.app.models import MessageFlowStep
from pi.app.models import UserChatPreference
from pi.app.models.enums import ExecutionStatus
from pi.app.models.enums import FocusEntityType
from pi.app.models.enums import UserTypeChoices
from pi.app.models.message_attachment import MessageAttachment
from pi.app.schemas.chat import PaginationResponse
from pi.app.utils.attachments import get_presigned_url_download
from pi.app.utils.attachments import get_presigned_url_preview
from pi.app.utils.pagination import apply_cursor_pagination
from pi.app.utils.pagination import check_pagination_bounds
from pi.app.utils.pagination import create_pagination_response
from pi.services.chat.helpers.tool_utils import format_tool_message_for_display
from pi.services.chat.utils import mask_uuids_in_text
from pi.services.query_utils import parse_query
from pi.services.retrievers.pg_store.model import normalize_model_for_display

log = logger.getChild(__name__)


internal_reasoning_format_dict = {
    "rewrite": "Rewritten Query",
    "routing": "Routing",
    "tool": "Selected Tool",
    "structured_db_tool": "Structured DB Tool",
    "vector_search_tool": "Vector Search Tool",
    "pages_search_tool": "Pages Search Tool",
}


async def replace_plot_attachment_urls(content: str, db) -> str:
    """
    Replace plane-attachment:// placeholders with fresh presigned S3 URLs.

    Plot images use plane-attachment://<attachment_id>/<chat_id> scheme which
    gets replaced with a fresh presigned URL on each chat history fetch.
    This ensures plots work forever (same pattern as user attachments).

    Args:
        content: Message content that may contain plane-attachment:// URLs
        db: Database session

    Returns:
        Content with plane-attachment:// URLs replaced with presigned S3 URLs
    """
    import re
    import uuid

    from sqlmodel import select

    if "plane-attachment://" not in content:
        return content

    # Pattern: plane-attachment://<attachment_id>/<chat_id>
    pattern = r"plane-attachment://([a-f0-9-]+)/([a-f0-9-]+)"
    matches = re.findall(pattern, content)

    if not matches:
        return content

    result_content = content
    for attachment_id_str, chat_id_str in matches:
        try:
            attachment_uuid = uuid.UUID(attachment_id_str)

            # Fetch attachment from database
            stmt = select(MessageAttachment).where(
                MessageAttachment.id == attachment_uuid,
                MessageAttachment.status == "uploaded",
            )
            result = await db.execute(stmt)
            attachment = result.scalar_one_or_none()

            if attachment:
                # Generate fresh presigned URL
                presigned_url = get_presigned_url_preview(attachment)
                if presigned_url:
                    old_url = f"plane-attachment://{attachment_id_str}/{chat_id_str}"
                    result_content = result_content.replace(old_url, presigned_url)
        except Exception as e:
            log.warning(f"Failed to replace plot attachment URL {attachment_id_str}: {e}")
            continue

    return result_content


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


async def get_chat_title(chat_id: UUID4, db: AsyncSession) -> Optional[str]:
    """Fetch chat title from the database.

    Args:
        chat_id: The chat ID to fetch title for
        db: Database session

    Returns:
        Chat title if found, None otherwise
    """
    try:
        stmt = select(Chat).where(Chat.id == chat_id).where(Chat.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
        result = await db.execute(stmt)
        chat = result.scalar_one_or_none()
        return chat.title if chat else None
    except Exception as e:
        log.error(f"Error fetching chat title for chat_id {chat_id}: {e}")
        return None


def _extract_success_message_from_result(result: str) -> Optional[str]:
    """Extract the nice success message from the tool result."""
    if not result:
        return None

    # Try to find the message that comes after "✅ " and before "\n\n"
    success_marker = "✅ "
    if success_marker in result:
        # Find the start of the success message
        start_idx = result.find(success_marker) + len(success_marker)
        # Find the end (either double newline or end of string)
        end_markers = ["\n\n", "\n", result]
        end_idx = len(result)
        for marker in end_markers:
            if marker != result:
                marker_idx = result.find(marker, start_idx)
                if marker_idx != -1 and marker_idx < end_idx:
                    end_idx = marker_idx

        success_message = result[start_idx:end_idx].strip()
        if success_message:
            return success_message

    # Fallback: look for common success patterns
    if "successfully created" in result.lower():
        # Try to extract "Successfully created work item 'Name'"
        import re

        match = re.search(r"[Ss]uccessfully created.*?'([^']*)'", result)
        if match:
            return f"Successfully created {match.group(1)}"
    elif "successfully updated" in result.lower():
        # Try to extract "Successfully updated work item 'Name'"
        import re

        match = re.search(r"[Ss]uccessfully updated.*?'([^']*)'", result)
        if match:
            return f"Successfully updated {match.group(1)}"

    return None


async def extract_execution_status_from_flow_steps(
    message_flow_steps: List[MessageFlowStep], user_message_id: uuid.UUID, db: AsyncSession, is_latest_message: bool = False
) -> Dict[str, Any]:
    """
    Extract execution status information from planned actions for a specific user message.

    For normal artifacts: Uses MessageFlowStep execution status data
    For edited artifacts: Checks ActionArtifactVersion execution status

    Returns a dictionary with execution status details needed by the frontend.
    """
    # Filter flow steps for this specific message and only planned actions
    message_specific_steps = [step for step in message_flow_steps if step.message_id == user_message_id and step.is_planned]

    if not message_specific_steps:
        return {"action_summary": {"total_planned": 0, "completed": 0, "failed": 0, "duration_seconds": 0.0}, "actions": []}

    # Sort by step_order to ensure proper sequence
    message_specific_steps.sort(key=lambda x: x.step_order or 0)

    # Get ActionArtifactVersions and ActionArtifacts for this message
    # Do this in one query to avoid transaction issues
    artifact_versions_by_artifact_id: Dict = {}
    artifacts_by_id: Dict = {}
    try:
        from sqlalchemy import select

        from pi.app.models.action_artifact import ActionArtifact
        from pi.app.models.action_artifact import ActionArtifactVersion

        # Get executed artifact versions for this message with artifact data in one query
        version_stmt = (
            select(ActionArtifactVersion, ActionArtifact)
            .join(ActionArtifact, ActionArtifactVersion.artifact_id == ActionArtifact.id)  # type: ignore[union-attr,arg-type]
            .where(ActionArtifactVersion.message_id == user_message_id)  # type: ignore[arg-type]
            .where(ActionArtifactVersion.is_executed)  # type: ignore[arg-type] # Use explicit True for index
            .where(ActionArtifact.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
        )
        version_result = await db.execute(version_stmt)
        version_artifact_pairs = version_result.all()

        # Process results efficiently with O(1) lookups
        for version, artifact in version_artifact_pairs:
            artifact_id_str = str(version.artifact_id)
            if artifact_id_str not in artifact_versions_by_artifact_id:
                artifact_versions_by_artifact_id[artifact_id_str] = []
            artifact_versions_by_artifact_id[artifact_id_str].append(version)
            artifacts_by_id[artifact_id_str] = artifact

        # Also fetch all ActionArtifacts for this message (including planned but not executed ones)
        # This ensures we have artifact_type for all planned actions
        artifact_stmt = (
            select(ActionArtifact)
            .where(ActionArtifact.message_id == user_message_id)  # type: ignore[arg-type]
            .where(ActionArtifact.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
        )
        artifact_result = await db.execute(artifact_stmt)
        all_artifacts = artifact_result.scalars().all()

        # Add all artifacts to artifacts_by_id (this will include planned but not executed ones)
        for artifact in all_artifacts:
            artifact_id_str = str(artifact.id)
            artifacts_by_id[artifact_id_str] = artifact

    except Exception as e:
        log.error(f"Error fetching ActionArtifacts/Versions for message {user_message_id}: {e}")
        # Continue with empty dicts - will fallback to flow step data only

    # Count execution status from combined data (flow steps + versions)
    total_actions = len(message_specific_steps)
    completed_count = 0
    failed_count = 0

    # Build actions array - one entry per planned action
    actions = []

    for step in message_specific_steps:
        # Get artifact ID from execution_data first (needed to determine artifact type)
        artifact_id = None
        if step.execution_data and isinstance(step.execution_data, dict):
            artifact_id = step.execution_data.get("artifact_id")

        # Get artifact if available (needed for MCP special handling)
        artifact = artifacts_by_id.get(artifact_id) if artifact_id else None

        # Extract action - MCP uses artifact.action, Plane tools parse from tool_name
        action = "unknown"
        if artifact and artifact.entity == "mcp":
            # MCP artifacts store action directly (create, update, delete, execute)
            action = artifact.action or "execute"
        elif step.tool_name and "_" in step.tool_name:
            # Plane tools: "workitems_create" -> "create"
            action = step.tool_name.split("_", 1)[1]
        elif step.tool_name:
            action = step.tool_name

        # Extract tool_name for MCP (from artifact data)
        tool_name = step.tool_name or ""
        if artifact and artifact.entity == "mcp" and artifact.data:
            # Get display-friendly tool_name from planning_data
            planning_data = artifact.data.get("planning_data", {})
            if isinstance(planning_data, dict):
                tool_name = planning_data.get("tool_name", step.tool_name) or step.tool_name or ""

        # Basic action data from flow step
        action_data = {
            "action": action,
            "tool_name": tool_name,  # Include tool_name for consistency
            "success": False,  # Will be updated based on artifact/version status
            "executed_at": None,
            "artifact_id": artifact_id,
            "artifact_type": artifact.entity if artifact else None,
        }

        # Include planned sequence for ordering
        if hasattr(step, "step_order") and step.step_order is not None:
            action_data["sequence"] = step.step_order

        # Check execution status: first from MessageFlowStep, then from ActionArtifactVersion
        is_executed = step.is_executed
        is_successful = step.execution_success == ExecutionStatus.SUCCESS
        entity_info = None
        executed_at = None

        # Extract execution details from execution_data if available
        if step.execution_data and isinstance(step.execution_data, dict):
            executed_at = step.execution_data.get("executed_at")
            entity_info = step.execution_data.get("entity_info")

            # For artifacts, also store artifact_id if not already set
            if not artifact_id:
                artifact_id = step.execution_data.get("artifact_id")
                if artifact_id:
                    action_data["artifact_id"] = artifact_id

                    # Get artifact_type now that we have the artifact_id
                    if artifact_id in artifacts_by_id:
                        artifact = artifacts_by_id[artifact_id]
                        action_data["artifact_type"] = artifact.entity

        # For edited artifacts, check if we have executed version data that overrides flow step data
        if artifact_id and artifact_id in artifact_versions_by_artifact_id:
            executed_versions = artifact_versions_by_artifact_id[artifact_id]
            if executed_versions:
                # Use the latest executed version
                latest_version = max(executed_versions, key=lambda v: v.version_number)
                is_executed = True
                is_successful = latest_version.success
                executed_at = latest_version.created_at.isoformat() if latest_version.created_at else executed_at

                # Extract entity info from version data if available
                if latest_version.data and isinstance(latest_version.data, dict):
                    version_entity_info = latest_version.data.get("entity_info")
                    if version_entity_info:
                        entity_info = version_entity_info
        # Update counts
        if is_executed and is_successful:
            completed_count += 1
        elif is_executed and not is_successful:
            failed_count += 1

        # Update action data with execution status
        action_data["is_executed"] = is_executed
        action_data["success"] = is_executed and is_successful
        action_data["is_editable"] = is_latest_message and not is_executed

        if is_executed and executed_at:
            action_data["executed_at"] = executed_at

        # Add entity information if available
        if entity_info and isinstance(entity_info, dict):
            essential_entity = {}
            for field in ["entity_url", "entity_name", "entity_type", "entity_id"]:
                if field in entity_info and entity_info[field]:
                    essential_entity[field] = entity_info[field]

            if essential_entity:
                action_data["entity"] = essential_entity

        missing_url = not (entity_info and isinstance(entity_info, dict) and entity_info.get("entity_url"))
        if is_executed and missing_url and artifact_id and artifact_id in artifacts_by_id:
            artifact = artifacts_by_id[artifact_id]
            if artifact.entity_id:
                try:
                    from pi.services.actions.artifacts.utils import populate_entity_info_from_artifact

                    entity_id, entity_url, entity_name, entity_type, _issue_identifier, _entity_identifier = await populate_entity_info_from_artifact(
                        artifact
                    )

                    # Build entity info if we found any details
                    if entity_name or entity_url:
                        # Start from whatever was already in action_data["entity"] (may have entity_id/type)
                        enriched_entity = action_data.get("entity") or {}
                        if entity_id:
                            enriched_entity["entity_id"] = entity_id
                        if entity_type:
                            enriched_entity["entity_type"] = entity_type
                        if entity_name:
                            enriched_entity["entity_name"] = entity_name
                        if entity_url:
                            enriched_entity["entity_url"] = entity_url

                        action_data["entity"] = enriched_entity

                except Exception as e:
                    log.warning(f"Error fetching entity details for {artifact.entity} {artifact.entity_id} in chat history: {e}")
                    # Keep whatever minimal entity info we have, add entity_id/type as fallback
                    if "entity" not in action_data:
                        action_data["entity"] = {
                            "entity_id": str(artifact.entity_id),
                            "entity_type": artifact.entity,
                        }

        # For failed executed actions: fall back to planning-time entity when no entity resolved yet.
        # entity_id is never set on the artifact for failures, so the populate_entity_info path above
        # is skipped. The planning_data["entity"] always carries at least entity_name + entity_type.
        if is_executed and not is_successful and "entity" not in action_data:
            if artifact_id and artifact_id in artifacts_by_id:
                artifact = artifacts_by_id[artifact_id]
                if artifact and artifact.data and isinstance(artifact.data, dict):
                    planning_entity = artifact.data.get("planning_data", {}).get("entity")
                    if planning_entity and isinstance(planning_entity, dict):
                        fallback_entity: Dict[str, Any] = {}
                        for field in ["entity_url", "entity_name", "entity_type", "entity_id"]:
                            if field in planning_entity and planning_entity[field]:
                                fallback_entity[field] = planning_entity[field]
                        if fallback_entity:
                            action_data["entity"] = fallback_entity

        # Add success/error message
        if is_executed and is_successful:
            action_data["message"] = "Action completed successfully"
        elif is_executed and not is_successful:
            # Prefer the detailed execution_error from the flow step, then fall back to execution_result
            error_message = None
            try:
                if getattr(step, "execution_error", None):
                    error_message = str(step.execution_error)
                elif step.execution_data and isinstance(step.execution_data, dict):
                    exec_result = step.execution_data.get("execution_result")
                    if exec_result:
                        error_message = str(exec_result)
            except Exception:
                error_message = None

            # Truncate very long errors to keep the response compact
            if error_message:
                action_data["error"] = f"{error_message[:200]}..." if len(error_message) > 200 else error_message
            else:
                action_data["error"] = None

        actions.append(action_data)

    # Compute summary boolean fields based on actions array
    any_executed = any(action.get("is_executed", False) for action in actions)
    any_editable = any(action.get("is_editable", False) for action in actions)

    return {
        "action_summary": {
            "total_planned": total_actions,
            "completed": completed_count,
            "failed": failed_count,
            "duration_seconds": 0.0,  # Default duration since we don't track it in flow steps
            "is_executed": any_executed,
            "is_editable": any_editable,
        },
        "actions": actions,
    }


async def retrieve_chat_history(
    chat_id: UUID4,
    db: AsyncSession,
    pi_internal: bool = False,
    dialogue_object: bool = False,
    user_id: Optional[UUID4] = None,
) -> dict[str, Any]:
    """Retrieves chat history for a specific chat ID with optional formatting options using database."""
    try:
        # Step 1: Always fetch chat by ID
        chat_query = select(Chat).where(Chat.id == chat_id)  # type: ignore[arg-type]
        chat_result = await db.execute(chat_query)
        chat = chat_result.scalar_one_or_none()

        # Step 2: Handle chat not found
        if not chat:
            log.warning(f"Chat not found: chat_id={chat_id}")
            return {
                "error": "not_found",
                "detail": "Chat not found.",
                "chat_id": str(chat_id),
                "title": "",
                "dialogue": [],
                "feedback": "",
                "reasoning": "",
                "llm": "",
                # "internal_reasoning": "",
            }

        # Step 3: If user_id is provided, check if user owns this chat
        if user_id and str(chat.user_id) != str(user_id):
            log.warning(f"Unauthorized access attempt: user_id={user_id}, chat_id={chat_id}")
            return {
                "error": "unauthorized",
                "detail": "You are not authorized to access this chat.",
                "chat_id": str(chat_id),
                "title": "",
                "dialogue": [],
                "feedback": "",
                "reasoning": "",
                "llm": "",
                # "internal_reasoning": "",
            }

        # Fetch user chat preference
        user_chat_preference_query = (
            select(UserChatPreference).where(UserChatPreference.user_id == user_id).where(UserChatPreference.chat_id == chat_id)  # type: ignore[union-attr,arg-type]
        )
        user_chat_preference_result = await db.execute(user_chat_preference_query)
        user_chat_preference = user_chat_preference_result.scalar_one_or_none()

        # Step 4: Get messages for this chat ordered by sequence (exclude replaced messages and external app triggered messages)
        message_query = (
            select(Message)
            .where(Message.chat_id == chat_id)  # type: ignore[arg-type]
            .where(~Message.is_replaced)  # type: ignore[arg-type]
            .where((Message.source != "app") | (Message.source.is_(None)))  # type: ignore[arg-type,union-attr]
            .order_by(Message.sequence)  # type: ignore[arg-type]
        )
        message_result = await db.execute(message_query)
        messages = list(message_result.scalars().all())

        # Get message flow steps for the chat (always fetch, not just for pi_internal)
        # This is needed to provide execution status information to the frontend
        message_flow_steps_query = select(MessageFlowStep).where(MessageFlowStep.chat_id == chat_id)  # type: ignore[arg-type]
        message_flow_steps_result = await db.execute(message_flow_steps_query)
        message_flow_steps = list(message_flow_steps_result.scalars().all())

        # Step 5: Get most recent assistant message to extract LLM model (exclude replaced messages)
        last_assistant_message_query = (
            select(Message)
            .where(Message.chat_id == chat_id)  # type: ignore[arg-type]
            .where(Message.user_type == UserTypeChoices.ASSISTANT.value)  # type: ignore[arg-type]
            .where(~Message.is_replaced)  # type: ignore[arg-type]
            .order_by(desc(Message.created_at))  # type: ignore[arg-type]
            .limit(1)
        )
        last_message_result = await db.execute(last_assistant_message_query)
        last_assistant_message = last_message_result.scalar_one_or_none()
        chat_llm = normalize_model_for_display(last_assistant_message.llm_model if last_assistant_message else None)

        # Step 6: Get attachments for all messages (only IDs)
        message_ids = [msg.id for msg in messages] if messages else []
        attachments_dict: Dict[Optional[uuid.UUID], List[str]] = {}
        attachments_object_dict: Dict[Optional[uuid.UUID], List[Dict[str, Any]]] = {}

        if message_ids:
            attachments_query = select(MessageAttachment).where(
                MessageAttachment.message_id.in_(message_ids),  # type: ignore[union-attr]
                MessageAttachment.status == "uploaded",  # type: ignore[union-attr,arg-type]
                MessageAttachment.deleted_at.is_(None),  # type: ignore[union-attr]
            )
            attachments_result = await db.execute(attachments_query)
            attachments = attachments_result.scalars().all()

            # Group attachment IDs by message_id
            for attachment in attachments:
                if attachment.message_id not in attachments_dict:
                    attachments_dict[attachment.message_id] = []
                    attachments_object_dict[attachment.message_id] = []

                attachments_dict[attachment.message_id].append(str(attachment.id))
                attachments_object_dict[attachment.message_id].append(
                    {
                        "id": str(attachment.id),
                        "filename": attachment.original_filename,
                        "file_type": attachment.file_type,
                        "file_size": attachment.file_size,
                        "preview_url": get_presigned_url_preview(attachment),
                        "download_url": get_presigned_url_download(attachment),
                    }
                )

        # Step 7: Format messages
        dialogue_list: List[Any] = []
        if messages:
            if not dialogue_object:
                for message in messages:
                    if message.user_type == UserTypeChoices.SYSTEM.value and not pi_internal:
                        continue
                    dialogue_list.append(message.content or "")
            else:
                i = 0
                while i < len(messages):
                    if (
                        i + 1 < len(messages)
                        and messages[i].user_type == UserTypeChoices.USER.value
                        and messages[i + 1].user_type == UserTypeChoices.ASSISTANT.value
                    ):
                        user_message = messages[i]
                        assistant_message = messages[i + 1]
                        feedback = ""
                        if assistant_message.message_feedbacks:
                            feedback = assistant_message.message_feedbacks[0].feedback or ""

                        # Extract execution status information for this user message
                        # Check if this is the last user message in the chat (for is_editable)
                        is_last_user_message = all(
                            msg.user_type != UserTypeChoices.USER.value or msg.sequence <= user_message.sequence for msg in messages
                        )
                        execution_status_info = await extract_execution_status_from_flow_steps(
                            message_flow_steps, user_message.id, db, is_latest_message=is_last_user_message
                        )

                        # Extract todos from the write_todos flow step for this user message (if any)
                        todos_for_pair: list = []
                        for _step in message_flow_steps:
                            if _step.message_id == user_message.id and _step.tool_name == "write_todos":
                                _exec = _step.execution_data or {}
                                if isinstance(_exec, dict) and _exec.get("todos"):
                                    todos_for_pair = _exec["todos"]
                                break

                        qa_pair: Dict[str, Any] = {
                            "query": user_message.content or "",
                            "answer": await replace_plot_attachment_urls(assistant_message.content or "", db),
                            "reasoning": assistant_message.reasoning or "",
                            "todos": todos_for_pair,
                            "feedback": feedback,
                            "llm": normalize_model_for_display(assistant_message.llm_model),
                            "parsed_query": user_message.parsed_content or "",
                            "query_id": str(user_message.id),
                            "answer_id": str(assistant_message.id),
                            "attachment_ids": attachments_dict.get(user_message.id, []),
                            "attachments": attachments_object_dict.get(user_message.id, []),
                        }

                        # For external responses, augment reasoning with cleaned tool results from flow steps
                        if not pi_internal:
                            try:
                                # Collect relevant flow steps for this message, in order
                                message_specific_steps = [step for step in message_flow_steps if step.message_id == user_message.id]
                                message_specific_steps.sort(key=lambda x: x.step_order or 0)

                                cleaned_blocks: List[str] = []
                                for step in message_specific_steps:
                                    # Only include tool steps; skip metadata/internal-only tools
                                    if getattr(step, "step_type", None) != "tool":
                                        continue
                                    tool_name = getattr(step, "tool_name", None)
                                    if tool_name in (
                                        "tool_orchestration_context",
                                        "llm_reasoning",
                                        "get_available_plane_actions",
                                        "planner_summary",
                                    ):
                                        continue
                                    # Skip planned actions in external reasoning (only show retrieval outputs)
                                    if getattr(step, "is_planned", False):
                                        continue
                                    # Include retrieval steps even if execution_success wasn't explicitly set,
                                    # as ask-mode persistence used to leave it as PENDING. Prefer executed or explicit success.
                                    if (
                                        not getattr(step, "is_executed", False)
                                        and getattr(step, "execution_success", None) != ExecutionStatus.SUCCESS
                                    ):
                                        continue

                                    # SPECIAL FILTERS:
                                    # For structured_db_tool, hide intermediate steps (table selection, SQL generation, final_query planning)
                                    if isinstance(tool_name, str) and tool_name.startswith("structured_db_tool_"):
                                        # Only the core 'structured_db_tool' should be shown in external reasoning
                                        continue

                                    # Extract raw content and format for display
                                    exec_data = getattr(step, "execution_data", {}) or {}
                                    raw_str: str = ""
                                    if isinstance(exec_data, dict):
                                        if exec_data.get("execution_result"):
                                            raw_str = str(exec_data.get("execution_result"))
                                        elif exec_data.get("retrieval_result"):
                                            raw_str = str(exec_data.get("retrieval_result"))
                                        elif exec_data.get("structured_result") is not None:
                                            try:
                                                raw_str = json.dumps(exec_data.get("structured_result"), default=str)
                                            except Exception:
                                                raw_str = str(exec_data.get("structured_result"))
                                    if not raw_str:
                                        raw_content = parse_flow_step_content(step.content or "")
                                        try:
                                            if isinstance(raw_content, (dict, list)):
                                                raw_str = json.dumps(raw_content, default=str)
                                            else:
                                                raw_str = str(raw_content)
                                        except Exception:
                                            raw_str = str(raw_content)

                                    # Tool-specific external rendering
                                    tname = (tool_name or "").strip().lower()
                                    if tname == "structured_db_tool":
                                        try:
                                            # Prefer structured_result.results if available
                                            results_obj = None
                                            sql_query_str = None
                                            if isinstance(exec_data, dict):
                                                sr = exec_data.get("structured_result")
                                                if isinstance(sr, dict):
                                                    results_obj = sr.get("results")
                                                    sql_query_str = sr.get("sql_query")
                                            if results_obj is None and raw_str:
                                                # Try to parse raw_str JSON and extract 'results'
                                                try:
                                                    parsed = json.loads(raw_str)
                                                    if isinstance(parsed, dict):
                                                        results_obj = parsed.get("results")
                                                        if not sql_query_str:
                                                            sql_query_str = parsed.get("sql_query")
                                                except Exception:
                                                    results_obj = None

                                            # Fallback: if still missing, try step.content JSON
                                            if results_obj is None:
                                                content_parsed = parse_flow_step_content(step.content or "")
                                                if isinstance(content_parsed, dict):
                                                    results_obj = content_parsed.get("results")
                                                    if not sql_query_str:
                                                        sql_query_str = content_parsed.get("sql_query")

                                            # Build display exactly as live stream intent: success prelude + rows
                                            prelude = "Database querying execution completed"
                                            rows_text = ""
                                            if results_obj is not None:
                                                # Use bullet points formatter (async)
                                                rows_text = await format_as_bullet_points(results_obj, sql_query=sql_query_str)
                                            else:
                                                # Last resort: fall back to cleaned message formatter
                                                rows_text = format_tool_message_for_display(f"{prelude}\n\nResult: {raw_str}")
                                                # Avoid duplicating prelude inside rows_text
                                                if rows_text.startswith(prelude):
                                                    rows_text = rows_text[len(prelude) :].lstrip()

                                            block = f"{prelude}\n\n{rows_text}".strip()
                                            if block:
                                                cleaned_blocks.append(mask_uuids_in_text(block))
                                        except Exception:
                                            # Fail-safe: fall back to generic formatting
                                            prelude = f"{(tool_name or 'Tool')} execution completed"
                                            formatted = format_tool_message_for_display(f"{prelude}\n\nResult: {raw_str}")
                                            if formatted and formatted.strip():
                                                cleaned_blocks.append(mask_uuids_in_text(formatted))

                                    elif tname == "vector_search_tool":
                                        # Truncate to first 50 words for external display
                                        def _truncate_words(text: str, max_words: int = 50) -> str:
                                            words = text.split()
                                            if len(words) <= max_words:
                                                return text
                                            return " ".join(words[:max_words]) + "..."

                                        truncated = ""
                                        # Try to extract 'results' from structured_result if present
                                        if isinstance(exec_data, dict) and exec_data.get("structured_result"):
                                            sr = exec_data.get("structured_result")
                                            if isinstance(sr, dict):
                                                res = sr.get("results")
                                                if res is not None:
                                                    truncated = _truncate_words(str(res))
                                        if not truncated:
                                            truncated = _truncate_words(str(raw_str))

                                        from pi.services.chat.helpers.tool_utils import tool_name_shown_to_user

                                        prelude = f"{tool_name_shown_to_user(tool_name or 'Tool')} execution completed"
                                        formatted = f"{prelude}\n\nResult: {truncated}"
                                        cleaned_blocks.append(mask_uuids_in_text(formatted.strip()))

                                    else:
                                        from pi.services.chat.helpers.tool_utils import tool_name_shown_to_user

                                        prelude = f"{tool_name_shown_to_user(tool_name or 'Tool')} execution completed"
                                        # Include query context when available (helps external readers)
                                        if isinstance(exec_data, dict) and exec_data.get("tool_query"):
                                            try:
                                                tq = str(exec_data.get("tool_query")).strip()
                                                if tq:
                                                    prelude = f"{prelude} ({tq})"
                                            except Exception:
                                                pass
                                        formatted = format_tool_message_for_display(f"{prelude}\n\nResult: {raw_str}")
                                        if formatted and formatted.strip():
                                            cleaned_blocks.append(mask_uuids_in_text(formatted))

                                if cleaned_blocks:
                                    base_reasoning = (qa_pair.get("reasoning") or "").strip()
                                    if base_reasoning:
                                        base_reasoning = mask_uuids_in_text(base_reasoning)
                                    appended = "\n\n".join(cleaned_blocks)
                                    qa_pair["reasoning"] = f"{base_reasoning}\n\n{appended}".strip() if base_reasoning else appended
                            except Exception:
                                # Fail-safe: do not block retrieval on formatting errors
                                pass

                        # Add execution information at dialogue level (only if there are actions)
                        if execution_status_info.get("actions"):
                            qa_pair.update(
                                {
                                    "action_summary": execution_status_info.get("action_summary", {}),
                                    "actions": execution_status_info.get("actions", []),
                                }
                            )

                        if pi_internal:
                            # Generate internal reasoning for this specific assistant message
                            message_internal_reasoning = ""
                            # Filter flow steps for this specific message
                            message_specific_steps = [step for step in message_flow_steps if step.message_id == user_message.id]
                            # Sort flow steps by step_order to ensure proper sequence
                            message_specific_steps.sort(key=lambda x: x.step_order or 0)

                            if message_specific_steps:
                                # Generate reasoning for this message's flow steps
                                internal_reasoning_parts = []
                                execution_summaries: List[str] = []

                                # Extract information from flow steps for this message
                                selected_tools_results: List[str] = []
                                tool_results: Dict[str, List[Any]] = {}

                                # Process flow steps to extract information
                                for message_flow_step in message_specific_steps:
                                    content = parse_flow_step_content(message_flow_step.content or "")
                                    step_type = message_flow_step.step_type
                                    tool_name = message_flow_step.tool_name

                                    if step_type == "tool" and tool_name:
                                        # Handle tool selection specially - extract selected tools for display
                                        if tool_name == "tool_selection":
                                            content_data = parse_flow_step_content(message_flow_step.content or "")
                                            if isinstance(content_data, dict):
                                                selected_tools = content_data.get("selected_tools", [])
                                                for tool_info in selected_tools:
                                                    if isinstance(tool_info, dict):
                                                        tool_display_name = tool_info.get("name", "")
                                                        # Format tool selection for enhanced history
                                                        selected_tools_results.append(f"Selected Tool: {tool_display_name}")
                                            continue

                                        # Skip context-only metadata steps, verbose advisory content, and reasoning (don't clutter history)
                                        if tool_name in (
                                            "tool_orchestration_context",
                                            "llm_reasoning",
                                            "get_available_plane_actions",
                                            "planner_summary",
                                        ):
                                            continue

                                        # Skip intermediate retrieval tool steps (same as external reasoning)
                                        # These are internal implementation details that shouldn't clutter the LLM context
                                        if tool_name in (
                                            "structured_db_tool_table_selection",
                                            "structured_db_tool_sql_generation",
                                            "structured_db_tool_final_query",
                                        ):
                                            continue

                                        # For retrieval tools (non-planned), skip PENDING steps - they shouldn't be in history
                                        if hasattr(message_flow_step, "execution_success") and hasattr(message_flow_step, "is_planned"):
                                            if not message_flow_step.is_planned:
                                                # This is a retrieval tool - only include if successfully executed
                                                if message_flow_step.execution_success != ExecutionStatus.SUCCESS:
                                                    continue

                                        # Collect tool results
                                        if tool_name not in tool_results:
                                            tool_results[tool_name] = []
                                        tool_results[tool_name].append(content)

                                        # Add execution status information using new fields
                                        if hasattr(message_flow_step, "execution_success") and hasattr(message_flow_step, "is_planned"):
                                            if message_flow_step.is_planned:
                                                # This is a planned action (modifying tool). Prefer explicit execution summary with entity details.
                                                if message_flow_step.execution_success == ExecutionStatus.SUCCESS and getattr(
                                                    message_flow_step, "is_executed", False
                                                ):
                                                    # Build concise executed action line
                                                    exec_data = message_flow_step.execution_data or {}
                                                    entity_info = exec_data.get("entity_info") if isinstance(exec_data, dict) else None
                                                    eid = entity_info.get("entity_id") if isinstance(entity_info, dict) else None
                                                    if not eid and isinstance(entity_info, dict):
                                                        eid = entity_info.get("id")
                                                    ename = entity_info.get("entity_name") if isinstance(entity_info, dict) else None
                                                    eurl = entity_info.get("entity_url") if isinstance(entity_info, dict) else None

                                                    summary = f"✅ Executed: {tool_name}"
                                                    if ename or eid:
                                                        entity_str = ename or ""
                                                        if eid:
                                                            entity_str = f"{entity_str} ({eid})".strip()
                                                        summary += f" → Entity: {entity_str}"
                                                    if eurl:
                                                        summary += f"\nURL: {eurl}"
                                                    execution_info = summary
                                                elif message_flow_step.execution_success == ExecutionStatus.FAILED:
                                                    execution_status = "❌ EXECUTION FAILED"
                                                    if message_flow_step.execution_error:
                                                        execution_status += f" - {message_flow_step.execution_error}"
                                                    execution_info = f"Action Status: {execution_status}"
                                                else:  # PENDING
                                                    execution_info = "Action Status: ⏳ PLANNED BUT NOT EXECUTED"
                                            else:
                                                # This is a retrieval tool - show clearer results
                                                if message_flow_step.execution_success == ExecutionStatus.SUCCESS:
                                                    # Extract tool query for context if available
                                                    tool_query = ""
                                                    if message_flow_step.execution_data:
                                                        tool_query = message_flow_step.execution_data.get("tool_query", "")

                                                    # Build informative execution line with result preview
                                                    execution_info = ""
                                                    if tool_query:
                                                        execution_info = f"🔧 Executed: {tool_name} ({tool_query})\n"
                                                    else:
                                                        execution_info = f"🔧 Executed: {tool_name}\n"

                                                    # Add result preview (truncate if too long)
                                                    result_preview = str(content)[:300] if content else ""
                                                    if result_preview:
                                                        execution_info += f"\nResults:\n{result_preview}"
                                                        if len(str(content)) > 300:
                                                            execution_info += "... [truncated]"

                                                    # Append key facts if available
                                                    try:
                                                        exec_data = message_flow_step.execution_data or {}
                                                        facts = exec_data.get("facts") if isinstance(exec_data, dict) else None
                                                        facts_lines = []
                                                        if isinstance(facts, dict):
                                                            if facts.get("entity_url"):
                                                                facts_lines.append(f"URL: {facts.get('entity_url')}")
                                                            # Prefer identifier/name/id in that order
                                                            ent = facts.get("entity_identifier") or facts.get("entity_name") or facts.get("entity_id")
                                                            if ent:
                                                                facts_lines.append(f"Entity: {ent}")
                                                            # Count previews
                                                            for key in (
                                                                "projects_count",
                                                                "cycles_count",
                                                                "results_count",
                                                                "items_count",
                                                                "list_count",
                                                            ):
                                                                if key in facts:
                                                                    facts_lines.append(f"Count: {facts.get(key)}")
                                                                    break
                                                            # IDs preview
                                                            for key in ("projects_ids_preview", "cycles_ids_preview", "ids_preview"):
                                                                ids_val = facts.get(key)
                                                                if isinstance(ids_val, list) and ids_val:
                                                                    facts_lines.append(f"IDs: {', '.join([str(x) for x in ids_val][:3])}")
                                                                    break
                                                        if facts_lines:
                                                            execution_info += "\n" + "\n".join(facts_lines)
                                                    except Exception:
                                                        pass
                                                elif message_flow_step.execution_success == ExecutionStatus.FAILED:
                                                    execution_status = "❌ EXECUTION FAILED"
                                                    if message_flow_step.execution_error:
                                                        execution_status += f" - {message_flow_step.execution_error}"
                                                    execution_info = f"Tool Status: {execution_status}"
                                                else:  # PENDING - this shouldn't happen anymore with our fixes
                                                    execution_info = "Tool Status: ⏳ PENDING"
                                        elif hasattr(message_flow_step, "is_executed"):
                                            # Fallback for old records without new fields
                                            execution_status = "EXECUTED" if message_flow_step.is_executed else "PLANNED BUT NOT EXECUTED"
                                            execution_info = f"Action Status: {execution_status}"
                                        else:
                                            execution_info = "Status: Unknown"

                                        # Add execution details if available (timestamp and entity metadata)
                                        if message_flow_step.is_executed and message_flow_step.execution_data:
                                            exec_data = message_flow_step.execution_data
                                            if exec_data.get("executed_at"):
                                                execution_info = f"{execution_info} (Executed at: {exec_data.get('executed_at')})"
                                            if exec_data.get("entity_info") or exec_data.get("entities"):
                                                try:
                                                    # Single entity details
                                                    entity_info = exec_data.get("entity_info", {})
                                                    eid = (
                                                        entity_info.get("entity_id") or entity_info.get("id")
                                                        if isinstance(entity_info, dict)
                                                        else None
                                                    )
                                                    ename = entity_info.get("entity_name") if isinstance(entity_info, dict) else None
                                                    eurl = entity_info.get("entity_url") if isinstance(entity_info, dict) else None
                                                    extra_lines = []
                                                    if eid:
                                                        extra_lines.append(f"Entity ID: {eid}")
                                                    if ename:
                                                        extra_lines.append(f"Entity: {ename}")
                                                    if eurl:
                                                        extra_lines.append(f"URL: {eurl}")

                                                    # Bulk entities
                                                    entities = exec_data.get("entities")
                                                    if isinstance(entities, list) and entities:
                                                        extra_lines.append(f"Entities: {len(entities)}")
                                                        preview = entities[:3]
                                                        for idx, ent in enumerate(preview, 1):
                                                            if not isinstance(ent, dict):
                                                                continue
                                                            _name = ent.get("entity_name") or ent.get("name") or ""
                                                            _id = ent.get("entity_id") or ent.get("id") or ""
                                                            _url = ent.get("entity_url") or ""
                                                            line = f"  {idx}. "
                                                            if _name:
                                                                line += _name
                                                            if _id:
                                                                line += f" ({_id})"
                                                            extra_lines.append(line)
                                                            if _url:
                                                                extra_lines.append(f"     URL: {_url}")
                                                        if len(entities) > 3:
                                                            extra_lines.append("  ...")

                                                    if extra_lines:
                                                        execution_info = execution_info + ("\n" if execution_info else "") + "\n".join(extra_lines)
                                                except Exception:
                                                    pass

                                        # Collect execution summaries to append later (after question and selected tools)
                                        execution_summaries.append(execution_info)

                                # Build the formatted reasoning string for this message (AFTER processing all flow steps)
                                # Note: Do not repeat the user question here; it will be included in the enhanced history section header

                                # Prepare separate sections so downstream can reorder (selected vs executed)
                                selected_section_lines: List[str] = []
                                if selected_tools_results:
                                    selected_section_lines.append(
                                        "The below tools were selected to retrieve relevant information to address the query:"
                                    )
                                    selected_section_lines.extend(selected_tools_results)
                                    selected_section_lines.append("")
                                    # Also add into internal_reasoning_parts for backwards-compatible single string
                                    internal_reasoning_parts.extend(selected_section_lines)

                                # Append execution summaries (tool runs and result previews) after tools selection
                                executed_section_lines: List[str] = []
                                if execution_summaries:
                                    executed_section_lines.extend(execution_summaries)
                                    executed_section_lines.append("")
                                    # Also add into internal_reasoning_parts for backwards-compatible single string
                                    internal_reasoning_parts.extend(executed_section_lines)

                                # Process each tool's results - add only non-redundant, high-signal details
                                # Avoid duplicating raw results here since execution summaries above already include a results preview
                                for tool_name_key, tool_content_list in tool_results.items():
                                    for content in tool_content_list:
                                        if isinstance(content, dict):
                                            if tool_name_key == "structured_db_tool":
                                                # Include generated SQL query (useful context), but skip raw result dumps
                                                intermediate_results = content.get("intermediate_results", {})
                                                if intermediate_results:
                                                    sql_query = intermediate_results.get("generated_sql", "")
                                                    if sql_query:
                                                        internal_reasoning_parts.append(f"SQL query generated: '{sql_query}'")

                                                # Include entity URLs if available
                                                entity_urls = content.get("entity_urls", [])
                                                if entity_urls:
                                                    internal_reasoning_parts.append("Entity URLs:")
                                                    for idx, url_dict in enumerate(entity_urls, 1):
                                                        internal_reasoning_parts.append(f"{idx}. url: {url_dict.get('url', 'N/A')}")
                                                        internal_reasoning_parts.append(f"    id: {url_dict.get('id', 'N/A')}")
                                                        internal_reasoning_parts.append(f"    item type: {url_dict.get('type', 'N/A')}")
                                                        if url_dict.get("type") == "issue" and url_dict.get("issue_identifier"):
                                                            internal_reasoning_parts.append(
                                                                f"    issue unique key: {url_dict.get('issue_identifier')}"
                                                            )
                                            else:
                                                # Skip adding additional raw results for other tools to avoid duplication
                                                continue

                                    internal_reasoning_parts.append("")  # Add empty line between tools

                                # Join all internal reasoning parts into a single formatted string
                                message_internal_reasoning = "\n".join(internal_reasoning_parts)

                            # Store both combined and split sections for downstream formatting control
                            qa_pair["internal_reasoning"] = message_internal_reasoning
                            try:
                                if selected_tools_results:
                                    qa_pair["internal_selected"] = "\n".join(
                                        ["The below tools were selected to retrieve relevant information to address the query:"]
                                        + selected_tools_results
                                    ).strip()
                            except Exception:
                                pass
                            try:
                                if executed_section_lines:
                                    qa_pair["internal_executed"] = "\n".join(executed_section_lines).strip()
                            except Exception:
                                pass

                        dialogue_list.append(qa_pair)
                        i += 2
                    # NEW: Handle standalone USER messages (OAuth case)
                    elif messages[i].user_type == UserTypeChoices.USER.value:
                        user_message = messages[i]

                        # Check if OAuth is required for this message
                        oauth_required = any(step.oauth_required and step.message_id == user_message.id for step in message_flow_steps)

                        # Create QA pair with appropriate placeholder response
                        if oauth_required:
                            assistant_answer = "🔐 OAuth authorization required. Please complete authentication to continue."
                        else:
                            assistant_answer = "⏳ Processing your request..."

                        # Extract execution status information for this user message
                        # Check if this is the last user message in the chat (for is_editable)
                        is_last_user_message = all(
                            msg.user_type != UserTypeChoices.USER.value or msg.sequence <= user_message.sequence for msg in messages
                        )
                        execution_status_info = await extract_execution_status_from_flow_steps(
                            message_flow_steps, user_message.id, db, is_latest_message=is_last_user_message
                        )

                        standalone_qa_pair: Dict[str, Any] = {
                            "query": user_message.content or "",
                            "answer": assistant_answer,
                            "reasoning": "",
                            "feedback": "",
                            "llm": "",
                            "parsed_query": user_message.parsed_content or "",
                            "query_id": str(user_message.id),
                            "answer_id": "",  # No assistant message yet
                            "attachment_ids": attachments_dict.get(user_message.id, []),
                            "attachments": attachments_object_dict.get(user_message.id, []),  # Add this line for consistency
                        }

                        # Flatten actions and summary at the top-level for frontend compatibility (build mode)
                        if execution_status_info.get("actions"):
                            standalone_qa_pair.update(
                                {
                                    "action_summary": execution_status_info.get("action_summary", {}),
                                    "actions": execution_status_info.get("actions", []),
                                }
                            )

                        if pi_internal:
                            # Generate internal reasoning for this standalone user message
                            standalone_message_internal_reasoning = ""
                            # Filter flow steps for this specific message
                            standalone_message_specific_steps = [step for step in message_flow_steps if step.message_id == user_message.id]
                            # Sort flow steps by step_order to ensure proper sequence
                            standalone_message_specific_steps.sort(key=lambda x: x.step_order or 0)

                            if standalone_message_specific_steps:
                                # Generate reasoning for this message's flow steps
                                standalone_internal_reasoning_parts = []

                                # Extract information from flow steps for this message
                                standalone_original_query = user_message.content or ""
                                standalone_rewritten_query = ""
                                standalone_selected_tools_results: List[str] = []
                                standalone_tool_results: Dict[str, List[Any]] = {}

                                # Process flow steps to extract information
                                for message_flow_step in standalone_message_specific_steps:
                                    content = parse_flow_step_content(message_flow_step.content or "")
                                    step_type = message_flow_step.step_type
                                    tool_name = message_flow_step.tool_name

                                    if step_type == "rewrite" and isinstance(content, dict):
                                        standalone_rewritten_query = content.get("results", "") or content.get("rewritten_query", "")

                                    elif step_type == "tool" and tool_name:
                                        # Handle tool selection specially - extract selected tools for display
                                        if tool_name == "tool_selection":
                                            content_data = parse_flow_step_content(message_flow_step.content or "")
                                            if isinstance(content_data, dict):
                                                selected_tools = content_data.get("selected_tools", [])
                                                for tool_info in selected_tools:
                                                    if isinstance(tool_info, dict):
                                                        tool_display_name = tool_info.get("name", "")
                                                        standalone_selected_tools_results.append(f"Selected Tool: {tool_display_name}")
                                            continue

                                        # Skip context-only metadata steps, verbose advisory content, and reasoning
                                        if tool_name in (
                                            "tool_orchestration_context",
                                            "llm_reasoning",
                                            "get_available_plane_actions",
                                            "planner_summary",
                                        ):
                                            continue

                                        # Skip intermediate retrieval tool steps (same as external reasoning)
                                        # These are internal implementation details that shouldn't clutter the LLM context
                                        if tool_name in (
                                            "structured_db_tool_table_selection",
                                            "structured_db_tool_sql_generation",
                                            "structured_db_tool_final_query",
                                        ):
                                            continue

                                        # For retrieval tools (non-planned), skip PENDING steps - they shouldn't be in history
                                        if hasattr(message_flow_step, "execution_success") and hasattr(message_flow_step, "is_planned"):
                                            if not message_flow_step.is_planned:
                                                # This is a retrieval tool - only include if successfully executed
                                                if message_flow_step.execution_success != ExecutionStatus.SUCCESS:
                                                    continue

                                        # Collect tool results
                                        if tool_name not in standalone_tool_results:
                                            standalone_tool_results[tool_name] = []
                                        standalone_tool_results[tool_name].append(content)

                                        # Add execution status information using new fields
                                        if hasattr(message_flow_step, "execution_success") and hasattr(message_flow_step, "is_planned"):
                                            if message_flow_step.is_planned:
                                                # This is a planned action - show detailed execution status
                                                if message_flow_step.execution_success == ExecutionStatus.SUCCESS:
                                                    execution_status = "✅ SUCCESSFULLY EXECUTED"
                                                elif message_flow_step.execution_success == ExecutionStatus.FAILED:
                                                    execution_status = "❌ EXECUTION FAILED"
                                                    if message_flow_step.execution_error:
                                                        execution_status += f" - {message_flow_step.execution_error}"
                                                else:  # PENDING
                                                    execution_status = "⏳ PLANNED BUT NOT EXECUTED"

                                                execution_info = f"Action Status: {execution_status}"
                                            else:
                                                # This is a retrieval tool - show simpler status
                                                if message_flow_step.execution_success == ExecutionStatus.SUCCESS:
                                                    execution_status = "✅ AUTOMATICALLY EXECUTED"
                                                elif message_flow_step.execution_success == ExecutionStatus.FAILED:
                                                    execution_status = "❌ EXECUTION FAILED"
                                                    if message_flow_step.execution_error:
                                                        execution_status += f" - {message_flow_step.execution_error}"
                                                else:  # PENDING
                                                    execution_status = "⏳ PENDING"

                                                execution_info = f"Tool Status: {execution_status}"
                                        elif hasattr(message_flow_step, "is_executed"):
                                            # Fallback for old records without new fields
                                            execution_status = "EXECUTED" if message_flow_step.is_executed else "PLANNED BUT NOT EXECUTED"
                                            execution_info = f"Action Status: {execution_status}"
                                        else:
                                            execution_info = "Status: Unknown"

                                        # Add execution details if available
                                        if message_flow_step.is_executed and message_flow_step.execution_data:
                                            exec_data = message_flow_step.execution_data
                                            if exec_data.get("executed_at"):
                                                execution_info = f"{execution_info} (Executed at: {exec_data.get('executed_at')})"
                                            if exec_data.get("entity_info"):
                                                entity_info = exec_data.get("entity_info", {})
                                                if entity_info.get("id"):
                                                    execution_info = f"{execution_info} - Created/Updated Entity ID: {entity_info.get('id')}"

                                        # Add to internal reasoning
                                        standalone_internal_reasoning_parts.append(execution_info)

                                # Build the formatted reasoning string for this message
                                if standalone_original_query:
                                    parsed = await parse_query(standalone_original_query)
                                    cleaned_query = parsed.parsed_content
                                    if standalone_rewritten_query and standalone_rewritten_query != cleaned_query:
                                        standalone_internal_reasoning_parts.append(
                                            f"User question: '{cleaned_query}' rewritten to '{standalone_rewritten_query}'."
                                        )
                                    else:
                                        standalone_internal_reasoning_parts.append(f"User question: '{cleaned_query}'")
                                    standalone_internal_reasoning_parts.append("")

                                if standalone_selected_tools_results:
                                    standalone_internal_reasoning_parts.append(
                                        "The below tools were selected to retrieve relevant information to address the query:"
                                    )
                                    standalone_internal_reasoning_parts.extend(standalone_selected_tools_results)
                                    standalone_internal_reasoning_parts.append("")

                                # Process each tool's results
                                for tool_name_key, tool_content_list in standalone_tool_results.items():
                                    for content in tool_content_list:
                                        if isinstance(content, dict):
                                            # Handle structured database tool specifically
                                            if tool_name_key == "structured_db_tool":
                                                # standalone_internal_reasoning_parts.append("Intermediate results")

                                                # SQL query and results
                                                intermediate_results = content.get("intermediate_results", {})
                                                if intermediate_results:
                                                    sql_query = intermediate_results.get("generated_sql", "")
                                                    if sql_query:
                                                        standalone_internal_reasoning_parts.append(f"SQL query generated: '{sql_query}'")

                                                    sql_results = content.get("results", "")
                                                    if sql_results:
                                                        standalone_internal_reasoning_parts.append(f"SQL execution results: '{sql_results}'")

                                                # Entity URLs
                                                entity_urls = content.get("entity_urls", [])
                                                if entity_urls:
                                                    standalone_internal_reasoning_parts.append("Entity URLs:")
                                                    for idx, url_dict in enumerate(entity_urls, 1):
                                                        standalone_internal_reasoning_parts.append(f"{idx}. url: {url_dict.get('url', 'N/A')}")
                                                        standalone_internal_reasoning_parts.append(f"    id: {url_dict.get('id', 'N/A')}")
                                                        standalone_internal_reasoning_parts.append(f"    item type: {url_dict.get('type', 'N/A')}")
                                                        if url_dict.get("type") == "issue" and url_dict.get("issue_identifier"):
                                                            standalone_internal_reasoning_parts.append(
                                                                f"    issue unique key: {url_dict.get('issue_identifier')}"
                                                            )

                                            # Handle vector search tool
                                            elif tool_name_key == "vector_search_tool":
                                                results = content.get("results", "")
                                                if results:
                                                    standalone_internal_reasoning_parts.append("Semantic search results:")
                                                    standalone_internal_reasoning_parts.append(str(results))
                                                else:
                                                    standalone_internal_reasoning_parts.append("Semantic search results: No results found")

                                                # Entity URLs
                                                entity_urls = content.get("entity_urls", [])
                                                if entity_urls:
                                                    standalone_internal_reasoning_parts.append("Entity URLs:")
                                                    for idx, url_dict in enumerate(entity_urls, 1):
                                                        standalone_internal_reasoning_parts.append(f"{idx}. url: {url_dict.get('url', 'N/A')}")
                                                        standalone_internal_reasoning_parts.append(f"    id: {url_dict.get('id', 'N/A')}")
                                                        standalone_internal_reasoning_parts.append(f"    item type: {url_dict.get('type', 'N/A')}")
                                                        if url_dict.get("type") == "issue" and url_dict.get("issue_identifier"):
                                                            standalone_internal_reasoning_parts.append(
                                                                f"    issue unique key: {url_dict.get('issue_identifier')}"
                                                            )
                                            # Handle pages search tool
                                            elif tool_name_key == "pages_search_tool":
                                                results = content.get("results", "")
                                                if results:
                                                    standalone_internal_reasoning_parts.append("Pages search results:")
                                                    standalone_internal_reasoning_parts.append(str(results))
                                                else:
                                                    standalone_internal_reasoning_parts.append("Pages search results: No results found")

                                            # Generic handling for other tools
                                            else:
                                                results = content.get("results", "")
                                                if results:
                                                    standalone_internal_reasoning_parts.append("Results:")
                                                    standalone_internal_reasoning_parts.append(str(results))

                                        elif isinstance(content, str) and content:
                                            standalone_internal_reasoning_parts.append("Results:")
                                            standalone_internal_reasoning_parts.append(content)

                                    standalone_internal_reasoning_parts.append("")  # Add empty line between tools

                                # Join all internal reasoning parts into a single formatted string
                                standalone_message_internal_reasoning = "\n".join(standalone_internal_reasoning_parts)

                            standalone_qa_pair["internal_reasoning"] = standalone_message_internal_reasoning

                        dialogue_list.append(standalone_qa_pair)
                        i += 1
                    else:
                        i += 1

        # Return both new polymorphic structure and legacy fields for backward compatibility
        response = {
            "chat_id": str(chat_id),
            "title": chat.title or "",
            "dialogue": dialogue_list,
            "feedback": "",
            "reasoning": "",
            "llm": chat_llm,
            "is_focus_enabled": user_chat_preference.is_focus_enabled if user_chat_preference else False,
            "is_websearch_enabled": (
                user_chat_preference.is_websearch_enabled if user_chat_preference else (chat.is_websearch_enabled if chat else False)
            ),
            # New polymorphic structure
            "focus_entity_type": user_chat_preference.focus_entity_type if user_chat_preference and user_chat_preference.focus_entity_type else None,
            "focus_entity_id": str(user_chat_preference.focus_entity_id) if user_chat_preference and user_chat_preference.focus_entity_id else None,
            # Legacy fields (for backward compatibility)
            "focus_project_id": str(user_chat_preference.focus_project_id)
            if user_chat_preference and user_chat_preference.focus_project_id
            else None,
            "focus_workspace_id": str(user_chat_preference.focus_workspace_id)
            if user_chat_preference and user_chat_preference.focus_workspace_id
            else None,
            "mode": user_chat_preference.mode if user_chat_preference and user_chat_preference.mode else "ask",
            "mcp_connector_ids": user_chat_preference.mcp_connector_ids if user_chat_preference and user_chat_preference.mcp_connector_ids else [],
        }
        return response

    except Exception as e:
        log.error(f"Error retrieving chat history: {e}")
        return {
            "chat_id": str(chat_id),
            "title": "",
            "dialogue": [],
            "feedback": "",
            "reasoning": "",
            "llm": "",
            "is_focus_enabled": False,
            "is_websearch_enabled": False,
            "focus_entity_type": None,
            "focus_entity_id": None,
            "focus_project_id": None,
            "focus_workspace_id": None,
            "mode": "ask",
            "mcp_connector_ids": [],
        }


async def soft_delete_chat(chat_id: UUID4, db: AsyncSession) -> Tuple[int, Dict[str, str]]:
    """
    Soft deletes a chat by ID.
    Returns a tuple of (status_code, response_content)
    """
    try:
        # Get chat from database
        chat_query = select(Chat).where(Chat.id == chat_id)  # type: ignore[arg-type]
        chat_result = await db.execute(chat_query)
        chat = chat_result.scalar_one_or_none()

        if not chat:
            log.error(f"Chat not found for chat_id: {chat_id}")
            return 404, {"detail": "Chat not found"}

        # First soft delete all related messages
        messages_query = select(Message).where(Message.chat_id == chat_id)  # type: ignore[arg-type]
        messages_result = await db.execute(messages_query)
        messages = messages_result.scalars().all()

        for message in messages:
            message.soft_delete()

        # Then soft delete the chat
        chat.soft_delete()
        await db.commit()
        return 200, {"detail": "Chat deleted successfully"}
    except Exception as e:
        await db.rollback()
        log.error(f"Error deleting chat: {e}")
        return 500, {"detail": "Internal Server Error"}


async def upsert_chat(
    chat_id: UUID4,
    user_id: UUID4,
    db: AsyncSession,
    title: Optional[str] = None,
    description: Optional[str] = None,
    workspace_id: Optional[UUID4] = None,
    workspace_slug: Optional[str] = None,
    is_project_chat: Optional[bool] = False,
    workspace_in_context: Optional[bool] = None,
    is_websearch_enabled: Optional[bool] = None,
) -> Dict[str, Any]:
    """
    Creates a new chat or updates an existing one.
    Returns a dictionary with operation status and the chat object or error details.
    """
    try:
        # Check if chat exists
        stmt = select(Chat).where(Chat.id == chat_id)  # type: ignore[arg-type]
        result = await db.execute(stmt)
        existing_chat = result.scalar_one_or_none()

        if existing_chat:
            # Update existing chat
            if title is not None:
                existing_chat.title = title
            if description is not None:
                existing_chat.description = description
            if workspace_slug is not None:
                existing_chat.workspace_slug = workspace_slug
            if is_project_chat is not None:
                existing_chat.is_project_chat = is_project_chat
            if workspace_in_context is not None:
                existing_chat.workspace_in_context = workspace_in_context
            if is_websearch_enabled is not None:
                existing_chat.is_websearch_enabled = is_websearch_enabled
            # updated_at will be handled by SQLAlchemy
            db.add(existing_chat)
            await db.commit()
            return {"message": "success", "chat": existing_chat}
        else:
            # Create new chat
            chat_kwargs: Dict[str, Any] = {
                "id": chat_id,
                "user_id": user_id,
                "title": title,
                "description": description,
                "icon": {},
            }
            if is_project_chat is not None:
                chat_kwargs["is_project_chat"] = is_project_chat
            if workspace_id is not None:
                chat_kwargs["workspace_id"] = workspace_id
            if workspace_slug is not None:
                chat_kwargs["workspace_slug"] = workspace_slug
            if workspace_in_context is not None:
                chat_kwargs["workspace_in_context"] = workspace_in_context
            if is_websearch_enabled is not None:
                chat_kwargs["is_websearch_enabled"] = is_websearch_enabled
            new_chat = Chat(**chat_kwargs)
            db.add(new_chat)
            await db.commit()
            return {"message": "success", "chat": new_chat}

    except Exception as e:
        await db.rollback()
        log.error(f"Database upsert_chat failed. chat_id: {str(chat_id)}, error: {str(e)}")
        return {"message": "error", "error": str(e)}


async def get_user_chat_threads(
    user_id: UUID4, db: AsyncSession, workspace_id: Optional[UUID4], is_project_chat: Optional[bool] = None, is_latest: Optional[bool] = False
) -> Union[List[Dict[str, Any]], Tuple[int, Dict[str, str]]]:
    """
    Retrieves all chat threads for a user.
    Returns either a list of chat threads (success) or a tuple of (status_code, response_content) for errors
    """
    try:
        # Subquery to find chats that have messages with source='app'
        app_message_subquery = (
            select(Message.chat_id)  # type: ignore[arg-type,call-overload]
            .where(Message.source == "app")  # type: ignore[arg-type]
            .where(Message.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
        )

        chat_query = (
            select(Chat)
            .where(Chat.user_id == user_id)  # type: ignore[union-attr,arg-type]
            .where(Chat.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
            .where(~Chat.id.in_(app_message_subquery))  # type: ignore[union-attr,arg-type,attr-defined]
        )

        if is_project_chat is not None:
            chat_query = chat_query.where(Chat.is_project_chat == is_project_chat)  # type: ignore[union-attr,arg-type]

        if workspace_id is not None:
            chat_query = chat_query.where(Chat.workspace_id == workspace_id)  # type: ignore[union-attr,arg-type]

        chat_query = chat_query.order_by(desc(Chat.updated_at))  # type: ignore[union-attr,arg-type]

        if is_latest:
            chat_query = chat_query.where(~Chat.is_favorite).limit(15)  # type: ignore[union-attr,arg-type]

        chat_result = await db.execute(chat_query)
        chats = chat_result.scalars().all()

        # Get last messages for all chats using ORM window function
        chat_ids = [chat.id for chat in chats]
        if chat_ids:
            # Create a subquery with ROW_NUMBER() to get the latest message per chat
            latest_message_subquery = (
                select(  # type: ignore[call-overload]
                    Message.chat_id,  # type: ignore[arg-type]
                    Message.llm_model,  # type: ignore[arg-type]
                    func.row_number().over(partition_by=Message.chat_id, order_by=desc(Message.created_at)).label("rn"),  # type: ignore[arg-type]
                )
                .where(Message.chat_id.in_(chat_ids))  # type: ignore[union-attr,arg-type]
                .where(Message.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
            ).subquery()

            # Get only the latest messages (rn = 1)
            latest_messages_query = select(latest_message_subquery.c.chat_id, latest_message_subquery.c.llm_model).where(
                latest_message_subquery.c.rn == 1
            )

            latest_messages_result = await db.execute(latest_messages_query)
            latest_messages = latest_messages_result.fetchall()

            # Create a lookup dictionary for O(1) access
            chat_to_llm = {str(msg.chat_id): normalize_model_for_display(msg.llm_model) for msg in latest_messages}
        else:
            chat_to_llm = {}

        results = []
        for chat in chats:
            llm = chat_to_llm.get(str(chat.id), "")

            # Format in the same structure as the old response
            chat_data = {
                "chat_id": str(chat.id),
                "title": chat.title or "No title",
                "last_modified": chat.updated_at.isoformat(),
                "llm": llm,
                "is_favorite": chat.is_favorite,
                "workspace_id": str(chat.workspace_id) if chat.workspace_id else None,
                "is_project_chat": chat.is_project_chat,
            }
            results.append(chat_data)

        return results
    except Exception as e:
        log.error(f"Error retrieving user threads: {e}")
        return 500, {"detail": "Internal Server Error"}


async def check_if_chat_exists(chat_id: UUID4, db: AsyncSession) -> bool:
    """
    Checks if a chat exists.
    Returns True if chat exists, False otherwise.
    """
    try:
        stmt = select(Chat).where(Chat.id == chat_id).where(Chat.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
        result = await db.execute(stmt)
        chat = result.scalar_one_or_none()
        return chat is not None
    except Exception as e:
        log.error(f"Error checking if chat exists: {e}")
        return False


async def favorite_chat(chat_id: UUID4, db: AsyncSession) -> Tuple[int, Dict[str, str]]:
    """
    Favorites a chat by ID.
    Returns a tuple of (status_code, response_content)
    """
    try:
        stmt = select(Chat).where(Chat.id == chat_id).where(Chat.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
        result = await db.execute(stmt)
        chat = result.scalar_one_or_none()
        if not chat:
            return 404, {"detail": "Chat not found"}
        chat.is_favorite = True
        db.add(chat)
        await db.commit()
        return 200, {"detail": "Chat favorited successfully"}
    except Exception as e:
        await db.rollback()
        log.error(f"Error favoriting chat: {e}")
        return 500, {"detail": "Internal Server Error"}


async def unfavorite_chat(chat_id: UUID4, db: AsyncSession) -> Tuple[int, Dict[str, str]]:
    """
    Unfavorites a chat by ID.
    Returns a tuple of (status_code, response_content)
    """
    try:
        stmt = select(Chat).where(Chat.id == chat_id).where(Chat.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
        result = await db.execute(stmt)
        chat = result.scalar_one_or_none()
        if not chat:
            return 404, {"detail": "Chat not found"}
        chat.is_favorite = False
        db.add(chat)
        await db.commit()
        return 200, {"detail": "Chat unfavorited successfully"}
    except Exception as e:
        await db.rollback()
        log.error(f"Error unfavoriting chat: {e}")
        return 500, {"detail": "Internal Server Error"}


async def get_favorite_chats(
    user_id: UUID4, db: AsyncSession, workspace_id: Optional[UUID4] = None, is_project_chat: Optional[bool] = None
) -> Tuple[int, Union[List[Dict[str, Any]], Dict[str, str]]]:
    """
    Retrieves all favorite chats for a user.
    Returns a tuple of (status_code, response_content)
    """
    try:
        # Subquery to find chats that have messages with source='app'
        app_message_subquery = (
            select(Message.chat_id)  # type: ignore[arg-type,call-overload]
            .where(Message.source == "app")  # type: ignore[arg-type]
            .where(Message.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
        )

        stmt = (
            select(Chat)
            .where(Chat.user_id == user_id)  # type: ignore[union-attr,arg-type]
            .where(Chat.is_favorite)  # type: ignore[union-attr,arg-type]
            .where(Chat.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
            .where(~Chat.id.in_(app_message_subquery))  # type: ignore[union-attr,arg-type,attr-defined]
            .order_by(desc(Chat.updated_at))  # type: ignore[union-attr,arg-type]
        )

        if is_project_chat is not None:
            stmt = stmt.where(Chat.is_project_chat == is_project_chat)  # type: ignore[union-attr,arg-type]

        if workspace_id is not None:
            stmt = stmt.where(Chat.workspace_id == workspace_id)  # type: ignore[union-attr,arg-type]

        result = await db.execute(stmt)
        chats = result.scalars().all()

        # Get last messages for all chats using ORM window function
        chat_ids = [chat.id for chat in chats]
        if chat_ids:
            # Create a subquery with ROW_NUMBER() to get the latest message per chat
            latest_message_subquery = (
                select(  # type: ignore[call-overload]
                    Message.chat_id,  # type: ignore[arg-type]
                    Message.llm_model,  # type: ignore[arg-type]
                    func.row_number().over(partition_by=Message.chat_id, order_by=desc(Message.created_at)).label("rn"),  # type: ignore[arg-type]
                )
                .where(Message.chat_id.in_(chat_ids))  # type: ignore[union-attr,arg-type]
                .where(Message.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
            ).subquery()

            # Get only the latest messages (rn = 1)
            latest_messages_query = select(latest_message_subquery.c.chat_id, latest_message_subquery.c.llm_model).where(
                latest_message_subquery.c.rn == 1
            )

            latest_messages_result = await db.execute(latest_messages_query)
            latest_messages = latest_messages_result.fetchall()

            # Create a lookup dictionary for O(1) access
            chat_to_llm = {str(msg.chat_id): normalize_model_for_display(msg.llm_model) for msg in latest_messages}
        else:
            chat_to_llm = {}

        # Convert Chat objects to serializable dictionaries
        chat_list = []
        for chat in chats:
            llm = chat_to_llm.get(str(chat.id), "")

            chat_data = {
                "chat_id": str(chat.id),
                "title": chat.title or "No title",
                "last_modified": chat.updated_at.isoformat(),
                "llm": llm,
                "workspace_id": str(chat.workspace_id) if chat.workspace_id else None,
                "is_project_chat": chat.is_project_chat,
                "is_favorite": True,
            }
            chat_list.append(chat_data)

        return 200, chat_list
    except Exception as e:
        log.error(f"Error retrieving favorite chats: {e}")
        return 500, {"detail": "Internal Server Error"}


# New paginated functions
async def get_user_chat_threads_paginated(
    user_id: UUID4,
    db: AsyncSession,
    workspace_id: Optional[UUID4],
    is_project_chat: Optional[bool] = None,
    cursor: Optional[str] = None,
    per_page: int = 30,
) -> Union[Tuple[List[Dict[str, Any]], PaginationResponse], Tuple[int, Dict[str, str]]]:
    """
    Retrieves chat threads for a user with integer cursor-based pagination.
    Returns either a tuple of (results, pagination_response) or (status_code, error_response) for errors
    """
    try:
        # Subquery to find chats that have messages with source='app'
        app_message_subquery = (
            select(Message.chat_id)  # type: ignore[arg-type,call-overload]
            .where(Message.source == "app")  # type: ignore[arg-type]
            .where(Message.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
        )

        # Build base query
        chat_query = (
            select(Chat)
            .where(Chat.user_id == user_id)  # type: ignore[union-attr,arg-type]
            .where(Chat.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
            .where(~Chat.id.in_(app_message_subquery))  # type: ignore[union-attr,arg-type,attr-defined]
        )

        if is_project_chat is not None:
            chat_query = chat_query.where(Chat.is_project_chat == is_project_chat)  # type: ignore[union-attr,arg-type]

        if workspace_id is not None:
            chat_query = chat_query.where(Chat.workspace_id == workspace_id)  # type: ignore[union-attr,arg-type]

        # Get total count for pagination metadata
        count_query = (
            select(func.count(Chat.id))  # type: ignore[union-attr,arg-type]
            .where(Chat.user_id == user_id)  # type: ignore[union-attr,arg-type]
            .where(Chat.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
            .where(~Chat.id.in_(app_message_subquery))  # type: ignore[union-attr,arg-type,attr-defined]
        )

        if is_project_chat is not None:
            count_query = count_query.where(Chat.is_project_chat == is_project_chat)  # type: ignore[union-attr,arg-type]

        if workspace_id is not None:
            count_query = count_query.where(Chat.workspace_id == workspace_id)  # type: ignore[union-attr,arg-type]

        count_result = await db.execute(count_query)
        total_results = count_result.scalar() or 0

        # Apply cursor-based pagination
        chat_query, cursor_info = apply_cursor_pagination(
            query=chat_query, cursor=cursor, per_page=per_page, order_by_field=Chat.updated_at, id_field=Chat.id, direction="desc"
        )

        chat_result = await db.execute(chat_query)
        chats = list(chat_result.scalars().all())

        # Check pagination bounds
        chats, has_next, has_prev = check_pagination_bounds(chats, cursor_info, total_results)

        # Get last messages for all chats using ORM window function
        chat_ids = [chat.id for chat in chats]
        if chat_ids:
            # Create a subquery with ROW_NUMBER() to get the latest message per chat
            latest_message_subquery = (
                select(  # type: ignore[call-overload]
                    Message.chat_id,  # type: ignore[arg-type]
                    Message.llm_model,  # type: ignore[arg-type]
                    func.row_number().over(partition_by=Message.chat_id, order_by=desc(Message.created_at)).label("rn"),  # type: ignore[arg-type]
                )
                .where(Message.chat_id.in_(chat_ids))  # type: ignore[union-attr,arg-type]
                .where(Message.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
            ).subquery()

            # Get only the latest messages (rn = 1)
            latest_messages_query = select(latest_message_subquery.c.chat_id, latest_message_subquery.c.llm_model).where(
                latest_message_subquery.c.rn == 1
            )

            latest_messages_result = await db.execute(latest_messages_query)
            latest_messages = latest_messages_result.fetchall()

            # Create a lookup dictionary for O(1) access
            chat_to_llm = {str(msg.chat_id): normalize_model_for_display(msg.llm_model) for msg in latest_messages}
        else:
            chat_to_llm = {}

        # Format results
        results = []
        for chat in chats:
            llm = chat_to_llm.get(str(chat.id), "")

            # Format in the same structure as the old response
            chat_data = {
                "chat_id": str(chat.id),
                "title": chat.title or "No title",
                "last_modified": chat.updated_at.isoformat(),
                "llm": llm,
                "is_favorite": chat.is_favorite,
                "workspace_id": str(chat.workspace_id) if chat.workspace_id else None,
                "is_project_chat": chat.is_project_chat,
            }
            results.append(chat_data)

        # Create pagination response
        _, pagination_response = create_pagination_response(
            items=results, cursor_info=cursor_info, has_next=has_next, has_prev=has_prev, total_results=total_results
        )

        return results, pagination_response

    except Exception as e:
        log.error(f"Error retrieving user threads (paginated): {e}")
        return 500, {"detail": "Internal Server Error"}


async def rename_chat_title(chat_id: UUID4, new_title: str, db: AsyncSession) -> Tuple[int, Dict[str, str]]:
    """
    Renames a chat by ID.
    Returns a tuple of (status_code, response_content)
    """
    try:
        stmt = select(Chat).where(Chat.id == chat_id).where(Chat.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
        result = await db.execute(stmt)
        chat = result.scalar_one_or_none()
        if not chat:
            return 404, {"detail": "Chat not found"}
        chat.title = new_title
        db.add(chat)
        await db.commit()
        return 200, {"detail": "Chat renamed successfully"}
    except Exception as e:
        await db.rollback()
        log.error(f"Error renaming chat: {e}")
        return 500, {"detail": "Internal Server Error"}


async def upsert_user_chat_preference(
    user_id: UUID4,
    chat_id: UUID4,
    db: AsyncSession,
    is_focus_enabled: Optional[bool] = None,
    is_websearch_enabled: Optional[bool] = None,
    # New polymorphic parameters
    focus_entity_type: Optional[str] = None,
    focus_entity_id: Optional[UUID4] = None,
    # Legacy parameters (for backward compatibility)
    focus_project_id: Optional[UUID4] = None,
    focus_workspace_id: Optional[UUID4] = None,
    mode: Optional[Literal["ask", "build"]] = "ask",
    mcp_connector_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Upserts a user chat preference.
    Returns a dictionary with operation status and the user chat preference object or error details.

    Supports both new polymorphic structure (focus_entity_type, focus_entity_id) and
    legacy structure (focus_project_id, focus_workspace_id) for backward compatibility.
    New parameters take precedence over legacy parameters.
    """
    try:
        stmt = select(UserChatPreference).where(UserChatPreference.user_id == user_id).where(UserChatPreference.chat_id == chat_id)  # type: ignore[union-attr,arg-type]
        result = await db.execute(stmt)
        existing_user_chat_preference = result.scalar_one_or_none()

        # Determine focus context: prioritize new polymorphic params, fall back to legacy
        final_focus_entity_type = focus_entity_type
        final_focus_entity_id = focus_entity_id

        if not final_focus_entity_type and not final_focus_entity_id:
            # Fall back to legacy parameters
            if focus_project_id:
                final_focus_entity_type = "project"
                final_focus_entity_id = focus_project_id
            elif focus_workspace_id:
                final_focus_entity_type = "workspace"
                final_focus_entity_id = focus_workspace_id

        if existing_user_chat_preference:
            if is_focus_enabled is not None:
                existing_user_chat_preference.is_focus_enabled = is_focus_enabled
            if is_websearch_enabled is not None:
                existing_user_chat_preference.is_websearch_enabled = is_websearch_enabled
            if final_focus_entity_type is not None:
                existing_user_chat_preference.focus_entity_type = final_focus_entity_type
            if final_focus_entity_id is not None:
                existing_user_chat_preference.focus_entity_id = final_focus_entity_id
            # Also update legacy fields for backward compatibility during migration
            if focus_project_id is not None:
                existing_user_chat_preference.focus_project_id = focus_project_id
            if focus_workspace_id is not None:
                existing_user_chat_preference.focus_workspace_id = focus_workspace_id
            if mode is not None:
                existing_user_chat_preference.mode = mode
            if mcp_connector_ids is not None:
                existing_user_chat_preference.mcp_connector_ids = mcp_connector_ids
            db.add(existing_user_chat_preference)
            await db.commit()
            return {"message": "success", "user_chat_preference": existing_user_chat_preference}
        else:
            new_user_chat_preference_kwargs: Dict[str, Any] = {
                "user_id": user_id,
                "chat_id": chat_id,
            }
            if is_focus_enabled is not None:
                new_user_chat_preference_kwargs["is_focus_enabled"] = is_focus_enabled
            if is_websearch_enabled is not None:
                new_user_chat_preference_kwargs["is_websearch_enabled"] = is_websearch_enabled
            if final_focus_entity_type is not None:
                new_user_chat_preference_kwargs["focus_entity_type"] = final_focus_entity_type
            if final_focus_entity_id is not None:
                new_user_chat_preference_kwargs["focus_entity_id"] = final_focus_entity_id
            # Also set legacy fields for backward compatibility during migration
            if focus_project_id is not None:
                new_user_chat_preference_kwargs["focus_project_id"] = focus_project_id
            if focus_workspace_id is not None:
                new_user_chat_preference_kwargs["focus_workspace_id"] = focus_workspace_id
            if mode is not None:
                new_user_chat_preference_kwargs["mode"] = mode
            if mcp_connector_ids is not None:
                new_user_chat_preference_kwargs["mcp_connector_ids"] = mcp_connector_ids
            new_user_chat_preference = UserChatPreference(**new_user_chat_preference_kwargs)
            db.add(new_user_chat_preference)
            await db.commit()
            return {"message": "success", "user_chat_preference": new_user_chat_preference}
    except Exception as e:
        await db.rollback()
        log.error(f"Error upserting user chat preference: {e}")
        return {"message": "error", "error": str(e)}


async def get_project_from_chat_preference(chat_id: str, user_id: str, db: AsyncSession) -> Tuple[Optional[str], bool]:
    # Get is_project_chat from chat record (with explicit commit/refresh to avoid race condition)
    # Refresh the session to ensure we see any committed chat records
    await db.commit()

    stmt = select(Chat).where(Chat.id == chat_id)  # type: ignore[arg-type]
    result = await db.execute(stmt)
    chat = result.scalar_one_or_none()
    is_project_chat = chat.is_project_chat if chat else False

    # Get project_id from UserChatPreference
    project_id = None
    try:
        pref_stmt = select(UserChatPreference).where(
            UserChatPreference.chat_id == chat_id,  # type: ignore[arg-type]
            UserChatPreference.user_id == user_id,  # type: ignore[arg-type]
        )
        result = await db.execute(pref_stmt)
        pref = result.scalar_one_or_none()

        if pref:
            # Check polymorphic focus first
            if pref.focus_entity_type == FocusEntityType.PROJECT.value and pref.focus_entity_id:
                project_id = pref.focus_entity_id
            # Fallback to legacy field
            elif pref.focus_project_id:
                project_id = pref.focus_project_id

        if project_id:
            log.info(f"🔧 Found project_id in UserChatPreference: {project_id}")
    except Exception as e:
        log.error(f"Error fetching UserChatPreference: {e}")

    project_id = str(project_id) if project_id else None
    return project_id, is_project_chat
