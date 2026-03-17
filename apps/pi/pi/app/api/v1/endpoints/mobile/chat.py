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

# pi/app/api/v1/endpoints/mobile/chat.py
import asyncio
import contextlib
import json
import uuid
from typing import Any
from typing import AsyncGenerator
from typing import Coroutine
from typing import Dict
from typing import Optional
from typing import Union
from typing import cast

from fastapi import APIRouter
from fastapi import Depends
from fastapi.responses import JSONResponse
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import UUID4
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.api.dependencies import jwt_schema
from pi.app.api.dependencies import validate_jwt_token
from pi.app.api.v1.endpoints._sse import normalize_error_chunk
from pi.app.api.v1.endpoints._sse import sse_done
from pi.app.api.v1.endpoints._sse import sse_event
from pi.app.schemas.mobile.chat import ChatFeedbackMobile
from pi.app.schemas.mobile.chat import ChatRequestMobile
from pi.app.schemas.mobile.chat import ChatSearchResponseMobile
from pi.app.schemas.mobile.chat import ChatStartResponseMobile
from pi.app.schemas.mobile.chat import ChatSuggestionMobile
from pi.app.schemas.mobile.chat import ChatSuggestionTemplateMobile
from pi.app.schemas.mobile.chat import DeleteChatRequestMobile
from pi.app.schemas.mobile.chat import FavoriteChatRequestMobile
from pi.app.schemas.mobile.chat import GetThreadsMobile
from pi.app.schemas.mobile.chat import ModelsResponseMobile
from pi.app.schemas.mobile.chat import RenameChatRequestMobile
from pi.app.schemas.mobile.chat import TitleRequestMobile
from pi.app.schemas.mobile.chat import UnfavoriteChatRequestMobile
from pi.app.utils.background_tasks import schedule_chat_deletion
from pi.app.utils.background_tasks import schedule_chat_rename
from pi.app.utils.background_tasks import schedule_chat_search_upsert
from pi.app.utils.exceptions import SQLGenerationError
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.core.db.plane_pi.lifecycle import get_streaming_db_session
from pi.services.chat.chat import PlaneChatBot
from pi.services.chat.helpers.tool_utils import format_clarification_as_text
from pi.services.chat.search import ChatSearchService
from pi.services.chat.templates import tiles_factory
from pi.services.retrievers.pg_store import favorite_chat
from pi.services.retrievers.pg_store import get_active_models
from pi.services.retrievers.pg_store import get_chat_messages
from pi.services.retrievers.pg_store import get_favorite_chats
from pi.services.retrievers.pg_store import get_user_chat_threads
from pi.services.retrievers.pg_store import rename_chat_title
from pi.services.retrievers.pg_store import retrieve_chat_history
from pi.services.retrievers.pg_store import soft_delete_chat
from pi.services.retrievers.pg_store import unfavorite_chat
from pi.services.retrievers.pg_store import update_message_feedback

log = logger.getChild("v1/mobile/chat")
mobile_router = APIRouter()


@mobile_router.post("/get-answer/")
async def get_answer(
    data: ChatRequestMobile,
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
    db: AsyncSession = Depends(get_async_session),
):
    try:
        await validate_jwt_token(token)
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    # Pre-validate required fields
    if data.workspace_in_context and not (data.workspace_id or data.project_id):
        # currently mobile not providing focus. so, set project_id as None
        data.project_id = None
        return JSONResponse(status_code=400, content={"detail": "Either project_id or workspace_id must be provided"})

    # Constructing query_id to insert into index, can be removed after shiting to web flow (queue_answer, stream_answer)
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

                            # manage the chunk the old way
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
                                        yield f"event: delta\ndata: {chunk["chunk"]}"
                                    else:
                                        # Wrap the dict in chunk envelope
                                        payload: Dict[str, Any] = {"chunk": chunk}
                                        yield f"event: delta\ndata: {chunk["chunk"]}"
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


@mobile_router.post("/stream-answer/")
async def get_answer_stream_json(
    data: ChatRequestMobile,
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Stream AI response with proper JSON-wrapped SSE format for mobile clients.

    This endpoint provides the same streaming functionality as /get-answer/ but with
    consistent JSON-wrapped Server-Sent Events (SSE) format, similar to the web v1/v2 endpoints.

    Features:
    - Authenticates via JWT token
    - Streams responses in real-time using SSE
    - All data is properly JSON-wrapped
    - Handles reasoning, actions, clarifications, and errors
    - Emits heartbeats during long-running operations
    - Schedules background tasks for search indexing

    Event Types:
        - reasoning: AI thinking process (JSON with header/content)
        - actions: Planned actions data (JSON)
        - delta: Content chunks (JSON with chunk field)
        - cta_available: Call-to-action (JSON)
        - error: Error messages (JSON)
        - done: Stream completion (JSON)

    Args:
        data: ChatRequestMobile containing query, workspace, and chat context
        token: JWT authentication token
        db: Database session

    Returns:
        StreamingResponse with text/event-stream media type

    Example SSE Events:
        event: delta
        data: {"chunk": "Hello"}

        event: reasoning
        data: {"header": "Thinking...", "content": "Processing your request"}

        event: actions
        data: {"message_id": "...", "artifact_id": "...", "actions": [...]}

        event: done
        data: {"done": true}
    """
    try:
        await validate_jwt_token(token)
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    # Pre-validate required fields
    if data.workspace_in_context and not (data.workspace_id or data.project_id):
        # currently mobile not providing focus. so, set project_id as None
        data.project_id = None
        return JSONResponse(status_code=400, content={"detail": "Either project_id or workspace_id must be provided"})

    # Constructing query_id to insert into index
    query_id = uuid.uuid4()
    data.context["token_id"] = str(query_id)

    llm = data.llm
    log.info(f"Processing mobile stream JSON request for chat_id={data.chat_id}, llm={llm}")
    chatbot = PlaneChatBot(llm=llm)

    async def stream_response() -> AsyncGenerator[str, None]:
        token_id = None
        try:
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

                # Single unified call; internal routing happens in chat service
                base_iter = chatbot.process_chat_stream(data, db=stream_db)
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
                            payload: Dict[str, Any] = {"header": "⏳ Still working...\n\n", "content": ""}
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
                            normalized_error = normalize_error_chunk(chunk) if isinstance(chunk, str) else None
                            if normalized_error:
                                yield normalized_error
                                next_chunk_task = asyncio.create_task(cast(Coroutine[None, None, Union[str, Dict[str, Any]]], base_iter.__anext__()))
                                continue
                            # change point: "πspecial reasoning blockπ:
                            # handle the new json string format of reasoning blocks. It is a json string with header and content.
                            # add a condition to check if the chunk is a json string with header and content.
                            if isinstance(chunk, dict):
                                if "chunk_type" in chunk and chunk["chunk_type"] == "reasoning":
                                    payload = {"header": chunk["header"], "content": chunk["content"]}
                                    yield f"event: reasoning\ndata: {json.dumps(payload)}\n\n"
                                    # for backward compatibility, we also need to yield the chunk as a string
                                    # bwc_payload = {"reasoning": f"{chunk["header"]}\n\n{chunk["content"]}\n\n"}
                                    # yield f"event: reasoning\ndata: {json.dumps(bwc_payload)}\n\n"
                                else:
                                    log.warning(f"ChatID: {data.chat_id} - Chunk is not a json string: {chunk}")
                                    payload = {"chunk": chunk}
                                    yield f"event: delta\ndata: {json.dumps(payload)}\n\n"
                            elif isinstance(chunk, str) and chunk.startswith("πspecial actions blockπ: "):
                                actions_content = chunk.replace("πspecial actions blockπ: ", "")
                                try:
                                    actions_data = json.loads(actions_content)
                                    yield f"event: actions\ndata: {json.dumps(actions_data)}\n\n"
                                except json.JSONDecodeError:
                                    log.warning(f"Failed to parse actions JSON: {actions_content}")
                                    payload = {"chunk": chunk}
                                    yield f"event: delta\ndata: {json.dumps(payload)}\n\n"
                            elif isinstance(chunk, str) and chunk.startswith("πspecial clarification blockπ: "):
                                clarification_content = chunk.replace("πspecial clarification blockπ: ", "")
                                try:
                                    clarification_data = json.loads(clarification_content)
                                    log.debug(f"ChatID: {data.chat_id} - Clarification data received in the endpoint: {clarification_data}")
                                    formatted_text = format_clarification_as_text(clarification_data)
                                    log.debug(f"ChatID: {data.chat_id} - Clarification formatted text: {formatted_text}")
                                    payload = {"chunk": formatted_text}
                                    yield f"event: delta\ndata: {json.dumps(payload)}\n\n"
                                except json.JSONDecodeError:
                                    log.warning(f"Failed to parse clarification JSON: {clarification_content}")
                                    payload = {
                                        "chunk": "I'm sorry, I can't understand your request in your workspace context. Can you be more specific?"
                                    }
                                    yield f"event: delta\ndata: {json.dumps(payload)}\n\n"
                            else:
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


@mobile_router.delete("/delete-chat/")
async def delete_chat(
    data: DeleteChatRequestMobile,
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    try:
        await validate_jwt_token(token)
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    result = await soft_delete_chat(chat_id=data.chat_id, db=db)

    # Schedule Celery task to mark chat as deleted in search index
    schedule_chat_deletion(str(data.chat_id))

    # The soft_delete_chat function always returns a tuple of (status_code, content)
    status_code, _ = result
    if status_code == 200:
        return JSONResponse(status_code=200, content={"detail": True})
    else:
        return JSONResponse(status_code=status_code, content={"detail": False})


@mobile_router.post("/feedback/")
async def handle_feedback(
    feedback_data: ChatFeedbackMobile,
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    try:
        # Get user_id from JWT
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    result = await update_message_feedback(
        chat_id=feedback_data.chat_id,
        message_index=feedback_data.message_index,
        feedback_value=feedback_data.feedback.value,
        user_id=user_id,
        db=db,
        feedback_message=feedback_data.feedback_message,
    )

    # The update_message_feedback function always returns a tuple of (status_code, content)
    status_code, _ = result
    if status_code == 200:
        return JSONResponse(status_code=200, content={"detail": True})
    else:
        return JSONResponse(status_code=status_code, content={"detail": False})


@mobile_router.post("/generate-title/")
async def get_title(
    data: TitleRequestMobile, token: HTTPAuthorizationCredentials = Depends(jwt_schema), db: AsyncSession = Depends(get_async_session)
):
    try:
        await validate_jwt_token(token)
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})
    if not data.chat_id:
        return JSONResponse(status_code=400, content={"detail": "chat_id is required"})

    try:
        # Get messages for this chat using the utility function
        messages = await get_chat_messages(chat_id=data.chat_id, db=db)

        # Check if messages is a tuple (error case)
        if isinstance(messages, tuple) and len(messages) == 2:
            status_code, content = messages
            return JSONResponse(status_code=status_code, content=content)

        chatbot = PlaneChatBot()
        title = await chatbot.get_title(chat_id=data.chat_id, messages=messages, db=db)

        return JSONResponse(content={"title": title})
    except Exception as e:
        log.error(f"Error generating title: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@mobile_router.post("/get-user-threads/")
async def get_user_threads(
    data: GetThreadsMobile, token: HTTPAuthorizationCredentials = Depends(jwt_schema), db: AsyncSession = Depends(get_async_session)
):
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    results = await get_user_chat_threads(user_id=user_id, workspace_id=data.workspace_id, db=db, is_project_chat=data.is_project_chat)

    # Check if results is a tuple (error case)
    if isinstance(results, tuple) and len(results) == 2:
        status_code, content = results
        return JSONResponse(status_code=status_code, content=content)

    # Success case
    return JSONResponse(content={"results": results})


@mobile_router.post("/get-chat-history/")
async def get_chat_history(
    data: TitleRequestMobile,
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
    db: AsyncSession = Depends(get_async_session),
):
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})
    try:
        results = await retrieve_chat_history(
            chat_id=data.chat_id,
            db=db,
            user_id=user_id,
        )
        error_type = results.get("error")
        if error_type == "not_found":
            return JSONResponse(status_code=404, content={"detail": results["detail"]})
        elif error_type == "unauthorized":
            return JSONResponse(status_code=403, content={"detail": results["detail"]})

        return JSONResponse(
            content={
                "results": {
                    "title": results["title"],
                    "dialogue": results["dialogue"],
                    "llm": results["llm"],
                    "feedback": results["feedback"],
                    "reasoning": results.get("reasoning", ""),
                    "is_focus_enabled": results.get("is_focus_enabled", False),
                    "is_websearch_enabled": results.get("is_websearch_enabled", False),
                    "focus_entity_type": results.get("focus_entity_type", None),
                    "focus_entity_id": results.get("focus_entity_id", None),
                    "focus_project_id": results.get("focus_project_id", None),
                    "focus_workspace_id": results.get("focus_workspace_id", None),
                    "mode": results.get("mode", "ask"),
                }
            }
        )
    except Exception as e:
        log.error(f"Error retrieving chat history: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@mobile_router.post("/get-chat-history-object/")
async def get_chat_history_object(
    data: TitleRequestMobile,
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
    db: AsyncSession = Depends(get_async_session),
):
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})
    try:
        chat_id = data.chat_id
        log.info(f"Mobile chat history object request received for chat_id: {chat_id}")
        results = await retrieve_chat_history(
            chat_id=chat_id,
            dialogue_object=True,
            db=db,
            user_id=user_id,
        )
        error_type = results.get("error")
        if error_type == "not_found":
            return JSONResponse(status_code=404, content={"detail": results["detail"]})
        elif error_type == "unauthorized":
            return JSONResponse(status_code=403, content={"detail": results["detail"]})

        return JSONResponse(
            content={
                "results": {
                    "title": results["title"],
                    "dialogue": results["dialogue"],
                    "llm": results["llm"],
                    "feedback": results["feedback"],
                    "reasoning": results.get("reasoning", ""),
                    "is_focus_enabled": results.get("is_focus_enabled", False),
                    "is_websearch_enabled": results.get("is_websearch_enabled", False),
                    "focus_entity_type": results.get("focus_entity_type", None),
                    "focus_entity_id": results.get("focus_entity_id", None),
                    "focus_project_id": results.get("focus_project_id", None),
                    "focus_workspace_id": results.get("focus_workspace_id", None),
                    "mode": results.get("mode", "ask"),
                }
            }
        )
    except Exception as e:
        log.error(f"Error retrieving chat history object: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@mobile_router.get("/get-models/", response_model=ModelsResponseMobile)
async def get_model_list(
    workspace_id: Optional[UUID4] = None,
    workspace_slug: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    # Convert user_id to string and provide default workspace_slug if None
    models_list = await get_active_models(db=db, user_id=str(user_id), workspace_slug=workspace_slug or "")

    # Check if models_list is a tuple (error case)
    if isinstance(models_list, tuple) and len(models_list) == 2:
        status_code, content = models_list
        return JSONResponse(status_code=status_code, content=content)

    # Success case
    model_dict = {"models": models_list}
    return JSONResponse(content=model_dict)


@mobile_router.get("/get-templates/", response_model=ChatSuggestionTemplateMobile)
async def get_chat_template_suggestion(
    workspace_id: Optional[UUID4] = None, workspace_slug: Optional[str] = None, token: HTTPAuthorizationCredentials = Depends(jwt_schema)
):
    try:
        await validate_jwt_token(token)
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    try:
        suggestions = tiles_factory()
        return ChatSuggestionTemplateMobile(templates=suggestions)
    except Exception as e:
        log.error(f"Error getting templates: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@mobile_router.post("/get-placeholder/", response_model=ChatStartResponseMobile)
async def start_chat(data: ChatSuggestionMobile, token: HTTPAuthorizationCredentials = Depends(jwt_schema)):
    try:
        await validate_jwt_token(token)
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    try:
        # Just return the template text as the placeholder - no database queries needed
        placeholder = data.text or "How can I assist you with your work today?"
        return ChatStartResponseMobile(placeholder=placeholder)
    except Exception as e:
        log.error(f"An unexpected error occurred: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@mobile_router.post("/favorite-chat/")
async def favorite_user_chat(
    data: FavoriteChatRequestMobile, db: AsyncSession = Depends(get_async_session), token: HTTPAuthorizationCredentials = Depends(jwt_schema)
):
    try:
        await validate_jwt_token(token)
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    result = await favorite_chat(chat_id=data.chat_id, db=db)

    status_code, _ = result
    if status_code == 200:
        return JSONResponse(status_code=200, content={"detail": True})
    else:
        return JSONResponse(status_code=status_code, content={"detail": False})


@mobile_router.post("/unfavorite-chat/")
async def unfavorite_user_chat(
    data: UnfavoriteChatRequestMobile, db: AsyncSession = Depends(get_async_session), token: HTTPAuthorizationCredentials = Depends(jwt_schema)
):
    try:
        await validate_jwt_token(token)
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    result = await unfavorite_chat(chat_id=data.chat_id, db=db)

    # The unfavorite_chat function always returns a tuple of (status_code, content)
    status_code, _ = result
    if status_code == 200:
        return JSONResponse(status_code=200, content={"detail": True})
    else:
        return JSONResponse(status_code=status_code, content={"detail": False})


@mobile_router.get("/get-favorite-chats/")
async def get_user_favorite_chats(
    workspace_id: Optional[UUID4] = None,
    workspace_slug: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    try:
        # Get user_id from JWT
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    result = await get_favorite_chats(user_id=user_id, db=db, workspace_id=workspace_id)

    # The get_favorite_chats function always returns a tuple of (status_code, content)
    status_code, content = result
    return JSONResponse(status_code=status_code, content=content)


@mobile_router.post("/rename-chat/")
async def rename_chat(
    data: RenameChatRequestMobile,
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    try:
        await validate_jwt_token(token)
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    result = await rename_chat_title(chat_id=data.chat_id, new_title=data.title, db=db)

    # Schedule Celery task to update chat title in search index
    schedule_chat_rename(str(data.chat_id), data.title)

    status_code, _ = result
    if status_code == 200:
        return JSONResponse(status_code=200, content={"detail": True})
    else:
        return JSONResponse(status_code=status_code, content={"detail": False})


from fastapi import Query


@mobile_router.get("/search/", response_model=ChatSearchResponseMobile)
async def search_chats(
    query: str = Query(..., description="Search query text"),
    workspace_id: UUID4 = Query(..., description="Workspace ID to filter by"),
    is_project_chat: Optional[bool] = Query(False, description="Filter by project chat flag"),
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
    db: AsyncSession = Depends(get_async_session),
):
    """Search chats by title and message content with cursor-based pagination."""
    try:
        # Get user_id from JWT
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid JWT"})

    # Validate query parameters
    if not query or not query.strip():
        return JSONResponse(status_code=400, content={"detail": "Search query cannot be empty"})

    try:
        # Initialize search service
        search_service = ChatSearchService()

        try:
            results, pagination = await search_service.search_chats(
                query=query.strip(),
                user_id=user_id,
                workspace_id=workspace_id,
                is_project_chat=is_project_chat,
                cursor=cursor,
                per_page=30,  # Hardcoded for performance
            )

            # Prepare response - use model_dump with mode='json' to handle UUID serialization
            response_data = pagination.model_dump(mode="json")
            response_data["results"] = [result.model_dump(mode="json") for result in results]

            return JSONResponse(content=response_data)

        finally:
            # Ensure search service is properly closed
            await search_service.close()

    except Exception as e:
        log.error(f"Error searching chats: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})
