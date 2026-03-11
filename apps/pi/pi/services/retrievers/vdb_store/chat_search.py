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
Chat Search Index Operations.

This module provides optimized functionality to sync chat and message data to the OpenSearch
chat search index. Designed for use with Celery background tasks for improved performance.
"""

from typing import List
from typing import Optional
from uuid import UUID

from sqlalchemy import and_
from sqlalchemy import select

from pi import logger
from pi import settings
from pi.app.models.chat import Chat
from pi.app.models.message import Message
from pi.core.vectordb.client import VectorStore

log = logger.getChild(__name__)

CHAT_SEARCH_INDEX = settings.vector_db.CHAT_SEARCH_INDEX


async def mark_chat_deleted(chat_id: str) -> dict:
    """Mark chat and all its messages as deleted in search index."""
    try:
        async with VectorStore() as vs:
            update_body = {"script": {"source": "ctx._source.is_deleted = true"}, "query": {"term": {"chat_id": chat_id}}}

            response = await vs.async_os.update_by_query(index=CHAT_SEARCH_INDEX, body=update_body, conflicts="proceed")

            updated_count = response.get("updated", 0)
            log.info(f"Marked {updated_count} documents as deleted for chat_id: {chat_id}")

            return {"status": "success", "message": f"Successfully marked {updated_count} documents as deleted", "updated_count": updated_count}
    except Exception as e:
        log.error(f"Error marking chat {chat_id} as deleted: {e}")
        return {"status": "error", "message": str(e)}


async def upsert_chat_document(
    chat_id: str,
    user_id: Optional[str],
    workspace_id: Optional[str],
    title: Optional[str],
    is_project_chat: Optional[bool],
    chat_created_at: Optional[str],
    chat_updated_at: Optional[str],
) -> dict:
    """Create or update chat-level document."""
    try:
        async with VectorStore() as vs:
            doc = {
                "message_id": None,  # Chat-level document
                "chat_id": chat_id,
                "user_id": user_id,
                "workspace_id": workspace_id,
                "is_project_chat": is_project_chat or False,
                "is_deleted": False,
                "title": title or "",
                "content": "",  # Chat-level documents don't have content
                "created_at": chat_created_at,
                "updated_at": chat_updated_at,
                "user_type": None,
            }

            # Remove None values
            doc = {k: v for k, v in doc.items() if v is not None}
            doc_id = f"chat_{chat_id}"

            response = await vs.async_os.index(index=CHAT_SEARCH_INDEX, id=doc_id, body=doc, refresh=True)

            return {
                "status": "success",
                "message": "Successfully upserted chat document",
                "doc_id": doc_id,
                "operation": response.get("result", "unknown"),
            }
    except Exception as e:
        log.error(f"Error upserting chat {chat_id}: {e}")
        return {"status": "error", "message": str(e)}


async def upsert_message_document(
    chat_id: str,
    message_id: str,
    content: Optional[str],
    user_type: Optional[str],
    message_created_at: Optional[str],
    message_updated_at: Optional[str],
) -> dict:
    """Create or update message document."""
    try:
        async with VectorStore() as vs:
            # Get chat context for this message
            chat_info = await get_chat_context_from_search(vs, chat_id)

            doc = {
                "message_id": message_id,
                "chat_id": chat_id,
                "user_id": chat_info.get("user_id"),
                "workspace_id": chat_info.get("workspace_id"),
                "is_project_chat": chat_info.get("is_project_chat", False),
                "is_deleted": False,
                "title": chat_info.get("title", ""),
                "content": content or "",
                "created_at": message_created_at,
                "updated_at": message_updated_at,
                "user_type": user_type,
            }

            # Remove None values
            doc = {k: v for k, v in doc.items() if v is not None}

            response = await vs.async_os.index(index=CHAT_SEARCH_INDEX, id=message_id, body=doc, refresh=True)

            log.debug(f"Upserted message document: {message_id} for chat: {chat_id}")

            return {
                "status": "success",
                "message": "Successfully upserted message document",
                "doc_id": message_id,
                "operation": response.get("result", "unknown"),
            }
    except Exception as e:
        log.error(f"Error upserting message {message_id}: {e}")
        return {"status": "error", "message": str(e)}


async def update_chat_title_all_documents(chat_id: str, new_title: str) -> dict:
    """Update title for all documents (chat + messages) in this chat."""
    try:
        async with VectorStore() as vs:
            update_body = {
                "script": {"source": "ctx._source.title = params.new_title", "params": {"new_title": new_title}},
                "query": {"term": {"chat_id": chat_id}},
            }

            response = await vs.async_os.update_by_query(index=CHAT_SEARCH_INDEX, body=update_body, conflicts="proceed")

            updated_count = response.get("updated", 0)
            log.info(f"Updated title for {updated_count} documents for chat_id: {chat_id}")

            return {"status": "success", "message": f"Successfully updated title for {updated_count} documents", "updated_count": updated_count}
    except Exception as e:
        log.error(f"Error updating title for chat {chat_id}: {e}")
        return {"status": "error", "message": str(e)}


async def get_chat_context_from_search(vs: VectorStore, chat_id: str) -> dict:
    """Get chat context from existing chat document in search index."""
    try:
        response = await vs.async_os.get(index=CHAT_SEARCH_INDEX, id=f"chat_{chat_id}", ignore=[404])

        if response.get("found"):
            return response["_source"]
        else:
            # Fallback to database (sync function, but safe to call from async)
            return get_chat_context_from_db(chat_id)
    except Exception:
        return get_chat_context_from_db(chat_id)


def get_chat_context_from_db(chat_id: str) -> dict:
    """Get chat context directly from database using sync session."""
    try:
        from pi.celery_app import db_session

        with db_session() as session:
            stmt = select(Chat).where(Chat.id == UUID(chat_id))  # type: ignore[union-attr,arg-type]
            result = session.exec(stmt)
            chat = result.scalar_one_or_none()

            if chat:
                return {
                    "user_id": str(chat.user_id),
                    "workspace_id": str(chat.workspace_id) if chat.workspace_id else None,
                    "is_project_chat": chat.is_project_chat or False,
                    "title": chat.title or "",
                }
    except Exception as e:
        log.debug(f"Failed to get chat context from DB for {chat_id}: {e}")

    return {}


# ===== CELERY FUNCTIONS =====


def process_chat_and_messages_from_token(token_id: str) -> dict:
    """
    Process chat and messages from token_id for Celery tasks.

    Args:
        token_id: The query message ID (token)

    Returns:
        Dict with processing results
    """
    import asyncio

    from pi.celery_app import db_session

    try:
        with db_session() as session:
            # Get the user message (query) using token_id
            query_stmt = select(Message).where(Message.id == UUID(token_id))  # type: ignore[union-attr,arg-type]
            query_result = session.exec(query_stmt)
            query_message = query_result.scalar_one_or_none()

            if not query_message:
                return {"status": "error", "message": "Query message not found"}

            chat_id = str(query_message.chat_id)
            query_sequence = query_message.sequence

            # Get chat details
            chat_stmt = select(Chat).where(Chat.id == query_message.chat_id)
            chat_result = session.exec(chat_stmt)
            chat = chat_result.scalar_one_or_none()

            if not chat:
                return {"status": "error", "message": "Chat not found"}

            results = {"status": "success", "chat_id": chat_id, "query_id": token_id}

            # Process documents using async functions (run in sync context)
            async def _process_documents():
                # Process chat document if it's a new chat (sequence = 1)
                if query_sequence == 1:
                    await upsert_chat_document(
                        chat_id=chat_id,
                        user_id=str(chat.user_id),
                        workspace_id=str(chat.workspace_id) if chat.workspace_id else None,
                        title=chat.title or "",
                        is_project_chat=chat.is_project_chat or False,
                        chat_created_at=chat.created_at.isoformat() if chat.created_at else None,
                        chat_updated_at=chat.updated_at.isoformat() if chat.updated_at else None,
                    )
                    results["upserted_chat"] = "true"
                    log.info(f"Upserted chat document for new chat: {chat_id}")

                # Process user message (query)
                query_content = query_message.parsed_content or query_message.content or ""
                await upsert_message_document(
                    chat_id=chat_id,
                    message_id=token_id,
                    content=query_content,
                    user_type=query_message.user_type,
                    message_created_at=query_message.created_at.isoformat() if query_message.created_at else None,
                    message_updated_at=query_message.updated_at.isoformat() if query_message.updated_at else None,
                )

                # Get assistant message (response) - should be sequence + 1
                assistant_stmt = select(Message).where(
                    and_(Message.chat_id == query_message.chat_id, Message.sequence == query_sequence + 1, Message.user_type == "assistant")  # type: ignore[union-attr,arg-type]
                )
                assistant_result = session.exec(assistant_stmt)
                assistant_message = assistant_result.scalar_one_or_none()

                if assistant_message:
                    # Process assistant message (response)
                    await upsert_message_document(
                        chat_id=chat_id,
                        message_id=str(assistant_message.id),
                        content=assistant_message.content or "",
                        user_type=assistant_message.user_type,
                        message_created_at=assistant_message.created_at.isoformat() if assistant_message.created_at else None,
                        message_updated_at=assistant_message.updated_at.isoformat() if assistant_message.updated_at else None,
                    )
                    results["upserted_messages"] = "2"
                    log.debug(f"Upserted assistant message: {assistant_message.id}")
                else:
                    results["upserted_messages"] = "1"
                    log.warning(f"Assistant message not found for chat_id: {chat_id}, sequence: {query_sequence + 1}")

            # Run async operations
            asyncio.run(_process_documents())
            return results

    except Exception as e:
        log.error(f"Error in process_chat_and_messages_from_token for token_id {token_id}: {e}")
        return {"status": "error", "message": str(e)}


def update_chat_title_and_propagate(chat_id: str, title: str) -> dict:
    """
    Update chat title and propagate to all messages for Celery tasks.

    Args:
        chat_id: The chat ID to update
        title: The new title

    Returns:
        Dict with processing results
    """
    import asyncio

    try:
        # Use the efficient update_by_query to update all documents at once
        result = asyncio.run(update_chat_title_all_documents(chat_id, title))

        if result["status"] == "success":
            log.info(f"Updated title for {result.get('updated_count', 0)} documents for chat {chat_id}")

        return result

    except Exception as e:
        log.error(f"Error in update_chat_title_and_propagate for chat_id {chat_id}: {e}")
        return {"status": "error", "message": str(e)}


async def bulk_populate_chat_and_messages(chat_obj, messages_list: List) -> dict:
    """
    Optimized bulk population function for populating existing chats and messages.

    Args:
        chat_obj: Chat database object
        messages_list: List of Message database objects for this chat

    Returns:
        Dict with processing results
    """
    try:
        chat_id = str(chat_obj.id)

        # Process chat document
        chat_result = await upsert_chat_document(
            chat_id=chat_id,
            user_id=str(chat_obj.user_id),
            workspace_id=str(chat_obj.workspace_id) if chat_obj.workspace_id else None,
            title=chat_obj.title or "",
            is_project_chat=chat_obj.is_project_chat or False,
            chat_created_at=chat_obj.created_at.isoformat() if chat_obj.created_at else None,
            chat_updated_at=chat_obj.updated_at.isoformat() if chat_obj.updated_at else None,
        )

        if chat_result["status"] != "success":
            return {"status": "error", "message": f"Failed to index chat: {chat_result.get('message')}"}

        # Process all messages for this chat
        processed_messages = 0
        failed_messages = 0

        for message in messages_list:
            try:
                # Determine content to index based on user_type
                content_to_index = ""
                if message.user_type == "user":
                    # For user messages, prefer parsed_content, fallback to content
                    content_to_index = message.parsed_content or message.content or ""
                else:
                    # For assistant and other messages, use content
                    content_to_index = message.content or ""

                message_result = await upsert_message_document(
                    chat_id=chat_id,
                    message_id=str(message.id),
                    content=content_to_index,
                    user_type=message.user_type,
                    message_created_at=message.created_at.isoformat() if message.created_at else None,
                    message_updated_at=message.updated_at.isoformat() if message.updated_at else None,
                )

                if message_result["status"] == "success":
                    processed_messages += 1
                else:
                    failed_messages += 1
                    log.warning(f"Failed to index message {message.id}: {message_result.get('message')}")

            except Exception as e:
                failed_messages += 1
                log.error(f"Error indexing message {message.id} for chat {chat_id}: {e}")

        return {
            "status": "success",
            "chat_id": chat_id,
            "processed_messages": processed_messages,
            "failed_messages": failed_messages,
            "total_messages": len(messages_list),
        }

    except Exception as e:
        log.error(f"Error in bulk_populate_chat_and_messages for chat {chat_obj.id}: {e}")
        return {"status": "error", "message": str(e)}
