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

"""Mobile AI response generation endpoints with streaming support."""

import asyncio
import contextlib
import json
import uuid
from typing import Any
from typing import Coroutine
from typing import Dict
from typing import Optional
from typing import Union
from typing import cast

from fastapi import APIRouter
from fastapi import Depends
from fastapi import Path
from fastapi.responses import JSONResponse
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import UUID4
from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.api.dependencies import jwt_schema
from pi.app.api.dependencies import validate_jwt_token
from pi.app.api.v2.helpers.plane_sql_queries import resolve_workspace_id_from_project_id
from pi.app.models.enums import FlowStepType
from pi.app.models.enums import UserTypeChoices
from pi.app.models.message import MessageFlowStep
from pi.app.schemas.mobile.chat import ChatRequestMobile
from pi.app.utils import validate_chat_request
from pi.app.utils.background_tasks import schedule_chat_search_upsert
from pi.app.utils.exceptions import SQLGenerationError
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.core.db.plane_pi.lifecycle import get_streaming_db_session
from pi.services.chat.chat import PlaneChatBot
from pi.services.chat.helpers.tool_utils import format_clarification_as_text
from pi.services.chat.utils import resolve_workspace_slug
from pi.services.retrievers.pg_store.message import get_message_by_id
from pi.services.retrievers.pg_store.message import mark_assistant_response_as_replaced
from pi.services.retrievers.pg_store.message import reconstruct_chat_request_from_message
from pi.services.retrievers.pg_store.message import upsert_message
from pi.services.retrievers.pg_store.message import upsert_message_flow_steps

log = logger.getChild("v2.mobile.responses")
router = APIRouter()


@router.post("/", status_code=200)
async def create_response(
    data: ChatRequestMobile,
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Create an AI response with streaming (Mobile).

    This endpoint processes a chat query and streams the AI response back to mobile
    clients using Server-Sent Events (SSE). It supports reasoning display, clarifications,
    and action suggestions.

    The streaming response includes:
    - Delta events: Chunks of the AI response text
    - Reasoning events: AI reasoning steps (displayed as "thinking")
    - Actions events: Suggested actions/operations
    - Error events: Any errors that occur during processing

    Args:
        data: ChatRequestMobile containing:
            - query: User's question/message
            - chat_id: UUID of the chat conversation
            - llm: AI model to use (e.g., "gpt-4", "claude-3")
            - workspace_id: UUID of workspace (optional)
            - project_id: UUID of project (optional)
            - workspace_in_context: Whether workspace context is enabled
            - context: Additional context data
        token: JWT token for authentication (injected)
        db: Database session (injected)

    Returns:
        StreamingResponse with text/event-stream media type containing:
        - event: reasoning, data: <reasoning text>
        - event: delta, data: <response chunk>
        - event: actions, data: <JSON actions>
        - event: error, data: <error message>

    Status Codes:
        - 200: Streaming response started successfully
        - 400: Invalid request (missing workspace_id when required)
        - 401: Invalid or missing authentication
        - 500: Internal server error or SQL generation failure

    Example Request:
        POST /api/v2/mobile/responses/
        Authorization: Bearer <jwt-token>
        {
            "query": "What are my open issues?",
            "chat_id": "abc-123",
            "llm": "gpt-4",
            "workspace_in_context": true,
            "workspace_id": "xyz-789",
            "context": {}
        }

    Example Response (SSE Stream):
        event: reasoning
        data: Analyzing your workspace...

        event: delta
        data: You have 5 open issues:

        event: delta
        data: 1. Bug in login...

        event: actions
        data: {"actions": [...]}

    React Native Example:
        const response = await fetch('/api/v2/mobile/responses/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: userQuery,
                chat_id: chatId,
                llm: selectedModel,
                workspace_in_context: true,
                workspace_id: workspaceId,
                context: {}
            })
        });

        // Handle SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const {done, value} = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\\n');

            for (const line of lines) {
                if (line.startsWith('event:')) {
                    const event = line.substring(7);
                    // Handle event type
                } else if (line.startsWith('data:')) {
                    const data = line.substring(6);
                    // Handle data
                }
            }
        }

    Notes:
        - Uses JWT authentication for mobile apps
        - Streams response in real-time using SSE
        - Includes 10-second heartbeat for long operations
        - Automatically indexes chat for search after completion
        - Supports workspace and project contexts
        - Resolves workspace details from project_id if needed
        - Compatible with React Native and mobile HTTP clients
        - Migrated from V1: POST /api/v1/mobile/chat/get-answer/

    SSE Event Types:
        - reasoning: AI thinking/reasoning steps
        - delta: Incremental response text
        - actions: Planned actions (JSON)
        - error: Error messages

    Use Cases:
        - Real-time chat responses in mobile apps
        - Voice-to-text with streaming transcription
        - Progressive UI updates as AI generates response
        - Mobile assistant interactions
    """
    try:
        await validate_jwt_token(token)
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    # Pre-validate required fields
    if data.workspace_in_context and not (data.workspace_id or data.project_id):
        # Currently mobile not providing focus, so set project_id as None
        data.project_id = None
        return JSONResponse(
            status_code=400,
            content={"detail": "Either project_id or workspace_id must be provided when workspace_in_context is true"},
        )

    # Constructing query_id to insert into index, can be removed after shifting to web flow (queue_answer, stream_answer)
    query_id = uuid.uuid4()
    data.context["token_id"] = str(query_id)

    llm = data.llm
    log.info(f"Processing mobile chat request for chat_id={data.chat_id}, llm={llm}")
    chatbot = PlaneChatBot(llm=llm)

    async def stream_response():
        token_id = None
        try:
            async with get_streaming_db_session() as stream_db:
                # Heartbeat mechanism that only emits after 10s of inactivity
                heartbeat_stop = asyncio.Event()
                heartbeat_task: Optional[asyncio.Task[None]] = None

                async def heartbeat_emitter() -> None:
                    """Sleep for 10s, then complete (heartbeat fires)."""
                    with contextlib.suppress(asyncio.CancelledError):
                        await asyncio.sleep(10)

                base_iter = chatbot.process_chat_stream(data, stream_db)
                next_chunk_task: asyncio.Task[Union[str, Dict[str, Any]]] = asyncio.create_task(
                    cast(Coroutine[None, None, Union[str, Dict[str, Any]]], base_iter.__anext__())
                )

                # Start initial heartbeat timer
                heartbeat_task = asyncio.create_task(heartbeat_emitter())

                try:
                    while True:
                        # Race the next chunk against the heartbeat timer
                        done, _pending = await asyncio.wait({next_chunk_task, heartbeat_task}, return_when=asyncio.FIRST_COMPLETED)

                        # If heartbeat timer completed first, emit heartbeat and restart timer
                        if heartbeat_task in done and not heartbeat_stop.is_set():
                            heartbeat_payload = {"reasoning": "⏳ Still working..."}
                            yield f"event: reasoning\ndata: {json.dumps(heartbeat_payload)}\n\n"
                            # Restart heartbeat timer
                            heartbeat_task = asyncio.create_task(heartbeat_emitter())

                        if next_chunk_task in done:
                            try:
                                chunk = next_chunk_task.result()
                            except StopAsyncIteration:
                                break
                            except Exception as _e:
                                log.error(f"Error reading mobile stream chunk: {_e!s}")
                                break

                            # Cancel and restart heartbeat timer since we got a chunk (activity detected)
                            if heartbeat_task and not heartbeat_task.done():
                                heartbeat_task.cancel()
                                with contextlib.suppress(asyncio.CancelledError):
                                    await heartbeat_task
                            heartbeat_task = asyncio.create_task(heartbeat_emitter())

                            # Manage the chunk the old way
                            if isinstance(chunk, dict):
                                if "chunk_type" in chunk and chunk["chunk_type"] == "reasoning":
                                    # Check if dict already has proper reasoning structure to avoid double-wrapping
                                    if "reasoning" in chunk and isinstance(chunk.get("reasoning"), str):
                                        # Already has {"reasoning": "text"} structure, send directly
                                        bwc_chunk = f"{chunk["header"]}{chunk["content"]}"
                                        yield f"event: reasoning\ndata: {bwc_chunk}\n\n"
                                    else:
                                        # Till the mobile team updates the app to support json format, we need to yield the chunk as a string
                                        bwc_payload = f"{chunk["header"]}{chunk["content"]}"
                                        # payload = {'header': chunk.get('header', ''), 'content': chunk.get('content', '')}
                                        # yield f"event: reasoning\ndata: {json.dumps(payload)}\n\n"
                                        yield f"event: reasoning\ndata: {bwc_payload}\n\n"
                                else:
                                    # Check if dict already has proper chunk structure to avoid double-wrapping
                                    if "chunk" in chunk and isinstance(chunk.get("chunk"), str):
                                        # Already has {"chunk": "text"} structure, send directly
                                        yield f"event: delta\ndata: {chunk["chunk"]}\n\n"
                                    else:
                                        # Wrap the dict in chunk envelope
                                        payload: Dict[str, Any] = {"chunk": chunk}
                                        yield f"event: delta\ndata: {json.dumps(payload)}\n\n"
                            elif isinstance(chunk, str) and chunk.startswith("πspecial clarification blockπ: "):
                                clarification_content = chunk.replace("πspecial clarification blockπ: ", "")
                                try:
                                    clarification_data = json.loads(clarification_content)
                                    formatted_text = format_clarification_as_text(clarification_data)
                                    yield f"event: delta\ndata: {formatted_text}\n\n"
                                except json.JSONDecodeError:
                                    log.warning(f"Failed to parse clarification JSON: {clarification_content}")
                                    formatted_text = "I'm sorry, I can't understand your request in your workspace context. Can you be more specific?"
                                    yield f"event: delta\ndata: {formatted_text}\n\n"
                            elif isinstance(chunk, str) and chunk.startswith("πspecial actions blockπ: "):
                                actions_content = chunk.replace("πspecial actions blockπ: ", "")
                                try:
                                    actions_data = json.loads(actions_content)
                                    yield f"event: actions\ndata: {json.dumps(actions_data)}\n\n"
                                except json.JSONDecodeError:
                                    log.warning(f"Failed to parse actions JSON: {actions_content}")
                                    payload = {"chunk": chunk}
                                    yield f"event: delta\ndata: {json.dumps(payload)}\n\n"
                            else:
                                # payload = {"chunk": chunk}
                                yield f"event: delta\ndata: {chunk}\n\n"

                            # Prepare next iteration
                            next_chunk_task = asyncio.create_task(cast(Coroutine[None, None, Union[str, Dict[str, Any]]], base_iter.__anext__()))
                finally:
                    heartbeat_stop.set()
                    if heartbeat_task and not heartbeat_task.done():
                        heartbeat_task.cancel()
                        with contextlib.suppress(asyncio.CancelledError):
                            await heartbeat_task
                    # Cancel the in-flight chunk task so the inner generator
                    # receives CancelledError and can persist partial content
                    # while the DB session is still open.
                    if next_chunk_task and not next_chunk_task.done():
                        next_chunk_task.cancel()
                        with contextlib.suppress(asyncio.CancelledError, StopAsyncIteration):
                            await next_chunk_task
                    # Throw CancelledError into the generator so
                    # _process_chat_stream_core's except block can save partial state.
                    with contextlib.suppress(asyncio.CancelledError, StopAsyncIteration, GeneratorExit):
                        await base_iter.athrow(asyncio.CancelledError())

            # Extract token_id from data.context if available for background task (Fix #2: Remove duplicate)
            if hasattr(data, "context") and isinstance(data.context, dict):
                token_id = data.context.get("token_id")

        except Exception as e:
            log.error(f"Error processing chat request: {e!s}")
            # Fix #3: Add missing double newline for SSE spec compliance
            yield "event: error\ndata: An unexpected error occurred. Please try again\n\n"
        finally:
            # Schedule Celery task to upsert chat search index after streaming completes
            if token_id:
                schedule_chat_search_upsert(token_id)

    try:
        return StreamingResponse(stream_response(), media_type="text/event-stream")

    except SQLGenerationError:
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})
    except Exception:
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.post("/queue", status_code=201)
async def queue_response(
    data: ChatRequestMobile,
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Queue a response for later streaming (Mobile - Step 1 of 2).

    This is the first phase of a two-step streaming flow designed for mobile clients.
    It persists the chat request and returns a one-time stream token that can be
    redeemed later to start the streaming response.

    Two-Step Flow:
    1. POST /responses/queue → Returns stream_token
    2. GET /responses/stream/{stream_token} → Starts SSE stream

    This pattern is useful for:
    - Separating request submission from response streaming
    - Allowing UI navigation before starting stream
    - Handling OAuth flows that need to interrupt the request
    - Mobile apps that need to prepare UI before streaming

    The token is the UUID of the created user Message row, and the full ChatRequest
    is stored in a MessageFlowStep with tool_name="QUEUE" until redeemed.

    Args:
        data: ChatRequestMobile containing:
            - query: User's question/message
            - chat_id: UUID of the chat (required, must be created first)
            - llm: AI model to use
            - workspace_id: UUID of workspace (optional)
            - project_id: UUID of project (optional)
            - workspace_in_context: Whether workspace context is enabled
            - is_project_chat: Whether this is a project-specific chat
        db: Database session (injected)
        token: JWT token for authentication (injected)

    Returns:
        JSON response with:
        - stream_token: UUID string to use in step 2

    Status Codes:
        - 201: Request queued successfully
        - 400: Invalid request (missing chat_id or validation failure)
        - 401: Invalid or missing authentication
        - 500: Failed to create message or queue request

    Example Request:
        POST /api/v2/mobile/responses/queue
        Authorization: Bearer <jwt-token>
        {
            "query": "What are my tasks?",
            "chat_id": "abc-123",
            "llm": "gpt-4",
            "workspace_in_context": true,
            "workspace_id": "xyz-789",
            "context": {}
        }

    Example Response:
        {
            "stream_token": "550e8400-e29b-41d4-a716-446655440000"
        }

    React Native Example:
        // Step 1: Queue the request
        const queueResponse = await fetch('/api/v2/mobile/responses/queue', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: userQuery,
                chat_id: chatId,
                llm: selectedModel,
                workspace_in_context: true,
                workspace_id: workspaceId,
                context: {}
            })
        });

        const {stream_token} = await queueResponse.json();

        // Step 2: Start streaming (see GET /responses/stream/{token})
        const streamUrl = `/api/v2/mobile/responses/stream/${stream_token}`;
        // ... handle SSE streaming

    Notes:
        - Uses JWT authentication for mobile apps
        - chat_id must be created first via POST /chats/
        - Token is single-use (consumed in step 2)
        - Workspace details are backfilled into chat record
        - Resolves workspace_id from project_id if needed
        - Request is validated before queuing
        - Migrated from V1: POST /api/v1/mobile/chat/queue-answer/

    Use Cases:
        - Mobile UI that shows loading state before streaming
        - OAuth flows that need to pause before streaming
        - Deferred streaming (queue now, stream later)
        - Request persistence for reliability
    """
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    validation_error = validate_chat_request(data)
    if validation_error:
        return JSONResponse(
            status_code=validation_error["status_code"],
            content={"detail": validation_error["detail"]},
        )

    # Create a new USER message that will serve as the token
    if data.chat_id is None:
        return JSONResponse(
            status_code=400,
            content={"detail": "chat_id is required. Call POST /chats/ first."},
        )

    # Resolve workspace_id from project_id if needed
    if not data.workspace_id:
        if data.is_project_chat and data.project_id:
            log.info(f"Mobile Queue: Resolving workspace_id from project_id: {data.project_id}")
            resolved_workspace_id = await resolve_workspace_id_from_project_id(str(data.project_id))
            from uuid import UUID

            workspace_id_to_use = UUID(str(resolved_workspace_id)) if resolved_workspace_id else None
            log.info(f"Mobile Queue: Resolved workspace_id: {workspace_id_to_use}")
        else:
            workspace_id_to_use = None
    else:
        workspace_id_to_use = data.workspace_id

    # Resolve workspace_slug if needed
    if not data.workspace_slug:
        if workspace_id_to_use:
            resolved_workspace_slug = await resolve_workspace_slug(workspace_id_to_use, data.workspace_slug)
        else:
            log.warning("Mobile Queue: No workspace_id to resolve workspace_slug from")
            resolved_workspace_slug = None
    else:
        resolved_workspace_slug = data.workspace_slug

    from uuid import uuid4

    token_id = uuid4()
    user_message_res = await upsert_message(
        message_id=token_id,
        chat_id=data.chat_id,  # type: ignore[arg-type]
        content=data.query,
        parsed_content=None,
        user_type=UserTypeChoices.USER.value,
        llm_model=data.llm,
        workspace_slug=resolved_workspace_slug,
        db=db,
    )

    if user_message_res.get("message") != "success":
        return JSONResponse(status_code=500, content={"detail": "Failed to create message"})

    # Stash the full ChatRequest inside a flow-step row
    from fastapi.encoders import jsonable_encoder

    flow_step_payload = {
        "step_order": 0,
        "step_type": FlowStepType.TOOL.value,
        "tool_name": "QUEUE",
        "content": "queued chat request",
        "execution_data": jsonable_encoder(data),
        "is_planned": False,
        "is_executed": False,
    }
    flow_res = await upsert_message_flow_steps(message_id=token_id, chat_id=data.chat_id, db=db, flow_steps=[flow_step_payload])

    if flow_res.get("message") != "success":
        return JSONResponse(status_code=500, content={"detail": "Failed to queue request"})

    # Backfill chat record with workspace details
    try:
        from pi.app.models.chat import Chat

        chat_stmt = select(Chat).where(Chat.id == data.chat_id)  # type: ignore[arg-type]
        chat_result = await db.execute(chat_stmt)
        existing_chat = chat_result.scalar_one_or_none()

        if existing_chat:
            if workspace_id_to_use is not None:
                existing_chat.workspace_id = workspace_id_to_use
            if resolved_workspace_slug is not None:
                existing_chat.workspace_slug = resolved_workspace_slug
            existing_chat.workspace_in_context = data.workspace_in_context
            existing_chat.is_websearch_enabled = data.is_websearch_enabled
            await db.commit()
        else:
            log.warning(f"Chat {data.chat_id} not found for backfill")
    except Exception as e:
        log.error(f"Error backfilling chat workspace details: {e}")
        # Don't fail the request if backfill fails

    return JSONResponse(status_code=201, content={"stream_token": str(token_id)})


@router.get("/stream/{token}")
async def stream_response(
    token: UUID4 = Path(..., description="Stream token from queue endpoint"),
    db: AsyncSession = Depends(get_async_session),
    auth_token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Stream a queued response (Mobile - Step 2 of 2) or regenerate an existing response.

    This is the second phase of the two-step streaming flow. It looks up the queued
    ChatRequest by token, deletes the queue entry, and starts the SSE stream.

    Two-Step Flow:
    1. POST /responses/queue → Returns stream_token
    2. GET /responses/stream/{stream_token} → Starts SSE stream (this endpoint)

    Regenerate Flow:
    This endpoint also handles regeneration. If called with a token that has no
    QUEUE flow step, it treats it as a regenerate request and creates a new
    response while marking the old one as replaced.

    Args:
        token: Stream token UUID from queue endpoint or existing message ID (path parameter)
        db: Database session (injected)
        auth_token: JWT token for authentication (injected)

    Returns:
        StreamingResponse with text/event-stream containing AI response
        (same format as POST /responses/)

    Status Codes:
        - 200: Streaming started successfully
        - 401: Invalid authentication or OAuth still required
        - 404: Message/token not found
        - 500: Failed to reconstruct request or internal error

    Example Request (Normal Flow):
        GET /api/v2/mobile/responses/stream/550e8400-e29b-41d4-a716-446655440000
        Authorization: Bearer <jwt-token>

    Example Request (Regenerate):
        GET /api/v2/mobile/responses/stream/<existing-message-id>
        Authorization: Bearer <jwt-token>

    React Native Example (Two-Step Flow):
        // Step 1: Queue request
        const queueRes = await fetch('/api/v2/mobile/responses/queue', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chatRequest)
        });
        const {stream_token} = await queueRes.json();

        // Step 2: Stream response
        const streamRes = await fetch(
            `/api/v2/mobile/responses/stream/${stream_token}`,
            {
                headers: {'Authorization': `Bearer ${token}`}
            }
        );

        // Handle SSE stream (same as POST /responses/)
        const reader = streamRes.body.getReader();
        // ... read stream

    React Native Example (Regenerate):
        // Regenerate from existing message
        const streamRes = await fetch(
            `/api/v2/mobile/responses/stream/${existingMessageId}`,
            {
                headers: {'Authorization': `Bearer ${token}`}
            }
        );
        // ... handle stream

    OAuth Flow:
        If OAuth is required and not completed:
        {
            "detail": "OAuth authorization still required...",
            "error_code": "OAUTH_REQUIRED"
        }

    Notes:
        - Uses JWT authentication for mobile apps
        - Token is single-use (deleted after redemption in normal flow)
        - Reuses existing message row (no duplicate messages)
        - Handles both queued and regenerate flows automatically
        - For regenerate: marks old response as replaced before generating new
        - OAuth-required messages return 401 until OAuth completed
        - Migrated from V1: GET /api/v1/mobile/chat/stream-answer/{token}

    Use Cases:
        - Complete two-step flow after queueing request
        - Regenerate AI response for existing message
        - Resume after OAuth completion
        - Mobile apps with deferred streaming
    """
    try:
        auth = await validate_jwt_token(auth_token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception:
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    # Locate the queued flow step
    stmt = (
        select(MessageFlowStep)
        .where(MessageFlowStep.message_id == token)  # type: ignore[arg-type]
        .where(MessageFlowStep.tool_name == "QUEUE")  # type: ignore[arg-type]
    )
    res = await db.execute(stmt)
    flow_step: MessageFlowStep | None = res.scalar_one_or_none()

    if not flow_step:
        # REGENERATE FLOW: No QUEUE flow step means this is regenerate
        log.info(f"Mobile: No QUEUE flow step found for token {token}. Treating as regenerate request.")

        # Get the user message
        user_message = await get_message_by_id(db, token)
        if not user_message:
            log.warning(f"Mobile: Message not found for token {token}")
            return JSONResponse(status_code=404, content={"detail": "Message not found"})

        # Mark old assistant response as replaced BEFORE generating new one
        marked = await mark_assistant_response_as_replaced(db, user_message.id)
        if marked:
            log.info(f"Mobile: Marked old assistant response(s) as replaced for message {token}")
        else:
            log.info(f"Mobile: No existing assistant response found for message {token}")

        # Reconstruct ChatRequest from user message
        try:
            queued_request = await reconstruct_chat_request_from_message(db, user_message, user_id)
        except Exception as e:
            log.error(f"Mobile: Error reconstructing ChatRequest from message {token}: {e}")
            return JSONResponse(status_code=500, content={"detail": "Failed to reconstruct request"})

        # Pass token_id so new assistant message reuses same user message as parent
        try:
            queued_request.context["token_id"] = str(token)
        except Exception as e:
            log.warning(f"Mobile: Failed to attach token_id to regenerate request context: {e!s}")

        log.info(f"Mobile: Regenerating response for message {token}")

        # Stream new response
        return await create_response(data=queued_request, token=auth_token, db=db)

    else:
        # NORMAL FLOW: QUEUE flow step exists, this is first generation
        try:
            raw_data = flow_step.execution_data or {}

            # Check if OAuth is required
            if flow_step.oauth_required:
                if flow_step.oauth_completed:
                    log.info(f"Mobile: OAuth completed for message {token}. Processing request.")
                else:
                    return JSONResponse(
                        status_code=401,
                        content={
                            "detail": "OAuth authorization still required. Please complete OAuth authentication first.",
                            "error_code": "OAUTH_REQUIRED",
                        },
                    )

            # Convert empty-string UUIDs to None
            for field in ["project_id", "workspace_id", "chat_id"]:
                if field in raw_data and raw_data[field] == "":
                    raw_data[field] = None
            raw_data["user_id"] = user_id
            queued_request = ChatRequestMobile.parse_obj(raw_data)

        except Exception as e:
            log.error(f"Mobile: Malformed execution_data for token {token}: {e!s}")
            return JSONResponse(status_code=500, content={"detail": "Corrupted queued request"})

        # Consume the queue entry (single-use token)
        await db.delete(flow_step)
        await db.commit()

        # Pass token/message_id forward
        try:
            queued_request.context["token_id"] = str(token)
        except Exception as e:
            log.warning(f"Mobile: Failed to attach token_id to queued request context: {e!s}")

        # Start streaming
        return await create_response(data=queued_request, token=auth_token, db=db)
