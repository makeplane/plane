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
from typing import Any
from typing import AsyncGenerator
from typing import Coroutine
from typing import Dict
from typing import Optional
from typing import Union
from typing import cast
from urllib.parse import urlparse
from uuid import UUID
from uuid import uuid4

from fastapi import APIRouter
from fastapi import Depends
from fastapi import Query
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
from pi.app.api.v1.helpers.execution import chosen_llm
from pi.app.api.v1.helpers.plane_sql_queries import resolve_workspace_id_from_project_id
from pi.app.models.enums import FlowStepType
from pi.app.models.enums import UserTypeChoices
from pi.app.models.message import MessageFlowStep
from pi.app.schemas.chat import ActionBatchExecutionRequest
from pi.app.schemas.chat import ArtifactData
from pi.app.schemas.chat import ChatAuthCheckResponse
from pi.app.schemas.chat import ChatFeedback
from pi.app.schemas.chat import ChatInitializationRequest
from pi.app.schemas.chat import ChatInitResponse
from pi.app.schemas.chat import ChatRequest
from pi.app.schemas.chat import ChatSearchResponse
from pi.app.schemas.chat import ChatSuggestionTemplate
from pi.app.schemas.chat import DeleteChatRequest
from pi.app.schemas.chat import FavoriteChatRequest
from pi.app.schemas.chat import GetThreadsPaginatedResponse
from pi.app.schemas.chat import ModelsResponse
from pi.app.schemas.chat import PresetQuestionsRequest
from pi.app.schemas.chat import PresetQuestionsResponse
from pi.app.schemas.chat import RenameChatRequest
from pi.app.schemas.chat import TitleRequest
from pi.app.schemas.chat import UnfavoriteChatRequest
from pi.app.utils import validate_chat_initialization
from pi.app.utils import validate_chat_request
from pi.app.utils.background_tasks import schedule_chat_deletion
from pi.app.utils.background_tasks import schedule_chat_rename
from pi.app.utils.background_tasks import schedule_chat_search_upsert
from pi.app.utils.exceptions import SQLGenerationError
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.core.db.plane_pi.lifecycle import get_streaming_db_session
from pi.services.actions.oauth_service import PlaneOAuthService
from pi.services.chat.action_executor import BuildModeToolExecutor
from pi.services.chat.chat import PlaneChatBot
from pi.services.chat.helpers.tool_utils import format_clarification_as_text
from pi.services.chat.search import ChatSearchService
from pi.services.chat.templates import tiles_factory
from pi.services.chat.utils import initialize_new_chat
from pi.services.chat.utils import resolve_workspace_slug
from pi.services.retrievers.pg_store import favorite_chat
from pi.services.retrievers.pg_store import get_active_models
from pi.services.retrievers.pg_store import get_chat_messages
from pi.services.retrievers.pg_store import get_favorite_chats
from pi.services.retrievers.pg_store import get_user_chat_threads
from pi.services.retrievers.pg_store import get_user_chat_threads_paginated
from pi.services.retrievers.pg_store import rename_chat_title
from pi.services.retrievers.pg_store import retrieve_chat_history
from pi.services.retrievers.pg_store import soft_delete_chat
from pi.services.retrievers.pg_store import unfavorite_chat
from pi.services.retrievers.pg_store import update_message_feedback
from pi.services.retrievers.pg_store.message import get_message_by_id
from pi.services.retrievers.pg_store.message import mark_assistant_response_as_replaced
from pi.services.retrievers.pg_store.message import reconstruct_chat_request_from_message
from pi.services.retrievers.pg_store.message import upsert_message
from pi.services.retrievers.pg_store.message import upsert_message_flow_steps

log = logger.getChild("v1/chat")
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


@router.get("/start/", response_model=ChatInitResponse)
async def chat_start(
    workspace_id: UUID = Query(..., description="Workspace ID to check authorization for"),
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """
    Start/Bootstrap Pi chat - first API call when starting a chat session.
    Checks OAuth authorization status and returns chat templates.

    Usage: GET /api/v1/chat/start/?workspace_id=<uuid>

    If authorized: returns is_authorized=true with full templates list
    If not authorized: returns is_authorized=false with empty templates list
    """

    try:
        user_id = current_user.id
        oauth_service = PlaneOAuthService()

        # Check if user has valid OAuth token for workspace
        access_token = await oauth_service.get_valid_token(db=db, user_id=user_id, workspace_id=workspace_id)

        if access_token:
            # User is authorized - get templates
            templates = tiles_factory()
            return ChatInitResponse(is_authorized=True, templates=templates, oauth_url=None)
        else:
            # User is not authorized - return empty templates with OAuth URL
            from pi.services.actions.oauth_url_encoder import OAuthUrlEncoder

            redirect = urlparse(settings.plane_api.OAUTH_REDIRECT_URI)
            base_url = f"{redirect.scheme}://{redirect.netloc}"

            # Include BASE_PATH if configured
            base_path = settings.plane_api.BASE_PATH or ""
            if base_path and not base_path.startswith("/"):
                base_path = f"/{base_path}"
            base_path = base_path.rstrip("/")

            # Build OAuth parameters (only user_id and workspace_id)
            oauth_params = {
                "user_id": str(user_id),
                "workspace_id": str(workspace_id),
            }

            # Generate clean, encrypted OAuth URL
            oauth_encoder = OAuthUrlEncoder()
            oauth_url = oauth_encoder.generate_clean_oauth_url(f"{base_url}{base_path}", oauth_params)

            return ChatInitResponse(is_authorized=False, templates=[], oauth_url=oauth_url)

    except Exception as e:
        log.error(f"Error in chat start: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Failed to initialize chat"})


@router.get("/start/auth-check/", response_model=ChatAuthCheckResponse)
async def chat_auth_check(
    workspace_id: UUID = Query(..., description="Workspace ID to check authorization for"),
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """
    Check user authentication and OAuth authorization status.
    This is the first endpoint to call when initializing a chat session.

    Usage: GET /api/v1/chat/start/auth-check/?workspace_id=<uuid>

    Returns:
        - is_authorized: true if user has valid OAuth token for workspace
        - oauth_url: OAuth authorization URL if not authorized (null if authorized)
    """

    try:
        user_id = current_user.id
        oauth_service = PlaneOAuthService()

        # Check if user has valid OAuth token for workspace
        access_token = await oauth_service.get_valid_token(db=db, user_id=user_id, workspace_id=workspace_id)

        if access_token:
            # User is authorized
            return ChatAuthCheckResponse(is_authorized=True, oauth_url=None)
        else:
            # User is not authorized - return OAuth URL
            from pi.services.actions.oauth_url_encoder import OAuthUrlEncoder

            redirect = urlparse(settings.plane_api.OAUTH_REDIRECT_URI)
            base_url = f"{redirect.scheme}://{redirect.netloc}"

            # Include BASE_PATH if configured
            base_path = settings.plane_api.BASE_PATH or ""
            if base_path and not base_path.startswith("/"):
                base_path = f"/{base_path}"
            base_path = base_path.rstrip("/")

            # Build OAuth parameters (only user_id and workspace_id)
            oauth_params = {
                "user_id": str(user_id),
                "workspace_id": str(workspace_id),
            }

            # Generate clean, encrypted OAuth URL
            oauth_encoder = OAuthUrlEncoder()
            oauth_url = oauth_encoder.generate_clean_oauth_url(f"{base_url}{base_path}", oauth_params)

            return ChatAuthCheckResponse(is_authorized=False, oauth_url=oauth_url)

    except Exception as e:
        log.error(f"Error in auth check: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Failed to check authorization"})


@router.post("/start/set-prompts/", response_model=PresetQuestionsResponse)
async def get_preset_questions(
    data: PresetQuestionsRequest,
    current_user=Depends(get_current_user),
):
    """
    Get contextual preset questions based on chat mode and entity context.
    Call this endpoint after successful auth check to get relevant preset questions.

    Usage: POST /api/v1/chat/start/set-prompts/

    Request body:
        - workspace_id: Workspace ID
        - mode: "ask" or "build"
        - entity_type: Optional focus entity type (workspace, project, cycle, module, etc.)
        - entity_id: Optional focus entity ID
        - project_id: Optional project ID

    Returns:
        - templates: List of contextual preset questions/templates
    """

    try:
        # TODO: Replace with actual context-aware preset question generation
        # For now, return dummy questions based on mode and context
        # dummy_templates = [
        #     {"text": f"Sample question for {data.chat_mode} mode in workspace {data.workspace_id}", "type": "general"},
        #     {"text": "What are my recent issues?", "type": "issues"},
        #     {"text": "Show me project updates", "type": "projects"},
        # ]

        # # Add context-specific questions if entity info is provided
        # if data.entity_type and data.entity_id:
        #     dummy_templates.append({
        #         "text": f"What's happening in this {data.entity_type}?",
        #         "type": data.entity_type,
        #     })

        # if data.project_id:
        #     dummy_templates.append({
        #         "text": "Show me tasks in this project",
        #         "type": "projects",
        #     })

        preset_questions = tiles_factory(
            entity_type=data.entity_type, entity_id=data.entity_id, mode=data.mode, workspace_id=data.workspace_id, project_id=data.project_id
        )

        return PresetQuestionsResponse(templates=preset_questions)

    except Exception as e:
        log.error(f"Error getting preset questions: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Failed to get preset questions"})


@router.post("/silo-app/answer/")
async def get_answer_for_silo_app(data: ChatRequest, request: Request, db: AsyncSession = Depends(get_async_session)):
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(status_code=401, content={"detail": "Missing Authorization header"})
        auth_response = await validate_plane_token(auth_header)
        access_token = auth_response.plane_token
    except Exception as e:
        log.error(f"Error validating plane token: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid Plane token"})

    # Use Claude if available, otherwise fall back to default model (e.g., custom LLM)
    has_claude_key = bool(settings.llm_config.CLAUDE_API_KEY and settings.llm_config.CLAUDE_API_KEY.strip())
    plane_apps_llm = "claude-sonnet-4-6" if has_claude_key else settings.llm_model.DEFAULT
    chatbot = PlaneChatBot(llm=plane_apps_llm, token=access_token)

    final_response = ""
    actions_data_list = []
    clarification_data = {}
    error_data = {}
    formatted_context: dict[str, Any] = {}
    response_type = "response"
    # listen to all the stream chunks, join the chunks and return the complete response
    # as json object
    async with get_streaming_db_session() as stream_db:
        data.mode = "build"  # type: ignore
        data.llm = plane_apps_llm  # type: ignore
        data.source = "app"  # type: ignore  # Enable app-specific features (structured response, URL injection)
        base_iter = chatbot.process_chat_stream(data, db=stream_db)
        async for chunk in base_iter:
            if isinstance(chunk, dict):
                # Currently only reasoning chunk is sent as dict.
                continue
            # Ignore all intermediate chunks
            if chunk.startswith("πspecial actions blockπ: "):
                response_type = "actions"
                action_data = json.loads(chunk.replace("πspecial actions blockπ: ", ""))
                actions_data_list.append(action_data)
            elif chunk.startswith("πspecial clarification blockπ: "):
                response_type = "clarification"
                clarification_data = json.loads(chunk.replace("πspecial clarification blockπ: ", ""))
            elif chunk.startswith("πspecial error blockπ: "):
                response_type = "error"
                error_data = json.loads(chunk.replace("πspecial error blockπ: ", ""))

            final_response += chunk

    # Handle error responses
    if response_type == "error":
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "message": error_data.get("message", "An unexpected error occurred. Please try again later."),
                "error_type": error_data.get("error_type", "execution_error"),
                "response_type": "error",
            },
        )

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

            # Store message_id from first action (all actions in same message should have same ID)
            if message_id is None:
                message_id = current_message_id

            # Convert artifact_id to UUID if it's a string
            if isinstance(artifact_id_raw, str):
                artifact_id = UUID(artifact_id_raw)
            elif isinstance(artifact_id_raw, UUID):
                artifact_id = artifact_id_raw
            else:
                return JSONResponse(status_code=400, content={"detail": "Invalid artifact_id format"})

            # Add this action's artifact to the list
            artifact_data_objects.append(ArtifactData(artifact_id=artifact_id, is_edited=False, action_data=actions_data))

        # Validate that all required IDs are present (not None)
        if workspace_id is None or chat_id is None or message_id is None:
            return JSONResponse(
                status_code=400,
                content={"detail": "Missing required fields: workspace_id, chat_id, or message_id cannot be None"},
            )

        # Execute batch actions using the service with ALL artifacts
        service = BuildModeToolExecutor(chatbot=PlaneChatBot(plane_apps_llm), db=db)
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

    # Parse JSON response for proper API format (avoid double-encoded JSON string)
    parsed_response: Union[str, Dict[str, Any], Any] = final_response
    if response_type == "response" and final_response:
        try:
            # Try to parse as JSON for structured app responses
            parsed_response = json.loads(final_response)
        except (json.JSONDecodeError, TypeError):
            # If not valid JSON, keep as string (backward compatible)
            parsed_response = {"text": final_response, "entities": []}

    return JSONResponse(
        status_code=200,
        content={
            "response": parsed_response,
            "actions_data": actions_data_list,
            "context": formatted_context,
            "response_type": response_type,
            "clarification_data": clarification_data,
        },
    )


@router.post("/slack/answer/")
async def get_answer_for_slack(data: ChatRequest, request: Request, db: AsyncSession = Depends(get_async_session)):
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(status_code=401, content={"detail": "Missing Authorization header"})
        auth_response = await validate_plane_token(auth_header)
        access_token = auth_response.plane_token
    except Exception as e:
        log.error(f"Error validating plane token: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid Plane token"})

    # Use Claude if available, otherwise fall back to default model (e.g., custom LLM)
    has_claude_key = bool(settings.llm_config.CLAUDE_API_KEY and settings.llm_config.CLAUDE_API_KEY.strip())
    slack_ai_llm = "claude-sonnet-4-6" if has_claude_key else settings.llm_model.DEFAULT
    chatbot = PlaneChatBot(llm=slack_ai_llm, token=access_token)

    final_response = ""
    actions_data_list = []
    clarification_data = {}
    formatted_context: dict[str, Any] = {}
    response_type = "response"

    # listen to all the stream chunks, join the chunks and return the complete response
    # as json object
    async with get_streaming_db_session() as stream_db:
        data.mode = "build"  # type: ignore
        data.llm = slack_ai_llm  # type: ignore
        base_iter = chatbot.process_chat_stream(data, db=stream_db)
        async for chunk in base_iter:
            if isinstance(chunk, dict):
                # Currently only reasoning chunk is sent as dict.
                continue
            # Ignore all intermediate chunks
            if chunk.startswith("πspecial actions blockπ: "):
                response_type = "actions"
                action_data = json.loads(chunk.replace("πspecial actions blockπ: ", ""))
                actions_data_list.append(action_data)
            elif chunk.startswith("πspecial clarification blockπ: "):
                response_type = "clarification"
                clarification_data = json.loads(chunk.replace("πspecial clarification blockπ: ", ""))
            final_response += chunk

    if actions_data_list:  # Changed: check if we have any actions collected
        # Validate required fields before creating ActionBatchExecutionRequest
        workspace_id = data.workspace_id
        chat_id = data.chat_id
        user_id = data.user_id

        # Convert all action blocks to ArtifactData objects
        artifact_data_objects = []
        message_id = None  # Will be set from first action (all should have same message_id)

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

            # Store message_id from first action (all actions in same message should have same ID)
            if message_id is None:
                message_id = current_message_id

            # Convert artifact_id to UUID if it's a string
            if isinstance(artifact_id_raw, str):
                artifact_id = UUID(artifact_id_raw)
            elif isinstance(artifact_id_raw, UUID):
                artifact_id = artifact_id_raw
            else:
                return JSONResponse(status_code=400, content={"detail": "Invalid artifact_id format"})

            # Add this action's artifact to the list
            artifact_data_objects.append(ArtifactData(artifact_id=artifact_id, is_edited=False, action_data=actions_data))

        # Validate that all required IDs are present (not None)
        if workspace_id is None or chat_id is None or message_id is None:
            return JSONResponse(
                status_code=400,
                content={"detail": "Missing required fields: workspace_id, chat_id, or message_id cannot be None"},
            )

        # Execute batch actions using the service with ALL artifacts
        service = BuildModeToolExecutor(chatbot=PlaneChatBot(slack_ai_llm), db=db)
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


@router.post("/get-answer/")
async def get_answer(data: ChatRequest, current_user=Depends(get_current_user)):
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


@router.delete("/delete-chat/")
async def delete_chat(data: DeleteChatRequest, db: AsyncSession = Depends(get_async_session), current_user=Depends(get_current_user)):
    result = await soft_delete_chat(chat_id=data.chat_id, db=db)

    # Schedule Celery task to mark chat as deleted in search index
    schedule_chat_deletion(str(data.chat_id))

    # The soft_delete_chat function always returns a tuple of (status_code, content)
    status_code, content = result
    return JSONResponse(status_code=status_code, content=content)


@router.post("/feedback/")
async def handle_feedback(
    feedback_data: ChatFeedback,
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    user_id = current_user.id

    result = await update_message_feedback(
        chat_id=feedback_data.chat_id,
        message_index=feedback_data.message_index,
        feedback_value=feedback_data.feedback.value,
        user_id=user_id,
        db=db,
        feedback_message=feedback_data.feedback_message,
    )

    # The update_message_feedback function always returns a tuple of (status_code, content)
    status_code, content = result
    return JSONResponse(status_code=status_code, content=content)


@router.post("/generate-title/")
async def get_title(data: TitleRequest, db: AsyncSession = Depends(get_async_session), current_user=Depends(get_current_user)):
    if not data.chat_id:
        log.warning("Request missing chat_id")
        return JSONResponse(status_code=400, content={"detail": "chat_id is required"})

    try:
        # Get messages for this chat using the utility function
        messages = await get_chat_messages(chat_id=data.chat_id, db=db)

        # Check if messages is a tuple (error case)
        if isinstance(messages, tuple) and len(messages) == 2:
            status_code, content = messages
            return JSONResponse(status_code=status_code, content=content)

        # Generate or get existing title using PlaneChatBot
        chatbot = PlaneChatBot()
        title = await chatbot.get_title(chat_id=data.chat_id, messages=messages, db=db)

        return JSONResponse(content={"title": title})
    except Exception as e:
        log.error(f"An unexpected error occurred: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.get("/get-recent-user-threads/")
async def get_recent_user_threads(
    workspace_id: Optional[UUID4] = None,
    workspace_slug: Optional[str] = None,
    is_project_chat: Optional[bool] = False,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    user_id = current_user.id

    results = await get_user_chat_threads(user_id=user_id, db=db, workspace_id=workspace_id, is_project_chat=is_project_chat, is_latest=True)

    # Check if results is a tuple (error case)
    if isinstance(results, tuple) and len(results) == 2:
        status_code_val, content = results  # type: ignore[assignment]
        status_code_int: int = int(status_code_val) if isinstance(status_code_val, int) else 500
        return JSONResponse(status_code=status_code_int, content=content)

    # Success case
    return JSONResponse(content={"results": results})


@router.get("/get-chat-history-object/")
async def get_chat_history_object(
    chat_id: UUID4,
    workspace_id: Optional[UUID4] = None,
    workspace_slug: Optional[str] = None,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    try:
        user_id = current_user.id
        log.info(f"chat history retrieve request received for chat_id: {chat_id}")
        results: dict[str, Any] = await retrieve_chat_history(
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

    except ValueError as ve:
        log.error(f"An error occurred during retrieval: {ve!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

    except Exception as e:
        log.error(f"An error occurred during retrieval: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.get("/get-models/", response_model=ModelsResponse)
async def get_model_list(
    workspace_id: Optional[UUID4] = None,
    workspace_slug: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    user_id = current_user.id

    if not workspace_slug:
        if workspace_id:
            resolved_workspace_slug = await resolve_workspace_slug(workspace_id, workspace_slug)
        else:
            log.warning("get-models: No workspace_id to resolve workspace_slug from")
            resolved_workspace_slug = None
    else:
        resolved_workspace_slug = workspace_slug
    # Convert user_id to string and provide default workspace_slug if None
    models_list = await get_active_models(db=db, user_id=str(user_id), workspace_slug=resolved_workspace_slug or "")

    # Check if models_list is a tuple (error case)
    if isinstance(models_list, tuple) and len(models_list) == 2:
        status_code, content = models_list
        return JSONResponse(status_code=status_code, content=content)

    # Success case
    model_dict = {"models": models_list}
    return JSONResponse(content=model_dict)


@router.get("/get-templates/", response_model=ChatSuggestionTemplate)
async def get_chat_template_suggestion(
    workspace_id: Optional[UUID4] = None, workspace_slug: Optional[str] = None, current_user=Depends(get_current_user)
):
    try:
        suggestions = tiles_factory()
        return ChatSuggestionTemplate(templates=suggestions)
    except Exception as e:
        log.error(f"An unexpected error occurred: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.post("/initialize-chat/")
async def initialize_chat(data: ChatInitializationRequest, db: AsyncSession = Depends(get_async_session), current_user=Depends(get_current_user)):
    """Initialize a new chat and return the chat_id immediately."""
    user_id = current_user.id

    # Validate request data
    validation_error = validate_chat_initialization(data)
    if validation_error:
        return JSONResponse(status_code=validation_error["status_code"], content={"detail": validation_error["detail"]})

    # Initialize chat using standalone function (workspace details backfilled later in queue_answer)
    result = await initialize_new_chat(
        user_id=user_id,
        db=db,
        chat_id=data.chat_id,
        is_project_chat=data.is_project_chat,
        workspace_in_context=data.workspace_in_context,
        workspace_id=data.workspace_id,
    )

    # Handle result from service layer
    if result["success"]:
        return JSONResponse(content={"chat_id": result["chat_id"]})
    else:
        # Map service error codes to HTTP status codes
        status_code = 500  # default
        if result.get("error_code") == "CHAT_EXISTS":
            status_code = 409
        elif result.get("error_code") == "CHAT_CREATION_FAILED":
            status_code = 500
        elif result.get("error_code") == "UNEXPECTED_ERROR":
            status_code = 500

        return JSONResponse(status_code=status_code, content={"detail": result["message"]})


@router.post("/favorite-chat/")
async def favorite_user_chat(data: FavoriteChatRequest, db: AsyncSession = Depends(get_async_session), current_user=Depends(get_current_user)):
    result = await favorite_chat(chat_id=data.chat_id, db=db)

    status_code, content = result
    return JSONResponse(status_code=status_code, content=content)


@router.post("/unfavorite-chat/")
async def unfavorite_user_chat(data: UnfavoriteChatRequest, db: AsyncSession = Depends(get_async_session), current_user=Depends(get_current_user)):
    result = await unfavorite_chat(chat_id=data.chat_id, db=db)

    # The unfavorite_chat function always returns a tuple of (status_code, content)
    status_code, content = result
    return JSONResponse(status_code=status_code, content=content)


@router.get("/get-favorite-chats/")
async def get_user_favorite_chats(
    workspace_id: Optional[UUID4] = None,
    workspace_slug: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    user_id = current_user.id

    result = await get_favorite_chats(user_id=user_id, db=db, workspace_id=workspace_id)

    # The get_favorite_chats function always returns a tuple of (status_code, content)
    status_code, content = result
    return JSONResponse(status_code=status_code, content=content)


@router.post("/rename-chat/")
async def rename_chat(data: RenameChatRequest, db: AsyncSession = Depends(get_async_session), current_user=Depends(get_current_user)):
    result = await rename_chat_title(chat_id=data.chat_id, new_title=data.title, db=db)

    # Schedule Celery task to update chat title in search index
    schedule_chat_rename(str(data.chat_id), data.title)

    status_code, content = result
    return JSONResponse(status_code=status_code, content=content)


# New paginated endpoints for web
@router.get("/get-user-threads/", response_model=GetThreadsPaginatedResponse)
async def get_user_threads(
    workspace_id: Optional[UUID4] = None,
    workspace_slug: Optional[str] = None,
    is_project_chat: Optional[bool] = False,
    cursor: Optional[str] = None,
    per_page: int = Query(default=30, ge=1, le=100),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Get user chat threads with cursor-based pagination for web interface."""
    user_id = current_user.id

    results = await get_user_chat_threads_paginated(
        user_id=user_id, db=db, workspace_id=workspace_id, is_project_chat=is_project_chat, cursor=cursor, per_page=per_page
    )

    # Check if results is a tuple (error case)
    if isinstance(results, tuple) and len(results) == 2:
        # Check if it's an error tuple (status_code, error_dict) or success tuple (results, pagination)
        if isinstance(results[0], int):
            status_code_val, content = results
            status_code: int = status_code_val  # type: ignore[assignment]
            return JSONResponse(status_code=status_code, content=content)
        else:
            # Success case - (results, pagination_response)
            chat_results, pagination_response = results
            response_data = pagination_response.model_dump()  # type: ignore[attr-defined]
            response_data["results"] = chat_results
            return JSONResponse(content=response_data)


@router.post("/queue-answer/")
async def queue_answer(data: ChatRequest, db: AsyncSession = Depends(get_async_session), current_user=Depends(get_current_user)):
    """First phase of two-step streaming flow.
    Persists the ChatRequest payload and returns a one-time stream token.
    The token is simply the UUID of a freshly created *user* Message row so we
    don't need a new table.  The rest of the ChatRequest fields are stored in
    a MessageFlowStep (tool_name="QUEUE", step_order=0) until the client
    later redeems the token via /stream-answer/{token}."""

    validation_error = validate_chat_request(data)
    if validation_error:
        return JSONResponse(status_code=validation_error["status_code"], content={"detail": validation_error["detail"]})

    # 1. Create a new USER message that will serve as the token
    if data.chat_id is None:
        return JSONResponse(status_code=400, content={"detail": "chat_id is required. Call /initialize-chat/ first."})

    ## need to resolve ws id and slug from project id if it's project chat

    if not data.workspace_id:
        if data.is_project_chat and data.project_id:
            log.info(f"Queue-answer: Resolving workspace_id from project_id: {data.project_id}")
            resolved_workspace_id = await resolve_workspace_id_from_project_id(str(data.project_id))
            # The DB may return an asyncpg UUID object. Convert safely to a standard uuid.UUID.
            workspace_id_to_use = UUID(str(resolved_workspace_id)) if resolved_workspace_id else None
            log.info(f"Queue-answer: Resolved workspace_id: {workspace_id_to_use}")
    else:
        workspace_id_to_use = data.workspace_id
    if not data.workspace_slug:
        if workspace_id_to_use:
            resolved_workspace_slug = await resolve_workspace_slug(workspace_id_to_use, data.workspace_slug)
        else:
            log.warning("Queue-answer: No workspace_id to resolve workspace_slug from")
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
        source=data.source or None,
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
    flow_res = await upsert_message_flow_steps(message_id=token_id, chat_id=data.chat_id, db=db, flow_steps=[flow_step_payload])

    if flow_res.get("message") != "success":
        return JSONResponse(status_code=500, content={"detail": "Failed to queue request"})

    # Backfill chat record with workspace details (after successful message creation)
    try:
        from sqlalchemy import select

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

    return {"stream_token": str(token_id)}


@router.get("/stream-answer/{token}")
async def stream_answer(token: UUID4, db: AsyncSession = Depends(get_async_session), current_user=Depends(get_current_user)):
    """Second phase of two-step flow.
    Looks up the queued ChatRequest by token (message_id), deletes the queue
    entry, and then re-uses the existing /get-answer/ logic to start the SSE
    stream via a pure GET endpoint.

    Also handles REGENERATE when called with an existing user message ID
    (no QUEUE flow step present)."""
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
        # Get the user message
        user_message = await get_message_by_id(db, token)

        if not user_message:
            log.warning(f"Message not found for token {token}")
            return JSONResponse(status_code=404, content={"detail": "Message not found"})

        # Mark old assistant response as replaced BEFORE generating new one
        # This ensures retrieve_chat_history() won't include it in context for new generation
        marked = await mark_assistant_response_as_replaced(db, user_message.id)
        if marked:
            log.info(f"Marked old assistant response(s) as replaced for message {token}")
        else:
            log.info(f"No existing assistant response found for message {token} (first generation or already replaced)")

        # Reconstruct ChatRequest from user message
        try:
            queued_request = await reconstruct_chat_request_from_message(db, user_message, user_id)
        except Exception as e:
            log.error(f"Error reconstructing ChatRequest from message {token}: {e}")
            return JSONResponse(status_code=500, content={"detail": "Failed to reconstruct request"})

        # Pass token_id so new assistant message reuses same user message as parent
        try:
            queued_request.context["token_id"] = str(token)
        except Exception as e:
            log.warning(f"Failed to attach token_id to regenerate request context: {e!s}")

        log.info(f"Regenerating response for message {token}")

        # Stream new response (get_answer will call process_query_stream)
        #    When process_query_stream calls retrieve_chat_history,
        #    it will NOT see the old response because is_replaced=True
        return await get_answer(data=queued_request, current_user=current_user)

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

        # Delegate to existing get_answer for streaming
        return await get_answer(data=queued_request, current_user=current_user)


@router.post("/execute-action/")
async def execute_action(request: ActionBatchExecutionRequest, db: AsyncSession = Depends(get_async_session), current_user=Depends(get_current_user)):
    """Execute all planned actions in a message as a batch using LLM orchestration."""

    # EXECUTION STATUS TRACKING:
    # The system tracks whether planned actions were executed by users:
    # 1. When actions are planned, they are marked with is_executed=False in MessageFlowStep
    # 2. When execute-action is called, actions are marked with is_executed=True
    # 3. Assistant messages are updated with execution results and entity information
    # 4. Conversation history includes explicit text about executed vs. not executed actions
    # This ensures complete context for follow-up questions and LLM understanding.

    try:
        # Validate session and get user
        user_id = current_user.id

        llm_model = await chosen_llm(db=db, message_id=request.message_id)
        # Use default model if none was found in the message
        chatbot = PlaneChatBot(llm_model or settings.llm_model.DEFAULT)
        build_mode_tool_executor = BuildModeToolExecutor(chatbot=chatbot, db=db)
        result = await build_mode_tool_executor.execute(request, user_id)

        # Check if service returned an error
        if result.get("error"):
            status_code = result.get("status_code", 500)
            detail = result.get("detail", "Unknown error")

            # Build response content
            content = {"detail": detail}
            if "error_code" in result:
                content["error_code"] = result["error_code"]
            if "workspace_id" in result:
                content["workspace_id"] = result["workspace_id"]
            if "user_id" in result:
                content["user_id"] = result["user_id"]

            return JSONResponse(status_code=status_code, content=content)

        # Return successful response
        return JSONResponse(content=result)

    except Exception as e:
        log.error(f"Error in execute_action: {str(e)}")
        return JSONResponse(status_code=500, content={"detail": BATCH_EXECUTION_ERRORS["INTERNAL_ERROR"]})


@router.get("/search/", response_model=ChatSearchResponse)
async def search_chats(
    query: str = Query(..., description="Search query text"),
    workspace_id: UUID4 = Query(..., description="Workspace ID to filter by"),
    is_project_chat: Optional[bool] = Query(False, description="Filter by project chat flag"),
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
):
    """Search chats by title and message content with cursor-based pagination."""

    # Validate query parameters
    if not query or not query.strip():
        return JSONResponse(status_code=400, content={"detail": "Search query cannot be empty"})

    try:
        user_id = current_user.id
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
