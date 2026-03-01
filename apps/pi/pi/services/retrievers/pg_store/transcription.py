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

import uuid

from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.models.transcription import Transcription

log = logger.getChild(__name__)


async def create_transcription(
    transcription_text: str,
    transcription_id: str,
    audio_duration: float,
    speech_model: str,
    processing_time: float,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
    chat_id: uuid.UUID,
    db: AsyncSession,
    provider: str,
    cost: float,
):
    """Create a transcription record in the database.

    Args:
        transcription_text: The transcribed text
        transcription_id: Provider-specific transcription ID
        audio_duration: Duration in seconds
        speech_model: Model used for transcription
        processing_time: Time taken to process
        user_id: UUID of the user
        workspace_id: UUID of the workspace
        chat_id: UUID of the chat
        db: Database session
        provider: Transcription provider name
        cost: Pre-calculated cost in USD

    Returns:
        Tuple of (success: bool, message: str)
    """
    try:
        new_transcription = Transcription(
            transcription_text=transcription_text,
            transcription_id=transcription_id,
            audio_duration=int(audio_duration),  # Keep as int for database compatibility
            speech_model=speech_model,
            processing_time=processing_time,
            user_id=user_id,
            workspace_id=workspace_id,
            chat_id=chat_id,
            transcription_cost_usd=cost,
        )
        db.add(new_transcription)
        await db.commit()
        await db.refresh(new_transcription)

        log.info(f"Transcription saved: {new_transcription.id} (provider: {provider}, model: {speech_model})")
        return True, "Transcription created successfully"
    except Exception as e:
        await db.rollback()
        log.error(f"Error creating transcription: {e}")
        raise e
