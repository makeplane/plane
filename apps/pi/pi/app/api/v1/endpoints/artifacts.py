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

"""Action artifacts endpoint."""

from typing import Any
from typing import Dict
from typing import List
from uuid import UUID

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from pydantic import UUID4

from pi import logger
from pi.app.api.dependencies import get_current_user
from pi.app.schemas.artifact import ArtifactUpdateRequest
from pi.app.schemas.artifact import ArtifactUpdateResponse
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.services.actions.artifacts.utils import batch_prepare_artifact_response_data
from pi.services.actions.prompt_followup import handle_artifact_prompt_followup
from pi.services.retrievers.pg_store.action_artifact import get_action_artifacts_by_chat_id
from pi.services.retrievers.pg_store.action_artifact import get_action_artifacts_by_ids

log = logger.getChild(__name__)
router = APIRouter()


@router.get("/")
async def get_action_artifacts(artifact_ids: List[UUID4], current_user=Depends(get_current_user), db=Depends(get_async_session)):
    """
    Retrieve action artifacts by their IDs.
    """
    try:
        # Get the action artifacts
        artifacts = await get_action_artifacts_by_ids(db, artifact_ids)

        # Group artifacts by chat_id to find latest in each chat
        artifacts_by_chat: Dict[Any, Any] = {}
        for artifact in artifacts:
            chat_id = str(artifact.chat_id)
            if chat_id not in artifacts_by_chat:
                artifacts_by_chat[chat_id] = []
            artifacts_by_chat[chat_id].append(artifact)

        # Find actual latest message_id in each chat (batch query for performance)
        from pi.services.retrievers.pg_store.message import get_latest_message_ids_for_chats

        chat_uuids = [UUID(chat_id) for chat_id in artifacts_by_chat.keys()]
        latest_message_ids = await get_latest_message_ids_for_chats(db, chat_uuids)

        # Use batch preparation
        artifacts_data = await batch_prepare_artifact_response_data(db, artifacts, latest_message_ids)

        return JSONResponse(status_code=200, content={"success": True, "artifacts": artifacts_data})

    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Get action artifacts failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/{chat_id}/")
async def get_chat_artifacts(chat_id: UUID4, current_user=Depends(get_current_user), db=Depends(get_async_session)):
    """
    Retrieve all action artifacts for a specific chat.
    """

    try:
        # Get the action artifacts for the chat
        artifacts = await get_action_artifacts_by_chat_id(db, chat_id)

        # Find the actual latest message_id in the chat (not just latest with artifacts)
        from pi.services.retrievers.pg_store.message import get_latest_message_id_for_chat

        latest_message_id = await get_latest_message_id_for_chat(db, chat_id)

        # Create latest_message_ids dict for batch processing
        latest_message_ids = {str(chat_id): latest_message_id}

        # Use batch preparation
        artifacts_data = await batch_prepare_artifact_response_data(db, artifacts, latest_message_ids)

        return JSONResponse(status_code=200, content={"success": True, "artifacts": artifacts_data})

    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Get chat artifacts failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{artifact_id}/followup/", response_model=ArtifactUpdateResponse)
async def update_artifact_with_prompt(request: ArtifactUpdateRequest, current_user=Depends(get_current_user), db=Depends(get_async_session)):
    try:
        user_id = current_user.id

        result = await handle_artifact_prompt_followup(
            db=db,
            artifact_id=request.artifact_id,
            current_query=request.query,
            workspace_id=request.workspace_id,
            chat_id=request.chat_id,
            user_id=str(user_id),
            project_id=request.project_id,
            entity_type=request.entity_type,
            current_artifact_data=request.current_artifact_data,
            user_message_id=request.user_message_id,
        )

        # Check if the operation was successful and return appropriate status code
        if result.get("success", False):
            return JSONResponse(status_code=200, content=result)
        else:
            # If success=False, return 422 (Unprocessable Entity) for business logic errors
            return JSONResponse(status_code=422, content=result)

    except HTTPException:
        # Re-raise HTTP exceptions (like 401) as-is
        raise
    except Exception as e:
        log.error(f"Artifact update failed: {str(e)}")
        # Return 500 for unexpected server errors
        raise HTTPException(status_code=500, detail=str(e))
