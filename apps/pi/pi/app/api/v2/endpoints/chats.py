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
from typing import Optional

from fastapi import APIRouter
from fastapi import Depends
from fastapi import Path
from fastapi import Query
from fastapi.responses import JSONResponse
from pydantic import UUID4
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.api.dependencies import get_current_user
from pi.app.schemas.chat import ChatInitializationRequest
from pi.app.utils import validate_chat_initialization
from pi.app.utils.background_tasks import schedule_chat_deletion
from pi.app.utils.background_tasks import schedule_chat_rename
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.services.chat.search import ChatSearchService
from pi.services.chat.utils import initialize_new_chat
from pi.services.retrievers.pg_store import favorite_chat
from pi.services.retrievers.pg_store import get_favorite_chats
from pi.services.retrievers.pg_store import rename_chat_title
from pi.services.retrievers.pg_store import retrieve_chat_history
from pi.services.retrievers.pg_store import soft_delete_chat
from pi.services.retrievers.pg_store import unfavorite_chat

log = logger.getChild("v2.chats")
router = APIRouter()


@router.post("/", status_code=201)
async def create_chat(
    data: ChatInitializationRequest,
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """
    Create a new chat conversation.

    This endpoint initializes a new chat session and returns the chat ID that can be
    used for subsequent operations. The chat is created with minimal required information,
    and additional context (workspace details) can be provided during the first message.

    Args:
        data: ChatInitializationRequest containing:
            - chat_id: Optional UUID for the chat (auto-generated if not provided)
            - workspace_in_context: Whether workspace context is enabled (default: False)
            - workspace_id: Optional workspace UUID for workspace-scoped chats
            - is_project_chat: Whether this is a project-specific chat
        db: Database session (injected)
        session: Session cookie for authentication (injected)

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
        POST /api/v2/chats/
        {
            "workspace_in_context": true,
            "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
            "is_project_chat": false
        }

    Example Response:
        {
            "chat_id": "987fcdeb-51a2-43f7-b456-123456789abc"
        }

    Notes:
        - If chat_id is not provided, a new UUID will be generated
        - Chat initialization is lightweight and completes quickly
        - Workspace details can be backfilled later during first message
    """
    user_id = current_user.id

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
    per_page: int = Query(30, ge=1, le=100, description="Number of results per page"),
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """
    Search chats by title and message content.

    This endpoint performs full-text search across chat titles and message content,
    returning matching chats with cursor-based pagination for efficient retrieval
    of large result sets. Results are ranked by relevance.

    The search uses a dedicated search index for fast lookups and supports:
    - Full-text search across titles and messages
    - Workspace filtering
    - Project chat filtering
    - Cursor-based pagination for infinite scroll

    Args:
        q: Search query text (required, cannot be empty)
        workspace_id: UUID of workspace to filter results
        is_project_chat: Filter by project chat flag (default: False)
        cursor: Pagination cursor from previous response (optional)
        per_page: Number of results per page (1-100, default: 30)
        db: Database session (injected)
        session: Session cookie for authentication (injected)

    Returns:
        ChatSearchResponse with:
        - results: List of matching chat objects containing:
            - chat_id: UUID of the chat
            - title: Chat title
            - excerpt: Relevant message excerpt (highlighted)
            - created_at: Chat creation timestamp
            - updated_at: Last update timestamp
            - message_count: Number of messages in chat
            - relevance_score: Search relevance score
        - pagination:
            - next_cursor: Cursor for next page (null if last page)
            - has_more: Boolean indicating more results
            - total: Approximate total count (may be null)

    Status Codes:
        - 200: Search completed successfully
        - 400: Invalid query (empty search text)
        - 401: Invalid or missing authentication
        - 500: Internal server error

    Example Request:
        GET /api/v2/chats/search?q=bug%20report&workspace_id=abc-123&per_page=20

    Example Response:
        {
            "results": [
                {
                    "chat_id": "chat-123",
                    "title": "Bug Report: Login Issue",
                    "excerpt": "...found a bug in the login flow...",
                    "created_at": "2025-01-15T10:30:00Z",
                    "updated_at": "2025-01-16T14:20:00Z",
                    "message_count": 8,
                    "relevance_score": 0.95
                },
                {
                    "chat_id": "chat-456",
                    "title": "Feature Request",
                    "excerpt": "...reporting this bug...",
                    "created_at": "2025-01-10T08:15:00Z",
                    "updated_at": "2025-01-10T09:30:00Z",
                    "message_count": 5,
                    "relevance_score": 0.82
                }
            ],
            "pagination": {
                "next_cursor": "eyJvZmZzZXQiOjIwfQ==",
                "has_more": true,
                "total": null
            }
        }

    Pagination Example:
        # First page
        GET /api/v2/chats/search?q=bug&workspace_id=abc-123&per_page=20

        # Next page (use next_cursor from previous response)
        GET /api/v2/chats/search?q=bug&workspace_id=abc-123&per_page=20&cursor=eyJvZmZzZXQiOjIwfQ==

    Notes:
        - Empty or whitespace-only queries are rejected
        - Results are sorted by relevance (highest first)
        - Search is case-insensitive
        - Supports partial word matching
        - Results are limited to user's accessible chats
        - Search service connection is properly closed after use
        - Per-page limit capped at 100 for performance
        - Deprecated V1 endpoint: GET /api/v1/chat/search/

    Use Cases:
        - Finding specific conversations by topic
        - Searching for chats containing specific keywords
        - Building a chat search UI with infinite scroll
        - Finding previous discussions about issues/features
    """
    user_id = current_user.id

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


@router.get("/{chat_id}")
async def get_chat(
    chat_id: UUID4 = Path(..., description="UUID of the chat to retrieve"),
    response_format: Optional[str] = Query(
        None,
        description="Response format: 'object' for dialogue objects, default for dialogue strings",
        alias="format",
    ),
    workspace_id: Optional[UUID4] = Query(None, description="Optional workspace UUID for context"),
    workspace_slug: Optional[str] = Query(None, description="Optional workspace slug for context"),
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """
    Get chat history and details by ID.

    This endpoint retrieves the complete history of a chat conversation, including
    all messages, title, model used, feedback, and focus settings. The response format
    can be controlled using the 'format' query parameter.

    Args:
        chat_id: UUID of the chat to retrieve (path parameter)
        format: Optional format specifier:
            - None/default: Returns dialogue as string array
            - 'object': Returns dialogue as structured objects with role/content
        workspace_id: Optional workspace UUID for filtering
        workspace_slug: Optional workspace slug for filtering
        db: Database session (injected)
        session: Session cookie for authentication (injected)

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

    Example Response (default format):
        {
            "results": {
                "title": "Project Planning Discussion",
                "dialogue": [
                    "user: How do I create a new project?",
                    "assistant: To create a new project, navigate to..."
                ],
                "llm": "gpt-4",
                "feedback": "",
                "reasoning": "",
                "is_focus_enabled": true,
                "focus_project_id": "abc-123",
                "focus_workspace_id": "xyz-789"
            }
        }

    Example Response (format=object):
        {
            "results": {
                "title": "Project Planning Discussion",
                "dialogue": [
                    {"role": "user", "content": "How do I create a new project?"},
                    {"role": "assistant", "content": "To create a new project..."}
                ],
                "llm": "gpt-4",
                ...
            }
        }

    Notes:
        - Chat access is restricted to the owner
        - Deprecated V1 endpoint: GET /api/v1/chat/get-chat-history/
    """
    try:
        user_id = current_user.id
        log.info(f"chat history retrieve request received for chat_id: {chat_id}")

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
            return JSONResponse(
                status_code=404,
                content={
                    "detail": results["detail"],
                    "results": {
                        "title": results.get("title", ""),
                        "dialogue": results.get("dialogue", []),
                        "llm": results.get("llm", ""),
                        "feedback": results.get("feedback", ""),
                        "reasoning": results.get("reasoning", ""),
                        "is_focus_enabled": results.get("is_focus_enabled", False),
                        "is_websearch_enabled": results.get("is_websearch_enabled", False),
                        "focus_project_id": results.get("focus_project_id", None),
                        "focus_workspace_id": results.get("focus_workspace_id", None),
                    },
                },
            )
        elif error_type == "unauthorized":
            return JSONResponse(
                status_code=403,
                content={
                    "detail": results["detail"],
                    "results": {
                        "title": results.get("title", ""),
                        "dialogue": results.get("dialogue", []),
                        "llm": results.get("llm", ""),
                        "feedback": results.get("feedback", ""),
                        "reasoning": results.get("reasoning", ""),
                        "is_focus_enabled": results.get("is_focus_enabled", False),
                        "is_websearch_enabled": results.get("is_websearch_enabled", False),
                        "focus_project_id": results.get("focus_project_id", None),
                        "focus_workspace_id": results.get("focus_workspace_id", None),
                    },
                },
            )

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

    except ValueError as ve:
        log.error(f"An error occurred during retrieval: {ve!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

    except Exception as e:
        log.error(f"An error occurred during retrieval: {e!s}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: UUID4 = Path(..., description="UUID of the chat to delete"),
    workspace_id: Optional[UUID4] = Query(None, description="Optional workspace UUID for context"),
    workspace_slug: Optional[str] = Query(None, description="Optional workspace slug for context"),
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """
    Delete a chat conversation (soft delete).

    This endpoint performs a soft delete on a chat, marking it as deleted without
    permanently removing it from the database. The chat is also marked as deleted
    in the search index asynchronously.

    Args:
        chat_id: UUID of the chat to delete (path parameter)
        workspace_id: Optional workspace UUID for filtering
        workspace_slug: Optional workspace slug for filtering
        db: Database session (injected)
        session: Session cookie for authentication (injected)

    Returns:
        JSON response with:
        - message: Confirmation message

    Status Codes:
        - 200: Chat deleted successfully
        - 401: Invalid or missing authentication
        - 404: Chat not found
        - 500: Internal server error

    Example Request:
        DELETE /api/v2/chats/123e4567-e89b-12d3-a456-426614174000

    Example Response:
        {
            "message": "Chat deleted successfully"
        }

    Notes:
        - This is a soft delete - data is not permanently removed
        - Search index is updated asynchronously via Celery
        - Deleted chats are hidden from user's chat list
        - Deprecated V1 endpoint: DELETE /api/v1/chat/delete-chat/
    """

    result = await soft_delete_chat(chat_id=chat_id, db=db)

    # Schedule Celery task to mark chat as deleted in search index
    schedule_chat_deletion(str(chat_id))

    # The soft_delete_chat function always returns a tuple of (status_code, content)
    status_code, content = result
    return JSONResponse(status_code=status_code, content=content)


@router.patch("/{chat_id}")
async def update_chat(
    chat_id: UUID4 = Path(..., description="UUID of the chat to update"),
    title: str = Query(..., description="New title for the chat"),
    workspace_id: Optional[UUID4] = Query(None, description="Optional workspace UUID for context"),
    workspace_slug: Optional[str] = Query(None, description="Optional workspace slug for context"),
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """
    Update chat properties (currently supports title updates).

    This endpoint allows updating chat properties. Currently, it supports renaming
    the chat title. The title is updated in both the database and the search index
    asynchronously for efficient search.

    Args:
        chat_id: UUID of the chat to update (path parameter)
        title: New title for the chat (query parameter)
        workspace_id: Optional workspace UUID for filtering
        workspace_slug: Optional workspace slug for filtering
        db: Database session (injected)
        session: Session cookie for authentication (injected)

    Returns:
        JSON response with:
        - message: Confirmation message

    Status Codes:
        - 200: Chat updated successfully
        - 401: Invalid or missing authentication
        - 404: Chat not found
        - 500: Internal server error

    Example Request:
        PATCH /api/v2/chats/123e4567-e89b-12d3-a456-426614174000?title=New%20Chat%20Title

    Example Response:
        {
            "message": "Chat renamed successfully"
        }

    Notes:
        - Search index is updated asynchronously via Celery
        - Empty titles are allowed but not recommended
        - Future versions may support updating other properties via request body
        - Deprecated V1 endpoint: POST /api/v1/chat/rename-chat/
    """

    result = await rename_chat_title(chat_id=chat_id, new_title=title, db=db)

    # Schedule Celery task to update chat title in search index
    schedule_chat_rename(str(chat_id), title)

    status_code, content = result
    return JSONResponse(status_code=status_code, content=content)


@router.post("/{chat_id}/favorite")
async def mark_chat_favorite(
    chat_id: UUID4 = Path(..., description="UUID of the chat to favorite"),
    workspace_id: Optional[UUID4] = Query(None, description="Optional workspace UUID for context"),
    workspace_slug: Optional[str] = Query(None, description="Optional workspace slug for context"),
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """
    Mark a chat as favorite.

    This endpoint adds a chat to the user's favorites list, making it easier to
    find and access frequently referenced conversations. Favorited chats appear
    in a dedicated section in the UI.

    Args:
        chat_id: UUID of the chat to favorite (path parameter)
        workspace_id: Optional workspace UUID for filtering
        workspace_slug: Optional workspace slug for filtering
        db: Database session (injected)
        session: Session cookie for authentication (injected)

    Returns:
        JSON response with:
        - message: Confirmation message

    Status Codes:
        - 200: Chat favorited successfully
        - 401: Invalid or missing authentication
        - 404: Chat not found
        - 500: Internal server error

    Example Request:
        POST /api/v2/chats/123e4567-e89b-12d3-a456-426614174000/favorite

    Example Response:
        {
            "message": "Chat marked as favorite"
        }

    Notes:
        - Favoriting a chat that's already favorited is idempotent (no error)
        - Favorited chats are retrievable via GET /api/v2/chats/favorites
        - Deprecated V1 endpoint: POST /api/v1/chat/favorite-chat/
    """

    result = await favorite_chat(chat_id=chat_id, db=db)

    status_code, content = result
    return JSONResponse(status_code=status_code, content=content)


@router.delete("/{chat_id}/favorite")
async def unmark_chat_favorite(
    chat_id: UUID4 = Path(..., description="UUID of the chat to unfavorite"),
    workspace_id: Optional[UUID4] = Query(None, description="Optional workspace UUID for context"),
    workspace_slug: Optional[str] = Query(None, description="Optional workspace slug for context"),
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """
    Remove a chat from favorites.

    This endpoint removes a chat from the user's favorites list. The chat remains
    accessible but will no longer appear in the favorites section.

    Args:
        chat_id: UUID of the chat to unfavorite (path parameter)
        workspace_id: Optional workspace UUID for filtering
        workspace_slug: Optional workspace slug for filtering
        db: Database session (injected)
        session: Session cookie for authentication (injected)

    Returns:
        JSON response with:
        - message: Confirmation message

    Status Codes:
        - 200: Chat unfavorited successfully
        - 401: Invalid or missing authentication
        - 404: Chat not found
        - 500: Internal server error

    Example Request:
        DELETE /api/v2/chats/123e4567-e89b-12d3-a456-426614174000/favorite

    Example Response:
        {
            "message": "Chat removed from favorites"
        }

    Notes:
        - Unfavoriting a non-favorited chat is idempotent (no error)
        - Deprecated V1 endpoint: POST /api/v1/chat/unfavorite-chat/
    """

    result = await unfavorite_chat(chat_id=chat_id, db=db)

    # The unfavorite_chat function always returns a tuple of (status_code, content)
    status_code, content = result
    return JSONResponse(status_code=status_code, content=content)


@router.get("/favorites/list")
async def list_favorite_chats(
    workspace_id: Optional[UUID4] = Query(None, description="Optional workspace UUID for filtering"),
    workspace_slug: Optional[str] = Query(None, description="Optional workspace slug for filtering"),
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """
    List all favorite chats for the authenticated user.

    This endpoint retrieves all chats that the user has marked as favorite,
    optionally filtered by workspace. Results include chat metadata such as
    title, creation date, and last updated timestamp.

    Args:
        workspace_id: Optional workspace UUID for filtering favorites to a specific workspace
        workspace_slug: Optional workspace slug for filtering (alternative to workspace_id)
        db: Database session (injected)
        session: Session cookie for authentication (injected)

    Returns:
        JSON response with:
        - chats: List of favorite chat objects containing:
            - chat_id: UUID of the chat
            - title: Chat title
            - created_at: Timestamp of creation
            - updated_at: Timestamp of last update
            - workspace_id: Associated workspace UUID (if any)
            - llm: AI model used

    Status Codes:
        - 200: Favorites retrieved successfully
        - 401: Invalid or missing authentication
        - 500: Internal server error

    Example Request:
        GET /api/v2/chats/favorites/list
        GET /api/v2/chats/favorites/list?workspace_id=123e4567-e89b-12d3-a456-426614174000

    Example Response:
        {
            "chats": [
                {
                    "chat_id": "abc-123",
                    "title": "Important Discussion",
                    "created_at": "2025-01-15T10:30:00Z",
                    "updated_at": "2025-01-16T14:20:00Z",
                    "workspace_id": "xyz-789",
                    "llm": "gpt-4"
                },
                {
                    "chat_id": "def-456",
                    "title": "Quick Reference",
                    "created_at": "2025-01-10T08:15:00Z",
                    "updated_at": "2025-01-10T08:15:00Z",
                    "workspace_id": "xyz-789",
                    "llm": "claude-3"
                }
            ]
        }

    Notes:
        - Results are typically sorted by most recently updated
        - Empty list is returned if user has no favorites
        - Workspace filtering is optional
        - Deprecated V1 endpoint: GET /api/v1/chat/get-favorite-chats/
    """
    user_id = current_user.id

    result = await get_favorite_chats(user_id=user_id, db=db, workspace_id=workspace_id)

    # The get_favorite_chats function always returns a tuple of (status_code, content)
    status_code, content = result
    return JSONResponse(status_code=status_code, content=content)
