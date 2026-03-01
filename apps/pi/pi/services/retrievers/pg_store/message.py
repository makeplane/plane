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

from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple
from typing import Union
from uuid import UUID

from pydantic import UUID4
from sqlalchemy import desc
from sqlalchemy import func
from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.models import Chat
from pi.app.models import LlmModelPricing
from pi.app.models import Message
from pi.app.models import MessageFeedback
from pi.app.models import MessageFlowStep
from pi.app.models import MessageMention
from pi.app.models import MessageMeta
from pi.app.models import UserChatPreference
from pi.app.models.enums import ExecutionStatus
from pi.app.models.enums import FlowStepType
from pi.app.models.enums import MessageFeedbackTypeChoices
from pi.app.models.enums import MessageMetaStepType
from pi.app.models.enums import UserTypeChoices
from pi.app.models.message_attachment import MessageAttachment
from pi.app.schemas.chat import ChatRequest
from pi.config import LLMModels
from pi.services.retrievers.pg_store.json_serializer import sanitize_execution_data

log = logger.getChild(__name__)


async def get_latest_message_id_for_chat(db: AsyncSession, chat_id: UUID4) -> Optional[UUID]:
    """Get the latest message_id in a chat (most recent user message)."""
    try:
        stmt = (
            select(Message.id)  # type: ignore[call-overload]
            .where(Message.chat_id == chat_id)  # type: ignore[arg-type]
            .where(Message.user_type == UserTypeChoices.USER)  # type: ignore[arg-type]
            .where(Message.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
            .order_by(desc(Message.created_at))  # type: ignore[union-attr,arg-type]
            .limit(1)
        )
        result = await db.execute(stmt)
        message_id = result.scalar_one_or_none()
        return message_id
    except Exception as e:
        log.error(f"Error getting latest message_id for chat {chat_id}: {e}")
        return None


async def get_latest_message_ids_for_chats(db: AsyncSession, chat_ids: List[UUID]) -> Dict[str, Optional[UUID]]:
    """Get the latest message_id for multiple chats in a single query (optimized)."""
    if not chat_ids:
        return {}

    try:
        # Use window function to get latest message per chat in one query
        from sqlalchemy import func

        # Subquery to get row numbers partitioned by chat_id
        subquery = (
            select(  # type: ignore[call-overload]
                Message.id,
                Message.chat_id,
                func.row_number()
                .over(
                    partition_by=Message.chat_id,  # type: ignore[arg-type]
                    order_by=desc(Message.created_at),  # type: ignore[union-attr,arg-type]
                )
                .label("rn"),
            )
            .where(Message.chat_id.in_(chat_ids))  # type: ignore[union-attr,arg-type]
            .where(Message.user_type == UserTypeChoices.USER)  # type: ignore[arg-type]
            .where(Message.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
        ).subquery()

        # Select only the first row (latest) for each chat
        stmt = select(subquery.c.chat_id, subquery.c.id).where(subquery.c.rn == 1)

        result = await db.execute(stmt)
        rows = result.all()

        # Convert to dict with string keys for consistency
        latest_messages = {}
        for row in rows:
            chat_id_str = str(row.chat_id)
            latest_messages[chat_id_str] = row.id

        # Fill in None for chats that have no messages
        for chat_id in chat_ids:
            chat_id_str = str(chat_id)
            if chat_id_str not in latest_messages:
                latest_messages[chat_id_str] = None

        return latest_messages

    except Exception as e:
        log.error(f"Error getting latest message_ids for chats {chat_ids}: {e}")
        # Fallback to empty dict
        return {str(chat_id): None for chat_id in chat_ids}


async def update_message_feedback(
    chat_id: UUID4, message_index: int, feedback_value: str, user_id: UUID4, db: AsyncSession, feedback_message: Optional[str] = None
) -> Tuple[int, Dict[str, str]]:
    """
    Updates or creates feedback for a message.
    Returns a tuple of (status_code, response_content)
    """
    try:
        message_index = message_index + 1  # because the message index is 0-based, but the sequence is 1-based (frontend sends 0)

        # Calculate the sequence number for the assistant's message
        assistant_message_sequence = message_index * 2

        # Find the message with chat_id and sequence
        filters = [Message.chat_id == chat_id, Message.sequence == assistant_message_sequence]

        message_query = select(Message).where(*filters)  # type: ignore[arg-type]
        message_result = await db.execute(message_query)
        message = message_result.scalar_one_or_none()

        if not message:
            log.error(f"Message not found for chat {chat_id} with sequence {assistant_message_sequence}")
            return 404, {"detail": "Message not found"}

        # Check if feedback already exists for this message
        existing_feedback_query = select(MessageFeedback).where(MessageFeedback.message_id == message.id)  # type: ignore[call-overload]
        result = await db.execute(existing_feedback_query)
        existing_feedback = result.scalar_one_or_none()

        # Get workspace_slug from message
        workspace_slug = message.workspace_slug if message else None

        if existing_feedback:
            # Update existing feedback
            existing_feedback.type = MessageFeedbackTypeChoices.FEEDBACK.value
            existing_feedback.feedback = feedback_value
            existing_feedback.user_id = user_id
            existing_feedback.feedback_message = feedback_message
            if workspace_slug is not None:
                existing_feedback.workspace_slug = workspace_slug
            db.add(existing_feedback)
        else:
            # Create new feedback
            new_feedback = MessageFeedback(
                message_id=message.id,
                type=MessageFeedbackTypeChoices.FEEDBACK.value,
                feedback=feedback_value,
                user_id=user_id,
                feedback_message=feedback_message,
                reaction=None,
                workspace_slug=workspace_slug,
            )
            db.add(new_feedback)

        await db.commit()
        return 200, {"detail": "Feedback updated successfully"}
    except Exception as e:
        await db.rollback()
        log.error(f"Error updating feedback: {e}")
        return 500, {"detail": "Internal Server Error"}


async def get_chat_messages(chat_id: UUID4, db: AsyncSession) -> Union[List[Message], Tuple[int, Dict[str, str]]]:
    """
    Retrieves all messages for a chat ordered by sequence (excluding replaced messages).
    Returns either a list of messages (success) or a tuple of (status_code, response_content) for errors
    """
    try:
        # Get messages for this chat ordered by sequence (exclude replaced messages)
        messages_query = (
            select(Message)
            .where(Message.chat_id == chat_id)  # type: ignore[arg-type]
            .where(~Message.is_replaced)  # type: ignore[arg-type]
            .order_by(Message.sequence)  # type: ignore[arg-type]
        )
        result = await db.execute(messages_query)
        messages = list(result.scalars().all())  # Convert to list for correct typing

        return messages
    except Exception as e:
        log.error(f"Error retrieving chat messages: {e}")
        return 500, {"detail": "Internal Server Error"}


async def upsert_message(
    message_id: UUID4,
    chat_id: UUID4,
    content: str,
    user_type: Union[UserTypeChoices, str],
    db: AsyncSession,
    parent_id: Optional[UUID4] = None,
    relates_to: Optional[UUID4] = None,
    llm_model: Optional[str] = None,
    sequence: Optional[int] = None,
    reasoning: Optional[str] = None,
    parsed_content: Optional[str] = None,
    workspace_slug: Optional[str] = None,
    source: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Creates a new message or updates an existing one.
    If sequence is not provided, it will be automatically determined from the chat.
    Returns a dictionary with operation status and the message object or error details.
    """
    try:
        # Normalize user_type to string value
        normalized_user_type = user_type.value if isinstance(user_type, UserTypeChoices) else user_type

        # Get workspace_slug from chat if not provided
        if workspace_slug is None:
            from pi.app.models.chat import Chat

            chat_stmt = select(Chat).where(Chat.id == chat_id)  # type: ignore[arg-type]
            chat_result = await db.execute(chat_stmt)
            chat = chat_result.scalar_one_or_none()
            if chat:
                workspace_slug = chat.workspace_slug

        # Check if message exists
        stmt = select(Message).where(Message.id == message_id)  # type: ignore[arg-type]
        result = await db.execute(stmt)
        existing_message = result.scalar_one_or_none()

        if existing_message:
            # Update existing message
            if content is not None:
                existing_message.content = content
            if user_type is not None:
                existing_message.user_type = normalized_user_type
            if parent_id is not None:
                existing_message.parent_id = parent_id
            if relates_to is not None:
                existing_message.relates_to = relates_to
            if llm_model is not None:
                existing_message.llm_model = llm_model
            if reasoning is not None:
                existing_message.reasoning = reasoning
            if parsed_content is not None:
                existing_message.parsed_content = parsed_content
            if workspace_slug is not None:
                existing_message.workspace_slug = workspace_slug
            if source is not None:
                existing_message.source = source
            # updated_at will be handled by SQLAlchemy
            db.add(existing_message)
            await db.commit()
            return {"message": "success", "message_obj": existing_message}
        else:
            # Determine sequence number if not provided
            if sequence is None:
                # Get highest sequence number to determine next sequence
                max_seq_query = select(func.max(Message.sequence)).where(Message.chat_id == chat_id)  # type: ignore[var-annotated,arg-type]
                result = await db.execute(max_seq_query)
                max_seq = result.scalar() or 0
                sequence = max_seq + 1

            # Ensure sequence is not None at this point
            assert sequence is not None, "sequence should not be None at this point"

            # Create new message
            new_message = Message(
                id=message_id,
                chat_id=chat_id,
                sequence=sequence,
                content=content,
                parsed_content=parsed_content,
                user_type=normalized_user_type,
                parent_id=parent_id,
                relates_to=relates_to,
                llm_model=llm_model,
                llm_model_id=None,  # Add the missing required parameter
                reasoning=reasoning or "",
                workspace_slug=workspace_slug,
                source=source,
            )
            db.add(new_message)
            await db.commit()
            return {"message": "success", "message_obj": new_message}

    except Exception as e:
        await db.rollback()
        log.error(f"Database upsert_message failed. message_id: {str(message_id)}, error: {str(e)}")
        return {"message": "error", "error": str(e)}


async def upsert_message_flow_steps(message_id: UUID4, chat_id: UUID4, db: AsyncSession, flow_steps: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Creates or updates message flow steps for a specific message.
    The flow_steps parameter should be a list of dictionaries with the following structure:
    {
        "step_order": int,
        "step_type": FlowStepType,
        "tool_name": str (optional),
        "content": str,
        "execution_data": dict (optional)
    }
    Returns a dictionary with operation status and the created flow steps or error details.
    """
    try:
        flow_step_objects = []

        # Check if message exists
        stmt = select(Message).where(Message.id == message_id)  # type: ignore[arg-type]
        result = await db.execute(stmt)
        message = result.scalar_one_or_none()

        if not message:
            return {"message": "error", "error": f"Message with ID {message_id} not found"}

        # Get workspace_slug from message
        workspace_slug = message.workspace_slug if message else None

        # Create flow steps
        for step_data in flow_steps:
            # Validate required fields with proper types
            step_order = step_data.get("step_order")
            step_type = step_data.get("step_type")

            if step_order is None or not isinstance(step_order, int):
                raise ValueError(f"step_order must be an integer, got {type(step_order)}")

            if step_type is None or not isinstance(step_type, (str, FlowStepType)):
                raise ValueError(f"step_type must be a FlowStepType or string, got {type(step_type)}")

            # Convert FlowStepType enum to string if needed
            if isinstance(step_type, FlowStepType):
                step_type_value = step_type.value
            else:
                # Validate that string value is valid
                try:
                    FlowStepType(step_type)  # This will raise ValueError if invalid
                    step_type_value = step_type
                except ValueError:
                    raise ValueError(f"Invalid step_type value: {step_type}")

            # Handle execution_success field
            execution_success = step_data.get("execution_success")
            if execution_success is not None:
                if isinstance(execution_success, ExecutionStatus):
                    execution_success_value = execution_success
                elif isinstance(execution_success, str):
                    try:
                        execution_success_value = ExecutionStatus(execution_success)
                    except ValueError:
                        execution_success_value = ExecutionStatus.PENDING
                else:
                    execution_success_value = ExecutionStatus.PENDING
            else:
                execution_success_value = ExecutionStatus.PENDING

            # Sanitize execution_data to ensure JSON serializability
            raw_execution_data = step_data.get("execution_data", {})
            sanitized_execution_data = sanitize_execution_data(raw_execution_data)

            flow_step = MessageFlowStep(
                message_id=message_id,
                chat_id=chat_id,
                step_order=step_order,
                step_type=step_type_value,
                tool_name=step_data.get("tool_name"),
                content=step_data.get("content", ""),
                execution_data=sanitized_execution_data,
                is_executed=step_data.get("is_executed", False) if step_data.get("is_executed") is not None else False,
                is_planned=step_data.get("is_planned", False) if step_data.get("is_planned") is not None else False,
                execution_success=execution_success_value,
                execution_error=step_data.get("execution_error"),
                oauth_required=step_data.get("oauth_required", False) if step_data.get("oauth_required") is not None else False,
                oauth_completed=step_data.get("oauth_completed", False) if step_data.get("oauth_completed") is not None else False,
                oauth_completed_at=step_data.get("oauth_completed_at"),
                workspace_slug=workspace_slug,
            )
            db.add(flow_step)
            flow_step_objects.append(flow_step)

        await db.commit()
        return {"message": "success", "flow_steps": flow_step_objects}

    except Exception as e:
        await db.rollback()
        log.error(f"Database upsert_message_flow_steps failed. message_id: {str(message_id)}, error: {str(e)}")
        return {"message": "error", "error": str(e)}


async def get_tool_results_from_chat_history(
    db: AsyncSession,
    chat_id: UUID,
    tool_name: str,
) -> List[MessageFlowStep]:
    """
    Retrieves tool results from a specific chat.
    """
    try:
        stmt = (
            select(MessageFlowStep)  # type: ignore[call-overload]
            .where(MessageFlowStep.chat_id == chat_id)  # type: ignore[var-annotated,arg-type]
            .where(func.lower(MessageFlowStep.tool_name) == tool_name.lower())  # type: ignore[var-annotated,arg-type]
            .order_by(desc(MessageFlowStep.created_at))  # type: ignore[var-annotated,arg-type]
        )
        result = await db.execute(stmt)

        steps = list(result.scalars().all())

        return steps

    except Exception as e:
        log.error(f"Error retrieving tool results for chat {chat_id} " f"with tool {tool_name}: {e}")
        return []


async def upsert_message_meta(
    db: AsyncSession,
    message_id: UUID,
    llm_model_id: UUID,
    step_type: MessageMetaStepType,
    input_text_tokens: int,
    output_text_tokens: int,
    cached_input_text_tokens: int = 0,
    input_text_price: Optional[float] = None,
    output_text_price: Optional[float] = None,
    cached_input_text_price: Optional[float] = None,
    llm_model_pricing_id: Optional[UUID] = None,
    workspace_slug: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Creates or updates a MessageMeta row with token counts and USD costs.

    Args:
        db: Database session
        message_id: Message UUID
        llm_model_id: LLM model UUID
        step_type: Step type for this meta entry
        input_text_tokens: Number of input tokens
        output_text_tokens: Number of output tokens
        cached_input_text_tokens: Number of cached input tokens
        input_text_price: Pre-calculated input cost in USD (optional)
        output_text_price: Pre-calculated output cost in USD (optional)
        cached_input_text_price: Pre-calculated cached input cost in USD (optional)
        llm_model_pricing_id: UUID of the pricing record used for calculation (optional)
    """
    try:
        in_tokens = int(input_text_tokens) if input_text_tokens is not None else 0
        out_tokens = int(output_text_tokens) if output_text_tokens is not None else 0
        cached_in_tokens = int(cached_input_text_tokens) if cached_input_text_tokens is not None else 0

        # Use provided prices or calculate from pricing table if not provided
        if input_text_price is not None and output_text_price is not None:
            # Prices are already calculated correctly (non-cached input cost separate)
            input_cost_usd = float(input_text_price)  # This is non-cached input cost
            output_cost_usd = float(output_text_price)
            cached_input_cost_usd = float(cached_input_text_price) if cached_input_text_price is not None else 0.0
            # Use provided pricing_id or keep it None
            pricing_id = llm_model_pricing_id
        else:
            # Fallback to old pricing calculation if prices not provided
            pricing_stmt = (
                select(LlmModelPricing)  # type: ignore[call-overload]
                .where(LlmModelPricing.llm_model_id == llm_model_id)  # type: ignore[var-annotated,arg-type]
                .where(LlmModelPricing.deleted_at.is_(None))  # type: ignore[union-attr,arg-type]
                .order_by(desc(LlmModelPricing.created_at))  # type: ignore[arg-type]
            )
            res = await db.execute(pricing_stmt)
            pricing: Optional[LlmModelPricing] = res.scalar_one_or_none()

            in_price_pm = pricing.text_input_price if pricing and pricing.text_input_price else 0.0
            out_price_pm = pricing.text_output_price if pricing and pricing.text_output_price else 0.0
            cached_in_price_pm = pricing.cached_text_input_price if pricing and pricing.cached_text_input_price else 0.0

            # Calculate non-cached input tokens (subtract cached from total input)
            non_cached_in_tokens = max(0, in_tokens - cached_in_tokens)

            # Calculate costs separately (non-cached input cost stored separately)
            input_cost_usd = (non_cached_in_tokens / 1_000_000) * in_price_pm  # Non-cached input cost only
            cached_input_cost_usd = (cached_in_tokens / 1_000_000) * cached_in_price_pm
            output_cost_usd = (out_tokens / 1_000_000) * out_price_pm

            # Get pricing ID from the fetched pricing record
            pricing_id = pricing.id if pricing else None

        meta_stmt = (
            select(MessageMeta)  # type: ignore[call-overload]
            .where(MessageMeta.message_id == message_id)  # type: ignore[var-annotated,arg-type]
            .where(MessageMeta.step_type == step_type)  # type: ignore[var-annotated,arg-type]
        )
        res = await db.execute(meta_stmt)
        meta = res.scalar_one_or_none()

        # Get workspace_slug from message if not provided
        if workspace_slug is None:
            msg_stmt = select(Message).where(Message.id == message_id)  # type: ignore[arg-type]
            msg_result = await db.execute(msg_stmt)
            msg = msg_result.scalar_one_or_none()
            if msg:
                workspace_slug = msg.workspace_slug

        if meta:
            # --- UPDATE --- Aggregate tokens and costs instead of overwriting
            # This handles cases where multiple LLM calls occur for the same message_id + step_type
            meta.input_text_tokens = (meta.input_text_tokens or 0) + in_tokens
            meta.input_text_price = (meta.input_text_price or 0.0) + input_cost_usd
            meta.output_text_tokens = (meta.output_text_tokens or 0) + out_tokens
            meta.output_text_price = (meta.output_text_price or 0.0) + output_cost_usd
            meta.cached_input_text_tokens = (meta.cached_input_text_tokens or 0) + cached_in_tokens
            meta.cached_input_text_price = (meta.cached_input_text_price or 0.0) + cached_input_cost_usd
            meta.llm_model_id = llm_model_id
            meta.llm_model_pricing_id = pricing_id
            if workspace_slug is not None:
                meta.workspace_slug = workspace_slug
            db.add(meta)
        else:
            # --- INSERT ---
            meta = MessageMeta(
                message_id=message_id,
                llm_model_id=llm_model_id,
                step_type=step_type,
                input_text_tokens=in_tokens,
                input_text_price=input_cost_usd,
                output_text_tokens=out_tokens,
                output_text_price=output_cost_usd,
                cached_input_text_tokens=cached_in_tokens,
                cached_input_text_price=cached_input_cost_usd,
                llm_model_pricing_id=pricing_id,
                workspace_slug=workspace_slug,
            )
            db.add(meta)

        await db.commit()
        return {"message": "success", "message_meta": meta}

    except Exception as e:
        await db.rollback()
        log.error(f"create_message_meta failed. message_id={message_id}, error={e}")
        return {"message": "error", "error": str(e)}


async def mark_assistant_response_as_replaced(db: AsyncSession, user_message_id: UUID4) -> bool:
    """
    Mark the assistant response(s) for a user message as replaced.

    Args:
        db: Database session
        user_message_id: The user message ID whose assistant responses should be marked

    Returns:
        True if any messages were marked, False otherwise
    """
    try:
        # First, get the user message to find its sequence and chat_id
        user_msg_stmt = select(Message).where(Message.id == user_message_id)  # type: ignore[arg-type]
        user_msg_result = await db.execute(user_msg_stmt)
        user_message = user_msg_result.scalar_one_or_none()

        if not user_message:
            log.warning(f"User message {user_message_id} not found")
            return False

        # Find assistant message(s) that come after this user message (by sequence)
        # in the same chat and are not already replaced
        stmt = (
            select(Message)
            .where(Message.chat_id == user_message.chat_id)  # type: ignore[arg-type]
            .where(Message.sequence > user_message.sequence)  # type: ignore[arg-type]
            .where(Message.user_type == UserTypeChoices.ASSISTANT.value)  # type: ignore[arg-type]
            .where(~Message.is_replaced)  # type: ignore[arg-type]
            .order_by(Message.sequence)  # type: ignore[arg-type]
            .limit(1)  # Only mark the immediate next assistant response
        )
        result = await db.execute(stmt)
        old_assistant_message = result.scalar_one_or_none()

        if not old_assistant_message:
            log.info(f"No assistant message found to mark as replaced for user message {user_message_id}")
            return False

        # Mark as replaced
        old_assistant_message.is_replaced = True

        await db.commit()
        log.info(
            f"Marked assistant message {old_assistant_message.id} (sequence {old_assistant_message.sequence}) "
            f"as replaced for user message {user_message_id}"
        )
        return True

    except Exception as e:
        log.error(f"Error marking assistant response as replaced: {e}")
        await db.rollback()
        return False


async def get_message_by_id(db: AsyncSession, message_id: UUID4) -> Optional[Message]:
    """
    Get a message by ID.

    Args:
        db: Database session
        message_id: Message ID to retrieve

    Returns:
        Message object if found, None otherwise
    """
    try:
        stmt = select(Message).where(Message.id == message_id)  # type: ignore[arg-type]
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    except Exception as e:
        log.error(f"Error getting message {message_id}: {e}")
        return None


async def reconstruct_chat_request_from_message(db: AsyncSession, user_message: Message, user_id: UUID4):
    """
    Reconstruct a ChatRequest from an existing user message for regeneration.

    Args:
        db: Database session
        user_message: The user message to reconstruct from
        user_id: User ID making the request

    Returns:
        ChatRequest object ready for streaming
    """

    # Get chat details
    chat_stmt = select(Chat).where(Chat.id == user_message.chat_id)  # type: ignore[arg-type]
    chat_result = await db.execute(chat_stmt)
    chat = chat_result.scalar_one_or_none()

    # Get attachments for this message
    attachments_stmt = (
        select(MessageAttachment)
        .where(MessageAttachment.message_id == user_message.id)  # type: ignore[arg-type]
        .where(MessageAttachment.status == "uploaded")  # type: ignore[arg-type]
        .where(MessageAttachment.deleted_at.is_(None))  # type: ignore[union-attr]
    )
    attachments_result = await db.execute(attachments_stmt)
    attachments = attachments_result.scalars().all()
    attachment_ids = [att.attachment_id for att in attachments] if attachments else []

    # Get user chat preferences to retrieve mode
    preferences_stmt = (
        select(UserChatPreference)
        .where(UserChatPreference.chat_id == user_message.chat_id)  # type: ignore[arg-type]
        .where(UserChatPreference.deleted_at.is_(None))  # type: ignore[union-attr]
    )
    preferences_result = await db.execute(preferences_stmt)
    user_preferences = preferences_result.scalar_one_or_none()
    mode = user_preferences.mode if user_preferences and user_preferences.mode else "ask"
    project_id = user_preferences.focus_project_id if user_preferences and user_preferences.focus_project_id else None
    websearch_enabled = user_preferences.is_websearch_enabled if user_preferences else None

    # Get source from message, default to "web" if not set
    source = user_message.source or "web"

    # Reconstruct ChatRequest
    return ChatRequest(
        query=user_message.content or "",
        chat_id=user_message.chat_id,
        user_id=user_id,
        llm=user_message.llm_model or LLMModels.DEFAULT,
        is_new=False,  # Always false for regenerate
        is_temp=False,
        workspace_id=chat.workspace_id if chat else None,
        workspace_slug=chat.workspace_slug if chat else None,
        workspace_in_context=chat.workspace_in_context if chat else False,
        is_websearch_enabled=websearch_enabled if websearch_enabled is not None else (chat.is_websearch_enabled if chat else False),
        is_project_chat=chat.is_project_chat if chat else False,
        project_id=project_id,
        attachment_ids=attachment_ids,
        context={"token_id": str(user_message.id)},  # Reuse same message ID
        source=source,
        mode=mode,
    )


async def create_message_mentions(db: AsyncSession, message_id: UUID4, workspace_id: UUID4, mentions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Upsert message mentions into the database.
    """
    try:
        for mention in mentions:
            mention_type = mention.get("mention_type")
            mention_id_val = mention.get("mention_id")
            msg_id = mention.get("message_id", message_id)
            ws_id = mention.get("workspace_id", workspace_id)

            if not mention_type or not mention_id_val:
                log.warning(f"Skipping invalid mention: {mention}")
                continue

            message_mention = MessageMention(
                message_id=msg_id,
                workspace_id=ws_id,
                mention_type=mention_type,
                mention_id=mention_id_val,
            )
            db.add(message_mention)
        await db.commit()
        return {"message": "success"}
    except Exception as e:
        log.error(f"Error creating message mentions: {e}")
        await db.rollback()
        return {"message": "error", "error": str(e)}
