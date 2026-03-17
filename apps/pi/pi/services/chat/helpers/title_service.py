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

"""Chat title generation service."""

from typing import List

from pydantic import UUID4
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.api.v1.helpers import _get_chat
from pi.app.models import Message

log = logger.getChild(__name__)


async def generate_title(chatbot_instance, chat_id: UUID4, chat_history: List[str], db: AsyncSession) -> str:
    """Generate a title for a chat using the first question-answer pair and update it in the database."""
    title = await chatbot_instance.title_generation(chat_history)

    try:
        # Get chat using helper function - no user_id needed since this is an internal operation
        chat = await _get_chat(chat_id=chat_id, db=db)
        if chat:
            chat.title = title
            db.add(chat)
            await db.commit()
    except Exception as e:
        log.warning(f"Failed to update title for chat_id: {chat_id} - {str(e)}")

    return title


async def set_chat_title_directly(chat_id: UUID4, title: str, db: AsyncSession) -> None:
    """Set a chat title directly without LLM generation."""
    try:
        # Get chat using helper function - no user_id needed since this is an internal operation
        chat = await _get_chat(chat_id=chat_id, db=db)
        if chat:
            chat.title = title
            db.add(chat)
            await db.commit()
    except Exception as e:
        log.warning(f"Failed to update title for chat_id: {chat_id} - {str(e)}")


async def get_title(chatbot_instance, chat_id: UUID4, messages: List[Message], db: AsyncSession) -> str:
    """Get or generate a title for a chat."""
    if not messages:
        return ""

    # Get first question and answer
    first_question = next((m.content for m in messages if m.sequence == 1), None)
    first_answer = next((m.content for m in messages if m.sequence == 2), None)

    if not first_question or not first_answer:
        return ""

    # Get chat to check existing title
    try:
        chat = await _get_chat(chat_id=chat_id, db=db)
        if chat:
            existing_title = chat.title or ""

            # Generate new title if:
            # 1. No existing title (empty string), OR
            # 2. Current title matches first question (placeholder title)
            if not existing_title or existing_title == first_question:
                # log.info(f"ChatID: {chat_id} - Generating a title for the chat")
                title = await generate_title(chatbot_instance, chat_id, [first_question, first_answer], db)
            else:
                log.debug(f"ChatID: {chat_id} - A unique title already exists for the chat")
                title = existing_title

            return title
        return ""
    except Exception as e:
        log.error(f"Error getting chat title: {str(e)}")
        return ""
