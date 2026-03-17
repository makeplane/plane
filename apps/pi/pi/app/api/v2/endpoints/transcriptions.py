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

"""Audio transcription endpoint for converting speech to text."""

from fastapi import APIRouter
from fastapi import Depends
from fastapi import File
from fastapi import Form
from fastapi import HTTPException
from fastapi import UploadFile
from fastapi.responses import JSONResponse
from pydantic import UUID4
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.api.dependencies import get_current_user
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.services.transcription.transcribe import process_transcription

log = logger.getChild("v2.transcriptions")
router = APIRouter()


@router.post("/", status_code=201)
async def create_transcription(
    workspace_id: UUID4 = Form(..., description="UUID of the workspace"),
    chat_id: UUID4 = Form(..., description="UUID of the chat conversation"),
    file: UploadFile = File(..., description="Audio file to transcribe"),
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """
    Create a new transcription from an audio file.

    This endpoint accepts audio files and converts speech to text using AI
    transcription services. The transcribed text is associated with the specified
    chat conversation and can be used for voice input, meeting notes, or accessibility.

    The transcription process:
    1. Validates and uploads the audio file
    2. Sends to transcription service (e.g., Whisper, Google Speech-to-Text)
    3. Returns the transcribed text
    4. Associates transcription with the chat

    Supported audio formats typically include:
    - MP3, WAV, M4A, FLAC, OGG
    - Maximum file size limits apply (check service configuration)

    Args:
        workspace_id: UUID of the workspace (form data)
        chat_id: UUID of the chat conversation (form data)
        file: Audio file upload (multipart/form-data)
        db: Database session (injected)
        session: Session cookie for authentication (injected)

    Returns:
        JSON response with:
        - detail: Success message or transcription result
        - transcription: The transcribed text (if successful)
        - metadata: Additional info (duration, language, etc.)

    Status Codes:
        - 201: Transcription created successfully
        - 400: Invalid file format or missing parameters
        - 401: Invalid or missing authentication
        - 413: File too large
        - 415: Unsupported media type
        - 500: Transcription service error

    Example Request (using curl):
        curl -X POST http://localhost:8001/api/v2/transcriptions/ \
          -H "Cookie: plane-session=<token>" \
          -F "workspace_id=123e4567-e89b-12d3-a456-426614174000" \
          -F "chat_id=987fcdeb-51a2-43f7-b456-123456789abc" \
          -F "file=@recording.mp3"

    Example Response:
        {
            "detail": "Transcription completed successfully",
            "transcription": "Hello, this is a test recording...",
            "metadata": {
                "duration": 45.2,
                "language": "en-US",
                "confidence": 0.95
            }
        }

    Example Request (using JavaScript/FormData):
        const formData = new FormData();
        formData.append('workspace_id', 'abc-123');
        formData.append('chat_id', 'xyz-789');
        formData.append('file', audioFile);

        const response = await fetch('/api/v2/transcriptions/', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

    Notes:
        - File size limits are enforced by the transcription service
        - Longer audio files may take more time to process
        - Transcription accuracy depends on audio quality and language
        - Some audio formats may be automatically converted
        - The transcription is stored and associated with the chat
        - User must have access to the specified workspace and chat
        - Deprecated V1 endpoint: POST /api/v1/transcription/transcribe

    Use Cases:
        - Voice-to-text input for chat messages
        - Meeting transcription and notes
        - Accessibility features for hearing-impaired users
        - Voice commands and dictation
        - Automatic caption generation
    """
    user_id = current_user.id

    # Validate file upload
    if not file:
        return JSONResponse(
            status_code=400,
            content={"detail": "No audio file provided"},
        )

    # Log transcription request
    log.debug(f"Transcription request: workspace={workspace_id}, chat={chat_id}, " f"file={file.filename}, user={user_id}")

    try:
        success, message = await process_transcription(
            workspace_id=workspace_id,
            chat_id=chat_id,
            file=file,
            user_id=user_id,
            db=db,
        )

        if success:
            return JSONResponse(
                status_code=201,
                content={
                    "detail": message,
                    "status": "completed",
                },
            )
        else:
            # Process transcription failed - return appropriate error
            log.error(f"Transcription failed: {message}")
            return JSONResponse(
                status_code=500,
                content={
                    "detail": message,
                    "status": "failed",
                },
            )

    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Transcription failed with exception: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Transcription service error: {str(e)}",
        )
