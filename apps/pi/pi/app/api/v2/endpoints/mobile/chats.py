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

"""Mobile chat management endpoints."""

from typing import Any
from typing import Optional

from fastapi import APIRouter
from fastapi import Depends
from fastapi import Path
from fastapi import Query
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import UUID4
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.api.dependencies import jwt_schema
from pi.app.api.dependencies import validate_jwt_token
from pi.app.schemas.mobile.chat import ChatFeedbackMobile
from pi.app.schemas.mobile.chat import ChatInitializationRequestMobile
from pi.app.schemas.mobile.chat import ChatStartResponseMobile
from pi.app.schemas.mobile.chat import ChatSuggestionMobile
from pi.app.schemas.mobile.chat import ChatSuggestionTemplateMobile
from pi.app.utils import validate_chat_initialization
from pi.app.utils.background_tasks import schedule_chat_deletion
from pi.app.utils.background_tasks import schedule_chat_rename
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.services.chat.chat import PlaneChatBot
from pi.services.chat.search import ChatSearchService
from pi.services.chat.templates import tiles_factory
from pi.services.chat.utils import initialize_new_chat
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

log = logger.getChild("v2.mobile.chats")
router = APIRouter()


@router.post("/", status_code=201)
async def create_chat(
    data: ChatInitializationRequestMobile,
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Create a new chat conversation (Mobile).

    This endpoint initializes a new chat session for mobile clients and returns the
    chat ID that can be used for subsequent operations. The chat is created with
    minimal required information, and additional context (workspace details) can
    be provided during the first message.

    This is the mobile version that uses JWT authentication instead of cookie-based auth.

    Args:
        data: ChatInitializationRequestMobile containing:
            - chat_id: Optional UUID for the chat (auto-generated if not provided)
            - workspace_in_context: Whether workspace context is enabled (default: False)
            - workspace_id: Optional workspace UUID for workspace-scoped chats
            - is_project_chat: Whether this is a project-specific chat
        db: Database session (injected)
        token: JWT token for authentication (injected from Authorization header)

    Returns:
        JSON response with:
        - chat_id: UUID of the created chat

    Status Codes:
        - 201: Chat created successfully
        - 400: Invalid request data
        - 401: Invalid or missing authentication
        - 409: Chat already exists with the provided chat_id
        - 500: Internal server error

    Example Request:
        POST /api/v2/mobile/chats/
        Authorization: Bearer <jwt-token>
        {
            "workspace_in_context": true,
            "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
            "is_project_chat": false
        }

    Example Response:
        {
            "chat_id": "987fcdeb-51a2-43f7-b456-123456789abc"
        }

    Example Request (React Native):
        const response = await fetch('https://api.plane.so/api/v2/mobile/chats/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                workspace_in_context: true,
                workspace_id: workspaceId,
                is_project_chat: false
            })
        });

    Notes:
        - Uses JWT authentication (Authorization: Bearer <token>) for mobile apps
        - If chat_id is not provided, a new UUID will be generated
        - Chat initialization is lightweight and completes quickly
        - Workspace details can be backfilled later during first message
        - Migrated from V1: POST /api/v1/mobile/chat/initialize-chat/
    """
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    # Validate request data
    validation_error = validate_chat_initialization(data)
    if validation_error:
        return JSONResponse(
            status_code=validation_error["status_code"],
            content={"detail": validation_error["detail"]},
        )

    # Initialize chat using service layer
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
        return JSONResponse(status_code=201, content={"chat_id": result["chat_id"]})
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


@router.get("/search")
async def search_chats(
    q: str = Query(..., description="Search query text", alias="q"),
    workspace_id: UUID4 = Query(..., description="Workspace UUID to filter by"),
    is_project_chat: Optional[bool] = Query(False, description="Filter by project chat flag"),
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
    per_page: int = Query(30, ge=1, le=100, description="Number of results per page (max 100)"),
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Search chats by title and message content (Mobile).

    This endpoint performs full-text search across chat titles and message content
    for mobile clients, returning matching chats with cursor-based pagination for
    efficient retrieval of large result sets.

    Args:
        q: Search query text (query parameter, alias 'q')
        workspace_id: Workspace UUID to filter by (required)
        is_project_chat: Filter by project chat flag (default: False)
        cursor: Cursor for pagination (optional)
        per_page: Number of results per page (1-100, default: 30)
        db: Database session (injected)
        token: JWT token for authentication (injected)

    Returns:
        JSON response with:
        - results: List of matching chats
        - pagination: Pagination metadata (next_cursor, has_more, total)

    Status Codes:
        - 200: Search completed successfully
        - 400: Invalid query (empty or whitespace-only)
        - 401: Invalid or missing authentication
        - 500: Internal server error

    Example Request:
        GET /api/v2/mobile/chats/search?q=bug+fix&workspace_id=abc-123&per_page=20
        Authorization: Bearer <jwt-token>

    Example Response:
        {
            "results": [
                {
                    "chat_id": "abc-123",
                    "title": "Bug Fix Discussion",
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T11:30:00Z",
                    "message_count": 8,
                    "relevance_score": 0.95
                }
            ],
            "pagination": {
                "next_cursor": "eyJvZmZzZXQiOjIwfQ==",
                "has_more": true,
                "total": null
            }
        }

    Notes:
        - Uses JWT authentication for mobile apps
        - Empty or whitespace-only queries are rejected
        - Results are sorted by relevance (highest first)
        - Search is case-insensitive with partial word matching
        - Per-page limit capped at 100 for performance
        - Migrated from V1: GET /api/v1/mobile/chat/search/
    """
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    # Validate query parameters
    if not q or not q.strip():
        return JSONResponse(status_code=400, content={"detail": "Search query cannot be empty"})

    try:
        # Initialize search service
        search_service = ChatSearchService()

        try:
            results, pagination = await search_service.search_chats(
                query=q.strip(),
                user_id=user_id,
                workspace_id=workspace_id,
                is_project_chat=is_project_chat,
                cursor=cursor,
                per_page=per_page,
            )

            # Prepare response
            response_data = pagination.model_dump(mode="json")
            response_data["results"] = [result.model_dump(mode="json") for result in results]

            return JSONResponse(content=response_data)

        finally:
            # Ensure search service is properly closed
            await search_service.close()

    except Exception as e:
        log.error(f"Error searching chats: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.get("/favorites")
async def list_favorite_chats(
    workspace_id: Optional[UUID4] = Query(None, description="Optional workspace UUID to filter by"),
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Get list of favorited chats (Mobile).

    This endpoint retrieves all chats marked as favorites by the user for mobile clients.

    Args:
        workspace_id: Optional workspace UUID to filter by (query parameter)
        db: Database session (injected)
        token: JWT token for authentication (injected)

    Returns:
        JSON response with favorite chats

    Status Codes:
        - 200: Favorites retrieved successfully
        - 401: Invalid or missing authentication
        - 500: Internal server error

    Example Request:
        GET /api/v2/mobile/chats/favorites?workspace_id=abc-123
        Authorization: Bearer <jwt-token>

    Notes:
        - Uses JWT authentication for mobile apps
        - Migrated from V1: GET /api/v1/mobile/chat/get-favorite-chats/
    """
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    result = await get_favorite_chats(user_id=user_id, db=db, workspace_id=workspace_id)

    status_code, content = result
    return JSONResponse(status_code=status_code, content=content)


@router.get("/threads")
async def get_user_threads(
    workspace_id: Optional[UUID4] = Query(None, description="Optional workspace UUID to filter by"),
    is_project_chat: Optional[bool] = Query(False, description="Filter by project chat flag"),
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Get user's chat threads (Mobile).

    This endpoint retrieves all chat threads/conversations for the authenticated
    mobile user, optionally filtered by workspace.

    Args:
        workspace_id: Optional workspace UUID to filter by (query parameter)
        is_project_chat: Filter by project chat flag (default: False)
        db: Database session (injected)
        token: JWT token for authentication (injected)

    Returns:
        JSON response with:
        - results: List of chat threads

    Status Codes:
        - 200: Threads retrieved successfully
        - 401: Invalid or missing authentication
        - 500: Internal server error

    Example Request:
        GET /api/v2/mobile/chats/threads?workspace_id=abc-123
        Authorization: Bearer <jwt-token>

    Example Response:
        {
            "results": [
                {
                    "chat_id": "abc-123",
                    "title": "Project Planning",
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-15T11:30:00Z",
                    "message_count": 5
                }
            ]
        }

    Notes:
        - Uses JWT authentication for mobile apps
        - Migrated from V1: POST /api/v1/mobile/chat/get-user-threads/
    """
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    results = await get_user_chat_threads(
        user_id=user_id,
        workspace_id=workspace_id,
        db=db,
        is_project_chat=is_project_chat,
    )

    # Check if results is a tuple (error case)
    if isinstance(results, tuple) and len(results) == 2:
        status_code, content = results
        return JSONResponse(status_code=status_code, content=content)

    # Success case
    return JSONResponse(content={"results": results})


@router.get("/models")
async def get_models(
    workspace_id: Optional[UUID4] = None,
    workspace_slug: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Get list of available AI models (Mobile).

    This endpoint retrieves the list of AI models available for chat conversations
    for mobile clients.

    Args:
        workspace_id: Optional workspace UUID (query parameter)
        workspace_slug: Optional workspace slug (query parameter)
        db: Database session (injected)
        token: JWT token for authentication (injected)

    Returns:
        JSON response with:
        - models: List of available AI models

    Status Codes:
        - 200: Models retrieved successfully
        - 401: Invalid or missing authentication
        - 500: Internal server error

    Example Request:
        GET /api/v2/mobile/chats/models
        Authorization: Bearer <jwt-token>

    Example Response:
        {
            "models": [
                {
                    "id": "gpt-4",
                    "name": "GPT-4",
                    "description": "Most capable model"
                },
                {
                    "id": "claude-3",
                    "name": "Claude 3",
                    "description": "Anthropic's latest model"
                }
            ]
        }

    Notes:
        - Uses JWT authentication for mobile apps
        - Migrated from V1: GET /api/v1/mobile/chat/get-models/
    """
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    # Convert user_id to string and provide default workspace_slug if None
    models_list = await get_active_models(db=db, user_id=str(user_id), workspace_slug=workspace_slug or "")

    # Check if models_list is a tuple (error case)
    if isinstance(models_list, tuple) and len(models_list) == 2:
        status_code, content = models_list
        return JSONResponse(status_code=status_code, content=content)

    # Success case
    model_dict = {"models": models_list}
    return JSONResponse(content=model_dict)


@router.get("/templates")
async def get_templates(
    workspace_id: Optional[UUID4] = None,
    workspace_slug: Optional[str] = None,
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Get chat suggestion templates (Mobile).

    This endpoint retrieves predefined chat suggestion templates/tiles that can
    be displayed to mobile users to help them start conversations.

    Args:
        workspace_id: Optional workspace UUID (query parameter)
        workspace_slug: Optional workspace slug (query parameter)
        token: JWT token for authentication (injected)

    Returns:
        JSON response with:
        - templates: List of suggestion templates

    Status Codes:
        - 200: Templates retrieved successfully
        - 401: Invalid or missing authentication
        - 500: Internal server error

    Example Request:
        GET /api/v2/mobile/chats/templates
        Authorization: Bearer <jwt-token>

    Example Response:
        {
            "templates": [
                {
                    "text": "How do I create a new issue?",
                    "category": "getting_started"
                },
                {
                    "text": "Show me my open tasks",
                    "category": "tasks"
                }
            ]
        }

    Notes:
        - Uses JWT authentication for mobile apps
        - Migrated from V1: GET /api/v1/mobile/chat/get-templates/
    """
    try:
        await validate_jwt_token(token)
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    try:
        suggestions = tiles_factory()
        return ChatSuggestionTemplateMobile(templates=suggestions)
    except Exception as e:
        log.error(f"Error getting templates: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.get("/{chat_id}")
async def get_chat(
    chat_id: UUID4 = Path(..., description="UUID of the chat to retrieve"),
    response_format: Optional[str] = Query(
        None,
        description="Response format: 'object' for dialogue objects, default for dialogue strings",
        alias="format",
    ),
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Get chat history and details by ID (Mobile).

    This endpoint retrieves the complete history of a chat conversation for mobile
    clients, including all messages, title, model used, feedback, and focus settings.

    Args:
        chat_id: UUID of the chat to retrieve (path parameter)
        format: Optional format specifier:
            - None/default: Returns dialogue as string array
            - 'object': Returns dialogue as structured objects with role/content
        db: Database session (injected)
        token: JWT token for authentication (injected)

    Returns:
        JSON response with:
        - results:
            - title: Chat title
            - dialogue: List of messages (format depends on 'format' parameter)
            - llm: AI model used (e.g., "gpt-4", "claude-3")
            - feedback: User feedback on the chat
            - reasoning: AI reasoning steps (if available)
            - is_focus_enabled: Whether focus mode is active
            - focus_project_id: Project ID if focused on a project
            - focus_workspace_id: Workspace ID if focused on a workspace

    Status Codes:
        - 200: Chat retrieved successfully
        - 401: Invalid or missing authentication
        - 403: User not authorized to access this chat
        - 404: Chat not found
        - 500: Internal server error

    Example Request:
        GET /api/v2/mobile/chats/123e4567-e89b-12d3-a456-426614174000
        Authorization: Bearer <jwt-token>

    Example Response:
        {
            "results": {
                "title": "Project Planning Discussion",
                "dialogue": [
                    "user: How do I create a new project?",
                    "assistant: To create a new project..."
                ],
                "llm": "gpt-4",
                "feedback": "",
                "reasoning": "",
                "is_focus_enabled": true,
                "focus_project_id": "abc-123",
                "focus_workspace_id": "xyz-789"
            }
        }

    Notes:
        - Uses JWT authentication for mobile apps
        - Chat access is restricted to the owner
        - Migrated from V1: POST /api/v1/mobile/chat/get-chat-history/
    """
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    try:
        log.info(f"Mobile chat history request for chat_id: {chat_id}")

        # Determine if we need dialogue objects or strings
        dialogue_object = response_format == "object"

        results: dict[str, Any] = await retrieve_chat_history(
            chat_id=chat_id,
            dialogue_object=dialogue_object,
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
                    "focus_project_id": results.get("focus_project_id", None),
                    "focus_workspace_id": results.get("focus_workspace_id", None),
                }
            }
        )

    except Exception as e:
        log.error(f"Error retrieving mobile chat history: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: UUID4 = Path(..., description="UUID of the chat to delete"),
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Delete a chat conversation (Mobile - soft delete).

    This endpoint performs a soft delete on a chat for mobile clients, marking it as
    deleted without permanently removing it from the database.

    Args:
        chat_id: UUID of the chat to delete (path parameter)
        db: Database session (injected)
        token: JWT token for authentication (injected)

    Returns:
        JSON response with:
        - detail: Boolean indicating success (true) or failure (false)

    Status Codes:
        - 200: Chat deleted successfully
        - 401: Invalid or missing authentication
        - 404: Chat not found
        - 500: Internal server error

    Example Request:
        DELETE /api/v2/mobile/chats/123e4567-e89b-12d3-a456-426614174000
        Authorization: Bearer <jwt-token>

    Example Response:
        {
            "detail": true
        }

    Notes:
        - Uses JWT authentication for mobile apps
        - This is a soft delete - data is not permanently removed
        - Search index is updated asynchronously
        - Migrated from V1: DELETE /api/v1/mobile/chat/delete-chat/
    """
    try:
        await validate_jwt_token(token)
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    result = await soft_delete_chat(chat_id=chat_id, db=db)

    # Schedule Celery task to mark chat as deleted in search index
    schedule_chat_deletion(str(chat_id))

    status_code, _ = result
    if status_code == 200:
        return JSONResponse(status_code=200, content={"detail": True})
    else:
        return JSONResponse(status_code=status_code, content={"detail": False})


@router.patch("/{chat_id}")
async def update_chat(
    chat_id: UUID4 = Path(..., description="UUID of the chat to update"),
    title: str = Query(..., description="New title for the chat"),
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Update chat properties (Mobile - currently supports title updates).

    This endpoint allows updating chat properties for mobile clients. Currently,
    it supports renaming the chat title.

    Args:
        chat_id: UUID of the chat to update (path parameter)
        title: New title for the chat (query parameter)
        db: Database session (injected)
        token: JWT token for authentication (injected)

    Returns:
        JSON response with:
        - detail: Boolean indicating success (true) or failure (false)

    Status Codes:
        - 200: Chat updated successfully
        - 401: Invalid or missing authentication
        - 404: Chat not found
        - 500: Internal server error

    Example Request:
        PATCH /api/v2/mobile/chats/123e4567-e89b-12d3-a456-426614174000?title=New%20Title
        Authorization: Bearer <jwt-token>

    Example Response:
        {
            "detail": true
        }

    Notes:
        - Uses JWT authentication for mobile apps
        - Search index is updated asynchronously
        - Migrated from V1: POST /api/v1/mobile/chat/rename-chat/
    """
    try:
        await validate_jwt_token(token)
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    result = await rename_chat_title(chat_id=chat_id, new_title=title, db=db)

    # Schedule Celery task to update chat title in search index
    schedule_chat_rename(str(chat_id), title)

    status_code, _ = result
    if status_code == 200:
        return JSONResponse(status_code=200, content={"detail": True})
    else:
        return JSONResponse(status_code=status_code, content={"detail": False})


@router.post("/{chat_id}/favorite")
async def mark_chat_favorite(
    chat_id: UUID4 = Path(..., description="UUID of the chat to favorite"),
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Mark a chat as favorite (Mobile).

    This endpoint adds a chat to the user's favorites list for mobile clients,
    making it easier to find and access frequently referenced conversations.

    Args:
        chat_id: UUID of the chat to favorite (path parameter)
        db: Database session (injected)
        token: JWT token for authentication (injected)

    Returns:
        JSON response with:
        - detail: Boolean indicating success (true) or failure (false)

    Status Codes:
        - 200: Chat favorited successfully
        - 401: Invalid or missing authentication
        - 404: Chat not found
        - 500: Internal server error

    Example Request:
        POST /api/v2/mobile/chats/123e4567-e89b-12d3-a456-426614174000/favorite
        Authorization: Bearer <jwt-token>

    Example Response:
        {
            "detail": true
        }

    Notes:
        - Uses JWT authentication for mobile apps
        - Migrated from V1: POST /api/v1/mobile/chat/favorite-chat/
    """
    try:
        await validate_jwt_token(token)
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    result = await favorite_chat(chat_id=chat_id, db=db)

    status_code, _ = result
    if status_code == 200:
        return JSONResponse(status_code=200, content={"detail": True})
    else:
        return JSONResponse(status_code=status_code, content={"detail": False})


@router.delete("/{chat_id}/favorite")
async def unmark_chat_favorite(
    chat_id: UUID4 = Path(..., description="UUID of the chat to unfavorite"),
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Remove a chat from favorites (Mobile).

    This endpoint removes a chat from the user's favorites list for mobile clients.

    Args:
        chat_id: UUID of the chat to unfavorite (path parameter)
        db: Database session (injected)
        token: JWT token for authentication (injected)

    Returns:
        JSON response with:
        - detail: Boolean indicating success (true) or failure (false)

    Status Codes:
        - 200: Chat unfavorited successfully
        - 401: Invalid or missing authentication
        - 404: Chat not found
        - 500: Internal server error

    Example Request:
        DELETE /api/v2/mobile/chats/123e4567-e89b-12d3-a456-426614174000/favorite
        Authorization: Bearer <jwt-token>

    Example Response:
        {
            "detail": true
        }

    Notes:
        - Uses JWT authentication for mobile apps
        - Migrated from V1: POST /api/v1/mobile/chat/unfavorite-chat/
    """
    try:
        await validate_jwt_token(token)
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    result = await unfavorite_chat(chat_id=chat_id, db=db)

    status_code, _ = result
    if status_code == 200:
        return JSONResponse(status_code=200, content={"detail": True})
    else:
        return JSONResponse(status_code=status_code, content={"detail": False})


@router.post("/{chat_id}/feedback")
async def submit_feedback(
    feedback_data: ChatFeedbackMobile,
    chat_id: UUID4 = Path(..., description="UUID of the chat"),
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Submit feedback for a chat message (Mobile).

    This endpoint allows mobile users to provide feedback (thumbs up/down) on
    assistant responses to improve the AI model.

    Args:
        chat_id: UUID of the chat (path parameter)
        feedback_data: Feedback information including message_index and feedback value
        db: Database session (injected)
        token: JWT token for authentication (injected)

    Returns:
        JSON response with:
        - detail: Boolean indicating success (true) or failure (false)

    Status Codes:
        - 200: Feedback submitted successfully
        - 401: Invalid or missing authentication
        - 404: Chat or message not found
        - 500: Internal server error

    Example Request:
        POST /api/v2/mobile/chats/123e4567-e89b-12d3-a456-426614174000/feedback
        Authorization: Bearer <jwt-token>
        {
            "chat_id": "123e4567-e89b-12d3-a456-426614174000",
            "message_index": 2,
            "feedback": "positive",
            "feedback_message": "Very helpful response!"
        }

    Example Response:
        {
            "detail": true
        }

    Notes:
        - Uses JWT authentication for mobile apps
        - Migrated from V1: POST /api/v1/mobile/chat/feedback/
    """
    try:
        auth = await validate_jwt_token(token)
        if not auth.user:
            return JSONResponse(status_code=401, content={"detail": "Invalid User"})
        user_id = auth.user.id
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    result = await update_message_feedback(
        chat_id=feedback_data.chat_id,
        message_index=feedback_data.message_index,
        feedback_value=feedback_data.feedback.value,
        user_id=user_id,
        db=db,
        feedback_message=feedback_data.feedback_message,
    )

    status_code, _ = result
    if status_code == 200:
        return JSONResponse(status_code=200, content={"detail": True})
    else:
        return JSONResponse(status_code=status_code, content={"detail": False})


@router.post("/placeholder")
async def get_placeholder(
    data: ChatSuggestionMobile,
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Get chat input placeholder text (Mobile).

    This endpoint returns placeholder text for the chat input field based on
    the selected suggestion template for mobile clients.

    Args:
        data: ChatSuggestionMobile containing the suggestion text
        token: JWT token for authentication (injected)

    Returns:
        JSON response with:
        - placeholder: Placeholder text for chat input

    Status Codes:
        - 200: Placeholder retrieved successfully
        - 401: Invalid or missing authentication
        - 500: Internal server error

    Example Request:
        POST /api/v2/mobile/chats/placeholder
        Authorization: Bearer <jwt-token>
        {
            "text": "How do I create a new issue?"
        }

    Example Response:
        {
            "placeholder": "How do I create a new issue?"
        }

    Notes:
        - Uses JWT authentication for mobile apps
        - Migrated from V1: POST /api/v1/mobile/chat/get-placeholder/
    """
    try:
        await validate_jwt_token(token)
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    try:
        placeholder = data.text or "How can I assist you with your work today?"
        return ChatStartResponseMobile(placeholder=placeholder)
    except Exception as e:
        log.error(f"An unexpected error occurred: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.post("/{chat_id}/title")
async def generate_title(
    chat_id: UUID4 = Path(..., description="UUID of the chat"),
    db: AsyncSession = Depends(get_async_session),
    token: HTTPAuthorizationCredentials = Depends(jwt_schema),
):
    """
    Generate a title for a chat (Mobile).

    This endpoint automatically generates a descriptive title for a chat based
    on its message content for mobile clients.

    Args:
        chat_id: UUID of the chat (path parameter)
        db: Database session (injected)
        token: JWT token for authentication (injected)

    Returns:
        JSON response with:
        - title: Generated title for the chat

    Status Codes:
        - 200: Title generated successfully
        - 400: Invalid request (missing chat_id)
        - 401: Invalid or missing authentication
        - 404: Chat not found
        - 500: Internal server error

    Example Request:
        POST /api/v2/mobile/chats/123e4567-e89b-12d3-a456-426614174000/title
        Authorization: Bearer <jwt-token>

    Example Response:
        {
            "title": "Project Planning and Task Assignment"
        }

    Notes:
        - Uses JWT authentication for mobile apps
        - Title is generated using AI based on chat content
        - Migrated from V1: POST /api/v1/mobile/chat/generate-title/
    """
    try:
        await validate_jwt_token(token)
    except Exception as e:
        log.error(f"Error validating JWT: {e!s}")
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired JWT token"})

    if not chat_id:
        return JSONResponse(status_code=400, content={"detail": "chat_id is required"})

    try:
        # Get messages for this chat
        messages = await get_chat_messages(chat_id=chat_id, db=db)

        # Check if messages is a tuple (error case)
        if isinstance(messages, tuple) and len(messages) == 2:
            status_code, content = messages
            return JSONResponse(status_code=status_code, content=content)

        chatbot = PlaneChatBot()
        title = await chatbot.get_title(chat_id=chat_id, messages=messages, db=db)

        return JSONResponse(content={"title": title})
    except Exception as e:
        log.error(f"Error generating title: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})
