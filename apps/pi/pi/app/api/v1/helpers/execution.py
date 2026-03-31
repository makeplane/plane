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

from typing import Optional

from pydantic import UUID4
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.api.v1.helpers.message import _get_message
from pi.services.retrievers.pg_store.model import normalize_model_for_display

log = logger.getChild(__name__)


async def chosen_llm(db: AsyncSession, message_id: UUID4) -> Optional[str]:
    """
    Retrieve the LLM model chosen for a specific message.

    Args:
        db: Database session
        message_id: UUID of the message to retrieve the LLM model from

    Returns:
        The LLM model string if found, None otherwise
    """
    message = await _get_message(db=db, message_id=message_id)
    if message:
        normalized_model = normalize_model_for_display(message.llm_model)
        log.info(f"Chosen LLM model for message {message_id}: {message.llm_model} -> {normalized_model}")
        return normalized_model

    log.warning(f"No LLM model found for message {message_id}. Will use GPT-4.1 asdefault model.")
    return None
