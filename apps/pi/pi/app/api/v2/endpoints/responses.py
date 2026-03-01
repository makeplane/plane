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

import asyncio
import contextlib
import json
from typing import AsyncGenerator
from typing import Coroutine
from typing import Optional
from typing import cast
from uuid import UUID
from uuid import uuid4

from fastapi import APIRouter
from fastapi import Depends
from fastapi import Path
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.responses import StreamingResponse
from pydantic import UUID4
from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi import settings
from pi.app.api.dependencies import get_current_user
from pi.app.api.dependencies import validate_plane_token
from pi.app.api.v1.endpoints._sse import normalize_error_chunk
from pi.app.api.v1.endpoints._sse import sse_done
from pi.app.api.v1.endpoints._sse import sse_event
from pi.app.api.v1.helpers.plane_sql_queries import resolve_workspace_id_from_project_id
from pi.app.models.enums import FlowStepType
from pi.app.models.enums import UserTypeChoices
from pi.app.models.message import MessageFlowStep
from pi.app.schemas.chat import ActionBatchExecutionRequest
from pi.app.schemas.chat import ArtifactData
from pi.app.schemas.chat import ChatRequest
from pi.app.utils import validate_chat_request
from pi.app.utils.background_tasks import schedule_chat_search_upsert
from pi.app.utils.exceptions import SQLGenerationError
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.core.db.plane_pi.lifecycle import get_streaming_db_session
from pi.services.chat.action_executor import BuildModeToolExecutor
from pi.services.chat.chat import PlaneChatBot
from pi.services.chat.helpers.tool_utils import format_clarification_as_text
from pi.services.chat.utils import resolve_workspace_slug
from pi.services.retrievers.pg_store.message import get_message_by_id
from pi.services.retrievers.pg_store.message import mark_assistant_response_as_replaced
from pi.services.retrievers.pg_store.message import reconstruct_chat_request_from_message
from pi.services.retrievers.pg_store.message import upsert_message
from pi.services.retrievers.pg_store.message import upsert_message_flow_steps

log = logger.getChild("v2.responses")
router = APIRouter()

# Constants for batch execution
BATCH_EXECUTION_ERRORS = {
    "NO_PLANNED_ACTIONS": "No planned actions found for this message",
    "NO_ORIGINAL_QUERY": "Original user query not found",
    "OAUTH_REQUIRED": "No valid OAuth token found. Please complete OAuth authentication for this workspace first.",
    "WORKSPACE_NOT_FOUND": "Workspace not found",
    "INVALID_SESSION": "Invalid Session",
    "INTERNAL_ERROR": "Internal server error",
}


@router.post("/slack/")
async def create_response_slack(data: ChatRequest, request: Request, db: AsyncSession = Depends(get_async_session)):
    """
    Create a complete AI response for Slack integration.

    This endpoint is specifically designed for Slack bots and other integrations
    that cannot handle streaming responses. It returns a complete JSON response
    with the full answer, and automatically executes any planned actions.

    Key Differences from streaming endpoint:
    - Uses token-based authentication (Authorization header)
    - Returns complete response (not streaming)
    - Automatically executes batch actions if detected
    - Returns execution context and results
    - Designed for Slack and similar platforms

    Args:
        data: ChatRequest containing query, workspace, and chat context
        request: FastAPI request object to extract Authorization header
        db: Database session

    Returns:
        JSONResponse with:
        - response: Complete AI response text
        - actions_data: Planned actions (if any)
        - context: Execution results (if actions were executed)
        - response_type: Type of response ('response', 'actions', 'clarification')
        - clarification_data: Clarification details (if applicable)
    """
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(status_code=401, content={"detail": "Missing Authorization header"})
        auth_response = await validate_plane_token(auth_header)
        access_token = auth_response.plane_token
    except Exception as e:
        log.error(f"Error validating plane token: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid Plane token"})

    chatbot = PlaneChatBot(llm=data.llm, token=access_token)

    final_response = ""
    actions_data_list = []
    clarification_data = {}
    formatted_context = {}
    response_type = "response"

    # Listen to all the stream chunks, join the chunks and return the complete response as JSON
    async with get_streaming_db_session() as stream_db:
        base_iter = chatbot.process_chat_stream(data, db=stream_db)
        async for chunk in base_iter:
            if isinstance(chunk, dict):
                # Currently only reasoning chunk is sent as dict.
                continue
            # Ignore all intermediate chunks
            if chunk.startswith("πspecial reasoning block"):
                continue
            if chunk.startswith("πspecial actions blockπ: "):
                response_type = "actions"
                action_data = json.loads(chunk.replace("πspecial actions blockπ: ", ""))
                actions_data_list.append(action_data)
            elif chunk.startswith("πspecial clarification blockπ: "):
                response_type = "clarification"
                clarification_data = json.loads(chunk.replace("πspecial clarification blockπ: ", ""))
            final_response += chunk

    if actions_data_list:
        # Validate required fields before creating ActionBatchExecutionRequest
        workspace_id = data.workspace_id
        chat_id = data.chat_id
        user_id = data.user_id

        # Convert all action blocks to ArtifactData objects
        artifact_data_objects = []
        message_id = None

        for actions_data in actions_data_list:
            message_id_raw = actions_data.get("message_id")
            artifact_id_raw = actions_data.get("artifact_id")

            if not workspace_id or not chat_id or not message_id_raw or not artifact_id_raw or not user_id:
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Missing required fields: workspace_id, chat_id, message_id, artifact_id, or user_id"},
                )

            # Convert message_id to UUID if it's a string
            if isinstance(message_id_raw, str):
                current_message_id = UUID(message_id_raw)
            elif isinstance(message_id_raw, UUID):
                current_message_id = message_id_raw
            else:
                return JSONResponse(status_code=400, content={"detail": "Invalid message_id format"})

            if message_id is None:
                message_id = current_message_id

            # Convert artifact_id to UUID if it's a string
            if isinstance(artifact_id_raw, str):
                artifact_id = UUID(artifact_id_raw)
            elif isinstance(artifact_id_raw, UUID):
                artifact_id = artifact_id_raw
            else:
                return JSONResponse(status_code=400, content={"detail": "Invalid artifact_id format"})

            artifact_data_objects.append(ArtifactData(artifact_id=artifact_id, is_edited=False, action_data=actions_data))

        # Validate that all required IDs are present (not None)
        if workspace_id is None or chat_id is None or message_id is None:
            return JSONResponse(
                status_code=400,
                content={"detail": "Missing required fields: workspace_id, chat_id, or message_id cannot be None"},
            )

        # Execute batch actions using the service
        service = BuildModeToolExecutor(chatbot=PlaneChatBot(settings.llm_model.DEFAULT), db=db)

        result = await service.execute(
            ActionBatchExecutionRequest(
                workspace_id=workspace_id,
                chat_id=chat_id,
                message_id=message_id,
                artifact_data=artifact_data_objects,
                access_token=access_token,
            ),
            user_id,
        )

        # Check if service returned an error
        if result.get("error"):
            status_code = result.get("status_code", 500)
            detail = result.get("detail", "Unknown error")
            content = {"detail": detail}
            if "error_code" in result:
                content["error_code"] = result["error_code"]
            if "workspace_id" in result:
                content["workspace_id"] = result["workspace_id"]
            if "user_id" in result:
                content["user_id"] = result["user_id"]
            return JSONResponse(status_code=status_code, content=content)

        # Extract the formatted context from successful result
        formatted_context = result

    return JSONResponse(
        status_code=200,
        content={
            "response": final_response,
            "actions_data": actions_data_list,
            "context": formatted_context,
            "response_type": response_type,
            "clarification_data": clarification_data,
        },
    )


@router.post("/")
async def create_response_stream(
    data: ChatRequest,
    current_user=Depends(get_current_user),
):
    """
    Create a streaming AI response to a user query.

    This is the main endpoint for generating AI responses. It streams the response
    in real-time using Server-Sent Events (SSE) for immediate user feedback.

    Features:
    - Authenticates the user via session cookie
    - Validates the chat request
    - Streams the response in real-time using SSE
    - Handles reasoning, actions, and clarifications
    - Emits heartbeats during long-running operations
    - Schedules background tasks for search indexing

    Args:
        data: ChatRequest containing query, workspace, and chat context
        session: Session cookie for authentication

    Returns:
        StreamingResponse with text/event-stream media type

    Event Types:
        - reasoning: AI thinking process
        - actions: Planned actions data
        - delta: Content chunks
        - cta_available: Call-to-action
        - error: Error messages
        - done: Stream completion
    """
    user_id = current_user.id

    data.user_id = user_id

    # Validate request data
    validation_error = validate_chat_request(data)
    if validation_error:
        return JSONResponse(status_code=validation_error["status_code"], content={"detail": validation_error["detail"]})

    chatbot = PlaneChatBot(llm=data.llm)

    async def stream_response() -> AsyncGenerator[str, None]:
        token_id = None
        try:
            pending_backticks = ""
            # Open a short-lived session for the duration of the streaming work
            async with get_streaming_db_session() as stream_db:
                # Heartbeat mechanism that does not cancel the underlying generator
                # Only emits heartbeat after 10s of inactivity (no chunks received)
                heartbeat_stop = asyncio.Event()
                heartbeat_task: Optional[asyncio.Task[None]] = None

                async def heartbeat_emitter() -> None:
                    """Sleep for 10s, then put heartbeat in queue if not stopped."""
                    with contextlib.suppress(asyncio.CancelledError):
                        await asyncio.sleep(10)

                base_iter = chatbot.process_chat_stream(data, db=stream_db)
                next_chunk_task: asyncio.Task[str] = asyncio.create_task(cast(Coroutine[None, None, str], base_iter.__anext__()))

                # Start initial heartbeat timer
                heartbeat_task = asyncio.create_task(heartbeat_emitter())

                try:
                    while True:
                        # Race the next chunk against the heartbeat timer
                        done, _pending = await asyncio.wait({next_chunk_task, heartbeat_task}, return_when=asyncio.FIRST_COMPLETED)

                        # If heartbeat timer completed first, emit heartbeat and restart timer
                        if heartbeat_task in done and not heartbeat_stop.is_set():
                            payload = {"reasoning": "⏳ Still working...\n\n"}
                            yield f"event: reasoning\ndata: {json.dumps(payload)}\n\n"
                            # Restart heartbeat timer
                            heartbeat_task = asyncio.create_task(heartbeat_emitter())

                        if next_chunk_task in done:
                            try:
                                chunk = next_chunk_task.result()
                            except StopAsyncIteration:
                                break
                            except Exception as _e:
                                log.error(f"Error reading stream chunk: {_e!s}")
                                break

                            # Cancel and restart heartbeat timer since we got a chunk (activity detected)
                            if heartbeat_task and not heartbeat_task.done():
                                heartbeat_task.cancel()
                                with contextlib.suppress(asyncio.CancelledError):
                                    await heartbeat_task
                            heartbeat_task = asyncio.create_task(heartbeat_emitter())

                            # Normalize plain-text error chunks to SSE error events
                            normalized_error = normalize_error_chunk(chunk)
                            if normalized_error:
                                yield normalized_error
                                next_chunk_task = asyncio.create_task(cast(Coroutine[None, None, str], base_iter.__anext__()))
                                continue

                            if chunk.startswith("πspecial reasoning blockπ: "):
                                reasoning_content = chunk.replace("πspecial reasoning blockπ: ", "")
                                payload = {"reasoning": reasoning_content}
                                yield f"event: reasoning\ndata: {json.dumps(payload)}\n\n"
                            elif chunk.startswith("πspecial actions blockπ: "):
                                actions_content = chunk.replace("πspecial actions blockπ: ", "")
                                try:
                                    actions_data = json.loads(actions_content)
                                    yield f"event: actions\ndata: {json.dumps(actions_data)}\n\n"
                                except json.JSONDecodeError:
                                    log.warning(f"Failed to parse actions JSON: {actions_content}")
                                    payload = {"chunk": chunk}
                                    yield f"event: delta\ndata: {json.dumps(payload)}\n\n"
                            elif chunk.startswith("πspecial clarification blockπ: "):
                                clarification_content = chunk.replace("πspecial clarification blockπ: ", "")
                                try:
                                    clarification_data = json.loads(clarification_content)
                                    formatted_text = format_clarification_as_text(clarification_data)
                                    payload = {"chunk": formatted_text}
                                    yield f"event: delta\ndata: {json.dumps(payload)}\n\n"
                                except json.JSONDecodeError:
                                    log.warning(f"Failed to parse clarification JSON: {clarification_content}")
                                    payload = {
                                        "chunk": "I'm sorry, I can't understand your request in your workspace context. Can you be more specific?"
                                    }
                                    yield f"event: delta\ndata: {json.dumps(payload)}\n\n"
                            else:
                                # Handle code block formatting
                                if chunk.startswith("```"):
                                    if pending_backticks:
                                        payload = {"chunk": pending_backticks}
                                        yield f"event: delta\ndata: {json.dumps(payload)}\n\n"
                                        pending_backticks = ""
                                    payload = {"chunk": chunk}
                                    yield f"event: delta\ndata: {json.dumps(payload)}\n\n"
                                elif chunk in ["`", "``"]:
                                    pending_backticks += chunk
                                    next_chunk_task = asyncio.create_task(cast(Coroutine[None, None, str], base_iter.__anext__()))
                                    continue
                                else:
                                    if pending_backticks:
                                        chunk = pending_backticks + chunk
                                        pending_backticks = ""
                                    payload = {"chunk": chunk}
                                    yield f"event: delta\ndata: {json.dumps(payload)}\n\n"

                            # Prepare next iteration
                            next_chunk_task = asyncio.create_task(cast(Coroutine[None, None, str], base_iter.__anext__()))
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

            # Handle any remaining pending backticks at the end of stream
            if pending_backticks:
                payload = {"chunk": pending_backticks}
                yield f"event: delta\ndata: {json.dumps(payload)}\n\n"

            # Extract token_id from data.context if available for background task
            if hasattr(data, "context") and isinstance(data.context, dict):
                token_id = data.context.get("token_id")

            # Emit CTA before done to ensure clients receive it
            yield sse_event("cta_available", {"type": "create_page"})
            # Explicitly signal completion so EventSource clients don't interpret
            # the socket close as an error.
            yield sse_done()
        except asyncio.CancelledError:
            # This is expected if the client disconnects, so log as info and let it propagate
            log.info("Stream cancelled by client disconnect.")
        except Exception as e:
            log.error(f"Error streaming response: {e!s}")
            # Emit SSE-compliant error and finalize
            yield sse_event("error", {"message": "An unexpected error occurred. Please try again"})
            yield sse_done()
        finally:
            # Schedule Celery task to upsert chat search index after streaming completes
            if token_id:
                schedule_chat_search_upsert(token_id)

    try:
        return StreamingResponse(stream_response(), media_type="text/event-stream")
    except SQLGenerationError as e:
        log.error(f"SQL generation error: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})
    except Exception as e:
        log.error(f"Unexpected error: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.post("/queue", status_code=201)
async def queue_response(
    data: ChatRequest,
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """
    Queue a chat request and get a stream token for later streaming (Step 1 of 2).

    This is the first phase of a two-step streaming flow, useful for scenarios where
    you need to decouple request submission from response streaming (e.g., mobile apps,
    offline queueing, or user approval workflows).

    Flow:
    1. Client calls this endpoint to queue the request
    2. Server creates a user message and returns a one-time stream token
    3. Client later calls GET /api/v2/responses/stream/{token} to stream the response

    The token is the UUID of the created user message, and the full ChatRequest is
    stored in a MessageFlowStep for later retrieval.

    Args:
        data: ChatRequest containing query, workspace, and chat context
        db: Database session (injected)
        session: Session cookie for authentication (injected)

    Returns:
        JSON response with:
        - stream_token: UUID string to use for streaming (Step 2)

    Status Codes:
        - 201: Request queued successfully
        - 400: Invalid request data or missing chat_id
        - 401: Invalid or missing authentication
        - 500: Internal server error

    Example Request:
        POST /api/v2/responses/queue
        {
            "query": "What are the open issues?",
            "chat_id": "123e4567-e89b-12d3-a456-426614174000",
            "workspace_id": "abc-123",
            "workspace_in_context": true,
            "llm": "gpt-4"
        }

    Example Response:
        {
            "stream_token": "987fcdeb-51a2-43f7-b456-123456789abc"
        }

    Notes:
        - The chat_id must already exist (call POST /api/v2/chats/ first)
        - The token is single-use and consumed when streaming starts
        - Workspace details are backfilled into the chat record
        - For project chats, workspace_id is resolved from project_id
        - Deprecated V1 endpoint: POST /api/v1/chat/queue-answer/
    """

    validation_error = validate_chat_request(data)
    if validation_error:
        return JSONResponse(
            status_code=validation_error["status_code"],
            content={"detail": validation_error["detail"]},
        )

    # 1. Create a new USER message that will serve as the token
    if data.chat_id is None:
        return JSONResponse(
            status_code=400,
            content={"detail": "chat_id is required. Call POST /api/v2/chats/ first."},
        )

    # Resolve workspace id and slug from project id if it's project chat
    if not data.workspace_id:
        if data.is_project_chat and data.project_id:
            log.info(f"Queue-response: Resolving workspace_id from project_id: {data.project_id}")
            resolved_workspace_id = await resolve_workspace_id_from_project_id(str(data.project_id))
            # The DB may return an asyncpg UUID object. Convert safely to a standard uuid.UUID.
            workspace_id_to_use = UUID(str(resolved_workspace_id)) if resolved_workspace_id else None
            log.info(f"Queue-response: Resolved workspace_id: {workspace_id_to_use}")
    else:
        workspace_id_to_use = data.workspace_id

    if not data.workspace_slug:
        if workspace_id_to_use:
            resolved_workspace_slug = await resolve_workspace_slug(workspace_id_to_use, data.workspace_slug)
        else:
            log.warning("Queue-response: No workspace_id to resolve workspace_slug from")
            resolved_workspace_slug = None
    else:
        resolved_workspace_slug = data.workspace_slug

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

    # 2. Stash the full ChatRequest inside a flow-step row
    from fastapi.encoders import jsonable_encoder

    flow_step_payload = {
        "step_order": 0,
        "step_type": FlowStepType.TOOL.value,
        "tool_name": "QUEUE",
        "content": "queued chat request",
        # Use FastAPI's encoder to turn UUIDs/datetimes into JSON-serialisable primitives
        "execution_data": jsonable_encoder(data),
        "is_planned": False,  # QUEUE is not a planned action, it's an internal tool
        "is_executed": False,  # QUEUE is not executed by user
    }
    flow_res = await upsert_message_flow_steps(
        message_id=token_id,
        chat_id=data.chat_id,
        db=db,
        flow_steps=[flow_step_payload],
    )

    if flow_res.get("message") != "success":
        return JSONResponse(status_code=500, content={"detail": "Failed to queue request"})

    # Backfill chat record with workspace details (after successful message creation)
    try:
        from pi.app.models.chat import Chat

        # Get the current chat record to preserve existing data
        chat_stmt = select(Chat).where(Chat.id == data.chat_id)  # type: ignore[arg-type]
        chat_result = await db.execute(chat_stmt)
        existing_chat = chat_result.scalar_one_or_none()

        if existing_chat:
            # Update the chat with workspace details
            if workspace_id_to_use is not None:
                existing_chat.workspace_id = workspace_id_to_use
            if resolved_workspace_slug is not None:
                existing_chat.workspace_slug = resolved_workspace_slug
            # Always update workspace_in_context as it's a required field in ChatRequest
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
async def stream_response_by_token(
    token: UUID4 = Path(..., description="Stream token obtained from POST /api/v2/responses/queue"),
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """
    Stream AI response using a previously queued token (Step 2 of 2).

    This is the second phase of the two-step flow. It retrieves the queued ChatRequest
    by token, deletes the queue entry, and streams the response using SSE.

    This endpoint also supports REGENERATE functionality when called with an existing
    user message ID that has no QUEUE flow step (meaning it's a regenerate request).

    Flow:
    1. Look up the token (message_id) in the database
    2. If QUEUE flow step exists: Normal flow (first generation)
       - Retrieve and parse the queued ChatRequest
       - Delete the QUEUE entry (single-use token)
       - Stream the response
    3. If no QUEUE flow step: Regenerate flow
       - Mark old assistant response as replaced
       - Reconstruct ChatRequest from message
       - Stream new response

    Args:
        token: UUID stream token from POST /api/v2/responses/queue
        db: Database session (injected)
        session: Session cookie for authentication (injected)

    Returns:
        StreamingResponse with text/event-stream media type

    Event Types:
        - reasoning: AI thinking process
        - actions: Planned actions data
        - delta: Content chunks
        - cta_available: Call-to-action
        - error: Error messages
        - done: Stream completion

    Status Codes:
        - 200: Streaming started successfully
        - 401: Invalid or missing authentication, or OAuth required
        - 404: Token/message not found
        - 500: Internal server error

    Example Request:
        GET /api/v2/responses/stream/987fcdeb-51a2-43f7-b456-123456789abc

    Notes:
        - Token is single-use and consumed when streaming starts
        - Supports OAuth completion flow for deferred authorization
        - For regenerate: Marks old response as replaced before generating new one
        - Workspace details are resolved from project_id if needed
        - Deprecated V1 endpoint: GET /api/v1/chat/stream-answer/{token}
    """
    user_id = current_user.id

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
        log.info(f"No QUEUE flow step found for token {token}. Treating as regenerate request.")

        # 1. Get the user message
        user_message = await get_message_by_id(db, token)

        if not user_message:
            log.warning(f"Message not found for token {token}")
            return JSONResponse(status_code=404, content={"detail": "Message not found"})

        # 2. Mark old assistant response as replaced BEFORE generating new one
        # This ensures retrieve_chat_history() won't include it in context for new generation
        marked = await mark_assistant_response_as_replaced(db, user_message.id)
        if marked:
            log.info(f"Marked old assistant response(s) as replaced for message {token}")
        else:
            log.info(f"No existing assistant response found for message {token} " "(first generation or already replaced)")

        # 4. Reconstruct ChatRequest from user message
        try:
            queued_request = await reconstruct_chat_request_from_message(db, user_message, user_id)
        except Exception as e:
            log.error(f"Error reconstructing ChatRequest from message {token}: {e}")
            return JSONResponse(status_code=500, content={"detail": "Failed to reconstruct request"})

        # 5. Pass token_id so new assistant message reuses same user message as parent
        try:
            queued_request.context["token_id"] = str(token)
        except Exception as e:
            log.warning(f"Failed to attach token_id to regenerate request context: {e!s}")

        log.info(f"Regenerating response for message {token}")

        # 6. Stream new response (create_response_stream will call process_query_stream)
        #    When process_query_stream calls retrieve_chat_history,
        #    it will NOT see the old response because is_replaced=True
        return await create_response_stream(data=queued_request, current_user=current_user)

    else:
        # NORMAL FLOW: QUEUE flow step exists, this is first generation
        # Parse the stored ChatRequest
        try:
            raw_data = flow_step.execution_data or {}

            # Check if this is an OAuth message (has oauth_required field)
            if flow_step.oauth_required:
                # This is an OAuth message - check if OAuth is now complete
                # by looking at the oauth_completed column
                if flow_step.oauth_completed:
                    # OAuth is now complete! Process the request normally
                    log.info(f"OAuth completed for message {token}. Processing request.")
                    # Control continues to the normal processing code below
                else:
                    # OAuth is still required
                    return JSONResponse(
                        status_code=401,
                        content={
                            "detail": "OAuth authorization still required. Please complete OAuth authentication first.",
                            "error_code": "OAUTH_REQUIRED",
                        },
                    )

            # Convert empty-string UUIDs to None so pydantic validation passes
            for field in ["project_id", "workspace_id", "chat_id"]:
                if field in raw_data and raw_data[field] == "":
                    raw_data[field] = None
            raw_data["user_id"] = user_id
            queued_request = ChatRequest.parse_obj(raw_data)

        except Exception as e:
            log.error(f"Malformed execution_data for token {token}: {e!s}")
            return JSONResponse(status_code=500, content={"detail": "Corrupted queued request"})

        # Consume the queue entry so the token is single-use (for normal flow)
        await db.delete(flow_step)
        await db.commit()

        # Pass the token/message_id forward so downstream processing reuses the same Message row
        try:
            queued_request.context["token_id"] = str(token)
        except Exception as e:
            log.warning(f"Failed to attach token_id to queued request context: {e!s}")

        # Delegate to existing create_response_stream for streaming
        return await create_response_stream(data=queued_request, current_user=current_user)
