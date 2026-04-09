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

# pi/app/api/v1/endpoints/mobile/feedback.py
"""Mobile endpoints for AI feature feedback.

Mirrors ``/api/v1/feedback`` with JWT (Bearer) authentication for mobile
clients. Uses the same ``create_feedback`` service as the web layer.
"""

from fastapi import APIRouter
from fastapi import Depends
from fastapi.responses import JSONResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.api.dependencies import get_current_mobile_user
from pi.app.schemas.auth import User
from pi.app.schemas.chat import AIFeatureFeedback
from pi.core.db.plane_pi.lifecycle import get_async_session
from pi.services.retrievers.pg_store.feedback import create_feedback

log = logger.getChild("v1/mobile/feedback")
mobile_router = APIRouter()


@mobile_router.post("/{usage_type}/")
async def create_ai_feature_feedback(
    usage_type: str,
    feedback_data: AIFeatureFeedback,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_mobile_user),
):
    """
    Create feedback for AI-powered features (ai_block, floaty_ai, ask_ai, etc.).

    Authenticated via ``Authorization: Bearer <jwt>`` (mobile), not session cookies.

    Args:
        usage_type: Type of AI feature from URL path ('ai_block', 'summarize', etc.)
        feedback_data: Payload with usage_id, entity_type, entity_id, feedback, etc.
        db: Database session
        current_user: Authenticated user from JWT

    Returns:
        JSONResponse; 200 on success, 401 if auth fails, 500 on server error.
    """
    result = await create_feedback(
        db=db,
        usage_type=usage_type,
        usage_id=feedback_data.usage_id,
        entity_type=feedback_data.entity_type,
        entity_id=feedback_data.entity_id,
        feedback_value=feedback_data.feedback.value,
        feedback_message=feedback_data.feedback_message,
        user_id=current_user.id,
        workspace_id=feedback_data.workspace_id,
    )

    # The create_feedback function returns a tuple of (status_code, content)
    status_code, content = result
    return JSONResponse(status_code=status_code, content=content)
