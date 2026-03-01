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

"""Chat context initialization and history management."""

from typing import Literal
from typing import Optional
from typing import cast

from pi import logger

log = logger.getChild(__name__)


async def initialize_chat_context(chatbot_instance, data, chat_exists, db):
    """Initialize chat context and history based on whether this is a new chat."""
    # Import here to avoid circular dependency
    from pi.services.retrievers.pg_store.chat import upsert_chat
    from pi.services.retrievers.pg_store.chat import upsert_user_chat_preference

    chat_id = data.chat_id
    user_id = data.user_id
    is_new = data.is_new
    is_project_chat = data.is_project_chat or False

    # Note: Workspace resolution is now handled in queue_answer endpoint
    # This backward compatibility code no longer does workspace resolution

    is_focus_enabled = data.workspace_in_context
    is_websearch_enabled = bool(getattr(data, "is_websearch_enabled", False))

    # Use new polymorphic fields if available, otherwise fall back to legacy fields
    focus_entity_type = getattr(data, "focus_entity_type", None)
    focus_entity_id = getattr(data, "focus_entity_id", None)
    focus_project_id = data.project_id or None
    focus_workspace_id = data.workspace_id or None
    mode_raw = getattr(data, "mode", "ask") or "ask"
    # Ensure mode is one of the valid literal values
    mode: Optional[Literal["ask", "build"]] = cast(Literal["ask", "build"], mode_raw if mode_raw in ("ask", "build") else "ask")

    if is_new:
        # For new chats, the chat record should already exist from initialize-chat endpoint
        # but if not, create it (backward compatibility)
        if not chat_exists:
            chat_result = await upsert_chat(
                chat_id=chat_id,
                user_id=user_id,
                title="",
                description="",
                db=db,
                workspace_id=None,  # Will be backfilled in queue_answer
                workspace_slug=None,  # Will be backfilled in queue_answer
                is_project_chat=is_project_chat,
                workspace_in_context=data.workspace_in_context,
                is_websearch_enabled=is_websearch_enabled,
            )
            if chat_result["message"] != "success":
                return None, "An unexpected error occurred. Please try again"
            log.info(f"ChatID: {chat_id} - Created new chat record")

    # Create user chat preference
    try:
        user_chat_preference_result = await upsert_user_chat_preference(
            user_id=user_id,
            chat_id=chat_id,
            db=db,
            is_focus_enabled=is_focus_enabled,
            is_websearch_enabled=is_websearch_enabled,
            focus_entity_type=focus_entity_type,
            focus_entity_id=focus_entity_id,
            focus_project_id=focus_project_id,
            focus_workspace_id=focus_workspace_id,
            mode=mode,
        )
        if user_chat_preference_result["message"] != "success":
            return None, "An unexpected error occurred. Please try again"
    except Exception as e:
        log.error(f"Error upserting user chat preference: {e}")
        return None, "An unexpected error occurred. Please try again"

    if is_new:
        return [], None
    else:
        res = await chatbot_instance.retrieve_chat_history(chat_id=chat_id, db=db)
        # log.info(f"ChatID: {chat_id} - Retrieved chat history: {res}")
        from pi.services.chat.utils import process_conv_history

        return await process_conv_history(res["dialogue"], db, chat_id, user_id), None
