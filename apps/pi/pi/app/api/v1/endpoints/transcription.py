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

"""Simple transcription endpoint."""

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import UploadFile
from fastapi.responses import JSONResponse
from pydantic import UUID4
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.api.dependencies import check_guest_access
from pi.app.api.dependencies import get_current_user
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.services.transcription.transcribe import process_transcription

log = logger.getChild(__name__)
router = APIRouter()


@router.post("/transcribe")
async def transcribe_file(
    workspace_id: UUID4,
    chat_id: UUID4,
    file: UploadFile,
    db: AsyncSession = Depends(get_async_session),
    current_user=Depends(get_current_user),
):
    """Transcribe audio file."""
    guest_check = await check_guest_access(str(current_user.id), str(workspace_id))
    if guest_check:
        return guest_check
    try:
        user_id = current_user.id
        success, message = await process_transcription(workspace_id, chat_id, file, user_id, db)
        if success:
            return JSONResponse(status_code=200, content={"detail": message})
        else:
            return JSONResponse(status_code=500, content={"detail": message})

    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Transcription failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
